import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const AdminDashboard = () => {
  const [blogs, setBlogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlogs();
  }, []);

  const fetchBlogs = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/blogs/admin/all`
      );
      
      if (response.data.success) {
        setBlogs(response.data.blogs);
      }
    } catch (error) {
      console.error('Fetch admin blogs error:', error);
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this blog?')) {
      return;
    }

    try {
      const response = await axios.delete(
        `${process.env.REACT_APP_API_URL}/blogs/${id}`
      );
      
      if (response.data.success) {
        setBlogs(blogs.filter(blog => blog._id !== id));
      }
    } catch (error) {
      console.error('Delete blog error:', error);
      alert('Failed to delete blog');
    }
  };

  const handlePublishToggle = async (blog) => {
    try {
      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/blogs/${blog._id}`,
        {
          ...blog,
          isPublished: !blog.isPublished
        }
      );
      
      if (response.data.success) {
        fetchBlogs(); // Refresh the list
      }
    } catch (error) {
      console.error('Toggle publish error:', error);
      alert('Failed to update blog');
    }
  };

  if (loading) {
    return <div className="loading">Loading dashboard...</div>;
  }

  return (
    <div>
      <div style={styles.header}>
        <h1>Admin Dashboard</h1>
        <Link to="/admin/create" className="btn">Create New Blog</Link>
      </div>

      {error && (
        <div className="error" style={{ marginBottom: '20px' }}>{error}</div>
      )}

      {blogs.length === 0 ? (
        <div style={styles.noBlogs}>
          <p>No blogs created yet.</p>
          <Link to="/admin/create" className="btn">Create Your First Blog</Link>
        </div>
      ) : (
        <div style={styles.tableContainer}>
          <table style={styles.table}>
            <thead>
              <tr>
                <th>Title</th>
                <th>Status</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {blogs.map(blog => (
                <tr key={blog._id}>
                  <td style={styles.titleCell}>
                    <Link to={`/blogs/${blog._id}`} style={styles.blogLink}>
                      {blog.title}
                    </Link>
                  </td>
                  <td>
                    <span style={{
                      ...styles.status,
                      ...(blog.isPublished ? styles.published : styles.draft)
                    }}>
                      {blog.isPublished ? 'Published' : 'Draft'}
                    </span>
                  </td>
                  <td>
                    {format(new Date(blog.createdAt), 'MMM dd, yyyy')}
                  </td>
                  <td>
                    <div style={styles.actions}>
                      <button
                        onClick={() => handlePublishToggle(blog)}
                        style={{
                          ...styles.actionBtn,
                          ...(blog.isPublished ? styles.unpublishBtn : styles.publishBtn)
                        }}
                      >
                        {blog.isPublished ? 'Unpublish' : 'Publish'}
                      </button>
                      <Link
                        to={`/admin/edit/${blog._id}`}
                        style={{ ...styles.actionBtn, ...styles.editBtn }}
                      >
                        Edit
                      </Link>
                      <button
                        onClick={() => handleDelete(blog._id)}
                        style={{ ...styles.actionBtn, ...styles.deleteBtn }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px'
  },
  tableContainer: {
    overflowX: 'auto'
  },
  table: {
    width: '100%',
    borderCollapse: 'collapse',
    background: 'white'
  },
  titleCell: {
    maxWidth: '300px',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap'
  },
  blogLink: {
    color: '#007bff',
    textDecoration: 'none'
  },
  status: {
    padding: '4px 8px',
    borderRadius: '4px',
    fontSize: '12px',
    fontWeight: 'bold'
  },
  published: {
    background: '#d4edda',
    color: '#155724'
  },
  draft: {
    background: '#fff3cd',
    color: '#856404'
  },
  actions: {
    display: 'flex',
    gap: '8px'
  },
  actionBtn: {
    padding: '4px 8px',
    fontSize: '12px',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    textDecoration: 'none',
    transition: 'opacity 0.3s'
  },
  publishBtn: {
    background: '#28a745',
    color: 'white'
  },
  unpublishBtn: {
    background: '#ffc107',
    color: '#212529'
  },
  editBtn: {
    background: '#007bff',
    color: 'white'
  },
  deleteBtn: {
    background: '#dc3545',
    color: 'white'
  },
  noBlogs: {
    textAlign: 'center',
    padding: '60px 20px',
    background: '#f8f9fa',
    borderRadius: '8px'
  }
};

export default AdminDashboard;