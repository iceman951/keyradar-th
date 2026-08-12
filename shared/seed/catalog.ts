/**
 * The deterministic KeyRadar catalog: the single source of truth for both
 * `MockGameRepository` and the Cloudflare D1 seed generator.
 *
 * Nothing here may import from `$lib`, SvelteKit, or Elysia — this module is
 * consumed by the browser bundle, the Worker bundle, and plain Node scripts.
 *
 * Money is integer satang throughout. Offer generation is seeded by
 * `${gameSlug}|${editionKey}`, so the same inputs always produce the same
 * offers, which is what makes the D1 seed reproducible.
 */
import type {
  Edition,
  EditionCategory,
  Game,
  Offer,
  OfferFee,
  RegionCode,
  RegionStatus,
  Store
} from '../domain/models.ts'
import { offerFeeTotal } from '../domain/pricing.ts'

const categoryForEdition = (key: string): EditionCategory => {
  switch (key) {
    case 'deluxe':
      return 'deluxe'
    case 'complete':
      return 'complete'
    case 'dlc':
      return 'dlc'
    case 'bundle':
      return 'bundle'
    default:
      return 'standard'
  }
}

const edition = (key: string, name: string, baht: number): Edition => ({
  key,
  name,
  category: categoryForEdition(key),
  steamPriceSatang: baht * 100
})

