import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [deletingId, setDeletingId] = useState(null);
  const [updatingId, setUpdatingId] = useState(null);
  const [stats, setStats] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      const [blogsResponse, statsResponse] = await Promise.all([
        api.get('/blogs/admin/all'),
        api.get('/blogs/admin/stats')
      ]);
      
      if (blogsResponse.data.success) {
        setBlogs(blogsResponse.data.blogs);
      }
      
      if (statsResponse.data.success) {
        setStats(statsResponse.data.stats);
      }
    } catch (error) {
      console.error('Fetch admin blogs error:', error);
      
      // Enhanced error handling
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setError('Cannot connect to server. Please check your internet connection and try again.');
      } else if (error.response?.status === 401) {
        navigate('/login', { 
          state: { 
            message: 'Your session has expired. Please login again.',
            redirectTo: '/admin/dashboard'
          } 
        });
      } else if (error.response?.status === 403) {
        setError('You do not have permission to access the admin dashboard.');
      } else if (error.response?.status === 404) {
        setError('Admin endpoint not found. Please contact support.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(error.response?.data?.message || 'Failed to load blogs');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete "${title}"? This action cannot be undone.`)) {
      return;
    }

    try {
      setDeletingId(id);
      setError('');
      setSuccessMessage('');
      
      const response = await api.delete(`/blogs/${id}`);
      
      if (response.data.success) {
        setSuccessMessage(`"${title}" has been deleted successfully.`);
        setBlogs(blogs.filter(blog => blog._id !== id));
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Delete blog error:', error);
      
      if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection and try again.');
      } else if (error.response?.status === 404) {
        setError('Blog not found. It may have already been deleted.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to delete this blog.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(error.response?.data?.message || 'Failed to delete blog');
      }
    } finally {
      setDeletingId(null);
    }
  };

  const handlePublishToggle = async (blog) => {
    try {
      setUpdatingId(blog._id);
      setError('');
      setSuccessMessage('');
      
      const response = await api.put(`/blogs/${blog._id}`, {
        ...blog,
        isPublished: !blog.isPublished
      });
      
      if (response.data.success) {
        const action = !blog.isPublished ? 'published' : 'unpublished';
        setSuccessMessage(`"${blog.title}" has been ${action} successfully.`);
        
        // Update local state
        setBlogs(blogs.map(b => 
          b._id === blog._id 
            ? { ...b, isPublished: !b.isPublished }
            : b
        ));
        
        // Clear success message after 5 seconds
        setTimeout(() => setSuccessMessage(''), 5000);
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
      
      if (error.code === 'ERR_NETWORK') {
        setError('Network error. Please check your connection and try again.');
      } else if (error.response?.status === 400) {
        setError('Validation error. Please check the blog data.');
      } else if (error.response?.status === 403) {
        setError('You do not have permission to update this blog.');
      } else {
        setError(error.response?.data?.message || 'Failed to update blog');
      }
    } finally {
      setUpdatingId(null);
    }
  };

  const handleExportCSV = () => {
    const headers = ['Title', 'Status', 'Created At', 'Updated At', 'Views', 'Author'];
    const csvData = blogs.map(blog => [
      `"${blog.title}"`,
      blog.isPublished ? 'Published' : 'Draft',
      format(new Date(blog.createdAt), 'yyyy-MM-dd'),
      format(new Date(blog.updatedAt), 'yyyy-MM-dd'),
      blog.views || 0,
      blog.author?.email || 'Unknown'
    ]);
    
    const csvContent = [
      headers.join(','),
      ...csvData.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blogs_export_${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setSuccessMessage('CSV export started successfully.');
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const clearError = () => {
    setError('');
  };

  const clearSuccess = () => {
    setSuccessMessage('');
  };

  if (loading) {
    return (
      <div style={styles.loadingContainer}>
        <div style={styles.loadingSpinner}></div>
        <div style={styles.loadingText}>Loading dashboard...</div>
        <div style={styles.loadingHint}>Fetching your blog statistics and content</div>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      <div style={styles.header}>
        <div style={styles.headerContent}>
          <h1 style={styles.title}>📊 Admin Dashboard</h1>
          <p style={styles.subtitle}>Manage your blog content and view analytics</p>
        </div>
        <div style={styles.headerActions}>
          <Link to="/admin/create" style={styles.createButton}>
            <span style={styles.buttonIcon}>+</span>
            Create New Blog
          </Link>
          {blogs.length > 0 && (
            <button onClick={handleExportCSV} style={styles.exportButton}>
              <span style={styles.buttonIcon}>📥</span>
              Export CSV
            </button>
          )}
        </div>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div style={styles.statsGrid}>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📝</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{stats.totalBlogs}</div>
              <div style={styles.statLabel}>Total Blogs</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📢</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{stats.publishedBlogs}</div>
              <div style={styles.statLabel}>Published</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>📄</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{stats.draftBlogs}</div>
              <div style={styles.statLabel}>Drafts</div>
            </div>
          </div>
          <div style={styles.statCard}>
            <div style={styles.statIcon}>👁️</div>
            <div style={styles.statContent}>
              <div style={styles.statValue}>{stats.totalViews}</div>
              <div style={styles.statLabel}>Total Views</div>
            </div>
          </div>
        </div>
      )}

      {/* Messages */}
      {error && (
        <div style={styles.errorBanner}>
          <span style={styles.errorText}>{error}</span>
          <button onClick={clearError} style={styles.dismissButton}>×</button>
        </div>
      )}

      {successMessage && (
        <div style={styles.successBanner}>
          <span style={styles.successText}>{successMessage}</span>
          <button onClick={clearSuccess} style={styles.dismissButton}>×</button>
        </div>
      )}

      {/* Blogs Table */}
      {blogs.length === 0 ? (
        <div style={styles.emptyState}>
          <div style={styles.emptyIcon}>📝</div>
          <h3 style={styles.emptyTitle}>No blogs yet</h3>
          <p style={styles.emptyText}>Start creating amazing content for your readers</p>
          <Link to="/admin/create" style={styles.createButton}>
            <span style={styles.buttonIcon}>+</span>
            Create Your First Blog
          </Link>
        </div>
      ) : (
        <div style={styles.tableWrapper}>
          <div style={styles.tableHeader}>
            <h3 style={styles.tableTitle}>
              Your Blogs ({blogs.length} total)
              <span style={styles.tableSubtitle}>
                • {blogs.filter(b => b.isPublished).length} published
                • {blogs.filter(b => !b.isPublished).length} drafts
              </span>
            </h3>
            <div style={styles.tableActions}>
              <button onClick={fetchBlogs} style={styles.refreshButton}>
                <span style={styles.buttonIcon}>🔄</span>
                Refresh
              </button>
            </div>
          </div>
          
          <div style={styles.tableContainer}>
            <table style={styles.table}>
              <thead>
                <tr>
                  <th style={styles.th}>Title</th>
                  <th style={styles.th}>Status</th>
                  <th style={styles.th}>Created</th>
                  <th style={styles.th}>Views</th>
                  <th style={styles.th}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {blogs.map(blog => (
                  <tr key={blog._id} style={styles.tr}>
                    <td style={styles.td}>
                      <div style={styles.titleWrapper}>
                        <Link to={`/blogs/${blog._id}`} style={styles.blogLink}>
                          {blog.title}
                        </Link>
                        {blog.featured && (
                          <span style={styles.featuredBadge}>⭐ Featured</span>
                        )}
                      </div>
                      <div style={styles.authorText}>
                        By {blog.author?.name || blog.author?.email || 'Unknown'}
                      </div>
                    </td>
                    <td style={styles.td}>
                      <span style={{
                        ...styles.statusBadge,
                        ...(blog.isPublished ? styles.publishedBadge : styles.draftBadge)
                      }}>
                        {blog.isPublished ? '📢 Published' : '📄 Draft'}
                      </span>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.dateWrapper}>
                        <div style={styles.datePrimary}>
                          {format(new Date(blog.createdAt), 'MMM dd, yyyy')}
                        </div>
                        <div style={styles.dateSecondary}>
                          {format(new Date(blog.createdAt), 'hh:mm a')}
                        </div>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.viewsWrapper}>
                        <span style={styles.viewsCount}>{blog.views || 0}</span>
                        <span style={styles.viewsLabel}>views</span>
                      </div>
                    </td>
                    <td style={styles.td}>
                      <div style={styles.actionsWrapper}>
                        <button
                          onClick={() => handlePublishToggle(blog)}
                          disabled={updatingId === blog._id}
                          style={{
                            ...styles.actionButton,
                            ...(blog.isPublished ? styles.unpublishButton : styles.publishButton),
                            ...(updatingId === blog._id && styles.buttonDisabled)
                          }}
                        >
                          {updatingId === blog._id ? (
                            <span style={styles.buttonSpinner}></span>
                          ) : blog.isPublished ? (
                            'Unpublish'
                          ) : (
                            'Publish'
                          )}
                        </button>
                        <Link
                          to={`/admin/edit/${blog._id}`}
                          style={styles.actionButton}
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(blog._id, blog.title)}
                          disabled={deletingId === blog._id}
                          style={{
                            ...styles.actionButton,
                            ...styles.deleteButton,
                            ...(deletingId === blog._id && styles.buttonDisabled)
                          }}
                        >
                          {deletingId === blog._id ? (
                            <span style={styles.buttonSpinner}></span>
                          ) : (
                            'Delete'
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

const styles = {
  container: {
    padding: '20px',
    maxWidth: '1400px',
    margin: '0 auto',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '400px',
    textAlign: 'center',
  },
  loadingSpinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px',
  },
  loadingText: {
    fontSize: '1.2rem',
    color: '#666',
    marginBottom: '8px',
  },
  loadingHint: {
    fontSize: '0.9rem',
    color: '#999',
    fontStyle: 'italic',
  },
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: '30px',
    flexWrap: 'wrap',
    gap: '20px',
  },
  headerContent: {
    flex: '1',
  },
  title: {
    fontSize: '2.2rem',
    marginBottom: '8px',
    color: '#1a1a1a',
    fontWeight: '700',
  },
  subtitle: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '0',
  },
  headerActions: {
    display: 'flex',
    gap: '12px',
    flexWrap: 'wrap',
  },
  createButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',
    gap: '8px',
  },
  exportButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '12px 20px',
    backgroundColor: '#28a745',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '8px',
    fontWeight: '600',
    fontSize: '0.95rem',
    transition: 'all 0.2s ease',
    border: 'none',
    cursor: 'pointer',
    gap: '8px',
  },
  buttonIcon: {
    fontSize: '1.1rem',
  },
  statsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
    gap: '20px',
    marginBottom: '30px',
  },
  statCard: {
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '24px',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
    display: 'flex',
    alignItems: 'center',
    gap: '16px',
    transition: 'transform 0.2s ease',
  },
  statIcon: {
    fontSize: '2.5rem',
    opacity: '0.8',
  },
  statContent: {
    flex: '1',
  },
  statValue: {
    fontSize: '2rem',
    fontWeight: '700',
    color: '#1a1a1a',
    lineHeight: '1',
    marginBottom: '4px',
  },
  statLabel: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '500',
  },
  errorBanner: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #f5c6cb',
  },
  successBanner: {
    backgroundColor: '#d4edda',
    color: '#155724',
    padding: '16px',
    borderRadius: '8px',
    marginBottom: '20px',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    border: '1px solid #c3e6cb',
  },
  errorText: {
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  successText: {
    fontSize: '0.95rem',
    fontWeight: '500',
  },
  dismissButton: {
    background: 'none',
    border: 'none',
    color: 'inherit',
    fontSize: '1.5rem',
    cursor: 'pointer',
    padding: '0',
    width: '24px',
    height: '24px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    opacity: '0.7',
    transition: 'opacity 0.2s ease',
  },
  emptyState: {
    textAlign: 'center',
    padding: '80px 20px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    marginTop: '40px',
  },
  emptyIcon: {
    fontSize: '4rem',
    marginBottom: '20px',
    opacity: '0.5',
  },
  emptyTitle: {
    fontSize: '1.8rem',
    color: '#333',
    marginBottom: '12px',
    fontWeight: '600',
  },
  emptyText: {
    fontSize: '1rem',
    color: '#666',
    marginBottom: '30px',
    maxWidth: '400px',
    marginLeft: 'auto',
    marginRight: 'auto',
  },
  tableWrapper: {
    backgroundColor: 'white',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
  },
  tableHeader: {
    padding: '20px 24px',
    borderBottom: '1px solid #e9ecef',
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '12px',
  },
  tableTitle: {
    fontSize: '1.3rem',
    color: '#333',
    margin: '0',
    fontWeight: '600',
  },
  tableSubtitle: {
    fontSize: '0.9rem',
    color: '#666',
    fontWeight: '400',
    marginLeft: '8px',
  },
  tableActions: {
    display: 'flex',
    gap: '8px',
  },
  refreshButton: {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 16px',
    backgroundColor: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontWeight: '500',
    fontSize: '0.9rem',
    cursor: 'pointer',
    gap: '6px',
    transition: 'all 0.2s ease',
  },
  tableContainer: {
    overflowX: 'auto',
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    minWidth: '800px',
  },
  th: {
    padding: '16px 24px',
    textAlign: 'left',
    borderBottom: '2px solid #e9ecef',
    fontWeight: '600',
    color: '#495057',
    fontSize: '0.9rem',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  tr: {
    borderBottom: '1px solid #e9ecef',
    transition: 'background-color 0.2s ease',
  },
  td: {
    padding: '20px 24px',
    verticalAlign: 'top',
  },
  titleWrapper: {
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    marginBottom: '4px',
    flexWrap: 'wrap',
  },
  blogLink: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '1rem',
    transition: 'color 0.2s ease',
    flex: '1',
    minWidth: '0',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
  },
  featuredBadge: {
    fontSize: '0.75rem',
    color: '#ffc107',
    backgroundColor: '#fff3cd',
    padding: '2px 8px',
    borderRadius: '12px',
    fontWeight: '500',
  },
  authorText: {
    fontSize: '0.85rem',
    color: '#666',
  },
  statusBadge: {
    display: 'inline-block',
    padding: '6px 12px',
    borderRadius: '20px',
    fontSize: '0.85rem',
    fontWeight: '500',
  },
  publishedBadge: {
    backgroundColor: '#d4edda',
    color: '#155724',
  },
  draftBadge: {
    backgroundColor: '#fff3cd',
    color: '#856404',
  },
  dateWrapper: {
    display: 'flex',
    flexDirection: 'column',
  },
  datePrimary: {
    fontSize: '0.95rem',
    color: '#333',
    fontWeight: '500',
  },
  dateSecondary: {
    fontSize: '0.8rem',
    color: '#999',
  },
  viewsWrapper: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  viewsCount: {
    fontSize: '1.2rem',
    fontWeight: '700',
    color: '#333',
  },
  viewsLabel: {
    fontSize: '0.8rem',
    color: '#999',
    textTransform: 'uppercase',
    letterSpacing: '0.5px',
  },
  actionsWrapper: {
    display: 'flex',
    gap: '8px',
    flexWrap: 'wrap',
  },
  actionButton: {
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '8px 16px',
    borderRadius: '6px',
    fontSize: '0.85rem',
    fontWeight: '500',
    textDecoration: 'none',
    cursor: 'pointer',
    border: 'none',
    transition: 'all 0.2s ease',
    minWidth: '80px',
    height: '36px',
  },
  publishButton: {
    backgroundColor: '#28a745',
    color: 'white',
  },
  unpublishButton: {
    backgroundColor: '#ffc107',
    color: '#212529',
  },
  deleteButton: {
    backgroundColor: '#dc3545',
    color: 'white',
  },
  buttonDisabled: {
    opacity: '0.6',
    cursor: 'not-allowed',
  },
  buttonSpinner: {
    width: '16px',
    height: '16px',
    border: '2px solid rgba(255,255,255,0.3)',
    borderTop: '2px solid white',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
  },
};

// CSS Animation for spinner
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

// Responsive styles
Object.assign(styles, {
  '@media (max-width: 768px)': {
    container: {
      padding: '15px',
    },
    header: {
      flexDirection: 'column',
      gap: '15px',
    },
    headerActions: {
      width: '100%',
      justifyContent: 'flex-start',
    },
    createButton: {
      flex: '1',
      justifyContent: 'center',
    },
    exportButton: {
      flex: '1',
      justifyContent: 'center',
    },
    statsGrid: {
      gridTemplateColumns: 'repeat(2, 1fr)',
      gap: '15px',
    },
    statCard: {
      padding: '20px',
      flexDirection: 'column',
      textAlign: 'center',
      gap: '12px',
    },
    tableHeader: {
      flexDirection: 'column',
      alignItems: 'stretch',
      gap: '15px',
    },
    tableActions: {
      justifyContent: 'flex-start',
    },
    td: {
      padding: '15px',
    },
    th: {
      padding: '15px',
    },
    actionsWrapper: {
      flexDirection: 'column',
      gap: '6px',
    },
    actionButton: {
      width: '100%',
    },
  },
  '@media (max-width: 480px)': {
    statsGrid: {
      gridTemplateColumns: '1fr',
    },
    title: {
      fontSize: '1.8rem',
    },
    blogLink: {
      fontSize: '0.9rem',
    },
  },
});

export default AdminDashboard;