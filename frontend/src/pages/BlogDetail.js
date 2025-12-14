import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { format } from 'date-fns';

const BlogDetail = () => {
  const { id } = useParams();
  const [blog, setBlog] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchBlog();
  }, [id]);

  const fetchBlog = async () => {
    try {
      setLoading(true);
      const response = await axios.get(
        `${process.env.REACT_APP_API_URL}/blogs/${id}`
      );
      
      if (response.data.success) {
        setBlog(response.data.blog);
      }
    } catch (error) {
      console.error('Fetch blog error:', error);
      setError(error.response?.data?.message || 'Failed to load blog');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Loading blog...</div>;
  }

  if (error) {
    return (
      <div style={styles.errorContainer}>
        <div style={styles.error}>{error}</div>
        <Link to="/" className="btn">Back to Blogs</Link>
      </div>
    );
  }

  return (
    <article style={styles.article}>
      <header style={styles.header}>
        <Link to="/" style={styles.backLink}>← Back to Blogs</Link>
        <h1 style={styles.title}>{blog.title}</h1>
        
        <div style={styles.meta}>
          <span style={styles.date}>
            Published on {format(new Date(blog.publishedAt || blog.createdAt), 'MMMM dd, yyyy')}
          </span>
          <span style={styles.author}>By {blog.author?.email}</span>
        </div>
      </header>

      <div style={styles.introduction}>
        <p>{blog.introduction}</p>
      </div>

      <div style={styles.content}>
        {blog.sections.map((section, index) => (
          <section key={index} style={styles.section}>
            <h2 style={styles.sectionTitle}>{section.heading}</h2>
            <div style={styles.sectionContent}>
              <p>{section.content}</p>
              
              {section.examples && section.examples.length > 0 && (
                <div style={styles.examples}>
                  <h3 style={styles.examplesTitle}>Examples:</h3>
                  <ul style={styles.examplesList}>
                    {section.examples.map((example, exampleIndex) => (
                      <li key={exampleIndex} style={styles.example}>
                        {example}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </section>
        ))}
      </div>

      <div style={styles.footer}>
        <Link to="/" className="btn">View All Blogs</Link>
      </div>
    </article>
  );
};

const styles = {
  article: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px 0'
  },
  header: {
    marginBottom: '40px',
    textAlign: 'center'
  },
  backLink: {
    color: '#007bff',
    textDecoration: 'none',
    marginBottom: '20px',
    display: 'inline-block'
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '20px',
    color: '#333'
  },
  meta: {
    color: '#666',
    fontSize: '14px',
    display: 'flex',
    justifyContent: 'center',
    gap: '20px'
  },
  date: {
    fontStyle: 'italic'
  },
  introduction: {
    fontSize: '1.1rem',
    lineHeight: '1.8',
    color: '#444',
    marginBottom: '40px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px'
  },
  content: {
    marginBottom: '40px'
  },
  section: {
    marginBottom: '40px'
  },
  sectionTitle: {
    fontSize: '1.8rem',
    marginBottom: '15px',
    color: '#333',
    paddingBottom: '10px',
    borderBottom: '2px solid #eee'
  },
  sectionContent: {
    fontSize: '1rem',
    lineHeight: '1.7',
    color: '#444'
  },
  examples: {
    marginTop: '20px',
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '6px'
  },
  examplesTitle: {
    fontSize: '1.2rem',
    marginBottom: '10px',
    color: '#333'
  },
  examplesList: {
    paddingLeft: '20px'
  },
  example: {
    marginBottom: '8px',
    color: '#555'
  },
  footer: {
    textAlign: 'center',
    paddingTop: '40px',
    borderTop: '1px solid #eee'
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px 20px'
  },
  error: {
    color: '#dc3545',
    fontSize: '18px',
    marginBottom: '20px'
  }
};

export default BlogDetail;