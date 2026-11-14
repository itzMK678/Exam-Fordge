
import { lazy, Suspense } from 'react';
import { Routes, Route } from 'react-router-dom';
import Mainpage from './Front-Page/Mainpage.jsx';
import './App.css';
import Login from './Front-Page/Auth/Login.jsx';
import Signup from './Front-Page/Auth/Signup.jsx';
import UploadPage from './working-pages/UploadPage.jsx';
import ProtectedRoute from './working-pages/ProtectedRoute.jsx';
import HistoryPage from './working-pages/HistoryPage.jsx';
import DailyLecturePage from './Lecture-Intelligence/DailyLecturePage.jsx';
import { ExamProvider } from "./Context/ExamContent";
import { AuthProvider } from "./Context/AuthContext";

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
