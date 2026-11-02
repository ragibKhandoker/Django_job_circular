const FIELDS = [
  { name: 'first_name', type: 'text', placeholder: 'First Name' },
  { name: 'last_name', type: 'text', placeholder: 'Last Name' },
  { name: 'username', type: 'text', placeholder: 'Username' },
  { name: 'email', type: 'email', placeholder: 'Email' },
  { name: 'password1', type: 'password', placeholder: 'Password' },
  { name: 'password2', type: 'password', placeholder: 'Confirm Password' },
];

/** The six inputs shared by employer_signup.html and candidate_signup.html. */
export default function SignupFields({ values, onChange }) {
  return FIELDS.map((field) => (
    <input key={field.name} {...field} value={values[field.name]} onChange={onChange} required />
  ));
}
