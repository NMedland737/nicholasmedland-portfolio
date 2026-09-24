'use client';

import { useMemo, useRef, useState } from 'react';

type StrategyStep = {
  index: number;
  value: number;
  reason: string;
};

const DIGITS = [1, 2, 3, 4, 5, 6, 7, 8, 9];

const PUZZLES = [
  {
    name: 'Puzzle 01',
    grid: '000006950020004000003000004000059308000103000901780000600000200000400080089500000',
  },
  {
    name: 'Puzzle 02',
    grid: '700060030050001206002000040000000060800005000003010907009070102000000400030900000',
  },
  {
    name: 'Puzzle 03',
    grid: '500004000030070069000005780005200008020000090400009300069300000340010070008400003',
  },
  {
    name: 'Puzzle 04',
    grid: '007030004205704600000008927008047050002080400040290800184500000003809105700060300',
  },
];

function boardFromString(grid: string): number[] {
  return [...grid].map(Number);
}

type ConflictKind = 'given' | 'user' | null;

function cellsShareAUnit(first: number, second: number): boolean {
  const firstRow = Math.floor(first / 9);
  const firstColumn = first % 9;
  const secondRow = Math.floor(second / 9);
  const secondColumn = second % 9;
  return firstRow === secondRow
    || firstColumn === secondColumn
    || (Math.floor(firstRow / 3) === Math.floor(secondRow / 3)
      && Math.floor(firstColumn / 3) === Math.floor(secondColumn / 3));
}

function findConflicts(board: number[], startingBoard: number[]): ConflictKind[] {
  const conflicts: ConflictKind[] = Array(81).fill(null);

  for (let first = 0; first < board.length - 1; first += 1) {
    if (board[first] === 0) continue;
    for (let second = first + 1; second < board.length; second += 1) {
      if (board[first] !== board[second] || !cellsShareAUnit(first, second)) continue;
      const kind: ConflictKind = startingBoard[first] !== 0 || startingBoard[second] !== 0 ? 'given' : 'user';
      if (kind === 'given' || conflicts[first] === null) conflicts[first] = kind;
      if (kind === 'given' || conflicts[second] === null) conflicts[second] = kind;
    }
  }

  return conflicts;
}

function candidatesFor(board: number[], index: number): number[] {
  if (board[index] !== 0) return [];
  const row = Math.floor(index / 9);
  const column = index % 9;
  const used = new Set<number>();

  for (let cursor = 0; cursor < 9; cursor += 1) {
    used.add(board[row * 9 + cursor]);
    used.add(board[cursor * 9 + column]);
  }

  const boxRow = Math.floor(row / 3) * 3;
  const boxColumn = Math.floor(column / 3) * 3;
  for (let rowOffset = 0; rowOffset < 3; rowOffset += 1) {
    for (let columnOffset = 0; columnOffset < 3; columnOffset += 1) {
      used.add(board[(boxRow + rowOffset) * 9 + boxColumn + columnOffset]);
    }
  }

  return DIGITS.filter((digit) => !used.has(digit));
}

function isSolved(board: number[]): boolean {
  return board.every((value) => value !== 0) && board.every((value, index) => candidatesFor([...board.slice(0, index), 0, ...board.slice(index + 1)], index).includes(value));
}

function solveWithBacktracking(start: number[]): { board: number[]; attempts: number } | null {
  const board = [...start];
  let attempts = 0;

  const solve = (): boolean => {
    const emptyIndex = board.indexOf(0);
    if (emptyIndex === -1) return true;

    for (const digit of candidatesFor(board, emptyIndex)) {
      attempts += 1;
      board[emptyIndex] = digit;
      if (solve()) return true;
      board[emptyIndex] = 0;
    }
    return false;
  };

  return solve() ? { board, attempts } : null;
}

