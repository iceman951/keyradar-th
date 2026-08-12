import { drizzle } from 'drizzle-orm/d1'
import * as schema from './schema'
import type { Bindings } from '../bindings'

export type Database = ReturnType<typeof drizzle<typeof schema>>

export const createDb = (env: Bindings): Database => drizzle(env.DB, { schema })
