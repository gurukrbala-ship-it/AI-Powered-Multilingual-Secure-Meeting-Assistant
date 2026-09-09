import { useEffect, useState } from 'react';
import { insightsAPI, aiAPI } from '../api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

const PRIORITY_COLORS = {
  critical: 'badge-danger',
  high: 'badge-warning',
  medium: 'badge-info',
  low: 'badge-success',
};

export default function ActionItemsPage() {
  const [actions, setActions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    insightsAPI.myActions()
      .then((r) => setActions(r.data || []))
      .catch(() => toast.error('Failed to load action items'))
      .finally(() => setLoading(false));
  }, []);

  const updateStatus = async (id, status) => {
    try {
      await aiAPI.updateAction(id, { status });
      setActions((prev) => prev.map((a) => a.id === id ? { ...a, status } : a));
      toast.success('Status updated');
    } catch {
      toast.error('Failed to update status');
    }
  };

  const filtered = filter === 'all' ? actions : actions.filter((a) => a.status === filter);

  const columns = ['pending', 'in_progress', 'completed'];
  const colLabels = { pending: 'Pending', in_progress: 'In Progress', completed: 'Completed' };
  const colColors = { pending: '#f59e0b', in_progress: '#1a56db', completed: '#10b981' };

  return (
    <div>
      <div className="page-header">
        <h1 className="page-title">Action Items</h1>
        <p className="page-subtitle">Tasks assigned to you across all meetings</p>
      </div>

      {/* Filter */}
      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {['all', 'pending', 'in_progress', 'completed'].map((s) => (
          <button
            key={s}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-outline'}`}
            onClick={() => setFilter(s)}
          >
            {s === 'all' ? 'All' : colLabels[s] || s} ({s === 'all' ? actions.length : actions.filter(a => a.status === s).length})
          </button>
        ))}
      </div>

      {loading ? (
        <div className="kanban-board">
          {columns.map((c) => (
            <div key={c} className="skeleton" style={{ height: 300 }} />
          ))}
        </div>
      ) : (
        <div className="kanban-board">
          {columns.map((col) => {
            const colActions = actions.filter((a) => a.status === col);
            return (
              <div key={col} className="kanban-column">
                <div className="kanban-column-header">
                  <div className="kanban-column-title" style={{ color: colColors[col] }}>
                    {colLabels[col]}
                  </div>
                  <span className="badge badge-muted" style={{ fontSize: 11 }}>{colActions.length}</span>
                </div>
                {colActions.length === 0 ? (
                  <div style={{ fontSize: 13, color: 'var(--text-muted)', textAlign: 'center', padding: '24px 0' }}>
                    No items
                  </div>
                ) : (
                  colActions.map((a) => (
                    <div
                      key={a.id}
                      className="card"
                      style={{ marginBottom: 10, padding: '14px 16px', boxShadow: 'var(--shadow-sm)' }}
                    >
                      <div style={{ fontWeight: 600, fontSize: 13.5, marginBottom: 8 }}>{a.task}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-muted)', marginBottom: 10, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        {a.deadline && <div>📅 Due: {a.deadline}</div>}
                        <span className={`badge ${PRIORITY_COLORS[a.priority] || 'badge-muted'}`} style={{ width: 'fit-content', fontSize: 10 }}>
                          {a.priority}
                        </span>
                      </div>
                      {col !== 'completed' && (
                        <div style={{ display: 'flex', gap: 6 }}>
                          {col === 'pending' && (
                            <button
                              className="btn btn-sm btn-primary"
                              style={{ fontSize: 11 }}
                              onClick={() => updateStatus(a.id, 'in_progress')}
                            >
                              Start →
                            </button>
                          )}
                          {col === 'in_progress' && (
                            <button
                              className="btn btn-sm btn-success"
                              style={{ fontSize: 11 }}
                              onClick={() => updateStatus(a.id, 'completed')}
                            >
                              ✓ Complete
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
