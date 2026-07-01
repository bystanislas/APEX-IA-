import type { Config } from "tailwindcss";

export default {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        apex: {
          gold: "#D4AF37",
          ink: "#0B0B0F",
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
