import Aura from '@primeng/themes/aura';
import { definePreset } from '@primeng/themes';

export const MyPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f7f5ff',
      100: '#dbceff',
      200: '#bea8ff',
      300: '#a181ff',
      400: '#855bff',
      500: '#6834ff',
      600: '#582cd9',
      700: '#4924b3',
      800: '#391d8c',
      900: '#2a1566',
      950: '#1a0d40',
    },
  },
});
