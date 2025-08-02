/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        "primary-border-color": "#F97316",
        "primary-grey-50": "rgba(44, 44, 44, 0.86)",
        "secondary-grey-100": "#2C2C2C",
        "primary-orange": "#F97316",
        "primary-white": "#ffff",
        "primary-table": "#f5f5f5",
        "secondary-table": "#eee",
        "primary-green": "#008E42",
        "primary-red": "#B10003",
        "primary-grey-placeholder": "rgba(68, 68, 68, 0.6)",
        'status-available': '#10B981',
        'status-busy': '#EF4444',
        'status-away': '#F59E0B',
        'status-offline': '#6B7280',
        'text-orange':'#F97316'
        // 'primary-border-color': '#D1D5DB'
      },
      gridTemplateColumns: {
        'scheduler': 'minmax(120px, 200px) repeat(1, 1fr)',
      },
      borderRadius: {
        'common-border-radius': '12px',
        'card-common-border-radius': '8px',
      },
      boxShadow:{
        // "common-box-shadow": 'rgba(0, 0, 0, 0.15) 0px 2px 8px;'
      },
      flex: {
  2: "2 2 0%",
}

    },
  },
  plugins: [],
}
