import React from 'react';
import { Link } from 'react-router-dom';

const Header = () => {
  return (
    <header className="portal-header">
      <div className="brand">
        <div className="brand-icon">
          <i className="fas fa-graduation-cap"></i>
        </div>
        <div className="brand-text">
          <h1>Grievance & Feedback</h1>
          <span>
            <i className="fas fa-university"></i> Senior Enterprise · Central University
          </span>
        </div>
      </div>
      <div style={{ display: 'flex', gap: '14px' }}>
        <div className="view-controls">
          <Link to="/" className="view-btn active">
            <i className="fas fa-user-graduate"></i> Student
          </Link>
          <Link to="/dashboard" className="view-btn">
            <i className="fas fa-user-tie"></i> Admin
          </Link>
        </div>
        <button className="reset-btn">
          <i className="fas fa-rotate-left"></i> Reset demo
        </button>
      </div>
    </header>
  );
};

export default Header;
