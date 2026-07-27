export interface GameCard {
  slug: string;
  name: string;
  subtitle: string;
  image: string;
  status: 'live' | 'coming_soon';
  accent: string;
}

export const GAME_CARDS: GameCard[] = [
  {
    slug: 'ludo-classic',
    name: 'Ludo Classic',
    subtitle: 'Play classic 1v1 battles',
    image: '/assets/games/ludo-classic.png',
    status: 'live',
    accent: '#facc15',
  },
  {
    slug: 'ludo-speed',
    name: 'Ludo Speed',
    subtitle: 'Fast rounds, big wins',
    image: '/assets/games/ludo-speed.svg',
    status: 'coming_soon',
    accent: '#facc15',
  },
];

export const getGameBySlug = (slug: string) => GAME_CARDS.find((g) => g.slug === slug);
