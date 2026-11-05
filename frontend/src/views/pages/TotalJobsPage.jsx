import {
  ArrowLeft,
  BriefcaseBusiness,
  Clock,
  Flame,
  LayoutGrid,
  MapPin,
  Plus,
  Search,
  SearchX,
  SlidersHorizontal,
  Sparkles,
  Wallet,
  X,
} from 'lucide-react';
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useAuth } from '../../controllers/AuthController.jsx';
import { useTotalJobsController } from '../../controllers/JobsController.js';
import { BD_DIVISIONS, EXPERIENCE_CHOICES, SALARY_CHOICES, STATUS_CHOICES } from '../../models/choices.js';
import { showPostJob } from '../../models/roles.js';
import { PLUS_JAKARTA } from '../assets.js';
import JobListingCard from '../components/jobs/JobListingCard.jsx';
import Page from '../components/Page.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
// Photo: Vitaly Gariev on Unsplash (Unsplash License)
// https://unsplash.com/photos/two-colleagues-collaborating-on-a-laptop-in-office-YDWdxElP3XI
import heroPhoto from '../images/login-office.jpg';
// Shares the job list's cards, top bar and hero; total-jobs.css adds the search panel and filters.
import '../styles/pages/job-list.css';
import '../styles/pages/total-jobs.css';

const POPULAR = ['Developer', 'Marketing', 'Accounts', 'Teacher', 'Designer', 'Customer Support'];
const SKELETONS = 3;

