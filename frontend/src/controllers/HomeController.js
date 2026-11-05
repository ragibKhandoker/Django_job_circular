import { useCallback, useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES, routeTo } from '../config/routes.js';
import { BD_DIVISIONS, JOB_CATEGORIES, SALARY_CHOICES, STATUS_CHOICES } from '../models/choices.js';
import { JobModel } from '../models/JobModel.js';
import { useAuth } from './AuthController.jsx';
import { useFlashMessages } from './FlashController.jsx';
import { useAsync } from './useAsync.js';

const MESSAGE_TIMEOUT_MS = 6000;
const label = (choices, value) => Object.fromEntries(choices)[value] ?? value;
const LATEST_JOBS = 6;
const TOP_COMPANIES = 6;

export function useHomeController() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const { messages, replace } = useFlashMessages();
  const [messagesVisible, setMessagesVisible] = useState(true);
  const [keyword, setKeyword] = useState('');
  const [location, setLocation] = useState('');
  const { data: jobs, loading } = useAsync(() => JobModel.list({ latest: '1' }), [], []);

  useEffect(() => {
    if (!messages.length) return undefined;
    setMessagesVisible(true);
    const timer = setTimeout(() => setMessagesVisible(false), MESSAGE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [messages]);

  const jobCounts = useMemo(() => {
    const counts = Object.fromEntries(JOB_CATEGORIES.map((category) => [category, 0]));
    jobs.forEach((job) => {
      counts[job.title] = (counts[job.title] ?? 0) + 1;
    });
    return counts;
  }, [jobs]);

  const companies = useMemo(() => {
    const byName = new Map();
    jobs.forEach((job) => {
      const company = byName.get(job.company_name) ?? { name: job.company_name, location: job.location, openings: 0 };
      company.openings += 1;
      byName.set(job.company_name, company);
    });
    return [...byName.values()].sort((a, b) => b.openings - a.openings).slice(0, TOP_COMPANIES);
  }, [jobs]);

  const search = (params) => {
    const query = new URLSearchParams(Object.entries(params).filter(([, value]) => value)).toString();
    navigate(query ? `${ROUTES.totalJobs}?${query}` : ROUTES.totalJobs);
  };

  const handleSearch = (event) => {
    event.preventDefault();
    search({ q: keyword.trim(), location });
  };

  const handleLogout = async () => {
    const result = await logout();
    replace(result.detail);
  };

  return {
    isAuthenticated: user.is_authenticated,
    username: user.username,
    isStaff: Boolean(user.is_staff),
    messages: messagesVisible ? messages : [],
    messageTimeout: MESSAGE_TIMEOUT_MS,
    dismissMessages: useCallback(() => setMessagesVisible(false), []),
    loading,
    totalJobs: jobs.length,
    jobCounts,
    latestJobs: jobs.slice(0, LATEST_JOBS),
    companies,
    keyword,
    location,
    handleKeywordChange: (event) => setKeyword(event.target.value),
    handleLocationChange: setLocation,
    handleSearch,
    searchKeyword: (q) => search({ q }),
    categories: JOB_CATEGORIES,
    locations: BD_DIVISIONS,
    statusLabel: (value) => label(STATUS_CHOICES, value),
    salaryLabel: (value) => label(SALARY_CHOICES, value),
    categoryLink: routeTo.jobCategory,
    applyLink: routeTo.applyForm,
    handleLogout,
  };
}
