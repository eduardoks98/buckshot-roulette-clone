import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import App from './App';
import Preview from './pages/Preview/Preview';
import { AuthProvider } from './context/AuthContext';
import { AdsProvider } from './context/AdsContext';
import { SocketProvider } from './context/SocketContext';
import { TabSyncProvider } from './context/TabSyncContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import './styles/global.css';

// App com todos os providers (auth, analytics, tab sync, ads, socket)
function AuthenticatedApp() {
  return (
    <AuthProvider>
      <AnalyticsProvider>
        <TabSyncProvider>
          <AdsProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </AdsProvider>
        </TabSyncProvider>
      </AnalyticsProvider>
    </AuthProvider>
  );
}

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* Preview NÃO precisa de providers - é só visual para iframe */}
        <Route path="/preview" element={<Preview />} />
        {/* Todas outras rotas passam pelos providers */}
        <Route path="/*" element={<AuthenticatedApp />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
