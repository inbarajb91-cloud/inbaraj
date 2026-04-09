'use client';

interface DiffViewProps {
  base: Record<string, unknown>;
  overrides: Record<string, unknown>;
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <div style={styles.sectionLabel}>{children}</div>;
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <div style={styles.fieldLabel}>{children}</div>;
}

function DiffBlock({ label, oldText, newText }: { label?: string; oldText: string; newText: string }) {
  if (oldText === newText) {
    return (
      <div style={{ marginBottom: '0.75rem' }}>
        {label && <FieldLabel>{label}</FieldLabel>}
        <div style={styles.unchangedBlock}>
          <p style={styles.blockText}>{newText}</p>
        </div>
      </div>
    );
  }

  return (
    <div style={{ marginBottom: '0.75rem' }}>
      {label && <FieldLabel>{label}</FieldLabel>}
      <div style={styles.diffPair}>
        <div style={styles.oldBlock}>
          <div style={styles.blockLabel}>Original</div>
          <p style={styles.blockText}>{oldText}</p>
        </div>
        <div style={styles.newBlock}>
          <div style={styles.blockLabelNew}>Tailored</div>
          <p style={styles.blockText}>{newText}</p>
        </div>
      </div>
    </div>
  );
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
        <p style={styles.noChanges}>No changes from your original resume.</p>
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
            <DiffBlock
              label="Headline"
              oldText={stripHtml(baseHero.headline)}
              newText={stripHtml(overHero.headline)}
            />
          )}
          {overHero.description && baseHero?.description && (
            <DiffBlock
              label="Description"
              oldText={baseHero.description}
              newText={overHero.description}
            />
          )}
        </DiffCard>
      )}

      {/* Summary diff */}
      {overSummary && baseSummary && (
        <DiffCard>
          <SectionLabel>Summary</SectionLabel>
          <DiffBlock oldText={baseSummary} newText={overSummary} />
        </DiffCard>
      )}

      {/* Experience diff */}
      {overExperience && Array.isArray(overExperience) && baseExperience && Array.isArray(baseExperience) && (
        <DiffCard>
          <SectionLabel>Experience</SectionLabel>
          {overExperience.map((exp, i) => {
            const baseExp = baseExperience[i];
            return (
              <div key={i} style={i > 0 ? { marginTop: '1.25rem', paddingTop: '1.25rem', borderTop: '1px solid #2a2a30' } : {}}>
                <div style={styles.expTitle}>
                  {exp.title} {exp.company && <span style={styles.expCompany}>· {exp.company}</span>}
                </div>
                {/* Bullets */}
                {exp.bullets && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    {exp.bullets.map((bullet, j) => {
                      const baseBullet = baseExp?.bullets?.[j] || '';
                      if (!baseBullet) {
                        return (
                          <div key={j} style={styles.newBlock}>
                            <div style={styles.blockLabelNew}>Added</div>
                            <p style={styles.blockText}>{bullet}</p>
                          </div>
                        );
                      }
                      if (baseBullet === bullet) {
                        return (
                          <div key={j} style={styles.unchangedBlock}>
                            <p style={styles.blockText}>{bullet}</p>
                          </div>
                        );
                      }
                      return (
                        <div key={j} style={styles.diffPair}>
                          <div style={styles.oldBlock}>
                            <div style={styles.blockLabel}>Original</div>
                            <p style={styles.blockText}>{baseBullet}</p>
                          </div>
                          <div style={styles.newBlock}>
                            <div style={styles.blockLabelNew}>Tailored</div>
                            <p style={styles.blockText}>{bullet}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
                {/* Highlights */}
                {exp.highlights && exp.highlights.length > 0 && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <FieldLabel>Highlights</FieldLabel>
                    {exp.highlights.map((h, k) => {
                      const baseHighlight = baseExp?.highlights?.[k];
                      if (!baseHighlight?.text) {
                        return (
                          <div key={k} style={styles.newBlock}>
                            <div style={styles.blockLabelNew}>{h.label || 'Added'}</div>
                            <p style={styles.blockText}>{h.text}</p>
                          </div>
                        );
                      }
                      if (baseHighlight.text === h.text) {
                        return (
                          <div key={k} style={styles.unchangedBlock}>
                            <div style={styles.highlightLabel}>{h.label}</div>
                            <p style={styles.blockText}>{h.text}</p>
                          </div>
                        );
                      }
                      return (
                        <div key={k}>
                          <div style={styles.highlightLabel}>{h.label || baseHighlight.label}</div>
                          <div style={styles.diffPair}>
                            <div style={styles.oldBlock}>
                              <div style={styles.blockLabel}>Original</div>
                              <p style={styles.blockText}>{baseHighlight.text}</p>
                            </div>
                            <div style={styles.newBlock}>
                              <div style={styles.blockLabelNew}>Tailored</div>
                              <p style={styles.blockText}>{h.text}</p>
                            </div>
                          </div>
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
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {overSkills.map((group, i) => {
              const baseGroup = baseSkills?.[i];
              const baseItems = baseGroup?.items || [];
              const newItems = group.items || [];
              const baseSet = new Set(baseItems);
              const titleChanged = baseGroup?.title && baseGroup.title !== group.title;

              return (
                <div key={i} style={styles.skillGroupCard}>
                  {titleChanged ? (
                    <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.4rem' }}>
                      <span style={{ ...styles.skillGroupTitle, color: '#ef4444', textDecoration: 'line-through' }}>{baseGroup?.title}</span>
                      <span style={styles.arrow}>→</span>
                      <span style={{ ...styles.skillGroupTitle, color: '#2dd4a8' }}>{group.title}</span>
                    </div>
                  ) : (
                    <div style={styles.skillGroupTitle}>{group.title}</div>
                  )}
                  <div style={{ display: 'flex', gap: '1.5rem' }}>
                    <div style={{ flex: 1 }}>
                      <div style={styles.miniLabel}>Original</div>
                      {baseItems.map((item, j) => (
                        <div key={j} style={{
                          ...styles.skillItem,
                          ...(newItems.includes(item) ? {} : { color: '#ef4444', textDecoration: 'line-through' }),
                        }}>
                          · {item}
                        </div>
                      ))}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={styles.miniLabelNew}>Tailored</div>
                      {newItems.map((item, j) => (
                        <div key={j} style={{
                          ...styles.skillItem,
                          ...(!baseSet.has(item) ? { color: '#2dd4a8' } : {}),
                        }}>
                          · {item}
                          {!baseSet.has(item) && <span style={styles.newBadge}>added</span>}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </DiffCard>
      )}

      {/* Custom Sections (always new) */}
      {overCustomSections && overCustomSections.length > 0 && (
        <DiffCard borderColor="rgba(45,212,168,0.3)">
          <SectionLabel>New Sections</SectionLabel>
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
          <p style={{ ...styles.noChanges, color: '#ef4444' }}>This section is hidden for this version</p>
        </DiffCard>
      )}
      {overrides.experience === false && (
        <DiffCard borderColor="rgba(239,68,68,0.3)">
          <SectionLabel>Experience</SectionLabel>
          <p style={{ ...styles.noChanges, color: '#ef4444' }}>This section is hidden for this version</p>
        </DiffCard>
      )}
      {overrides.skills === false && (
        <DiffCard borderColor="rgba(239,68,68,0.3)">
          <SectionLabel>Skills</SectionLabel>
          <p style={{ ...styles.noChanges, color: '#ef4444' }}>This section is hidden for this version</p>
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
  diffPair: {
    display: 'flex',
    gap: '0.5rem',
  },
  oldBlock: {
    flex: 1,
    background: 'rgba(239,68,68,0.06)',
    border: '1px solid rgba(239,68,68,0.15)',
    borderRadius: 6,
    padding: '0.5rem 0.65rem',
  },
  newBlock: {
    flex: 1,
    background: 'rgba(45,212,168,0.06)',
    border: '1px solid rgba(45,212,168,0.15)',
    borderRadius: 6,
    padding: '0.5rem 0.65rem',
  },
  unchangedBlock: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid #1e1e22',
    borderRadius: 6,
    padding: '0.5rem 0.65rem',
  },
  blockLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.58rem',
    color: '#ef4444',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.2rem',
    opacity: 0.7,
  },
  blockLabelNew: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.58rem',
    color: '#2dd4a8',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.2rem',
    opacity: 0.7,
  },
  blockText: {
    fontSize: '0.8rem',
    color: '#c8c8d0',
    lineHeight: 1.6,
    margin: 0,
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
    marginBottom: '0.5rem',
  },
  expCompany: {
    fontSize: '0.85rem',
    color: '#7c6cfa',
  },
  highlightLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.64rem',
    color: '#7c6cfa',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.25rem',
  },
  skillGroupCard: {
    background: 'rgba(255,255,255,0.02)',
    border: '1px solid #1e1e22',
    borderRadius: 6,
    padding: '0.6rem 0.75rem',
  },
  skillGroupTitle: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.68rem',
    color: '#2dd4a8',
    letterSpacing: '0.08em',
    marginBottom: '0.3rem',
  },
  arrow: {
    color: '#70708a',
    fontSize: '0.75rem',
  },
  miniLabel: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.56rem',
    color: '#ef4444',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.2rem',
    opacity: 0.6,
  },
  miniLabelNew: {
    fontFamily: "'DM Mono', monospace",
    fontSize: '0.56rem',
    color: '#2dd4a8',
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
    marginBottom: '0.2rem',
    opacity: 0.6,
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
