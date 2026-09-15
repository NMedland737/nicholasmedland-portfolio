/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from 'next';
import SiteHeader from '../site-header';

export const metadata: Metadata = {
  title: 'Resume | Nicholas Medland',
  description: 'Professional experience and downloadable resume for Nicholas Medland.',
  alternates: { canonical: '/resume' },
  openGraph: {
    title: 'Resume | Nicholas Medland',
    description: 'Professional experience and downloadable resume for Nicholas Medland.',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'Resume | Nicholas Medland',
    description: 'Professional experience and downloadable resume for Nicholas Medland.',
    images: [],
  },
};

const experience = [
  {
    dates: 'Feb 2026 — Present',
    role: 'Designer & Fabricator',
    place: 'Freelance',
    description: 'Designing and manufacturing custom-fitted containers, holders, organizers, and components for quick-service stands and premium dining environments. I take projects from site measurements and CAD through iterative 3D-printed prototypes and installed final parts.',
    tags: ['Client collaboration', 'Autodesk Fusion', '3D printing', 'Iteration'],
  },
  {
    dates: 'Aug 2023 — Present',
    role: 'Premium Server & Bartender',
    place: 'Canucks Sports & Entertainment · Vancouver, BC',
    description: 'Delivering high-end dining experiences in a fast-moving live-event environment where preparation, clear communication, and dependable service standards matter.',
    tags: ['Communication', 'Teamwork', 'Guest experience'],
  },
  {
    dates: 'Jun 2024 — Aug 2025',
    role: 'Technician',
    place: 'Lang’s Venture Inc · Langley, BC',
    description: 'Installed, troubleshot, and maintained lottery equipment for retailers, providing technical support and diagnostics to minimize downtime.',
    tags: ['Troubleshooting', 'Installation', 'Technical support'],
  },
  {
    dates: 'Sep — Nov 2024',
    role: 'Election Equipment Officer',
    place: 'Elections BC · Coquitlam, BC',
    description: 'Programmed and tested voting machines and office systems, set up election offices, and coordinated equipment logistics for an election serving 23,116 voters.',
    tags: ['Equipment testing', 'Logistics', 'Operational reliability'],
  },
];

export default function ResumePage() {
  return (
    <main>
      <SiteHeader />
      <section className="subpage-hero shell">
        <p className="eyebrow"><span /> Work experience</p>
        <div className="subpage-title-row">
          <div><h1>Experience &amp;<br /><em>résumé.</em></h1><p>I&apos;ve worked across fabrication, technical service, live events, and public operations. Each role has made me a more practical engineer and a better teammate.</p></div>
          <a className="button button-primary download-button" href="/Nicholas-Medland-Resume.pdf" download>Download one-page résumé <span aria-hidden="true">↓</span></a>
        </div>
      </section>
      <section className="resume-list shell">
        {experience.map((item, index) => (
          <article key={item.role}>
            <div className="resume-number">{String(index + 1).padStart(2, '0')}</div>
            <time>{item.dates}</time>
            <div className="resume-entry"><h2>{item.role}</h2><p className="resume-place">{item.place}</p><p>{item.description}</p><div className="tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
          </article>
        ))}
      </section>
      <footer className="subpage-footer"><div className="shell footer-grid"><div><p className="eyebrow"><span /> Want the short version?</p><h2>Take the <em>one-pager.</em></h2></div><div><a className="footer-download" href="/Nicholas-Medland-Resume.pdf" download>Download résumé ↓</a><br /><a href="/#work">Return to projects ←</a></div></div></footer>
    </main>
  );
}
