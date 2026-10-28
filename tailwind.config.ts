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
        codechef: {
          dark: "#1e130c",
          primary: "#d4a373",
          accent: "#5b4034",
          badge: "#b5838d"
        }
      }
    },
  },
  plugins: [],
};
export default config;
