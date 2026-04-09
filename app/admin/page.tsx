'use client';

import { useState, useEffect } from 'react';
import ProfileTabs from './_components/ProfileTabs';
import JDForm from './_components/JDForm';
import ProfilePreview from './_components/ProfilePreview';
import GeneratedPreview from './_components/GeneratedPreview';

interface RegistryEntry {
  company: string;
  created: string;
  active: boolean;
}

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

interface GeneratedProfile {
  slug: string;
  companyName: string;
  date: string;
  overrides: Record<string, unknown>;
  validation?: ValidationResult;
}

export default function AdminPage() {
  const [authenticated, setAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [storedPassword, setStoredPassword] = useState('');
  const [registry, setRegistry] = useState<Record<string, RegistryEntry>>({});
  const [activeTab, setActiveTab] = useState<string>('base');
  const [generating, setGenerating] = useState(false);
  const [generated, setGenerated] = useState<GeneratedProfile | null>(null);
  const [publishing, setPublishing] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [liveCheckUrl, setLiveCheckUrl] = useState<string | null>(null);
  const [liveCheckStatus, setLiveCheckStatus] = useState<'checking' | 'live' | null>(null);
  const [liveCheckSlug, setLiveCheckSlug] = useState<string | null>(null);
  const [violationDecisions, setViolationDecisions] = useState<Record<number, { action: 'keep' | 'remove'; reason?: string }>>({});

  // Restore session from sessionStorage on mount
  useEffect(() => {
    const saved = sessionStorage.getItem('admin_pwd');
    if (saved) {
      setStoredPassword(saved);
      setAuthenticated(true);
      loadProfiles(saved);
    }
  }, []);

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setStoredPassword(password);
    setAuthenticated(true);
    sessionStorage.setItem('admin_pwd', password);
    loadProfiles(password);
  };

  const loadProfiles = async (pwd: string) => {
    try {
      const res = await fetch('/api/profiles', {
        headers: { 'x-admin-password': pwd },
      });
      if (res.ok) {
        const data = await res.json();
        setRegistry(data.registry);
      } else {
        setAuthenticated(false);
        sessionStorage.removeItem('admin_pwd');
        setMessage({ type: 'error', text: 'Invalid password' });
      }
    } catch {
      setMessage({ type: 'error', text: 'Failed to load profiles' });
    }
  };

  useEffect(() => {
    if (message) {
      const timer = setTimeout(() => setMessage(null), 8000);
      return () => clearTimeout(timer);
    }
  }, [message]);

  // Poll to check if a newly published profile is live
  useEffect(() => {
    if (!liveCheckUrl || liveCheckStatus === 'live') return;
    setLiveCheckStatus('checking');
    const interval = setInterval(async () => {
      try {
        const res = await fetch(liveCheckUrl, { method: 'HEAD', cache: 'no-store' });
        if (res.ok) {
          setLiveCheckStatus('live');
          setLiveCheckSlug(null);
          setMessage({ type: 'success', text: `Profile is now live at ${liveCheckUrl}` });
          clearInterval(interval);
        }
      } catch { /* still building */ }
    }, 15000);
    return () => clearInterval(interval);
  }, [liveCheckUrl, liveCheckStatus]);

  const handleGenerate = async (companyName: string, jobDescription: string, roleLabel?: string) => {
    setGenerating(true);
    setMessage(null);
    try {
      const res = await fetch('/api/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': storedPassword,
        },
        body: JSON.stringify({ companyName, jobDescription, roleLabel }),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Generation failed');
      }

      const data = await res.json();
      setGenerated(data);
      setViolationDecisions({});
      setMessage({ type: 'success', text: `Generated tailored resume for ${companyName}` });
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Generation failed',
      });
    } finally {
      setGenerating(false);
    }
  };

  const handlePublish = async () => {
    if (!generated) return;
    setPublishing(true);
    try {
      const res = await fetch('/api/profiles', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-admin-password': storedPassword,
        },
        body: JSON.stringify(generated),
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || 'Publish failed');
      }

      const data = await res.json();
      const fullUrl = `${window.location.origin}${data.url}`;
      setMessage({
        type: 'success',
        text: `Published to GitHub! Waiting for Vercel to rebuild... Checking ${fullUrl} every 15s.`,
      });
      setLiveCheckUrl(fullUrl);
      setLiveCheckSlug(data.slug);
      setLiveCheckStatus(null);
      setGenerated(null);
      setActiveTab(data.slug);
      loadProfiles(storedPassword);
    } catch (error) {
      setMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Publish failed',
      });
    } finally {
      setPublishing(false);
    }
  };

  const handleDelete = async (slug: string) => {
    if (!confirm(`Delete profile ${registry[slug]?.company}?`)) return;
    try {
      const res = await fetch(`/api/profiles/${slug}`, {
        method: 'DELETE',
        headers: { 'x-admin-password': storedPassword },
      });
      if (res.ok) {
        setMessage({ type: 'success', text: 'Profile deleted' });
        setActiveTab('base');
        loadProfiles(storedPassword);
      }
    } catch {
      setMessage({ type: 'error', text: 'Delete failed' });
    }
  };

  const handleViolationDecision = (index: number, decision: { action: 'keep' | 'remove'; reason?: string }) => {
    setViolationDecisions(prev => ({ ...prev, [index]: decision }));
  };

  if (!authenticated) {
    return (
      <div style={styles.loginContainer}>
        <div style={styles.loginBox}>
          <h1 style={styles.loginTitle}>Admin Dashboard</h1>
          <p style={styles.loginSubtitle}>Enter your admin password to continue</p>
          <form onSubmit={handleLogin} style={styles.loginForm}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Password"
              style={styles.input}
              autoFocus
            />
            <button type="submit" style={styles.primaryBtn}>
              Sign In
            </button>
          </form>
          {message && (
            <p style={{ ...styles.message, color: message.type === 'error' ? '#ef4444' : '#22c55e' }}>
              {message.text}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <header style={styles.header}>
        <div>
          <h1 style={styles.title}>Resume Admin</h1>
          <p style={styles.subtitle}>Manage base resume and company-specific profiles</p>
        </div>
      </header>

      {message && (
        <div
          style={{
            ...styles.toast,
            background: message.type === 'error' ? '#fef2f2' : '#f0fdf4',
            borderColor: message.type === 'error' ? '#fca5a5' : '#86efac',
            color: message.type === 'error' ? '#dc2626' : '#16a34a',
          }}
        >
          {message.text}
        </div>
      )}

      {liveCheckStatus === 'checking' && liveCheckUrl && (
        <div style={{
          padding: '0.6rem 1rem',
          borderRadius: 8,
          border: '1px solid #fcd34d',
          background: '#fefce8',
          color: '#a16207',
          marginBottom: '1rem',
          fontSize: '0.82rem',
          fontFamily: "'DM Mono', monospace",
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#f59e0b', animation: 'pulse 1.5s infinite' }} />
          Vercel is rebuilding... checking {liveCheckUrl} every 15s
        </div>
      )}
      {liveCheckStatus === 'live' && liveCheckUrl && (
        <div style={{
          padding: '0.6rem 1rem',
          borderRadius: 8,
          border: '1px solid #86efac',
          background: '#f0fdf4',
          color: '#16a34a',
          marginBottom: '1rem',
          fontSize: '0.82rem',
          fontFamily: "'DM Mono', monospace",
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
        }}>
          <span style={{ display: 'inline-block', width: 8, height: 8, borderRadius: '50%', background: '#22c55e' }} />
          Live! <a href={liveCheckUrl} target="_blank" rel="noopener" style={{ color: '#16a34a', textDecoration: 'underline' }}>{liveCheckUrl}</a>
        </div>
      )}

      <ProfileTabs
        registry={registry}
        activeTab={activeTab}
        onTabChange={setActiveTab}
      />

      <div style={styles.content}>
        {activeTab === 'base' && (
          <div>
            <div style={styles.sectionHeader}>
              <h2 style={styles.sectionTitle}>Base Resume</h2>
              <a href="/" target="_blank" rel="noopener" style={styles.linkBtn}>
                View Live ↗
              </a>
            </div>
            <ProfilePreview slug={null} password={storedPassword} />
          </div>
        )}

        {activeTab === 'create' && (
          <div>
            <h2 style={styles.sectionTitle}>Create New Profile</h2>
            <JDForm onGenerate={handleGenerate} generating={generating} />
            {generated && (
              <div style={styles.generatedSection}>
                <div style={styles.generatedHeader}>
                  <div>
                    <h3 style={styles.generatedTitle}>
                      Generated: {generated.companyName}
                    </h3>
                    <p style={styles.generatedSlug}>
                      Slug: <code>{generated.slug}</code> &mdash; URL: /r/{generated.slug}
                    </p>
                  </div>
                  <div style={styles.generatedActions}>
                    <button
                      onClick={handlePublish}
                      disabled={publishing}
                      style={(() => {
                        if (!generated.validation || generated.validation.valid) return styles.publishBtn;
                        const unresolvedCount = generated.validation.violations.filter((_, i) => !violationDecisions[i]).length;
                        return unresolvedCount === 0 ? styles.publishBtn : styles.publishBtnWarn;
                      })()}
                      title={(() => {
                        if (!generated.validation || generated.validation.valid) return undefined;
                        const unresolvedCount = generated.validation.violations.filter((_, i) => !violationDecisions[i]).length;
                        return unresolvedCount > 0 ? `${unresolvedCount} unresolved issues — review before publishing` : undefined;
                      })()}
                    >
                      {(() => {
                        if (publishing) return 'Publishing...';
                        if (!generated.validation || generated.validation.valid) return 'Publish';
                        const unresolvedCount = generated.validation.violations.filter((_, i) => !violationDecisions[i]).length;
                        return unresolvedCount > 0 ? `Publish (${unresolvedCount} unresolved)` : 'Publish';
                      })()}
                    </button>
                    <button
                      onClick={() => setGenerated(null)}
                      style={styles.discardBtn}
                    >
                      Discard
                    </button>
                  </div>
                </div>
                <GeneratedPreview
                  overrides={generated.overrides}
                  validation={generated.validation}
                  password={storedPassword}
                  onViolationDecision={handleViolationDecision}
                  violationDecisions={violationDecisions}
                />
              </div>
            )}
          </div>
        )}

        {activeTab !== 'base' && activeTab !== 'create' && (
          <div>
            <div style={styles.sectionHeader}>
              <div>
                <h2 style={styles.sectionTitle}>
                  {registry[activeTab]?.company}
                </h2>
                <p style={styles.profileMeta}>
                  Slug: <code>{activeTab}</code> &middot; Created: {registry[activeTab]?.created} &middot;{' '}
                  <a
                    href={`/r/${activeTab}`}
                    target="_blank"
                    rel="noopener"
                    style={styles.linkBtn}
                  >
                    View Live ↗
                  </a>
                </p>
              </div>
              <button
                onClick={() => handleDelete(activeTab)}
                style={styles.deleteBtn}
              >
                Delete Profile
              </button>
            </div>
            {liveCheckSlug === activeTab && liveCheckStatus === 'checking' ? (
              <div style={styles.deployingOverlay}>
                <div style={styles.deployingSpinner} />
                <p style={styles.deployingText}>Deploying to Vercel...</p>
                <p style={styles.deployingSub}>The profile page will appear here once the build completes. Checking every 15s.</p>
              </div>
            ) : (
              <ProfilePreview slug={activeTab} password={storedPassword} />
            )}
          </div>
        )}
      </div>
    </div>
  );
}

const styles: Record<string, React.CSSProperties> = {
  loginContainer: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0a0a0b',
    fontFamily: "'DM Sans', sans-serif",
  },
  loginBox: {
    background: '#111113',
    border: '1px solid #2a2a30',
    borderRadius: 12,
    padding: '3rem',
    width: '100%',
    maxWidth: 440,
  },
  loginTitle: {
    fontFamily: "'Spectral', serif",
    fontSize: '1.6rem',
    fontWeight: 300,
    color: '#e8e8ec',
    marginBottom: '0.4rem',
  },
  loginSubtitle: {
    fontSize: '0.85rem',
    color: '#70708a',
    marginBottom: '1.5rem',
  },
  loginForm: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
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
  primaryBtn: {
    padding: '0.65rem 1.2rem',
    background: '#7c6cfa',
    color: '#fff',
    border: 'none',
    borderRadius: 6,
    fontSize: '0.85rem',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  container: {
    minHeight: '100vh',
    background: '#0a0a0b',
    color: '#e8e8ec',
    fontFamily: "'DM Sans', sans-serif",
    padding: '1.5rem 2.5rem',
  },
  header: {
    marginBottom: '2rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #2a2a30',
  },
  title: {
    fontFamily: "'Spectral', serif",
    fontSize: '1.8rem',
    fontWeight: 300,
    color: '#e8e8ec',
    marginBottom: '0.3rem',
  },
  subtitle: {
    fontSize: '0.85rem',
    color: '#70708a',
  },
  toast: {
    padding: '0.75rem 1rem',
    borderRadius: 8,
    border: '1px solid',
    marginBottom: '1.5rem',
    fontSize: '0.85rem',
    fontFamily: "'DM Mono', monospace",
  },
  content: {
    marginTop: '1.5rem',
  },
  sectionHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1.5rem',
  },
  sectionTitle: {
    fontFamily: "'Spectral', serif",
    fontSize: '1.4rem',
    fontWeight: 300,
    color: '#e8e8ec',
  },
  profileMeta: {
    fontSize: '0.78rem',
    color: '#70708a',
    fontFamily: "'DM Mono', monospace",
    marginTop: '0.3rem',
  },
  linkBtn: {
    fontSize: '0.75rem',
    color: '#7c6cfa',
    textDecoration: 'none',
    fontFamily: "'DM Mono', monospace",
  },
  deleteBtn: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: '1px solid #ef4444',
    color: '#ef4444',
    borderRadius: 6,
    fontSize: '0.78rem',
    cursor: 'pointer',
    fontFamily: "'DM Mono', monospace",
  },
  generatedSection: {
    marginTop: '1.5rem',
    background: '#111113',
    border: '1px solid #2a2a30',
    borderRadius: 10,
    padding: '1.5rem',
  },
  generatedHeader: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '1rem',
  },
  generatedTitle: {
    fontFamily: "'Spectral', serif",
    fontSize: '1.1rem',
    fontWeight: 300,
    color: '#2dd4a8',
  },
  generatedSlug: {
    fontSize: '0.75rem',
    color: '#70708a',
    fontFamily: "'DM Mono', monospace",
    marginTop: '0.25rem',
  },
  generatedActions: {
    display: 'flex',
    gap: '0.5rem',
  },
  publishBtn: {
    padding: '0.5rem 1.2rem',
    background: '#2dd4a8',
    color: '#0a0a0b',
    border: 'none',
    borderRadius: 6,
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  publishBtnWarn: {
    padding: '0.5rem 1.2rem',
    background: '#fbbf24',
    color: '#0a0a0b',
    border: 'none',
    borderRadius: 6,
    fontSize: '0.8rem',
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  discardBtn: {
    padding: '0.5rem 1rem',
    background: 'transparent',
    border: '1px solid #38383f',
    color: '#a8a8b8',
    borderRadius: 6,
    fontSize: '0.8rem',
    cursor: 'pointer',
    fontFamily: "'DM Sans', sans-serif",
  },
  jsonPreview: {
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
  message: {
    fontSize: '0.82rem',
    marginTop: '0.75rem',
  },
  deployingOverlay: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#111113',
    border: '1px solid #2a2a30',
    borderRadius: 10,
    padding: '4rem 2rem',
    minHeight: 400,
  },
  deployingSpinner: {
    width: 32,
    height: 32,
    border: '3px solid #2a2a30',
    borderTopColor: '#7c6cfa',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '1.5rem',
  },
  deployingText: {
    fontSize: '1rem',
    color: '#e8e8ec',
    fontFamily: "'DM Sans', sans-serif",
    marginBottom: '0.4rem',
  },
  deployingSub: {
    fontSize: '0.78rem',
    color: '#70708a',
    fontFamily: "'DM Mono', monospace",
    textAlign: 'center',
  },
};
