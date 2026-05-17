import './assets/css/App.css';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { ClerkProvider } from '@clerk/clerk-react';

import App from './App';

const publishableKey = process.env.REACT_APP_CLERK_PUBLISHABLE_KEY;

if (!publishableKey) {
  throw new Error('Missing REACT_APP_CLERK_PUBLISHABLE_KEY in .env');
}

const root = ReactDOM.createRoot(document.getElementById('root'));

root.render(
  <BrowserRouter>
    <ClerkProvider publishableKey={publishableKey}>
      <App />
    </ClerkProvider>
  </BrowserRouter>,
);
