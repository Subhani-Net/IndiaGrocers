// tailwind.config.js - Copy and replace into your file
const path = require("path")

module.exports = {
    darkMode: "class",
    presets: [require("@medusajs/ui-preset")],
    content: [
        "./src/app/**/*.{js,ts,jsx,tsx}",
        "./src/pages/**/*.{js,ts,jsx,tsx}",
        "./src/components/**/*.{js,ts,jsx,tsx}",
        "./src/modules/**/*.{js,ts,jsx,tsx}",
        "./node_modules/@medusajs/ui/dist/**/*.{js,jsx,ts,tsx}",
    ],
    theme: {
        extend: {
            transitionProperty: {
                width: "width margin",
                height: "height",
                bg: "background-color",
                display: "display opacity",
                visibility: "visibility",
                padding: "padding-top padding-right padding-bottom padding-left",
                all: "all",
            },
            transitionTimingFunction: {
                "fluid-out": "cubic-bezier(0.4, 0, 0.2, 1)", // Premium friction curve
            },
            colors: {
                // Sophisticated, warm editorial slate tones
                grey: {
                    0: "#FFFFFF",
                    5: "#FBFBFA",
                    10: "#F5F5F3",
                    20: "#EAEAE6",
                    30: "#D6D6D0",
                    40: "#A3A39C",
                    50: "#73736D",
                    60: "#52524E",
                    70: "#3F3F3C",
                    80: "#262624",
                    90: "#171716",
                },
                // Warm Stones — muted London culinary palette for text/borders
                stone: {
                    50: "#fafaf9",
                    100: "#f5f5f4",
                    200: "#e7e5e4",
                    300: "#d6d3d1",
                    400: "#a8a29e",
                    500: "#78716c",
                    600: "#57534e",
                    700: "#44403c",
                    800: "#292524",
                    900: "#1c1917",
                    950: "#0c0a09",
                },
                // Premium South Asian Organic Accents
                brand: {
                    orange: "#FF6B35",
                    "orange-light": "#FF8C5A",
                    "orange-dark": "#E55A2B",
                    red: "#EF4444",
                    green: "#22C55E",
                    saffron: "#D97706",
                    "saffron-light": "#FBBF24",
                    cardamom: "#2E6F40", // High-end organic grocery signature
                    "cardamom-dark": "#1B4726",
                    charcoal: "#1F2421",
                },
            },
            borderRadius: {
                none: "0px",
                soft: "3px",
                base: "6px",
                rounded: "12px",
                large: "20px",
                circle: "9999px",
            },
            boxShadow: {
                card: "0 2px 8px -1px rgba(23, 23, 22, 0.03), 0 1px 3px -1px rgba(23, 23, 22, 0.02)",
                "card-hover": "0 12px 24px -4px rgba(23, 23, 22, 0.06), 0 4px 12px -2px rgba(23, 23, 22, 0.03)",
                overlay: "0 20px 40px -8px rgba(23, 23, 22, 0.12)",
            },
            maxWidth: {
                "8xl": "100rem",
            },
            screens: {
                "2xsmall": "320px",
                xsmall: "512px",
                small: "1024px",
                medium: "1280px",
                large: "1440px",
                xlarge: "1680px",
                "2xlarge": "1920px",
            },
            fontSize: {
                "3xl": "2rem",
            },
            fontFamily: {
                sans: [
                    "Inter",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "Roboto",
                    "sans-serif",
                ],
            },
            keyframes: {
                "sheet-slide-up": {
                    "0%": { transform: "translateY(100%)" },
                    "100%": { transform: "translateY(0)" },
                },
                "fade-in": {
                    "0%": { opacity: "0" },
                    "100%": { opacity: "1" },
                },
                "drawer-slide-in": {
                    "0%": { transform: "translateX(-100%)" },
                    "100%": { transform: "translateX(0)" },
                },
                "drawer-slide-out": {
                    "0%": { transform: "translateX(0)" },
                    "100%": { transform: "translateX(-100%)" },
                },
                "drawer-push-in": {
                    "0%": { transform: "translateX(100%)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
                "drawer-push-out": {
                    "0%": { transform: "translateX(0)", opacity: "1" },
                    "100%": { transform: "translateX(-30%)", opacity: "0" },
                },
                "drawer-pop-in": {
                    "0%": { transform: "translateX(-30%)", opacity: "0" },
                    "100%": { transform: "translateX(0)", opacity: "1" },
                },
                "accordion-down": {
                    "0%": { height: "0", opacity: "0" },
                    "100%": { height: "var(--radix-accordion-content-height)", opacity: "1" },
                },
                "accordion-up": {
                    "0%": { height: "var(--radix-accordion-content-height)", opacity: "1" },
                    "100%": { height: "0", opacity: "0" },
                },
            },
            animation: {
                "sheet-up": "sheet-slide-up 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
                "fade-in": "fade-in 180ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
                "drawer-in": "drawer-slide-in 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
                "drawer-out": "drawer-slide-out 200ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
                "drawer-push-forward": "drawer-push-in 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
                "drawer-push-back": "drawer-pop-in 250ms cubic-bezier(0.4, 0, 0.2, 1) forwards",
                "accordion-down": "accordion-down 200ms cubic-bezier(0.4, 0, 0.2, 1)",
                "accordion-up": "accordion-up 200ms cubic-bezier(0.4, 0, 0.2, 1)",
            },
        },
    },
    plugins: [require("tailwindcss-radix")()],
}
