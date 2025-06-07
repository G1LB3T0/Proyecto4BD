import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { useState } from 'react'
import MainLayout from './layouts/MainLayout';
import Books from './pages/Books';
import Users from './pages/Users';
import Loans from './pages/Loans';
import reactLogo from './assets/react.svg'
import viteLogo from '/vite.svg'
import './App.css'

function App() {
  const [count, setCount] = useState(0)

  return (
    <Router>
      <MainLayout>
        <Routes>
          <Route path="/" element={<Navigate to="/books" />} />
          <Route path="/books" element={<Books />} />
          <Route path="/users" element={<Users />} />
          <Route path="/loans" element={<Loans />} />
        </Routes>
      </MainLayout>
    </Router>
  )
}

export default App
