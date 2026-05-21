import { Wallpaper } from '../types';

export const WALLPAPERS: Wallpaper[] = [
  {
    id: 'default',
    name: 'Quiet Oasis (Default)',
    cost: 0,
    imageSrc: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=800&q=80',
    unlocked: true,
    themeClass: 'from-[#0b0f19] via-[#111827] to-[#1e1b4b]',
    description: 'An elegant warm dark night theme with deep blue and gold twilight tones, responsive to your concentration.'
  },
  {
    id: 'mosque_shrine',
    name: 'Starry Mosque Silhouette',
    cost: 100,
    imageSrc: '/src/assets/images/mosque_starry_night_1779317339990.png',
    unlocked: false,
    themeClass: 'from-[#140b24] via-[#1a0f30] to-[#2e1065]',
    description: 'A serene geometric mosque blueprint set against a brilliant starry deep purple twilight sky.'
  },
  {
    id: 'golden_dawn',
    name: 'Golden Dawn Mountains',
    cost: 250,
    imageSrc: '/src/assets/images/golden_dawn_mountains_1779317356824.png',
    unlocked: false,
    themeClass: 'from-[#2e1005] via-[#451a03] to-[#78350f]',
    description: 'A calming sunrise over low misty mountain peaks, casting soft gold gradients into your focus workspace.'
  },
  {
    id: 'ambient_slate',
    name: 'Ambient Slate Flow',
    cost: 500,
    imageSrc: '/src/assets/images/ambient_slate_curves_1779317374114.png',
    unlocked: false,
    themeClass: 'from-[#1c1d22] via-[#2d2e36] to-[#454754]',
    description: 'Sophisticated modern curving patterns of clean slate charcoal and sand-textured gold highlight trims.'
  },
  {
    id: 'neon_geometry',
    name: 'Glowing Neon Sacred Patterns',
    cost: 1000,
    imageSrc: '/src/assets/images/neon_geometric_pattern_1779317389576.png',
    unlocked: false,
    themeClass: 'from-[#061d1f] via-[#0b2e31] to-[#115e59]',
    description: 'A high-contrast cyber-Islamic art wallpaper containing intricate vector shapes styled in vibrant gold neon grids.'
  }
];
