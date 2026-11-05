import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';

const FlashContext = createContext(null);

/**
 * Replaces Django's messages framework: a message pushed before navigating
 * is shown by the next page that displays messages, then discarded.
 */
export function FlashProvider({ children }) {
  const queue = useRef([]);

  const store = useMemo(
    () => ({
      push: (message) => queue.current.push(message),
      take: () => queue.current.splice(0),
    }),
    [],
  );

  return <FlashContext.Provider value={store}>{children}</FlashContext.Provider>;
}

export function useFlash() {
  return useContext(FlashContext).push;
}

/**
 * Messages waiting for this page, plus `show` / `replace` for messages raised on the page itself.
 * `messages` has both; `notices` (flashed by the previous page) and `errors` (raised here) are
 * also returned apart for pages that style them differently.
 */
export function useFlashMessages() {
  const store = useContext(FlashContext);
  const [notices, setNotices] = useState([]);
  const [errors, setErrors] = useState([]);

  useEffect(() => {
    const pending = store.take();
    if (pending.length) setNotices(pending);
  }, [store]);

  const show = useCallback((message) => setErrors((current) => [...current, message]), []);
  const replace = useCallback((message) => {
    setNotices([]);
    setErrors([message]);
  }, []);
  const dismissNotices = useCallback(() => setNotices([]), []);

  const messages = useMemo(() => [...notices, ...errors], [notices, errors]);

  return { messages, notices, errors, show, replace, dismissNotices };
}
