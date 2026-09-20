/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                // Light theme surface palette (ivory & crisp white)
                surface: {
                    DEFAULT: '#FFFFFF',
                    50: '#FBF9F5',
                    100: '#F3EFE6',
                    200: '#E6DFD3',
                    300: '#D5CCBD',
                },
                accent: {
                    DEFAULT: '#059669', // Emerald green 600
                    light: '#10b981',   // Emerald 500
                    dark: '#047857',    // Emerald 700
                },
                gold: {
                    DEFAULT: '#b48a28',
                    light: '#d4af37',
                    dark: '#926c1a',
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
