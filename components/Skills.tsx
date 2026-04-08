import { SkillGroup, Education } from '@/lib/types';

interface SkillsProps {
  skills: SkillGroup[];
  education: Education[];
}

function dotStyle(color: string): React.CSSProperties | undefined {
  if (color === 'teal') return { background: 'var(--teal)' };
  if (color === 'amber') return { background: 'var(--amber)' };
  return undefined; // default accent color from CSS
}

export default function Skills({ skills, education }: SkillsProps) {
  return (
    <section id="skills">
      <div className="section-label">Capabilities</div>
      <h2 dangerouslySetInnerHTML={{ __html: "What I <em>bring</em>" }} />
      <div className="skills-grid">
        {skills.map((group, i) => (
          <div
            key={i}
            className="skill-group reveal"
            style={
              i % 3 !== 0 ? { transitionDelay: `${(i % 3) * 0.1}s` } : undefined
            }
          >
            <div className="skill-group-title">{group.title}</div>
            <div className="skill-list">
              {group.items.map((item, j) => (
                <div key={j} className="skill-item">
                  <span className="skill-dot" style={dotStyle(group.color)} />
                  {item}
                </div>
              ))}
            </div>
          </div>
        ))}

        {/* Education as the last group in the grid */}
        <div
          className="skill-group reveal"
          style={
            skills.length % 3 !== 0
              ? { transitionDelay: `${(skills.length % 3) * 0.1}s` }
              : undefined
          }
        >
          <div className="skill-group-title">Education</div>
          <div className="skill-list" style={{ gap: 0 }}>
            {education.map((edu, i) => (
              <div key={i} className="edu-entry">
                <span className="edu-degree">{edu.degree}</span>
                <span className="edu-uni">{edu.university}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
