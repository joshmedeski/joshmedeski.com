/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./src/**/*.{astro,html,js,jsx,md,mdx,svelte,ts,tsx,vue}"],
  theme: {
    extend: {
      colors: {
        foreground: {
          DEFAULT: "var(--color-foreground)",
        },
        background: {
          DEFAULT: "var(--color-background)",
        },
        primary: {
          50: "var(--color-primary-50)",
          100: "var(--color-primary-100)",
          200: "var(--color-primary-200)",
          300: "var(--color-primary-300)",
          400: "var(--color-primary-400)",
          500: "var(--color-primary-500)",
          600: "var(--color-primary-600)",
          700: "var(--color-primary-700)",
          800: "var(--color-primary-800)",
          900: "var(--color-primary-900)",
          DEFAULT: "var(--color-primary-default)",
          subtle: "var(--color-primary-subtle)",
        },

        cta: {
          50: "var(--color-cta-50)",
          100: "var(--color-cta-100)",
          200: "var(--color-cta-200)",
          300: "var(--color-cta-300)",
          400: "var(--color-cta-400)",
          500: "var(--color-cta-500)",
          600: "var(--color-cta-600)",
          700: "var(--color-cta-700)",
          800: "var(--color-cta-800)",
          900: "var(--color-cta-900)",
          DEFAULT: "var(--color-cta-default)",
          subtle: "var(--color-cta-subtle)",
        },

        uncommon: {
          50: "var(--color-uncommon-50)",
          100: "var(--color-uncommon-100)",
          200: "var(--color-uncommon-200)",
          300: "var(--color-uncommon-300)",
          400: "var(--color-uncommon-400)",
          500: "var(--color-uncommon-500)",
          600: "var(--color-uncommon-600)",
          700: "var(--color-uncommon-700)",
          800: "var(--color-uncommon-800)",
          900: "var(--color-uncommon-900)",
          DEFAULT: "var(--color-uncommon-default)",
          subtle: "var(--color-uncommon-subtle)",
        },

        white: "var(--color-white)",
        black: "var(--color-black)",

        neutral: {
          50: "var(--color-neutral-50)",
          100: "var(--color-neutral-100)",
          200: "var(--color-neutral-200)",
          300: "var(--color-neutral-300)",
          400: "var(--color-neutral-400)",
          500: "var(--color-neutral-500)",
          600: "var(--color-neutral-600)",
          700: "var(--color-neutral-700)",
          800: "var(--color-neutral-800)",
          900: "var(--color-neutral-900)",
          DEFAULT: "var(--color-neutral-default)",
          subtle: "var(--color-neutral-subtle)",
        },

        success: {
          50: "var(--color-success-50)",
          100: "var(--color-success-100)",
          200: "var(--color-success-200)",
          300: "var(--color-success-300)",
          400: "var(--color-success-400)",
          500: "var(--color-success-500)",
          600: "var(--color-success-600)",
          700: "var(--color-success-700)",
          800: "var(--color-success-800)",
          900: "var(--color-success-900)",
          DEFAULT: "var(--color-success-default)",
          subtle: "var(--color-success-subtle)",
        },

        error: {
          50: "var(--color-error-50)",
          100: "var(--color-error-100)",
          200: "var(--color-error-200)",
          300: "var(--color-error-300)",
          400: "var(--color-error-400)",
          500: "var(--color-error-500)",
          600: "var(--color-error-600)",
          700: "var(--color-error-700)",
          800: "var(--color-error-800)",
          900: "var(--color-error-900)",
          DEFAULT: "var(--color-error-default)",
          subtle: "var(--color-error-subtle)",
        },

        warning: {
          50: "var(--color-warning-50)",
          100: "var(--color-warning-100)",
          200: "var(--color-warning-200)",
          300: "var(--color-warning-300)",
          400: "var(--color-warning-400)",
          500: "var(--color-warning-500)",
          600: "var(--color-warning-600)",
          700: "var(--color-warning-700)",
          800: "var(--color-warning-800)",
          900: "var(--color-warning-900)",
          DEFAULT: "var(--color-warning-default)",
          subtle: "var(--color-warning-subtle)",
        },
        gh: {
          light: "#fafafa",
          dark: "#333333",
          link: "#4678be"
        }
      },
    },
  },
  plugins: [require("@tailwindcss/typography")],
};
