import { CustomSection as CustomSectionType } from '@/lib/types';
import { sanitizeInlineHtml } from '@/lib/sanitize';

interface CustomSectionProps {
  section: CustomSectionType;
}

export default function CustomSection({ section }: CustomSectionProps) {
  return (
    <section id={section.id}>
      <div className="section-label">{section.title}</div>
      <h2 dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(section.title) }} />
      <div className="skill-group reveal" style={{ maxWidth: '800px' }}>
        <div className="skill-list">
          {section.items.map((item, i) => (
            <div key={i} className="skill-item">
              <span className="skill-dot" />
              <span dangerouslySetInnerHTML={{ __html: sanitizeInlineHtml(item) }} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
