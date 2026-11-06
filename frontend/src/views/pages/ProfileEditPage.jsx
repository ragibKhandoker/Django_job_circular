import {
  ArrowLeft,
  BadgeCheck,
  AtSign,
  Camera,
  Check,
  CircleAlert,
  CircleCheck,
  Eye,
  EyeOff,
  Globe,
  ImageUp,
  KeyRound,
  Link2,
  LoaderCircle,
  Mail,
  MapPin,
  Phone,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
} from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { ROUTES } from '../../config/routes.js';
import { useProfileEditController } from '../../controllers/ProfileController.js';
import { BD_DIVISIONS } from '../../models/choices.js';
import { Profile } from '../../models/ProfileModel.js';
import { PLUS_JAKARTA } from '../assets.js';
import Page from '../components/Page.jsx';
import '../styles/pages/profile.css';
import '../styles/pages/company.css';
import { Field, Section } from '../components/profile/FormParts.jsx';
import { CompanyVerificationPanel } from './CompanyVerificationPage.jsx';
import { Avatar, ProfileTopbar } from './ProfilePage.jsx';

const BIO_MAX = 1000;

const SECTIONS = [
  ['photo', 'Profile photo', Camera],
  ['basic', 'Basic information', UserRound],
  ['contact', 'Contact & links', Mail],
  ['about', 'About', Sparkles],
  ['security', 'Password & security', ShieldCheck],
];
// Employers also get the company verification form (documents for the admins to check).
const COMPANY_SECTION = ['company-verification', 'Company verification', BadgeCheck];

function sectionsFor(profile) {
  if (profile?.role !== 'employer' || profile?.is_staff) return SECTIONS;
  return [...SECTIONS.slice(0, -1), COMPANY_SECTION, SECTIONS[SECTIONS.length - 1]];
}

export default function ProfileEditPage() {
  const edit = useProfileEditController();
  const { values } = edit;

  return (
    <Page name="page-profile page-company" title="Edit Profile - JobFinder" stylesheets={[PLUS_JAKARTA]}>
      <ProfileTopbar />

      {edit.loading || !values ? (
        <div className="profile-wrap profile-state">
          <LoaderCircle className="profile-spin" aria-hidden="true" />
          <p>Loading your profile...</p>
        </div>
      ) : (
        <EditView edit={edit} />
      )}
    </Page>
  );
}

