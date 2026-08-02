export const formatRelativeMinutes = (minutes: number): string =>
  minutes < 60 ? `${minutes} นาทีที่แล้ว` : `${Math.floor(minutes / 60)} ชม.ที่แล้ว`;
