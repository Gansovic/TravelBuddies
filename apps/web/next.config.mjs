import withPWA from 'next-pwa';

/** @type {import('next').NextConfig} */
const nextConfig = {
  // PWA configuration for memory recording app
  // Enable offline-first capabilities for capture and sync
};

const pwaConfig = withPWA({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
  runtimeCaching: [
    // Cache pages for offline access
    {
      urlPattern: /^https?.*\.(js|css|html)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'static-assets',
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 30 * 24 * 60 * 60, // 30 days
        },
      },
    },
    // Cache API routes for offline functionality
    {
      urlPattern: /^\/api\/.*/,
      handler: 'NetworkFirst',
      options: {
        cacheName: 'api-cache',
        networkTimeoutSeconds: 10,
        expiration: {
          maxEntries: 100,
          maxAgeSeconds: 60 * 60 * 24, // 1 day
        },
      },
    },
    // Cache media files with size limits
    {
      urlPattern: /\.(jpg|jpeg|png|gif|webp|svg|mp4|webm|mp3|wav)$/,
      handler: 'CacheFirst',
      options: {
        cacheName: 'media-cache',
        expiration: {
          maxEntries: 200,
          maxAgeSeconds: 7 * 24 * 60 * 60, // 7 days
        },
      },
    },
  ],
});

export default pwaConfig(nextConfig);
