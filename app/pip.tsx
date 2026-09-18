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

export function PipWalker() {
  return (
    <span className="pip-walker" aria-hidden="true">
      <span className="pip-walker-antenna" />
      <span className="pip-walker-face"><i /><i /><b>ᴗ</b></span>
      <span className="pip-walker-body"><i /><i /></span>
      <span className="pip-walker-foot pip-walker-foot-left" />
      <span className="pip-walker-foot pip-walker-foot-right" />
    </span>
  );
}
