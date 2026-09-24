/* eslint-disable @next/next/no-html-link-for-pages */
import type { Metadata } from 'next';
import SiteHeader from '../site-header';
import AlgorithmExplorer from './algorithm-explorer';
import SudokuGame from './sudoku-game';

export const metadata: Metadata = {
  title: 'Sudoku | Nicholas Medland',
  description: 'Play Sudoku and compare a human-style strategy solver with simple backtracking.',
  alternates: { canonical: '/games' },
  openGraph: {
    title: 'Sudoku | Nicholas Medland',
    description: 'The high-school Java project that took tens of hours—and the much shorter algorithm I learned a week later.',
    images: [],
  },
  twitter: {
    card: 'summary',
    title: 'Sudoku | Nicholas Medland',
    description: 'Play Sudoku and compare two very different ways to solve it.',
    images: [],
  },
};

export default function GamesPage() {
  return (
    <main className="games-page pip-paused">
      <SiteHeader />

      <section className="games-hero shell">
        <div>
          <p className="eyebrow"><span /> Games · 01</p>
          <h1>Sudoku.</h1>
          <p>I wrote my first Sudoku game in Java in high school, then spent tens of hours learning and programming actual Sudoku strategies so it could solve the puzzles the way a person would.</p>
        </div>
        <aside>
          <span>Small historical detail</span>
          <p>About a week after I finished, I learned what backtracking was.</p>
          <strong>That was a rough afternoon.</strong>
        </aside>
      </section>

      <section className="sudoku-section shell" aria-labelledby="sudoku-heading">
        <div className="section-heading games-section-heading">
          <div><p className="eyebrow"><span /> Play it</p><h2 id="sudoku-heading">Give it a try.</h2></div>
        </div>
        <SudokuGame />
      </section>

      <section className="games-algorithms shell" aria-labelledby="algorithms-heading">
        <div className="section-heading games-section-heading">
          <div><p className="eyebrow"><span /> Under the hood</p><h2 id="algorithms-heading">The two approaches.</h2></div>
          <p className="section-intro">One follows recognizable Sudoku logic. The other tries possibilities until something works.</p>
        </div>
        <AlgorithmExplorer />
      </section>

      <section className="games-story shell">
        <p className="eyebrow"><span /> What survived the experience</p>
        <div>
          <h2>There is more than one useful way to think.</h2>
          <div>
            <p>I originally wanted the computer to solve Sudoku the same way I did. That meant researching strategies, turning each one into rules, and finding a way for the program to explain its next move.</p>
            <p>Backtracking showed me that computers do not have to approach a problem like people do. My version is easier to follow and explain. Backtracking is much shorter and will happily check possibilities faster than I ever could.</p>
            <aside className="games-story-note">This was before ChatGPT, so it was mostly Stack Overflow, Googling every error, and no one around to tell me there was a much easier way to solve it.</aside>
          </div>
        </div>
      </section>

      <footer><div className="shell footer-grid"><div><p className="eyebrow"><span /> End of game one</p><h2>More experiments<br /><em>will show up here.</em></h2></div><div><p>For now, the engineering projects are probably the more responsible thing to look at.</p><a href="/#work">Return to projects ←</a><br /><a href="mailto:npm3@sfu.ca">Say hi ↗</a></div></div></footer>
    </main>
  );
}
