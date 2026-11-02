import { Link } from 'react-router-dom';
import { routeTo } from '../../../config/routes.js';

const CATEGORY_ICONS = {
  Technology: 'fa-laptop-code',
  Networking: 'fa-network-wired',
  Engineering: 'fa-tools',
  Marketing: 'fa-bullhorn',
  'Content Writing': 'fa-pen-nib',
  'Customer Support': 'fa-headset',
  Finance: 'fa-chart-line',
  Healthcare: 'fa-stethoscope',
  Design: 'fa-paint-brush',
  Education: 'fa-graduation-cap',
};

const CATEGORY_LABELS = {
  Technology: 'Technology Jobs',
  Networking: 'Networking Jobs',
};

export default function CategoryGrid({ categories }) {
  return (
    <section className="job-categories">
      <div className="section-title">
        <h2>Popular Categories</h2>
      </div>
      <div className="categories-grid">
        {categories.map((category) => (
          <div className="category-card" key={category}>
            <i className={`fas ${CATEGORY_ICONS[category]}`}></i>
            <Link to={routeTo.jobCategory(category)}>
              <h3>{CATEGORY_LABELS[category] ?? category}</h3>
            </Link>
          </div>
        ))}
      </div>
    </section>
  );
}
