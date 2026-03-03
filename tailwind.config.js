/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{html,ts}"],
  darkMode: 'class', // Enables class-based dark mode toggling
  theme: {
    extend: {
      colors: {
        // 🌞 Light Mode Colors
        "primary-border-color": "#fb923c",
        "primary-grey-50": "rgba(44, 44, 44, 0.86)",
        "secondary-grey-100": "#2C2C2C",
        "primary-orange": "#fb923c",
        "primary-white": "#ffff",
        "primary-table": "#f5f5f5",
        "secondary-lightColor": "#F9F4F1",
        "secondary-table": "#eee",
        "primary-green": "#008E42",
        "primary-red": "#B10003",
        "primary-grey-placeholder": "rgba(68, 68, 68, 0.6)",
        "text-orange": "#fb923c",

        // ✅ Status Colors
        "status-available": "#10B981",
        "status-busy": "#EF4444",
        "status-away": "#F59E0B",
        "status-offline": "#6B7280",

        // 🎨 Primary Palette
        primary: {
          50: '#FFF9F5',
          100: '#FFF2E8',
          200: '#FFE5D1',
          300: '#FFD8BA',
          400: '#FFCAA3',
          500: '#FFA157',
          600: '#E6914E',
          700: '#CC8145',
          800: '#B3713C',
          900: '#996133',
          950: '#80512A',
        },

        // 🎨 Secondary Palette
        secondary: {
          50: '#f8fafc',
          100: '#f1f5f9',
          200: '#e2e8f0',
          300: '#cbd5e1',
          400: '#94a3b8',
          500: '#64748b',
          600: '#475569',
          700: '#334155',
          800: '#1e293b',
          900: '#0f172a',
        },

        // 🍦 Cream Palette
        cream: {
          50: '#FEFCFB',
          100: '#FDF9F6',
          200: '#FBF3ED',
          300: '#F9F4F1',
          400: '#F7F0E9',
          500: '#F5EBE1',
          600: '#E8D4C4',
          700: '#DBBDA7',
          800: '#CEA68A',
          900: '#C1906D',
        },

        // 🌚 Dark Mode Overrides (optional custom tokens)
        dark: {
          bg: '#0f172a',
          surface: '#1e293b',
          border: '#334155',
          text: '#f1f5f9',
          muted: '#64748b',
          accent: '#FFA157',
        },
      },

      // 🧱 Layout Utilities
      gridTemplateColumns: {
        scheduler: 'minmax(120px, 200px) repeat(1, 1fr)',
      },

      // 🟦 Border Radius
      borderRadius: {
        'common-border-radius': '12px',
        'card-common-border-radius': '8px',
      },

      // 🧩 Shadows (optional)
      boxShadow: {
        // "common-box-shadow": 'rgba(0, 0, 0, 0.15) 0px 2px 8px;'
      },

      // 📐 Flex Utilities
      flex: {
        2: "2 2 0%",
      },

      animation: {
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
