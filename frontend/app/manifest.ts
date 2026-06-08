import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Homestead',
    short_name: 'Homestead',
    description: 'Find verified student hostels in Ghana',
    start_url: '/',
    display: 'standalone',
    background_color: '#F8FAFC',
    theme_color: '#006AFF',
    icons: [
      { src: '/favicon.ico', sizes: 'any', type: 'image/x-icon' },
    ],
  };
}
