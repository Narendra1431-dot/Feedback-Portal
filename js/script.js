// ---------- ENTERPRISE STATE & FEATURES ----------
//  • File attachments (simulated)    • Full comment threads
//  • Real‑time chart analytics       • CSV export with filters
//  • Sorting (all columns)           • Date range filtering
//  • Bulk status updates            • Last updated timestamp
//  • Modal comments                • Checkbox bulk selection
// -------------------------------------------------------

const STORAGE_KEY = 'grievance_enterprise_v2';
const CURRENT_USER = 'S1001';
const SEED_DATA = [
  { id: 101, studentId: 'S1001', title: 'Library AC broken', category: 'Facility', description: '3rd floor, near silent zone – >30°C', status: 'Pending', date: '2025-03-15', lastUpdated: '2025-03-15', attachment: 'ac_issue.jpg', comments: [] },
  { id: 102, studentId: 'S1002', title: 'Mess food quality', category: 'Hostel', description: 'Unhygienic serving, repeated', status: 'In Progress', date: '2025-03-14', lastUpdated: '2025-03-16', attachment: null, comments: [{ author: 'S1002', text: 'Still issue today', timestamp: '2025-03-16' }] },
  { id: 103, studentId: 'S1001', title: 'Scholarship delay', category: 'Accounts', description: 'Fee deducted but no scholarship', status: 'Resolved', date: '2025-03-10', lastUpdated: '2025-03-18', attachment: null, comments: [] },
  { id: 104, studentId: 'S1003', title: 'Wi‑Fi logout', category: 'IT', description: 'Hostel Block C, frequent drops', status: 'Pending', date: '2025-03-16', lastUpdated: '2025-03-16', attachment: null, comments: [] },
  { id: 105, studentId: 'S1004', title: 'Parking permit', category: 'Security', description: 'Paid but not received', status: 'Resolved', date: '2025-03-12', lastUpdated: '2025-03-17', attachment: 'permit_payment.pdf', comments: [{ author: 'Admin', text: 'Permit issued', timestamp: '2025-03-17' }] },
  { id: 106, studentId: 'S1001', title: 'Lab oscilloscopes', category: 'Academic', description: '4 units not functioning', status: 'Pending', date: '2025-03-17', lastUpdated: '2025-03-17', attachment: null, comments: [] }
];

