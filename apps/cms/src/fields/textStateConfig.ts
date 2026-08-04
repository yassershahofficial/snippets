/**
 * Shared TextStateFeature config — no Payload imports (safe for CMS + Astro).
 * Serialized on text nodes under the "$" key as { highlight: "mark" }.
 */
export const textStateConfig = {
  highlight: {
    mark: {
      label: 'Highlight',
      css: {
        'background-color': 'light-dark(#fef3c7, #3d3420)',
        color: 'light-dark(#161616, #f3f1ec)',
        'padding-inline': '0.15em',
      },
    },
  },
} as const

export const HIGHLIGHT_STATE_KEY = 'highlight'
export const HIGHLIGHT_STATE_VALUE = 'mark'
