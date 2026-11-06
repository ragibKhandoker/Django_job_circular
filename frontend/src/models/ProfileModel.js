import { httpClient } from './httpClient.js';
import { Job } from './JobModel.js';

/** Fields of /profile/edit; `photo` is handled separately as a File. */
export const PROFILE_FIELDS = [
  'first_name',
  'last_name',
  'username',
  'email',
  'headline',
  'phone',
  'location',
  'bio',
  'website',
  'linkedin',
];

// Filled-in fields that count towards "profile strength".
const COMPLETENESS_FIELDS = ['first_name', 'last_name', 'headline', 'phone', 'location', 'bio', 'photo'];

export class Profile {
  constructor(data) {
    Object.assign(this, data);
    this.jobs = (data.jobs ?? []).map((item) => new Job(item));
  }

  get fullName() {
    return `${this.first_name} ${this.last_name}`.trim() || this.username;
  }

  get initials() {
    const parts = this.fullName.split(/\s+/).filter(Boolean);
    return parts.slice(0, 2).map((part) => part[0].toUpperCase()).join('');
  }

  get skillList() {
    return (this.skills ?? '').split(',').map((skill) => skill.trim()).filter(Boolean);
  }

  /** 0-100 */
  get completeness() {
    const filled = COMPLETENESS_FIELDS.filter((field) => String(this[field] ?? '').trim()).length;
    return Math.round((filled / COMPLETENESS_FIELDS.length) * 100);
  }

  get missingFields() {
    return COMPLETENESS_FIELDS.filter((field) => !String(this[field] ?? '').trim());
  }
}

export const ProfileModel = {
  async get() {
    return new Profile(await httpClient.get('/auth/profile/'));
  },

  /** values: PROFILE_FIELDS; photo: File | null; removePhoto: boolean */
  async update(values, { photo, removePhoto }) {
    const formData = new FormData();
    PROFILE_FIELDS.forEach((field) => formData.append(field, values[field] ?? ''));
    if (photo) formData.append('photo', photo);
    if (removePhoto) formData.append('remove_photo', '1');
    const result = await httpClient.postForm('/auth/profile/', formData);
    return { ...result, profile: new Profile(result.profile) };
  },

  changePassword(values) {
    return httpClient.post('/auth/password-change/', values);
  },
};
