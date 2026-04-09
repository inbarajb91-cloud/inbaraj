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

type ViolationDecision = {
  action: 'keep' | 'remove';
  reason?: string;
};

interface GeneratedPreviewProps {
  overrides: Record<string, unknown>;
  validation?: ValidationResult;
  password: string;
  onViolationDecision?: (index: number, decision: ViolationDecision) => void;
  violationDecisions?: Record<number, ViolationDecision>;
}

type ViewMode = 'formatted' | 'diff' | 'json';

export default function GeneratedPreview({
  overrides,
  validation,
  password,
  onViolationDecision,
  violationDecisions = {},
}: GeneratedPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('formatted');
  const [base, setBase] = useState<Record<string, unknown> | null>(null);
  const [showViolations, setShowViolations] = useState(true);
  const [reasonInputIndex, setReasonInputIndex] = useState<number | null>(null);
  const [reasonText, setReasonText] = useState('');

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

  const unresolvedCount = validation
    ? validation.violations.filter((_, i) => !violationDecisions[i]).length
    : 0;

  const friendlyIssueType = (issue: string): string => {
    const map: Record<string, string> = {
      'UNSUPPORTED_CLAIM': 'May not match your experience',
      'FABRICATED_METRIC': 'Metric not in your resume',
      'FABRICATED_SKILL': 'Skill not in your resume',
      'FABRICATED_EXPERIENCE': 'Experience not in your resume',
      'INVENTED_DETAIL': 'Detail not in your resume',
    };
    return map[issue] || issue.replace(/_/g, ' ').toLowerCase();
  };

  const handleKeep = (index: number) => {
    if (reasonInputIndex === index) {
      // Submit the keep with reason
      onViolationDecision?.(index, { action: 'keep', reason: reasonText || undefined });
      setReasonInputIndex(null);
      setReasonText('');
    } else {
      // Show reason input
      setReasonInputIndex(index);
      setReasonText('');
    }
  };

  const handleRemove = (index: number) => {
    onViolationDecision?.(index, { action: 'remove' });
    if (reasonInputIndex === index) {
      setReasonInputIndex(null);
      setReasonText('');
    }
  };

  const handleCancelReason = () => {
    setReasonInputIndex(null);
    setReasonText('');
  };

  return (
    <div>
      {/* Validation banner */}
      {validation && (
        <div
          style={{
            ...styles.validationBanner,
            background: validation.valid
              ? 'rgba(45,212,168,0.08)'
              : unresolvedCount === 0
                ? 'rgba(45,212,168,0.08)'
                : 'rgba(251,191,36,0.08)',
            borderColor: validation.valid
              ? 'rgba(45,212,168,0.3)'
              : unresolvedCount === 0
                ? 'rgba(45,212,168,0.3)'
                : 'rgba(251,191,36,0.3)',
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
                  background: validation.valid || unresolvedCount === 0 ? '#2dd4a8' : '#fbbf24',
                }}
              />
              <span style={{ color: validation.valid || unresolvedCount === 0 ? '#2dd4a8' : '#fbbf24', fontSize: '0.8rem' }}>
                {validation.valid
                  ? 'Everything looks accurate!'
                  : unresolvedCount === 0
                    ? `All items reviewed — ready to publish!`
                    : `I found ${unresolvedCount} thing${unresolvedCount !== 1 ? 's' : ''} that might need a closer look`}
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
              {validation.violations.map((v, i) => {
                const decision = violationDecisions[i];
                const isResolved = !!decision;
                return (
                  <div
                    key={i}
                    style={{
                      ...styles.violationItem,
                      ...(isResolved ? { opacity: 0.5 } : {}),
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.violationHeader}>
                          <span style={styles.violationSection}>{v.section}</span>
                          <span style={styles.violationIssue}>{friendlyIssueType(v.issue)}</span>
                          {isResolved && (
                            <span style={{
                              fontSize: '0.62rem',
                              color: decision.action === 'keep' ? '#2dd4a8' : '#ef4444',
                              textTransform: 'uppercase' as const,
                              letterSpacing: '0.08em',
                              fontFamily: "'DM Mono', monospace",
                              background: decision.action === 'keep' ? 'rgba(45,212,168,0.15)' : 'rgba(239,68,68,0.15)',
                              padding: '1px 6px',
                              borderRadius: 3,
                            }}>
                              {decision.action === 'keep' ? 'kept' : 'removed'}
                            </span>
                          )}
                        </div>
                        <div style={styles.violationGenerated}>&ldquo;{v.generated}&rdquo;</div>
                        <div style={styles.violationSuggestion}>{v.suggestion}</div>
                        {isResolved && decision.reason && (
                          <div style={styles.violationReason}>Reason: {decision.reason}</div>
                        )}
                      </div>
                      {!isResolved && (
                        <div style={styles.violationActions}>
                          <button onClick={() => handleKeep(i)} style={styles.keepBtn}>
                            It&apos;s correct
                          </button>
                          <button onClick={() => handleRemove(i)} style={styles.removeBtn}>
                            Remove
                          </button>
                        </div>
                      )}
                    </div>
                    {/* Reason input for Keep */}
                    {reasonInputIndex === i && (
                      <div style={styles.reasonInputWrap}>
                        <input
                          type="text"
                          value={reasonText}
                          onChange={(e) => setReasonText(e.target.value)}
                          placeholder="Why is this correct? (optional — helps me learn)"
                          style={styles.reasonInput}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') handleKeep(i);
                            if (e.key === 'Escape') handleCancelReason();
                          }}
                        />
                        <button onClick={() => handleKeep(i)} style={styles.reasonSubmitBtn}>
                          Confirm
                        </button>
                        <button onClick={handleCancelReason} style={styles.reasonCancelBtn}>
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
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
          Compare Changes
        </button>
        <button
          onClick={() => setViewMode('json')}
          style={viewMode === 'json' ? styles.toggleBtnActive : styles.toggleBtn}
        >
          Raw Data
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
    fontSize: '0.68rem',
    color: '#fbbf24',
    fontStyle: 'italic',
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
  violationReason: {
    fontSize: '0.7rem',
    color: '#70708a',
    fontStyle: 'italic',
    marginTop: '0.25rem',
  },
  violationActions: {
    display: 'flex',
    gap: '0.35rem',
    marginLeft: '0.75rem',
    flexShrink: 0,
  },
  keepBtn: {
    fontSize: '0.68rem',
    color: '#2dd4a8',
    background: 'rgba(45,212,168,0.1)',
    border: '1px solid rgba(45,212,168,0.3)',
    borderRadius: 4,
    padding: '0.25rem 0.6rem',
    cursor: 'pointer',
    fontFamily: "'DM Mono', monospace",
  },
  removeBtn: {
    fontSize: '0.68rem',
    color: '#ef4444',
    background: 'rgba(239,68,68,0.1)',
    border: '1px solid rgba(239,68,68,0.3)',
    borderRadius: 4,
    padding: '0.25rem 0.6rem',
    cursor: 'pointer',
    fontFamily: "'DM Mono', monospace",
  },
  reasonInputWrap: {
    display: 'flex',
    gap: '0.35rem',
    marginTop: '0.5rem',
    alignItems: 'center',
  },
  reasonInput: {
    flex: 1,
    fontSize: '0.74rem',
    color: '#e8e8ec',
    background: '#111113',
    border: '1px solid #38383f',
    borderRadius: 4,
    padding: '0.3rem 0.6rem',
    fontFamily: "'DM Mono', monospace",
    outline: 'none',
  },
  reasonSubmitBtn: {
    fontSize: '0.66rem',
    color: '#2dd4a8',
    background: 'transparent',
    border: '1px solid rgba(45,212,168,0.3)',
    borderRadius: 4,
    padding: '0.25rem 0.5rem',
    cursor: 'pointer',
    fontFamily: "'DM Mono', monospace",
  },
  reasonCancelBtn: {
    fontSize: '0.66rem',
    color: '#70708a',
    background: 'transparent',
    border: '1px solid #2a2a30',
    borderRadius: 4,
    padding: '0.25rem 0.5rem',
    cursor: 'pointer',
    fontFamily: "'DM Mono', monospace",
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
