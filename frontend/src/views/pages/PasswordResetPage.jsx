import { usePasswordResetController } from '../../controllers/AuthPagesController.js';
import Page from '../components/Page.jsx';
import '../styles/pages/password-reset.css';

export default function PasswordResetPage() {
  const { values, messages, handleChange, handleSubmit } = usePasswordResetController();

  return (
    <Page name="page-password-reset" title="Forgot Password">
      <form onSubmit={handleSubmit}>
        <h2>Forgot Password</h2>
        <label htmlFor="email">Email:</label>
        <input type="email" name="email" value={values.email} onChange={handleChange} required />
        <button type="submit">Send Reset Link</button>

        {messages.map((message, index) => (
          <p key={index}>{message}</p>
        ))}
      </form>
    </Page>
  );
}
