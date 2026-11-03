import { useHomeController } from '../../controllers/HomeController.js';
import { PLUS_JAKARTA } from '../assets.js';
import CareerTips from '../components/home/CareerTips.jsx';
import CategoryGrid from '../components/home/CategoryGrid.jsx';
import CompaniesSection from '../components/home/CompaniesSection.jsx';
import FeaturedJobs from '../components/home/FeaturedJobs.jsx';
import FeatureStrip from '../components/home/FeatureStrip.jsx';
import HeroSection from '../components/home/HeroSection.jsx';
import SiteFooter from '../components/home/SiteFooter.jsx';
import SiteHeader from '../components/home/SiteHeader.jsx';
import Page from '../components/Page.jsx';
import '../styles/pages/home.css';

export default function HomePage() {
  const home = useHomeController();

  return (
    <Page name="page-home" title="JobFinder - Find Your Dream Job" stylesheets={[PLUS_JAKARTA]}>
      <SiteHeader
        isAuthenticated={home.isAuthenticated}
        username={home.username}
        categories={home.categories}
        categoryLink={home.categoryLink}
        messages={home.messages}
        onLogout={home.handleLogout}
      />

      <main>
        <HeroSection
          keyword={home.keyword}
          location={home.location}
          locations={home.locations}
          totalJobs={home.totalJobs}
          onKeywordChange={home.handleKeywordChange}
          onLocationChange={home.handleLocationChange}
          onSearch={home.handleSearch}
          onQuickSearch={home.searchKeyword}
        />
        <FeatureStrip />
        <CategoryGrid categories={home.categories} jobCounts={home.jobCounts} categoryLink={home.categoryLink} />
        <FeaturedJobs
          jobs={home.latestJobs}
          loading={home.loading}
          statusLabel={home.statusLabel}
          salaryLabel={home.salaryLabel}
          applyLink={home.applyLink}
          isAuthenticated={home.isAuthenticated}
        />
        <CompaniesSection companies={home.companies} />
        <CareerTips />
      </main>

      <SiteFooter />
    </Page>
  );
}
