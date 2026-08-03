import type { EditionCategory, Game, Store } from '$lib/domain/models';

const categoryForEdition = (key: string): EditionCategory => {
  switch (key) {
    case 'deluxe':
      return 'deluxe';
    case 'complete':
      return 'complete';
    case 'dlc':
      return 'dlc';
    case 'bundle':
      return 'bundle';
    default:
      return 'standard';
  }
};

const edition = (key: string, name: string, baht: number) => ({
  key,
  name,
  category: categoryForEdition(key),
  steamPriceSatang: baht * 100
});

export const games: Game[] = [
  { slug: 'elden-ring', title: 'ELDEN RING', year: 2022, developer: 'FromSoftware', publisher: 'BANDAI NAMCO Entertainment', releaseDate: '25 ก.พ. 2565', genres: ['แอ็กชัน', 'สวมบทบาท', 'โลกเปิด'], reviewPercent: 94, reviewCount: 782940, popularity: 99, hue: 36, editions: [edition('standard', 'Standard Edition', 1590), edition('deluxe', 'Deluxe Edition', 1990), edition('dlc', 'Shadow of the Erdtree (DLC)', 1290)] },
  { slug: 'baldurs-gate-3', title: "Baldur's Gate 3", year: 2023, developer: 'Larian Studios', publisher: 'Larian Studios', releaseDate: '3 ส.ค. 2566', genres: ['สวมบทบาท', 'ผจญภัย', 'วางแผน'], reviewPercent: 96, reviewCount: 692340, popularity: 96, hue: 18, editions: [edition('standard', 'Standard Edition', 1990), edition('deluxe', 'Digital Deluxe Edition', 2290)] },
  { slug: 'palworld', title: 'Palworld', year: 2024, developer: 'Pocketpair', publisher: 'Pocketpair', releaseDate: '19 ม.ค. 2567', genres: ['เอาชีวิตรอด', 'ผจญภัย', 'โลกเปิด'], reviewPercent: 93, reviewCount: 512880, popularity: 95, hue: 202, editions: [edition('standard', 'Standard Edition', 899)] },
  { slug: 'cyberpunk-2077', title: 'Cyberpunk 2077', year: 2020, developer: 'CD PROJEKT RED', publisher: 'CD PROJEKT RED', releaseDate: '10 ธ.ค. 2563', genres: ['สวมบทบาท', 'โลกเปิด', 'แอ็กชัน'], reviewPercent: 82, reviewCount: 748110, popularity: 94, hue: 54, editions: [edition('standard', 'Standard Edition', 1799), edition('complete', 'Ultimate Edition', 2290), edition('dlc', 'Phantom Liberty (DLC)', 990)] },
  { slug: 'valheim', title: 'Valheim', year: 2021, developer: 'Iron Gate AB', publisher: 'Coffee Stain Publishing', releaseDate: '2 ก.พ. 2564', genres: ['เอาชีวิตรอด', 'ก่อสร้าง', 'ผจญภัย'], reviewPercent: 94, reviewCount: 461220, popularity: 92, hue: 188, editions: [edition('standard', 'Standard Edition', 415)] },
  { slug: 'helldivers-2', title: 'HELLDIVERS 2', year: 2024, developer: 'Arrowhead Game Studios', publisher: 'PlayStation Publishing LLC', releaseDate: '8 ก.พ. 2567', genres: ['แอ็กชัน', 'ยิงมุมมองบุคคลที่สาม'], reviewPercent: 74, reviewCount: 372560, popularity: 89, hue: 44, editions: [edition('standard', 'Standard Edition', 1490), edition('bundle', 'Super Citizen Bundle', 1890)] },
  { slug: 'sons-of-the-forest', title: 'Sons Of The Forest', year: 2024, developer: 'Endnight Games Ltd', publisher: 'Newnight', releaseDate: '22 ก.พ. 2567', genres: ['เอาชีวิตรอด', 'สยองขวัญ'], reviewPercent: 88, reviewCount: 214300, popularity: 90, hue: 96, editions: [edition('standard', 'Standard Edition', 599)] },
  { slug: 'the-forest', title: 'The Forest', year: 2018, developer: 'Endnight Games Ltd', publisher: 'Endnight Games Ltd', releaseDate: '30 เม.ย. 2561', genres: ['เอาชีวิตรอด', 'สยองขวัญ', 'ผจญภัย'], reviewPercent: 92, reviewCount: 401760, popularity: 88, hue: 128, editions: [edition('standard', 'Standard Edition', 199), edition('bundle', 'Forest Collection Bundle', 719)] },
  { slug: 'rdr2', title: 'Red Dead Redemption 2', year: 2019, developer: 'Rockstar Games', publisher: 'Rockstar Games', releaseDate: '5 ธ.ค. 2562', genres: ['แอ็กชัน', 'ผจญภัย', 'โลกเปิด'], reviewPercent: 92, reviewCount: 552120, popularity: 87, hue: 10, editions: [edition('standard', 'Standard Edition', 1799), edition('complete', 'Ultimate Edition', 2190)] },
  { slug: 'stardew-valley', title: 'Stardew Valley', year: 2016, developer: 'ConcernedApe', publisher: 'ConcernedApe', releaseDate: '26 ก.พ. 2559', genres: ['อินดี้', 'จำลอง', 'สวมบทบาท'], reviewPercent: 98, reviewCount: 812470, popularity: 85, hue: 150, editions: [edition('standard', 'Standard Edition', 275)] },
  { slug: 'terraria', title: 'Terraria', year: 2011, developer: 'Re-Logic', publisher: 'Re-Logic', releaseDate: '16 พ.ค. 2554', genres: ['อินดี้', 'เอาชีวิตรอด', 'ก่อสร้าง'], reviewPercent: 97, reviewCount: 1102400, popularity: 82, hue: 168, editions: [edition('standard', 'Standard Edition', 199)] },
  { slug: 'it-takes-two', title: 'It Takes Two', year: 2021, developer: 'Hazelight Studios', publisher: 'Electronic Arts', releaseDate: '26 มี.ค. 2564', genres: ['ผจญภัย', 'เล่นร่วมกัน'], reviewPercent: 96, reviewCount: 189300, popularity: 78, hue: 306, editions: [edition('standard', 'Standard Edition', 990)] }
];

