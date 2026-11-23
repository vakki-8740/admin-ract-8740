import { AppProvider } from './store';
import { Topbar, BottomNav } from './components/Chrome';
import DashboardPage from './components/DashboardPage';
import SubmissionsPage from './components/SubmissionsPage';
import AnalyticsPage from './components/AnalyticsPage';
import SettingsPage from './components/SettingsPage';
import {
  SubmissionModal, ConfirmDialog, ImageLightbox, Toast, InstallBanner
} from './components/Overlays';

function Shell() {
  return (
    <>
      <Topbar />
      <div className="pages">
        <DashboardPage />
        <SubmissionsPage />
        <AnalyticsPage />
        <SettingsPage />
      </div>
      <BottomNav />
      <SubmissionModal />
      <ConfirmDialog />
      <ImageLightbox />
      <Toast />
      <InstallBanner />
    </>
  );
}

export default function App() {
  return (
    <AppProvider>
      <Shell />
    </AppProvider>
  );
}
