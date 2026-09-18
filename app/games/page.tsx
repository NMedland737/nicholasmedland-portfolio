/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from 'next';
import { PipMini } from '../pip';
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
    <main className="construction-page pip-paused">
      <SiteHeader />
      <section className="construction shell">
        <div className="construction-card">
          <div className="construction-orbit" aria-hidden="true"><span>✦</span><i /><b /></div>
          <div className="construction-pip"><PipMini /></div>
          <p className="eyebrow"><span /> Games</p>
          <h1>Games will live here.<br /><em>Eventually.</em></h1>
          <p>I want to use this page for small games and experiments. It is not ready yet, so the projects are probably more useful for now.</p>
          <a className="button button-primary" href="/#work">Go to the projects <span aria-hidden="true">→</span></a>
        </div>
      </section>
    </main>
  );
}
