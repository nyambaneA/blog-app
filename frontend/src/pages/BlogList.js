import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
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
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/blogs?page=${page}&limit=6`
      );
      
      if (response.data.success) {
        setBlogs(response.data.blogs);
        setTotalPages(response.data.pages);
      }
    } catch (error) {
      console.error('Fetch blogs error:', error);
      setError('Failed to load blogs');
    } finally {
      setLoading(false);
    }
  };

  if (loading && blogs.length === 0) {
    return <div className="loading">Loading blogs...</div>;
  }

  if (error) {
    return <div className="error" style={{ textAlign: 'center', padding: '40px' }}>{error}</div>;
  }

  return (
    <div>
      <h1 style={styles.title}>Latest Blogs</h1>
      
      {blogs.length === 0 ? (
        <div style={styles.noBlogs}>
          <p>No blogs published yet.</p>
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
                <p style={styles.introduction}>{blog.introduction}</p>
                <div style={styles.footer}>
                  <span style={styles.date}>
                    {format(new Date(blog.publishedAt || blog.createdAt), 'MMM dd, yyyy')}
                  </span>
                  <Link to={`/blogs/${blog._id}`} style={styles.readMore}>
                    Read More →
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {totalPages > 1 && (
            <div style={styles.pagination}>
              <button 
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                style={styles.pageButton}
              >
                Previous
              </button>
              <span style={styles.pageInfo}>
                Page {page} of {totalPages}
              </span>
              <button 
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                style={styles.pageButton}
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
    color: '#333'
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
    flexDirection: 'column'
  },
  cardTitle: {
    fontSize: '1.5rem',
    marginBottom: '15px',
    color: '#333'
  },
  cardLink: {
    color: '#333',
    textDecoration: 'none',
    transition: 'color 0.3s'
  },
  introduction: {
    color: '#666',
    marginBottom: '20px',
    flex: 1
  },
  footer: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 'auto'
  },
  date: {
    color: '#888',
    fontSize: '14px'
  },
  readMore: {
    color: '#007bff',
    textDecoration: 'none',
    fontWeight: '500'
  },
  pagination: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    gap: '20px',
    marginTop: '40px'
  },
  pageButton: {
    padding: '8px 16px',
    background: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.3s'
  },
  pageInfo: {
    fontSize: '16px',
    color: '#666'
  },
  noBlogs: {
    textAlign: 'center',
    padding: '60px 20px',
    color: '#666',
    fontSize: '18px'
  }
};

export default BlogList;