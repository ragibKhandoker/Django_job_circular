import { Eye, EyeOff } from 'lucide-react';

/** Labelled input with a leading icon and an optional hint or error line. */
export function AuthField({ label, Icon, hint, error, aside, children }) {
  return (
    <label className={`auth-field ${error ? 'has-error' : ''}`}>
      <span className="auth-label-row">
        <span className="auth-label">{label}</span>
        {aside}
      </span>
      <span className="auth-input">
        <Icon className="auth-input-icon" aria-hidden="true" />
        {children}
      </span>
      {(error || hint) && <span className={error ? 'auth-error-text' : 'auth-hint-text'}>{error || hint}</span>}
    </label>
  );
}

/** Password input with a show/hide button; goes inside AuthField. */
export function PasswordInput({ visible, onToggle, ...props }) {
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