export default function TotalJobsPage() {
  const s = useTotalJobsController();
  const { user } = useAuth();
  const [filtersOpen, setFiltersOpen] = useState(false);

  const heading = s.q ? (
    <>Jobs matching <span>“{s.q}”</span></>
  ) : s.location ? (
    <>Jobs in <span>{s.location}</span></>
  ) : (
    <>Search <span>every job</span> in one place</>
  );

  return (
    <Page name="page-job-list page-total-jobs" title={`${s.q ? `${s.q} jobs` : 'Search jobs'} - JobFinder`} stylesheets={[PLUS_JAKARTA]}>
      <header className="jl-topbar">
        <div className="jl-wrap jl-topbar-inner">
          <Link to={ROUTES.home} className="jl-glass jl-back">
            <ArrowLeft aria-hidden="true" /> <span>Home</span>
          </Link>
          <Link to={ROUTES.home} className="jl-brand">
            <span className="jl-brand-icon"><BriefcaseBusiness aria-hidden="true" /></span>
            <strong>Job<span>Finder</span></strong>
          </Link>
          <div className="jl-topbar-actions">
            {showPostJob(user) && (
              <Link to={ROUTES.postJob} className="jl-glass jl-post">
                <Plus aria-hidden="true" /> <span>Post a job</span>
              </Link>
            )}
            <ThemeToggle className="jl-glass jl-icon-btn" />
          </div>
        </div>
      </header>

      <section className="jl-hero ts-hero">
        <img src={heroPhoto} alt="" className="jl-hero-photo" />
        <div className="jl-wrap jl-hero-content">
          <span className="jl-eyebrow">
            <span className="jl-live-dot" aria-hidden="true" />
            {s.loading ? 'Searching...' : `${s.totalJobs} result${s.totalJobs === 1 ? '' : 's'} found`}
          </span>
          <h1>{heading}</h1>

          <form className="ts-search" onSubmit={s.handleSubmit} role="search">
            <label className="ts-field">
              <Search aria-hidden="true" />
              <input
                type="search"
                value={s.keywordInput}
                onChange={s.handleKeywordChange}
                placeholder="Job title, company or skill"
                aria-label="Keyword"
              />
            </label>
            <span className="ts-divider" aria-hidden="true" />
            <label className="ts-field">
              <MapPin aria-hidden="true" />
              <input
                value={s.locationInput}
                onChange={s.handleLocationChange}
                list="ts-locations"
                placeholder="Any location"
                aria-label="Location"
              />
              <datalist id="ts-locations">
                {BD_DIVISIONS.map((division) => <option key={division} value={division} />)}
              </datalist>
            </label>
            <button type="submit" className="ts-submit">
              <Search aria-hidden="true" /> <span>Search</span>
            </button>
          </form>

          <div className="ts-quick">
            <button type="button" className={`ts-latest${s.latest ? ' is-on' : ''}`} onClick={s.toggleLatest} aria-pressed={s.latest}>
              <Flame aria-hidden="true" /> Top 10 latest
            </button>
            {BD_DIVISIONS.map((division) => (
              <button
                key={division}
                type="button"
                className={s.location.toLowerCase() === division.toLowerCase() ? 'is-on' : ''}
                onClick={() => s.pickLocation(division)}
              >
                {division}
              </button>
            ))}
          </div>
        </div>
      </section>

      <main className="jl-wrap jl-main ts-main">
        <aside className={`ts-filters${filtersOpen ? ' is-open' : ''}`}>
          <div className="ts-filters-head">
            <h2><SlidersHorizontal aria-hidden="true" /> Filters</h2>
            {s.activeFilterCount > 0 && (
              <button type="button" className="ts-clear" onClick={s.clearFilters}>Clear all</button>
            )}
          </div>

          <FilterGroup Icon={Clock} title="Job type">
            {STATUS_CHOICES.map(([value, text]) => (
              <label key={value} className="ts-option">
                <input type="checkbox" checked={s.filters.status.includes(value)} onChange={() => s.toggleStatus(value)} />
                <span className="ts-box" aria-hidden="true" />
                {text}
                <span className="ts-count">{s.counts.status[value] ?? 0}</span>
              </label>
            ))}
          </FilterGroup>

          <FilterGroup Icon={Wallet} title="Salary (BDT / month)">
            {SALARY_CHOICES.map(([value, text]) => (
              <label key={value} className="ts-option">
                <input type="radio" name="ts-salary" checked={s.filters.salary === value} onChange={() => {}} onClick={() => s.setFilter('salary', value)} />
                <span className="ts-box is-round" aria-hidden="true" />
                {text}
                <span className="ts-count">{s.counts.salary[value] ?? 0}</span>
              </label>
            ))}
          </FilterGroup>

          <FilterGroup Icon={BriefcaseBusiness} title="Experience">
            {EXPERIENCE_CHOICES.map(([value, text]) => (
              <label key={value} className="ts-option">
                <input
                  type="radio"
                  name="ts-experience"
                  checked={s.filters.experience_level === value}
                  onChange={() => {}}
                  onClick={() => s.setFilter('experience_level', value)}
                />
                <span className="ts-box is-round" aria-hidden="true" />
                {text.split(' (')[0]}
                <span className="ts-count">{s.counts.experience_level[value] ?? 0}</span>
              </label>
            ))}
          </FilterGroup>

          <div className="ts-promo">
            <Sparkles aria-hidden="true" />
            <strong>Get noticed faster</strong>
            <p>A complete profile with skills helps employers pick you.</p>
            <Link to={ROUTES.profile}>Update profile</Link>
          </div>
        </aside>

        <section className="ts-results">
          <div className="ts-results-head">
            <div>
              <h2>
                <strong>{s.jobs.length}</strong> {s.jobs.length === 1 ? 'job' : 'jobs'}
                {s.activeFilterCount > 0 && <small> of {s.totalJobs}</small>}
              </h2>
              <div className="ts-active">
                {s.q && <Chip onRemove={() => s.clearSearch('q')}><Search aria-hidden="true" /> {s.q}</Chip>}
                {s.location && <Chip onRemove={() => s.clearSearch('location')}><MapPin aria-hidden="true" /> {s.location}</Chip>}
                {s.latest && <Chip onRemove={s.toggleLatest}><Flame aria-hidden="true" /> Top 10 latest</Chip>}
              </div>
            </div>
            <div className="ts-results-tools">
              <button type="button" className="ts-filter-toggle" onClick={() => setFiltersOpen((open) => !open)}>
                <SlidersHorizontal aria-hidden="true" /> Filters{s.activeFilterCount > 0 && ` (${s.activeFilterCount})`}
              </button>
              <select value={s.sort} onChange={s.handleSortChange} aria-label="Sort jobs" className="jl-sort">
                <option value="newest">Newest first</option>
                <option value="deadline">Deadline soonest</option>
              </select>
            </div>
          </div>

          {s.loading && s.jobs.length === 0 ? (
            <div className="jl-grid ts-grid">
              {Array.from({ length: SKELETONS }, (_, index) => <div key={index} className="jl-card jl-skeleton" aria-hidden="true" />)}
            </div>
          ) : s.jobs.length > 0 ? (
            <div className="jl-grid ts-grid">
              {s.jobs.map((job, index) => (
                <JobListingCard
                  key={job.id}
                  job={job}
                  highlight={s.q}
                  style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
                />
              ))}
            </div>
          ) : (
            <div className="jl-empty ts-empty">
              <span className="jl-empty-icon"><SearchX aria-hidden="true" /></span>
              <h2>{s.q ? `No jobs match “${s.q}”` : 'No jobs found'}</h2>
              <p>
                {s.activeFilterCount > 0
                  ? 'Try removing a filter.'
                  : s.location
                    ? `Nothing in ${s.location} right now. Try another location or a broader keyword.`
                    : 'Try a different keyword or check the spelling.'}
              </p>
              <div className="ts-empty-actions">
                {s.activeFilterCount > 0 && (
                  <button type="button" className="jl-btn jl-btn-ghost" onClick={s.clearFilters}>
                    <X aria-hidden="true" /> Clear filters
                  </button>
                )}
                <Link to={ROUTES.jobList} className="jl-btn jl-btn-ghost">
                  <LayoutGrid aria-hidden="true" /> Browse all jobs
                </Link>
              </div>
              <div className="ts-popular">
                <span>Popular searches:</span>
                {POPULAR.map((term) => (
                  <Link key={term} to={`${ROUTES.totalJobs}?q=${encodeURIComponent(term)}`}>{term}</Link>
                ))}
              </div>
            </div>
          )}
        </section>
      </main>
    </Page>
  );
}

function FilterGroup({ Icon, title, children }) {
  return (
    <fieldset className="ts-group">
      <legend><Icon aria-hidden="true" /> {title}</legend>
      {children}
    </fieldset>
  );
}

function Chip({ onRemove, children }) {
  return (
    <span className="ts-chip">
      {children}
      <button type="button" onClick={onRemove} aria-label="Remove">
        <X aria-hidden="true" />
      </button>
    </span>
  );
}
