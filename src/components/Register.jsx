import React, { useState } from 'react';
import { Link } from 'react-router-dom';

const Register = () => {
  const [user, setUser] = useState({ username: '', email: '', password: '', confirmPassword: '' });

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (user.password !== user.confirmPassword) {
      alert('Passwords do not match');
      return;
    }
    alert('Registration successful');
    // Redirect to login
    window.location.href = '/login';
  };

  return (
    <div className="portal">
      <div className="card" style={{ maxWidth: '400px', margin: '50px auto' }}>
        <div className="card-header">
          <div className="card-title"><i className="fas fa-user-plus"></i> Register</div>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Username</label>
            <input type="text" name="username" value={user.username} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input type="email" name="email" value={user.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Password</label>
            <input type="password" name="password" value={user.password} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Confirm Password</label>
            <input type="password" name="confirmPassword" value={user.confirmPassword} onChange={handleChange} required />
          </div>
          <button type="submit" className="btn-primary" style={{ width: '100%' }}>Register</button>
        </form>
        <p style={{ textAlign: 'center', marginTop: '20px' }}>
          Already have an account? <Link to="/login">Login</Link>
        </p>
      </div>
    </div>
  );
};

export default Register;
