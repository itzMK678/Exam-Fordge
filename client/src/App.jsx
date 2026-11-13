
import { Routes, Route } from 'react-router-dom';
import Mainpage from './Front-Page/Mainpage.jsx';
import './App.css';
import Login from './Front-Page/Auth/Login.jsx';
import Signup from './Front-Page/Auth/Signup.jsx';
import UploadPage from './working-pages/UploadPage.jsx';
import ProtectedRoute from './working-pages/ProtectedRoute.jsx';
import HistoryPage from './working-pages/HistoryPage.jsx';
import { ExamProvider } from "./Context/ExamContent";
function App() {
  return (
      <ExamProvider>
    <Routes>
      <Route path="/" element={<Mainpage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<h1>Dashboard</h1>} />
        <Route path="/work" element={<UploadPage />} />
        <Route path="/history" element={<HistoryPage />} />
      </Route>
    </Routes>
    </ExamProvider>
  );
}

export default App;
