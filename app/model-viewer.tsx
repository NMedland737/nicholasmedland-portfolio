'use client';

import { createElement, useEffect, useState } from 'react';

export default function ModelViewer({ src, alt, compact = false }: { src: string; alt: string; compact?: boolean }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let active = true;
    import('@google/model-viewer').then(() => {
      if (active) setReady(true);
    });
    return () => { active = false; };
  }, []);

  if (!ready) {
    return <div className="model-loading"><span>3D</span><small>Loading interactive model…</small></div>;
  }

  return createElement('model-viewer', {
    src,
    alt,
    'camera-controls': true,
    'auto-rotate': !compact,
    'rotation-per-second': '18deg',
    'shadow-intensity': '0.8',
    exposure: '1.05',
    loading: 'lazy',
    'interaction-prompt': 'auto',
  });
}