function EditView({ edit }) {
  const { values, errors, password } = edit;
  const sections = sectionsFor(edit.profile);
  const isEmployer = sections.includes(COMPANY_SECTION);
  const active = useActiveSection(sections);

  // Live preview of the card as the user types.
  const preview = useMemo(
    () => new Profile({ ...edit.profile, ...values, photo: edit.shownPhoto, jobs: [] }),
    [edit.profile, values, edit.shownPhoto],
  );

  return (
    <main className="profile-wrap profile-main edit-layout">
      <aside className="edit-aside">
        <div className="edit-preview">
          <div className="edit-preview-cover" />
          <div className="edit-preview-ring" style={{ '--progress': preview.completeness }}>
            <Avatar profile={preview} />
          </div>
          <strong className="edit-preview-name">{preview.fullName}</strong>
          <span className="edit-preview-headline">{preview.headline || 'Your headline'}</span>
          {preview.location && (
            <span className="edit-preview-location"><MapPin aria-hidden="true" /> {preview.location}</span>
          )}
          <div className="edit-preview-meter">
            <span>Profile strength</span>
            <strong>{preview.completeness}%</strong>
          </div>
          <div className="profile-meter"><span style={{ width: `${preview.completeness}%` }} /></div>
          <small className="edit-preview-note">Live preview, updates as you type</small>
        </div>

        <nav className="edit-nav" aria-label="Sections">
          {sections.map(([id, text, Icon]) => (
            <a key={id} href={`#${id}`} className={active === id ? 'is-active' : ''}>
              <Icon aria-hidden="true" /> {text}
            </a>
          ))}
        </nav>
      </aside>

      <div className="edit-content">
        <div className="edit-heading">
          <Link to={ROUTES.profile} className="edit-back"><ArrowLeft aria-hidden="true" /> My profile</Link>
          <h1>Edit your profile</h1>
          <p>A complete profile helps employers trust you and reach you faster.</p>
        </div>

        {edit.message && (
          <div className="profile-alert" role="alert">
            <CircleAlert aria-hidden="true" /> {edit.message}
          </div>
        )}

        <form className="edit-form" onSubmit={edit.handleSubmit} noValidate>
          <Section id="photo" Icon={Camera} title="Profile photo" text="A clear, friendly photo makes your profile stand out.">
            <PhotoPicker edit={edit} />
          </Section>

          <Section id="basic" Icon={UserRound} title="Basic information" text="Your name and how people find you on JobFinder.">
            <div className="profile-form-grid">
              <Field label="First name" Icon={UserRound} errors={errors.first_name}>
                <input name="first_name" value={values.first_name} onChange={edit.handleChange} autoComplete="given-name" maxLength={150} placeholder="Rahim" />
              </Field>
              <Field label="Last name" Icon={UserRound} errors={errors.last_name}>
                <input name="last_name" value={values.last_name} onChange={edit.handleChange} autoComplete="family-name" maxLength={150} placeholder="Uddin" />
              </Field>
              <Field label="Username" Icon={AtSign} errors={errors.username} required>
                <input name="username" value={values.username} onChange={edit.handleChange} autoComplete="username" maxLength={150} />
              </Field>
              <Field label="Email address" Icon={Mail} errors={errors.email} required>
                <input type="email" name="email" value={values.email} onChange={edit.handleChange} autoComplete="email" />
              </Field>
              <Field
                label="Headline"
                Icon={Sparkles}
                errors={errors.headline}
                wide
                hint="One line about what you do, e.g. Frontend Developer · 3 years of experience"
                counter={[values.headline.length, 120]}
              >
                <input name="headline" value={values.headline} onChange={edit.handleChange} maxLength={120} placeholder="What do you do?" />
              </Field>
            </div>
          </Section>

          <Section id="contact" Icon={Mail} title="Contact & links" text="Where employers can reach you and see your work.">
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
          </Section>

          <Section id="about" Icon={Sparkles} title="About" text="Tell your story in a few lines.">
            <div className="profile-form-grid">
              <Field label="Bio" errors={errors.bio} wide counter={[values.bio.length, BIO_MAX]}>
                <textarea
                  name="bio"
                  rows={6}
                  value={values.bio}
                  onChange={edit.handleChange}
                  maxLength={BIO_MAX}
                  placeholder="A few lines about your experience, strengths and the kind of work you are looking for."
                />
              </Field>
            </div>
          </Section>

          <div className={`edit-save-bar${edit.dirty ? ' is-dirty' : ''}`}>
            <span className="edit-save-status">
              {edit.dirty ? (
                <><span className="edit-dot" aria-hidden="true" /> You have unsaved changes</>
              ) : (
                <><CircleCheck aria-hidden="true" /> Everything is up to date</>
              )}
            </span>
            <div className="edit-save-actions">
              {edit.dirty && (
                <button type="button" className="profile-btn profile-btn-ghost" onClick={edit.handleReset}>
                  <RotateCcw aria-hidden="true" /> Discard
                </button>
              )}
              <button type="submit" className="profile-btn profile-btn-primary" disabled={edit.saving || !edit.dirty}>
                {edit.saving ? <LoaderCircle className="profile-spin" aria-hidden="true" /> : <Save aria-hidden="true" />}
                {edit.saving ? 'Saving...' : 'Save changes'}
              </button>
            </div>
          </div>
        </form>

        {isEmployer && (
          <section id="company-verification" className="company-embed">
            <header className="company-embed-head">
              <span className="edit-section-icon"><BadgeCheck aria-hidden="true" /></span>
              <div>
                <h2>Company verification</h2>
                <p>
                  Upload your trade license and the CEO / owner&apos;s NID or passport. An admin checks the documents and
                  marks your company as verified. This form is saved separately from your profile.
                </p>
              </div>
            </header>
            <CompanyVerificationPanel idPrefix="cv-" />
          </section>
        )}

        <Section id="security" Icon={ShieldCheck} title="Password & security" text="Use a strong password you do not use anywhere else.">
          <PasswordForm password={password} />
        </Section>
      </div>
    </main>
  );
}

/** Highlights the sidebar link of the section currently on screen. */
function useActiveSection(sections) {
  const [active, setActive] = useState(sections[0][0]);
  const ids = sections.map(([id]) => id).join(',');
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    ids.split(',').forEach((id) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, [ids]);
  return active;
}

