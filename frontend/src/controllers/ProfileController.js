import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ROUTES } from '../config/routes.js';
import { PROFILE_FIELDS, ProfileModel } from '../models/ProfileModel.js';
import { useAuth } from './AuthController.jsx';
import { useFlash, useFlashMessages } from './FlashController.jsx';
import { useAsync } from './useAsync.js';
import { useForm } from './useForm.js';

const MAX_PHOTO_BYTES = 2 * 1024 * 1024;
const EMPTY_PASSWORDS = { old_password: '', new_password1: '', new_password2: '' };

/** /profile: the logged-in user's details and their job posts. */
export function useProfileController() {
  const navigate = useNavigate();
  const { notices, dismissNotices } = useFlashMessages();
  const { data: profile, loading, error } = useAsync(() => ProfileModel.get(), [], null);

  useEffect(() => {
    if (error?.status === 401) navigate(ROUTES.login, { replace: true, state: { from: ROUTES.profile } });
  }, [error, navigate]);

  return { profile, loading, error, notices, dismissNotices };
}

/** /profile/edit: details form (with photo) and a separate change-password form. */
export function useProfileEditController() {
  const navigate = useNavigate();
  const flash = useFlash();
  const { updateUser } = useAuth();
  const { data: profile, loading } = useAsync(() => ProfileModel.get(), [], null);

  const [values, setValues] = useState(null);
  const [initialValues, setInitialValues] = useState(null);
  const [errors, setErrors] = useState({});
  const [message, setMessage] = useState('');
  const [saving, setSaving] = useState(false);
  const [photo, setPhoto] = useState(null);
  const [removePhoto, setRemovePhoto] = useState(false);

  useEffect(() => {
    if (!profile) return;
    const loaded = Object.fromEntries(PROFILE_FIELDS.map((field) => [field, profile[field] ?? '']));
    setValues(loaded);
    setInitialValues(loaded);
  }, [profile]);

  // Local preview of a newly picked photo.
  const photoPreview = useMemo(() => (photo ? URL.createObjectURL(photo) : null), [photo]);
  useEffect(() => () => photoPreview && URL.revokeObjectURL(photoPreview), [photoPreview]);
  const shownPhoto = photoPreview ?? (removePhoto ? '' : profile?.photo ?? '');

  const dirty =
    Boolean(photo) ||
    (removePhoto && Boolean(profile?.photo)) ||
    Boolean(values && initialValues && PROFILE_FIELDS.some((field) => values[field] !== initialValues[field]));

  const setField = (name, value) => setValues((current) => ({ ...current, [name]: value }));
  const handleChange = (event) => setField(event.target.name, event.target.value);

  /** From the file input or a drag-and-drop. */
  const pickPhoto = (file) => {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setErrors((current) => ({ ...current, photo: ['Please choose an image file.'] }));
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      setErrors((current) => ({ ...current, photo: ['Photo must be 2 MB or smaller.'] }));
      return;
    }
    setErrors(({ photo: _ignored, ...rest }) => rest);
    setPhoto(file);
    setRemovePhoto(false);
  };

  const handlePhotoChange = (event) => {
    pickPhoto(event.target.files?.[0]);
    event.target.value = '';
  };

  const handleReset = () => {
    setValues(initialValues);
    setPhoto(null);
    setRemovePhoto(false);
    setErrors({});
    setMessage('');
  };

  const handleRemovePhoto = () => {
    setPhoto(null);
    setRemovePhoto(true);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage('');
    try {
      const result = await ProfileModel.update(values, { photo, removePhoto });
      const { jobs: _jobs, ...user } = result.profile;
      updateUser(user);
      flash(result.detail);
      navigate(ROUTES.profile);
    } catch (error) {
      setErrors(error.errors ?? {});
      setMessage(error.message);
      setSaving(false);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  const password = usePasswordChange();

  return {
    profile,
    loading,
    values,
    errors,
    message,
    saving,
    shownPhoto,
    hasNewPhoto: Boolean(photo),
    dirty,
    setField,
    handleChange,
    pickPhoto,
    handlePhotoChange,
    handleReset,
    handleRemovePhoto,
    handleSubmit,
    password,
  };
}

function usePasswordChange() {
  const { values, handleChange, setValues } = useForm(EMPTY_PASSWORDS);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState(null);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSaving(true);
    setErrors({});
    setStatus(null);
    try {
      const result = await ProfileModel.changePassword(values);
      setValues(EMPTY_PASSWORDS);
      setStatus({ tone: 'success', text: result.detail });
    } catch (error) {
      setErrors(error.errors ?? {});
      setStatus({ tone: 'error', text: error.message });
    } finally {
      setSaving(false);
    }
  };

  return { values, errors, status, saving, handleChange, handleSubmit };
}
