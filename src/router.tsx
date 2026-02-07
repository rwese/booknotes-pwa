import { createBrowserRouter, Navigate } from 'react-router-dom';
import App from './App';
import { BooksIndex } from './routes/books';
import { BookDetail } from './components/books/BookDetail';
import { BookForm } from './components/books/BookForm';
import { AnalyticsPage } from './routes/analytics';
import { SettingsPage } from './routes/settings';
import { ISBNScanner } from './components/scanner/ISBNScanner';

// Configuration for base path
const BASE_PATH = '/booknotes-pwa';

const router = createBrowserRouter([
  {
    path: BASE_PATH,
    element: <App />,
    children: [
      {
        index: true,
        element: <Navigate to={`${BASE_PATH}/books`} replace />
      },
      {
        path: 'books',
        children: [
          { index: true, element: <BooksIndex /> },
          { path: ':bookSlug', element: <BookDetail /> },
          { path: ':bookSlug/edit', element: <BookForm mode="edit" /> },
          { path: 'new', element: <BookForm mode="create" /> }
        ]
      },
      { path: 'analytics', element: <AnalyticsPage /> },
      { path: 'scanner', element: <ISBNScanner /> },
      { path: 'settings', element: <SettingsPage /> },
      {
        path: '*',
        element: <Navigate to={`${BASE_PATH}/books`} replace />
      }
    ]
  },
  // Handle root path redirect
  {
    path: '/',
    element: <Navigate to={BASE_PATH} replace />
  }
]);

export default router;