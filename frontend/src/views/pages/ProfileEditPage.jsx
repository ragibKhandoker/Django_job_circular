import {
  AtSign,
  Camera,
  CircleAlert,
  CircleCheck,
  Globe,
  KeyRound,
  Link2,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  Save,
  Trash2,
  UserRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useProfileEditController } from '../../controllers/ProfileController.js';
import { BD_DIVISIONS } from '../../models/choices.js';
import { PLUS_JAKARTA } from '../assets.js';
import Page from '../components/Page.jsx';
import '../styles/pages/profile.css';
import { Avatar, ProfileTopbar } from './ProfilePage.jsx';

const BIO_MAX = 1000;

export default function ProfileEditPage() {
  const edit = useProfileEditController();
  const { values, errors, password } = edit;

  return (
    <Page name="page-profile" title="Edit Profile - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <ProfileTopbar />

      {edit.loading || !values ? (
        <div className="profile-wrap profile-state">
          <LoaderCircle className="profile-spin" aria-hidden="true" />
          <p>Loading your profile...</p>
        </div>
      ) : (
        <main className="profile-wrap profile-main profile-edit">
          <div className="profile-edit-heading">
            <h1>Edit profile</h1>
            <p>Keep your details up to date so employers can reach you.</p>
          </div>

          {edit.message && (
            <div className="profile-alert" role="alert">
              <CircleAlert aria-hidden="true" /> {edit.message}
            </div>
          )}

          <form onSubmit={edit.handleSubmit} noValidate>
            <section className="profile-card">
              <h2>Profile photo</h2>
              <div className="profile-photo-row">
                <Avatar profile={edit.profile} src={edit.shownPhoto} className="is-large" />
                <div className="profile-photo-actions">
                  <label className="profile-btn profile-btn-ghost">
                    <Camera aria-hidden="true" /> {edit.shownPhoto ? 'Change photo' : 'Upload photo'}
                    <input type="file" accept="image/*" onChange={edit.handlePhotoChange} hidden />
                  </label>
                  {edit.shownPhoto && (
                    <button type="button" className="profile-btn profile-btn-danger-ghost" onClick={edit.handleRemovePhoto}>
                      <Trash2 aria-hidden="true" /> Remove
                    </button>
                  )}
                  <small>JPG or PNG, up to 2 MB.{edit.hasNewPhoto && ' New photo will be saved when you click Save.'}</small>
                  <FieldErrors errors={errors.photo} />
                </div>
              </div>
            </section>

            <section className="profile-card">
              <h2>Basic information</h2>
              <div className="profile-form-grid">
                <Field label="First name" Icon={UserRound} errors={errors.first_name}>
                  <input name="first_name" value={values.first_name} onChange={edit.handleChange} autoComplete="given-name" maxLength={150} />
                </Field>
                <Field label="Last name" Icon={UserRound} errors={errors.last_name}>
                  <input name="last_name" value={values.last_name} onChange={edit.handleChange} autoComplete="family-name" maxLength={150} />
                </Field>
                <Field label="Username" Icon={AtSign} errors={errors.username}>
                  <input name="username" value={values.username} onChange={edit.handleChange} autoComplete="username" required maxLength={150} />
                </Field>
                <Field label="Email address" Icon={Mail} errors={errors.email}>
                  <input type="email" name="email" value={values.email} onChange={edit.handleChange} autoComplete="email" required />
                </Field>
                <Field label="Headline" errors={errors.headline} wide hint="e.g. Frontend Developer · 3 years of experience">
                  <input name="headline" value={values.headline} onChange={edit.handleChange} maxLength={120} placeholder="What do you do?" />
                </Field>
              </div>
            </section>

            <section className="profile-card">
              <h2>Contact</h2>
              <div className="profile-form-grid">
                <Field label="Phone" Icon={Phone} errors={errors.phone}>
                  <input type="tel" name="phone" value={values.phone} onChange={edit.handleChange} autoComplete="tel" maxLength={20} placeholder="01XXXXXXXXX" />
                </Field>
                <Field label="Location" Icon={MapPin} errors={errors.location}>
                  <input name="location" value={values.location} onChange={edit.handleChange} list="profile-locations" maxLength={100} placeholder="Dhaka" />
                  <datalist id="profile-locations">
                    {BD_DIVISIONS.map((division) => <option key={division} value={division} />)}
                  </datalist>
                </Field>
                <Field label="Website" Icon={Globe} errors={errors.website}>
                  <input type="url" name="website" value={values.website} onChange={edit.handleChange} placeholder="https://your-site.com" />
                </Field>
                <Field label="LinkedIn" Icon={Link2} errors={errors.linkedin}>
                  <input type="url" name="linkedin" value={values.linkedin} onChange={edit.handleChange} placeholder="https://linkedin.com/in/you" />
                </Field>
              </div>
            </section>

            <section className="profile-card">
              <h2>About you</h2>
              <div className="profile-form-grid">
                <Field
                  label="Bio"
                  errors={errors.bio}
                  wide
                  hint={`${values.bio.length}/${BIO_MAX} characters`}
                >
                  <textarea
                    name="bio"
                    rows={5}
                    value={values.bio}
                    onChange={edit.handleChange}
                    maxLength={BIO_MAX}
                    placeholder="A few lines about your experience and the kind of work you are looking for."
                  />
                </Field>
                <Field label="Skills" errors={errors.skills} wide hint="Separate skills with commas.">
                  <input name="skills" value={values.skills} onChange={edit.handleChange} maxLength={300} placeholder="React, Django, Communication" />
                </Field>
              </div>
            </section>

            <div className="profile-save-bar">
              <Link to={ROUTES.profile} className="profile-btn profile-btn-ghost">Cancel</Link>
              <button type="submit" className="profile-btn profile-btn-primary" disabled={edit.saving}>
                {edit.saving ? <LoaderCircle className="profile-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
                {edit.saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </form>

          <form className="profile-card profile-password" onSubmit={password.handleSubmit}>
            <h2><KeyRound aria-hidden="true" /> Change password</h2>
            {password.status && (
              <div className={password.status.tone === 'success' ? 'profile-success' : 'profile-alert'} role="status">
                {password.status.tone === 'success' ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
                {password.status.text}
              </div>
            )}
            <div className="profile-form-grid">
              <Field label="Current password" Icon={KeyRound} errors={password.errors.old_password} wide>
                <input type="password" name="old_password" value={password.values.old_password} onChange={password.handleChange} autoComplete="current-password" required />
              </Field>
              <Field label="New password" Icon={KeyRound} errors={password.errors.new_password1}>
                <input type="password" name="new_password1" value={password.values.new_password1} onChange={password.handleChange} autoComplete="new-password" minLength={8} required />
              </Field>
              <Field label="Confirm new password" Icon={KeyRound} errors={password.errors.new_password2}>
                <input type="password" name="new_password2" value={password.values.new_password2} onChange={password.handleChange} autoComplete="new-password" minLength={8} required />
              </Field>
            </div>
            <div className="profile-password-foot">
              <button type="submit" className="profile-btn profile-btn-dark" disabled={password.saving}>
                {password.saving ? <LoaderCircle className="profile-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
                Update password
              </button>
            </div>
          </form>
        </main>
      )}
    </Page>
  );
}

function Field({ label, Icon, errors, hint, wide, children }) {
  return (
    <label className={`profile-field${wide ? ' is-wide' : ''}${errors?.length ? ' has-error' : ''}`}>
      <span className="profile-label">{label}</span>
      <span className={`profile-input${Icon ? ' has-icon' : ''}`}>
        {Icon && <Icon aria-hidden="true" />}
        {children}
      </span>
      {errors?.length ? <FieldErrors errors={errors} /> : hint && <small className="profile-hint">{hint}</small>}
    </label>
  );
}

function FieldErrors({ errors }) {
  if (!errors?.length) return null;
  return <small className="profile-error">{errors.join(' ')}</small>;
}
