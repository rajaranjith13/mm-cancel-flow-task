import { randomInt } from 'crypto'
export type Variant = 'A' | 'B'
export function secureAB(): Variant {
  return randomInt(0, 2) === 0 ? 'A' : 'B'
}
