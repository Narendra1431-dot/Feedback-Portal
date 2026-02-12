import React, { useState, useEffect } from 'react';
import Chart from 'chart.js/auto';

const AdminView = () => {
  const [grievances, setGrievances] = useState([]);
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    category: '',
    studentId: '',
    dateFrom: '',
    dateTo: ''
  });
  const [searchInput, setSearchInput] = useState('');
  const [sort, setSort] = useState({ by: 'id', dir: 'asc' });
  const [page, setPage] = useState(1);
  const pageSize = 5;
  const [selectedIds, setSelectedIds] = useState(new Set());

  useEffect(() => {
    const stored = JSON.parse(localStorage.getItem('grievance_enterprise_v2') || '[]');
    setGrievances(stored);
  }, []);

  useEffect(() => {
    // Initialize chart
    const canvas = document.getElementById('statusChart');
    if (canvas) {
      const pending = grievances.filter(g => g.status === 'Pending').length;
      const progress = grievances.filter(g => g.status === 'In Progress').length;
      const resolved = grievances.filter(g => g.status === 'Resolved').length;
      new Chart(canvas, {
        type: 'doughnut',
        data: {
          labels: ['Pending', 'In Progress', 'Resolved'],
          datasets: [{
            data: [pending, progress, resolved],
            backgroundColor: ['#ffb347', '#5fa8d3', '#6bb46b'],
            borderWidth: 0
          }]
        },
        options: { cutout: '65%', plugins: { legend: { display: false } } }
      });
    }
  }, [grievances]);

  const filteredGrievances = grievances.filter(g => {
    return (
      (!filters.search || g.title.toLowerCase().includes(filters.search.toLowerCase()) || g.description.toLowerCase().includes(filters.search.toLowerCase())) &&
      (!filters.status || g.status === filters.status) &&
      (!filters.category || g.category === filters.category) &&
      (!filters.studentId || g.studentId.toLowerCase().includes(filters.studentId.toLowerCase())) &&
      (!filters.dateFrom || g.date >= filters.dateFrom) &&
      (!filters.dateTo || g.date <= filters.dateTo)
    );
  });

  const sortedGrievances = [...filteredGrievances].sort((a, b) => {
    let valA = a[sort.by], valB = b[sort.by];
    if (sort.by === 'date' || sort.by === 'id') valA = Number(valA), valB = Number(valB);
    if (valA < valB) return sort.dir === 'asc' ? -1 : 1;
    if (valA > valB) return sort.dir === 'asc' ? 1 : -1;
    return 0;
  });

  const paginated = sortedGrievances.slice((page - 1) * pageSize, page * pageSize);
  const totalPages = Math.ceil(sortedGrievances.length / pageSize);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
    setPage(1);
  };

  const handleSort = (column) => {
    if (sort.by === column) {
      setSort(prev => ({ ...prev, dir: prev.dir === 'asc' ? 'desc' : 'asc' }));
    } else {
      setSort({ by: column, dir: 'asc' });
    }
  };

  const updateStatus = (id, status) => {
    const updated = grievances.map(g => g.id === id ? { ...g, status, lastUpdated: new Date().toISOString().slice(0, 10) } : g);
    setGrievances(updated);
    localStorage.setItem('grievance_enterprise_v2', JSON.stringify(updated));
  };

  const deleteGrievance = (id) => {
    if (window.confirm(`Delete #${id}?`)) {
      const updated = grievances.filter(g => g.id !== id);
      setGrievances(updated);
      localStorage.setItem('grievance_enterprise_v2', JSON.stringify(updated));
    }
  };

  const exportCsv = () => {
    const headers = ['ID', 'Student', 'Title', 'Category', 'Status', 'Date', 'Attachment', 'Comments'];
    const rows = filteredGrievances.map(g => [g.id, g.studentId, g.title, g.category, g.status, g.date, g.attachment || '', g.comments?.length || 0]);
    const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'grievances_export.csv';
    a.click();
  };

  const total = grievances.length;
  const pending = grievances.filter(g => g.status === 'Pending').length;
  const resolved = grievances.filter(g => g.status === 'Resolved').length;

  return (
    <div className="portal">
      <div className="dashboard-grid">
        <div className="stats-panel">
          <div className="stat-card">
            <div className="stat-icon"><i className="fas fa-database"></i></div>
            <div className="stat-content"><h3>All</h3><span className="stat-number">{total}</span></div>
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
        <div className="chart-card">
          <canvas id="statusChart"></canvas>
          <p style={{ textAlign: 'center', fontSize: '0.8rem', marginTop: '8px' }}>Status distribution</p>
        </div>
      </div>
      <div className="card">
        <div className="card-header">
          <div className="card-title"><i className="fas fa-shield-alt"></i> Admin · grievance control</div>
          <button className="export-btn" onClick={exportCsv}><i className="fas fa-download"></i> Export CSV</button>
        </div>
        <div className="filter-bar">
          <div className="filter-group">
            <i className="fas fa-search"></i>
            <input type="text" placeholder="Search" value={searchInput} onChange={(e) => setSearchInput(e.target.value)} />
            <button className="btn-secondary" onClick={() => { setFilters(prev => ({ ...prev, search: searchInput })); setPage(1); }}>Bilatu</button>
          </div>
          <div className="filter-group">
            <i className="fas fa-tag"></i>
            <select name="category" value={filters.category} onChange={handleFilterChange}>
              <option value="">All categories</option>
              <option value="Academic">Academic</option>
              <option value="Facility">Facility</option>
              <option value="Hostel">Hostel</option>
              <option value="IT">IT</option>
              <option value="Accounts">Accounts</option>
              <option value="Security">Security</option>
              <option value="Other">Other</option>
            </select>
          </div>
          <div className="filter-group">
            <i className="fas fa-flag"></i>
            <select name="status" value={filters.status} onChange={handleFilterChange}>
              <option value="">All status</option>
              <option value="Pending">Pending</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
            </select>
          </div>
          <div className="filter-group">
            <i className="fas fa-id-card"></i>
            <input type="text" name="studentId" placeholder="Student ID" value={filters.studentId} onChange={handleFilterChange} />
          </div>
          <div className="date-range">
            <div className="filter-group">
              <i className="fas fa-calendar-from"></i>
              <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange} />
            </div>
            <div className="date-range">
              <div className="filter-group">
                <i className="fas fa-calendar-to"></i>
                <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange} />
              </div>
            </div>
          </div>
        </div>
        <div className="table-responsive">
          <table>
            <thead>
              <tr>
                <th style={{ width: '30px' }}>
                  <input type="checkbox" onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedIds(new Set(paginated.map(g => g.id)));
                    } else {
                      setSelectedIds(new Set());
                    }
                  }} />
                </th>
                <th onClick={() => handleSort('id')}>ID {sort.by === 'id' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('studentId')}>Student {sort.by === 'studentId' ? (sort.dir === 'asc' ? '▲' : '▼') : ''}</th>
                <th onClick={() => handleSort('title')}>Title</th>
                <th onClick={() => handleSort('category')}>Category</th>
                <th onClick={() => handleSort('status')}>Status</th>
                <th onClick={() => handleSort('date')}>Date</th>
                <th>Attach</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {paginated.length ? paginated.map(g => (
                <tr key={g.id}>
                  <td>
                    <input type="checkbox" checked={selectedIds.has(g.id)} onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(prev => new Set([...prev, g.id]));
                      } else {
                        setSelectedIds(prev => {
                          const newSet = new Set(prev);
                          newSet.delete(g.id);
                          return newSet;
                        });
                      }
                    }} />
                  </td>
                  <td>{g.id}</td>
                  <td>{g.studentId}</td>
                  <td>{g.title}</td>
                  <td>{g.category}</td>
                  <td><span className={`badge ${g.status.toLowerCase().replace(' ', '-')}`}>{g.status}</span></td>
                  <td>{g.date}</td>
                  <td>{g.attachment ? <i className="fas fa-paperclip"></i> : '—'}</td>
                  <td>
                    <div className="action-group">
                      {g.status !== 'Resolved' && (
                        <button className="btn-icon" onClick={() => updateStatus(g.id, 'Resolved')}>
                          <i className="fas fa-check-circle"></i> Resolve
                        </button>
                      )}
                      <button className="btn-icon">
                        <i className="fas fa-comment"></i> ({g.comments?.length || 0})
                      </button>
                      <button className="btn-icon btn-delete" onClick={() => deleteGrievance(g.id)}>
                        <i className="fas fa-trash"></i>
                      </button>
                    </div>
                  </td>
                </tr>
              )) : <tr><td colSpan="9">No matching grievances</td></tr>}
            </tbody>
          </table>
        </div>
        <div className="pagination">
          <span>Page {page} of {totalPages}</span>
          <button disabled={page === 1} onClick={() => setPage(page - 1)}><i className="fas fa-chevron-left"></i> Prev</button>
          <button disabled={page === totalPages} onClick={() => setPage(page + 1)}>Next <i className="fas fa-chevron-right"></i></button>
        </div>
        <div className="bulk-bar">
          <span><strong>Bulk actions</strong></span>
          <select id="bulkStatus">
            <option value="">— Change status —</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <button onClick={() => {
            const status = document.getElementById('bulkStatus').value;
            if (!status) return;
            selectedIds.forEach(id => updateStatus(id, status));
            setSelectedIds(new Set());
          }}>Apply</button>
          <button onClick={() => setSelectedIds(new Set())}>Clear selection</button>
        </div>
      </div>
    </div>
  );
};

export default AdminView;
