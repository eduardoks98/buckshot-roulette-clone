import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { AdsProvider } from './context/AdsContext';
import { SocketProvider } from './context/SocketContext';
import { TabSyncProvider } from './context/TabSyncContext';
import './styles/global.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BrowserRouter>
      <AuthProvider>
        <TabSyncProvider>
          <AdsProvider>
            <SocketProvider>
              <App />
            </SocketProvider>
          </AdsProvider>
        </TabSyncProvider>
      </AuthProvider>
    </BrowserRouter>
  </React.StrictMode>
);
