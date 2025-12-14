import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import BlogForm from '../components/BlogForm';

const EditBlog = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/blogs/admin/all`
      );
      
      if (response.data.success) {
        const foundBlog = response.data.blogs.find(b => b._id === id);
        if (foundBlog) {
          setBlog(foundBlog);
        } else {
          setError('Blog not found');
        }
      }
    } catch (error) {
      console.error('Fetch blog error:', error);
      setError('Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (blogData) => {
    try {
      setSubmitting(true);
      setError('');
      setSuccess('');

      const response = await axios.put(
        `${process.env.REACT_APP_API_URL}/blogs/${id}`,
        blogData
      );

      if (response.data.success) {
        setSuccess('Blog updated successfully!');
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      }
    } catch (error) {
      console.error('Update blog error:', error);
      setError(error.response?.data?.message || 'Failed to update blog');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading blog...</div>;
  }

  if (error && !blog) {
    return (
      <div style={styles.errorContainer}>
        <div className="error">{error}</div>
        <button 
          onClick={() => navigate('/admin')}
          className="btn"
          style={{ marginTop: '20px' }}
        >
          Back to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div>
      <div style={styles.header}>
        <h1>Edit Blog</h1>
        <button 
          onClick={() => navigate('/admin')}
          className="btn btn-secondary"
        >
          Back to Dashboard
        </button>
      </div>

      {error && (
        <div className="error" style={styles.message}>{error}</div>
      )}
      
      {success && (
        <div className="success" style={styles.message}>{success}</div>
      )}

      <BlogForm
        initialData={blog}
        onSubmit={handleSubmit}
        loading={submitting}
        submitText="Update Blog"
      />
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
  message: {
    marginBottom: '20px',
    padding: '10px',
    borderRadius: '4px'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px 20px'
  }
};

export default EditBlog;