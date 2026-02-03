import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AdsProvider } from './context/AdsContext';
import { SocketProvider } from './context/SocketContext';
import { TabSyncProvider } from './context/TabSyncContext';
import { AnalyticsProvider } from './context/AnalyticsContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
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
    </BrowserRouter>
  </React.StrictMode>
);
