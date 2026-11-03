import { ArrowRight, AtSign, CircleAlert, Eye, EyeOff, LoaderCircle, Lock, Mail, UserRound } from 'lucide-react';
import { useState } from 'react';

const MIN_PASSWORD_LENGTH = 8;

function Field({ label, Icon, hint, error, children }) {
  return (
    <label className={`auth-field ${error ? 'has-error' : ''}`}>
      <span className="auth-label">{label}</span>
      <span className="auth-input">
        <Icon className="auth-input-icon" aria-hidden="true" />
        {children}
      </span>
      {(error || hint) && <span className={error ? 'auth-error-text' : 'auth-hint-text'}>{error || hint}</span>}
    </label>
  );
}

function PasswordInput({ visible, onToggle, ...props }) {
  return (
    <>
      <input type={visible ? 'text' : 'password'} {...props} />
      <button
        type="button"
        className="auth-eye"
        onClick={onToggle}
        aria-label={visible ? 'Hide password' : 'Show password'}
      >
        {visible ? <EyeOff aria-hidden="true" /> : <Eye aria-hidden="true" />}
      </button>
    </>
  );
}

/** The sign-up form shared by the candidate and employer pages (fields match /api/auth/signup/). */
export default function SignupForm({ values, messages, submitting, onChange, onSubmit, submitLabel }) {
  const [showPassword, setShowPassword] = useState(false);
  const passwordsDiffer = values.password2 !== '' && values.password1 !== values.password2;

  return (
    <form className="auth-form" onSubmit={onSubmit}>
      {messages.length > 0 && (
        <div className="auth-alert" role="alert">
          <CircleAlert aria-hidden="true" />
          <div>
            {messages.map((message, index) => (
              <p key={index}>{message}</p>
            ))}
          </div>
        </div>
      )}

      <div className="auth-row">
        <Field label="First name" Icon={UserRound}>
          <input name="first_name" value={values.first_name} onChange={onChange} autoComplete="given-name" placeholder="Rahim" required />
        </Field>
        <Field label="Last name" Icon={UserRound}>
          <input name="last_name" value={values.last_name} onChange={onChange} autoComplete="family-name" placeholder="Uddin" required />
        </Field>
      </div>

      <Field label="Username" Icon={AtSign}>
        <input name="username" value={values.username} onChange={onChange} autoComplete="username" placeholder="rahim.uddin" required />
      </Field>

      <Field label="Email address" Icon={Mail}>
        <input type="email" name="email" value={values.email} onChange={onChange} autoComplete="email" placeholder="you@example.com" required />
      </Field>

      <Field label="Password" Icon={Lock} hint={`Use ${MIN_PASSWORD_LENGTH} or more characters.`}>
        <PasswordInput
          name="password1"
          value={values.password1}
          onChange={onChange}
          autoComplete="new-password"
          placeholder="Create a password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          visible={showPassword}
          onToggle={() => setShowPassword((visible) => !visible)}
        />
      </Field>

      <Field label="Confirm password" Icon={Lock} error={passwordsDiffer ? 'Passwords do not match.' : ''}>
        <PasswordInput
          name="password2"
          value={values.password2}
          onChange={onChange}
          autoComplete="new-password"
          placeholder="Repeat your password"
          minLength={MIN_PASSWORD_LENGTH}
          required
          visible={showPassword}
          onToggle={() => setShowPassword((visible) => !visible)}
        />
      </Field>

      <button type="submit" className="auth-submit" disabled={submitting || passwordsDiffer}>
        {submitting ? (
          <>
            <LoaderCircle className="auth-spin" aria-hidden="true" /> Creating account...
          </>
        ) : (
          <>
            {submitLabel} <ArrowRight aria-hidden="true" />
          </>
        )}
      </button>
    </form>
  );
}
