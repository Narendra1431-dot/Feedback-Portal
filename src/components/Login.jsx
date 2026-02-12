import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Login = () => {
  const [credentials, setCredentials] = useState({ username: '', password: '' });

  const handleChange = (e) => {
    setCredentials({ ...credentials, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Simple login logic (demo)
    if (credentials.username === 'admin' && credentials.password === 'admin') {
      alert('Login successful');
      // Redirect to dashboard
      window.location.href = '/dashboard';
    } else {
      alert('Invalid credentials');
    }
  };

  return (
    <div className="portal">
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
        <div className="card-header">
          <div className="card-title"><i className="fas fa-sign-in-alt"></i> Login</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={credentials.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={credentials.password} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Login</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Don't have an account? <Link to="/register">Register</Link>
        </p>
      </div>
    </div>
  );
};

export default Login;