// ---------- TOAST ----------
class ToastService {
  #container;
  constructor() { this.#container = document.getElementById('toastContainer'); }
  show(msg, type = 'info', dur = 4000) {
    const t = document.createElement('div');
    t.className = `toast ${type}`;
    t.role = 'alert';
    t.innerHTML = `<i class="fas ${type==='success'?'fa-check-circle':type==='error'?'fa-exclamation-circle':'fa-info-circle'}"></i>${msg}`;
    this.#container.appendChild(t);
    setTimeout(() => t.remove(), dur);
  }
}
const toast = new ToastService();

// ---------- EVENT EMITTER ----------
class EventEmitter {
  #events = new Map();
  on(e, fn) { if (!this.#events.has(e)) this.#events.set(e, []); this.#events.get(e).push(fn); }
  emit(e, d) { if (this.#events.has(e)) this.#events.get(e).forEach(fn => fn(d)); }
}

// ---------- STORE (immutable, comments, attachment) ----------
class GrievanceStore extends EventEmitter {
  #grievances;
  constructor() {
    super();
    this.#grievances = this.#load();
  }
  #load() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || SEED_DATA.map(g => ({ ...g, comments: g.comments?.map(c => ({...c})) || [] })); }
    catch { return SEED_DATA.map(g => ({ ...g, comments: g.comments?.map(c => ({...c})) || [] })); }
  }
  #persist() { localStorage.setItem(STORAGE_KEY, JSON.stringify(this.#grievances)); }

  getAll() { return [...this.#grievances]; }
  getById(id) { return this.#grievances.find(g => g.id === id); }
  getByStudent(sid) { return this.#grievances.filter(g => g.studentId === sid); }

  add(grievance) {
    const newG = {
      ...grievance,
      id: Math.max(0, ...this.#grievances.map(g=>g.id)) + 1,
      lastUpdated: new Date().toISOString().slice(0,10),
      comments: grievance.comments || [],
      attachment: grievance.attachment || null
    };
    this.#grievances.push(newG);
    this.#persist();
    this.emit('change', this.#grievances);
    toast.show('Grievance submitted', 'success');
    return newG;
  }

  update(id, updates) {
    const idx = this.#grievances.findIndex(g => g.id === id);
    if (idx === -1) return false;
    this.#grievances[idx] = { ...this.#grievances[idx], ...updates, lastUpdated: new Date().toISOString().slice(0,10) };
    this.#persist();
    this.emit('change', this.#grievances);
    toast.show(`Grievance #${id} updated`, 'info');
    return true;
  }

  addComment(id, author, text) {
    const g = this.getById(id);
    if (!g) return;
    const comment = { author, text, timestamp: new Date().toISOString().slice(0,10) + ' ' + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) };
    const comments = [...(g.comments || []), comment];
    this.update(id, { comments });
    toast.show('Comment added', 'success');
  }

  delete(id) {
    const len = this.#grievances.length;
    this.#grievances = this.#grievances.filter(g => g.id !== id);
    if (this.#grievances.length !== len) { this.#persist(); this.emit('change'); toast.show(`Deleted #${id}`, 'success'); return true; }
    return false;
  }

  reset() {
    this.#grievances = SEED_DATA.map(g => ({ ...g, comments: g.comments?.map(c => ({...c})) || [] }));
    this.#persist();
    this.emit('change');
    toast.show('Demo reset', 'info');
  }
}
const store = new GrievanceStore();

// ---------- PORTAL RENDERER (with all new features) ----------
class PortalRenderer {
  #root;
  currentView = 'student';
  // admin state
  adminFilters = { search: '', status: '', category: '', studentId: '', dateFrom: '', dateTo: '' };
  sort = { by: 'id', dir: 'asc' };
  page = 1;
  pageSize = 5;
  selectedIds = new Set();   // bulk selection
  modalGrievanceId = null;

  constructor() {
    this.#root = document.getElementById('portal-root');
    store.on('change', () => this.render());
    this.render();
  }

  // main render
  render() {
    if (this.currentView === 'student') this.#renderStudent();
    else this.#renderAdmin();
    this.#attachGlobalListeners();
  }

  // ---------- STUDENT VIEW (enhanced with attachment simulation) ----------
  #renderStudent() {
    const grievances = store.getByStudent(CURRENT_USER);
    const total = grievances.length, pending = grievances.filter(g=>g.status==='Pending').length, resolved = grievances.filter(g=>g.status==='Resolved').length;

    this.#root.innerHTML = `
      <div class="stats-panel">
        <div class="stat-card"><div class="stat-icon"><i class="fas fa-flag"></i></div><div class="stat-content"><h3>My total</h3><span class="stat-number">${total}</span></div></div>
        <div class="stat-card"><div class="stat-icon"><i class="fas fa-hourglass-half"></i></div><div class="stat-content"><h3>Pending</h3><span class="stat-number">${pending}</span></div></div>
        <div class="stat-card"><div class="stat-icon"><i class="fas fa-check-circle"></i></div><div class="stat-content"><h3>Resolved</h3><span class="stat-number">${resolved}</span></div></div>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-pen-to-square" style="color:#0a558c"></i> Submit new grievance</div></div>
        <form id="studentForm" class="grievance-form">
          <div class="form-group"><label>Title *</label><input type="text" id="title" maxlength="60" required><div class="char-counter"><span id="titleCounter">0</span>/60</div></div>
          <div class="form-group"><label>Category</label><select id="category">${this.#categoryOptions()}</select></div>
          <div class="form-group full-width"><label>Description *</label><textarea id="description" rows="3" maxlength="300" required></textarea><div class="char-counter"><span id="descCounter">0</span>/300</div></div>
          <div class="form-group full-width">
            <label>Attachment (simulated)</label>
            <div class="attach-sim">
              <span id="attachFilename" style="color:#2a6078;"><i class="fas fa-paperclip"></i> No file</span>
              <button type="button" id="simulateAttachBtn" class="btn-secondary"><i class="fas fa-cloud-upload-alt"></i> Simulate attachment</button>
            </div>
          </div>
          <button type="submit" class="btn-primary"><i class="fas fa-paper-plane"></i> Submit grievance</button>
        </form>
      </div>
      <div class="card">
        <div class="card-header"><div class="card-title"><i class="fas fa-list"></i> My grievances</div><span class="badge-student"><i class="fas fa-id-card"></i> ${CURRENT_USER}</span></div>
        <div class="table-responsive">
          <table>
            <thead><tr><th>ID</th><th>Title</th><th>Category</th><th>Status</th><th>Date</th><th>Attach</th><th>Actions</th></tr></thead>
            <tbody>
              ${grievances.length ? grievances.map(g => `
                <tr>
                  <td>${g.id}</td><td>${g.title}</td><td>${g.category}</td>
                  <td><span class="badge ${g.status.toLowerCase().replace(' ', '-')}">${g.status}</span></td>
                  <td>${g.date}</td>
                  <td>${g.attachment ? `<i class="fas fa-paperclip" style="color:#0a558c" title="${g.attachment}"></i>` : '—'}</td>
                  <td><button class="btn-icon view-details" data-id="${g.id}"><i class="fas fa-eye"></i> View</button>
                  <button class="btn-icon comment-btn" data-id="${g.id}"><i class="fas fa-comment"></i> Comments (${g.comments?.length || 0})</button></td>
                </tr>
              `).join('') : `<tr><td colspan="7" class="empty-message">No grievances</td></tr>`}
            </tbody>
          </table>
        </div>
      </div>
    `;
    this.#attachStudentForm();
    this.#attachDetailsAndComments();
  }

  // ---------- ADMIN VIEW (full suite) ----------
  #renderAdmin() {
    const all = store.getAll();
    let filtered = this.#applyFilters(all);
    // sorting
    filtered = this.#sortList(filtered);
    const total = all.length, pending = all.filter(g=>g.status==='Pending').length, resolved = all.filter(g=>g.status==='Resolved').length;
    const totalPages = Math.ceil(filtered.length / this.pageSize) || 1;
    if (this.page > totalPages) this.page = totalPages;
    const paginated = filtered.slice((this.page-1)*this.pageSize, this.page*this.pageSize);

    this.#root.innerHTML = `
      <div class="dashboard-grid">
        <div class="stats-panel">
          <div class="stat-card"><div class="stat-icon"><i class="fas fa-database"></i></div><div class="stat-content"><h3>All</h3><span class="stat-number">${total}</span></div></div>
          <div class="stat-card"><div class="stat-icon"><i class="fas fa-hourglass-half"></i></div><div class="stat-content"><h3>Pending</h3><span class="stat-number">${pending}</span></div></div>
          <div class="stat-card"><div class="stat-icon"><i class="fas fa-check-circle"></i></div><div class="stat-content"><h3>Resolved</h3><span class="stat-number">${resolved}</span></div></div>
        </div>
        <div class="chart-card">
          <canvas id="statusChart"></canvas>
          <p style="text-align:center; font-size:0.8rem; margin-top:8px;">Status distribution</p>
        </div>
      </div>
      <div class="card">
        <div class="card-header">
          <div class="card-title"><i class="fas fa-shield-alt"></i> Admin · grievance control</div>
          <button id="exportCsvBtn" class="export-btn"><i class="fas fa-download"></i> Export CSV</button>
        </div>
        <div class="filter-bar">
          <div class="filter-group"><i class="fas fa-search"></i><input type="text" id="filterSearch" placeholder="Search" value="${this.adminFilters.search}"><button id="searchBtn" class="btn-secondary">Bilatu</button></div>
          <div class="filter-group"><i class="fas fa-tag"></i><select id="filterCategory"><option value="">All categories</option>${this.#categoryOptions(this.adminFilters.category)}</select></div>
          <div class="filter-group"><i class="fas fa-flag"></i><select id="filterStatus"><option value="">All status</option><option value="Pending">Pending</option><option value="In Progress">In Progress</option><option value="Resolved">Resolved</option></select></div>
          <div class="filter-group"><i class="fas fa-id-card"></i><input type="text" id="filterStudent" placeholder="Student ID" value="${this.adminFilters.studentId}"></div>
          <div class="date-range">
            <div class="filter-group"><i class="fas fa-calendar-from"></i><input type="date" id="filterDateFrom" value="${this.adminFilters.dateFrom}"></div>
            <div class="filter-group"><i class="fas fa-calendar-to"></i><input type="date" id="filterDateTo" value="${this.adminFilters.dateTo}"></div>
          </div>
        </div>
        <div class="table-responsive">
          <table>
            <thead><tr>
              <th style="width:30px;"><input type="checkbox" id="selectAllCheckbox" ${this.selectedIds.size === paginated.length && paginated.length ? 'checked' : ''}></th>
              <th onclick="renderer.sortBy('id')">ID ${this.sort.by==='id'? (this.sort.dir==='asc'?'▲':'▼'):''}</th>
              <th onclick="renderer.sortBy('studentId')">Student ${this.sort.by==='studentId'? (this.sort.dir==='asc'?'▲':'▼'):''}</th>
              <th onclick="renderer.sortBy('title')">Title</th>
              <th onclick="renderer.sortBy('category')">Category</th>
              <th onclick="renderer.sortBy('status')">Status</th>
              <th onclick="renderer.sortBy('date')">Date</th>
              <th>Attach</th>
              <th>Actions</th>
            </tr></thead>
            <tbody>
              ${paginated.length ? paginated.map(g => `
                <tr>
                  <td><input type="checkbox" class="row-select" data-id="${g.id}" ${this.selectedIds.has(g.id) ? 'checked' : ''}></td>
                  <td>${g.id}</td><td>${g.studentId}</td><td>${g.title}</td><td>${g.category}</td>
                  <td><span class="badge ${g.status.toLowerCase().replace(' ', '-')}">${g.status}</span></td>
                  <td>${g.date}</td>
                  <td>${g.attachment ? `<i class="fas fa-paperclip" title="${g.attachment}"></i>` : '—'}</td>
                  <td><div class="action-group">
                    ${g.status !== 'Resolved' ? `<button class="btn-icon mark-resolved" data-id="${g.id}"><i class="fas fa-check-circle"></i> Resolve</button>` : ''}
                    <button class="btn-icon comment-btn" data-id="${g.id}"><i class="fas fa-comment"></i> (${g.comments?.length || 0})</button>
                    <button class="btn-icon btn-delete delete-grievance" data-id="${g.id}"><i class="fas fa-trash"></i></button>
                  </div></td>
                </tr>
              `).join('') : `<tr><td colspan="9" class="empty-message">No matching grievances</td></tr>`}
            </tbody>
          </table>
        </div>
        <div class="pagination">
          <span>Page ${this.page} of ${totalPages}</span>
          <button ${this.page===1?'disabled':''} id="prevPage"><i class="fas fa-chevron-left"></i> Prev</button>
          <button ${this.page===totalPages?'disabled':''} id="nextPage">Next <i class="fas fa-chevron-right"></i></button>
        </div>
        <div class="bulk-bar">
          <span><strong>Bulk actions</strong></span>
          <select id="bulkStatusSelect">
            <option value="">— Change status —</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Resolved">Resolved</option>
          </select>
          <button id="applyBulkBtn" class="btn-secondary">Apply</button>
          <button id="clearSelectedBtn" class="btn-secondary">Clear selection</button>
        </div>
      </div>
    `;
    this.#initChart();
    this.#attachAdminFilters();
    this.#attachAdminActions();
    this.#attachBulkHandlers();
    this.#attachExport();
    window.renderer = this; // for sorting onclick
  }

  // ---------- FEATURE IMPLEMENTATIONS ----------
  #categoryOptions(selected = '') {
    const cats = ['Academic','Facility','Hostel','IT','Accounts','Security','Other'];
    return cats.map(c => `<option value="${c}" ${c===selected?'selected':''}>${c}</option>`).join('');
  }

  #applyFilters(list) {
    const f = this.adminFilters;
    return list.filter(g =>
      (!f.search || g.title.toLowerCase().includes(f.search.toLowerCase()) || g.description.toLowerCase().includes(f.search.toLowerCase())) &&
      (!f.status || g.status === f.status) &&
      (!f.category || g.category === f.category) &&
      (!f.studentId || g.studentId.toLowerCase().includes(f.studentId.toLowerCase())) &&
      (!f.dateFrom || g.date >= f.dateFrom) &&
      (!f.dateTo || g.date <= f.dateTo)
    );
  }

  #sortList(list) {
    const { by, dir } = this.sort;
    return [...list].sort((a,b) => {
      let valA = a[by], valB = b[by];
      if (by === 'date' || by === 'id') valA = Number(valA), valB = Number(valB);
      if (valA < valB) return dir === 'asc' ? -1 : 1;
      if (valA > valB) return dir === 'asc' ? 1 : -1;
      return 0;
    });
  }

  sortBy(column) {
    if (this.sort.by === column) this.sort.dir = this.sort.dir === 'asc' ? 'desc' : 'asc';
    else { this.sort.by = column; this.sort.dir = 'asc'; }
    this.render();
  }

  // ---------- CHARTS ----------
  #initChart() {
    setTimeout(() => {
      const canvas = document.getElementById('statusChart');
      if (!canvas) return;
      const all = store.getAll();
      const pending = all.filter(g=>g.status==='Pending').length;
      const progress = all.filter(g=>g.status==='In Progress').length;
      const resolved = all.filter(g=>g.status==='Resolved').length;
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
    }, 30);
  }

  // ---------- FORM, ATTACHMENT SIMULATION ----------
  #attachStudentForm() {
    const form = document.getElementById('studentForm');
    if (!form) return;
    let simulatedFile = null;
    document.getElementById('simulateAttachBtn')?.addEventListener('click', () => {
      simulatedFile = 'screenshot_' + Date.now() + '.png';
      document.getElementById('attachFilename').innerHTML = `<i class="fas fa-paperclip"></i> ${simulatedFile}`;
    });
    form.onsubmit = (e) => {
      e.preventDefault();
      const title = document.getElementById('title').value.trim();
      const desc = document.getElementById('description').value.trim();
      if (!title || !desc) { toast.show('Title & description required', 'error'); return; }
      store.add({
        studentId: CURRENT_USER,
        title, category: document.getElementById('category').value,
        description: desc,
        status: 'Pending',
        date: new Date().toISOString().slice(0,10),
        attachment: simulatedFile,
        comments: []
      });
      form.reset();
      simulatedFile = null;
      document.getElementById('attachFilename').innerHTML = '<i class="fas fa-paperclip"></i> No file';
    };
    ['title','description'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', ()=> document.getElementById(id+'Counter').textContent = el.value.length);
    });
  }

  // ---------- COMMENT MODAL ----------
  #openCommentModal(grievanceId) {
    const g = store.getById(grievanceId);
    if (!g) return;
    this.modalGrievanceId = grievanceId;
    const modal = document.getElementById('commentModal');
    const thread = document.getElementById('commentThread');
    thread.innerHTML = (g.comments?.length ? g.comments.map(c => `
      <div class="comment">
        <strong>${c.author}</strong> <small>${c.timestamp}</small>
        <p style="margin-top:6px;">${c.text}</p>
      </div>
    `).join('') : '<p style="color:#587b8c;">No comments yet.</p>');
    document.getElementById('commentInput').value = '';
    modal.classList.add('active');
  }

  #attachDetailsAndComments() {
    document.querySelectorAll('.view-details').forEach(b => b.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      const g = store.getById(id);
      if (g) toast.show(`Description: ${g.description}`, 'info', 6000);
    }));
    document.querySelectorAll('.comment-btn').forEach(b => b.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      this.#openCommentModal(id);
    }));
  }

  #attachAdminFilters() {
    const update = () => {
      this.adminFilters.search = document.getElementById('filterSearch')?.value || '';
      this.adminFilters.category = document.getElementById('filterCategory')?.value || '';
      this.adminFilters.status = document.getElementById('filterStatus')?.value || '';
      this.adminFilters.studentId = document.getElementById('filterStudent')?.value || '';
      this.adminFilters.dateFrom = document.getElementById('filterDateFrom')?.value || '';
      this.adminFilters.dateTo = document.getElementById('filterDateTo')?.value || '';
      this.page = 1;
      this.render();
    };
    ['filterSearch','filterCategory','filterStatus','filterStudent','filterDateFrom','filterDateTo'].forEach(id => {
      const el = document.getElementById(id);
      if (el) el.addEventListener('input', update);
    });
    document.getElementById('searchBtn')?.addEventListener('click', update);
    const prev = document.getElementById('prevPage'), next = document.getElementById('nextPage');
    if (prev) prev.addEventListener('click', ()=>{ this.page--; this.render(); });
    if (next) next.addEventListener('click', ()=>{ this.page++; this.render(); });
  }

  #attachAdminActions() {
    document.querySelectorAll('.mark-resolved').forEach(b => b.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      store.update(id, { status: 'Resolved' });
      this.render();
    }));
    document.querySelectorAll('.delete-grievance').forEach(b => b.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      if (confirm(`Delete #${id}?`)) { store.delete(id); this.render(); }
    }));
    document.querySelectorAll('.comment-btn').forEach(b => b.addEventListener('click', (e) => {
      const id = parseInt(e.currentTarget.dataset.id);
      this.#openCommentModal(id);
    }));
  }

  #attachBulkHandlers() {
    const selectAll = document.getElementById('selectAllCheckbox');
    if (selectAll) selectAll.addEventListener('change', (e) => {
      const rows = document.querySelectorAll('.row-select');
      rows.forEach(cb => cb.checked = e.target.checked);
      this.selectedIds.clear();
      if (e.target.checked) rows.forEach(cb => this.selectedIds.add(parseInt(cb.dataset.id)));
      else this.selectedIds.clear();
    });
    document.querySelectorAll('.row-select').forEach(cb => cb.addEventListener('change', (e) => {
      const id = parseInt(e.target.dataset.id);
      if (e.target.checked) this.selectedIds.add(id);
      else this.selectedIds.delete(id);
      const selectAll = document.getElementById('selectAllCheckbox');
      if (selectAll) selectAll.checked = document.querySelectorAll('.row-select:checked').length === document.querySelectorAll('.row-select').length;
    }));
    document.getElementById('applyBulkBtn')?.addEventListener('click', () => {
      const newStatus = document.getElementById('bulkStatusSelect').value;
      if (!newStatus) { toast.show('Select a status', 'error'); return; }
      if (this.selectedIds.size === 0) { toast.show('No rows selected', 'error'); return; }
      this.selectedIds.forEach(id => store.update(id, { status: newStatus }));
      this.selectedIds.clear();
      this.render();
    });
    document.getElementById('clearSelectedBtn')?.addEventListener('click', () => {
      this.selectedIds.clear();
      this.render();
    });
  }

  #attachExport() {
    document.getElementById('exportCsvBtn')?.addEventListener('click', () => {
      const all = store.getAll();
      const filtered = this.#applyFilters(all);
      const headers = ['ID','Student','Title','Category','Status','Date','Attachment','Comments'];
      const rows = filtered.map(g => [g.id, g.studentId, g.title, g.category, g.status, g.date, g.attachment||'', g.comments?.length||0]);
      const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url; a.download = 'grievances_export.csv'; a.click();
      toast.show('CSV exported', 'success');
    });
  }

  #attachGlobalListeners() {
    document.querySelectorAll('.view-btn').forEach(b => {
      b.addEventListener('click', (e) => {
        const v = e.currentTarget.id.includes('Student') ? 'student' : 'admin';
        if (v === this.currentView) return;
        this.currentView = v;
        this.page = 1; this.selectedIds.clear();
        document.querySelectorAll('.view-btn').forEach(b => b.classList.remove('active'));
        e.currentTarget.classList.add('active');
        this.render();
      });
    });
    document.getElementById('resetDemoBtn')?.addEventListener('click', () => store.reset());
    // modal handlers
    document.getElementById('closeModalBtn')?.addEventListener('click', () => document.getElementById('commentModal').classList.remove('active'));
    document.getElementById('submitCommentBtn')?.addEventListener('click', () => {
      const input = document.getElementById('commentInput');
      const text = input.value.trim();
      if (!text) return;
      if (this.modalGrievanceId) {
        store.addComment(this.modalGrievanceId, this.currentView === 'admin' ? 'Admin' : CURRENT_USER, text);
        this.#openCommentModal(this.modalGrievanceId); // refresh
      }
    });
  }
}

// ---------- callServer function ----------
function callServer() {
  // Placeholder for search or server call
  alert('Bilatu button clicked! Implement search functionality here.');
}

// ---------- BOOTSTRAP ----------
document.addEventListener('DOMContentLoaded', () => {
  document.querySelector('.portal').innerHTML = `
    <header class="portal-header">
      <div class="brand">
        <div class="brand-icon"><i class="fas fa-graduation-cap"></i></div>
        <div class="brand-text"><h1>Grievance & Feedback</h1><span><i class="fas fa-university"></i> Senior Enterprise · Central University</span></div>
      </div>
      <div style="display:flex; gap:14px;">
        <div class="view-controls">
          <button id="btnStudentView" class="view-btn active"><i class="fas fa-user-graduate"></i> Student</button>
          <button id="btnAdminView" class="view-btn"><i class="fas fa-user-tie"></i> Admin</button>
        </div>
        <button id="resetDemoBtn" class="reset-btn"><i class="fas fa-rotate-left"></i> Reset demo</button>
      </div>
    </header>
  `;
  window.portalRenderer = new PortalRenderer(); // start
});
