import Page from '../components/Page.jsx';
import '../styles/pages/application-success.css';

export default function ApplicationSuccessPage() {
  return (
    <Page name="page-application-success" title="Application Submitted">
      <h1>Thank you!</h1>
      <p>Your application has been submitted successfully.</p>
    </Page>
  );
}
