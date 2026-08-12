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
  },
  {
    slug: 'black-myth-wukong',
    title: 'Black Myth: Wukong',
    year: 2024,
    developer: 'Game Science',
    publisher: 'Game Science',
    releaseDate: '19 ส.ค. 2567',
    genres: ['แอ็กชัน', 'สวมบทบาท', 'ผจญภัย'],
    reviewPercent: 97,
    reviewCount: 1204706,
    popularity: 91,
    hue: 42,
    editions: [edition('standard', 'Standard Edition', 1799)]
  },
  {
    slug: 'persona-5-royal',
    title: 'Persona 5 Royal',
    year: 2022,
    developer: 'ATLUS',
    publisher: 'SEGA',
    releaseDate: '20 ต.ค. 2565',
    genres: ['สวมบทบาท'],
    reviewPercent: 96,
    reviewCount: 136780,
    popularity: 80,
    hue: 355,
    editions: [edition('standard', 'Standard Edition', 1915)]
  },
  {
    slug: 'rust',
    title: 'Rust',
    year: 2018,
    developer: 'Facepunch Studios',
    publisher: 'Facepunch Studios',
    releaseDate: '8 ก.พ. 2561',
    genres: ['เอาชีวิตรอด', 'ก่อสร้าง', 'ผจญภัย'],
    reviewPercent: 87,
    reviewCount: 1390033,
    popularity: 93,
    hue: 24,
    editions: [edition('standard', 'Standard Edition', 799)]
  },
  {
    slug: 'peak',
    title: 'PEAK',
    year: 2025,
    developer: 'Aggro Crab',
    publisher: 'Aggro Crab',
    releaseDate: '16 มิ.ย. 2568',
    genres: ['ผจญภัย', 'เล่นร่วมกัน', 'อินดี้'],
    reviewPercent: 95,
    reviewCount: 346112,
    popularity: 84,
    hue: 195,
    editions: [edition('standard', 'Standard Edition', 159)]
  },
  {
    slug: 'ghost-recon-wildlands',
    title: "Tom Clancy's Ghost Recon Wildlands",
    year: 2017,
    developer: 'Ubisoft Paris',
    publisher: 'Ubisoft',
    releaseDate: '6 มี.ค. 2560',
    genres: ['แอ็กชัน', 'ผจญภัย', 'โลกเปิด'],
    reviewPercent: 79,
    reviewCount: 109160,
    popularity: 70,
    hue: 90,
    editions: [edition('standard', 'Standard Edition', 1340)]
  },
  {
    slug: 'world-war-z',
    title: 'World War Z',
    year: 2021,
    developer: 'Saber Interactive',
    publisher: 'Saber Interactive',
    releaseDate: '21 ก.ย. 2564',
    genres: ['แอ็กชัน', 'ยิงมุมมองบุคคลที่สาม'],
    reviewPercent: 83,
    reviewCount: 31989,
    popularity: 60,
    hue: 4,
    editions: [edition('standard', 'Standard Edition', 690)]
  },
  {
    slug: 'ghost-recon-breakpoint',
    title: "Tom Clancy's Ghost Recon Breakpoint",
    year: 2019,
    developer: 'Ubisoft Paris',
    publisher: 'Ubisoft',
    releaseDate: '4 ต.ค. 2562',
    genres: ['แอ็กชัน', 'ผจญภัย', 'โลกเปิด'],
    reviewPercent: 73,
    reviewCount: 44913,
    popularity: 58,
    hue: 205,
    editions: [edition('standard', 'Standard Edition', 1600)]
  },
  {
    slug: 'the-isle',
    title: 'The Isle',
    year: 2015,
    developer: 'Afterthought LLC',
    publisher: 'Afterthought LLC',
    releaseDate: '1 ธ.ค. 2558',
    genres: ['เอาชีวิตรอด', 'จำลอง'],
    reviewPercent: 80,
    reviewCount: 118216,
    popularity: 68,
    hue: 140,
    editions: [edition('standard', 'Standard Edition', 400)]
  },
  {
    slug: 'cod-mw3',
    title: 'Call of Duty: Modern Warfare III',
    year: 2023,
    developer: 'Sledgehammer Games',
    publisher: 'Activision',
    releaseDate: '10 พ.ย. 2566',
    genres: ['แอ็กชัน'],
    reviewPercent: 45,
    reviewCount: 19779,
    popularity: 65,
    hue: 14,
    editions: [edition('standard', 'Standard Edition', 2322)]
  },
  {
    slug: 'counter-strike',
    title: 'Counter-Strike',
    year: 2000,
    developer: 'Valve',
    publisher: 'Valve',
    releaseDate: '1 พ.ย. 2543',
    genres: ['แอ็กชัน'],
    reviewPercent: 97,
    reviewCount: 261174,
    popularity: 76,
    hue: 32,
    editions: [edition('standard', 'Standard Edition', 189)]
  },
  {
    slug: 'half-life',
    title: 'Half-Life',
    year: 1998,
    developer: 'Valve',
    publisher: 'Valve',
    releaseDate: '19 พ.ย. 2541',
    genres: ['แอ็กชัน'],
    reviewPercent: 96,
    reviewCount: 163402,
    popularity: 69,
    hue: 265,
    editions: [edition('standard', 'Standard Edition', 189)]
  },
  {
    slug: 'counter-strike-condition-zero',
    title: 'Counter-Strike: Condition Zero',
    year: 2004,
    developer: 'Valve',
    publisher: 'Valve',
    releaseDate: '1 มี.ค. 2547',
    genres: ['แอ็กชัน'],
    reviewPercent: 92,
    reviewCount: 5355,
    popularity: 30,
    hue: 161,
    editions: [edition('standard', 'Standard Edition', 189)]
  },
  {
    slug: 'half-life-2',
    title: 'Half-Life 2',
    year: 2004,
    developer: 'Valve',
    publisher: 'Valve',
    releaseDate: '16 พ.ย. 2547',
    genres: ['แอ็กชัน'],
    reviewPercent: 98,
    reviewCount: 277732,
    popularity: 77,
    hue: 146,
    editions: [edition('standard', 'Standard Edition', 220)]
  },
  {
    slug: 'counter-strike-source',
    title: 'Counter-Strike: Source',
    year: 2004,
    developer: 'Valve',
    publisher: 'Valve',
    releaseDate: '1 พ.ย. 2547',
    genres: ['แอ็กชัน'],
    reviewPercent: 96,
    reviewCount: 192763,
    popularity: 72,
    hue: 226,
    editions: [edition('standard', 'Standard Edition', 220)]
  },
  {
    slug: 'portal',
    title: 'Portal',
    year: 2007,
    developer: 'Valve',
    publisher: 'Valve',
    releaseDate: '10 ต.ค. 2550',
    genres: ['แอ็กชัน'],
    reviewPercent: 99,
    reviewCount: 198105,
    popularity: 72,
    hue: 355,
    editions: [edition('standard', 'Standard Edition', 220)]
  },
  {
    slug: 'left-4-dead-2',
    title: 'Left 4 Dead 2',
    year: 2009,
    developer: 'Valve',
    publisher: 'Valve',
    releaseDate: '16 พ.ย. 2552',
    genres: ['แอ็กชัน'],
    reviewPercent: 98,
    reviewCount: 1052473,
    popularity: 95,
    hue: 197,
    editions: [edition('standard', 'Standard Edition', 220)]
  },
  {
    slug: 'garry-s-mod',
    title: "Garry's Mod",
    year: 2006,
    developer: 'Facepunch Studios',
    publisher: 'Valve',
    releaseDate: '29 พ.ย. 2549',
    genres: ['อินดี้', 'จำลอง'],
    reviewPercent: 97,
    reviewCount: 1257670,
    popularity: 98,
    hue: 101,
    editions: [edition('standard', 'Standard Edition', 219)]
  },
  {
    slug: 'sid-meier-s-civilization-v',
    title: "Sid Meier's Civilization V",
    year: 2010,
    developer: 'Firaxis Games',
    publisher: '2K',
    releaseDate: '23 ก.ย. 2553',
    genres: ['วางแผน'],
    reviewPercent: 96,
    reviewCount: 210447,
    popularity: 73,
    hue: 301,
    editions: [edition('standard', 'Standard Edition', 559)]
  },
  {
    slug: 'borderlands-2',
    title: 'Borderlands 2',
    year: 2012,
    developer: 'Gearbox Software',
    publisher: '2K',
    releaseDate: '20 ก.ย. 2555',
    genres: ['แอ็กชัน', 'สวมบทบาท'],
    reviewPercent: 90,
    reviewCount: 311947,
    popularity: 78,
    hue: 160,
    editions: [edition('standard', 'Standard Edition', 369)]
  },
  {
    slug: 'arma-3',
    title: 'Arma 3',
    year: 2013,
    developer: 'Bohemia Interactive',
    publisher: 'Bohemia Interactive',
    releaseDate: '12 ก.ย. 2556',
    genres: ['แอ็กชัน', 'จำลอง', 'วางแผน'],
    reviewPercent: 90,
    reviewCount: 294675,
    popularity: 77,
    hue: 176,
    editions: [edition('standard', 'Standard Edition', 899)]
  },
  {
    slug: 'project-zomboid',
    title: 'Project Zomboid',
    year: 2013,
    developer: 'The Indie Stone',
    publisher: 'The Indie Stone',
    releaseDate: '8 พ.ย. 2556',
    genres: ['อินดี้', 'สวมบทบาท', 'จำลอง'],
    reviewPercent: 94,
    reviewCount: 470428,
    popularity: 84,
    hue: 91,
    editions: [edition('standard', 'Standard Edition', 459)]
  },
  {
    slug: 'payday-2',
    title: 'PAYDAY 2',
    year: 2013,
    developer: 'OVERKILL - a Starbreeze Studio.',
    publisher: 'Starbreeze Entertainment',
    releaseDate: '13 ส.ค. 2556',
    genres: ['แอ็กชัน', 'สวมบทบาท'],
    reviewPercent: 89,
    reviewCount: 673892,
    popularity: 89,
    hue: 186,
    editions: [edition('standard', 'Standard Edition', 199)]
  },
  {
    slug: 'grim-dawn',
    title: 'Grim Dawn',
    year: 2016,
    developer: 'Crate Entertainment',
    publisher: 'Crate Entertainment',
    releaseDate: '25 ก.พ. 2559',
    genres: ['แอ็กชัน', 'ผจญภัย', 'อินดี้', 'สวมบทบาท'],
    reviewPercent: 94,
    reviewCount: 108830,
    popularity: 64,
    hue: 203,
    editions: [edition('standard', 'Standard Edition', 459)]
  },
  {
    slug: 'dayz',
    title: 'DayZ',
    year: 2018,
    developer: 'Bohemia Interactive',
    publisher: 'Bohemia Interactive',
    releaseDate: '13 ธ.ค. 2561',
    genres: ['แอ็กชัน', 'ผจญภัย'],
    reviewPercent: 78,
    reviewCount: 467293,
    popularity: 84,
    hue: 221,
    editions: [edition('standard', 'Standard Edition', 1499)]
  },
  {
    slug: 'euro-truck-simulator-2',
    title: 'Euro Truck Simulator 2',
    year: 2012,
    developer: 'SCS Software',
    publisher: 'SCS Software',
    releaseDate: '12 ต.ค. 2555',
    genres: ['อินดี้', 'จำลอง'],
    reviewPercent: 97,
    reviewCount: 936097,
    popularity: 93,
    hue: 46,
    editions: [edition('standard', 'Standard Edition', 408)]
  },
  {
    slug: 'dying-light',
    title: 'Dying Light',
    year: 2015,
    developer: 'Techland',
    publisher: 'Techland',
    releaseDate: '26 ม.ค. 2558',
    genres: ['แอ็กชัน', 'ผจญภัย', 'สวมบทบาท'],
    reviewPercent: 95,
    reviewCount: 493462,
    popularity: 85,
    hue: 71,
    editions: [edition('standard', 'Standard Edition', 748)]
  },
  {
    slug: '7-days-to-die',
    title: '7 Days to Die',
    year: 2024,
    developer: 'The Fun Pimps',
    publisher: 'The Fun Pimps Entertainment LLC',
    releaseDate: '25 ก.ค. 2567',
    genres: ['แอ็กชัน', 'ผจญภัย', 'อินดี้', 'สวมบทบาท', 'จำลอง', 'วางแผน'],
    reviewPercent: 87,
    reviewCount: 397802,
    popularity: 82,
    hue: 47,
    editions: [edition('standard', 'Standard Edition', 809)]
  },
  {
    slug: 'cities-skylines',
    title: 'Cities: Skylines',
    year: 2015,
    developer: 'Colossal Order',
    publisher: 'Paradox Interactive',
    releaseDate: '10 มี.ค. 2558',
    genres: ['จำลอง', 'วางแผน'],
    reviewPercent: 93,
    reviewCount: 291170,
    popularity: 77,
    hue: 93,
    editions: [edition('standard', 'Standard Edition', 819)]
  },
  {
    slug: 'mount-blade-ii-bannerlord',
    title: 'Mount & Blade II: Bannerlord',
    year: 2022,
    developer: 'TaleWorlds Entertainment',
    publisher: 'TaleWorlds Entertainment',
    releaseDate: '25 ต.ค. 2565',
    genres: ['แอ็กชัน', 'อินดี้', 'สวมบทบาท', 'จำลอง', 'วางแผน'],
    reviewPercent: 88,
    reviewCount: 295509,
    popularity: 77,
    hue: 4,
    editions: [edition('standard', 'Standard Edition', 1499)]
  },
  {
    slug: 'sid-meier-s-civilization-vi',
    title: 'Sid Meier’s Civilization VI',
    year: 2016,
    developer: 'Firaxis Games',
    publisher: '2K',
    releaseDate: '20 ต.ค. 2559',
    genres: ['วางแผน'],
    reviewPercent: 86,
    reviewCount: 377621,
    popularity: 81,
    hue: 268,
    editions: [edition('standard', 'Standard Edition', 1600)]
  },
  {
    slug: 'the-witcher-3-wild-hunt',
    title: 'The Witcher 3: Wild Hunt',
    year: 2015,
    developer: 'CD PROJEKT RED',
    publisher: 'CD PROJEKT RED',
    releaseDate: '18 พ.ค. 2558',
    genres: ['สวมบทบาท'],
    reviewPercent: 97,
    reviewCount: 881149,
    popularity: 93,
    hue: 234,
    editions: [edition('standard', 'Standard Edition', 1040)]
  },
  {
    slug: 'don-t-starve-together',
    title: "Don't Starve Together",
    year: 2016,
    developer: 'Klei Entertainment',
    publisher: 'Klei Entertainment',
    releaseDate: '21 เม.ย. 2559',
    genres: ['แอ็กชัน', 'ผจญภัย', 'อินดี้', 'สวมบทบาท', 'จำลอง', 'วางแผน'],
    reviewPercent: 95,
    reviewCount: 541114,
    popularity: 86,
    hue: 204,
    editions: [edition('standard', 'Standard Edition', 239)]
  },
  {
    slug: 'ark-survival-evolved',
    title: 'ARK: Survival Evolved',
    year: 2017,
    developer: 'Studio Wildcard',
    publisher: 'Studio Wildcard',
    releaseDate: '27 ส.ค. 2560',
    genres: ['แอ็กชัน', 'ผจญภัย', 'อินดี้', 'สวมบทบาท'],
    reviewPercent: 83,
    reviewCount: 775131,
    popularity: 91,
    hue: 334,
    editions: [edition('standard', 'Standard Edition', 315)]
  },
  {
    slug: 'fallout-4',
    title: 'Fallout 4',
    year: 2015,
    developer: 'Bethesda Game Studios',
    publisher: 'Bethesda Softworks',
    releaseDate: '9 พ.ย. 2558',
    genres: ['สวมบทบาท'],
    reviewPercent: 81,
    reviewCount: 427672,
    popularity: 83,
    hue: 357,
    editions: [edition('standard', 'Standard Edition', 660)]
  },
  {
    slug: 'dead-by-daylight',
    title: 'Dead by Daylight',
    year: 2016,
    developer: 'Behaviour Interactive Inc.',
    publisher: 'Behaviour Interactive Inc.',
    releaseDate: '14 มิ.ย. 2559',
    genres: ['แอ็กชัน'],
    reviewPercent: 78,
    reviewCount: 926542,
    popularity: 93,
    hue: 32,
    editions: [edition('standard', 'Standard Edition', 399)]
  },
  {
    slug: 'street-warriors-online',
    title: 'Street Warriors Online',
    year: 2016,
    developer: 'Crazy Rocks Studios',
    publisher: 'Crazy Rocks Studios',
    releaseDate: '16 ธ.ค. 2559',
    genres: ['แอ็กชัน', 'จำลอง'],
    reviewPercent: 57,
    reviewCount: 1622,
    popularity: 30,
    hue: 242,
    editions: [edition('standard', 'Standard Edition', 45)]
  },
  {
    slug: 'wallpaper-engine',
    title: 'Wallpaper Engine',
    year: 2018,
    developer: 'Wallpaper Engine Team',
    publisher: 'Wallpaper Engine Team',
    releaseDate: '16 พ.ย. 2561',
    genres: ['อินดี้'],
    reviewPercent: 98,
    reviewCount: 1008629,
    popularity: 95,
    hue: 14,
    editions: [edition('standard', 'Standard Edition', 115)]
  },
  {
    slug: 'human-fall-flat',
    title: 'Human Fall Flat',
    year: 2016,
    developer: 'No Brakes Games',
    publisher: 'Curve Games',
    releaseDate: '22 ก.ค. 2559',
    genres: ['ผจญภัย', 'อินดี้', 'จำลอง'],
    reviewPercent: 95,
    reviewCount: 226198,
    popularity: 74,
    hue: 88,
    editions: [edition('standard', 'Standard Edition', 315)]
  },
  {
    slug: 'satisfactory',
    title: 'Satisfactory',
    year: 2024,
    developer: 'Coffee Stain Studios',
    publisher: 'Coffee Stain Publishing',
    releaseDate: '10 ก.ย. 2567',
    genres: ['ผจญภัย', 'อินดี้', 'จำลอง', 'วางแผน'],
    reviewPercent: 97,
    reviewCount: 277567,
    popularity: 77,
    hue: 207,
    editions: [edition('standard', 'Standard Edition', 719)]
  },
  {
    slug: 'monster-hunter-world',
    title: 'Monster Hunter: World',
    year: 2018,
    developer: 'CAPCOM Co., Ltd.',
    publisher: 'CAPCOM Co., Ltd.',
    releaseDate: '8 ส.ค. 2561',
    genres: ['แอ็กชัน'],
    reviewPercent: 89,
    reviewCount: 515163,
    popularity: 85,
    hue: 131,
    editions: [edition('standard', 'Standard Edition', 810)]
  },
  {
    slug: 'hunt-showdown-1896',
    title: 'Hunt: Showdown 1896',
    year: 2019,
    developer: 'Crytek',
    publisher: 'Crytek',
    releaseDate: '27 ส.ค. 2562',
    genres: ['แอ็กชัน'],
    reviewPercent: 74,
    reviewCount: 276803,
    popularity: 77,
    hue: 87,
    editions: [edition('standard', 'Standard Edition', 619)]
  },
  {
    slug: 'risk-of-rain-2',
    title: 'Risk of Rain 2',
    year: 2020,
    developer: 'Hopoo Games',
    publisher: 'Gearbox Publishing',
    releaseDate: '11 ส.ค. 2563',
    genres: ['แอ็กชัน', 'อินดี้'],
    reviewPercent: 94,
    reviewCount: 351302,
    popularity: 80,
    hue: 270,
    editions: [edition('standard', 'Standard Edition', 319)]
  },
  {
    slug: 'raft',
    title: 'Raft',
    year: 2022,
    developer: 'Redbeet Interactive',
    publisher: 'Axolot Games',
    releaseDate: '20 มิ.ย. 2565',
    genres: ['ผจญภัย', 'อินดี้', 'จำลอง'],
    reviewPercent: 93,
    reviewCount: 376852,
    popularity: 81,
    hue: 286,
    editions: [edition('standard', 'Standard Edition', 369)]
  },
  {
    slug: 'phasmophobia',
    title: 'Phasmophobia',
    year: 2020,
    developer: 'Kinetic Games',
    publisher: 'Kinetic Games',
    releaseDate: '18 ก.ย. 2563',
    genres: ['แอ็กชัน', 'อินดี้'],
    reviewPercent: 94,
    reviewCount: 836729,
    popularity: 92,
    hue: 322,
    editions: [edition('standard', 'Standard Edition', 399)]
  },
  {
    slug: 'sekiro-shadows-die-twice-goty-edition',
    title: 'Sekiro: Shadows Die Twice - GOTY Edition',
    year: 2019,
    developer: 'FromSoftware, Inc.',
    publisher: 'Activision (Excluding Japan and Asia)',
    releaseDate: '21 มี.ค. 2562',
    genres: ['แอ็กชัน', 'ผจญภัย'],
    reviewPercent: 95,
    reviewCount: 353772,
    popularity: 80,
    hue: 345,
    editions: [edition('standard', 'Standard Edition', 2099)]
  },
  {
    slug: 'last-epoch',
    title: 'Last Epoch',
    year: 2024,
    developer: 'Eleventh Hour Games',
    publisher: 'Eleventh Hour Games',
    releaseDate: '21 ก.พ. 2567',
    genres: ['แอ็กชัน', 'ผจญภัย', 'อินดี้', 'สวมบทบาท'],
    reviewPercent: 77,
    reviewCount: 118329,
    popularity: 65,
    hue: 41,
    editions: [edition('standard', 'Standard Edition', 680)]
  },
  {
    slug: 'hogwarts-legacy',
    title: 'Hogwarts Legacy',
    year: 2023,
    developer: 'Avalanche Software',
    publisher: 'Warner Bros. Games',
    releaseDate: '10 ก.พ. 2566',
    genres: ['แอ็กชัน', 'ผจญภัย', 'สวมบทบาท'],
    reviewPercent: 90,
    reviewCount: 370895,
    popularity: 81,
    hue: 48,
    editions: [edition('standard', 'Standard Edition', 1890)]
  },
  {
    slug: 'cybercorp',
    title: 'CyberCorp',
    year: 2025,
    developer: 'Megame LLC',
    publisher: 'Megame LLC',
    releaseDate: '22 เม.ย. 2568',
    genres: ['แอ็กชัน', 'ผจญภัย', 'อินดี้', 'สวมบทบาท'],
    reviewPercent: 79,
    reviewCount: 435,
    popularity: 30,
    hue: 38,
    editions: [edition('standard', 'Standard Edition', 315)]
  },
  {
    slug: 'battlefield-v',
    title: 'Battlefield V',
    year: 2020,
    developer: 'DICE',
    publisher: 'Electronic Arts',
    releaseDate: '22 ต.ค. 2563',
    genres: ['แอ็กชัน'],
    reviewPercent: 71,
    reviewCount: 269137,
    popularity: 76,
    hue: 326,
    editions: [edition('standard', 'Standard Edition', 1399)]
  },
  {
    slug: 'battlefield-2042',
    title: 'Battlefield 2042',
    year: 2021,
    developer: 'DICE',
    publisher: 'Electronic Arts',
    releaseDate: '19 พ.ย. 2564',
    genres: ['แอ็กชัน', 'ผจญภัย'],
    reviewPercent: 47,
    reviewCount: 325483,
    popularity: 79,
    hue: 252,
    editions: [edition('standard', 'Standard Edition', 1599)]
  },
  {
    slug: 'lethal-company',
    title: 'Lethal Company',
    year: 2023,
    developer: 'Zeekerss',
    publisher: 'Zeekerss',
    releaseDate: '23 ต.ค. 2566',
    genres: ['แอ็กชัน', 'ผจญภัย', 'อินดี้'],
    reviewPercent: 97,
    reviewCount: 510204,
    popularity: 85,
    hue: 177,
    editions: [edition('standard', 'Standard Edition', 220)]
  },
  {
    slug: 'warhammer-40-000-rogue-trader',
    title: 'Warhammer 40,000: Rogue Trader',
    year: 2023,
    developer: 'Owlcat Games',
    publisher: 'Owlcat Games',
    releaseDate: '7 ธ.ค. 2566',
    genres: ['แอ็กชัน', 'ผจญภัย', 'อินดี้', 'สวมบทบาท', 'วางแผน'],
    reviewPercent: 88,
    reviewCount: 47152,
    popularity: 52,
    hue: 163,
    editions: [edition('standard', 'Standard Edition', 899)]
  },
  {
    slug: 'monster-hunter-wilds',
    title: 'Monster Hunter Wilds',
    year: 2025,
    developer: 'CAPCOM Co., Ltd.',
    publisher: 'CAPCOM Co., Ltd.',
    releaseDate: '27 ก.พ. 2568',
    genres: ['แอ็กชัน', 'ผจญภัย', 'สวมบทบาท'],
    reviewPercent: 49,
    reviewCount: 327569,
    popularity: 79,
    hue: 42,
    editions: [edition('standard', 'Standard Edition', 1090)]
  },
  {
    slug: 'path-of-exile-2',
    title: 'Path of Exile 2',
    year: 2024,
    developer: 'Grinding Gear Games',
    publisher: 'Grinding Gear Games',
    releaseDate: '6 ธ.ค. 2567',
    genres: ['แอ็กชัน', 'ผจญภัย', 'สวมบทบาท'],
    reviewPercent: 75,
    reviewCount: 224250,
    popularity: 74,
    hue: 37,
    editions: [edition('standard', 'Standard Edition', 798)]
  },
  {
    slug: 'schedule-i',
    title: 'Schedule I',
    year: 2025,
    developer: 'TVGS',
    publisher: 'TVGS',
    releaseDate: '24 มี.ค. 2568',
    genres: ['แอ็กชัน', 'อินดี้', 'จำลอง', 'วางแผน'],
    reviewPercent: 98,
    reviewCount: 312110,
    popularity: 78,
    hue: 142,
    editions: [edition('standard', 'Standard Edition', 400)]
  },
  {
    slug: 'r-e-p-o',
    title: 'R.E.P.O.',
    year: 2025,
    developer: 'semiwork',
    publisher: 'semiwork',
    releaseDate: '26 ก.พ. 2568',
    genres: ['แอ็กชัน'],
    reviewPercent: 96,
    reviewCount: 416779,
    popularity: 82,
    hue: 230,
    editions: [edition('standard', 'Standard Edition', 199)]
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
