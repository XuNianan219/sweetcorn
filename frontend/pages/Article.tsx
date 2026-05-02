import React from 'react';
import { CategorySection } from '../components/CategorySection';

export const Article: React.FC = () => {
  return (
    <div className="max-w-7xl mx-auto">
      <CategorySection category="article" />
    </div>
  );
};
