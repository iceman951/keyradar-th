import { t } from 'elysia';

export const editionCategorySchema = t.Union([
  t.Literal('standard'),
  t.Literal('deluxe'),
  t.Literal('complete'),
  t.Literal('dlc'),
  t.Literal('bundle')
]);

export const editionDtoSchema = t.Object({
  key: t.String(),
  name: t.String(),
  category: editionCategorySchema,
  steamPriceSatang: t.Number()
});

export const gameDtoSchema = t.Object({
  slug: t.String(),
  title: t.String(),
  year: t.Number(),
  developer: t.String(),
  publisher: t.String(),
  releaseDate: t.String(),
  genres: t.Array(t.String()),
  reviewPercent: t.Number(),
  reviewCount: t.Number(),
  popularity: t.Number(),
  hue: t.Number(),
  editions: t.Array(editionDtoSchema)
});

export const gameListQuery = t.Object({
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 })),
  sort: t.Optional(t.Union([t.Literal('popular'), t.Literal('release'), t.Literal('title')]))
});
