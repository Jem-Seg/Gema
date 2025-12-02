import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import './Navbar.css';

const Navbar = () => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const isActive = (path) => location.pathname === path;

  return (
    <nav className="navbar">
      <div className="navbar-brand">
        <Link to="/">
          <h1>📦 Gema</h1>
        </Link>
        <span className="navbar-subtitle">Gestion des Stocks</span>
      </div>
      
      {user && (
        <>
          <div className="navbar-menu">
            <Link to="/" className={`nav-link ${isActive('/') ? 'active' : ''}`}>
              Tableau de bord
            </Link>
            <Link to="/stocks" className={`nav-link ${isActive('/stocks') ? 'active' : ''}`}>
              Stocks
            </Link>
            <Link to="/categories" className={`nav-link ${isActive('/categories') ? 'active' : ''}`}>
              Catégories
            </Link>
          </div>
          
          <div className="navbar-user">
            <span className="username">👤 {user.username}</span>
            <button onClick={handleLogout} className="btn-logout">
              Déconnexion
            </button>
          </div>
        </>
      )}
    </nav>
  );
};

export default Navbar;
