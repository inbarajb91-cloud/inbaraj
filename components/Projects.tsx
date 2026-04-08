import { Project } from '@/lib/types';

interface ProjectsProps {
  projects: Project[];
}

export default function Projects({ projects }: ProjectsProps) {
  return (
    <section id="projects">
      <div className="section-label">Projects</div>
      <h2 dangerouslySetInnerHTML={{ __html: "Things I've <em>built</em>" }} />
      <div className="projects-grid">
        {projects.map((project, i) => (
          <div
            key={i}
            className={`project-card ${project.variant} reveal`}
            style={i > 0 ? { transitionDelay: `${i * 0.1}s` } : undefined}
          >
            <div className="proj-header">
              <div className={`proj-icon ${project.variant}`}>
                {project.icon}
              </div>
              {project.url && (
                <a
                  href={project.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="proj-link-btn"
                >
                  &#8599; View
                </a>
              )}
            </div>
            <div className="proj-name">
              {project.url ? (
                <a href={project.url} target="_blank" rel="noopener noreferrer">
                  {project.name}
                </a>
              ) : (
                project.name
              )}
            </div>
            <div className="proj-type">{project.type}</div>
            <p className="proj-desc">{project.description}</p>
            <div className="proj-tags">
              {project.tags.map((tag, j) => (
                <span key={j} className="proj-tag">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
