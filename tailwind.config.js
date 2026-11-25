/** @type {import('tailwindcss').Config} */
module.exports = {
  darkMode: "class",
  content: [
    "./src/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-jakarta)", "var(--font-inter)", "system-ui", "sans-serif"],
        mono: ["var(--font-mono)", "ui-monospace", "SFMono-Regular", "monospace"],
      },
      colors: {
        google: {
          blue: "#1A73E8",
          blueHover: "#1557B0",
          blueSoft: "#E8F0FE",
          tonal: "#D3E3FD",
          surface: "#F8FAFD",
          container: "#F0F4F9",
          red: "#D93025",
          yellow: "#F9AB00",
          green: "#188038",
          ink: "#1F1F1F",
          sub: "#444746",
          border: "#E3E8EF",
        },
      },
      boxShadow: {
        omnibox: "0 2px 8px rgba(60, 64, 67, 0.10), 0 6px 20px rgba(60, 64, 67, 0.06)",
        "omnibox-focus": "0 4px 16px rgba(26, 115, 232, 0.16), 0 1px 4px rgba(60, 64, 67, 0.10)",
        card: "0 1px 2px rgba(60, 64, 67, 0.06), 0 2px 8px rgba(60, 64, 67, 0.04)",
      },
    },
  },
  plugins: [],
};
