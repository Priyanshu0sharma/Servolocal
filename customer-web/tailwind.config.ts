import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        servo: {
          green: "#078B35",
          "green-dark": "#075C2A",
          "green-light": "#EAF7EE",
          yellow: "#FFD52A",
          text: "#171717",
          "text-muted": "#666666",
          border: "#E8ECE9",
        },
      },
    },
  },
  plugins: [],
};

export default config;

