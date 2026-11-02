import { usePageAssets } from '../hooks/usePageAssets.js';

/** Stands in for the original template's <body>; `name` is the scope class of the page's CSS. */
export default function Page({ name, title, stylesheets, className = '', children }) {
  usePageAssets(title, stylesheets);
  return <div className={`${name} ${className}`.trim()}>{children}</div>;
}
