import type { Metadata } from 'next';
import { Fraunces, Sora, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import { Providers } from '@/components/providers';

const sora = Sora({
  variable: '--font-sora',
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  display: 'swap',
});

const fraunces = Fraunces({
  variable: '--font-fraunces',
  subsets: ['latin'],
  axes: ['SOFT', 'opsz'],
  display: 'swap',
});

const jbMono = JetBrains_Mono({
  variable: '--font-mono-jb',
  subsets: ['latin'],
  weight: ['400', '500'],
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'Cash on Delivery — Admin',
  description: 'Internal dashboard for Cash on Delivery Ghana',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${sora.variable} ${fraunces.variable} ${jbMono.variable} h-full antialiased`}
    >
      <body
        // Browser extensions (ColorZilla, etc.) inject attributes onto <body>
        // before React hydrates. Suppress the resulting React 18 hydration
        // warning — the SSR HTML is correct, it's just out of our control.
        suppressHydrationWarning
        className="min-h-full flex flex-col bg-background text-foreground"
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
