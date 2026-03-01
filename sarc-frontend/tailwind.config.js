/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        extend: {
            colors: {
                primary: '#800000', // Deep Maroon / Burgundy
                'primary-dark': '#5a0000', // Darker Maroon
                secondary: '#FFD700', // Gold Accent
                'secondary-light': '#FFE44D', // Lighter Gold
                accent: '#D4AF37', // Metallic Gold
                surface: '#FFFFFF',
                canvas: '#F8FAFC',
            },
            fontFamily: {
                heading: ['Poppins', 'sans-serif'],
                body: ['Inter', 'sans-serif'],
            },
            boxShadow: {
                'soft': '0 4px 20px -2px rgba(0, 0, 0, 0.05)',
            }
        }
    },
    plugins: [],
}
