// Form building blocks shared by /profile/edit and /company-verification (styled by profile.css).

export function Section({ id, Icon, title, text, children }) {
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

export function Field({ label, Icon, errors, hint, wide, required, counter, children }) {
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
