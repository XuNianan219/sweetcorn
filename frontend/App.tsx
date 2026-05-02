import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Layout } from './components/Layout';
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
import { MerchandiseIdeaDetail } from './pages/MerchandiseIdeaDetail';
import { MerchandiseProductDetail } from './pages/MerchandiseProductDetail';
import { Activity } from './pages/Activity';
import { TagResults } from './pages/TagResults';
import { SupportJoin } from './pages/SupportJoin';
import { SupportApply } from './pages/SupportApply';
import { AdminRecycleBin } from './pages/AdminRecycleBin';
import { AccountCenter } from './pages/AccountCenter';
import { CharityProjects } from './pages/CharityProjects';
import { FanSupportProjects } from './pages/FanSupportProjects';
import { CharitySubmit } from './pages/CharitySubmit';
import { FanSupportSubmit } from './pages/FanSupportSubmit';

const RequireAuth: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const token = localStorage.getItem('sweetcorn_jwt_token');
  return token ? <>{children}</> : <Navigate to="/login" replace />;
};

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route
          path="*"
          element={
            <RequireAuth>
              <Layout>
                <Routes>
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
                  <Route path="/admin-recycle" element={<AdminRecycleBin />} />
                  <Route path="/tags/:tagName" element={<TagResults />} />
                  <Route path="/category/merchandise" element={<Merchandise />} />
                  <Route path="/merchandise/submit" element={<MerchandiseSubmit />} />
                  <Route path="/merchandise/idea/:id" element={<MerchandiseIdeaDetail />} />
                  <Route path="/merchandise/product/:id" element={<MerchandiseProductDetail />} />
                </Routes>
              </Layout>
            </RequireAuth>
          }
        />
      </Routes>
    </HashRouter>
  );
};

export default App;
