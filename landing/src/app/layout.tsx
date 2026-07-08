import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'NOIZY.AI — Your Voice. Your Rules. Your Royalties.',
  description: 'Consent-native voice infrastructure. Every voice is sovereign. Every use is consensual. Every artist gets 75%.',
  keywords: ['voice AI', 'consent', 'voice sovereignty', 'AI ethics', 'voice actors', 'royalties'],
  authors: [{ name: 'Robert Stephen Plowman' }],
  openGraph: {
    title: 'NOIZY.AI — Your Voice. Your Rules. Your Royalties.',
    description: 'Consent-native voice infrastructure. Every voice is sovereign.',
    url: 'https://noizy.ai',
    siteName: 'NOIZY.AI',
    locale: 'en_CA',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'NOIZY.AI — Your Voice. Your Rules.',
    description: 'Consent-native voice infrastructure.',
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark">
      <body className="min-h-screen bg-noizy-bg text-noizy-text antialiased">
        {children}
      </body>
    </html>
  );
}
