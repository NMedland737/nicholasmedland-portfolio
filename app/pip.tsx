'use client';

import { useState } from 'react';

export default function Pip() {
  const [pressed, setPressed] = useState(false);

  return (
    <div className={`pip-intro ${pressed ? 'pip-awake' : ''}`}>
      <button type="button" className="pip" onClick={() => setPressed((value) => !value)} aria-pressed={pressed} aria-label="Press Pip's antenna">
        <span className="pip-antenna" />
        <span className="pip-face"><i /><i /><b>{pressed ? 'ᴗ' : '—'}</b></span>
        <span className="pip-body"><i /><i /></span>
      </button>
      <p><b>Pip</b> · project guide<br /><span>{pressed ? 'Good. It works.' : 'Press the antenna.'}</span></p>
    </div>
  );
}

export function PipMini({ label = 'Pip' }: { label?: string }) {
  return (
    <span className="pip-mini" aria-label={label} role="img">
      <i /><i /><b>ᴗ</b>
    </span>
  );
}

export function PipNote({ children }: { children: React.ReactNode }) {
  return (
    <details className="pip-note">
      <summary><PipMini label="Pip left a note" /><span>Pip left a note</span><i>+</i></summary>
      <p>{children}</p>
    </details>
  );
}
