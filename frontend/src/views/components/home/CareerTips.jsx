import { FileText, Globe, MessagesSquare } from 'lucide-react';

const TIPS = [
  {
    Icon: FileText,
    title: 'Write a CV that gets noticed',
    text: 'Keep it to two pages, lead with results, and tailor the skills section to each circular you apply for.',
  },
  {
    Icon: MessagesSquare,
    title: 'Prepare for the interview',
    text: 'Research the company, practise common questions out loud, and prepare two questions of your own.',
  },
  {
    Icon: Globe,
    title: 'Build your online presence',
    text: 'Keep your LinkedIn and portfolio up to date — add the links when you apply so employers can see your work.',
  },
];

export default function CareerTips() {
  return (
    <section className="section section-tinted" id="career-tips">
      <div className="container">
        <div className="section-head">
          <div>
            <h2 className="section-title">Career Tips</h2>
            <p className="section-subtitle">Small steps that make a big difference in your job search</p>
          </div>
        </div>
        <div className="tips-grid">
          {TIPS.map(({ Icon, title, text }) => (
            <article className="tip-card" key={title}>
              <span className="feature-icon">
                <Icon aria-hidden="true" />
              </span>
              <h3>{title}</h3>
              <p>{text}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
