import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Outfit', 'system-ui', 'sans-serif'],
        body: ['DM Sans', 'system-ui', 'sans-serif'],
        mono: ['DM Mono', 'ui-monospace', 'monospace'],
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        'warm-bg': '#F7F3F0',
        'charcoal': '#111319',
        'code-bg': '#020817',
        'text-primary': '#17151A',
        'cta-orange': {
          DEFAULT: '#FF6B35',
          hover: '#E65A2B',
        },
        'accent-green': '#059669',
        'accent-teal': '#0891B2',
        'accent-purple': '#8B5CF6',
      },
      animation: {
        'bounce-slow': 'bounce 4s infinite',
      },
    },
  },
  plugins: [],
};
export default config;
