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
    description: 'Design and manufacture fitted containers, holders, organizers, and other parts for hospitality spaces. I take each job from site measurements and CAD through printed prototypes and final installation.',
    tags: ['Client collaboration', 'Autodesk Fusion', '3D printing', 'Iteration'],
  },
  {
    dates: 'Aug 2023 — Present',
    role: 'Premium Server & Bartender',
    place: 'Canucks Sports & Entertainment · Rogers Arena, Vancouver, BC',
    description: 'Provide fine-dining table and bar service in Rogers Arena’s most exclusive dining space, serving executives, VIPs, ownership, and other high-profile guests. The role requires discretion, consistency, and close attention to detail.',
    tags: ['Fine dining', 'VIP hospitality', 'Discretion', 'High-pressure service'],
  },
  {
    dates: 'Jun — Aug 2026',
    role: 'Server & Bartender',
    place: 'Private Events & Weddings · Vancouver, BC',
    description: 'Provided table and bar service at private events and weddings, helping with setup, service, guest requests, and close-down.',
    tags: ['Event service', 'Guest experience', 'Teamwork'],
  },
  {
    dates: 'Jun 2024 — Aug 2025',
    role: 'Technician',
    place: 'Lang’s Venture Inc · Langley, BC',
    description: 'Installed, troubleshot, and maintained lottery equipment for retailers, providing technical support and diagnostics when systems went down.',
    tags: ['Troubleshooting', 'Installation', 'Technical support'],
  },
  {
    dates: 'Sep — Nov 2024',
    role: 'Election Equipment Officer',
    place: 'Elections BC · Coquitlam, BC',
    description: 'Programmed and tested voting machines and office systems, set up election offices, and coordinated equipment for an election serving 23,116 voters.',
    tags: ['Equipment testing', 'Logistics', 'Operational reliability'],
  },
  {
    dates: 'Feb 2023 — Aug 2024',
    role: 'Cashier',
    place: 'Independent Grocers · Surrey, BC',
    description: 'Processed transactions, answered customer questions, and kept the checkout area organized during busy periods.',
    tags: ['Customer service', 'Point-of-sale', 'Accuracy'],
  },
  {
    dates: 'Feb 2024',
    role: 'Alternate Presiding Election Official',
    place: 'City of Coquitlam · Coquitlam, BC',
    description: 'Helped prepare the voting place, assist voters, issue ballots, and complete the required counting and documentation procedures.',
    tags: ['Election operations', 'Procedure compliance', 'Public service'],
  },
  {
    dates: 'Sep 2022',
    role: 'Information Officer',
    place: 'City of Surrey · Surrey, BC',
    description: 'Answered voter questions, directed line flow, and helped keep the voting process orderly and accessible.',
    tags: ['Voter assistance', 'Public service', 'Crowd flow'],
  },
  {
    dates: 'Oct 2015 — Jan 2022',
    role: 'Background Actor',
    place: 'Hollywood North · Surrey, BC',
    description: 'Worked on film and television productions, following direction, maintaining continuity, and adapting to long, changing schedules.',
    tags: ['Reliability', 'Adaptability', 'On-set professionalism'],
  },
  {
    dates: 'Sep — Dec 2021',
    role: 'Seasonal Sales Associate',
    place: 'Best Buy Canada · Langley, BC',
    description: 'Helped customers compare technology products and accessories and supported a busy retail floor during the holiday season.',
    tags: ['Product knowledge', 'Customer service', 'Retail operations'],
  },
];

export default function ResumePage() {
  return (
    <main>
      <SiteHeader />
      <section className="subpage-hero shell">
        <p className="eyebrow"><span /> Experience</p>
        <div className="subpage-title-row">
          <div><h1>Work,<br /><em>so far.</em></h1><p>I&apos;ve worked in technical service, fabrication, hospitality, events, and public operations. It is not a perfectly straight line, but every job has made me better at solving problems and working with people.</p></div>
          <a className="button button-primary download-button" href="/Nicholas-Medland-Resume.pdf" download>Download one-page résumé <span aria-hidden="true">↓</span></a>
        </div>
      </section>
      <section className="resume-list shell">
        {experience.map((item) => (
          <article key={item.role}>
            <time>{item.dates}</time>
            <div className="resume-entry"><h2>{item.role}</h2><p className="resume-place">{item.place}</p><p>{item.description}</p><div className="tags">{item.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
          </article>
        ))}
      </section>
      <footer className="subpage-footer"><div className="shell footer-grid"><div><p className="eyebrow"><span /> Short version</p><h2>One page.<br /><em>Everything important.</em></h2></div><div><a className="footer-download" href="/Nicholas-Medland-Resume.pdf" download>Download résumé ↓</a><br /><a href="/#work">Return to projects ←</a></div></div></footer>
    </main>
  );
}
