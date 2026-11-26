// Inline math in prose is written $…$. Dollar amounts use the same sign, so a segment counts as math only when
// the opening $ is not followed by a digit or a space and the closing $ is not followed by a digit:
// “$12 an hour … $18” stays text, “$x^2$” renders as math.
export const INLINE_MATH = /(\$(?![\d\s])[^$]+?\$(?!\d))/g
export const isMath = (part: string) => part.length > 2 && part.startsWith('$') && part.endsWith('$') && /^\$(?![\d\s])/.test(part)
export const splitMath = (text: string) => text.split(INLINE_MATH)
export const mathIn = (text: string) => [...text.matchAll(INLINE_MATH)].map((m) => m[1].slice(1, -1))
