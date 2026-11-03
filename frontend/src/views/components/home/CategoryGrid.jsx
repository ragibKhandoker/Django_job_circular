import { ArrowRight, ArrowUp } from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { CATEGORY_ORDER, categoryInfo } from './categoryInfo.js';

const INITIAL_VISIBLE = 6;

export default function CategoryGrid({ categories, jobCounts, categoryLink }) {
  const [showAll, setShowAll] = useState(false);
  const ordered = [...categories].sort((a, b) => CATEGORY_ORDER.indexOf(a) - CATEGORY_ORDER.indexOf(b));
  const visible = showAll ? ordered : ordered.slice(0, INITIAL_VISIBLE);

  return (
    <section className="section">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 className="section-title">Popular Job Categories</h2>
            <p className="section-subtitle">Browse jobs by category and find your perfect match</p>
          </div>
          <button type="button" className="btn btn-ghost" onClick={() => setShowAll((value) => !value)}>
            {showAll ? 'Show Less' : 'View All Categories'}{' '}
            {showAll ? <ArrowUp aria-hidden="true" /> : <ArrowRight aria-hidden="true" />}
          </button>
        </div>

        <div className="category-grid">
          {visible.map((category) => {
            const info = categoryInfo(category);
            const count = jobCounts[category] ?? 0;
            return (
              <Link key={category} to={categoryLink(category)} className="category-card">
                <span className="category-icon"><info.Icon aria-hidden="true" /></span>
                <span className="category-text">
                  <h3>{info.label}</h3>
                  <p>{count} open job{count === 1 ? '' : 's'}</p>
                </span>
                <ArrowRight className="category-arrow" aria-hidden="true" />
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
