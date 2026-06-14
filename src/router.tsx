import { createBrowserRouter, Navigate } from 'react-router-dom';
import AppLayout from '@/components/layout/AppLayout';
import ExperimentList from '@/pages/ExperimentList';
import CreateWizard from '@/pages/CreateWizard';
import Dashboard from '@/pages/Dashboard';
import AudiencePage from '@/pages/Audience';
import ReviewPage from '@/pages/Review';
import ReviewSharePage from '@/pages/ReviewShare';

export const router = createBrowserRouter([
  {
    path: '/',
    element: <AppLayout />,
    children: [
      {
        index: true,
        element: <Navigate to="/experiments" replace />,
      },
      {
        path: 'experiments',
        children: [
          {
            index: true,
            element: <ExperimentList />,
          },
          {
            path: 'create',
            element: <CreateWizard />,
          },
          {
            path: ':id/dashboard',
            element: <Dashboard />,
          },
          {
            path: ':id/review',
            element: <ReviewPage />,
          },
        ],
      },
      {
        path: 'audiences',
        element: <AudiencePage />,
      },
      {
        path: '*',
        element: <Navigate to="/experiments" replace />,
      },
    ],
  },
  {
    path: 'share/experiments/:id/review',
    element: <ReviewSharePage />,
  },
]);

export default router;
