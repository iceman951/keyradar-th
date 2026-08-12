import { games, stores } from '../src/lib/data/fixtures'
import { regionPresentation } from '../src/lib/domain/presentation'
import {
  buildCatalog,
  editionLookups,
  lookupKey
} from '../src/lib/itad/build-catalog'
import { crossRates } from '../src/lib/itad/fx'
import { appendHistory, historyKey, ictEpochDay } from '../src/lib/itad/history'
import {
  parseSteamPrices,
  steamPricesUrl,
  type SteamPrice
} from '../src/lib/itad/steam'
import {
  ID_CACHE_VERSION,
  type Catalog,
  type CatalogFx,
  type FrankfurterResponse,
  type HistoryStore,
  type IdCache,
  type ItadGamePrices,
  type ThbRates
} from '../src/lib/itad/types'
import { CATALOG_KEY, HISTORY_KEY, IDS_KEY } from './keys'

const ITAD_BASE = 'https://api.isthereanydeal.com'
const FX_URL =
  'https://api.frankfurter.dev/v1/latest?base=USD&symbols=THB,EUR,GBP,AUD,CAD,PLN,BRL,RUB'

/** A failed title lookup is retried only after this many days. */
const IDS_RETRY_DAYS = 7
/** Max price rows ITAD returns per game — we have ~11 allowlisted shops. */
const PRICE_CAPACITY = 20

export interface RefreshEnv {
  KV: KVNamespace
  ITAD_API_KEY?: string
}

export interface RefreshResult {
  ok: boolean
  reason?: string
  gameCount?: number
  offerCount?: number
  resolved?: number
  steamPriced?: number
  unresolved?: string[]
  failedStores?: string[]
  fxStale?: boolean
}

const log = (event: Record<string, unknown>): void =>
  console.log(JSON.stringify(event))

const readJson = async <T>(kv: KVNamespace, key: string): Promise<T | null> => {
  const text = await kv.get(key, 'text')
  if (!text) return null
  try {
    return JSON.parse(text) as T
  } catch {
    log({ evt: 'kv_parse_failed', key })
    return null
  }
}

const emptyIdCache = (): IdCache => ({
  version: ID_CACHE_VERSION,
  shopsFetchedAt: null,
  shops: {},
  titles: {}
})

/**
 * Resolve every edition to an ITAD game id — in ITAD an edition *is* a game, so
 * this is what makes each returned deal unambiguously belong to one edition.
 * Cached both ways: a `null` is remembered so a title that will never resolve is
 * not retried every eight hours forever.
 */
const resolveIds = async (
  cache: IdCache,
  titles: readonly string[],
  today: number
): Promise<{ cache: IdCache; requested: boolean }> => {
  const missing = titles.filter((title) => {
    const entry = cache.titles[title]
    if (!entry) return true
    if (entry.id) return false
    return today - entry.day >= IDS_RETRY_DAYS
  })

  if (missing.length === 0) return { cache, requested: false }

  const response = await fetch(`${ITAD_BASE}/lookup/id/title/v1`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(missing)
  })
  if (!response.ok) {
    log({ evt: 'lookup_failed', status: response.status })
    return { cache, requested: true }
  }

  const resolved = (await response.json()) as Record<string, string | null>
  const titlesOut = { ...cache.titles }
  for (const title of missing) {
    titlesOut[title] = { id: resolved[title] ?? null, day: today }
  }
  return { cache: { ...cache, titles: titlesOut }, requested: true }
}

const fetchPrices = async (
  apiKey: string,
  ids: readonly string[]
): Promise<Record<string, ItadGamePrices> | null> => {
  if (ids.length === 0) return {}

  const url = new URL(`${ITAD_BASE}/games/prices/v3`)
  url.searchParams.set('key', apiKey)
  url.searchParams.set('country', 'TH')
  url.searchParams.set('capacity', String(PRICE_CAPACITY))
  // Coupon-gated deals are real prices; the UI flags the code separately.
  url.searchParams.set('vouchers', 'true')
  // NB: `deals` defaults to false, which is what we want — a store sitting at
  // regular price must still appear, or Steam TH vanishes outside of sales.

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify(ids)
  })
  if (!response.ok) {
    log({
      evt: 'prices_failed',
      status: response.status,
      body: await response.text()
    })
    return null
  }

  const payload = (await response.json()) as ItadGamePrices[]
  const byId: Record<string, ItadGamePrices> = {}
  for (const entry of payload) byId[entry.id] = entry
  return byId
}

/**
 * Real Thai Steam prices. One batched request covers every app id; a failure
 * here is survivable, since `buildCatalog` falls back to the fixture value.
 */
const fetchSteamPrices = async (
  appIds: readonly number[]
): Promise<Record<number, SteamPrice>> => {
  if (appIds.length === 0) return {}
  try {
    const response = await fetch(steamPricesUrl(appIds))
    if (!response.ok) throw new Error(`Steam HTTP ${response.status}`)
    return parseSteamPrices(await response.json())
  } catch (error) {
    log({ evt: 'steam_failed', error: String(error) })
    return {}
  }
}

