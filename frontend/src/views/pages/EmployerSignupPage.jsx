import { useSignupController } from '../../controllers/AuthPagesController.js';
import Page from '../components/Page.jsx';
import SignupFields from '../components/SignupFields.jsx';
import '../styles/pages/employer-signup.css';

export default function EmployerSignupPage() {
  const { values, messages, handleChange, handleSubmit } = useSignupController();

  return (
    <Page name="page-employer-signup" title="Employee Signup Page">
      <div className="container">
        <form onSubmit={handleSubmit}>
          <h1>Employer Sign Up</h1>
          <SignupFields values={values} onChange={handleChange} />
          <button type="submit">Create Account</button>
        </form>

        <div className="messages">
          {messages.map((message, index) => (
            <h3 key={index}>{message}</h3>
          ))}
        </div>
      </div>
    </Page>
  );
}
