'use client';

import { useState } from 'react';

interface JDFormProps {
  onGenerate: (companyName: string, jobDescription: string, roleLabel?: string) => void;
  generating: boolean;
}

export default function JDForm({ onGenerate, generating }: JDFormProps) {
  const [companyName, setCompanyName] = useState('');
  const [roleLabel, setRoleLabel] = useState('');
  const [jobDescription, setJobDescription] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (companyName.trim() && jobDescription.trim()) {
      onGenerate(companyName.trim(), jobDescription.trim(), roleLabel.trim() || undefined);
    }
  };

  return (
    <form onSubmit={handleSubmit} style={styles.form}>
      <div style={styles.field}>
        <label style={styles.label}>Company Name</label>
        <input
          type="text"
          value={companyName}
          onChange={(e) => setCompanyName(e.target.value)}
          placeholder="e.g. Google, Stripe, Freshworks"
          style={styles.input}
          required
        />
        <p style={styles.hint}>Used for the profile URL: inbaraj.info/r/company-name</p>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Role Label <span style={{ color: '#70708a', textTransform: 'none', letterSpacing: 0 }}>(optional)</span></label>
        <input
          type="text"
          value={roleLabel}
          onChange={(e) => setRoleLabel(e.target.value)}
          placeholder="e.g. Implementation Lead, Business Analyst"
          style={styles.input}
        />
        <p style={styles.hint}>If applying for multiple roles at the same company. URL becomes /r/company-role-label</p>
      </div>
      <div style={styles.field}>
        <label style={styles.label}>Job Description</label>
        <textarea
          value={jobDescription}
          onChange={(e) => setJobDescription(e.target.value)}
          placeholder="Paste the full job description here..."
          style={styles.textarea}
          rows={12}
          required
        />
        <p style={styles.hint}>Paste the full JD. Claude will analyze it and tailor your resume accordingly.</p>
      </div>
      <button
        type="submit"
        disabled={generating || !companyName.trim() || !jobDescription.trim()}
        style={{
          ...styles.submitBtn,
          opacity: generating || !companyName.trim() || !jobDescription.trim() ? 0.5 : 1,
        }}
      >
        {generating ? 'Generating with Claude...' : 'Generate Tailored Resume'}
      </button>
    </form>
  );
}

const styles: Record<string, React.CSSProperties> = {
  form: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1.25rem',
    background: '#111113',
    border: '1px solid #2a2a30',
    borderRadius: 10,
    padding: '1.5rem',
  },
  field: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
  },
  label: {
    fontSize: '0.78rem',
    color: '#a8a8b8',
    fontFamily: "'DM Mono', monospace",
    letterSpacing: '0.08em',
    textTransform: 'uppercase' as const,
  },
  input: {
    padding: '0.65rem 1rem',
    background: '#18181c',
    border: '1px solid #2a2a30',
    borderRadius: 6,
    color: '#e8e8ec',
    fontSize: '0.9rem',
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
  submitBtn: {
    padding: '0.7rem 1.5rem',
    background: '#7c6cfa',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
    fontWeight: 400,
    alignSelf: 'flex-start',
    transition: 'opacity 0.2s',
  },
};
