/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Official Quimbaya Brand Palette
        jade: {
          950: '#041B1C',
          900: '#072E2F',
          800: '#0B4A4B', // Principal 1 (Verde Jade / Teal Oscuro)
          700: '#115F60',
          600: '#187B7C',
          500: '#239B9C',
          400: '#3CC1C2',
          100: '#E0F5F5',
        },
        hoja: {
          900: '#23491B',
          800: '#346A29',
          700: '#418233',
          600: '#539E43', // Principal 2 (Verde Hoja / Naturaleza)
          500: '#68BE56',
          400: '#87D776',
          100: '#EAF7E8',
        },
        madera: {
          950: '#381C09',
          900: '#522A0E',
          800: '#7A431D', // Base / Contraste (Marrón Madera / Tierra)
          700: '#945325',
          600: '#B06530',
          500: '#CC7B40',
          100: '#F7EDE6',
        },
        gold: {
          900: '#5E430B',
          800: '#8A6213',
          700: '#B3801D',
          600: '#D8A232', // Acento / Luminosidad (Dorado Quimbaya)
          500: '#F0BA4B',
          400: '#FCD477',
          300: '#FDE4A4',
          100: '#FFF8E7',
        },
        linen: {
          100: '#FAF7F2',
          200: '#F3EDE2',
          300: '#E6DCCF',
          400: '#C7B9A6',
          500: '#A4937E',
        },
        forest: '#051E1F',
      },
      fontFamily: {
        display: ['"Titan One"', '"Luckiest Guy"', 'cursive'],
        cartoon: ['"Luckiest Guy"', '"Titan One"', 'sans-serif'],
        fredoka: ['"Fredoka"', 'sans-serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 25px -5px rgba(216, 162, 50, 0.45)',
        'gold-glow-lg': '0 0 45px -5px rgba(216, 162, 50, 0.65)',
        'jade-glow': '0 0 30px -5px rgba(11, 74, 75, 0.6)',
        'hoja-glow': '0 0 30px -5px rgba(83, 158, 67, 0.5)',
      },
      backgroundImage: {
        'gold-gradient': 'linear-gradient(135deg, #FCD477 0%, #D8A232 50%, #B3801D 100%)',
        'wood-gradient': 'linear-gradient(135deg, #945325 0%, #7A431D 50%, #522A0E 100%)',
        'jade-gradient': 'linear-gradient(135deg, #187B7C 0%, #0B4A4B 50%, #072E2F 100%)',
        'hoja-gradient': 'linear-gradient(135deg, #68BE56 0%, #539E43 50%, #346A29 100%)',
      }
    },
  },
  plugins: [],
}
