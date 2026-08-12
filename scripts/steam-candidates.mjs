#!/usr/bin/env node
/**
 * Prints a shortlist of Steam catalog candidates for manually adding to
 * `shared/seed/catalog.ts` — it does not write to the catalog itself.
 *
 * Pulls Thailand-region "top sellers", "new releases", and "specials" from
 * Steam's free, documented `featuredcategories` endpoint (no scraping, no API
 * key — all three lists come back in one response), then enriches each
 * candidate with genres/review score/THB price via `appdetails` and
 * `appreviews`, and drops anything already present in the catalog (by
 * normalized title) or not sold as a standalone game in Thailand.
 *
 * A single Steam list (e.g. just top sellers) tops out around 50 items, so
 * combining three lists is what makes a `--limit=100` request meaningful —
 * expect noticeably fewer than 100 rows once free-to-play, DLC, and
 * already-catalogued titles are filtered out.
 *
 *   node scripts/steam-candidates.mjs
 *   node scripts/steam-candidates.mjs --limit=100
 */
import { games } from '../shared/seed/catalog.ts'

const limitArg = process.argv.find((arg) => arg.startsWith('--limit='))
const LIMIT = limitArg ? Number(limitArg.split('=')[1]) : 20
const REQUEST_DELAY_MS = 350

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const normalizeTitle = (title) =>
  title.toLowerCase().replace(/[^a-z0-9฀-๿]+/g, '')

const existingTitles = new Set(games.map((game) => normalizeTitle(game.title)))

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: { 'user-agent': 'keyradar-th-catalog-research/1.0' }
  })
  if (!response.ok)
    throw new Error(`${response.status} ${response.statusText} for ${url}`)
  return response.json()
}

const CANDIDATE_LISTS = ['top_sellers', 'new_releases', 'specials']

const fetchCandidates = async () => {
  const data = await fetchJson(
    'https://store.steampowered.com/api/featuredcategories?cc=th&l=english'
  )
  const seen = new Map()
  for (const listName of CANDIDATE_LISTS) {
    for (const item of data[listName]?.items ?? []) {
      if (!seen.has(item.id)) seen.set(item.id, item)
    }
  }
  return [...seen.values()]
}

const fetchAppDetails = async (appid) => {
  const data = await fetchJson(
    `https://store.steampowered.com/api/appdetails?appids=${appid}&cc=th&l=english`
  )
  const entry = data[String(appid)]
  return entry?.success ? entry.data : null
}

const fetchReviewSummary = async (appid) => {
  const data = await fetchJson(
    `https://store.steampowered.com/appreviews/${appid}?json=1&language=all&purchase_type=all&num_per_page=0`
  )
  return data.query_summary ?? null
}

const formatBaht = (satang) =>
  typeof satang === 'number'
    ? `฿${(satang / 100).toLocaleString('th-TH')}`
    : 'n/a'

const main = async () => {
  console.log(
    `Fetching Thailand top sellers, new releases, and specials from Steam...`
  )
  const combined = await fetchCandidates()
  console.log(`  ${combined.length} unique candidates before filtering`)
  const candidates = combined.slice(0, LIMIT)

  const rows = []
  for (const candidate of candidates) {
    await sleep(REQUEST_DELAY_MS)
    let details
    try {
      details = await fetchAppDetails(candidate.id)
    } catch (error) {
      console.error(
        `  skip ${candidate.id} (${candidate.name}): appdetails failed — ${error.message}`
      )
      continue
    }
    if (!details || details.type !== 'game') continue
    if (existingTitles.has(normalizeTitle(details.name))) continue
    if (!details.price_overview) continue // free-to-play or no THB listing

    await sleep(REQUEST_DELAY_MS)
    let reviews = null
    try {
      reviews = await fetchReviewSummary(candidate.id)
    } catch {
      // Non-fatal — review data is a nice-to-have for the shortlist.
    }

    rows.push({
      appid: candidate.id,
      title: details.name,
      genres: (details.genres ?? [])
        .map((genre) => genre.description)
        .join(', '),
      reviewPercent:
        reviews && reviews.total_reviews > 0
          ? Math.round((reviews.total_positive / reviews.total_reviews) * 100)
          : null,
      reviewCount: reviews?.total_reviews ?? null,
      releaseDate: details.release_date?.date ?? 'n/a',
      priceSatang: details.price_overview.final
    })
  }

  if (rows.length === 0) {
    console.log(
      'No new candidates found (everything in top sellers is already in the catalog).'
    )
    return
  }

  console.log(
    `\n${rows.length} candidate(s) not yet in shared/seed/catalog.ts:\n`
  )
  console.table(
    rows.map((row) => ({
      appid: row.appid,
      title: row.title,
      genres: row.genres,
      review:
        row.reviewPercent !== null
          ? `${row.reviewPercent}% (${row.reviewCount})`
          : 'n/a',
      released: row.releaseDate,
      steamPriceTHB: formatBaht(row.priceSatang)
    }))
  )
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
