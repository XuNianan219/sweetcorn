
import React from 'react';
import { HashRouter, Routes, Route } from 'react-router-dom';
import { Layout } from './components/Layout';
import { Landing } from './pages/Landing';
import { Discussion } from './pages/Discussion';
import { VideoCenter } from './pages/VideoCenter';
import { PhotoCenter } from './pages/PhotoCenter';
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
          <Route path="/video" element={<VideoCenter />} />
          <Route path="/photo" element={<PhotoCenter />} />
          <Route path="/article" element={<ArticleCenter />} />
          <Route path="/commercial" element={<Commercial />} />
          <Route path="/merch" element={<MerchCenter />} />
          <Route path="/merch/:id" element={<MerchDetail />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/tourism" element={<Tourism />} />
          <Route path="/support-join" element={<SupportJoin />} />
          <Route path="/support-apply" element={<SupportApply />} />
          <Route path="/admin-recycle" element={<AdminRecycleBin />} />
          <Route path="/tags/:tagName" element={<TagResults />} />
        </Routes>
      </Layout>
    </HashRouter>
  );
};

export default App;
