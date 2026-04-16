import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Designed by Anthony — Client Portal',
    short_name: 'DBA Portal',
    description: 'Manage your project, view milestones, and get support from Designed by Anthony.',
    start_url: '/portal/dashboard',
    display: 'standalone',
    orientation: 'portrait',
    background_color: '#0f1218',
    theme_color: '#2563eb',
    categories: ['business', 'productivity'],
    icons: [
      {
        src: '/icons/icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/icons/icon-512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
    screenshots: [],
  };
}
