
import { Routes, Route } from 'react-router-dom';
import Mainpage from './Front-Page/mainpage.jsx';
import './App.css';

function App() {
  return (
    <Routes>
      <Route path="/" element={<Mainpage />} />
      <Route path="/login" element={<h1>Login Page</h1>} />
      <Route path="/dashboard" element={<h1>Dashboard</h1>} />
    </Routes>
  );
}

export default App;
