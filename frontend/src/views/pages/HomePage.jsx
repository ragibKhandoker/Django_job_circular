import { useHomeController } from '../../controllers/HomeController.js';
import { FONT_AWESOME } from '../assets.js';
import CategoryGrid from '../components/home/CategoryGrid.jsx';
import FeaturedJobs from '../components/home/FeaturedJobs.jsx';
import SiteFooter from '../components/home/SiteFooter.jsx';
import SiteHeader from '../components/home/SiteHeader.jsx';
import Page from '../components/Page.jsx';
import '../styles/pages/home.css';

export default function HomePage() {
  const { isAuthenticated, categories, latestJobs, messages, handleLogout } = useHomeController();

  return (
    <Page name="page-home" title="JobFinder Pro - Find Your Dream Job" stylesheets={[FONT_AWESOME]}>
      <SiteHeader isAuthenticated={isAuthenticated} messages={messages} onLogout={handleLogout} />

      <section className="hero" id="threejs-hero">
        <div className="hero-content">
          <h1>Find Your Dream Job Today</h1>
          <p>Join thousands of companies and candidates who use JobFinder Pro to connect with the best opportunities</p>
        </div>
      </section>

      <CategoryGrid categories={categories} />
      <FeaturedJobs jobs={latestJobs} />
      <SiteFooter />
    </Page>
  );
}
