/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
  images: {
    domains: [
      'img.clerk.com',
      'images.unsplash.com',
      'cdn.transloadit.com',
      'uploads.transloadit.com',
    ],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
  webpack: (config) => {
    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      'bufferutil': 'commonjs bufferutil',
      'ffmpeg-static': 'commonjs ffmpeg-static',
      'ffprobe-static': 'commonjs ffprobe-static',
      'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
      'sharp': 'commonjs sharp',
    })
    return config
  },
}

module.exports = nextConfig