export const stores: Store[] = [
  { id: 'steam', name: 'Steam', initials: 'ST', type: 'steam', payments: ['บัตรเครดิต/เดบิต', 'TrueMoney Wallet', 'พร้อมเพย์', 'Steam Wallet'], feeRate: 0, feeLabel: '', note: 'ซื้อโดยตรงจาก Steam ประเทศไทย เปิดใช้งานได้แน่นอนและไม่มีค่าธรรมเนียมแฝง', websiteUrl: 'https://store.steampowered.com/' },
  { id: 'fanatical', name: 'Fanatical', initials: 'FA', type: 'official', payments: ['บัตรเครดิต/เดบิต', 'PayPal'], feeRate: 0, feeLabel: '', note: 'ตัวแทนจำหน่ายที่ได้รับอนุญาต คีย์มาจากผู้จัดจำหน่ายโดยตรง', websiteUrl: 'https://www.fanatical.com/' },
  { id: 'gamersgate', name: 'GamersGate', initials: 'GG', type: 'official', payments: ['บัตรเครดิต/เดบิต', 'PayPal'], feeRate: 0, feeLabel: '', note: 'ตัวแทนจำหน่ายที่ได้รับอนุญาต สต็อกคีย์บางรายการมีจำกัด', websiteUrl: 'https://www.gamersgate.com/' },
  { id: 'gamesplanet', name: 'Gamesplanet', initials: 'GP', type: 'official', payments: ['บัตรเครดิต/เดบิต', 'PayPal'], feeRate: 0, feeLabel: '', note: 'ตัวแทนจำหน่ายในยุโรป คีย์บางรายการจำกัดเฉพาะภูมิภาค EU', websiteUrl: 'https://us.gamesplanet.com/' },
  { id: 'gmg', name: 'Green Man Gaming', initials: 'GM', type: 'official', payments: ['บัตรเครดิต/เดบิต', 'PayPal'], feeRate: 0, feeLabel: '', note: 'ตัวแทนจำหน่ายที่ได้รับอนุญาต มีระบบคืนเงินตามเงื่อนไขของร้าน', websiteUrl: 'https://www.greenmangaming.com/' },
  { id: 'humble', name: 'Humble Store', initials: 'HB', type: 'official', payments: ['บัตรเครดิต/เดบิต', 'PayPal', 'Amazon Pay'], feeRate: 0, feeLabel: '', note: 'ตัวแทนจำหน่ายที่ได้รับอนุญาต ราคาอาจแสดงเป็น USD และถูกแปลงโดยผู้ออกบัตร', websiteUrl: 'https://www.humblebundle.com/store' },
  { id: 'cdkeys', name: 'CDKeys', initials: 'CD', type: 'reseller', payments: ['บัตรเครดิต/เดบิต', 'PayPal'], feeRate: 0, feeLabel: '', note: 'ผู้จำหน่ายคีย์รายใหญ่ ไม่ใช่ตัวแทนจำหน่ายอย่างเป็นทางการของผู้พัฒนาทุกราย', websiteUrl: 'https://www.cdkeys.com/' },
  { id: 'instant', name: 'Instant Gaming', initials: 'IG', type: 'reseller', payments: ['บัตรเครดิต/เดบิต', 'PayPal', 'Crypto'], feeRate: 0, feeLabel: '', note: 'จัดส่งคีย์อัตโนมัติ ตรวจสอบภูมิภาคที่ระบุบนหน้าสินค้าก่อนชำระเงิน', websiteUrl: 'https://www.instant-gaming.com/' },
  { id: 'eneba', name: 'Eneba', initials: 'EN', type: 'marketplace', payments: ['บัตรเครดิต/เดบิต', 'PayPal', 'Skrill', 'Google Pay'], feeRate: 0.052, feeLabel: 'ค่าบริการแพลตฟอร์ม', note: 'Marketplace ที่มีผู้ขายรายย่อยจำนวนมาก ภูมิภาคของคีย์ขึ้นกับผู้ขายแต่ละราย', websiteUrl: 'https://www.eneba.com/' },
  { id: 'kinguin', name: 'Kinguin', initials: 'KG', type: 'marketplace', payments: ['บัตรเครดิต/เดบิต', 'PayPal', 'Alipay'], feeRate: 0.049, feeLabel: 'Buyer Protection', note: 'ค่า Buyer Protection เป็นตัวเลือกเสริมแต่ถูกเลือกไว้ล่วงหน้าที่หน้าชำระเงิน', websiteUrl: 'https://www.kinguin.net/' }
];
