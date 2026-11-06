import { BriefcaseBusiness, Flame, Search, TrendingUp } from 'lucide-react';
// Photo: Vitaly Gariev on Unsplash (Unsplash License)
// https://unsplash.com/photos/two-professionals-shaking-hands-across-a-table-jEpZNyFSQwQ
import heroPhoto from '../../images/hero-interview.jpg';
import LocationSelect from './LocationSelect.jsx';

const POPULAR_SEARCHES = [
  { label: 'IT Job', q: 'Technology' },
  { label: 'Bank Job', q: 'Finance' },
  { label: 'Remote Job', q: 'remote' },
  { label: 'Engineering', q: 'Engineering' },
  { label: 'Healthcare', q: 'Healthcare' },
];

export default function HeroSection({
  keyword,
  location,
  locations,
  totalJobs,
  onKeywordChange,
  onLocationChange,
  onSearch,
  onQuickSearch,
}) {
  return (
    <section className="hero">
      <div className="container hero-inner">
        <div className="hero-copy">
          <span className="hero-badge">
            <Flame aria-hidden="true" /> Latest Job Circulars in Bangladesh
          </span>
          <h1>
            Find Your Dream Job
            <br />
            with <span className="highlight">JobFinder</span>
          </h1>
          <p className="hero-lead">
            Explore job opportunities from top companies across Bangladesh. Your better career is just a search away!
          </p>

          <form className="search-bar" onSubmit={onSearch} role="search">
            <label className="search-field">
              <Search aria-hidden="true" />
              <input
                id="job-search"
                type="search"
                placeholder="Search for jobs (e.g. Software, Finance, Remote...)"
                value={keyword}
                onChange={onKeywordChange}
                aria-label="Job keyword"
              />
            </label>
            <LocationSelect value={location} options={locations} onChange={onLocationChange} />
            <button type="submit" className="btn btn-primary search-submit">
              <Search aria-hidden="true" /> Search<span className="search-submit-extra"> Jobs</span>
            </button>
          </form>

          <div className="popular-searches">
            <span className="popular-title">
              <TrendingUp aria-hidden="true" /> Popular Searches:
            </span>
            {POPULAR_SEARCHES.map((item) => (
              <button key={item.label} type="button" className="chip" onClick={() => onQuickSearch(item.q)}>
                {item.label}
              </button>
            ))}
          </div>
        </div>

        <HeroPhoto totalJobs={totalJobs} />
      </div>
    </section>
  );
}

function HeroPhoto({ totalJobs }) {
  return (
    <div className="hero-photo">
      <img
        src={heroPhoto}
        alt="A recruiter shaking hands with a candidate after a job interview"
        width="1600"
        height="900"
      />
      {totalJobs > 0 && (
        <div className="photo-badge" aria-hidden="true">
          <span className="photo-badge-icon"><BriefcaseBusiness aria-hidden="true" /></span>
          <div>
            <strong>{totalJobs}</strong>
            <small>Live job{totalJobs === 1 ? '' : 's'} right now</small>
          </div>
        </div>
      )}
    </div>
  );
}
