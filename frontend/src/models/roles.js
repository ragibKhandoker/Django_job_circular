// Account roles (UserProfile.role on the backend). The server enforces the rules;
// these helpers only decide which buttons to show.

export const ROLE_LABELS = {
  candidate: 'Job seeker',
  employer: 'Employer',
};

/** "Post a Job" is shown to visitors (sent to log in) and to employers/admins, never to job seekers. */
export function showPostJob(user) {
  return !user.is_authenticated || user.is_staff || user.role === 'employer';
}

/** "Apply" is shown to visitors and job seekers, never to employers. */
export function showApply(user) {
  return !user.is_authenticated || user.can_apply !== false;
}

export function roleLabel(user) {
  if (user.is_staff) return 'Administrator';
  const label = ROLE_LABELS[user.role] ?? 'Member';
  if (user.role === 'employer' && user.employer_status === 'pending') return `${label} · Pending approval`;
  if (user.role === 'employer' && user.employer_status === 'rejected') return `${label} · Not approved`;
  return label;
}
