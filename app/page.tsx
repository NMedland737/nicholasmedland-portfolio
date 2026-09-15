'use client';
/* eslint-disable @next/next/no-img-element */

import { useEffect, useMemo, useState } from 'react';
import ModelViewer from './model-viewer';
import SiteHeader from './site-header';

type Category = 'Personal' | 'Commissioned' | 'School';
type Media = {
  type: 'image' | 'video' | 'model' | 'note';
  src?: string;
  alt: string;
  caption: string;
  detail?: string;
};
type Project = {
  id: string;
  title: string;
  category: Category;
  year: string;
  lede: string;
  description: string;
  tags: string[];
  challenge: string;
  learning: string;
  media: Media[];
};

const projects: Project[] = [
  {
    id: 'card-shuffler',
    title: 'Automated Card Shuffler',
    category: 'School',
    year: '2025',
    lede: 'A working electromechanical prototype designed to shuffle a standard deck at the press of a button.',
    description: 'I designed the mechanical system, iterated through 3D-printed parts, and integrated an Arduino with motors, sensors, buttons, and a remote. The project turned a deceptively simple action into a useful lesson in tolerances, testing, and physical systems.',
    tags: ['Arduino', 'Electronics', 'CAD', '3D Printing', 'Prototyping'],
    challenge: 'Move inconsistent playing cards reliably without jams, while keeping the machine compact and easy to operate.',
    learning: 'Small mechanical tolerances matter, and the fastest route to a reliable design is often to build, observe, and revise.',
    media: [
      { type: 'image', src: '/projects/card-shuffler/assembled.png', alt: 'Assembled automated card shuffler prototype', caption: 'Working prototype' },
      { type: 'image', src: '/projects/card-shuffler/system-diagram.jpeg', alt: 'Card shuffler electronics and control system diagram', caption: 'System design' },
      { type: 'video', src: '/projects/card-shuffler/demo.m4v', alt: 'Card shuffler prototype demonstration', caption: 'Prototype in motion' },
    ],
  },
  {
    id: 'to-go-containers',
    title: 'Custom Barware System',
    category: 'Commissioned',
    year: '2026',
    lede: 'A family of fitted organizers that keeps cups and glassware tidy, protected, and ready during busy service.',
    description: 'Created for a live hospitality environment, these pieces were measured, modelled, printed, and refined for the exact spaces where they would be used. The honeycomb construction keeps each part strong while limiting material and print time.',
    tags: ['Fusion 360', '3D Printing', 'Product Design', 'Client Work'],
    challenge: 'Fit awkward, high-traffic spaces and multiple container sizes without slowing down service.',
    learning: 'A useful product starts with watching how people actually work—not just measuring the available space.',
    media: [
      { type: 'image', src: '/projects/to-go-containers/installed.jpeg', alt: 'Custom black honeycomb organizers installed at a bar', caption: 'Installed on location' },
      { type: 'image', src: '/projects/to-go-containers/detail-one.jpeg', alt: 'Detail of custom cup and glass organizers', caption: 'Fitted compartments' },
      { type: 'image', src: '/projects/to-go-containers/detail-two.jpeg', alt: 'Another installed custom barware organizer', caption: 'Designed for service' },
      { type: 'model', src: '/projects/to-go-containers/coffee.glb', alt: 'Interactive 3D model of a to-go coffee cup organizer', caption: 'Coffee organizer — interactive 3D model' },
      { type: 'model', src: '/projects/to-go-containers/beer.glb', alt: 'Interactive 3D model of a beer glass organizer', caption: 'Beer organizer — interactive 3D model' },
      { type: 'model', src: '/projects/to-go-containers/wine.glb', alt: 'Interactive 3D model of a wine glass organizer', caption: 'Wine organizer — interactive 3D model' },
    ],
  },
  {
    id: 'fifa-trophy',
    title: 'FIFA World Cup Trophy Replica',
    category: 'Commissioned',
    year: '2026',
    lede: 'A large-format display prop built from a digital idea into a finished, event-ready centrepiece.',
    description: 'This project required breaking an organic form into manufacturable sections, assembling the full-scale structure, filling and finishing the surface, and completing a convincing metallic paint treatment.',
    tags: ['Large-Scale Fabrication', '3D Printing', 'Finishing', 'Assembly'],
    challenge: 'Translate a detailed sculptural object into printable sections while keeping the assembled form rigid and visually seamless.',
    learning: 'The last ten percent—surface preparation, assembly, and paint—can determine whether a prototype reads as a prop or a finished product.',
    media: [
      { type: 'image', src: '/projects/trophy/final.jpeg', alt: 'Finished large gold FIFA World Cup trophy replica', caption: 'Finished display piece' },
      { type: 'image', src: '/projects/trophy/fabrication.jpeg', alt: 'Black assembled trophy replica sections during fabrication', caption: 'Section assembly' },
      { type: 'image', src: '/projects/trophy/painting.jpeg', alt: 'Trophy replica components during priming and painting', caption: 'Surface preparation' },
    ],
  },
  {
    id: 'sfu-hub',
    title: 'SFU HUB',
    category: 'School',
    year: '2024',
    lede: 'A student-focused campus web app, built with a team to make everyday SFU information easier to find.',
    description: 'I worked primarily on the backend: building REST APIs, connecting data through Prisma, and writing tests so the app’s features stayed dependable as the project grew.',
    tags: ['TypeScript', 'REST APIs', 'Prisma', 'Unit Testing', 'Team Development'],
    challenge: 'Organize several student utilities behind a consistent, testable interface while coordinating work across a development team.',
    learning: 'Clear API contracts and tests make teamwork faster because everyone can build against shared expectations.',
    media: [
      { type: 'image', src: '/projects/sfu-hub/home.jpeg', alt: 'SFU HUB student website homepage', caption: 'Student dashboard' },
      { type: 'image', src: '/projects/sfu-hub/parking.jpeg', alt: 'SFU HUB parking information and campus map page', caption: 'Parking tool' },
      { type: 'note', alt: 'Backend development summary', caption: 'Backend contribution', detail: 'REST APIs · Prisma · Unit tests' },
    ],
  },
  {
    id: 'pop-can-holder',
    title: 'Service-Ready Can Holder',
    category: 'Commissioned',
    year: '2026',
    lede: 'A compact holder designed to keep cans organized and easy to reach in a working bar environment.',
    description: 'The final part was shaped around real containers and an existing station, then printed with a lightweight honeycomb structure. It is a small object, but a good example of design that quietly improves a repetitive task.',
    tags: ['CAD', '3D Printing', 'Rapid Iteration', 'Human-Centred Design'],
    challenge: 'Create a stable, durable organizer that fits a limited footprint and can handle everyday commercial use.',
    learning: 'Simple commissioned projects reward careful measurements, fast feedback, and respect for the person using the object every day.',
    media: [
      { type: 'image', src: '/projects/pop-can-holder/installed.jpeg', alt: 'Black honeycomb can holder installed at a bar', caption: 'Installed on location' },
      { type: 'image', src: '/projects/pop-can-holder/detail-one.jpeg', alt: 'Detail view of the can holder', caption: 'Honeycomb construction' },
      { type: 'image', src: '/projects/pop-can-holder/detail-two.jpeg', alt: 'Can holder loaded with cans and a bottle', caption: 'In daily use' },
      { type: 'model', src: '/projects/pop-can-holder/model.glb', alt: 'Interactive 3D model of the can holder', caption: 'Interactive 3D model' },
    ],
  },
  {
    id: 'thermostat-cover',
    title: 'Illuminated Thermostat Cover',
    category: 'Personal',
    year: '2026',
    lede: 'A clean wall cover that hides a thermostat and turns a practical object into a subtle illuminated feature.',
    description: 'I modelled the enclosure to sit neatly on the wall, designed the mounting details, and used light through the printed surface to create a playful SFU reveal after dark.',
    tags: ['CAD', '3D Printing', 'Lighting', 'Enclosure Design'],
    challenge: 'Hide an existing wall control without making access difficult or adding visual clutter to the room.',
    learning: 'Material thickness can be a visual tool: the same printed part can look solid in daylight and glow with detail at night.',
    media: [
      { type: 'image', src: '/projects/thermostat-cover/lit.jpeg', alt: 'Thermostat cover glowing red with an SFU mark at night', caption: 'Illuminated at night' },
      { type: 'image', src: '/projects/thermostat-cover/front.jpeg', alt: 'White thermostat cover installed on a wall', caption: 'Clean front view' },
      { type: 'image', src: '/projects/thermostat-cover/angle.jpeg', alt: 'Angled view of the installed thermostat cover', caption: 'Mounting detail' },
      { type: 'model', src: '/projects/thermostat-cover/model.glb', alt: 'Interactive 3D model of the thermostat cover', caption: 'Interactive 3D model' },
    ],
  },
];

