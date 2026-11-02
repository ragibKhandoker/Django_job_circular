// Ports of the Django template filters the original pages relied on.

const MINUTE = 60;
const HOUR = 60 * MINUTE;
const DAY = 24 * HOUR;
const TIMESINCE_CHUNKS = [
  [365 * DAY, 'year', 'years'],
  [30 * DAY, 'month', 'months'],
  [7 * DAY, 'week', 'weeks'],
  [DAY, 'day', 'days'],
  [HOUR, 'hour', 'hours'],
  [MINUTE, 'minute', 'minutes'],
];

const pluralize = (count, singular, plural) => `${count} ${count === 1 ? singular : plural}`;

/** {{ value|timesince }}, e.g. "2 days, 3 hours". */
export function timesince(isoDate, now = new Date()) {
  let seconds = Math.max(0, Math.floor((now - new Date(isoDate)) / 1000));
  const index = TIMESINCE_CHUNKS.findIndex(([size]) => seconds >= size);
  if (index === -1) return pluralize(0, 'minute', 'minutes');

  const parts = [];
  for (const [size, singular, plural] of TIMESINCE_CHUNKS.slice(index, index + 2)) {
    const count = Math.floor(seconds / size);
    if (count === 0) break;
    parts.push(pluralize(count, singular, plural));
    seconds -= count * size;
  }
  return parts.join(', ');
}

/** {{ value|truncatewords:n }} */
export function truncateWords(text, count) {
  const words = (text ?? '').trim().split(/\s+/).filter(Boolean);
  return words.length > count ? `${words.slice(0, count).join(' ')}…` : words.join(' ');
}

const MONTHS_AP = ['Jan.', 'Feb.', 'March', 'April', 'May', 'June', 'July', 'Aug.', 'Sept.', 'Oct.', 'Nov.', 'Dec.'];

/** Django's default DATE_FORMAT ("N j, Y"), e.g. "Nov. 2, 2026". */
export function formatDate(isoDate) {
  if (!isoDate) return 'None';
  const [year, month, day] = isoDate.slice(0, 10).split('-').map(Number);
  return `${MONTHS_AP[month - 1]} ${day}, ${year}`;
}

/** How Django renders a raw value with {{ value }}. */
export function displayValue(value) {
  if (value === null || value === undefined) return 'None';
  if (value === true) return 'True';
  if (value === false) return 'False';
  return String(value);
}
