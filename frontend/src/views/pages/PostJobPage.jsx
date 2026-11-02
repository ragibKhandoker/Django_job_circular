import { usePostJobController } from '../../controllers/JobsController.js';
import { INTER } from '../assets.js';
import { ChoiceSelect, ErrorList } from '../components/forms/fields.jsx';
import Page from '../components/Page.jsx';
import '../styles/pages/post-job.css';

export default function PostJobPage() {
  const { values, errors, choices, handleChange, handleSubmit } = usePostJobController();

  const field = (name) => ({ name, id: `id_${name}`, value: values[name], onChange: handleChange });

  return (
    <Page name="page-post-job" title="Post a Job" stylesheets={[INTER]}>
      <h1>Post a Job</h1>
      <p id="successMessage" style={{ display: 'none', color: 'green', fontWeight: 'bold' }}>
        Job has been posted successfully!
      </p>
      <form onSubmit={handleSubmit}>
        <ErrorList errors={Object.values(errors).flat()} />
        <p>
          <label htmlFor="id_job_id">Job id:</label> <input type="number" {...field('job_id')} required />
        </p>
        <p>
          <label htmlFor="id_title">Title:</label> <ChoiceSelect choices={choices.title} {...field('title')} required />
        </p>
        <p>
          <label htmlFor="id_company_name">Company name:</label><input type="text" maxLength={100} {...field('company_name')} required />
        </p>
        <p>
          <label htmlFor="id_status">Status:</label> <ChoiceSelect choices={choices.status} {...field('status')} required />
        </p>
        <p>
          <label htmlFor="id_requirements">Requirements:</label> <textarea cols={40} rows={10} maxLength={400} {...field('requirements')} required />
        </p>
        <p>
          <label htmlFor="id_location">Location:</label> <input type="text" maxLength={100} {...field('location')} required />
        </p>
        <p>
          <label htmlFor="id_salary">Salary:</label> <ChoiceSelect choices={choices.salary} {...field('salary')} required />
        </p>
        <p>
          <label htmlFor="id_educational_level">Educational level:</label> <ChoiceSelect choices={choices.educational_level} {...field('educational_level')} required />
        </p>
        <p>
          <label htmlFor="id_experience_level">Experience level:</label> <ChoiceSelect choices={choices.experience_level} {...field('experience_level')} required />
        </p>
        <p>
          <label htmlFor="id_deadline">Deadline:</label> <input type="date" {...field('deadline')} />
        </p>

        <button type="submit" className="btn btn-primary">
          <i className="fas fa-paper-plane"></i> Post Job
        </button>
      </form>
    </Page>
  );
}
