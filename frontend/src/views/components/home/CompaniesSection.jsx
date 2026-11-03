import { MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../../config/routes.js';

export default function CompaniesSection({ companies }) {
  return (
    <section className="section" id="companies">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 className="section-title">Top Hiring Companies</h2>
            <p className="section-subtitle">Companies with the most open positions right now</p>
          </div>
        </div>

        {companies.length === 0 ? (
          <p className="empty-state">Companies will appear here once jobs are posted.</p>
        ) : (
          <div className="company-grid">
            {companies.map((company) => (
              <Link
                key={company.name}
                to={`${ROUTES.totalJobs}?q=${encodeURIComponent(company.name)}`}
                className="company-card"
              >
                <span className="company-avatar">{company.name.slice(0, 1).toUpperCase()}</span>
                <div>
                  <h3>{company.name}</h3>
                  <p><MapPin aria-hidden="true" /> {company.location}</p>
                </div>
                <span className="company-openings">
                  {company.openings} open job{company.openings === 1 ? '' : 's'}
                </span>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
