import { BellRing, Rocket, Search, ShieldCheck } from 'lucide-react';

const FEATURES = [
  { Icon: Search, title: 'Fast & Easy Search', text: 'Find jobs in seconds' },
  { Icon: ShieldCheck, title: 'Trusted Source', text: 'Verified employer circulars' },
  { Icon: BellRing, title: 'Instant Updates', text: 'Never miss an opportunity' },
  { Icon: Rocket, title: 'Grow Your Career', text: 'Build a better future' },
];

export default function FeatureStrip() {
  return (
    <section className="container">
      <div className="feature-strip">
        {FEATURES.map(({ Icon, title, text }) => (
          <div className="feature" key={title}>
            <span className="feature-icon">
              <Icon aria-hidden="true" />
            </span>
            <div>
              <h3>{title}</h3>
              <p>{text}</p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
