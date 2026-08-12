export const formatRelativeMinutes = (minutes: number): string =>
  minutes < 60
    ? `${minutes} นาทีที่แล้ว`
    : `${Math.floor(minutes / 60)} ชม.ที่แล้ว`

/** Thai locale renders the Buddhist era, matching the dates written elsewhere. */
export const formatThaiDate = (date: Date): string =>
  date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  })

export const formatThaiDateTime = (date: Date): string =>
  `${formatThaiDate(date)} · ${date.toLocaleTimeString('th-TH', {
    hour: '2-digit',
    minute: '2-digit'
  })} น.`
