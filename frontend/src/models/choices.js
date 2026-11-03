// Mirrors the choices declared on the Django models (myapp/models.py).

export const JOB_CATEGORIES = [
  'Technology',
  'Networking',
  'Engineering',
  'Marketing',
  'Content Writing',
  'Customer Support',
  'Finance',
  'Healthcare',
  'Design',
  'Education',
];

// Divisions of Bangladesh, used as location filters (matched with icontains).
export const BD_DIVISIONS = [
  'Dhaka',
  'Chattogram',
  'Rajshahi',
  'Khulna',
  'Barishal',
  'Sylhet',
  'Rangpur',
  'Mymensingh',
];

export const JOB_TITLE_CHOICES = JOB_CATEGORIES.map((c) => [c, c]);

export const SALARY_CHOICES = [
  ['<20000', 'Less than 20,000'],
  ['20000-40000', '20,000 - 40,000'],
  ['40000-60000', '40,000 - 60,000'],
  ['60000-80000', '60,000 - 80,000'],
  ['80000-100000', '80,000 - 100,000'],
  ['>100000', 'More than 100,000'],
];

export const STATUS_CHOICES = [
  ['full_time', 'Full time'],
  ['part_time', 'Part time'],
  ['remote', 'Remote'],
  ['hibrid', 'Hibrid'],
  ['internship', 'Internship'],
  ['contractual', 'Contractual'],
];

export const EDUCATION_CHOICES = [
  ['high_school', 'High School'],
  ['bachelors', "Bachelor's"],
  ['masters', "Master's"],
  ['phd', 'PhD'],
];

export const EXPERIENCE_CHOICES = [
  ['entry_level', 'Entry Level (0-2 years)'],
  ['mid_level', 'Mid Level (3-5 years)'],
  ['senior_level', 'Senior Level (5+ years)'],
];

export const DEGREE_TYPE_CHOICES = [
  ['HS', 'High School'],
  ['AD', 'Associate Degree'],
  ['BD', "Bachelor's Degree"],
  ['MD', "Master's Degree"],
  ['PHD', 'Doctorate'],
  ['OT', 'Other'],
];
