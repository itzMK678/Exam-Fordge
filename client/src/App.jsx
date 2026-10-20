import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Mainpage from './Front-Page/mainpage'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Mainpage />} />
        <Route path="/login" element={<h1>Login Page</h1>} />
        <Route path="/dashboard" element={<h1>Dashboard</h1>} />
      </Routes>
    </BrowserRouter>
  )
}

export default App