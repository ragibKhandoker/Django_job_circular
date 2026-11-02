import { Link, Navigate } from 'react-router-dom';
import { useApplicationSubmittedController } from '../../controllers/ApplicationController.js';
import Page from '../components/Page.jsx';
import '../styles/pages/application-submitted.css';

const Item = ({ label, value }) => (
  <div className="data-item"><span className="label">{label}</span> {value}</div>
);

export default function ApplicationSubmittedPage() {
  const { applicant, homePath, workExperiences, educationalBackgrounds } = useApplicationSubmittedController();
  if (!applicant) return <Navigate to={homePath} replace />;

  return (
    <Page name="page-application-submitted" title="Application Submitted">
      <div className="confirmation-box">
        <h1>Application Submitted!</h1>
        <p className="message">Thank you for applying. We have received your information successfully.</p>

        <div className="data-section">
          <h3>Applicant Information</h3>
          <Item label="Name:" value={applicant.full_name} />
          <Item label="Email:" value={applicant.email} />
          <Item label="Phone:" value={applicant.phone} />
          <Item label="Address:" value={applicant.address} />
          <Item label="Cover Letter:" value={applicant.cover_letter} />
          <Item label="Resume:" value={applicant.resume} />
          <Item label="LinkedIn:" value={applicant.linkedin_profile} />
          <Item label="Portfolio Website:" value={applicant.portfolio_website} />
        </div>

        <div className="data-section">
          <h3>Work Experience</h3>
          {workExperiences.length > 0 ? (
            workExperiences.map((exp, index) => (
              <div className="data-item" key={index}>
                <Item label="Company:" value={exp.company_name} />
                <Item label="Position:" value={exp.position} />
                <Item label="Start-date:" value={exp.start_date} />
                <Item label="Ending-date:" value={exp.end_date} />
                <Item label="Responsibilities:" value={exp.responsibilities} />
                <Item label="description:" value={exp.description} />
                <Item label="Currently Working:" value={exp.currently_working} />
              </div>
            ))
          ) : (
            <p>No work experience submitted.</p>
          )}
        </div>

        <div className="data-section">
          <h3>Educational Background</h3>
          {educationalBackgrounds.length > 0 ? (
            educationalBackgrounds.map((edu, index) => (
              <div className="data-item" key={index}>
                <Item label="Institution:" value={edu.institution_name} />
                <Item label="Start Year:" value={edu.start_year} />
                <Item label="End Year:" value={edu.end_year} />
                <Item label="Grade:" value={edu.grade} />
                <Item label="Firld of study:" value={edu.field_of_study} />
              </div>
            ))
          ) : (
            <p>No educational background submitted.</p>
          )}
        </div>

        <Link to={homePath} className="home-link">Back to Home</Link>
      </div>
    </Page>
  );
}
