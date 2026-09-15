/* eslint-disable @next/next/no-html-link-for-pages */
export default function SiteHeader() {
  return (
    <nav className="nav shell" aria-label="Main navigation">
      <a className="brand" href="/#top" aria-label="Nicholas Medland, home">
        <span className="brand-mark" aria-hidden="true">NM</span>
        <span>Nicholas Medland</span>
      </a>
      <div className="nav-links">
        <a href="/#work">Projects</a>
        <a href="/resume">Resume</a>
        <a href="/games">Games</a>
        <a className="nav-contact" href="mailto:npm3@sfu.ca">Let&apos;s talk <span aria-hidden="true">↗</span></a>
      </div>
    </nav>
  );
}
