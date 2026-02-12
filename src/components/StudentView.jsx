import React, { useState, useEffect } from 'react';

const StudentView = () => {
  const [grievances, setGrievances] = useState([]);
  const [formData, setFormData] = useState({
    title: '',
    category: 'Academic',
    description: '',
    attachment: null
  });
  const [charCounts, setCharCounts] = useState({ title: 0, description: 0 });

  useEffect(() => {
    // Load grievances from localStorage
    const stored = JSON.parse(localStorage.getItem('grievance_enterprise_v2') || '[]');
    const userGrievances = stored.filter(g => g.studentId === 'S1001');
    setGrievances(userGrievances);
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (name === 'title' || name === 'description') {
      setCharCounts(prev => ({ ...prev, [name]: value.length }));
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!formData.title.trim() || !formData.description.trim()) {
      alert('Title & description required');
      return;
    }

    const newGrievance = {
      id: Math.max(0, ...grievances.map(g => g.id)) + 1,
      studentId: 'S1001',
      title: formData.title,
      category: formData.category,
      description: formData.description,
      status: 'Pending',
      date: new Date().toISOString().slice(0, 10),
      lastUpdated: new Date().toISOString().slice(0, 10),
      attachment: formData.attachment,
      comments: []
    };

    const updated = [...grievances, newGrievance];
    setGrievances(updated);

    // Save to localStorage
    const all = JSON.parse(localStorage.getItem('grievance_enterprise_v2') || '[]');
    all.push(newGrievance);
    localStorage.setItem('grievance_enterprise_v2', JSON.stringify(all));

    setFormData({ title: '', category: 'Academic', description: '', attachment: null });
    setCharCounts({ title: 0, description: 0 });
    alert('Grievance submitted');
  };

  const total = grievances.length;
  const pending = grievances.filter(g => g.status === 'Pending').length;
  const resolved = grievances.filter(g => g.status === 'Resolved').length;

  return (
    <div className="portal">
      <div className="stats-panel">
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-flag"></i></div>
          <div className="stat-content"><h3>My total</h3><span className="stat-number">{total}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-hourglass-half"></i></div>
          <div className="stat-content"><h3>Pending</h3><span className="stat-number">{pending}</span></div>
        </div>
        <div className="stat-card">
          <div className="stat-icon"><i className="fas fa-check-circle"></i></div>
          <div className="stat-content"><h3>Resolved</h3><span className="stat-number">{resolved}</span></div>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title"><i className="fas fa-pen-to-square"></i> Submit new grievance</div>
        </div>
        <form className="grievance-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title *</label>
            <input type="text" name="title" value={formData.title} onChange={handleInputChange} maxLength="60" required />
            <div className="char-counter"><span>{charCounts.title}</span>/60</div>
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleInputChange}>
              <option value="Academic">Academic</option>
              <option value="Facility">Facility</option>
              <option value="Hostel">Hostel</option>
              <option value="IT">IT</option>
              <option value="Accounts">Accounts</option>
              <option value="Security">Security</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="form-group full-width">
            <label>Description *</label>
            <textarea name="description" value={formData.description} onChange={handleInputChange} rows="3" maxLength="300" required></textarea>
            <div className="char-counter"><span>{charCounts.description}</span>/300</div>
          </div>
          <button type="submit" className="btn-primary">
            <i className="fas fa-paper-plane"></i> Submit grievance
          </button>
        </form>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title"><i className="fas fa-list"></i> My grievances</div>
          <span className="badge-student"><i className="fas fa-id-card"></i> S1001</span>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr><th>ID</th><th>Title</th><th>Category</th><th>Status</th><th>Date</th><th>Attach</th><th>Actions</th></tr>
            </thead>
            <tbody>
              {grievances.length ? grievances.map(g => (
                <tr key={g.id}>
                  <td>{g.id}</td>
                  <td>{g.title}</td>
                  <td>{g.category}</td>
                  <td><span className={`badge ${g.status.toLowerCase().replace(' ', '-')}`}>{g.status}</span></td>
                  <td>{g.date}</td>
                  <td>{g.attachment ? <i className="fas fa-paperclip"></i> : '—'}</td>
                  <td>
                    <button className="btn-icon" onClick={() => alert(`Description: ${g.description}`)}>
                      <i className="fas fa-eye"></i> View
                    </button>
                    <button className="btn-icon">
                      <i className="fas fa-comment"></i> Comments ({g.comments?.length || 0})
                    </button>
                  </td>
                </tr>
              )) : <tr><td colSpan="7">No grievances</td></tr>}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default StudentView;
