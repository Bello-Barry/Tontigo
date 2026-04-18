import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname:  '*.supabase.co',
        pathname:  '/storage/v1/object/public/**',
      },
    ],
    // Désactiver le cache pour les avatars (ils changent souvent)
    minimumCacheTTL: 60,
  },
}

export default nextConfig
