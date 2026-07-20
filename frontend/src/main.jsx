import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { AuthProvider } from './hooks/useAuth';
import App from './App';
import './index.css';

/**
 * main.jsx — The entry point of the React application.
 *
 * What happens here (in order):
 *   1. ReactDOM finds the <div id="root"> element in index.html.
 *   2. BrowserRouter enables URL-based navigation (React Router).
 *   3. AuthProvider sets up the global user authentication state.
 *   4. App renders all the pages and routes.
 *   5. index.css loads the global styles and theme variables.
 */
ReactDOM.createRoot(document.getElementById('root')).render(
  <BrowserRouter>
    {/* AuthProvider wraps the whole app so any component can call useAuth() */}
    <AuthProvider>
      <App />
    </AuthProvider>
  </BrowserRouter>
);
