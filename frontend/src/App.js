import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Stocks from './pages/Stocks';
import StockForm from './pages/StockForm';
import StockDetail from './pages/StockDetail';
import Categories from './pages/Categories';
import './App.css';

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();
  
  if (loading) {
    return <div className="loading-screen">Chargement...</div>;
  }
  
  return user ? children : <Navigate to="/login" />;
};

const AppContent = () => {
  const { user } = useAuth();

  return (
    <div className="app">
      {user && <Navbar />}
      <main className="main-content">
        <Routes>
          <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          } />
          <Route path="/stocks" element={
            <PrivateRoute>
              <Stocks />
            </PrivateRoute>
          } />
          <Route path="/stocks/new" element={
            <PrivateRoute>
              <StockForm />
            </PrivateRoute>
          } />
          <Route path="/stocks/:id" element={
            <PrivateRoute>
              <StockDetail />
            </PrivateRoute>
          } />
          <Route path="/stocks/:id/edit" element={
            <PrivateRoute>
              <StockForm />
            </PrivateRoute>
          } />
          <Route path="/categories" element={
            <PrivateRoute>
              <Categories />
            </PrivateRoute>
          } />
        </Routes>
      </main>
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;
