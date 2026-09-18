import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  metadataBase: new URL('https://nicholasmedland.com'),
  title: 'Nicholas Medland | Electronics & Prototyping',
  description: 'Electronics, mechanical design, software, and fabrication projects by Nicholas Medland.',
  openGraph: {
    title: 'Nicholas Medland | Electronics & Prototyping',
    description: 'Electronics, mechanical design, software, and fabrication projects by Nicholas Medland.',
    images: [{ url: '/og.png', width: 1200, height: 630, alt: 'Nicholas Medland — Electronics, prototyping, and things that work.' }],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Nicholas Medland | Electronics & Prototyping',
    description: 'Electronics, mechanical design, software, and fabrication projects by Nicholas Medland.',
    images: ['/og.png'],
  },
  alternates: { canonical: '/' },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
