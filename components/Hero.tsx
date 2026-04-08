import { ResumeData } from '@/lib/types';

interface HeroProps {
  data: ResumeData;
}

export default function Hero({ data }: HeroProps) {
  const { hero, stats, personal } = data;

  return (
    <div id="top" className="hero">
      <div className="hero-grid">
        <div>
          <div className="hero-tag">{hero.tag}</div>
          <h1 dangerouslySetInnerHTML={{ __html: hero.headline }} />
          <p className="hero-desc">{hero.description}</p>
          <div className="hero-badges">
            {hero.badges.map((badge, i) => (
              <span key={i} className={`badge badge-${badge.variant}`}>
                {badge.text}
              </span>
            ))}
          </div>
          <div className="hero-actions">
            <a
              href={personal.calendly}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-primary"
            >
              Book a call
            </a>
            <a href="#experience" className="btn-ghost">
              View experience
            </a>
          </div>
        </div>
        <div className="hero-right">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`stat-card ${stat.color} reveal`}
              style={i > 0 ? { transitionDelay: `${i * 0.1}s` } : undefined}
            >
              <div className={`stat-num ${stat.color}`}>{stat.value}</div>
              <div className="stat-label">{stat.label}</div>
              <div className="stat-sub">{stat.sub}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
