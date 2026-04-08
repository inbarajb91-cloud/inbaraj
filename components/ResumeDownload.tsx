'use client';

import { useState } from 'react';

const DownloadIcon = ({ size = 16 }: { size?: number }) => (
  <svg
    viewBox="0 0 16 16"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.8"
    strokeLinecap="round"
    strokeLinejoin="round"
    width={size}
    height={size}
  >
    <path d="M8 2v8M5 7l3 3 3-3M3 12h10" />
  </svg>
);

export function NavDownloadButton() {
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    setBusy(true);
    window.addEventListener(
      'afterprint',
      () => {
        setBusy(false);
      },
      { once: true }
    );
    setTimeout(() => window.print(), 80);
  };

  return (
    <button
      className="cv-nav-btn"
      onClick={handleClick}
      disabled={busy}
      title="Download Resume PDF"
    >
      {busy ? (
        '\u2026'
      ) : (
        <>
          <DownloadIcon size={13} />
          CV
        </>
      )}
    </button>
  );
}

export function FabDownloadButton() {
  const [busy, setBusy] = useState(false);

  const handleClick = () => {
    setBusy(true);
    window.addEventListener(
      'afterprint',
      () => {
        setBusy(false);
      },
      { once: true }
    );
    setTimeout(() => window.print(), 80);
  };

  return (
    <button
      className="cv-fab"
      onClick={handleClick}
      disabled={busy}
      aria-label="Download CV"
    >
      {busy ? (
        'Preparing\u2026'
      ) : (
        <>
          <DownloadIcon size={16} />
          Download CV
        </>
      )}
    </button>
  );
}
