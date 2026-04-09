'use client';

interface IntakeData {
  companyName: string;
  roleLabel: string;
  jobDescription: string;
}

interface JDFormProps {
  step: 'company' | 'role' | 'jd';
  data: IntakeData;
  onDataChange: (field: keyof IntakeData, value: string) => void;
  onNext: () => void;
  onBack: () => void;
  onStartTailoring: () => void;
}

export default function JDForm({ step, data, onDataChange, onNext, onBack, onStartTailoring }: JDFormProps) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && step !== 'jd') {
      e.preventDefault();
      if (step === 'company' && data.companyName.trim()) onNext();
      if (step === 'role') onNext();
    }
  };

  return (
    <div style={styles.form}>
      {step === 'company' && (
        <div style={styles.stepContainer}>
          <p style={styles.prompt}>What company is this resume for?</p>
          <div style={styles.field}>
            <input
              type="text"
              value={data.companyName}
              onChange={(e) => onDataChange('companyName', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Google, Stripe, Freshworks"
              style={styles.input}
              autoFocus
            />
            <p style={styles.hint}>Your resume will be at inbaraj.info/r/company-name</p>
          </div>
          <button
            onClick={onNext}
            disabled={!data.companyName.trim()}
            style={{
              ...styles.nextBtn,
              opacity: !data.companyName.trim() ? 0.4 : 1,
            }}
          >
            Next
          </button>
        </div>
      )}

      {step === 'role' && (
        <div style={styles.stepContainer}>
          <button onClick={onBack} style={styles.backBtn}>&larr; Back</button>
          <p style={styles.prompt}>Any specific role? <span style={styles.optionalTag}>(optional)</span></p>
          <div style={styles.field}>
            <input
              type="text"
              value={data.roleLabel}
              onChange={(e) => onDataChange('roleLabel', e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="e.g. Implementation Lead, Business Analyst"
              style={styles.input}
              autoFocus
            />
            <p style={styles.hint}>If applying for multiple roles at the same company. URL becomes /r/company-role-label.</p>
          </div>
          <div style={styles.btnRow}>
            <button onClick={onNext} style={styles.nextBtn}>
              {data.roleLabel.trim() ? 'Next' : 'Skip'}
            </button>
          </div>
        </div>
      )}

      {step === 'jd' && (
        <div style={styles.stepContainer}>
          <button onClick={onBack} style={styles.backBtn}>&larr; Back</button>
          <p style={styles.prompt}>
            Paste the job description for{' '}
            <span style={styles.companyHighlight}>{data.companyName}</span>
            {data.roleLabel ? ` (${data.roleLabel})` : ''}
          </p>
          <div style={styles.field}>
            <textarea
              value={data.jobDescription}
              onChange={(e) => onDataChange('jobDescription', e.target.value)}
              placeholder="Paste the full job description here..."
              style={styles.textarea}
              rows={14}
              autoFocus
            />
            <p style={styles.hint}>I&apos;ll analyze this and tailor your resume to match.</p>
          </div>
          <button
            onClick={onStartTailoring}
            disabled={!data.jobDescription.trim()}
            style={{
              ...styles.startBtn,
              opacity: !data.jobDescription.trim() ? 0.4 : 1,
            }}
          >
            Start Tailoring
          </button>
        </div>
      )}
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    background: '#111113',
    border: '1px solid #2a2a30',
    borderRadius: 10,
    padding: '2rem 1.5rem',
  },
  stepContainer: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  prompt: {
    fontFamily: "'Spectral', serif",
    fontSize: '1.15rem',
    fontWeight: 300,
    color: '#e8e8ec',
    margin: 0,
  },
  optionalTag: {
    fontSize: '0.8rem',
    color: '#70708a',
    fontFamily: "'DM Sans', sans-serif",
  },
  companyHighlight: {
    color: '#2dd4a8',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  input: {
    padding: '0.7rem 1rem',
    background: '#18181c',
    border: '1px solid #2a2a30',
    borderRadius: 6,
    color: '#e8e8ec',
    fontSize: '0.95rem',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
  },
  textarea: {
    padding: '0.75rem 1rem',
    background: '#18181c',
    border: '1px solid #2a2a30',
    borderRadius: 6,
    color: '#e8e8ec',
    fontSize: '0.85rem',
    outline: 'none',
    fontFamily: "'DM Sans', sans-serif",
    lineHeight: 1.6,
    resize: 'vertical' as const,
  },
  hint: {
    fontSize: '0.72rem',
    color: '#70708a',
    fontFamily: "'DM Mono', monospace",
  },
  nextBtn: {
    padding: '0.6rem 1.5rem',
    background: '#7c6cfa',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    alignSelf: 'flex-start',
    transition: 'opacity 0.2s',
  },
  startBtn: {
    padding: '0.7rem 1.5rem',
    background: '#2dd4a8',
    color: '#0a0a0b',
    border: 'none',
    borderRadius: 6,
    fontSize: '0.85rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    alignSelf: 'flex-start',
    transition: 'opacity 0.2s',
  },
  backBtn: {
    padding: 0,
    background: 'none',
    border: 'none',
    color: '#70708a',
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontFamily: "'DM Mono', monospace",
    alignSelf: 'flex-start',
    marginBottom: '-0.25rem',
  },
  btnRow: {
    display: 'flex',
    gap: '0.5rem',
  },
};