export const games: Game[] = [
  {
    slug: 'elden-ring',
    title: 'ELDEN RING',
    year: 2022,
    developer: 'FromSoftware',
    publisher: 'BANDAI NAMCO Entertainment',
    releaseDate: '25 ก.พ. 2565',
    genres: ['แอ็กชัน', 'สวมบทบาท', 'โลกเปิด'],
    reviewPercent: 94,
    reviewCount: 782940,
    popularity: 99,
    hue: 36,
    editions: [
      edition('standard', 'Standard Edition', 1590),
      edition('deluxe', 'Deluxe Edition', 1990),
      edition('dlc', 'Shadow of the Erdtree (DLC)', 1290)
    ]
  },
  {
    slug: 'baldurs-gate-3',
    title: "Baldur's Gate 3",
    year: 2023,
    developer: 'Larian Studios',
    publisher: 'Larian Studios',
    releaseDate: '3 ส.ค. 2566',
    genres: ['สวมบทบาท', 'ผจญภัย', 'วางแผน'],
    reviewPercent: 96,
    reviewCount: 692340,
    popularity: 96,
    hue: 18,
    editions: [
      edition('standard', 'Standard Edition', 1990),
      edition('deluxe', 'Digital Deluxe Edition', 2290)
    ]
  },
  {
    slug: 'palworld',
    title: 'Palworld',
    year: 2024,
    developer: 'Pocketpair',
    publisher: 'Pocketpair',
    releaseDate: '19 ม.ค. 2567',
    genres: ['เอาชีวิตรอด', 'ผจญภัย', 'โลกเปิด'],
    reviewPercent: 93,
    reviewCount: 512880,
    popularity: 95,
    hue: 202,
    editions: [edition('standard', 'Standard Edition', 899)]
  },
  {
    slug: 'cyberpunk-2077',
    title: 'Cyberpunk 2077',
    year: 2020,
    developer: 'CD PROJEKT RED',
    publisher: 'CD PROJEKT RED',
    releaseDate: '10 ธ.ค. 2563',
    genres: ['สวมบทบาท', 'โลกเปิด', 'แอ็กชัน'],
    reviewPercent: 82,
    reviewCount: 748110,
    popularity: 94,
    hue: 54,
    editions: [
      edition('standard', 'Standard Edition', 1799),
      edition('complete', 'Ultimate Edition', 2290),
      edition('dlc', 'Phantom Liberty (DLC)', 990)
    ]
  },
  {
    slug: 'valheim',
    title: 'Valheim',
    year: 2021,
    developer: 'Iron Gate AB',
    publisher: 'Coffee Stain Publishing',
    releaseDate: '2 ก.พ. 2564',
    genres: ['เอาชีวิตรอด', 'ก่อสร้าง', 'ผจญภัย'],
    reviewPercent: 94,
    reviewCount: 461220,
    popularity: 92,
    hue: 188,
    editions: [edition('standard', 'Standard Edition', 415)]
  },
  {
    slug: 'helldivers-2',
    title: 'HELLDIVERS 2',
    year: 2024,
    developer: 'Arrowhead Game Studios',
    publisher: 'PlayStation Publishing LLC',
    releaseDate: '8 ก.พ. 2567',
    genres: ['แอ็กชัน', 'ยิงมุมมองบุคคลที่สาม'],
    reviewPercent: 74,
    reviewCount: 372560,
    popularity: 89,
    hue: 44,
    editions: [
      edition('standard', 'Standard Edition', 1490),
      edition('bundle', 'Super Citizen Bundle', 1890)
    ]
  },
  {
    slug: 'sons-of-the-forest',
    title: 'Sons Of The Forest',
    year: 2024,
    developer: 'Endnight Games Ltd',
    publisher: 'Newnight',
    releaseDate: '22 ก.พ. 2567',
    genres: ['เอาชีวิตรอด', 'สยองขวัญ'],
    reviewPercent: 88,
    reviewCount: 214300,
    popularity: 90,
    hue: 96,
    editions: [edition('standard', 'Standard Edition', 599)]
  },
  {
    slug: 'the-forest',
    title: 'The Forest',
    year: 2018,
    developer: 'Endnight Games Ltd',
    publisher: 'Endnight Games Ltd',
    releaseDate: '30 เม.ย. 2561',
    genres: ['เอาชีวิตรอด', 'สยองขวัญ', 'ผจญภัย'],
    reviewPercent: 92,
    reviewCount: 401760,
    popularity: 88,
    hue: 128,
    editions: [
      edition('standard', 'Standard Edition', 199),
      edition('bundle', 'Forest Collection Bundle', 719)
    ]
  },
  {
    slug: 'rdr2',
    title: 'Red Dead Redemption 2',
    year: 2019,
    developer: 'Rockstar Games',
    publisher: 'Rockstar Games',
    releaseDate: '5 ธ.ค. 2562',
    genres: ['แอ็กชัน', 'ผจญภัย', 'โลกเปิด'],
    reviewPercent: 92,
    reviewCount: 552120,
    popularity: 87,
    hue: 10,
    editions: [
      edition('standard', 'Standard Edition', 1799),
      edition('complete', 'Ultimate Edition', 2190)
    ]
  },
  {
    slug: 'stardew-valley',
    title: 'Stardew Valley',
    year: 2016,
    developer: 'ConcernedApe',
    publisher: 'ConcernedApe',
    releaseDate: '26 ก.พ. 2559',
    genres: ['อินดี้', 'จำลอง', 'สวมบทบาท'],
    reviewPercent: 98,
    reviewCount: 812470,
    popularity: 85,
    hue: 150,
    editions: [edition('standard', 'Standard Edition', 275)]
  },
  {
    slug: 'terraria',
    title: 'Terraria',
    year: 2011,
    developer: 'Re-Logic',
    publisher: 'Re-Logic',
    releaseDate: '16 พ.ค. 2554',
    genres: ['อินดี้', 'เอาชีวิตรอด', 'ก่อสร้าง'],
    reviewPercent: 97,
    reviewCount: 1102400,
    popularity: 82,
    hue: 168,
    editions: [edition('standard', 'Standard Edition', 199)]
  },
  {
    slug: 'it-takes-two',
    title: 'It Takes Two',
    year: 2021,
    developer: 'Hazelight Studios',
    publisher: 'Electronic Arts',
    releaseDate: '26 มี.ค. 2564',
    genres: ['ผจญภัย', 'เล่นร่วมกัน'],
    reviewPercent: 96,
    reviewCount: 189300,
    popularity: 78,
    hue: 306,
    editions: [edition('standard', 'Standard Edition', 990)]
  }
]

