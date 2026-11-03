import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ROUTES } from './config/routes.js';
import { AuthProvider } from './controllers/AuthController.jsx';
import { FlashProvider } from './controllers/FlashController.jsx';
import { RequireAuth } from './controllers/RequireAuth.jsx';
import { ThemeProvider } from './controllers/ThemeController.jsx';
import ApplicationSubmittedPage from './views/pages/ApplicationSubmittedPage.jsx';
import ApplicationSuccessPage from './views/pages/ApplicationSuccessPage.jsx';
import ApplyFormPage from './views/pages/ApplyFormPage.jsx';
import ApplySuccessPage from './views/pages/ApplySuccessPage.jsx';
import BrowseCandidatesPage from './views/pages/BrowseCandidatesPage.jsx';
import CandidateDetailPage from './views/pages/CandidateDetailPage.jsx';
import CandidateLoginPage from './views/pages/CandidateLoginPage.jsx';
import CandidateSignupPage from './views/pages/CandidateSignupPage.jsx';
import EmployerLoginPage from './views/pages/EmployerLoginPage.jsx';
import EmployerSignupPage from './views/pages/EmployerSignupPage.jsx';
import HomePage from './views/pages/HomePage.jsx';
import JobListPage from './views/pages/JobListPage.jsx';
import LoginChoicePage from './views/pages/LoginChoicePage.jsx';
import NotFoundPage from './views/pages/NotFoundPage.jsx';
import PasswordResetDonePage from './views/pages/PasswordResetDonePage.jsx';
import PasswordResetPage from './views/pages/PasswordResetPage.jsx';
import PostJobPage from './views/pages/PostJobPage.jsx';
import RegistrationChoosePage from './views/pages/RegistrationChoosePage.jsx';
import ThemeToggle from './views/components/ThemeToggle.jsx';
import TotalJobsPage from './views/pages/TotalJobsPage.jsx';

// These pages put the theme toggle in their own header; every other page gets a floating one.
const PAGES_WITH_OWN_TOGGLE = new Set([ROUTES.home, ROUTES.signup, ROUTES.candidateSignup, ROUTES.employerSignup]);

function FloatingThemeToggle() {
  const { pathname } = useLocation();
  if (PAGES_WITH_OWN_TOGGLE.has(pathname.replace(/\/+$/, '') || '/')) return null;
  return <ThemeToggle className="theme-toggle-floating" />;
}

export default function App() {
  return (
    <BrowserRouter>
      <ThemeProvider>
        <AuthProvider>
          <FlashProvider>
            <FloatingThemeToggle />
            <Routes>
              <Route path={ROUTES.home} element={<HomePage />} />
              <Route path={ROUTES.signup} element={<RegistrationChoosePage />} />
              <Route path={ROUTES.employerSignup} element={<EmployerSignupPage />} />
              <Route path={ROUTES.candidateSignup} element={<CandidateSignupPage />} />
              <Route path={ROUTES.login} element={<LoginChoicePage />} />
              <Route path={ROUTES.employerLogin} element={<EmployerLoginPage />} />
              <Route path={ROUTES.candidateLogin} element={<CandidateLoginPage />} />
              <Route path={ROUTES.passwordReset} element={<PasswordResetPage />} />
              <Route path={ROUTES.passwordResetDone} element={<PasswordResetDonePage />} />
              <Route path={ROUTES.jobList} element={<JobListPage />} />
              <Route path={ROUTES.jobCategory} element={<JobListPage />} />
              <Route path={ROUTES.totalJobs} element={<TotalJobsPage />} />
              <Route
                path={ROUTES.postJob}
                element={<RequireAuth redirectTo={ROUTES.employerLogin}><PostJobPage /></RequireAuth>}
              />
              <Route
                path={ROUTES.applyForm}
                element={<RequireAuth redirectTo={ROUTES.candidateLogin}><ApplyFormPage /></RequireAuth>}
              />
              <Route path={ROUTES.applicationSubmitted} element={<ApplicationSubmittedPage />} />
              <Route path={ROUTES.applicationSuccess} element={<ApplicationSuccessPage />} />
              <Route path={ROUTES.applySuccess} element={<ApplySuccessPage />} />
              <Route
                path={ROUTES.browseCandidates}
                element={<RequireAuth redirectTo={ROUTES.login}><BrowseCandidatesPage /></RequireAuth>}
              />
              <Route path={ROUTES.candidateDetail} element={<CandidateDetailPage />} />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </FlashProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
