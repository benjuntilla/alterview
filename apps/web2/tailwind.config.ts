import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        'alterview': {
          blue: '#4169E1',
          lightblue: '#4F86F7',
          skyblue: '#4682B4',
          indigo: '#5D3FD3',
          violet: '#8A2BE2',
          lavender: '#9370DB',
          purple: '#800080',
          darkblue: '#483D8B',
          periwinkle: '#6A5ACD',
        },
      },
      backgroundImage: {
        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
        "gradient-conic":
          "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
        'alterview-gradient': 'linear-gradient(to right, #4169E1, #5D3FD3, #800080)',
      },
      boxShadow: {
        'soft': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
        'card': '0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)',
        'apple': '0 8px 30px rgba(0, 0, 0, 0.12)',
      },
      keyframes: {
        shimmer: {
          '0%': { backgroundPosition: '-468px 0' },
          '100%': { backgroundPosition: '468px 0' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        breathe: {
          '0%, 100%': { transform: 'scale(1)' },
          '50%': { transform: 'scale(1.03)' },
        },
        fadeIn: {
          '0%': { opacity: '0', transform: 'translateY(10px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        scaleIn: {
          '0%': { opacity: '0', transform: 'scale(0.95)' },
          '100%': { opacity: '1', transform: 'scale(1)' },
        },
      },
      animation: {
        shimmer: 'shimmer 2s linear infinite',
        float: 'float 5s ease-in-out infinite',
        breathe: 'breathe 4s ease-in-out infinite',
        fadeIn: 'fadeIn 0.5s ease-out',
        scaleIn: 'scaleIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
      },
    },
  },
  plugins: [],
};
export default config;
