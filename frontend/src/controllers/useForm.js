import { useCallback, useState } from 'react';

/** Controlled-form state shared by the page controllers. */
export function useForm(initialValues) {
  const [values, setValues] = useState(initialValues);

  const handleChange = useCallback((event) => {
    const { name, type, value, checked, files } = event.target;
    const next = type === 'checkbox' ? checked : type === 'file' ? files[0] ?? null : value;
    setValues((current) => ({ ...current, [name]: next }));
  }, []);

  return { values, setValues, handleChange };
}
