/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        void: "var(--color-void)",
        space: "var(--color-space)",
        nebula: "var(--color-nebula)",
        star: "var(--color-star)",
        comet: "var(--color-comet)",
        plasma: "var(--color-plasma)",
        nova: "var(--color-nova)",
        gold: "var(--color-gold)",
        success: "var(--color-success)",
        danger: "var(--color-danger)",
      },
      fontFamily: {
        display: ["var(--font-display)", "serif"],
        body: ["var(--font-body)", "sans-serif"],
      },
    },
  },
  plugins: [],
};
