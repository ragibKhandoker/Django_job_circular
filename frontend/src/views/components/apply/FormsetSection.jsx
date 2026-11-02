/**
 * Renders a Django formset section the way apply_form.html looped over
 * `form.visible_fields`: label, <br>, widget, then red field errors.
 */
export default function FormsetSection({ title, prefix, containerId, rowClass, fields, rows, errors, addLabel, onAdd, onRemove, onChange }) {
  return (
    <div className="col-md-6 form-section">
      <h3>{title}</h3>
      <div id={containerId}>
        {rows.map((row, index) => (
          <div className={rowClass} key={index}>
            {fields.map(({ name, label, render }) => {
              const id = `id_${prefix}-${index}-${name}`;
              const props = { id, name, onChange: (event) => onChange(index, event) };
              return (
                <p key={name}>
                  <label htmlFor={id}>{label}</label><br />
                  {render(props, row)}
                  {(errors[`${prefix}-${index}-${name}`] ?? []).map((error) => (
                    <span key={error} style={{ color: 'red' }}>{error}</span>
                  ))}
                </p>
              );
            })}
            <button type="button" className="btn btn-secondary btn-add-more" onClick={() => onRemove(index)}>Remove</button>
          </div>
        ))}
      </div>
      <button type="button" className="btn btn-secondary btn-add-more" onClick={onAdd}>{addLabel}</button>
    </div>
  );
}
