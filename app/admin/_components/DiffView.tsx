'use client';

interface DiffViewProps {
  base: Record<string, unknown>;
  overrides: Record<string, unknown>;
}

interface DiffSpan {
  text: string;
  type: 'same' | 'added' | 'removed';
}

function diffWords(oldText: string, newText: string): DiffSpan[] {
  const oldWords = oldText.split(/(\s+)/);
  const newWords = newText.split(/(\s+)/);
  const spans: DiffSpan[] = [];

  // Simple LCS-based word diff
  const m = oldWords.length;
  const n = newWords.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (oldWords[i - 1] === newWords[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1] + 1;
      } else {
        dp[i][j] = Math.max(dp[i - 1][j], dp[i][j - 1]);
      }
    }
  }

  // Backtrack to build diff
  const result: DiffSpan[] = [];
  let i = m, j = n;
  while (i > 0 || j > 0) {
    if (i > 0 && j > 0 && oldWords[i - 1] === newWords[j - 1]) {
      result.unshift({ text: oldWords[i - 1], type: 'same' });
      i--; j--;
    } else if (j > 0 && (i === 0 || dp[i][j - 1] >= dp[i - 1][j])) {
      result.unshift({ text: newWords[j - 1], type: 'added' });
      j--;
    } else {
      result.unshift({ text: oldWords[i - 1], type: 'removed' });
      i--;
    }
  }

  // Merge consecutive spans of same type
  for (const span of result) {
    if (spans.length > 0 && spans[spans.length - 1].type === span.type) {
      spans[spans.length - 1].text += span.text;
    } else {
      spans.push({ ...span });
    }
  }

  return spans;
}

function DiffText({ oldText, newText }: { oldText: string; newText: string }) {
  if (oldText === newText) {
    return <span style={styles.sameText}>{oldText}</span>;
  }

  const spans = diffWords(oldText, newText);
  return (
    <span>
      {spans.map((span, i) => (
        <span
          key={i}
          style={
            span.type === 'added' ? styles.addedText :
            span.type === 'removed' ? styles.removedText :
            styles.sameText
          }
        >
          {span.text}
        </span>
      ))}
    </span>
  );
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={styles.sectionLabel}>{children}</div>;
}

function DiffCard({ children, borderColor }: { children: React.ReactNode; borderColor?: string }) {
  return (
    <div style={{ ...styles.card, ...(borderColor ? { borderColor } : {}) }}>
      {children}
    </div>
  );
}

