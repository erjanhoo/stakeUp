import { useI18n, LocalizedText } from './lib/i18n';
import { LanguageProvider } from './lib/i18n';
import { Component, lazy, Suspense, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { BrowserRouter, Routes, Route, Navigate, Outlet, Link } from 'react-router-dom';
import { MotionConfig } from 'motion/react';
import { AuthProvider, useAuth } from './lib/auth';
import { Brand, ErrorMessage, Loading } from './components/common';
import { Button } from './components/ui/button';
import { Shell } from './components/shell';
import { Landing } from './pages/landing';
import './styles.css';
import './themes.css';
import './social.css';
import './kinetic.css';
import { AppearanceProvider } from './lib/appearance';
import { afterSignIn } from './lib/social';
const CompetitionPage = lazy(() =>
  import('./pages/competition').then((m) => ({ default: m.CompetitionPage })),
);
const EvidencePage = lazy(() =>
  import('./pages/evidence').then((m) => ({ default: m.EvidencePage })),
);
const AuthPage = lazy(() => import('./pages/auth').then((m) => ({ default: m.AuthPage })));
const DashboardPage = lazy(() =>
  import('./pages/dashboard').then((m) => ({ default: m.DashboardPage })),
);
const CirclesPage = lazy(() => import('./pages/social').then((m) => ({ default: m.CirclesPage })));
const CirclePage = lazy(() => import('./pages/social').then((m) => ({ default: m.CirclePage })));
const CreateCircle = lazy(() =>
  import('./pages/social').then((m) => ({ default: m.CreateCircle })),
);
const CreateChallenge = lazy(() =>
  import('./pages/social').then((m) => ({ default: m.CreateChallenge })),
);
const ChallengePage = lazy(() =>
  import('./pages/social').then((m) => ({ default: m.ChallengePage })),
);
const JoinCircle = lazy(() => import('./pages/social').then((m) => ({ default: m.JoinCircle })));
const ActivityPage = lazy(() =>
  import('./pages/dashboard').then((m) => ({ default: m.ActivityPage })),
);
const NotificationsPage = lazy(() =>
  import('./pages/notifications').then((m) => ({ default: m.Notifications })),
);
const Roadmap = lazy(() => import('./pages/dashboard').then((m) => ({ default: m.Roadmap })));
const Onboarding = lazy(() => import('./pages/profile').then((m) => ({ default: m.Onboarding })));
const Settings = lazy(() => import('./pages/profile').then((m) => ({ default: m.Settings })));

class ErrorBoundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('StakeUp interface error', error, info.componentStack);
  }
  render() {
    return this.state.failed ? (
      <div className="fatal-page">
        <Brand />
        <h1>
          <LocalizedText text="Let’s take a quick breather." />
        </h1>
        <p>
          <LocalizedText text="We couldn’t load this page. Reload to try again." />
        </p>
        <Button onClick={() => location.reload()}>
          <LocalizedText text="Reload StakeUp" />
        </Button>
      </div>
    ) : (
      this.props.children
    );
  }
}
function Protected({ onboarding = false }: { onboarding?: boolean }) {
  const { t } = useI18n();

  const { profile, loading, error } = useAuth();
  if (loading) return <Loading full />;
  if (error)
    return (
      <div className="fatal-page">
        <Brand />
        <h1>{t('We couldn’t connect.')}</h1>
        <ErrorMessage message={error} />
        <Button onClick={() => location.reload()}>{t('Try again')}</Button>
      </div>
    );
  if (!profile) return <Navigate to="/login" replace />;
  if (!onboarding && !profile.onboardingCompleted) return <Navigate to="/onboarding" replace />;
  if (onboarding && profile.onboardingCompleted) return <Navigate to={afterSignIn()} replace />;
  return <Outlet />;
}
function AppContent() {
  const { t } = useI18n();
  return (
    <Suspense fallback={<Loading full />}>
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<AuthPage variant="login" />} />
        <Route path="/register" element={<AuthPage variant="register" />} />
        <Route path="/forgot-password" element={<AuthPage variant="forgot" />} />
        <Route path="/reset-password" element={<AuthPage variant="reset" />} />
        <Route path="/join" element={<JoinCircle />} />
        <Route element={<Protected onboarding />}>
          <Route path="/onboarding" element={<Onboarding />} />
        </Route>
        <Route element={<Protected />}>
          <Route path="/app" element={<Shell />}>
            <Route index element={<DashboardPage />} />
            <Route path="circles" element={<CirclesPage />} />
            <Route path="circles/new" element={<CreateCircle />} />
            <Route path="circles/:id" element={<CirclePage />} />
            <Route path="circles/:id/challenges/new" element={<CreateChallenge />} />
            <Route path="challenges/:id" element={<ChallengePage />} />
            <Route path="challenges/:id/competition" element={<CompetitionPage />} />
            <Route path="challenges/:id/evidence" element={<EvidencePage />} />
            <Route path="activity" element={<ActivityPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="settings" element={<Settings />} />
            <Route path="profile" element={<Navigate to="/app/settings" replace />} />
            <Route path="roadmap" element={<Roadmap />} />
          </Route>
        </Route>
        <Route
          path="*"
          element={
            <div className="fatal-page">
              <Brand />
              <span className="eyebrow">{t('A LITTLE OFF THE PATH')}</span>
              <h1>{t('This page hasn’t found its circle.')}</h1>
              <Button asChild>
                <Link to="/">{t('Back to StakeUp')}</Link>
              </Button>
            </div>
          }
        />
      </Routes>
    </Suspense>
  );
}
function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <LanguageProvider>
          <ErrorBoundary>
            <MotionConfig reducedMotion="user">
              <AppearanceProvider>
                <AppContent />
              </AppearanceProvider>
            </MotionConfig>
          </ErrorBoundary>
        </LanguageProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
createRoot(document.getElementById('root')!).render(<App />);
