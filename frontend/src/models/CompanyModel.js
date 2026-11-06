import { httpClient } from './httpClient.js';

/** Text fields of the company verification form (CompanyVerification on the backend). */
export const COMPANY_FIELDS = [
  'company_name',
  'trade_license_number',
  'company_type',
  'industry',
  'year_established',
  'company_address',
  'company_email',
  'company_phone',
  'company_website',
  'contact_person',
  'contact_designation',
  'ceo_name',
];

export const EMPTY_COMPANY = Object.fromEntries(COMPANY_FIELDS.map((field) => [field, '']));

/** Uploadable documents, in display order. Only the trade license is required. */
export const COMPANY_DOCUMENTS = [
  { field: 'trade_license', label: 'Trade license', hint: 'Valid trade license issued by the city corporation or union parishad.', required: true },
  { field: 'tin_certificate', label: 'TIN certificate', hint: 'Company e-TIN certificate from NBR.' },
  { field: 'incorporation_certificate', label: 'Certificate of incorporation', hint: 'From RJSC, for limited companies.' },
  { field: 'owner_id_document', label: 'CEO / owner NID or passport', hint: 'National ID (both sides) or passport of the CEO, MD or owner.' },
  { field: 'other_document', label: 'Other supporting document', hint: 'e.g. VAT/BIN certificate, office rent deed, bank letter.' },
];

export const COMPANY_TYPES = ['Private Limited', 'Public Limited', 'Sole Proprietorship', 'Partnership', 'NGO / Non-profit', 'Government', 'Other'];

export const DOCUMENT_ACCEPT = '.pdf,.jpg,.jpeg,.png';
export const MAX_DOCUMENT_BYTES = 5 * 1024 * 1024;

/** company_status values on the user, plus the matching copy. */
export const COMPANY_STATUS = {
  not_submitted: { text: 'Not submitted', tone: 'neutral' },
  pending: { text: 'Under review', tone: 'pending' },
  verified: { text: 'Verified', tone: 'verified' },
  rejected: { text: 'Not verified', tone: 'rejected' },
};

export const CompanyModel = {
  /** The employer's own request, or null if none was sent yet. */
  async get() {
    const data = await httpClient.get('/company-verification/');
    return data.verification;
  },

  /** files: { [field]: File }; removed: Set of optional document fields to clear. */
  submit(values, files, removed) {
    const formData = new FormData();
    COMPANY_FIELDS.forEach((field) => formData.append(field, values[field] ?? ''));
    Object.entries(files).forEach(([field, file]) => file && formData.append(field, file));
    removed.forEach((field) => formData.append(`remove_${field}`, '1'));
    return httpClient.postForm('/company-verification/', formData);
  },
};

/** Admin panel: review company verification requests. */
export const CompanyAdminModel = {
  /** status: pending | verified | rejected | all. Returns { companies, counts }. */
  async list(status) {
    const data = await httpClient.get('/admin/companies/', status === 'all' ? undefined : { status });
    return { companies: data.results, counts: data.counts };
  },

  verify(employerId) {
    return httpClient.post(`/admin/companies/${employerId}/verify/`);
  },

  reject(employerId, reason) {
    return httpClient.post(`/admin/companies/${employerId}/reject/`, { reason });
  },
};