export default function DiffView({ base, overrides }: DiffViewProps) {
  const baseHero = base.hero as { headline?: string; description?: string } | undefined;
  const overHero = overrides.hero as { headline?: string; description?: string } | undefined;
  const baseSummary = base.summary as string | undefined;
  const overSummary = overrides.summary as string | undefined;
  const baseExperience = base.experience as Array<{
    title?: string; company?: string; bullets?: string[]; highlights?: Array<{ label?: string; text?: string }>;
  }> | undefined;
  const overExperience = overrides.experience as Array<{
    title?: string; company?: string; bullets?: string[]; highlights?: Array<{ label?: string; text?: string }>;
  }> | undefined;
  const baseSkills = base.skills as Array<{ title?: string; items?: string[] }> | undefined;
  const overSkills = overrides.skills as Array<{ title?: string; items?: string[] }> | undefined;
  const overCustomSections = overrides.customSections as Array<{
    title?: string; items?: string[];
  }> | undefined;

  const hasChanges = Object.keys(overrides).length > 0;

  if (!hasChanges) {
    return (
      <div style={styles.card}>
        <p style={styles.noChanges}>No changes from base resume.</p>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
      {/* Hero diff */}
      {overHero && (
        <DiffCard>
          <SectionLabel>Hero</SectionLabel>
          {overHero.headline && baseHero?.headline && (
            <div style={{ marginBottom: '0.5rem' }}>
              <div style={styles.fieldLabel}>Headline</div>
              <div style={styles.diffLine}>
                <DiffText
                  oldText={stripHtml(baseHero.headline)}
                  newText={stripHtml(overHero.headline)}
                />
              </div>
            </div>
          )}
          {overHero.description && baseHero?.description && (
            <div>
              <div style={styles.fieldLabel}>Description</div>
              <div style={styles.diffLine}>
                <DiffText oldText={baseHero.description} newText={overHero.description} />
              </div>
            </div>
          )}
        </DiffCard>
      )}

      {/* Summary diff */}
      {overSummary && baseSummary && (
        <DiffCard>
          <SectionLabel>Summary</SectionLabel>
          <div style={styles.diffLine}>
            <DiffText oldText={baseSummary} newText={overSummary} />
          </div>
        </DiffCard>
      )}

      {/* Experience diff */}
      {overExperience && Array.isArray(overExperience) && baseExperience && Array.isArray(baseExperience) && (
        <DiffCard>
          <SectionLabel>Experience</SectionLabel>
          {overExperience.map((exp, i) => {
            const baseExp = baseExperience[i];
            return (
              <div key={i} style={i > 0 ? { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a2a30' } : {}}>
                <div style={styles.expTitle}>
                  {exp.title} {exp.company && <span style={styles.expCompany}>· {exp.company}</span>}
                </div>
                {exp.bullets && (
                  <ul style={styles.bulletList}>
                    {exp.bullets.map((bullet, j) => {
                      const baseBullet = baseExp?.bullets?.[j] || '';
                      return (
                        <li key={j} style={styles.bullet}>
                          {baseBullet ? (
                            <DiffText oldText={baseBullet} newText={bullet} />
                          ) : (
                            <span style={styles.addedText}>{bullet}</span>
                          )}
                        </li>
                      );
                    })}
                  </ul>
                )}
                {exp.highlights && exp.highlights.length > 0 && (
                  <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                    {exp.highlights.map((h, k) => {
                      const baseHighlight = baseExp?.highlights?.[k];
                      return (
                        <div key={k} style={styles.highlight}>
                          <div style={styles.highlightLabel}>{h.label}</div>
                          <p style={styles.highlightText}>
                            {baseHighlight?.text ? (
                              <DiffText oldText={baseHighlight.text} newText={h.text || ''} />
                            ) : (
                              <span style={styles.addedText}>{h.text}</span>
                            )}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            );
          })}
        </DiffCard>
      )}

      {/* Skills diff */}
      {overSkills && Array.isArray(overSkills) && (
        <DiffCard>
          <SectionLabel>Skills</SectionLabel>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
            {overSkills.map((group, i) => {
              const baseGroup = baseSkills?.[i];
              const baseItems = new Set(baseGroup?.items || []);
              return (
                <div key={i}>
                  <div style={styles.skillGroupTitle}>
                    {baseGroup?.title && baseGroup.title !== group.title ? (
                      <DiffText oldText={baseGroup.title} newText={group.title || ''} />
                    ) : (
                      group.title
                    )}
                  </div>
                  {group.items?.map((item, j) => (
                    <div
                      key={j}
                      style={{
                        ...styles.skillItem,
                        ...(baseItems.has(item) ? {} : { background: 'rgba(45,212,168,0.1)', borderRadius: 3, padding: '0 4px' }),
                      }}
                    >
                      · {item}
                      {!baseItems.has(item) && <span style={styles.newBadge}>new</span>}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>
        </DiffCard>
      )}

      {/* Custom Sections (always new) */}
      {overCustomSections && overCustomSections.length > 0 && (
        <DiffCard borderColor="rgba(45,212,168,0.3)">
          <SectionLabel>Custom Sections (added)</SectionLabel>
          {overCustomSections.map((section, i) => (
            <div key={i} style={i > 0 ? { marginTop: '0.75rem' } : {}}>
              <div style={styles.skillGroupTitle}>{section.title}</div>
              {section.items?.map((item, j) => (
                <div key={j} style={{ ...styles.skillItem, color: '#2dd4a8' }}>· {item}</div>
              ))}
            </div>
          ))}
        </DiffCard>
      )}

      {/* Hidden sections */}
      {overrides.projects === false && (
        <DiffCard borderColor="rgba(239,68,68,0.3)">
          <SectionLabel>Projects</SectionLabel>
          <p style={{ ...styles.noChanges, color: '#ef4444' }}>Section hidden for this profile</p>
        </DiffCard>
      )}
      {overrides.experience === false && (
        <DiffCard borderColor="rgba(239,68,68,0.3)">
          <SectionLabel>Experience</SectionLabel>
          <p style={{ ...styles.noChanges, color: '#ef4444' }}>Section hidden for this profile</p>
        </DiffCard>
      )}
      {overrides.skills === false && (
        <DiffCard borderColor="rgba(239,68,68,0.3)">
          <SectionLabel>Skills</SectionLabel>
          <p style={{ ...styles.noChanges, color: '#ef4444' }}>Section hidden for this profile</p>
        </DiffCard>
      )}
    </div>
  );
}

function stripHtml(str: string): string {
  return str.replace(/<[^>]*>/g, '');
}

const styles: Record<string, React.CSSProperties> = {
  card: {
    background: '#18181c',
    border: '1px solid #2a2a30',
    borderRadius: 8,
    padding: '1rem',
  },
  sectionLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.68rem',
    color: '#2dd4a8',
    letterSpacing: '0.1em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.6rem',
  },
  fieldLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.64rem',
    color: '#70708a',
    letterSpacing: '0.08em',
    marginBottom: '0.25rem',
  },
  diffLine: {
    fontSize: '0.84rem',
    color: '#a8a8b8',
    lineHeight: 1.65,
  },
  sameText: {
    color: '#a8a8b8',
  },
  addedText: {
    color: '#2dd4a8',
    background: 'rgba(45,212,168,0.1)',
    borderRadius: 2,
    padding: '0 2px',
  },
  removedText: {
    color: '#ef4444',
    background: 'rgba(239,68,68,0.1)',
    textDecoration: 'line-through',
    borderRadius: 2,
    padding: '0 2px',
  },
  noChanges: {
    fontSize: '0.84rem',
    color: '#70708a',
    fontStyle: 'italic',
  },
  expTitle: {
    fontFamily: "'Spectral', serif",
    fontSize: '1rem',
    fontWeight: 300,
    color: '#e8e8ec',
    marginBottom: '0.4rem',
  },
  expCompany: {
    fontSize: '0.85rem',
    color: '#7c6cfa',
  },
  bulletList: {
    listStyle: 'none',
    padding: 0,
    display: 'flex',
    flexDirection: 'column' as const,
    gap: '0.3rem',
  },
  bullet: {
    fontSize: '0.82rem',
    color: '#a8a8b8',
    lineHeight: 1.6,
    paddingLeft: '1rem',
    position: 'relative' as const,
  },
  highlight: {
    flex: '1 1 calc(50% - 0.25rem)',
    background: 'rgba(124,108,250,0.06)',
    border: '1px solid rgba(124,108,250,0.15)',
    borderRadius: 6,
    padding: '0.6rem 0.75rem',
  },
  highlightLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.64rem',
    color: '#7c6cfa',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.25rem',
  },
  highlightText: {
    fontSize: '0.78rem',
    color: '#a8a8b8',
    lineHeight: 1.5,
  },
  skillGroupTitle: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.68rem',
    color: '#2dd4a8',
    letterSpacing: '0.08em',
    marginBottom: '0.3rem',
  },
  skillItem: {
    fontSize: '0.8rem',
    color: '#a8a8b8',
    lineHeight: 1.5,
  },
  newBadge: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.58rem',
    color: '#2dd4a8',
    marginLeft: '0.4rem',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.05em',
  },
};
