import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import BlogForm from '../components/BlogForm';

const CreateBlog = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const handleSubmit = async (blogData) => {
    try {
      setLoading(true);
      setError('');
      setSuccess('');

      const response = await axios.post(
        `${process.env.REACT_APP_API_URL}/blogs`,
        blogData
      );

      if (response.data.success) {
        setSuccess('Blog created successfully!');
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      }
    } catch (error) {
      console.error('Create blog error:', error);
      setError(error.response?.data?.message || 'Failed to create blog');
    } finally {
      setLoading(false);
    }
  };

  const initialData = {
    title: '',
    introduction: '',
    sections: [
      {
        heading: '',
        content: '',
        examples: ['']
      }
    ],
    isPublished: false
  };

  return (
    <div>
      <div style={styles.header}>
        <h1>Create New Blog</h1>
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
        initialData={initialData}
        onSubmit={handleSubmit}
        loading={loading}
        submitText="Create Blog"
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
  }
};

export default CreateBlog;