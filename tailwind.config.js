/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Dark theme palette
                surface: {
                    DEFAULT: '#0f0f0f',
                    50: '#1a1a1a',
                    100: '#252525',
                    200: '#2f2f2f',
                    300: '#3a3a3a',
                },
                accent: {
                    DEFAULT: '#10b981', // Emerald green for Islamic theme
                    light: '#34d399',
                    dark: '#059669',
                },
                gold: {
                    DEFAULT: '#d4af37',
                    light: '#e4c45c',
                    dark: '#b4952f',
                }
            },
            fontFamily: {
                arabic: ['Amiri', 'serif'],
                sans: ['Inter', 'system-ui', 'sans-serif'],
            },
        },
    },
    plugins: [],
}
