
import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';
import { discoverApiBase } from './config/api';

// 应用启动时即开始发现后端端口，预热缓存
discoverApiBase().catch((err) => console.error('API discovery failed:', err));

const rootElement = document.getElementById('root');
if (!rootElement) {
  throw new Error("Could not find root element to mount to");
}

const root = ReactDOM.createRoot(rootElement);
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
