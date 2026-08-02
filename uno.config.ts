import { defineConfig } from 'unocss';
import presetWind3 from '@unocss/preset-wind3';

export default defineConfig({
  presets: [presetWind3()],
  shortcuts: {
    'page-pad': 'mx-auto max-w-[1320px] px-4 py-8 md:px-6 md:py-10 xl:px-7',
    'focus-ring': 'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent'
  },
  theme: {
    colors: {
      accent: 'var(--color-accent)',
      ink: 'var(--ink)',
      muted: 'var(--mute)',
      surface: 'var(--color-surface)'
    }
  }
});
