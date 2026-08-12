import { t } from 'elysia';

export const storeDtoSchema = t.Object({
  id: t.String(),
  name: t.String(),
  initials: t.String(),
  type: t.Union([
    t.Literal('steam'),
    t.Literal('official'),
    t.Literal('reseller'),
    t.Literal('marketplace')
  ]),
  payments: t.Array(t.String()),
  feeRateBps: t.Number(),
  feeLabel: t.String(),
  note: t.String(),
  websiteUrl: t.String()
});
