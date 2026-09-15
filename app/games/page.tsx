/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from 'next';
import SiteHeader from '../site-header';

export const metadata: Metadata = {
  title: 'Games | Nicholas Medland',
  description: 'An upcoming collection of small interactive games by Nicholas Medland.',
  alternates: { canonical: '/games' },
  openGraph: {
    title: 'Games | Nicholas Medland',
    description: 'An upcoming collection of small interactive games by Nicholas Medland.',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'Games | Nicholas Medland',
    description: 'An upcoming collection of small interactive games by Nicholas Medland.',
    images: [],
  },
};

export default function GamesPage() {
  return (
    <main className="construction-page">
      <SiteHeader />
      <section className="construction shell">
        <div className="construction-card">
          <div className="construction-orbit" aria-hidden="true"><span>✦</span><i /><b /></div>
          <p className="eyebrow"><span /> Games workshop</p>
          <h1>Something playful is<br /><em>under construction.</em></h1>
          <p>I&apos;ll be adding small games and interactive experiments here later. For now, the interesting things are over in my project workshop.</p>
          <a className="button button-primary" href="/#work">Explore my projects <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </main>
  );
}
