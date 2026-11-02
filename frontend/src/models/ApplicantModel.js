import { httpClient } from './httpClient.js';

export const EMPTY_APPLICANT = {
  full_name: '',
  email: '',
  phone: '',
  address: '',
  resume: null,
  cover_letter: '',
  linkedin_profile: '',
  portfolio_website: '',
};

export const EMPTY_WORK_EXPERIENCE = {
  company_name: '',
  position: '',
  responsibilities: '',
  start_date: '',
  end_date: '',
  description: '',
  currently_working: false,
};

export const EMPTY_EDUCATION = {
  institution_name: '',
  degree_type: '',
  field_of_study: '',
  start_year: '',
  end_year: '',
  grade: '',
};

export const ApplicantModel = {
  apply(jobId, applicant, workExperiences, educationalBackgrounds) {
    const formData = new FormData();
    for (const [key, value] of Object.entries(applicant)) {
      if (value !== null) formData.append(key, value);
    }
    formData.append('work_experiences', JSON.stringify(workExperiences));
    formData.append('educational_backgrounds', JSON.stringify(educationalBackgrounds));
    return httpClient.postForm(`/jobs/${jobId}/apply/`, formData);
  },

  async list() {
    return (await httpClient.get('/candidates/')).results;
  },

  get(id) {
    return httpClient.get(`/candidates/${id}/`);
  },
};
