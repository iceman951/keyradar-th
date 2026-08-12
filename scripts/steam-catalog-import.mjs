#!/usr/bin/env node
/**
 * Bulk-generates `Game` entries for `shared/seed/catalog.ts` from SteamSpy's
 * free "top 100 forever" list (real all-time popularity ranking, no key, no
 * scraping) cross-checked against Steam's own free `appdetails`/`appreviews`
 * endpoints for every fact that actually gets displayed (title, developer,
 * publisher, genres, THB price, review score, release date).
 *
 * SteamSpy only supplies which appids to look at — every field written to
 * the catalog comes from Steam's own API, not SteamSpy's community estimate.
 *
 * Unlike the hand-curated additions this replaces, there is no per-game
 * fact-check against outside knowledge at this volume: entries are dropped
 * outright if Steam's data looks internally inconsistent (a literal "?" in a
 * developer/publisher field, an unparseable release date, or no genres left
 * after mapping) — dropping is safer than guessing. Only genres with a
 * direct, unambiguous mapping to the catalog's existing Thai vocabulary are
 * kept; anything free-to-play or not sold in Thailand is silently dropped.
 *
 *   node scripts/steam-catalog-import.mjs > /tmp/new-games.ts
 */
import { games as existingGames } from '../shared/seed/catalog.ts'

const REQUEST_DELAY_MS = 350

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const normalizeTitle = (title) => title.toLowerCase().replace(/[^a-z0-9]+/g, '')

const existingTitles = new Set(
  existingGames.map((game) => normalizeTitle(game.title))
)

const fetchJson = async (url) => {
  const response = await fetch(url, {
    headers: { 'user-agent': 'keyradar-th-catalog-research/1.0' }
  })
  if (!response.ok)
    throw new Error(`${response.status} ${response.statusText} for ${url}`)
  return response.json()
}

const fetchTopSpy = async () => {
  const data = await fetchJson(
    'https://steamspy.com/api.php?request=top100forever'
  )
  return Object.values(data)
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

const GENRE_MAP = {
  Action: 'แอ็กชัน',
  Adventure: 'ผจญภัย',
  RPG: 'สวมบทบาท',
  Indie: 'อินดี้',
  Simulation: 'จำลอง',
  Strategy: 'วางแผน'
}

const THAI_MONTHS = [
  'ม.ค.',
  'ก.พ.',
  'มี.ค.',
  'เม.ย.',
  'พ.ค.',
  'มิ.ย.',
  'ก.ค.',
  'ส.ค.',
  'ก.ย.',
  'ต.ค.',
  'พ.ย.',
  'ธ.ค.'
]

/** Steam's `release_date.date` is `dd Mon, yyyy` in Gregorian. Converts to
 * the catalog's `d เดือน. พศ.` (Buddhist era) convention. Returns null if the
 * format doesn't parse — the caller drops the candidate rather than guess. */
const toBuddhistDate = (steamDate) => {
  const match = /^(\d{1,2}) (\w{3}),? (\d{4})$/.exec(steamDate ?? '')
  if (!match) return null
  const [, day, monEn, yearStr] = match
  const monthIndex = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec'
  ].indexOf(monEn)
  if (monthIndex === -1) return null
  const buddhistYear = Number(yearStr) + 543
  return {
    text: `${Number(day)} ${THAI_MONTHS[monthIndex]} ${buddhistYear}`,
    year: Number(yearStr)
  }
}

const hash = (text) => {
  let value = 2166136261
  for (const char of text)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619)
  return value >>> 0
}

const hueFor = (slug) => hash(slug) % 360

const popularityFor = (reviewCount) => {
  const scaled = 40 + 32 * (Math.log10(Math.max(reviewCount, 100)) - 4.3)
  return Math.max(30, Math.min(99, Math.round(scaled)))
}

const slugify = (title) =>
  title
    .toLowerCase()
    .replace(/[®™]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')

const looksCorrupted = (value) =>
  typeof value === 'string' && value.includes('?')

const buildGame = async (candidate) => {
  await sleep(REQUEST_DELAY_MS)
  const details = await fetchAppDetails(candidate.appid).catch(() => null)
  if (!details || details.type !== 'game') return null
  if (existingTitles.has(normalizeTitle(details.name))) return null
  if (!details.price_overview) return null // free-to-play or not sold in Thailand

  const developer = details.developers?.[0]
  const publisher = details.publishers?.[0]
  if (
    !developer ||
    !publisher ||
    looksCorrupted(developer) ||
    looksCorrupted(publisher)
  )
    return null

  const released = toBuddhistDate(details.release_date?.date)
  if (!released) return null

  const genres = (details.genres ?? [])
    .map((genre) => GENRE_MAP[genre.description])
    .filter((label, index, all) => label && all.indexOf(label) === index)
  if (genres.length === 0) return null

  await sleep(REQUEST_DELAY_MS)
  const reviews = await fetchReviewSummary(candidate.appid).catch(() => null)
  if (!reviews || reviews.total_reviews <= 0) return null

  const slug = slugify(details.name)
  const title = details.name.replace(/[®™]/g, '').trim()
  const bahtPrice = Math.round(details.price_overview.initial / 100)

  return {
    slug,
    title,
    year: released.year,
    developer,
    publisher,
    releaseDate: released.text,
    genres,
    reviewPercent: Math.round(
      (reviews.total_positive / reviews.total_reviews) * 100
    ),
    reviewCount: reviews.total_reviews,
    popularity: popularityFor(reviews.total_reviews),
    hue: hueFor(slug),
    priceBaht: bahtPrice
  }
}

const printEntry = (game) =>
  `  {
    slug: '${game.slug}',
    title: ${JSON.stringify(game.title)},
    year: ${game.year},
    developer: ${JSON.stringify(game.developer)},
    publisher: ${JSON.stringify(game.publisher)},
    releaseDate: '${game.releaseDate}',
    genres: [${game.genres.map((g) => `'${g}'`).join(', ')}],
    reviewPercent: ${game.reviewPercent},
    reviewCount: ${game.reviewCount},
    popularity: ${game.popularity},
    hue: ${game.hue},
    editions: [edition('standard', 'Standard Edition', ${game.priceBaht})]
  }`

const main = async () => {
  console.error('Fetching SteamSpy top 100 forever...')
  const spyList = await fetchTopSpy()
  const paidCandidates = spyList.filter((entry) => entry.price !== '0')
  console.error(
    `  ${spyList.length} total, ${paidCandidates.length} not flagged free-to-play by SteamSpy`
  )

  const results = []
  const seenSlugs = new Set()
  for (const candidate of paidCandidates) {
    const game = await buildGame(candidate).catch((error) => {
      console.error(
        `  skip ${candidate.appid} (${candidate.name}): ${error.message}`
      )
      return null
    })
    if (!game) continue
    if (seenSlugs.has(game.slug)) continue
    seenSlugs.add(game.slug)
    results.push(game)
    console.error(`  + ${game.title}`)
  }

  console.error(`\n${results.length} new entries generated.\n`)
  console.log(results.map(printEntry).join(',\n'))
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
