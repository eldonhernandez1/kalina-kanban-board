import type { Config } from 'tailwindcss'

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        'k-black': '#0a0a0a',
        'k-navy': '#0d1b35',
        'k-navy-mid': '#1a2a4a',
        'k-navy-light': '#2a3a5a',
        'k-gold': '#f5a623',
        'k-gray': '#e8e8e8',
        'k-white': '#f5f5f5',
      },
    },
  },
  plugins: [],
}
export default config
