import { customAlphabet } from 'nanoid'

// Custom alphabet excluding ambiguous characters (0/O, 1/l/I)
// ~10^21 combinations with 12 chars — extremely unlikely collisions
const alphabet = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz'

export const generateToken = customAlphabet(alphabet, 12)
