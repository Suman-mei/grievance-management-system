import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import API from '../api';
import { useAuth } from '../context/AuthContext';

const GrievanceModal = ({ grievance, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    title: grievance?.title || '',
    description: grievance?.description || '',
    category: grievance?.category || 'Academic',
    status: grievance?.status || 'Pending',
  });
  const [loading, setLoading] = useState(false);
  const isEdit = !!grievance;

  const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.title || !formData.description)
      return toast.error('Title and description are required');
    setLoading(true);
    try {
      if (isEdit) {
        const { data } = await API.put(`/grievances/${grievance._id}`, formData);
        toast.success('Grievance updated!');
        onSave(data.grievance, 'update');
      } else {
        const { data } = await API.post('/grievances', formData);
        toast.success('Grievance submitted!');
        onSave(data.grievance, 'create');
      }
      onClose();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3 className="modal-title">{isEdit ? '✏️ Edit Grievance' : '📝 New Grievance'}</h3>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Title</label>
            <input type="text" name="title" placeholder="Brief title of the issue"
              value={formData.title} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Category</label>
            <select name="category" value={formData.category} onChange={handleChange}>
              <option>Academic</option>
              <option>Hostel</option>
              <option>Transport</option>
              <option>Other</option>
            </select>
          </div>
          <div className="form-group">
            <label>Description</label>
            <textarea name="description" placeholder="Describe your grievance in detail..."
              value={formData.description} onChange={handleChange} rows={4} />
          </div>
          {isEdit && (
            <div className="form-group">
              <label>Status</label>
              <select name="status" value={formData.status} onChange={handleChange}>
                <option>Pending</option>
                <option>Resolved</option>
              </select>
            </div>
          )}
          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>Cancel</button>
            <button type="submit" className="btn btn-primary" disabled={loading}>
              {loading ? 'Saving...' : isEdit ? '✔ Update' : '✔ Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { student, logout } = useAuth();
  const navigate = useNavigate();
  const [grievances, setGrievances] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingGrievance, setEditingGrievance] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const fetchGrievances = useCallback(async () => {
    try {
      const { data } = await API.get('/grievances');
      setGrievances(data.grievances);
    } catch (err) {
      toast.error('Failed to load grievances');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchGrievances(); }, [fetchGrievances]);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return fetchGrievances();
    try {
      const { data } = await API.get(`/grievances/search?title=${searchQuery}`);
      setGrievances(data.grievances);
      toast.info(`Found ${data.count} result(s)`);
    } catch (err) {
      toast.error('Search failed');
    }
  };

  const handleSave = (grievance, action) => {
    if (action === 'create') setGrievances([grievance, ...grievances]);
    else setGrievances(grievances.map((g) => g._id === grievance._id ? grievance : g));
  };

  const handleDelete = async (id) => {
    try {
      await API.delete(`/grievances/${id}`);
      setGrievances(grievances.filter((g) => g._id !== id));
      toast.success('Grievance deleted');
      setDeleteConfirm(null);
    } catch (err) {
      toast.error('Delete failed');
    }
  };

  const handleLogout = () => {
    logout();
    toast.info('Logged out');
    navigate('/login');
  };

  const formatDate = (d) => new Date(d).toLocaleDateString('en-IN', {
    day: 'numeric', month: 'short', year: 'numeric'
  });

  return (
    <div className="dashboard">
      <nav className="navbar">
        <div className="navbar-brand">
          <div className="icon">📋</div>
          <div><h1>GrievanceHub</h1><span>Student Portal</span></div>
        </div>
        <div className="navbar-user">
          <div className="user-badge">
            <div className="user-avatar">{student?.name?.charAt(0).toUpperCase()}</div>
            <span style={{ fontSize: '0.85rem' }}>{student?.name}</span>
          </div>
          <button className="btn btn-danger btn-sm" onClick={handleLogout}>Logout</button>
        </div>
      </nav>

      <div className="dashboard-content">
        <div className="stats-row">
          <div className="stat-card">
            <div className="stat-number">{grievances.length}</div>
            <div className="stat-label">Total</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#f59e0b' }}>
              {grievances.filter(g => g.status === 'Pending').length}
            </div>
            <div className="stat-label">Pending</div>
          </div>
          <div className="stat-card">
            <div className="stat-number" style={{ color: '#22c55e' }}>
              {grievances.filter(g => g.status === 'Resolved').length}
            </div>
            <div className="stat-label">Resolved</div>
          </div>
        </div>

        <div className="dashboard-grid">
          <div className="card">
            <div className="card-title"><span className="dot"></span>Submit Grievance</div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '1rem' }}>
              Report an issue and track its resolution.
            </p>
            <button className="btn btn-primary"
              onClick={() => { setEditingGrievance(null); setShowModal(true); }}>
              + New Grievance
            </button>

            <hr style={{ border: 'none', borderTop: '1px solid var(--card-border)', margin: '1.5rem 0' }} />

            <div className="card-title"><span className="dot"></span>Search</div>
            <div className="search-bar">
              <input type="text" placeholder="Search by title..."
                value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={handleSearch}>
                🔍 Search
              </button>
              <button className="btn btn-secondary btn-sm"
                onClick={() => { setSearchQuery(''); fetchGrievances(); }}>
                ✕ Clear
              </button>
            </div>
          </div>

          <div className="card">
            <div className="card-title">
              <span className="dot"></span>My Grievances
              <span style={{ marginLeft: 'auto', fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                {grievances.length} records
              </span>
            </div>

            {loading ? (
              <div className="empty-state"><div className="empty-icon">⏳</div><p>Loading...</p></div>
            ) : grievances.length === 0 ? (
              <div className="empty-state"><div className="empty-icon">📭</div><p>No grievances yet!</p></div>
            ) : (
              <div className="grievance-list">
                {grievances.map((g) => (
                  <div key={g._id} className="grievance-item">
                    <div className="grievance-header">
                      <div className="grievance-title">{g.title}</div>
                      <div className="grievance-meta">
                        <span className={`badge badge-${g.status.toLowerCase()}`}>{g.status}</span>
                      </div>
                    </div>
                    <span className="badge badge-category"
                      style={{ marginBottom: '6px', display: 'inline-block' }}>
                      {g.category}
                    </span>
                    <p className="grievance-desc">{g.description}</p>
                    <p className="grievance-date">📅 {formatDate(g.date)}</p>
                    <div className="grievance-actions">
                      <button className="btn btn-secondary btn-sm"
                        onClick={() => { setEditingGrievance(g); setShowModal(true); }}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-danger btn-sm"
                        onClick={() => setDeleteConfirm(g._id)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {showModal && (
        <GrievanceModal
          grievance={editingGrievance}
          onClose={() => { setShowModal(false); setEditingGrievance(null); }}
          onSave={handleSave}
        />
      )}

      {deleteConfirm && (
        <div className="modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="modal" style={{ maxWidth: '380px' }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">🗑️ Confirm Delete</h3>
              <button className="modal-close" onClick={() => setDeleteConfirm(null)}>✕</button>
            </div>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              Are you sure? This cannot be undone.
            </p>
            <div className="modal-footer">
              <button className="btn btn-secondary" onClick={() => setDeleteConfirm(null)}>Cancel</button>
              <button className="btn btn-danger" onClick={() => handleDelete(deleteConfirm)}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;