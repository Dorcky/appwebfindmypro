import React from 'react';
import ReactDOM from 'react-dom/client';
import './index.css';
import App from './App';
import reportWebVitals from './reportWebVitals';
import './components/firebaseConfig'; // Import this at the top level
import { AuthProvider } from './context/AuthContext';
import './styles/tailwind.css';

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker
      .register('/firebase-messaging-sw.js')
      .then((registration) => {
        console.log('Service Worker enregistré avec succès:', registration);
      })
      .catch((error) => {
        console.error('Erreur lors de l\'enregistrement du Service Worker:', error);
      });
  }
}

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
   <AuthProvider>
      <App />
    </AuthProvider>
  </React.StrictMode>
);

reportWebVitals();

registerServiceWorker();
