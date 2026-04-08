'use client';

interface RegistryEntry {
  company: string;
  created: string;
  active: boolean;
}

interface ProfileTabsProps {
  registry: Record<string, RegistryEntry>;
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function ProfileTabs({ registry, activeTab, onTabChange }: ProfileTabsProps) {
  const tabs = [
    { id: 'base', label: 'Base Resume' },
    ...Object.entries(registry).map(([slug, entry]) => ({
      id: slug,
      label: entry.company,
    })),
    { id: 'create', label: '+ New Profile' },
  ];

  return (
    <div style={styles.container}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onTabChange(tab.id)}
          style={{
            ...styles.tab,
            ...(activeTab === tab.id ? styles.activeTab : {}),
            ...(tab.id === 'create' ? styles.createTab : {}),
            ...(tab.id === 'create' && activeTab === 'create' ? styles.activeCreateTab : {}),
          }}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    gap: '0.25rem',
    borderBottom: '1px solid #2a2a30',
    paddingBottom: 0,
    overflowX: 'auto',
  },
  tab: {
    padding: '0.6rem 1.2rem',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#70708a',
    fontSize: '0.8rem',
    fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.04em',
    cursor: 'pointer',
    whiteSpace: 'nowrap',
    transition: 'all 0.2s',
  },
  activeTab: {
    color: '#e8e8ec',
    borderBottomColor: '#7c6cfa',
  },
  createTab: {
    color: '#2dd4a8',
  },
  activeCreateTab: {
    color: '#2dd4a8',
    borderBottomColor: '#2dd4a8',
  },
};
