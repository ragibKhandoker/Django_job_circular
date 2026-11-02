import { usePageAssets } from '../hooks/usePageAssets.js';

/** Plain page in the spirit of Django's default 404 response. */
export default function NotFoundPage() {
  usePageAssets('Not Found');
  return (
    <div style={{ padding: '8px', fontFamily: 'sans-serif' }}>
      <h1>Not Found</h1>
      <p>The requested resource was not found on this server.</p>
    </div>
  );
}
