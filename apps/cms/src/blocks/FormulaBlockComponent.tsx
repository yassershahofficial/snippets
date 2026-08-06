'use client'

import { BlockCollapsible } from '@payloadcms/richtext-lexical/client'
import { useFormFields } from '@payloadcms/ui'
import katex from 'katex'
import { useLayoutEffect, useMemo, useRef } from 'react'
import 'katex/dist/katex.min.css'

import { resolveFormulaLatex } from './formulaMath'

const MIN_PX = 11

function fitFormula(block: HTMLElement) {
  const display = block.querySelector('.katex-display, .katex')
  if (!(display instanceof HTMLElement)) return

  if (!block.dataset.formulaBaseSize) {
    block.dataset.formulaBaseSize = String(parseFloat(getComputedStyle(block).fontSize) || 18)
  }

  let lo = MIN_PX
  let hi = Number(block.dataset.formulaBaseSize)
  block.style.fontSize = `${hi}px`
  if (display.scrollWidth <= block.clientWidth + 1) return

  while (hi - lo > 0.35) {
    const mid = (lo + hi) / 2
    block.style.fontSize = `${mid}px`
    if (display.scrollWidth <= block.clientWidth + 1) lo = mid
    else hi = mid
  }
  block.style.fontSize = `${lo}px`
}

export function FormulaBlockComponent() {
  const modeField = useFormFields(([fields]) => fields.mode)
  const latexField = useFormFields(([fields]) => fields.latex)
  const mode = typeof modeField?.value === 'string' ? modeField.value : 'simple'
  const expression = typeof latexField?.value === 'string' ? latexField.value : ''
  const previewRef = useRef<HTMLDivElement>(null)

  const html = useMemo(() => {
    const source = resolveFormulaLatex(expression, mode)
    if (!source) return ''
    try {
      return katex.renderToString(source, {
        throwOnError: false,
        displayMode: true,
        output: 'html',
        strict: 'ignore',
      })
    } catch {
      return ''
    }
  }, [expression, mode])

  useLayoutEffect(() => {
    const el = previewRef.current
    if (!el || !html) return

    delete el.dataset.formulaBaseSize
    fitFormula(el)

    const observer = new ResizeObserver(() => fitFormula(el))
    observer.observe(el)
    return () => observer.disconnect()
  }, [html])

  return (
    <BlockCollapsible>
      {html ? (
        <div
          ref={previewRef}
          className="formula-block-preview"
          style={{
            overflow: 'hidden',
            padding: '0.85rem 0.5rem',
            textAlign: 'center',
            width: '100%',
          }}
          dangerouslySetInnerHTML={{ __html: html }}
        />
      ) : (
        <p
          style={{
            margin: 0,
            padding: '0.85rem 0.5rem',
            color: 'var(--theme-elevation-500)',
            textAlign: 'center',
          }}
        >
          Edit to enter a formula — preview appears here
        </p>
      )}
    </BlockCollapsible>
  )
}
