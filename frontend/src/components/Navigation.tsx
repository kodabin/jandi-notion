import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Navigation.css';

const Navigation: React.FC = () => {
  const location = useLocation();

  return (
    <nav className="navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <h2>🚀 잔디-노션 Webhook</h2>
        </div>
        <div className="nav-links">
          <Link
            to="/"
            className={location.pathname === '/' ? 'nav-link active' : 'nav-link'}
          >
            📱 메인
          </Link>
          <Link
            to="/admin"
            className={location.pathname === '/admin' ? 'nav-link active' : 'nav-link'}
          >
            🔧 Admin
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;