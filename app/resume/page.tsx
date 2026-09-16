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
    dates: 'Jun — Aug 2026',
    role: 'Server & Bartender',
    place: 'Private Events & Weddings · Vancouver, BC',
    description: 'Provided table and bar service at private events and weddings, adapting to event schedules, guest needs, and changing service demands while helping with setup and close-down.',
    tags: ['Event service', 'Guest experience', 'Teamwork'],
  },
  {
    dates: 'Feb 2026 — Present',
    role: 'Designer & Fabricator',
    place: 'Freelance',
    description: 'Designing and manufacturing custom-fitted containers, holders, organizers, and components for quick-service stands and premium dining environments. I take projects from site measurements and CAD through iterative 3D-printed prototypes and installed final parts.',
    tags: ['Client collaboration', 'Autodesk Fusion', '3D printing', 'Iteration'],
  },
  {
    dates: 'Aug 2023 — Present',
    role: 'Premium Server & Bartender — Presidents Club',
    place: 'Canucks Sports & Entertainment · Rogers Arena, Vancouver, BC',
    description: 'Provide fine-dining table and bar service in Rogers Arena’s WELL Health Presidents Club, one of the arena’s most exclusive premium hospitality spaces. The club serves executives, VIPs, team ownership, and other high-profile guests in an environment modelled on the standards of Elisa’s award-winning steakhouse, making discretion, anticipation, and consistency essential.',
    tags: ['Fine dining', 'VIP hospitality', 'Discretion', 'High-pressure service'],
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
  {
    dates: 'Feb 2024',
    role: 'Alternate Presiding Election Official',
    place: 'City of Coquitlam · Coquitlam, BC',
    description: 'Supported election-day operations by preparing the voting place, assisting voters, issuing ballots, and following prescribed counting and documentation procedures.',
    tags: ['Election operations', 'Procedure compliance', 'Public service'],
  },
  {
    dates: 'Feb 2023 — Aug 2024',
    role: 'Cashier',
    place: 'Independent Grocers · Surrey, BC',
    description: 'Processed transactions accurately, assisted with customer questions, and kept the checkout area organized during high-volume periods.',
    tags: ['Customer service', 'Point-of-sale', 'Accuracy'],
  },
  {
    dates: 'Sep 2022',
    role: 'Information Officer',
    place: 'City of Surrey · Surrey, BC',
    description: 'Supported voters by answering questions, directing line flow, and helping maintain an orderly and accessible voting process.',
    tags: ['Voter assistance', 'Public service', 'Crowd flow'],
  },
  {
    dates: 'Sep — Dec 2021',
    role: 'Seasonal Sales Associate',
    place: 'Best Buy Canada · Langley, BC',
    description: 'Helped customers compare technology products and accessories, maintained product displays, and supported a busy retail floor during the holiday season.',
    tags: ['Product knowledge', 'Customer service', 'Retail operations'],
  },
  {
    dates: 'Oct 2015 — Jan 2022',
    role: 'Background Actor',
    place: 'Hollywood North · Surrey, BC',
    description: 'Worked on film and television productions, following direction, maintaining continuity, and adapting to long and changing production schedules.',
    tags: ['Reliability', 'Adaptability', 'On-set professionalism'],
  },
];

export default function ResumePage() {
  return (
    <main>
      <SiteHeader />
      <section className="subpage-hero shell">
        <p className="eyebrow"><span /> Work experience</p>
        <div className="subpage-title-row">
          <div><h1>Experience &amp;<br /><em>résumé.</em></h1><p>I&apos;ve worked across fabrication, technical service, live events, hospitality, and public operations. Each role has made me a more well-rounded engineer and a better teammate.</p></div>
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