export const stores: Store[] = [
  {
    id: 'steam',
    name: 'Steam',
    initials: 'ST',
    type: 'steam',
    payments: [
      'บัตรเครดิต/เดบิต',
      'TrueMoney Wallet',
      'พร้อมเพย์',
      'Steam Wallet'
    ],
    feeRate: 0,
    feeLabel: '',
    note: 'ซื้อโดยตรงจาก Steam ประเทศไทย เปิดใช้งานได้แน่นอนและไม่มีค่าธรรมเนียมแฝง',
    websiteUrl: 'https://store.steampowered.com/'
  },
  {
    id: 'fanatical',
    name: 'Fanatical',
    initials: 'FA',
    type: 'official',
    payments: ['บัตรเครดิต/เดบิต', 'PayPal'],
    feeRate: 0,
    feeLabel: '',
    note: 'ตัวแทนจำหน่ายที่ได้รับอนุญาต คีย์มาจากผู้จัดจำหน่ายโดยตรง',
    websiteUrl: 'https://www.fanatical.com/'
  },
  {
    id: 'gamersgate',
    name: 'GamersGate',
    initials: 'GG',
    type: 'official',
    payments: ['บัตรเครดิต/เดบิต', 'PayPal'],
    feeRate: 0,
    feeLabel: '',
    note: 'ตัวแทนจำหน่ายที่ได้รับอนุญาต สต็อกคีย์บางรายการมีจำกัด',
    websiteUrl: 'https://www.gamersgate.com/'
  },
  {
    id: 'gamesplanet',
    name: 'Gamesplanet',
    initials: 'GP',
    type: 'official',
    payments: ['บัตรเครดิต/เดบิต', 'PayPal'],
    feeRate: 0,
    feeLabel: '',
    note: 'ตัวแทนจำหน่ายในยุโรป คีย์บางรายการจำกัดเฉพาะภูมิภาค EU',
    websiteUrl: 'https://us.gamesplanet.com/'
  },
  {
    id: 'gmg',
    name: 'Green Man Gaming',
    initials: 'GM',
    type: 'official',
    payments: ['บัตรเครดิต/เดบิต', 'PayPal'],
    feeRate: 0,
    feeLabel: '',
    note: 'ตัวแทนจำหน่ายที่ได้รับอนุญาต มีระบบคืนเงินตามเงื่อนไขของร้าน',
    websiteUrl: 'https://www.greenmangaming.com/'
  },
  {
    id: 'humble',
    name: 'Humble Store',
    initials: 'HB',
    type: 'official',
    payments: ['บัตรเครดิต/เดบิต', 'PayPal', 'Amazon Pay'],
    feeRate: 0,
    feeLabel: '',
    note: 'ตัวแทนจำหน่ายที่ได้รับอนุญาต ราคาอาจแสดงเป็น USD และถูกแปลงโดยผู้ออกบัตร',
    websiteUrl: 'https://www.humblebundle.com/store'
  },
  {
    id: 'cdkeys',
    name: 'CDKeys',
    initials: 'CD',
    type: 'reseller',
    payments: ['บัตรเครดิต/เดบิต', 'PayPal'],
    feeRate: 0,
    feeLabel: '',
    note: 'ผู้จำหน่ายคีย์รายใหญ่ ไม่ใช่ตัวแทนจำหน่ายอย่างเป็นทางการของผู้พัฒนาทุกราย',
    websiteUrl: 'https://www.cdkeys.com/'
  },
  {
    id: 'instant',
    name: 'Instant Gaming',
    initials: 'IG',
    type: 'reseller',
    payments: ['บัตรเครดิต/เดบิต', 'PayPal', 'Crypto'],
    feeRate: 0,
    feeLabel: '',
    note: 'จัดส่งคีย์อัตโนมัติ ตรวจสอบภูมิภาคที่ระบุบนหน้าสินค้าก่อนชำระเงิน',
    websiteUrl: 'https://www.instant-gaming.com/'
  },
  {
    id: 'eneba',
    name: 'Eneba',
    initials: 'EN',
    type: 'marketplace',
    payments: ['บัตรเครดิต/เดบิต', 'PayPal', 'Skrill', 'Google Pay'],
    feeRate: 0.052,
    feeLabel: 'ค่าบริการแพลตฟอร์ม',
    note: 'Marketplace ที่มีผู้ขายรายย่อยจำนวนมาก ภูมิภาคของคีย์ขึ้นกับผู้ขายแต่ละราย',
    websiteUrl: 'https://www.eneba.com/'
  },
  {
    id: 'kinguin',
    name: 'Kinguin',
    initials: 'KG',
    type: 'marketplace',
    payments: ['บัตรเครดิต/เดบิต', 'PayPal', 'Alipay'],
    feeRate: 0.049,
    feeLabel: 'Buyer Protection',
    note: 'ค่า Buyer Protection เป็นตัวเลือกเสริมแต่ถูกเลือกไว้ล่วงหน้าที่หน้าชำระเงิน',
    websiteUrl: 'https://www.kinguin.net/'
  }
]

