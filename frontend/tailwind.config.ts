import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14171F",
        paper: "#F4F5F7",
        line: "#E2E5EA",
        muted: "#6B7280",
        accent: {
          DEFAULT: "#1F6FEB",
          dark: "#1A5FCC",
          soft: "#E8F0FE",
        },
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "Segoe UI", "Arial", "sans-serif"],
      },
      borderRadius: {
        DEFAULT: "8px",
      },
    },
  },
  plugins: [],
};

export default config;
