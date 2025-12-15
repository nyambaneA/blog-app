import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../services/api'; // Changed from axios to api service
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

      // Using the api service instead of direct axios
      const response = await api.post('/blogs', blogData);

      if (response.data.success) {
        setSuccess('Blog created successfully!');
        // Show success message for 1.5 seconds then redirect
        setTimeout(() => {
          navigate('/admin');
        }, 1500);
      }
    } catch (error) {
      console.error('Create blog error:', error);
      
      // Better error handling
      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setError('Cannot connect to server. Please check your internet connection and try again.');
      } else if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
        setTimeout(() => {
          navigate('/login');
        }, 2000);
      } else if (error.response?.status === 400) {
        // Validation errors from backend
        if (error.response.data.errors) {
          const errorMessages = Object.values(error.response.data.errors)
            .map(err => err.message || err)
            .join(', ');
          setError(`Validation error: ${errorMessages}`);
        } else {
          setError(error.response.data.message || 'Invalid blog data. Please check your input.');
        }
      } else if (error.response?.status === 413) {
        setError('Blog content is too large. Please shorten the content.');
      } else {
        setError(error.response?.data?.message || 'Failed to create blog. Please try again.');
      }
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
        <h1 style={styles.title}>Create New Blog</h1>
        <button 
          onClick={() => navigate('/admin')}
          style={styles.backButton}
        >
          ← Back to Dashboard
        </button>
      </div>

      {error && (
        <div style={styles.errorMessage}>
          <div style={styles.errorIcon}>⚠️</div>
          <div>
            <strong>Error:</strong> {error}
            <button 
              onClick={() => setError('')}
              style={styles.dismissButton}
            >
              Dismiss
            </button>
          </div>
        </div>
      )}
      
      {success && (
        <div style={styles.successMessage}>
          <div style={styles.successIcon}>✓</div>
          <div>
            <strong>Success!</strong> {success}
            <div style={styles.redirectNote}>
              Redirecting to dashboard...
            </div>
          </div>
        </div>
      )}

      <div style={styles.formContainer}>
        <BlogForm
          initialData={initialData}
          onSubmit={handleSubmit}
          loading={loading}
          submitText={loading ? "Creating..." : "Create Blog"}
          submitDisabled={loading}
        />
      </div>

      {/* Mobile-friendly hints */}
      <div style={styles.hints}>
        <h3 style={styles.hintsTitle}>💡 Tips for a great blog:</h3>
        <ul style={styles.hintsList}>
          <li>Keep introductions under 500 characters</li>
          <li>Use clear section headings</li>
          <li>Add examples to illustrate points</li>
          <li>Preview before publishing</li>
        </ul>
      </div>
    </div>
  );
};

const styles = {
  header: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '30px',
    paddingBottom: '15px',
    borderBottom: '2px solid #eee'
  },
  title: {
    fontSize: '2rem',
    color: '#333',
    margin: 0,
    fontWeight: '600'
  },
  backButton: {
    padding: '10px 20px',
    background: '#6c757d',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontSize: '16px',
    fontWeight: '500',
    transition: 'background 0.3s',
    display: 'flex',
    alignItems: 'center',
    gap: '8px'
  },
  backButtonHover: {
    background: '#545b62'
  },
  errorMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    background: '#f8d7da',
    color: '#721c24',
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '25px',
    border: '1px solid #f5c6cb'
  },
  successMessage: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '15px',
    background: '#d4edda',
    color: '#155724',
    padding: '15px 20px',
    borderRadius: '8px',
    marginBottom: '25px',
    border: '1px solid #c3e6cb'
  },
  errorIcon: {
    fontSize: '20px',
    flexShrink: 0
  },
  successIcon: {
    fontSize: '20px',
    flexShrink: 0,
    fontWeight: 'bold'
  },
  dismissButton: {
    marginLeft: '15px',
    padding: '5px 10px',
    background: 'transparent',
    color: '#721c24',
    border: '1px solid #721c24',
    borderRadius: '4px',
    cursor: 'pointer',
    fontSize: '12px'
  },
  redirectNote: {
    fontSize: '14px',
    color: '#0c5460',
    marginTop: '5px',
    fontStyle: 'italic'
  },
  formContainer: {
    background: 'white',
    borderRadius: '10px',
    padding: '30px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    marginBottom: '30px'
  },
  hints: {
    background: '#f8f9fa',
    borderRadius: '10px',
    padding: '20px',
    marginTop: '30px',
    border: '1px solid #e9ecef'
  },
  hintsTitle: {
    fontSize: '1.2rem',
    color: '#495057',
    marginBottom: '15px',
    display: 'flex',
    alignItems: 'center',
    gap: '10px'
  },
  hintsList: {
    margin: 0,
    paddingLeft: '20px',
    color: '#6c757d'
  },
  hintsListLi: {
    marginBottom: '8px',
    lineHeight: '1.5'
  }
};

// Add hover effects
document.addEventListener('DOMContentLoaded', () => {
  const styleSheet = document.styleSheets[0];
  styleSheet.insertRule(`
    button:hover {
      opacity: 0.9;
      transform: translateY(-1px);
    }
  `, styleSheet.cssRules.length);
  
  styleSheet.insertRule(`
    button:active {
      transform: translateY(0);
    }
  `, styleSheet.cssRules.length);
});

export default CreateBlog;