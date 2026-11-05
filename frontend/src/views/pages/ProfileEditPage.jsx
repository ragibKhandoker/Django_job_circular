import {
  ArrowLeft,
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
  Plus,
  RotateCcw,
  Save,
  ShieldCheck,
  Sparkles,
  Trash2,
  UserRound,
  X,
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
import { Avatar, ProfileTopbar } from './ProfilePage.jsx';

const BIO_MAX = 1000;
const SKILLS_MAX = 300;
const SKILL_SUGGESTIONS = ['Communication', 'Teamwork', 'MS Office', 'Customer Service', 'Sales', 'React', 'Python', 'Accounting'];

const SECTIONS = [
  ['photo', 'Profile photo', Camera],
  ['basic', 'Basic information', UserRound],
  ['contact', 'Contact & links', Mail],
  ['about', 'About & skills', Sparkles],
  ['security', 'Password & security', ShieldCheck],
];

export default function ProfileEditPage() {
  const edit = useProfileEditController();
  const { values } = edit;

  return (
    <Page name="page-profile" title="Edit Profile - JobFinder" stylesheets={[PLUS_JAKARTA]}>
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
  const active = useActiveSection();

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
          {SECTIONS.map(([id, text, Icon]) => (
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

          <Section id="about" Icon={Sparkles} title="About & skills" text="Tell your story and show what you are good at.">
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
              <div className="profile-field is-wide">
                <span className="profile-label">Skills</span>
                <SkillsInput value={values.skills} onChange={(next) => edit.setField('skills', next)} />
                {errors.skills?.length ? (
                  <small className="profile-error">{errors.skills.join(' ')}</small>
                ) : (
                  <small className="profile-hint">Press Enter or comma to add a skill.</small>
                )}
              </div>
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

        <Section id="security" Icon={ShieldCheck} title="Password & security" text="Use a strong password you do not use anywhere else.">
          <PasswordForm password={password} />
        </Section>
      </div>
    </main>
  );
}

/** Highlights the sidebar link of the section currently on screen. */
function useActiveSection() {
  const [active, setActive] = useState(SECTIONS[0][0]);
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((entry) => entry.isIntersecting);
        if (visible.length) setActive(visible[0].target.id);
      },
      { rootMargin: '-30% 0px -60% 0px' },
    );
    SECTIONS.forEach(([id]) => {
      const element = document.getElementById(id);
      if (element) observer.observe(element);
    });
    return () => observer.disconnect();
  }, []);
  return active;
}

function Section({ id, Icon, title, text, children }) {
  return (
    <section id={id} className="profile-card edit-section">
      <header className="edit-section-head">
        <span className="edit-section-icon"><Icon aria-hidden="true" /></span>
        <div>
          <h2>{title}</h2>
          <p>{text}</p>
        </div>
      </header>
      {children}
    </section>
  );
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

/** Comma-separated skills shown as removable chips. */
function SkillsInput({ value, onChange }) {
  const [draft, setDraft] = useState('');
  const skills = value.split(',').map((skill) => skill.trim()).filter(Boolean);
  const has = (skill) => skills.some((item) => item.toLowerCase() === skill.toLowerCase());

  const save = (next) => onChange(next.join(', '));
  const add = (raw) => {
    const skill = raw.trim().replace(/,+$/, '');
    if (!skill || has(skill) || [...skills, skill].join(', ').length > SKILLS_MAX) return;
    save([...skills, skill]);
  };

  const handleKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ',') {
      event.preventDefault();
      add(draft);
      setDraft('');
    } else if (event.key === 'Backspace' && !draft && skills.length) {
      save(skills.slice(0, -1));
    }
  };

  const suggestions = SKILL_SUGGESTIONS.filter((skill) => !has(skill)).slice(0, 6);

  return (
    <>
      <div className="edit-skills">
        {skills.map((skill, index) => (
          <span key={skill} className={`edit-chip tone-${index % 5}`}>
            {skill}
            <button type="button" onClick={() => save(skills.filter((item) => item !== skill))} aria-label={`Remove ${skill}`}>
              <X aria-hidden="true" />
            </button>
          </span>
        ))}
        <input
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          onKeyDown={handleKeyDown}
          onBlur={() => {
            add(draft);
            setDraft('');
          }}
          placeholder={skills.length ? 'Add another...' : 'e.g. React, Accounting, Sales'}
          aria-label="Add a skill"
        />
      </div>
      {suggestions.length > 0 && (
        <div className="edit-suggestions">
          <span>Suggestions:</span>
          {suggestions.map((skill) => (
            <button key={skill} type="button" onClick={() => add(skill)}>
              <Plus aria-hidden="true" /> {skill}
            </button>
          ))}
        </div>
      )}
    </>
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

function Field({ label, Icon, errors, hint, wide, required, counter, children }) {
  const [length, max] = counter ?? [];
  return (
    <label className={`profile-field${wide ? ' is-wide' : ''}${errors?.length ? ' has-error' : ''}`}>
      <span className="profile-label">
        {label}
        {required && <span className="edit-required" aria-hidden="true">*</span>}
      </span>
      <span className={`profile-input${Icon ? ' has-icon' : ''}`}>
        {Icon && <Icon aria-hidden="true" />}
        {children}
      </span>
      <span className="edit-field-foot">
        {errors?.length ? (
          <small className="profile-error">{errors.join(' ')}</small>
        ) : (
          hint && <small className="profile-hint">{hint}</small>
        )}
        {counter && <small className={`edit-counter${length > max * 0.9 ? ' is-near' : ''}`}>{length}/{max}</small>}
      </span>
    </label>
  );
}