const fetchFx = async (previous: Catalog | null): Promise<CatalogFx> => {
  try {
    const response = await fetch(FX_URL)
    if (!response.ok) throw new Error(`FX HTTP ${response.status}`)
    const body = (await response.json()) as FrankfurterResponse
    return { date: body.date, rates: crossRates(body), stale: false }
  } catch (error) {
    log({ evt: 'fx_failed', error: String(error) })
    // Yesterday's rate beats a wrong one; with nothing to fall back on we keep
    // only THB-native prices rather than publishing invented conversions.
    if (previous?.fx?.rates) return { ...previous.fx, stale: true }
    return { date: 'unknown', rates: { THB: 1 } as ThbRates, stale: true }
  }
}

/** Cheapest offer per edition that we can actually confirm works in Thailand. */
const historySamples = (catalog: Catalog): Record<string, number> => {
  const samples: Record<string, number> = {}
  for (const [slug, game] of Object.entries(catalog.games)) {
    for (const [editionKey, edition] of Object.entries(game.editions)) {
      let best: number | null = null
      for (const offer of edition.offers) {
        if (regionPresentation(offer.region).status !== 'confirmed') continue
        if (best === null || offer.finalSatang < best) best = offer.finalSatang
      }
      if (best !== null) samples[historyKey(slug, editionKey)] = best
    }
  }
  return samples
}

export const refreshCatalog = async (
  env: RefreshEnv,
  at: number
): Promise<RefreshResult> => {
  if (!env.ITAD_API_KEY) {
    // Never let a misconfiguration overwrite a good catalog.
    log({ evt: 'cron_abort', reason: 'missing_api_key' })
    return { ok: false, reason: 'missing_api_key' }
  }

  const today = ictEpochDay(at)
  const lookups = editionLookups(games)
  const titles = [
    ...new Set(lookups.filter((l) => !l.itadId).map((l) => l.lookupTitle))
  ]

  const [cached, previous, history] = await Promise.all([
    readJson<IdCache>(env.KV, IDS_KEY),
    readJson<Catalog>(env.KV, CATALOG_KEY),
    readJson<HistoryStore>(env.KV, HISTORY_KEY)
  ])

  const { cache, requested } = await resolveIds(
    cached ?? emptyIdCache(),
    titles,
    today
  )

  const idByEdition: Record<string, string> = {}
  const unresolved: string[] = []
  for (const lookup of lookups) {
    const id = lookup.itadId ?? cache.titles[lookup.lookupTitle]?.id ?? null
    if (id) idByEdition[lookupKey(lookup.gameSlug, lookup.editionKey)] = id
    else unresolved.push(lookup.lookupTitle)
  }

  const ids = [...new Set(Object.values(idByEdition))]
  const prices = await fetchPrices(env.ITAD_API_KEY, ids)
  if (!prices) {
    // Leave the existing catalog in place: it ages into "stale" on its own,
    // which is honest, whereas republishing it would reset its timestamp.
    if (requested) await env.KV.put(IDS_KEY, JSON.stringify(cache))
    return { ok: false, reason: 'prices_unavailable' }
  }

  const steamAppIds = [
    ...new Set(
      games.flatMap((game) => [
        ...(game.steamAppId ? [game.steamAppId] : []),
        ...game.editions.flatMap((edition) =>
          edition.steamAppId ? [edition.steamAppId] : []
        )
      ])
    )
  ]

  const [fx, steamPrices] = await Promise.all([
    fetchFx(previous),
    fetchSteamPrices(steamAppIds)
  ])
  const fetchedAt = new Date(at).toISOString()
  const catalog = buildCatalog({
    games,
    stores,
    prices,
    idByEdition,
    steamPrices,
    rates: fx.rates,
    fx,
    fetchedAt,
    previous
  })

  const nextHistory = appendHistory(history, historySamples(catalog), at)

  await Promise.all([
    env.KV.put(CATALOG_KEY, JSON.stringify(catalog)),
    env.KV.put(HISTORY_KEY, JSON.stringify(nextHistory)),
    env.KV.put(IDS_KEY, JSON.stringify(cache))
  ])

  const offerCount = Object.values(catalog.games).reduce(
    (total, game) =>
      total +
      Object.values(game.editions).reduce((sum, e) => sum + e.offers.length, 0),
    0
  )

  const result: RefreshResult = {
    ok: true,
    gameCount: Object.keys(catalog.games).length,
    offerCount,
    resolved: ids.length,
    steamPriced: Object.keys(steamPrices).length,
    unresolved,
    failedStores: catalog.failedStores,
    fxStale: fx.stale
  }
  log({ evt: 'cron_ok', ...result })
  return result
}
