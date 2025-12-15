import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../services/api'; // Changed from axios to api service
import { format } from 'date-fns';

const BlogList = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    fetchBlogs();
  }, [page]);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Using the api service instead of direct axios
      const response = await api.get('/blogs', {
        params: { page: page, limit: 6 }
      });
      
      if (response.data.success) {
        setBlogs(response.data.blogs);
        setTotalPages(response.data.pages);
      }
    } catch (error) {
      console.error('Fetch blogs error:', error);
      
      // Better error handling with specific messages
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setError('Cannot connect to server. Please check your internet connection.');
      } else if (error.response?.status === 404) {
        setError('Blogs endpoint not found. Please check the API configuration.');
      } else {
        setError(error.response?.data?.message || 'Failed to load blogs');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading && blogs.length === 0) {
    return (
      <div className="loading" style={styles.loading}>
        <div style={styles.spinner}></div>
        <p>Loading blogs...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div className="error" style={styles.error}>{error}</div>
        <button 
          onClick={fetchBlogs}
          style={styles.retryButton}
        >
          Retry
        </button>
      </div>
    );
  }

  return (
    <div>
      <h1 style={styles.title}>Latest Blogs</h1>
      
      {blogs.length === 0 ? (
        <div style={styles.noBlogs}>
          <p>No blogs published yet.</p>
          <p style={styles.hint}>Create your first blog in the admin dashboard.</p>
        </div>
      ) : (
        <>
          <div style={styles.grid}>
            {blogs.map(blog => (
              <div key={blog._id} style={styles.card}>
                <h2 style={styles.cardTitle}>
                  <Link to={`/blogs/${blog._id}`} style={styles.cardLink}>
                    {blog.title}
                  </Link>
                </h2>
                <p style={styles.introduction}>
                  {blog.introduction.length > 150 
                    ? blog.introduction.substring(0, 150) + '...' 
                    : blog.introduction}
                </p>
                <div style={styles.footer}>
                  <span style={styles.date}>
                    {format(new Date(blog.publishedAt || blog.createdAt), 'MMM dd, yyyy')}
                  </span>
                  <div style={styles.actions}>
                    {blog.isPublished ? (
                      <span style={styles.publishedBadge}>Published</span>
                    ) : (
                      <span style={styles.draftBadge}>Draft</span>
                    )}
                    <Link to={`/blogs/${blog._id}`} style={styles.readMore}>
                      Read More →
                    </Link>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={{
                  ...styles.pageButton,
                  ...(page === 1 && styles.disabledButton)
                }}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={{
                  ...styles.pageButton,
                  ...(page === totalPages && styles.disabledButton)
                }}
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

const styles = {
  title: {
    marginBottom: '40px',
    textAlign: 'center',
    color: '#333',
    fontSize: '2.5rem',
    fontWeight: '300'
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(350px, 1fr))',
    gap: '30px',
    marginBottom: '40px'
  },
  card: {
    background: 'white',
    border: '1px solid #e1e1e1',
    borderRadius: '8px',
    padding: '25px',
    transition: 'transform 0.3s, box-shadow 0.3s',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  cardTitle: {
    fontSize: '1.5rem',
    marginBottom: '15px',
    color: '#333',
    lineHeight: '1.3'
  },
  cardLink: {
    color: '#333',
    textDecoration: 'none',
    transition: 'color 0.3s'
  },
  cardLinkHover: {
    color: '#007bff'
  },
  introduction: {
    color: '#666',
    marginBottom: '20px',
    flex: 1,
    lineHeight: '1.6'
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto',
    paddingTop: '15px',
    borderTop: '1px solid #eee'
  },
  actions: {
    display: 'flex',
    alignItems: 'center',
    gap: '15px'
  },
  date: {
    color: '#888',
    fontSize: '14px',
    fontStyle: 'italic'
  },
  readMore: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '500',
    fontSize: '14px'
  },
  publishedBadge: {
    background: '#d4edda',
    color: '#155724',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  draftBadge: {
    background: '#fff3cd',
    color: '#856404',
    padding: '2px 8px',
    borderRadius: '12px',
    fontSize: '12px',
    fontWeight: '600'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginTop: '40px',
    padding: '20px'
  },
  pageButton: {
    padding: '10px 20px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    transition: 'background 0.3s, transform 0.2s',
    fontSize: '16px',
    fontWeight: '500'
  },
  disabledButton: {
    background: '#ccc',
    cursor: 'not-allowed',
    transform: 'none'
  },
  pageInfo: {
    fontSize: '16px',
    color: '#666',
    fontWeight: '500'
  },
  noBlogs: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
    fontSize: '18px',
    background: '#f8f9fa',
    borderRadius: '10px'
  },
  hint: {
    fontSize: '14px',
    color: '#999',
    marginTop: '10px'
  },
  loading: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '60px 20px',
    textAlign: 'center'
  },
  spinner: {
    width: '40px',
    height: '40px',
    border: '4px solid #f3f3f3',
    borderTop: '4px solid #007bff',
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    marginBottom: '20px'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#f8d7da',
    borderRadius: '10px',
    margin: '20px'
  },
  error: {
    color: '#721c24',
    fontSize: '18px',
    marginBottom: '20px'
  },
  retryButton: {
    padding: '10px 25px',
    background: '#dc3545',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    transition: 'background 0.3s'
  }
};

// Add CSS animation
const styleSheet = document.styleSheets[0];
styleSheet.insertRule(`
  @keyframes spin {
    0% { transform: rotate(0deg); }
    100% { transform: rotate(360deg); }
  }
`, styleSheet.cssRules.length);

export default BlogList;