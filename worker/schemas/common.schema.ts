import { t } from 'elysia'

// Bounds from IMPLEMENTATION_SPEC.md §11.3.
export const slugParams = t.Object({
  slug: t.String({ minLength: 1, maxLength: 120 })
})

export const editionKeyQuery = t.Object({
  editionKey: t.Optional(t.String({ minLength: 1, maxLength: 80 }))
})

export const limitQuery = t.Object({
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 }))
})

export const searchQuery = t.Object({
  q: t.String({ minLength: 1, maxLength: 100 }),
  limit: t.Optional(t.Number({ minimum: 1, maximum: 100 }))
})

export const daysQuery = t.Object({
  days: t.Optional(t.Number({ minimum: 2, maximum: 365 }))
})

export const errorResponse = t.Object({
  error: t.Object({
    code: t.Union([
      t.Literal('VALIDATION_ERROR'),
      t.Literal('GAME_NOT_FOUND'),
      t.Literal('EDITION_NOT_FOUND'),
      t.Literal('DATABASE_ERROR'),
      t.Literal('INTERNAL_ERROR'),
      t.Literal('NOT_FOUND')
    ]),
    message: t.String(),
    details: t.Optional(t.Record(t.String(), t.Unknown()))
  })
})
