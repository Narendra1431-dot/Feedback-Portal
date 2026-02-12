import React from 'react';
import { Routes, Route } from 'react-router-dom';
import Header from './components/Header';
import StudentView from './components/StudentView';
import AdminView from './components/AdminView';
import Login from './components/Login';
import Register from './components/Register';
import Dashboard from './components/Dashboard';
import Products from './components/Products';
import NotFound from './components/NotFound';
import './App.css';

function App() {
  return (
    <div className="App">
      <Header />
      <Routes>
        <Route path="/" element={<StudentView />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/products" element={<Products />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </div>
  );
}

export default App;
