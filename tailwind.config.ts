import type { Config } from "tailwindcss";

export default {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        teal: {
          DEFAULT: "#0F6E5F",
          dark: "#0A4F44",
          light: "#E4F2EE",
        },
        gold: {
          DEFAULT: "#E8B44D",
          light: "#FBEFD6",
        },
        cream: "#FBF6EC",
        navy: "#1A3A3A",
        coral: "#F2786C",
      },
      fontFamily: {
        display: ["var(--font-lalezar)"],
        body: ["var(--font-tajawal)"],
      },
      borderRadius: {
        xl2: "1.25rem",
      },
      backgroundImage: {
        "star-pattern":
          "radial-gradient(circle at 1px 1px, rgba(15,110,95,0.08) 1px, transparent 0)",
      },
    },
  },
  plugins: [],
} satisfies Config;
