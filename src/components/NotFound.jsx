import React from 'react';
import { Link } from 'react-router-dom';

const NotFound = () => {
  return (
    <div className="portal">
      <div className="card" style={{ textAlign: 'center', maxWidth: '600px', margin: '50px auto' }}>
        <div className="card-header">
          <div className="card-title"><i className="fas fa-exclamation-triangle"></i> 404 - Page Not Found</div>
        </div>
        <p>The page you are looking for does not exist.</p>
        <Link to="/" className="btn-primary">Go Home</Link>
      </div>
    </div>
  );
};

export default NotFound;
