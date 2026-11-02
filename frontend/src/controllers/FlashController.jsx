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

/** Messages waiting for this page, plus `show` / `replace` for messages raised on the page itself. */
export function useFlashMessages() {
  const store = useContext(FlashContext);
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const pending = store.take();
    if (pending.length) setMessages(pending);
  }, [store]);

  const show = useCallback((message) => setMessages((current) => [...current, message]), []);
  const replace = useCallback((message) => setMessages([message]), []);

  return { messages, show, replace };
}
