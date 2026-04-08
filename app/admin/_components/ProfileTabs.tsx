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
  // Sort profiles by created date, most recent first
  const profileEntries = Object.entries(registry).sort(
    ([, a], [, b]) => (b.created || '').localeCompare(a.created || '')
  );

  const isProfileTab = activeTab !== 'base' && activeTab !== 'create';
  const selectedProfileLabel = isProfileTab
    ? registry[activeTab]?.company || activeTab
    : '';

  return (
    <div style={styles.container}>
      <button
        onClick={() => onTabChange('base')}
        style={{
          ...styles.tab,
          ...(activeTab === 'base' ? styles.activeTab : {}),
        }}
      >
        Base Resume
      </button>

      {profileEntries.length > 0 && (
        <div style={styles.dropdownWrap}>
          <select
            value={isProfileTab ? activeTab : ''}
            onChange={(e) => {
              if (e.target.value) onTabChange(e.target.value);
            }}
            style={{
              ...styles.select,
              ...(isProfileTab ? styles.selectActive : {}),
            }}
          >
            <option value="" disabled>
              {profileEntries.length} profile{profileEntries.length !== 1 ? 's' : ''} ▾
            </option>
            {profileEntries.map(([slug, entry]) => (
              <option key={slug} value={slug}>
                {entry.company} ({entry.created})
              </option>
            ))}
          </select>
          {isProfileTab && (
            <div style={styles.selectedLabel}>{selectedProfileLabel}</div>
          )}
        </div>
      )}

      <button
        onClick={() => onTabChange('create')}
        style={{
          ...styles.tab,
          ...(activeTab === 'create' ? styles.activeCreateTab : styles.createTab),
        }}
      >
        + New Profile
      </button>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    display: 'flex',
    alignItems: 'center',
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
  dropdownWrap: {
    position: 'relative',
    display: 'flex',
    alignItems: 'center',
  },
  select: {
    padding: '0.5rem 1.2rem',
    paddingRight: '0.5rem',
    background: 'transparent',
    border: 'none',
    borderBottom: '2px solid transparent',
    color: '#70708a',
    fontSize: '0.8rem',
    fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.04em',
    cursor: 'pointer',
    appearance: 'none' as const,
    WebkitAppearance: 'none' as const,
    outline: 'none',
  },
  selectActive: {
    color: '#e8e8ec',
    borderBottomColor: '#7c6cfa',
  },
  selectedLabel: {
    position: 'absolute',
    left: '1.2rem',
    top: '50%',
    transform: 'translateY(-50%)',
    pointerEvents: 'none',
    color: '#e8e8ec',
    fontSize: '0.8rem',
    fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.04em',
  },
};
