import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        bg: "#FAF8F4",
        text: { DEFAULT: "#1C1C1C", muted: "rgba(28,28,28,0.66)" },
        accent: { DEFAULT: "#B78B62", hover: "#A2774F" },
        "soft-gray": "#E8E2DA",
        "muted-pink": "#E9D6CF",
      },
      fontFamily: {
        serif: ["var(--font-serif)", "Georgia", "serif"],
        sans: [
          "var(--font-sans)",
          "-apple-system",
          "BlinkMacSystemFont",
          "sans-serif",
        ],
      },
      borderRadius: { sm: "4px", md: "8px", lg: "16px" },
      maxWidth: { content: "72rem" },
    },
  },
  plugins: [],
};

export default config;
