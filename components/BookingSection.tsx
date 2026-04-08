import { ResumeData } from '@/lib/types';

interface BookingSectionProps {
  data: ResumeData;
}

export default function BookingSection({ data }: BookingSectionProps) {
  const { booking, personal } = data;
  const calendlyUrl = `https://calendly.com/${personal.calendly}`;
  const embedUrl = `${calendlyUrl}?embed_domain=${personal.website}&embed_type=Inline&hide_event_type_details=1&hide_gdpr_banner=1`;

  return (
    <section id="booking">
      <div className="section-label">Book a call</div>
      <h2 dangerouslySetInnerHTML={{ __html: "Let's <em>talk</em>" }} />
      <div className="booking-wrap reveal">
        <div className="booking-left">
          <p className="booking-tagline">{booking.tagline}</p>
          <p className="booking-sub">{booking.description}</p>
          <div className="booking-details">
            {booking.details.map((detail, i) => (
              <div key={i} className="booking-detail-item">
                <span className="booking-detail-icon">{detail.icon}</span>
                <span>{detail.text}</span>
              </div>
            ))}
          </div>
          <a
            href={calendlyUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
            style={{ marginTop: '1.5rem', display: 'inline-flex' }}
          >
            Open booking page &#8599;
          </a>
        </div>
        <div className="booking-embed">
          <iframe
            src={embedUrl}
            width="100%"
            height="640"
            frameBorder="0"
            scrolling="auto"
            style={{ borderRadius: '8px' }}
          />
        </div>
      </div>
    </section>
  );
}
