import {
  ArrowLeft,
  BriefcaseBusiness,
  Check,
  CircleCheck,
  Hourglass,
  LayoutGrid,
  Plus,
  Rocket,
  Search,
  SearchX,
  Send,
  UserRound,
  X,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { ROUTES, routeTo } from '../../config/routes.js';
import { useAuth } from '../../controllers/AuthController.jsx';
import { useJobListController } from '../../controllers/JobsController.js';
import { showPostJob } from '../../models/roles.js';
import { JOB_CATEGORIES, STATUS_CHOICES } from '../../models/choices.js';
import { PLUS_JAKARTA } from '../assets.js';
import { categoryInfo } from '../components/home/categoryInfo.js';
import JobListingCard from '../components/jobs/JobListingCard.jsx';
import Page from '../components/Page.jsx';
import ThemeToggle from '../components/ThemeToggle.jsx';
// Photo: Vitaly Gariev on Unsplash (Unsplash License)
// https://unsplash.com/photos/a-man-smiles-while-working-on-a-laptop-M9gGJqvAMGE
import heroPhoto from '../images/candidate-laptop.jpg';
import '../styles/pages/job-list.css';

const SKELETONS = 4;

/** Serves both /job-list and /jobs/category/:category, like job_list.html did. */
export default function JobListPage() {
  const { category } = useParams();
  const list = useJobListController(category);
  const { user } = useAuth();
  const heading = category ? categoryInfo(category).label : 'All job circulars';

  return (
    <Page name="page-job-list" title={`${category ? heading : 'Job Listings'} - JobFinder`} stylesheets={[PLUS_JAKARTA]}>
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

      <section className="jl-hero">
        <img src={heroPhoto} alt="" className="jl-hero-photo" />
        <div className="jl-wrap jl-hero-content">
          <span className="jl-eyebrow">
            <span className="jl-live-dot" aria-hidden="true" />
            {list.loading ? 'Loading jobs...' : `${list.totalJobs} open position${list.totalJobs === 1 ? '' : 's'}`}
          </span>
          <h1>{category ? <>{heading} <span>jobs</span></> : <>Find a job you will <span>love</span></>}</h1>
          <p>Verified job circulars from employers across Bangladesh. Every post is reviewed before it goes live.</p>

          <label className="jl-search">
            <Search aria-hidden="true" />
            <input
              type="search"
              value={list.keyword}
              onChange={list.handleKeywordChange}
              placeholder="Search by company, location or skill..."
              aria-label="Search jobs"
            />
          </label>
        </div>
      </section>

      <main className="jl-wrap jl-main">
        {list.submitted && <SubmittedBanner status={list.submitted} onDismiss={list.dismissSubmitted} />}

        <nav className="jl-categories" aria-label="Categories">
          <Link to={ROUTES.jobList} className={!category ? 'is-active' : ''}>
            <LayoutGrid aria-hidden="true" /> All
          </Link>
          {JOB_CATEGORIES.map((value) => {
            const { label, Icon } = categoryInfo(value);
            return (
              <Link key={value} to={routeTo.jobCategory(value)} className={category === value ? 'is-active' : ''}>
                <Icon aria-hidden="true" /> {label}
              </Link>
            );
          })}
        </nav>

        <div className="jl-toolbar">
          <div className="jl-types" role="radiogroup" aria-label="Job type">
            <button type="button" className={!list.jobType ? 'is-active' : ''} onClick={() => list.setJobType('')}>
              Any type
            </button>
            {STATUS_CHOICES.map(([value, text]) => (
              <button
                key={value}
                type="button"
                className={list.jobType === value ? 'is-active' : ''}
                onClick={() => list.setJobType(list.jobType === value ? '' : value)}
              >
                {text}
              </button>
            ))}
          </div>

          <div className="jl-toolbar-right">
            <span className="jl-count">
              <strong>{list.jobs.length}</strong> {list.jobs.length === 1 ? 'job' : 'jobs'}
            </span>
            <select value={list.sort} onChange={list.handleSortChange} aria-label="Sort jobs" className="jl-sort">
              <option value="newest">Newest first</option>
              <option value="deadline">Deadline soonest</option>
            </select>
          </div>
        </div>

        {list.loading && list.jobs.length === 0 ? (
          <div className="jl-grid">
            {Array.from({ length: SKELETONS }, (_, index) => <div key={index} className="jl-card jl-skeleton" aria-hidden="true" />)}
          </div>
        ) : list.jobs.length > 0 ? (
          <div className="jl-grid">
            {list.jobs.map((job, index) => (
              <JobListingCard
                key={job.id}
                job={job}
                canDelete={list.canDelete(job)}
                onDelete={list.handleDelete}
                style={{ animationDelay: `${Math.min(index, 8) * 0.05}s` }}
              />
            ))}
          </div>
        ) : (
          <div className="jl-empty">
            <span className="jl-empty-icon">{list.hasFilters ? <SearchX aria-hidden="true" /> : <BriefcaseBusiness aria-hidden="true" />}</span>
            <h2>{list.hasFilters ? 'No jobs match your search' : 'No jobs here yet'}</h2>
            <p>
              {list.hasFilters
                ? 'Try a different keyword or job type.'
                : 'New circulars are added every day. Please check back soon.'}
            </p>
            {list.hasFilters ? (
              <button type="button" className="jl-btn jl-btn-ghost" onClick={list.clearFilters}>
                <X aria-hidden="true" /> Clear filters
              </button>
            ) : (
              category && (
                <Link to={ROUTES.jobList} className="jl-btn jl-btn-ghost">
                  <LayoutGrid aria-hidden="true" /> See all jobs
                </Link>
              )
            )}
          </div>
        )}
      </main>
    </Page>
  );
}

function SubmittedBanner({ status, onDismiss }) {
  const pending = status === 'pending';
  const steps = [
    { Icon: Send, title: 'Submitted', text: 'We received your job post' },
    { Icon: Hourglass, title: 'Admin review', text: 'Checking it is a genuine circular' },
    { Icon: Rocket, title: 'Live', text: 'Job seekers can apply' },
  ];
  const current = pending ? 1 : 2;

  return (
    <section className={`jl-submitted ${pending ? 'is-pending' : 'is-live'}`} role="status">
      <button type="button" className="jl-submitted-close" onClick={onDismiss} aria-label="Dismiss">
        <X aria-hidden="true" />
      </button>

      <div className="jl-submitted-main">
        <span className="jl-submitted-badge">
          {pending ? <Hourglass aria-hidden="true" /> : <CircleCheck aria-hidden="true" />}
        </span>
        <div>
          <h2>{pending ? 'Your job post is in review' : 'Your job is live!'}</h2>
          <p>
            {pending
              ? 'Thanks for posting! An admin will check it shortly. It will appear in this list as soon as it is approved.'
              : 'Job seekers can now find your circular and apply.'}
          </p>
        </div>
      </div>

      <ol className="jl-timeline">
        {steps.map(({ Icon, title, text }, index) => {
          const state = index < current ? 'is-done' : index === current ? 'is-current' : '';
          return (
            <li key={title} className={state}>
              <span className="jl-timeline-dot">
                {index < current ? <Check aria-hidden="true" /> : <Icon aria-hidden="true" />}
              </span>
              <strong>{title}</strong>
              <small>{text}</small>
            </li>
          );
        })}
      </ol>

      <div className="jl-submitted-actions">
        <Link to={ROUTES.profile} className="jl-btn jl-btn-light">
          <UserRound aria-hidden="true" /> Track on my profile
        </Link>
        <Link to={ROUTES.postJob} className="jl-btn jl-btn-outline-light">
          <Plus aria-hidden="true" /> Post another job
        </Link>
      </div>
    </section>
  );
}
