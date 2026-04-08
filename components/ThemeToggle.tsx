'use client';

import { useState, useEffect } from 'react';

export default function ThemeToggle() {
  const [isLight, setIsLight] = useState(false);

  useEffect(() => {
    setIsLight(document.body.classList.contains('light'));
  }, []);

  const toggle = () => {
    document.body.classList.toggle('light');
    setIsLight(document.body.classList.contains('light'));
  };

  return (
    <button className="theme-toggle" onClick={toggle} title="Toggle light/dark">
      {isLight ? '\u{1F319}' : '\u2600'}
    </button>
  );
}
