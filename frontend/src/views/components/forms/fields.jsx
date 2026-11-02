// Inputs that render the same markup as the Django form widgets they replace.

export function ErrorList({ errors }) {
  if (!errors?.length) return null;
  return (
    <ul className="errorlist">
      {errors.map((error) => (
        <li key={error}>{error}</li>
      ))}
    </ul>
  );
}

/** forms.Select for a ChoiceField: blank "---------" option followed by the choices. */
export function ChoiceSelect({ choices, ...props }) {
  return (
    <select {...props}>
      <option value="">---------</option>
      {choices.map(([value, label]) => (
        <option key={value} value={value}>{label}</option>
      ))}
    </select>
  );
}
