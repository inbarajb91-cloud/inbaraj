'use client';

import { useState, useEffect } from 'react';
import DiffView from './DiffView';

interface ValidationViolation {
  section: string;
  field: string;
  generated: string;
  issue: string;
  suggestion: string;
}

interface ValidationResult {
  valid: boolean;
  violations: ValidationViolation[];
}

interface GeneratedPreviewProps {
  overrides: Record<string, unknown>;
  validation?: ValidationResult;
  password: string;
}

type ViewMode = 'formatted' | 'diff' | 'json';

export default function GeneratedPreview({ overrides, validation, password }: GeneratedPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('formatted');
  const [base, setBase] = useState<Record<string, unknown> | null>(null);
  const [showViolations, setShowViolations] = useState(false);

  useEffect(() => {
    (async () => {
      try {
        const res = await fetch('/api/base', {
          headers: { 'x-admin-password': password },
        });
        if (res.ok) {
          setBase(await res.json());
        }
      } catch { /* base load failed, diff view won't be available */ }
    })();
  }, [password]);

  const hero = overrides.hero as { headline?: string; description?: string } | undefined;
  const experience = overrides.experience as Array<{
    title?: string;
    company?: string;
    bullets?: string[];
    highlights?: Array<{ label?: string; text?: string }>;
  }> | undefined;
  const skills = overrides.skills as Array<{ title?: string; items?: string[] }> | undefined;
  const summary = overrides.summary as string | undefined;
  const customSections = overrides.customSections as Array<{
    title?: string;
    items?: string[];
  }> | undefined;

  return (
    <div>
      {/* Validation banner */}
      {validation && (
        <div
          style={{
            ...styles.validationBanner,
            background: validation.valid ? 'rgba(45,212,168,0.08)' : 'rgba(251,191,36,0.08)',
            borderColor: validation.valid ? 'rgba(45,212,168,0.3)' : 'rgba(251,191,36,0.3)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <span
                style={{
                  display: 'inline-block',
                  width: 8,
                  height: 8,
                  borderRadius: '50%',
                  background: validation.valid ? '#2dd4a8' : '#fbbf24',
                }}
              />
              <span style={{ color: validation.valid ? '#2dd4a8' : '#fbbf24', fontSize: '0.8rem' }}>
                {validation.valid
                  ? 'All fact checks passed'
                  : `${validation.violations.length} potential issue${validation.violations.length !== 1 ? 's' : ''} found`}
              </span>
            </div>
            {!validation.valid && validation.violations.length > 0 && (
              <button
                onClick={() => setShowViolations(!showViolations)}
                style={styles.toggleViolationsBtn}
              >
                {showViolations ? 'Hide details' : 'Show details'}
              </button>
            )}
          </div>
          {showViolations && validation.violations.length > 0 && (
            <div style={styles.violationsList}>
              {validation.violations.map((v, i) => (
                <div key={i} style={styles.violationItem}>
                  <div style={styles.violationHeader}>
                    <span style={styles.violationSection}>{v.section}</span>
                    <span style={styles.violationIssue}>{v.issue.replace(/_/g, ' ')}</span>
                  </div>
                  <div style={styles.violationGenerated}>&ldquo;{v.generated}&rdquo;</div>
                  <div style={styles.violationSuggestion}>{v.suggestion}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* View mode toggles */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.75rem', gap: '0.25rem' }}>
        <button
          onClick={() => setViewMode('formatted')}
          style={viewMode === 'formatted' ? styles.toggleBtnActive : styles.toggleBtn}
        >
          Formatted
        </button>
        <button
          onClick={() => setViewMode('diff')}
          disabled={!base}
          style={viewMode === 'diff' ? styles.toggleBtnActive : styles.toggleBtn}
        >
          Diff View
        </button>
        <button
          onClick={() => setViewMode('json')}
          style={viewMode === 'json' ? styles.toggleBtnActive : styles.toggleBtn}
        >
          Raw JSON
        </button>
      </div>

      {/* Diff view */}
      {viewMode === 'diff' && base && (
        <DiffView base={base} overrides={overrides} />
      )}

      {/* Raw JSON */}
      {viewMode === 'json' && (
        <pre style={styles.json}>{JSON.stringify(overrides, null, 2)}</pre>
      )}

      {/* Formatted view */}
      {viewMode === 'formatted' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {hero && (
            <div style={styles.card}>
              <div style={styles.sectionLabel}>Hero</div>
              {hero.headline && (
                <div
                  style={styles.headline}
                  dangerouslySetInnerHTML={{ __html: hero.headline }}
                />
              )}
              {hero.description && (
                <p style={styles.text}>{hero.description}</p>
              )}
            </div>
          )}

          {summary && (
            <div style={styles.card}>
              <div style={styles.sectionLabel}>Summary</div>
              <p style={styles.text}>{summary}</p>
            </div>
          )}

          {experience && Array.isArray(experience) && (
            <div style={styles.card}>
              <div style={styles.sectionLabel}>Experience</div>
              {experience.map((exp, i) => (
                <div key={i} style={i > 0 ? { marginTop: '1rem', paddingTop: '1rem', borderTop: '1px solid #2a2a30' } : {}}>
                  <div style={styles.expTitle}>
                    {exp.title} {exp.company && <span style={styles.expCompany}>· {exp.company}</span>}
                  </div>
                  {exp.bullets && (
                    <ul style={styles.bulletList}>
                      {exp.bullets.map((b, j) => (
                        <li key={j} style={styles.bullet}>{b}</li>
                      ))}
                    </ul>
                  )}
                  {exp.highlights && exp.highlights.length > 0 && (
                    <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                      {exp.highlights.map((h, k) => (
                        <div key={k} style={styles.highlight}>
                          <div style={styles.highlightLabel}>{h.label}</div>
                          <p style={styles.highlightText}>{h.text}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          {skills && Array.isArray(skills) && (
            <div style={styles.card}>
              <div style={styles.sectionLabel}>Skills</div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '0.75rem' }}>
                {skills.map((group, i) => (
                  <div key={i}>
                    <div style={styles.skillGroupTitle}>{group.title}</div>
                    {group.items && group.items.map((item, j) => (
                      <div key={j} style={styles.skillItem}>· {item}</div>
                    ))}
                  </div>
                ))}
              </div>
            </div>
          )}

          {customSections && customSections.length > 0 && (
            <div style={styles.card}>
              <div style={styles.sectionLabel}>Custom Sections</div>
              {customSections.map((section, i) => (
                <div key={i} style={i > 0 ? { marginTop: '0.75rem' } : {}}>
                  <div style={styles.skillGroupTitle}>{section.title}</div>
                  {section.items && section.items.map((item, j) => (
                    <div key={j} style={styles.skillItem}>· {item}</div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {overrides.projects === false && (
            <div style={{ ...styles.card, borderColor: '#44403c' }}>
              <div style={styles.sectionLabel}>Projects</div>
              <p style={{ ...styles.text, fontStyle: 'italic' }}>Hidden for this profile</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  validationBanner: {
    padding: '0.75rem 1rem',
    borderRadius: 8,
    border: '1px solid',
    marginBottom: '0.75rem',
    fontFamily: "'DM Mono', monospace",
  },
  toggleViolationsBtn: {
    fontSize: '0.68rem',
    color: '#fbbf24',
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    fontFamily: "'DM Mono', monospace",
    textDecoration: 'underline',
  },
  violationsList: {
    marginTop: '0.75rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.5rem',
  },
  violationItem: {
    background: 'rgba(0,0,0,0.2)',
    borderRadius: 6,
    padding: '0.6rem 0.75rem',
  },
  violationHeader: {
    display: 'flex',
    gap: '0.5rem',
    alignItems: 'center',
    marginBottom: '0.25rem',
  },
  violationSection: {
    fontSize: '0.64rem',
    color: '#7c6cfa',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  violationIssue: {
    fontSize: '0.64rem',
    color: '#fbbf24',
    textTransform: 'uppercase' as const,
    letterSpacing: '0.08em',
  },
  violationGenerated: {
    fontSize: '0.78rem',
    color: '#ef4444',
    fontStyle: 'italic',
    marginBottom: '0.2rem',
  },
  violationSuggestion: {
    fontSize: '0.74rem',
    color: '#a8a8b8',
  },
  toggleBtn: {
    fontSize: '0.7rem',
    color: '#70708a',
    background: 'transparent',
    border: '1px solid #2a2a30',
    borderRadius: 4,
    padding: '0.3rem 0.7rem',
    cursor: 'pointer',
    fontFamily: "'DM Mono', monospace",
  },
  toggleBtnActive: {
    fontSize: '0.7rem',
    color: '#e8e8ec',
    background: '#2a2a30',
    border: '1px solid #38383f',
    borderRadius: 4,
    padding: '0.3rem 0.7rem',
    cursor: 'pointer',
    fontFamily: "'DM Mono', monospace",
  },
  json: {
    background: '#18181c',
    border: '1px solid #2a2a30',
    borderRadius: 8,
    padding: '1rem',
    fontSize: '0.75rem',
    color: '#a8a8b8',
    fontFamily: "'DM Mono', monospace",
    overflow: 'auto',
    maxHeight: 400,
    lineHeight: 1.5,
  },
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
  headline: {
    fontFamily: "'Spectral', serif",
    fontSize: '1.2rem',
    fontWeight: 300,
    color: '#e8e8ec',
    marginBottom: '0.4rem',
  },
  text: {
    fontSize: '0.84rem',
    color: '#a8a8b8',
    lineHeight: 1.65,
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
};
