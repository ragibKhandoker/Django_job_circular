import { BrowserRouter, Route, Routes, useLocation } from 'react-router-dom';
import { ROUTES } from './config/routes.js';
import { AuthProvider } from './controllers/AuthController.jsx';
import { FlashProvider } from './controllers/FlashController.jsx';
import { RequireAdmin, RequireAuth } from './controllers/RequireAuth.jsx';
import { ThemeProvider } from './controllers/ThemeController.jsx';
import AdminLoginPage from './views/pages/AdminLoginPage.jsx';
import AdminPanelPage from './views/pages/AdminPanelPage.jsx';
import ApplicationSubmittedPage from './views/pages/ApplicationSubmittedPage.jsx';
import ApplicationSuccessPage from './views/pages/ApplicationSuccessPage.jsx';
import ApplyFormPage from './views/pages/ApplyFormPage.jsx';
import ApplySuccessPage from './views/pages/ApplySuccessPage.jsx';
import BrowseCandidatesPage from './views/pages/BrowseCandidatesPage.jsx';
import CandidateDetailPage from './views/pages/CandidateDetailPage.jsx';
import CandidateSignupPage from './views/pages/CandidateSignupPage.jsx';
import EmployerSignupPage from './views/pages/EmployerSignupPage.jsx';
import HomePage from './views/pages/HomePage.jsx';
import JobListPage from './views/pages/JobListPage.jsx';
import LoginPage from './views/pages/LoginPage.jsx';
import NotFoundPage from './views/pages/NotFoundPage.jsx';
import PasswordResetDonePage from './views/pages/PasswordResetDonePage.jsx';
import PasswordResetPage from './views/pages/PasswordResetPage.jsx';
import ProfileEditPage from './views/pages/ProfileEditPage.jsx';
import ProfilePage from './views/pages/ProfilePage.jsx';
import PostJobPage from './views/pages/PostJobPage.jsx';
import RegistrationChoosePage from './views/pages/RegistrationChoosePage.jsx';
import ThemeToggle from './views/components/ThemeToggle.jsx';
import TotalJobsPage from './views/pages/TotalJobsPage.jsx';

// These pages put the theme toggle in their own header; every other page gets a floating one.
const PAGES_WITH_OWN_TOGGLE = new Set([
  ROUTES.home,
  ROUTES.signup,
  ROUTES.candidateSignup,
  ROUTES.employerSignup,
  ROUTES.login,
  ROUTES.employerLogin,
  ROUTES.candidateLogin,
  ROUTES.adminLogin,
  ROUTES.adminPanel,
  ROUTES.profile,
  ROUTES.profileEdit,
]);

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
              {/* One login page; the URL picks the role tab. The shared key keeps typed values when switching tabs. */}
              <Route path={ROUTES.login} element={<LoginPage key="login" />} />
              <Route path={ROUTES.employerLogin} element={<LoginPage key="login" role="employer" />} />
              <Route path={ROUTES.candidateLogin} element={<LoginPage key="login" role="candidate" />} />
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
              <Route
                path={ROUTES.profile}
                element={<RequireAuth redirectTo={ROUTES.login}><ProfilePage /></RequireAuth>}
              />
              <Route
                path={ROUTES.profileEdit}
                element={<RequireAuth redirectTo={ROUTES.login}><ProfileEditPage /></RequireAuth>}
              />
              <Route path={ROUTES.adminLogin} element={<AdminLoginPage />} />
              <Route
                path={ROUTES.adminPanel}
                element={<RequireAdmin redirectTo={ROUTES.adminLogin}><AdminPanelPage /></RequireAdmin>}
              />
              <Route path="*" element={<NotFoundPage />} />
            </Routes>
          </FlashProvider>
        </AuthProvider>
      </ThemeProvider>
    </BrowserRouter>
  );
}
