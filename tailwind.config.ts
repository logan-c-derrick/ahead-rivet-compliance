import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/lib/**/*.{js,ts,jsx,tsx,mdx}"
  ],
  theme: {
    extend: {
      colors: {
        "primary-fixed-dim": "#9ccaff",
        "surface-container-high": "#dce9ff",
        "surface-dim": "#cbdbf5",
        "on-secondary-fixed-variant": "#3a485b",
        "surface-variant": "#d3e4fe",
        "on-primary-container": "#87baf3",
        "surface-container-highest": "#d3e4fe",
        "inverse-on-surface": "#eaf1ff",
        "surface": "#f8f9ff",
        "on-tertiary-container": "#55ca99",
        "on-primary-fixed": "#001d35",
        "primary-container": "#004a7c",
        "surface-container-low": "#eff4ff",
        "on-secondary-fixed": "#0d1c2e",
        "on-secondary": "#ffffff",
        "secondary-fixed-dim": "#b9c7df",
        "on-tertiary": "#ffffff",
        "on-primary": "#ffffff",
        "secondary-fixed": "#d5e3fc",
        "on-error": "#ffffff",
        "outline-variant": "#c1c7d0",
        error: "#ba1a1a",
        "on-surface-variant": "#42474f",
        "surface-bright": "#f8f9ff",
        primary: "#003358",
        "on-tertiary-fixed": "#002114",
        "on-tertiary-fixed-variant": "#005137",
        "surface-container": "#e5eeff",
        "background": "#f8f9ff",
        "tertiary-fixed": "#85f8c4",
        outline: "#727780",
        "primary-fixed": "#d0e4ff",
        "inverse-primary": "#9ccaff",
        "tertiary-container": "#005238",
        secondary: "#515f74",
        "error-container": "#ffdad6",
        tertiary: "#003925",
        "surface-tint": "#296195",
        "on-secondary-container": "#57657a",
        "secondary-container": "#d5e3fc",
        "on-error-container": "#93000a",
        "on-surface": "#0b1c30",
        "on-background": "#0b1c30",
        "inverse-surface": "#213145",
        "tertiary-fixed-dim": "#68dba9",
        "surface-container-lowest": "#ffffff",
        "on-primary-fixed-variant": "#00497b"
      },
      fontFamily: {
        headline: ["var(--font-manrope)", "Manrope", "sans-serif"],
        body: ["var(--font-inter)", "Inter", "sans-serif"],
        label: ["var(--font-inter)", "Inter", "sans-serif"]
      },
      borderRadius: {
        DEFAULT: "0.125rem",
        lg: "0.25rem",
        xl: "0.5rem",
        full: "0.75rem"
      }
    }
  },
  plugins: []
};
export default config;
