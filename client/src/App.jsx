
import { Routes, Route } from 'react-router-dom';
import Mainpage from './Front-Page/mainpage.jsx';
import './App.css';
import Login from './Front-Page/Auth/Login.jsx';
import Signup from './Front-Page/Auth/Signup.jsx';
import UploadPage from './working-pages/UploadPage.jsx';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Mainpage />} />
      <Route path="/login" element={<Login/>} />
      <Route path="/signup" element={<Signup/>} />
      <Route path="/dashboard" element={<h1>Dashboard</h1>} />
      <Route path="/Work" element={<UploadPage} />
    </Routes>
  );
}

export default App;
