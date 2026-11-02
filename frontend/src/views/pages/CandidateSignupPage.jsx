import { useSignupController } from '../../controllers/AuthPagesController.js';
import Page from '../components/Page.jsx';
import SignupFields from '../components/SignupFields.jsx';
import '../styles/pages/candidate-signup.css';

export default function CandidateSignupPage() {
  const { values, messages, handleChange, handleSubmit } = useSignupController();

  return (
    <Page name="page-candidate-signup" title="Candidate Signup Page">
      <div className="signup-container">
        <form onSubmit={handleSubmit}>
          <h1>Candidate Registration</h1>
          <SignupFields values={values} onChange={handleChange} />
          <button type="submit">Register Now</button>
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
