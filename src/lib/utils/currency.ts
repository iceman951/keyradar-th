const baht = new Intl.NumberFormat('th-TH', { maximumFractionDigits: 0 });

export const formatBaht = (satang: number): string => `฿${baht.format(Math.round(satang / 100))}`;
