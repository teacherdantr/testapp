import type {NextConfig} from 'next';

const nextConfig: NextConfig = {
  
  experimental: {
    // @ts-ignore

    allowedDevOrigins: ['https://9000-firebase-studio-1748305557128.cluster-73qgvk7hjjadkrjeyexca5ivva.cloudworkstations.dev']
  },
  /* config options here */
  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'placehold.co',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
        port: '',
        pathname: '/**',
      }
    ],
  },
};

export default nextConfig;