function solveWithNicholasStrategies(start: number[]): { board: number[]; steps: StrategyStep[]; solved: boolean } {
  const board = [...start];
  const steps: StrategyStep[] = [];
  const legalMoves: number[][][] = Array.from({ length: 9 }, (_, row) =>
    Array.from({ length: 9 }, (_, column) => board[row * 9 + column] === 0 ? [...DIGITS] : []));

  const checkRow = (num: number, row: number) => {
    for (let column = 0; column < 9; column += 1) {
      if (board[row * 9 + column] === num) return true;
    }
    return false;
  };

  const checkColumn = (num: number, column: number) => {
    for (let row = 0; row < 9; row += 1) {
      if (board[row * 9 + column] === num) return true;
    }
    return false;
  };

  const checkBox = (num: number, row: number, column: number) => {
    const rowMod = row - row % 3;
    const columnMod = column - column % 3;
    for (let boxRow = rowMod; boxRow < rowMod + 3; boxRow += 1) {
      for (let boxColumn = columnMod; boxColumn < columnMod + 3; boxColumn += 1) {
        if (board[boxRow * 9 + boxColumn] === num) return true;
      }
    }
    return false;
  };

  const isValid = (num: number, row: number, column: number) =>
    !checkBox(num, row, column)
    && !checkRow(num, row)
    && !checkColumn(num, column)
    && board[row * 9 + column] === 0;

  const removeLegalMoves = () => {
    for (let row = 0; row < 9; row += 1) {
      for (let column = 0; column < 9; column += 1) {
        const moves = legalMoves[row][column];
        for (let moveIndex = 0; moveIndex < moves.length; moveIndex += 1) {
          if (!isValid(moves[moveIndex], row, column)) {
            moves.splice(moveIndex, 1);
            moveIndex -= 1;
          }
        }
      }
    }
  };

  const place = (num: number, row: number, column: number, reason: string) => {
    const index = row * 9 + column;
    board[index] = num;
    steps.push({ index, value: num, reason });
  };

  const placeNumber = () => {
    for (let row = 0; row < 9; row += 1) {
      for (let column = 0; column < 9; column += 1) {
        if (legalMoves[row][column].length === 1 && board[row * 9 + column] === 0) {
          place(legalMoves[row][column][0], row, column, 'only legal move for this square');
        }
      }
    }
  };

  const oneInRow = () => {
    for (let row = 0; row < 9; row += 1) {
      for (const num of DIGITS) {
        let times = 0;
        let foundColumn = 0;
        for (let column = 0; column < 9; column += 1) {
          for (const move of legalMoves[row][column]) {
            if (move === num) {
              times += 1;
              foundColumn = column;
            }
          }
        }
        if (times === 1 && isValid(num, row, foundColumn)) {
          place(num, row, foundColumn, `only place for ${num} in row ${row + 1}`);
        }
      }
    }
  };

  const oneInColumn = () => {
    for (let column = 0; column < 9; column += 1) {
      for (const num of DIGITS) {
        let times = 0;
        let foundRow = 0;
        for (let row = 0; row < 9; row += 1) {
          for (const move of legalMoves[row][column]) {
            if (move === num) {
              times += 1;
              foundRow = row;
            }
          }
        }
        if (times === 1 && isValid(num, foundRow, column)) {
          place(num, foundRow, column, `only place for ${num} in column ${column + 1}`);
        }
      }
    }
  };

  const oneInBox = () => {
    for (let firstRow = 0; firstRow < 9; firstRow += 3) {
      for (let firstColumn = 0; firstColumn < 9; firstColumn += 3) {
        for (const num of DIGITS) {
          let times = 0;
          let foundRow = 0;
          let foundColumn = 0;
          for (let row = firstRow; row < firstRow + 3; row += 1) {
            for (let column = firstColumn; column < firstColumn + 3; column += 1) {
              for (const move of legalMoves[row][column]) {
                if (move === num) {
                  times += 1;
                  foundRow = row;
                  foundColumn = column;
                }
              }
            }
          }
          if (times === 1 && isValid(num, foundRow, foundColumn)) {
            const box = Math.floor(firstRow / 3) * 3 + Math.floor(firstColumn / 3) + 1;
            place(num, foundRow, foundColumn, `only place for ${num} in box ${box}`);
          }
        }
      }
    }
  };

  const removeDuplicates = (original: number[], remove: number[]) => {
    for (const value of remove) {
      for (let index = 0; index < original.length; index += 1) {
        if (value === original[index]) {
          original.splice(index, 1);
          index -= 1;
        }
      }
    }
  };

  const applyPairRule = (indexes: number[]) => {
    const missing = indexes.filter((index) => board[index] === 0);
    const pairIndexes = missing.filter((index) => legalMoves[Math.floor(index / 9)][index % 9].length === 2);
    const removeNumbers: number[] = [];

    for (let first = 0; first < pairIndexes.length - 1; first += 1) {
      const firstMoves = legalMoves[Math.floor(pairIndexes[first] / 9)][pairIndexes[first] % 9];
      for (let second = first + 1; second < pairIndexes.length; second += 1) {
        const secondMoves = legalMoves[Math.floor(pairIndexes[second] / 9)][pairIndexes[second] % 9];
        if (firstMoves[0] === secondMoves[0] && firstMoves[1] === secondMoves[1]) {
          removeNumbers.push(firstMoves[0], firstMoves[1]);
        }
      }
    }

    for (const index of missing) {
      const moves = legalMoves[Math.floor(index / 9)][index % 9];
      let isPair = false;
      if (moves.length === 2) {
        for (let removeIndex = 0; removeIndex < removeNumbers.length - 1; removeIndex += 2) {
          if (moves[0] === removeNumbers[removeIndex] && moves[1] === removeNumbers[removeIndex + 1]) {
            isPair = true;
          }
        }
      }
      if (!isPair) removeDuplicates(moves, removeNumbers);
    }
  };

  const pairInBox = () => {
    for (let firstRow = 0; firstRow < 9; firstRow += 3) {
      for (let firstColumn = 0; firstColumn < 9; firstColumn += 3) {
        const indexes: number[] = [];
        for (let row = firstRow; row < firstRow + 3; row += 1) {
          for (let column = firstColumn; column < firstColumn + 3; column += 1) {
            indexes.push(row * 9 + column);
          }
        }
        applyPairRule(indexes);
      }
    }
  };

  const pairInRow = () => {
    for (let row = 0; row < 9; row += 1) {
      for (let repeat = 0; repeat < 9; repeat += 1) {
        applyPairRule(DIGITS.map((_, column) => row * 9 + column));
      }
    }
  };

  const pairInColumn = () => {
    for (let column = 0; column < 9; column += 1) {
      for (let repeat = 0; repeat < 9; repeat += 1) {
        applyPairRule(DIGITS.map((_, row) => row * 9 + column));
      }
    }
  };

  for (let pass = 0; pass < 100; pass += 1) {
    removeLegalMoves();
    placeNumber();
    oneInRow();
    oneInColumn();
    oneInBox();
    pairInBox();
    pairInRow();
    pairInColumn();
  }

  return { board, steps, solved: isSolved(board) };
}