const filters: Array<'All' | Category> = ['All', 'Personal', 'Commissioned', 'School'];

function MediaVisual({ media, compact = false }: { media: Media; compact?: boolean }) {
  if (media.type === 'image') {
    return <img src={media.src} alt={media.alt} loading={compact ? 'lazy' : 'eager'} />;
  }
  if (media.type === 'video') {
    return <video src={media.src} aria-label={media.alt} muted={compact} controls={!compact} playsInline preload="metadata" />;
  }
  if (media.type === 'model') {
    return <ModelViewer src={media.src!} alt={media.alt} compact={compact} />;
  }
  return <div className="media-note"><span>BACKEND</span><strong>Built for the team</strong><small>{media.detail}</small></div>;
}

function ProjectCard({ project, onGallery }: { project: Project; onGallery: (project: Project) => void }) {
  const previewMedia = project.media.filter((item) => item.type !== 'model').slice(0, 3);
  return (
    <article className="project-card" id={project.id}>
      <div className="project-media">
        {previewMedia.map((media, index) => (
          <figure className={`${index === 0 ? 'media-main' : 'media-small'} ${media.type === 'video' ? 'video-thumb' : ''}`} key={`${project.id}-${media.caption}`}>
            <MediaVisual media={media} compact />
            {media.type === 'video' && <span className="play" aria-hidden="true">▶</span>}
            <figcaption>{media.caption}</figcaption>
          </figure>
        ))}
        <button className="gallery-button" onClick={() => onGallery(project)}>
          <span aria-hidden="true">▦</span> View full gallery <b>{project.media.length}</b>
        </button>
      </div>

      <div className="project-copy">
        <div className="project-meta"><span className={`category-dot category-${project.category.toLowerCase()}`} /> {project.category} project <span>{project.year}</span></div>
        <h3>{project.title}</h3>
        <p className="project-lede">{project.lede}</p>
        <p>{project.description}</p>
        <div className="tag-block"><p>Tools &amp; skills</p><div className="tags">{project.tags.map((tag) => <span key={tag}>{tag}</span>)}</div></div>
        <details><summary><span><b>01</b> The challenge</span><i>+</i></summary><p>{project.challenge}</p></details>
        <details><summary><span><b>02</b> What I learned</span><i>+</i></summary><p>{project.learning}</p></details>
      </div>
    </article>
  );
}

