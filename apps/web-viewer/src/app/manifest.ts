import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Agency OS — Business Management',
    short_name: 'Agency OS',
    description: 'All-in-one CRM, POS, scheduling, and client management platform for 30+ industries.',
    start_url: '/admin',
    display: 'standalone',
    orientation: 'any',
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
    shortcuts: [
      {
        name: 'Point of Sale',
        short_name: 'POS',
        url: '/admin/pos',
        description: 'Ring up a sale',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Clock In',
        short_name: 'Clock In',
        url: '/admin/timeclock',
        description: 'Start your shift',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Calendar',
        short_name: 'Calendar',
        url: '/admin/calendar',
        description: 'View appointments',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
      {
        name: 'Client Portal',
        short_name: 'Portal',
        url: '/portal/dashboard',
        description: 'Customer self-service',
        icons: [{ src: '/icons/icon-192.png', sizes: '192x192' }],
      },
    ],
    screenshots: [],
  };
}
