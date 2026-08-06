/** Sentinel used while converting simple formulas to LaTeX. */
const TIMES = '\uE000'

function escapeLatexText(value: string): string {
  return value.replace(/[\\#$%&_{}]/g, (char) => `\\${char}`)
}

/**
 * Fold `/` into `\frac{num}{den}`: numerator is everything since the last
 * `=` or `+` (so `a × b / 8 × c` → `\frac{a × b}{8} × c`).
 */
function foldFractions(parts: string[]): string[] {
  const result: string[] = []
  let i = 0

  while (i < parts.length) {
    if (parts[i] === '/' && i + 1 < parts.length) {
      let start = 0
      for (let j = result.length - 1; j >= 0; j--) {
        if (result[j] === ' = ' || result[j] === ' + ') {
          start = j + 1
          break
        }
      }

      const numerator = result.splice(start).join('').trim()
      const denominator = parts[i + 1].trim()
      if (numerator && denominator) {
        result.push(`\\frac{${numerator}}{${denominator}}`)
        i += 2
        continue
      }

      // Fallback if something went wrong — keep literal slash
      result.push(...result.splice(start), '/', parts[i + 1])
      i += 2
      continue
    }

    result.push(parts[i])
    i += 1
  }

  return result
}

/**
 * Turn a human-readable formula into KaTeX.
 * Words stay upright with spaces; `x` / `×` / `*` become `\times`;
 * `/` becomes a stacked fraction.
 */
export function simpleFormulaToLatex(input: string): string {
  let source = input.trim()
  if (!source) return ''

  source = source.replace(/\s*[×⋅]\s*/g, TIMES)
  source = source.replace(/\s*\*\s*/g, TIMES)
  source = source.replace(/\s+[xX]\s+/g, TIMES)
  source = source.replace(/\)[xX*](?=[\d(])/g, `)${TIMES}`)
  source = source.replace(/(\d)[xX*](?=[\d(])/g, `$1${TIMES}`)

  // Split only on = + / numbers / times — keep () inside text labels.
  const tokenPattern = new RegExp(
    `${TIMES}|\\d+(?:\\.\\d+)?|[=+/]|[^\\d=+/*${TIMES}]+`,
    'g',
  )

  const parts: string[] = []
  for (const raw of source.match(tokenPattern) ?? []) {
    if (raw === TIMES) {
      parts.push(' \\times ')
      continue
    }
    if (/^\d+(?:\.\d+)?$/.test(raw)) {
      parts.push(raw)
      continue
    }
    if (/^[=+]$/.test(raw)) {
      parts.push(` ${raw} `)
      continue
    }
    if (raw === '/') {
      parts.push('/')
      continue
    }

    const inner = raw.replace(/\s+/g, ' ').trim()
    if (!inner) continue
    parts.push(`\\text{${escapeLatexText(inner)}}`)
  }

  return foldFractions(parts).join('').replace(/\s+/g, ' ').trim()
}

export function resolveFormulaLatex(expression: string, mode?: string | null): string {
  const trimmed = expression.trim()
  if (!trimmed) return ''

  const resolvedMode =
    mode === 'latex' || mode === 'simple'
      ? mode
      : trimmed.includes('\\')
        ? 'latex'
        : 'simple'

  return resolvedMode === 'simple' ? simpleFormulaToLatex(trimmed) : trimmed
}