function wait(milliseconds: number): Promise<void> {
  return new Promise((resolve) => window.setTimeout(resolve, milliseconds));
}

export default function SudokuGame() {
  const [puzzleIndex, setPuzzleIndex] = useState(0);
  const [board, setBoard] = useState(() => boardFromString(PUZZLES[0].grid));
  const [guesses, setGuesses] = useState<number[]>(() => Array(81).fill(0));
  const [pencilMode, setPencilMode] = useState(false);
  const [status, setStatus] = useState('Pick a square and type 1–9. Pencil mode adds guesses.');
  const [showErrors, setShowErrors] = useState(false);
  const [activeCell, setActiveCell] = useState<number | null>(null);
  const [isSolving, setIsSolving] = useState(false);
  const animationId = useRef(0);

  const puzzle = PUZZLES[puzzleIndex];
  const startingBoard = useMemo(() => boardFromString(puzzle.grid), [puzzle]);
  const solution = useMemo(() => solveWithBacktracking(startingBoard)?.board ?? [], [startingBoard]);
  const conflicts = useMemo(() => findConflicts(board, startingBoard), [board, startingBoard]);

  const choosePuzzle = (index: number) => {
    animationId.current += 1;
    setPuzzleIndex(index);
    setBoard(boardFromString(PUZZLES[index].grid));
    setGuesses(Array(81).fill(0));
    setShowErrors(false);
    setActiveCell(null);
    setIsSolving(false);
    setStatus('New puzzle ready.');
  };

  const shufflePuzzle = () => {
    const offset = Math.floor(Math.random() * (PUZZLES.length - 1)) + 1;
    choosePuzzle((puzzleIndex + offset) % PUZZLES.length);
  };

  const updateCell = (index: number, rawValue: string) => {
    if (startingBoard[index] !== 0 || isSolving) return;
    const value = Number(rawValue.replace(/[^1-9]/gu, '').slice(-1)) || 0;

    if (pencilMode && value) {
      const nextBoard = [...board];
      nextBoard[index] = 0;
      setBoard(nextBoard);
      setGuesses((current) => current.map((guess, cellIndex) => cellIndex === index ? value : guess));
      setShowErrors(false);
      setStatus('Guess added.');
      return;
    }

    const nextBoard = [...board];
    nextBoard[index] = value;
    setBoard(nextBoard);
    setGuesses((current) => current.map((guess, cellIndex) => cellIndex === index ? 0 : guess));
    setShowErrors(false);

    const conflict = findConflicts(nextBoard, startingBoard)[index];

    if (conflict === 'given') {
      setStatus(`That ${value} conflicts with one of the original numbers.`);
    } else if (conflict === 'user') {
      setStatus(`That ${value} conflicts with another number you entered.`);
    } else if (!nextBoard.includes(0) && nextBoard.every((cell, cellIndex) => cell === solution[cellIndex])) {
      setStatus('Solved. No computer intervention required.');
    } else {
      setStatus('Keep going.');
    }
  };

  const clearCell = (index: number) => {
    if (startingBoard[index] !== 0 || isSolving) return;
    const nextBoard = [...board];
    nextBoard[index] = 0;
    setBoard(nextBoard);
    setGuesses((current) => current.map((guess, cellIndex) => cellIndex === index ? 0 : guess));
    setShowErrors(false);
    setStatus('Square cleared.');
  };

  const checkBoard = () => {
    const wrong = board.filter((value, index) => value !== 0 && value !== solution[index]).length;
    const empty = board.filter((value) => value === 0).length;
    setShowErrors(wrong > 0);
    if (wrong > 0) setStatus(`${wrong} ${wrong === 1 ? 'square needs' : 'squares need'} another look.`);
    else if (empty > 0) setStatus(`So far, so good. ${empty} ${empty === 1 ? 'square' : 'squares'} left.`);
    else setStatus('Solved. Nicely done.');
  };

  const resetBoard = () => {
    animationId.current += 1;
    setBoard([...startingBoard]);
    setGuesses(Array(81).fill(0));
    setShowErrors(false);
    setActiveCell(null);
    setIsSolving(false);
    setStatus('Puzzle reset.');
  };

  const solveByBacktracking = async () => {
    const result = solveWithBacktracking(startingBoard);
    if (!result) return;
    const currentAnimation = animationId.current + 1;
    animationId.current = currentAnimation;
    setBoard([...startingBoard]);
    setGuesses(Array(81).fill(0));
    setShowErrors(false);
    setIsSolving(true);
    setStatus('Trying numbers, undoing the bad ones, and trying again…');

    const workingBoard = [...startingBoard];
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 18;
    for (let index = 0; index < workingBoard.length; index += 1) {
      if (animationId.current !== currentAnimation) return;
      if (workingBoard[index] !== 0) continue;
      workingBoard[index] = result.board[index];
      setActiveCell(index);
      setBoard([...workingBoard]);
      if (delay) await wait(delay);
    }

    setActiveCell(null);
    setIsSolving(false);
    setStatus(`Backtracking solved it after ${result.attempts.toLocaleString()} valid guesses.`);
  };

  const solveByStrategy = async () => {
    const result = solveWithNicholasStrategies(startingBoard);
    const currentAnimation = animationId.current + 1;
    animationId.current = currentAnimation;
    setBoard([...startingBoard]);
    setGuesses(Array(81).fill(0));
    setShowErrors(false);
    setIsSolving(true);
    setStatus('Checking candidates, rows, columns, and boxes…');

    const workingBoard = [...startingBoard];
    const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 34;
    for (const step of result.steps) {
      if (animationId.current !== currentAnimation) return;
      workingBoard[step.index] = step.value;
      setActiveCell(step.index);
      setBoard([...workingBoard]);
      setStatus(`Placed ${step.value}: ${step.reason}.`);
      if (delay) await wait(delay);
    }

    setActiveCell(null);
    setIsSolving(false);
    setStatus(result.solved
      ? `My strategy solver finished it in ${result.steps.length} explained deductions.`
      : `The strategy solver made ${result.steps.length} deductions, then ran out of rules.`);
  };

  const moveFocus = (event: React.KeyboardEvent<HTMLInputElement>, index: number) => {
    const movements: Record<string, number> = { ArrowLeft: -1, ArrowRight: 1, ArrowUp: -9, ArrowDown: 9 };
    const movement = movements[event.key];
    if (movement) {
      event.preventDefault();
      const target = Math.max(0, Math.min(80, index + movement));
      document.querySelector<HTMLInputElement>(`[data-sudoku-index="${target}"]`)?.focus();
      return;
    }

    if (/^[1-9]$/u.test(event.key)) {
      event.preventDefault();
      updateCell(index, event.key);
    } else if (event.key === 'Backspace' || event.key === 'Delete') {
      event.preventDefault();
      clearCell(index);
    }
  };

  return (
    <div className="sudoku-app">
      <div className="sudoku-toolbar">
        <button type="button" disabled={isSolving} onClick={shufflePuzzle}>Shuffle puzzle <span aria-hidden="true">↻</span></button>
      </div>

      <div className="sudoku-workbench">
        <div className="sudoku-board-panel">
          <div className="sudoku-grid" role="grid" aria-label={puzzle.name}>
            {board.map((value, index) => {
              const row = Math.floor(index / 9);
              const column = index % 9;
              const isGiven = startingBoard[index] !== 0;
              const isWrong = showErrors && value !== 0 && value !== solution[index];
              const conflict = conflicts[index];
              const classes = [
                'sudoku-cell',
                isGiven ? 'sudoku-given' : '',
                isWrong ? 'sudoku-error' : '',
                conflict === 'given' ? 'sudoku-conflict-given' : '',
                conflict === 'user' ? 'sudoku-conflict-user' : '',
                activeCell === index ? 'sudoku-active' : '',
                column === 2 || column === 5 ? 'sudoku-box-right' : '',
                row === 2 || row === 5 ? 'sudoku-box-bottom' : '',
              ].filter(Boolean).join(' ');

              return <div key={index} className={classes}>
                {guesses[index] > 0 && value === 0 && (
                  <span className="sudoku-guess" aria-hidden="true">{guesses[index]}</span>
                )}
                <input
                  data-sudoku-index={index}
                  value={value || ''}
                  readOnly={isGiven || isSolving}
                  inputMode="numeric"
                  maxLength={1}
                  aria-label={`Row ${row + 1}, column ${column + 1}${guesses[index] ? `, pencilled guess ${guesses[index]}` : ''}${conflict === 'given' ? ', conflicts with an original number' : conflict === 'user' ? ', conflicts with another entered number' : ''}`}
                  aria-invalid={isWrong || conflict !== null}
                  onChange={(event) => updateCell(index, event.target.value)}
                  onKeyDown={(event) => moveFocus(event, index)}
                />
              </div>;
            })}
          </div>
          <div className="sudoku-below-grid">
            <p className="sudoku-status" aria-live="polite">{status}</p>
            <button type="button" className={pencilMode ? 'sudoku-pencil-active' : ''} aria-pressed={pencilMode} disabled={isSolving} onClick={() => {
              setPencilMode((current) => !current);
              setStatus(pencilMode ? 'Answer mode on.' : 'Pencil mode on. Type a number to add a guess.');
            }}>Pencil notes <span>{pencilMode ? 'On' : 'Off'}</span></button>
          </div>
        </div>

        <aside className="sudoku-controls">
          <h2>Give up?</h2>
          <p>Let the computer solve it.</p>
          <button type="button" className="sudoku-solve sudoku-strategy" disabled={isSolving} onClick={solveByStrategy}><span>My original approach</span><strong>Solve with strategies</strong></button>
          <button type="button" className="sudoku-solve sudoku-backtracking" disabled={isSolving} onClick={solveByBacktracking}><span>The painfully short approach</span><strong>Solve with backtracking</strong></button>
          <div className="sudoku-small-actions">
            <button type="button" disabled={isSolving} onClick={checkBoard}>Check my board</button>
            <button type="button" onClick={resetBoard}>Reset</button>
          </div>
        </aside>
      </div>
    </div>
  );
}
