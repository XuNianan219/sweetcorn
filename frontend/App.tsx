import React from 'react';
import { HashRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { Toaster } from 'sonner';
import { Layout } from './components/Layout';
import { ErrorBoundary } from './components/ErrorBoundary';
import { NetworkStatus } from './components/NetworkStatus';
import { Login } from './pages/Login';
import { Landing } from './pages/Landing';
import { Home } from './pages/Home';
import { Discussion } from './pages/Discussion';
import { Media } from './pages/Media';
import { Article } from './pages/Article';
import { MediaCenter } from './pages/MediaCenter';
import { ArticleCenter } from './pages/ArticleCenter';
import { CelebA } from './pages/CelebA';
import { CelebB } from './pages/CelebB';
import { Timeline } from './pages/Timeline';
import { Travel } from './pages/Travel';
import { Commercial } from './pages/Commercial';
import { MerchCenter } from './pages/MerchCenter';
import { MerchDetail } from './pages/MerchDetail';
import { Merchandise } from './pages/Merchandise';
import { MerchandiseSubmit } from './pages/MerchandiseSubmit';
import { MerchandiseProductSubmit } from './pages/MerchandiseProductSubmit';
import { MerchandiseIdeaDetail } from './pages/MerchandiseIdeaDetail';
import { MerchandiseProductDetail } from './pages/MerchandiseProductDetail';
import { Activity } from './pages/Activity';
import { TagResults } from './pages/TagResults';
import { SupportJoin } from './pages/SupportJoin';
import { SupportApply } from './pages/SupportApply';
import { AccountCenter } from './pages/AccountCenter';
import { CharityProjects } from './pages/CharityProjects';
import { FanSupportProjects } from './pages/FanSupportProjects';
import { CharitySubmit } from './pages/CharitySubmit';
import { FanSupportSubmit } from './pages/FanSupportSubmit';
import { Register } from './pages/Register';
import { Profile } from './pages/Profile';
import { Following } from './pages/Following';
import { Admin } from './pages/Admin';
import { EventsBusiness } from './pages/EventsBusiness';
import { EventSubmit } from './pages/EventSubmit';
import { PostDetail } from './pages/PostDetail';
import { Notifications } from './pages/Notifications';
import { UserProfile } from './pages/UserProfile';
import { Conversations } from './pages/Conversations';
import { ChatPage } from './pages/ChatPage';
import { TimelineEntryDetail } from './pages/TimelineEntryDetail';
import { AdminTimeline } from './pages/AdminTimeline';
import { AdminTimelineForm } from './pages/AdminTimelineForm';
import { AdminTravel } from './pages/AdminTravel';
import { AdminTravelForm } from './pages/AdminTravelForm';
import { MySubmittedEvents } from './pages/MySubmittedEvents';
import { RequireAuth } from './components/RequireAuth';
import { RequireAdmin } from './components/RequireAdmin';
import { RequireSuperAdmin } from './components/RequireSuperAdmin';
import { UserProvider } from './contexts/UserContext';
import { LanguageProvider } from './contexts/LanguageContext';

// 页面级路由 + 左右滑动过渡（沉浸式视频是 viewMode 切换，不属于路由，不受影响）
const AnimatedRoutes: React.FC = () => {
  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, x: -20 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
      >
        <Routes location={location}>
          <Route path="/" element={<Home />} />
          <Route path="/landing" element={<Landing />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/celeb-a" element={<CelebA />} />
          <Route path="/celeb-b" element={<CelebB />} />
          <Route path="/discussion" element={<Discussion />} />
          <Route path="/media" element={<Media />} />
          <Route path="/video" element={<MediaCenter />} />
          <Route path="/photo" element={<MediaCenter />} />
          <Route path="/article" element={<Article />} />
          <Route path="/commercial" element={<Commercial />} />
          <Route path="/merch" element={<MerchCenter />} />
          <Route path="/merch/:id" element={<MerchDetail />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/activity/charity" element={<CharityProjects />} />
          <Route path="/activity/support" element={<FanSupportProjects />} />
          <Route path="/activity/charity/submit" element={<CharitySubmit />} />
          <Route path="/activity/support/submit" element={<FanSupportSubmit />} />
          <Route path="/tourism" element={<Navigate to="/travel" replace />} />
          <Route path="/travel" element={<Travel />} />
          <Route path="/support-join" element={<SupportJoin />} />
          <Route path="/support-apply" element={<SupportApply />} />
          <Route path="/account" element={<AccountCenter />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/following" element={<RequireAuth><Following /></RequireAuth>} />
          <Route path="/notifications" element={<Notifications />} />
          <Route path="/users/:userId" element={<UserProfile />} />
          <Route path="/messages" element={<Conversations />} />
          <Route path="/messages/:userId" element={<ChatPage />} />
          <Route
            path="/admin"
            element={
              <RequireAdmin>
                <Admin />
              </RequireAdmin>
            }
          />
          <Route path="/tags/:tagName" element={<TagResults />} />
          <Route path="/posts/:id" element={<PostDetail />} />
          <Route path="/timeline/entries/:id" element={<TimelineEntryDetail />} />
          <Route
            path="/admin/timeline"
            element={
              <RequireAdmin>
                <AdminTimeline />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/timeline/new"
            element={
              <RequireAdmin>
                <AdminTimelineForm />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/timeline/:id/edit"
            element={
              <RequireAdmin>
                <AdminTimelineForm />
              </RequireAdmin>
            }
          />
          <Route
            path="/admin/travel"
            element={
              <RequireSuperAdmin>
                <AdminTravel />
              </RequireSuperAdmin>
            }
          />
          <Route
            path="/admin/travel/experience/new"
            element={
              <RequireSuperAdmin>
                <AdminTravelForm />
              </RequireSuperAdmin>
            }
          />
          <Route
            path="/admin/travel/experience/:id/edit"
            element={
              <RequireSuperAdmin>
                <AdminTravelForm />
              </RequireSuperAdmin>
            }
          />
          <Route
            path="/admin/travel/route/new"
            element={
              <RequireSuperAdmin>
                <AdminTravelForm />
              </RequireSuperAdmin>
            }
          />
          <Route
            path="/admin/travel/route/:id/edit"
            element={
              <RequireSuperAdmin>
                <AdminTravelForm />
              </RequireSuperAdmin>
            }
          />
          <Route path="/category/merchandise" element={<Merchandise />} />
          <Route path="/category/events-business" element={<EventsBusiness />} />
          <Route
            path="/events/submit"
            element={
              <RequireAuth>
                <EventSubmit />
              </RequireAuth>
            }
          />
          <Route
            path="/events/mine"
            element={
              <RequireAuth>
                <MySubmittedEvents />
              </RequireAuth>
            }
          />
          <Route path="/category/events" element={<Navigate to="/category/events-business" replace />} />
          <Route path="/merchandise/submit" element={<MerchandiseSubmit />} />
          <Route path="/merchandise/product/submit" element={<MerchandiseProductSubmit />} />
          <Route path="/merchandise/idea/:id" element={<MerchandiseIdeaDetail />} />
          <Route path="/merchandise/product/:id" element={<MerchandiseProductDetail />} />
        </Routes>
      </motion.div>
    </AnimatePresence>
  );
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <UserProvider>
        <LanguageProvider>
        <Toaster position="top-center" richColors closeButton duration={3000} />
        <NetworkStatus />
        <ErrorBoundary>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route
              path="*"
              element={
                <RequireAuth>
                  <Layout>
                    <AnimatedRoutes />
                  </Layout>
                </RequireAuth>
              }
            />
          </Routes>
        </ErrorBoundary>
        </LanguageProvider>
      </UserProvider>
    </HashRouter>
  );
};

export default App;
