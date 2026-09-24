'use client';

import { useEffect, useRef, useState } from 'react';

type Algorithm = 'strategy' | 'backtracking';

const backtrackingCode = `function isValid(board, index, digit) {
  const row = Math.floor(index / 9);
  const column = index % 9;

  for (let cursor = 0; cursor < 9; cursor += 1) {
    if (board[row * 9 + cursor] === digit) return false;
    if (board[cursor * 9 + column] === digit) return false;
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxColumn = Math.floor(column / 3) * 3;
  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < 3; columnOffset += 1) {
      const boxIndex = (boxRow + rowOffset) * 9
        + boxColumn + columnOffset;
      if (board[boxIndex] === digit) return false;
    }
  }

  return true;
}

function solveWithBacktracking(startingBoard) {
  const board = [...startingBoard];

  function solve() {
    const emptyIndex = board.indexOf(0);
    if (emptyIndex === -1) return true;

    for (let digit = 1; digit <= 9; digit += 1) {
      if (!isValid(board, emptyIndex, digit)) continue;
      board[emptyIndex] = digit;

      if (solve()) return true;

      board[emptyIndex] = 0;
    }

    return false;
  }

  return solve() ? board : null;
}`;

const algorithms = {
  strategy: {
    title: 'Strategy solver',
    description: 'My original high-school Java program. The button above runs the same candidate lists, singles, hidden singles, and pair rules in the same order.',
  },
  backtracking: {
    title: 'Backtracking',
    description: 'Try a valid number. If it creates a dead end later, undo it and try the next one. Very short, very persistent, and mildly annoying in hindsight.',
  },
} as const;

export default function AlgorithmExplorer() {
  const [openAlgorithm, setOpenAlgorithm] = useState<Algorithm | null>(null);
  const [strategySource, setStrategySource] = useState('');
  const [sourceError, setSourceError] = useState(false);
  const closeButton = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    if (openAlgorithm !== 'strategy' || strategySource || sourceError) return;
    let cancelled = false;
    fetch('/games/Nicholas-SudokuGame.java.txt')
      .then((response) => {
        if (!response.ok) throw new Error('Could not load source');
        return response.text();
      })
      .then((source) => {
        if (!cancelled) setStrategySource(source);
      })
      .catch(() => {
        if (!cancelled) setSourceError(true);
      });
    return () => { cancelled = true; };
  }, [openAlgorithm, sourceError, strategySource]);

  useEffect(() => {
    if (!openAlgorithm) return;
    const previousFocus = document.activeElement as HTMLElement | null;
    const previousOverflow = document.body.style.overflow;
    const closeOnEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpenAlgorithm(null);
    };
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', closeOnEscape);
    closeButton.current?.focus();
    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener('keydown', closeOnEscape);
      previousFocus?.focus();
    };
  }, [openAlgorithm]);

  const selected = openAlgorithm ? algorithms[openAlgorithm] : null;
  const selectedCode = openAlgorithm === 'strategy'
    ? sourceError ? 'The original source file could not be loaded.' : strategySource || 'Loading the original Java file…'
    : backtrackingCode;

  return (
    <>
      <div className="algorithm-grid">
        {(Object.entries(algorithms) as Array<[Algorithm, typeof algorithms[Algorithm]]>).map(([key, algorithm], index) => (
          <article className="algorithm-card" key={key}>
            <span>{String(index + 1).padStart(2, '0')}</span>
            <h3>{algorithm.title}</h3>
            <p>{algorithm.description}</p>
            <button type="button" onClick={() => setOpenAlgorithm(key)}>Take a look <span aria-hidden="true">↗</span></button>
          </article>
        ))}
      </div>

      {selected && (
        <div className="algorithm-modal-backdrop" role="presentation" onMouseDown={(event) => {
          if (event.currentTarget === event.target) setOpenAlgorithm(null);
        }}>
          <section className="algorithm-modal" role="dialog" aria-modal="true" aria-labelledby="algorithm-modal-title">
            <header>
              <div><p>{openAlgorithm === 'strategy' ? 'My Code' : 'The version running here'}</p><h2 id="algorithm-modal-title">{selected.title}</h2></div>
              <button ref={closeButton} type="button" aria-label="Close algorithm" onClick={() => setOpenAlgorithm(null)}>×</button>
            </header>
            <pre><code>{selectedCode}</code></pre>
          </section>
        </div>
      )}
    </>
  );
}
