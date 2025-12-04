import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: "class",
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        spiced: {
          navy: '#17222B',
          burgundy: '#86373E',
          brown: '#44332D',
          peach: '#F1BD78',
          cream: '#EFD9C7',
          ivory: '#FBF8F0',
        },
      },
    },
  },
  plugins: [],
};

export default config;
