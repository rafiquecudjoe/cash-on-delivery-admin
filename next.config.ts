import type { NextConfig } from 'next';

const isDev = process.env.NODE_ENV !== 'production';
const apiOrigin = originOf(process.env.NEXT_PUBLIC_API_URL);
const minioOrigin = originOf(process.env.NEXT_PUBLIC_MINIO_URL);
const minioHost = hostOf(process.env.NEXT_PUBLIC_MINIO_URL);

// Next.js App Router injects inline bootstrap scripts; without nonce middleware
// 'unsafe-inline' for script-src stays. 'unsafe-eval' is only used by dev HMR.
const scriptSrc = ["'self'", "'unsafe-inline'", isDev && "'unsafe-eval'"]
  .filter(Boolean)
  .join(' ');

const imgSrc = ["'self'", 'data:', 'blob:', 'https:', minioOrigin].filter(Boolean).join(' ');
// MinIO origin is allow-listed: browser uploads PUT directly to presigned
// URLs at the MinIO host, which is a different origin from the API.
const connectSrc = ["'self'", apiOrigin, minioOrigin, isDev && 'ws:']
  .filter(Boolean)
  .join(' ');

const csp = [
  "default-src 'self'",
  `script-src ${scriptSrc}`,
  "style-src 'self' 'unsafe-inline'",
  `img-src ${imgSrc}`,
  "font-src 'self' data:",
  `connect-src ${connectSrc}`,
  "frame-ancestors 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  'upgrade-insecure-requests',
].join('; ');

const nextConfig: NextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      ...(minioHost ? [{ protocol: 'https' as const, hostname: minioHost }] : []),
      { protocol: 'https' as const, hostname: 'images.unsplash.com' },
    ],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          { key: 'Content-Security-Policy', value: csp },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=31536000; includeSubDomains',
          },
        ],
      },
    ];
  },
};

function originOf(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).origin;
  } catch {
    return '';
  }
}

function hostOf(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export default nextConfig;
