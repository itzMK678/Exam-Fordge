
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import './App.css';
import ProtectedRoute from './working-pages/ProtectedRoute.jsx';
import { ExamProvider } from "./Context/ExamContent";
import { AuthProvider } from "./Context/AuthContext";

// Lazy-loaded routes for instant initial page loading & optimal code splitting
const Mainpage = lazy(() => import('./Front-Page/Mainpage.jsx'));
const Login = lazy(() => import('./Front-Page/Auth/Login.jsx'));
const Signup = lazy(() => import('./Front-Page/Auth/Signup.jsx'));
const ForgotPassword = lazy(() => import('./Front-Page/Auth/ForgotPassword.jsx'));
const AuthCallback = lazy(() => import('./Front-Page/Auth/AuthCallback.jsx'));
const UploadPage = lazy(() => import('./working-pages/UploadPage.jsx'));
const HistoryPage = lazy(() => import('./working-pages/HistoryPage.jsx'));
const DailyLecturePage = lazy(() => import('./Lecture-Intelligence/DailyLecturePage.jsx'));
const BossAdminDashboard = lazy(() => import('./Admin-Dashboard/BossAdminDashboard.jsx'));
const StudyPlannerPage = lazy(() => import('./Study-Planner/StudyPlannerPage.jsx'));

function App() {
  return (
    <AuthProvider>
      <ExamProvider>
        <Suspense
          fallback={
            <div className="min-h-screen bg-slate-950 flex items-center justify-center text-white">
              <div className="h-8 w-8 animate-spin rounded-full border-4 border-blue-600 border-t-transparent" />
            </div>
          }
        >
          <Routes>
            <Route path="/" element={<Mainpage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/auth/callback" element={<AuthCallback />} />
            <Route path="/boss" element={<BossAdminDashboard />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<h1>Dashboard</h1>} />
              <Route path="/work" element={<UploadPage />} />
              <Route path="/history" element={<HistoryPage />} />
              <Route path="/daily-lecture" element={<DailyLecturePage />} />
              <Route path="/lectures" element={<DailyLecturePage />} />
              <Route path="/study-planner" element={<StudyPlannerPage />} />
            </Route>
          </Routes>
        </Suspense>
      </ExamProvider>
    </AuthProvider>
  );
}

export default App;
