import { useEffect, useState } from 'react';
import { JOB_CATEGORIES } from '../models/choices.js';
import { JobModel } from '../models/JobModel.js';
import { useAuth } from './AuthController.jsx';
import { useFlashMessages } from './FlashController.jsx';
import { useAsync } from './useAsync.js';

const MESSAGE_TIMEOUT_MS = 6000;

export function useHomeController() {
  const { user, logout } = useAuth();
  const { messages, replace } = useFlashMessages();
  const [messagesVisible, setMessagesVisible] = useState(true);
  const { data: latestJobs } = useAsync(() => JobModel.latest(4), [], []);

  useEffect(() => {
    if (!messages.length) return undefined;
    setMessagesVisible(true);
    const timer = setTimeout(() => setMessagesVisible(false), MESSAGE_TIMEOUT_MS);
    return () => clearTimeout(timer);
  }, [messages]);

  const handleLogout = async () => {
    const result = await logout();
    replace(result.detail);
  };

  return {
    isAuthenticated: user.is_authenticated,
    categories: JOB_CATEGORIES,
    latestJobs,
    messages: messagesVisible ? messages : [],
    handleLogout,
  };
}
