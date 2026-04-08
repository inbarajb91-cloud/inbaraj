'use client';

interface ProfilePreviewProps {
  slug: string | null;
  password: string;
}

export default function ProfilePreview({ slug }: ProfilePreviewProps) {
  const url = slug ? `/r/${slug}` : '/';

  return (
    <div style={styles.container}>
      <div style={styles.iframeHeader}>
        <span style={styles.url}>{url}</span>
        <a href={url} target="_blank" rel="noopener" style={styles.openBtn}>
          Open in new tab ↗
        </a>
      </div>
      <div style={styles.iframeWrap}>
        <iframe
          src={url}
          style={styles.iframe}
          title={slug ? `Profile: ${slug}` : 'Base Resume'}
        />
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    background: '#111113',
    border: '1px solid #2a2a30',
    borderRadius: 10,
    overflow: 'hidden',
  },
  iframeHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '0.6rem 1rem',
    borderBottom: '1px solid #2a2a30',
    background: '#18181c',
  },
  url: {
    fontSize: '0.73rem',
    color: '#70708a',
    fontFamily: "'DM Mono', monospace",
  },
  openBtn: {
    fontSize: '0.7rem',
    color: '#7c6cfa',
    textDecoration: 'none',
    fontFamily: "'DM Mono', monospace",
  },
  iframeWrap: {
    height: 700,
    overflow: 'hidden',
  },
  iframe: {
    width: '100%',
    height: '100%',
    border: 'none',
    background: '#0a0a0b',
  },
};
