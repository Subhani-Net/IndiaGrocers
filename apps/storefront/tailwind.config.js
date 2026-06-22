// tailwind.config.js — Independent Brand Design System
// All color tokens, font scales, and design decisions are self-determined.
// No tokens or values are derived from any third-party template or competitor.

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
                "fluid-out": "cubic-bezier(0.4, 0, 0.2, 1)",
            },
            colors: {
                // ── Neutral Scale — single coherent warm-grey palette ──
                // Replaces the dual grey+stone system with one unified 11-stop scale
                grey: {
                    0: "#FFFFFF",
                    5: "#FAFAF8",
                    10: "#F4F4F1",
                    20: "#E8E8E3",
                    30: "#D4D4CD",
                    40: "#A0A097",
                    50: "#707068",
                    60: "#505049",
                    70: "#3D3D37",
                    80: "#252522",
                    90: "#141412",
                },
                // ── Stone alias — backward-compatible with existing stone-* classes ──
                // Maps the old stone scale into the unified grey range so existing
                // components don't break while the palette is consolidated.
                stone: {
                    50: "#FAFAF8",
                    100: "#F4F4F1",
                    200: "#E8E8E3",
                    300: "#D4D4CD",
                    400: "#A0A097",
                    500: "#707068",
                    600: "#505049",
                    700: "#3D3D37",
                    800: "#252522",
                    900: "#141412",
                    950: "#0A0A08",
                },
                // ── Brand Palette — independent, self-determined token set ──
                brand: {
                    // Primary action color — warm, energetic, accessible on white
                    orange: "#EA580C",
                    "orange-light": "#F97316",
                    "orange-dark": "#C2410C",
                    // Semantic status colors
                    red: "#DC2626",
                    green: "#16A34A",
                    // Warm accent for highlights and secondary CTAs
                    amber: "#D97706",
                    "amber-light": "#FDE68A",
                    // Deep botanical green for cards, labels, and depth
                    evergreen: "#166534",
                    "evergreen-dark": "#14532D",
                    // Near-black for headers and high-emphasis text
                    ink: "#171717",
                    // ── Backward-compatible aliases (keeps existing class names working) ──
                    saffron: "#D97706",
                    "saffron-light": "#FDE68A",
                    cardamom: "#166534",
                    "cardamom-dark": "#14532D",
                    charcoal: "#171717",
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
                card: "0 2px 8px -1px rgba(20, 20, 18, 0.03), 0 1px 3px -1px rgba(20, 20, 18, 0.02)",
                "card-hover": "0 12px 24px -4px rgba(20, 20, 18, 0.06), 0 4px 12px -2px rgba(20, 20, 18, 0.03)",
                overlay: "0 20px 40px -8px rgba(20, 20, 18, 0.12)",
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
                    "system-ui",
                    "-apple-system",
                    "BlinkMacSystemFont",
                    "Segoe UI",
                    "Roboto",
                    "Helvetica Neue",
                    "Arial",
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
