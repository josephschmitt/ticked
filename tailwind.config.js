/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,jsx,ts,tsx}",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        // App tint (keeping purple)
        primary: '#6366f1',

        // iOS system colors
        ios: {
          red: '#FF3B30',
          orange: '#FF9500',
          yellow: '#FFCC00',
          green: '#34C759',
          teal: '#5AC8FA',
          blue: '#007AFF',
          purple: '#AF52DE',
          pink: '#FF2D55',
        },

        // iOS grays
        gray: {
          system: '#8E8E93',
          2: '#AEAEB2',
          3: '#C7C7CC',
          4: '#D1D1D6',
          5: '#E5E5EA',
          6: '#F2F2F7',
        },

        // Semantic backgrounds
        background: {
          primary: '#FFFFFF',
          grouped: '#F2F2F7',
          elevated: '#FFFFFF',
        },

        // Dark mode backgrounds
        'background-dark': {
          primary: '#000000',
          grouped: '#000000',
          elevated: '#1C1C1E',
        },

        // Labels
        label: {
          primary: '#000000',
          secondary: 'rgba(60,60,67,0.6)',
          tertiary: 'rgba(60,60,67,0.3)',
        },

        'label-dark': {
          primary: '#FFFFFF',
          secondary: 'rgba(235,235,245,0.6)',
          tertiary: 'rgba(235,235,245,0.3)',
        },

        // Separator
        separator: {
          DEFAULT: 'rgba(60,60,67,0.29)',
          dark: 'rgba(84,84,88,0.6)',
        },
      },
    },
  },
  plugins: [],
  darkMode: 'class',
};
