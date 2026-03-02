
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Discussion } from './pages/Discussion';
import { MediaCenter } from './pages/MediaCenter';
import { ArticleCenter } from './pages/ArticleCenter';
import { CelebA } from './pages/CelebA';
import { CelebB } from './pages/CelebB';
import { Timeline } from './pages/Timeline';
import { Tourism } from './pages/Tourism';
import { Commercial } from './pages/Commercial';
import { MerchCenter } from './pages/MerchCenter';
import { MerchDetail } from './pages/MerchDetail';
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

const App: React.FC = () => {
  return (
    <HashRouter>
      <Layout>
        <Routes>
          <Route path="/" element={<Landing />} />
          <Route path="/timeline" element={<Timeline />} />
          <Route path="/celeb-a" element={<CelebA />} />
          <Route path="/celeb-b" element={<CelebB />} />
          <Route path="/discussion" element={<Discussion />} />
          <Route path="/media" element={<MediaCenter />} />
          <Route path="/video" element={<MediaCenter />} />
          <Route path="/photo" element={<MediaCenter />} />
          <Route path="/article" element={<ArticleCenter />} />
          <Route path="/commercial" element={<Commercial />} />
          <Route path="/merch" element={<MerchCenter />} />
          <Route path="/merch/:id" element={<MerchDetail />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/activity/charity" element={<CharityProjects />} />
          <Route path="/activity/support" element={<FanSupportProjects />} />
          <Route path="/activity/charity/submit" element={<CharitySubmit />} />
          <Route path="/activity/support/submit" element={<FanSupportSubmit />} />
          <Route path="/tourism" element={<Tourism />} />
          <Route path="/support-join" element={<SupportJoin />} />
          <Route path="/support-apply" element={<SupportApply />} />
          <Route path="/account" element={<AccountCenter />} />
          <Route path="/admin-recycle" element={<AdminRecycleBin />} />
          <Route path="/tags/:tagName" element={<TagResults />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
