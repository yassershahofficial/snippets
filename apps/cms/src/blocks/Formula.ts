import type { Block } from 'payload'

export const FormulaBlock: Block = {
  slug: 'formula',
  interfaceName: 'FormulaBlock',
  labels: {
    singular: 'Formula',
    plural: 'Formulas',
  },
  admin: {
    components: {
      Block: '/blocks/FormulaBlockComponent#FormulaBlockComponent',
    },
  },
  fields: [
    {
      name: 'mode',
      type: 'select',
      defaultValue: 'simple',
      required: true,
      options: [
        { label: 'Simple (plain text)', value: 'simple' },
        { label: 'LaTeX', value: 'latex' },
      ],
      admin: {
        description:
          'Simple keeps words and spaces readable. Use LaTeX for fractions, powers, Greek letters, etc.',
      },
    },
    {
      name: 'latex',
      type: 'textarea',
      required: true,
      label: 'Formula',
      admin: {
        rows: 4,
        description:
          'Simple example: Required VRAM (GB) = (Parameters (Billions) x Precision (Bits))/8 x 1.2 — `/` renders as a fraction. LaTeX example: E = mc^2 or \\frac{a}{b}',
        placeholder: 'Required VRAM (GB) = (Parameters (Billions) x Precision (Bits))/8 x 1.2',
      },
    },
  ],
}
