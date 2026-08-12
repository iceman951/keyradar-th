import { t } from 'elysia'

export const pricePointDtoSchema = t.Object({
  date: t.String(),
  priceSatang: t.Number()
})