/** Region codes that are safe to activate from Thailand. */
const CONFIRMED_REGIONS: ReadonlySet<RegionCode> = new Set<RegionCode>([
  'global',
  'sea',
  'thailand'
])
const UNCERTAIN_REGIONS: ReadonlySet<RegionCode> = new Set<RegionCode>([
  'eu',
  'row'
])

/**
 * Region status is derived from one place only. The Worker and the mock must
 * never re-derive it with ad hoc string matching.
 */
export const regionStatusFor = (region: RegionCode): RegionStatus => {
  if (CONFIRMED_REGIONS.has(region)) return 'confirmed'
  if (UNCERTAIN_REGIONS.has(region)) return 'uncertain'
  return 'blocked'
}

const hash = (text: string): number => {
  let value = 2166136261
  for (const char of text)
    value = Math.imul(value ^ char.charCodeAt(0), 16777619)
  return value >>> 0
}

const randomFor = (seed: string): (() => number) => {
  let state = hash(seed)
  return () => {
    state += 0x6d2b79f5
    let next = state
    next = Math.imul(next ^ (next >>> 15), next | 1)
    next ^= next + Math.imul(next ^ (next >>> 7), next | 61)
    return ((next ^ (next >>> 14)) >>> 0) / 4294967296
  }
}

const PRICE_BANDS: Readonly<Record<string, readonly [number, number]>> = {
  eneba: [0.44, 0.16],
  kinguin: [0.47, 0.15],
  cdkeys: [0.52, 0.14],
  instant: [0.55, 0.14],
  fanatical: [0.61, 0.15],
  gmg: [0.65, 0.15],
  humble: [0.7, 0.15],
  gamesplanet: [0.72, 0.15],
  gamersgate: [0.68, 0.16],
  steam: [1, 0]
}

const purchaseUrlFor = (store: Store, title: string): string => {
  const query = encodeURIComponent(title)
  switch (store.id) {
    case 'steam':
      return `https://store.steampowered.com/search/?term=${query}`
    case 'fanatical':
      return `https://www.fanatical.com/en/search?search=${query}`
    case 'gamersgate':
      return `https://www.gamersgate.com/games/?query=${query}`
    case 'gamesplanet':
      return `https://us.gamesplanet.com/search?query=${query}`
    case 'gmg':
      return `https://www.greenmangaming.com/search/?query=${query}`
    case 'humble':
      return `https://www.humblebundle.com/store/search?search=${query}`
    case 'cdkeys':
      return `https://www.cdkeys.com/catalogsearch/result/?q=${query}`
    case 'instant':
      return `https://www.instant-gaming.com/en/search/?query=${query}`
    case 'eneba':
      return `https://www.eneba.com/store?text=${query}`
    case 'kinguin':
      return `https://www.kinguin.net/listing?active=1&phrase=${query}`
    default:
      return store.websiteUrl
  }
}

const regionFor = (
  storeId: string,
  gameSlug: string,
  random: () => number
): RegionCode => {
  switch (storeId) {
    case 'steam':
      return 'thailand'
    case 'cdkeys':
      return 'sea'
    case 'gamesplanet':
      return 'eu'
    case 'kinguin':
      return 'row'
    case 'humble':
      return gameSlug === 'helldivers-2' ? 'north-america' : 'global'
    case 'eneba':
      return random() < 0.34 ? 'eu' : 'global'
    default:
      return 'global'
  }
}

const drmFor = (gameSlug: string, storeId: string): string => {
  if (storeId === 'steam') return 'Steam'
  if (
    gameSlug === 'it-takes-two' &&
    (storeId === 'gmg' || storeId === 'humble')
  ) {
    return 'EA app'
  }
  if (gameSlug === 'cyberpunk-2077' && storeId === 'gmg') return 'GOG.com'
  return 'Steam Key'
}