function PhotoPicker({ edit }) {
  const [dragging, setDragging] = useState(false);

  const handleDrop = (event) => {
    event.preventDefault();
    setDragging(false);
    edit.pickPhoto(event.dataTransfer.files?.[0]);
  };

  return (
    <div className="edit-photo">
      <label className="edit-photo-avatar" title="Change photo">
        <Avatar profile={edit.profile} src={edit.shownPhoto} className="is-large" />
        <span className="edit-photo-overlay"><Camera aria-hidden="true" /></span>
        <input type="file" accept="image/*" onChange={edit.handlePhotoChange} hidden />
      </label>

      <label
        className={`edit-dropzone${dragging ? ' is-dragging' : ''}`}
        onDragOver={(event) => {
          event.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
      >
        <input type="file" accept="image/*" onChange={edit.handlePhotoChange} hidden />
        <span className="edit-dropzone-icon"><ImageUp aria-hidden="true" /></span>
        <strong>{dragging ? 'Drop your photo here' : <>Drag &amp; drop or <u>browse</u></>}</strong>
        <small>JPG or PNG, up to 2 MB</small>
        {edit.hasNewPhoto && <span className="edit-photo-new"><Check aria-hidden="true" /> New photo selected, click Save to keep it</span>}
        {edit.errors.photo?.length > 0 && <small className="profile-error">{edit.errors.photo.join(' ')}</small>}
      </label>

      {edit.shownPhoto && (
        <button type="button" className="profile-btn profile-btn-danger-ghost edit-photo-remove" onClick={edit.handleRemovePhoto}>
          <Trash2 aria-hidden="true" /> Remove photo
        </button>
      )}
    </div>
  );
}

const STRENGTH_LABELS = ['Too short', 'Weak', 'Fair', 'Good', 'Strong'];

function passwordScore(value) {
  if (value.length < 8) return 0;
  return [/[a-z]/.test(value) && /[A-Z]/.test(value), /\d/.test(value), /[^A-Za-z0-9]/.test(value), value.length >= 12]
    .filter(Boolean).length || 1;
}

function PasswordForm({ password }) {
  const [visible, setVisible] = useState(false);
  const { values, errors } = password;
  const score = passwordScore(values.new_password1);
  const mismatch = values.new_password2 && values.new_password1 !== values.new_password2;
  const type = visible ? 'text' : 'password';
  const eye = (
    <button type="button" className="edit-eye" onClick={() => setVisible((v) => !v)} aria-label={visible ? 'Hide passwords' : 'Show passwords'}>
      {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
    </button>
  );

  return (
    <form onSubmit={password.handleSubmit}>
      {password.status && (
        <div className={password.status.tone === 'success' ? 'profile-success' : 'profile-alert'} role="status">
          {password.status.tone === 'success' ? <CircleCheck aria-hidden="true" /> : <CircleAlert aria-hidden="true" />}
          {password.status.text}
        </div>
      )}
      <div className="profile-form-grid">
        <Field label="Current password" Icon={KeyRound} errors={errors.old_password} wide>
          <input type={type} name="old_password" value={values.old_password} onChange={password.handleChange} autoComplete="current-password" required />
          {eye}
        </Field>
        <Field label="New password" Icon={KeyRound} errors={errors.new_password1}>
          <input type={type} name="new_password1" value={values.new_password1} onChange={password.handleChange} autoComplete="new-password" minLength={8} required />
        </Field>
        <Field
          label="Confirm new password"
          Icon={KeyRound}
          errors={errors.new_password2 ?? (mismatch ? ['Passwords do not match.'] : undefined)}
        >
          <input type={type} name="new_password2" value={values.new_password2} onChange={password.handleChange} autoComplete="new-password" minLength={8} required />
        </Field>
      </div>

      {values.new_password1 && (
        <div className={`edit-strength score-${score}`}>
          <div className="edit-strength-bars">
            {[1, 2, 3, 4].map((step) => <span key={step} className={score >= step ? 'is-on' : ''} />)}
          </div>
          <small>{STRENGTH_LABELS[score]}. Mix upper and lower case, numbers and symbols.</small>
        </div>
      )}

      <div className="profile-password-foot">
        <button type="submit" className="profile-btn profile-btn-dark" disabled={password.saving || Boolean(mismatch)}>
          {password.saving ? <LoaderCircle className="profile-spin" aria-hidden="true" /> : <KeyRound aria-hidden="true" />}
          Update password
        </button>
      </div>
    </form>
  );
}