export default function Home() {
  const [activeFilter, setActiveFilter] = useState<'All' | Category>('All');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const visibleProjects = useMemo(() => activeFilter === 'All' ? projects : projects.filter((project) => project.category === activeFilter), [activeFilter]);

  useEffect(() => {
    if (!selectedProject) return;
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape') setSelectedProject(null); };
    document.addEventListener('keydown', closeOnEscape);
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', closeOnEscape); document.body.style.overflow = ''; };
  }, [selectedProject]);

  return (
    <main>
      <SiteHeader />

      <section className="hero shell" id="top">
        <div className="hero-card">
          <p className="hero-label">Hello, I&apos;m</p>
          <h1>Nicholas Medland</h1>
          <p className="hero-role">Electronics Engineering Student</p>
          <p className="hero-intro">I combine electronics, mechanical design, fabrication, and software to turn ideas into working physical experiences. I&apos;m especially interested in interactive machines, robotics, and the small details that make technology feel delightful to use.</p>
          <div className="hero-actions"><a className="button button-primary" href="#work">Explore my work <span aria-hidden="true">↓</span></a></div>
        </div>
      </section>

      <section className="work shell" id="work">
        <div className="section-heading"><div><p className="eyebrow"><span /> Selected work</p><h2>Things I&apos;ve made.</h2></div><p className="section-intro">A mix of school, commissioned, and personal projects—each one built by getting hands-on and figuring things out.</p></div>
        <div className="filters" aria-label="Project categories">{filters.map((filter) => {
          const count = filter === 'All' ? projects.length : projects.filter((project) => project.category === filter).length;
          return <button key={filter} className={activeFilter === filter ? 'filter-active' : ''} aria-pressed={activeFilter === filter} onClick={() => setActiveFilter(filter)}>{filter} <span>{String(count).padStart(2, '0')}</span></button>;
        })}</div>
        <div className="project-list">{visibleProjects.map((project) => <ProjectCard key={project.id} project={project} onGallery={setSelectedProject} />)}</div>
      </section>

      <footer id="contact"><div className="shell footer-grid"><div><p className="eyebrow"><span /> What&apos;s next?</p><h2>Let&apos;s build something <em>real.</em></h2></div><div><p>I&apos;m open to electronics, prototyping, and interactive-systems opportunities.</p><a href="mailto:npm3@sfu.ca">npm3@sfu.ca ↗</a><br /><a href="/resume">View my résumé →</a><br /><a href="#top">Back to top ↑</a></div></div></footer>

      {selectedProject && <div className="modal-backdrop" onMouseDown={(event) => { if (event.currentTarget === event.target) setSelectedProject(null); }}>
        <section className="gallery-modal" role="dialog" aria-modal="true" aria-labelledby="gallery-title">
          <div className="modal-heading"><div><p className="eyebrow"><span /> Project gallery</p><h2 id="gallery-title">{selectedProject.title}</h2></div><button autoFocus onClick={() => setSelectedProject(null)} aria-label="Close gallery">Close <span aria-hidden="true">×</span></button></div>
          <div className="gallery-grid">{selectedProject.media.map((media, index) => <figure className={index === 0 ? 'gallery-wide' : media.type === 'model' ? 'gallery-model' : ''} key={`${selectedProject.id}-gallery-${index}`}><MediaVisual media={media} /><figcaption>{media.caption}{media.type === 'model' && <small>Drag to rotate · scroll to zoom</small>}</figcaption></figure>)}</div>
        </section>
      </div>}
    </main>
  );
}