const feesFor = (
  store: Store,
  advertisedSatang: number,
  random: () => number
): OfferFee[] => {
  const fees: OfferFee[] = []
  if (store.feeRate > 0) {
    fees.push({
      kind: store.id === 'kinguin' ? 'buyer-protection' : 'platform',
      label: store.feeLabel,
      amountSatang: Math.max(900, Math.round(advertisedSatang * store.feeRate))
    })
  }
  if (store.id === 'eneba' && random() < 0.4) {
    fees.push({
      kind: 'payment',
      label: 'ค่าธรรมเนียมการชำระเงิน',
      amountSatang: 1_500
    })
  }
  return fees
}

export const findGame = (slug: string): Game | undefined =>
  games.find((game) => game.slug === slug)

export const findEdition = (game: Game, editionKey?: string): Edition =>
  game.editions.find((item) => item.key === editionKey) ?? game.editions[0]

/**
 * Generates the deterministic offer set for one game/edition. `isHistoricalLow`
 * is left `false` here — the caller marks the winning offer, because "lowest
 * confirmed Thai offer" is a domain rule, not a generation detail.
 */
export const buildOffers = (gameSlug: string, editionKey?: string): Offer[] => {
  const game = findGame(gameSlug)
  if (!game) return []
  const selected = findEdition(game, editionKey)
  const random = randomFor(`${game.slug}|${selected.key}`)

  return stores.map((store): Offer => {
    const [low, spread] = PRICE_BANDS[store.id]
    const advertisedSatang =
      store.id === 'steam'
        ? selected.steamPriceSatang
        : Math.max(
            4_900,
            Math.round(
              (selected.steamPriceSatang * (low + random() * spread)) / 500
            ) *
              500 -
              100
          )
    const fees = feesFor(store, advertisedSatang, random)
    const region = regionFor(store.id, game.slug, random)
    const marketplace = store.type === 'marketplace'
    return {
      id: `${game.slug}-${selected.key}-${store.id}`,
      gameSlug: game.slug,
      storeId: store.id,
      editionKey: selected.key,
      editionName: selected.name,
      editionCategory: selected.category,
      advertisedSatang,
      fees,
      finalSatang: advertisedSatang + offerFeeTotal({ fees }),
      steamPriceSatang: selected.steamPriceSatang,
      region,
      regionStatus: regionStatusFor(region),
      drm: drmFor(game.slug, store.id),
      inStock: !(store.id === 'gamersgate' && random() < 0.5),
      updatedMinutesAgo: 2 + Math.floor(random() * 220),
      sellerRating: marketplace
        ? Math.round((95.5 + random() * 4) * 10) / 10
        : undefined,
      sellerReviewCount: marketplace
        ? 1_200 + Math.floor(random() * 38_000)
        : undefined,
      isHistoricalLow: false,
      purchaseUrl: purchaseUrlFor(store, game.title)
    }
  })
}

/**
 * Deterministic price history for a game's first edition.
 *
 * `count` points are spread evenly across `days`, ending at `endingSatang` so
 * the chart's most recent point always agrees with the current best offer.
 */
export const buildPriceHistory = (
  gameSlug: string,
  days: number,
  endingSatang: number,
  endsAt: number
): { observedAt: number; priceSatang: number }[] => {
  const game = findGame(gameSlug)
  if (!game) return []
  const safeDays = Math.max(2, Math.floor(days))
  const count =
    safeDays <= 30 ? 30 : safeDays <= 92 ? 46 : safeDays <= 183 ? 61 : 73
  const random = randomFor(`${gameSlug}|${safeDays}`)
  const basePrice = game.editions[0].steamPriceSatang

  return Array.from({ length: count }, (_, index) => ({
    observedAt: Math.round(
      endsAt - (count - 1 - index) * (safeDays / (count - 1)) * 86_400_000
    ),
    priceSatang:
      index === count - 1
        ? endingSatang
        : Math.round((basePrice * (0.45 + random() * 0.5)) / 100) * 100
  }))
}

/** Number of days of history the D1 seed materializes per game. */
export const SEED_HISTORY_DAYS = 365
