import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{js,ts,jsx,tsx}",
    "./components/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        sand:   { 50:'#faf8f5', 100:'#f3ede4', 200:'#e5d9c7', 400:'#bea07a', 500:'#a8835c', 600:'#8f6b47' },
        ocean:  { 50:'#edf7f9', 100:'#d1ecf1', 400:'#3a9fb5', 500:'#2a8099', 600:'#226677' },
        forest: { 50:'#eef5ee', 500:'#357538', 600:'#285c2b' },
        coral:  { 50:'#fff3f0', 500:'#f95340', 600:'#e03a28' },
      },
    },
  },
  plugins: [],
};

export default config;