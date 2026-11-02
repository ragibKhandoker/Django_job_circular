import { useParams } from 'react-router-dom';
import { useApplyFormController } from '../../controllers/ApplicationController.js';
import { BOOTSTRAP } from '../assets.js';
import FormsetSection from '../components/apply/FormsetSection.jsx';
import { ChoiceSelect, ErrorList } from '../components/forms/fields.jsx';
import Page from '../components/Page.jsx';
import '../styles/pages/apply-form.css';

const text = (maxLength) => (props, row) => <input type="text" maxLength={maxLength} value={row[props.name]} {...props} />;
const textarea = (props, row) => <textarea cols={40} rows={4} value={row[props.name]} {...props} />;
const date = (props, row) => <input type="date" value={row[props.name]} {...props} />;
const year = (props, row) => <input type="number" min={1900} max={2100} placeholder="YYYY" value={row[props.name]} {...props} />;

const WORK_FIELDS = [
  { name: 'company_name', label: 'Company name', render: (props, row) => text(100)({ ...props, required: true }, row) },
  { name: 'position', label: 'Position', render: (props, row) => text(100)({ ...props, required: true }, row) },
  { name: 'responsibilities', label: 'Responsibilities', render: textarea },
  { name: 'start_date', label: 'Start date', render: (props, row) => date({ ...props, required: true }, row) },
  { name: 'end_date', label: 'End date', render: date },
  { name: 'description', label: 'Description', render: textarea },
  { name: 'currently_working', label: 'Currently working', render: (props, row) => <input type="checkbox" checked={row.currently_working} {...props} /> },
];

export default function ApplyFormPage() {
  const { jobId } = useParams();
  const { job, values, errors, alert, work, education, degreeTypeChoices, handleChange, handleSubmit } =
    useApplyFormController(jobId);

  const educationFields = [
    { name: 'institution_name', label: 'Institution name', render: (props, row) => text(150)({ ...props, required: true }, row) },
    { name: 'degree_type', label: 'Degree type', render: (props, row) => <ChoiceSelect choices={degreeTypeChoices} value={row.degree_type} required {...props} /> },
    { name: 'field_of_study', label: 'Field of study', render: text(100) },
    { name: 'start_year', label: 'Start year', render: year },
    { name: 'end_year', label: 'End year', render: year },
    { name: 'grade', label: 'Grade', render: text(100) },
  ];

  // {{ form.as_p }} for ApplicantForm
  const personal = (name, label, input) => (
    <>
      <ErrorList errors={errors[name]} />
      <p>
        <label htmlFor={`id_${name}`}>{label}</label> {input({ name, id: `id_${name}`, onChange: handleChange })}
      </p>
    </>
  );

  return (
    <Page name="page-apply-form" title="Job Portal" stylesheets={[BOOTSTRAP]}>
      {alert && <div className="alert alert-error">{alert}</div>}

      <div className="container application-container my-5">
        <h1 className="text-center mb-4">Apply for {job?.title}</h1>
        <p className="text-center mb-4">{job?.company_name}</p>

        <form onSubmit={handleSubmit} encType="multipart/form-data">
          <div className="form-section">
            <h3>Personal Information</h3>
            {personal('full_name', 'Full name:', (p) => <input type="text" maxLength={100} value={values.full_name} required {...p} />)}
            {personal('email', 'Email:', (p) => <input type="text" maxLength={100} value={values.email} required {...p} />)}
            {personal('phone', 'Phone:', (p) => <input type="text" maxLength={20} value={values.phone} {...p} />)}
            {personal('address', 'Address:', (p) => <input type="text" maxLength={100} value={values.address} required {...p} />)}
            {personal('resume', 'Resume:', (p) => <input type="file" required {...p} />)}
            {personal('cover_letter', 'Cover letter:', (p) => <textarea cols={40} rows={4} value={values.cover_letter} {...p} />)}
            {personal('linkedin_profile', 'Linkedin profile:', (p) => <input type="url" maxLength={100} placeholder="Linkedin Profile URL" value={values.linkedin_profile} {...p} />)}
            {personal('portfolio_website', 'Portfolio website:', (p) => <input type="url" maxLength={100} placeholder="Portfolio Website URL" value={values.portfolio_website} {...p} />)}
          </div>

          <div className="row">
            <FormsetSection
              title="Work Experience"
              prefix="work"
              containerId="work-experience-forms"
              rowClass="work-form"
              fields={WORK_FIELDS}
              rows={work.rows}
              errors={errors}
              addLabel="Add Work Experience"
              onAdd={work.add}
              onRemove={work.remove}
              onChange={work.change}
            />
            <FormsetSection
              title="Educational Background"
              prefix="edu"
              containerId="education-forms"
              rowClass="edu-form"
              fields={educationFields}
              rows={education.rows}
              errors={errors}
              addLabel="Add Education"
              onAdd={education.add}
              onRemove={education.remove}
              onChange={education.change}
            />
          </div>

          <div className="d-grid gap-2 my-4">
            <button type="submit" className="btn btn-primary btn-lg">Submit Application</button>
          </div>
        </form>
      </div>
    </Page>
  );
}
