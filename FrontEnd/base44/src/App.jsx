import { Toaster } from "@/components/ui/toaster"
import { QueryClientProvider } from '@tanstack/react-query'
import { queryClientInstance } from '@/lib/query-client'
import { BrowserRouter as Router, Route, Routes, Navigate } from 'react-router-dom';
import PageNotFound from './lib/PageNotFound';
import { AuthProvider, useAuth } from '@/lib/AuthContext';
import ScrollToTop from './components/ScrollToTop';
import ProtectedRoute from '@/components/ProtectedRoute';
import { LocationProvider } from '@/hooks/useLocation';

import Home from '@/pages/Home';
import Discover from '@/pages/Discover';
import ActivityDetail from '@/pages/ActivityDetail';
import EditActivity from '@/pages/EditActivity';
import Clubs from '@/pages/Clubs';
import ClubDetail from '@/pages/ClubDetail';
import EditClub from '@/pages/EditClub';
import Safety from '@/pages/Safety';
import Profile from '@/pages/Profile';
import PublicProfile from '@/pages/PublicProfile';
import Settings from '@/pages/Settings';
import CreateActivity from '@/pages/CreateActivity';
import CreateClub from '@/pages/CreateClub';
import GroupChat from '@/pages/GroupChat';
import Login from '@/pages/Login';
import Register from '@/pages/Register';
import ForgotPassword from '@/pages/ForgotPassword';
import ResetPassword from '@/pages/ResetPassword';

const AuthenticatedApp = () => {
  const { isLoadingAuth, authChecked } = useAuth();

  if (isLoadingAuth || !authChecked) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-cream">
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-ocean to-teal flex items-center justify-center">
            <span className="text-white font-heading font-bold text-lg">LV</span>
          </div>
          <div className="w-8 h-8 border-4 border-sand border-t-ocean rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/discover" element={<Discover />} />
      <Route path="/activity/:id" element={<ActivityDetail />} />
      <Route path="/clubs" element={<Clubs />} />
      <Route path="/club/:id" element={<ClubDetail />} />
      <Route path="/safety" element={<Safety />} />
      <Route path="/u/:uid" element={<PublicProfile />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<ProtectedRoute unauthenticatedElement={<Navigate to="/login" replace />} />}>
        <Route path="/profile" element={<Profile />} />
        <Route path="/settings" element={<Settings />} />
        <Route path="/create-activity" element={<CreateActivity />} />
        <Route path="/activity/:id/edit" element={<EditActivity />} />
        <Route path="/create-club" element={<CreateClub />} />
        <Route path="/club/:id/edit" element={<EditClub />} />
        <Route path="/chat/:conversationId" element={<GroupChat />} />
      </Route>

      <Route path="*" element={<PageNotFound />} />
    </Routes>
  );
};

function App() {
  return (
    <AuthProvider>
      <QueryClientProvider client={queryClientInstance}>
        <Router>
          <LocationProvider>
            <ScrollToTop />
            <AuthenticatedApp />
          </LocationProvider>
        </Router>
        <Toaster />
      </QueryClientProvider>
    </AuthProvider>
  )
}

export default App
