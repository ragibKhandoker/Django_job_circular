import { useEffect } from 'react';

const linkUsers = new Map();

function acquireStylesheet(href) {
  const users = linkUsers.get(href) ?? 0;
  if (users === 0) {
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = href;
    link.dataset.pageAsset = href;
    document.head.appendChild(link);
  }
  linkUsers.set(href, users + 1);
}

function releaseStylesheet(href) {
  const users = (linkUsers.get(href) ?? 1) - 1;
  linkUsers.set(href, users);
  if (users === 0) document.head.querySelector(`link[data-page-asset="${CSS.escape(href)}"]`)?.remove();
}

/**
 * Sets the document title and loads the stylesheets a page's original
 * template linked (Bootstrap, Google Fonts, ...) only while that page is
 * mounted, so e.g. Bootstrap's reset never touches the other pages.
 */
export function usePageAssets(title, stylesheets = []) {
  useEffect(() => {
    document.title = title;
  }, [title]);

  const key = stylesheets.join('|');
  useEffect(() => {
    const hrefs = key ? key.split('|') : [];
    hrefs.forEach(acquireStylesheet);
    return () => hrefs.forEach(releaseStylesheet);
  }, [key]);
}
