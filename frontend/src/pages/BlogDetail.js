// src/pages/BlogDetail.js
import React, { useState, useEffect, Fragment } from 'react';
import { useParams, Link } from 'react-router-dom';
import api from '../services/api';
import { format } from 'date-fns';
import AdSense from '../components/AdSense';
import { Helmet } from 'react-helmet-async';
import BlogPostSchema from '../components/BlogPostSchema';

// ⚠️ Replace with real slot IDs from your AdSense dashboard
const AD_SLOT_TOP = '1234567892';
const AD_SLOT_IN_ARTICLE = '1234567893';
const AD_SLOT_FOOTER = '1234567894';

const SITE_URL = 'https://www.lecturerroom.online';

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
      setError('');

      const response = await api.get(`/blogs/${id}`);

      if (response.data.success) {
        setBlog(response.data.blog);
      } else {
        setError('Failed to load blog data');
      }
    } catch (error) {
      console.error('Fetch blog error:', error);

      if (error.code === 'ERR_NETWORK' || error.message === 'Network Error') {
        setError(
          'Cannot connect to server. Please check your internet connection and try again.'
        );
      } else if (error.response?.status === 404) {
        setError('Blog not found. It may have been deleted or moved.');
      } else if (error.response?.status === 401) {
        setError('Your session has expired. Please login again.');
      } else if (error.response?.status === 400) {
        setError('Invalid request. Please try again.');
      } else if (error.response?.status === 500) {
        setError('Server error. Please try again later.');
      } else {
        setError(error.response?.data?.message || 'Failed to load blog');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRetry = () => {
    fetchBlog();
  };

  // ======================
  // Loading state
  // ======================
  if (loading) {
    return (
      <>
        <Helmet>
          <title>Loading... | Lecturer Room Blog</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div style={styles.loadingContainer}>
          <div style={styles.loading}>Loading blog...</div>
          <div style={styles.loadingHint}>
            Please wait while we fetch your content
          </div>
        </div>
      </>
    );
  }

  // ======================
  // Error state
  // ======================
  if (error || !blog) {
    return (
      <>
        <Helmet>
          <title>Blog not found | Lecturer Room Blog</title>
          <meta name="robots" content="noindex" />
        </Helmet>
        <div style={styles.errorContainer}>
          <div style={styles.errorIcon}>⚠️</div>
          <div style={styles.error}>{error || 'Blog not found'}</div>
          <div style={styles.errorButtons}>
            <button onClick={handleRetry} style={styles.retryButton}>
              Retry
            </button>
            <Link to="/" className="btn" style={styles.backButton}>
              Back to Blogs
            </Link>
          </div>
        </div>
      </>
    );
  }

  // ======================
  // Success state — blog is guaranteed non-null here
  // ======================
  const publishedDate =
    blog.publishedAt || blog.createdAt || new Date().toISOString();
  const updatedDate = blog.updatedAt || publishedDate;
  const metaDescription =
    blog.introduction?.substring(0, 155) ||
    `${blog.title} — read the full article on Lecturer Room Blog.`;
  const canonicalUrl = `${SITE_URL}/blogs/${id}`;
  const ogImage = `${SITE_URL}/og-image-${id}.jpg`;
  const authorName =
    blog.author?.name || blog.author?.email || 'Lecturer Room';

  return (
    <article style={styles.article}>
      {/* ====================== SEO: Dynamic <head> tags ====================== */}
      <Helmet>
        <title>{blog.title} | Lecturer Room Blog</title>
        <meta name="description" content={metaDescription} />
        <link rel="canonical" href={canonicalUrl} />

        {/* Open Graph (Facebook, LinkedIn, WhatsApp) */}
        <meta property="og:title" content={blog.title} />
        <meta property="og:description" content={metaDescription} />
        <meta property="og:type" content="article" />
        <meta property="og:url" content={canonicalUrl} />
        <meta property="og:image" content={ogImage} />
        <meta property="og:site_name" content="Lecturer Room Blog" />
        <meta
          property="article:published_time"
          content={new Date(publishedDate).toISOString()}
        />
        <meta
          property="article:modified_time"
          content={new Date(updatedDate).toISOString()}
        />
        <meta property="article:author" content={authorName} />
        {blog.tags?.map((tag, i) => (
          <meta key={i} property="article:tag" content={tag} />
        ))}

        {/* Twitter Card */}
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content={blog.title} />
        <meta name="twitter:description" content={metaDescription} />
        <meta name="twitter:image" content={ogImage} />
      </Helmet>

      {/* ====================== SEO: JSON-LD structured data ====================== */}
      <BlogPostSchema
        title={blog.title}
        description={metaDescription}
        slug={id}
        publishedAt={new Date(publishedDate).toISOString()}
        updatedAt={new Date(updatedDate).toISOString()}
        imageUrl={ogImage}
        author={blog.author}
        tags={blog.tags || []}
      />

      <header style={styles.header}>
        <div style={styles.headerTop}>
          <Link to="/" style={styles.backLink}>
            <span style={styles.backArrow}>←</span>
            <span style={styles.backText}>Back to Blogs</span>
          </Link>
          {updatedDate !== publishedDate && (
            <span style={styles.updatedBadge}>
              Updated {format(new Date(updatedDate), 'MMM dd')}
            </span>
          )}
        </div>

        <h1 style={styles.title}>{blog.title}</h1>

        <div style={styles.meta}>
          <span style={styles.date}>
            📅 Published on{' '}
            {format(new Date(publishedDate), 'MMMM dd, yyyy')}
          </span>
          <span style={styles.author}>👤 By {authorName}</span>
          {blog.readingTime && (
            <span style={styles.readingTime}>
              ⏱️ {blog.readingTime} min read
            </span>
          )}
        </div>

        {blog.tags && blog.tags.length > 0 && (
          <div style={styles.tags}>
            {blog.tags.map((tag, index) => (
              <span key={index} style={styles.tag}>
                #{tag}
              </span>
            ))}
          </div>
        )}
      </header>

      {/* ✅ Top ad — placed above content for max viewability */}
      <AdSense adSlot={AD_SLOT_TOP} adFormat="horizontal" />

      <div style={styles.introduction}>
        <p style={styles.introText}>{blog.introduction}</p>
      </div>

      <div style={styles.content}>
        {blog.sections &&
          blog.sections.map((section, index) => (
            <Fragment key={index}>
              <section style={styles.section}>
                <h2 style={styles.sectionTitle}>
                  <span style={styles.sectionNumber}>
                    {(index + 1).toString().padStart(2, '0')}
                  </span>
                  {section.heading}
                </h2>
                <div style={styles.sectionContent}>
                  <p>{section.content}</p>

                  {section.examples && section.examples.length > 0 && (
                    <div style={styles.examples}>
                      <h3 style={styles.examplesTitle}>
                        <span style={styles.exampleIcon}>💡</span>
                        Examples:
                      </h3>
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

              {/* ✅ In-article ad after every 2 sections */}
              {(index + 1) % 2 === 0 && (
                <AdSense adSlot={AD_SLOT_IN_ARTICLE} adFormat="fluid" />
              )}
            </Fragment>
          ))}
      </div>

      {blog.conclusion && (
        <div style={styles.conclusion}>
          <h2 style={styles.conclusionTitle}>Conclusion</h2>
          <p style={styles.conclusionText}>{blog.conclusion}</p>
        </div>
      )}

      {/* ✅ Footer ad before the CTA buttons */}
      <AdSense adSlot={AD_SLOT_FOOTER} adFormat="horizontal" />

      <div style={styles.footer}>
        <div style={styles.footerActions}>
          <Link to="/" style={styles.viewAllButton}>
            View All Blogs
          </Link>
          <button
            onClick={() =>
              window.scrollTo({ top: 0, behavior: 'smooth' })
            }
            style={styles.scrollTopButton}
          >
            ↑ Back to Top
          </button>
        </div>
      </div>
    </article>
  );
};

const styles = {
  article: {
    maxWidth: '800px',
    margin: '0 auto',
    padding: '20px',
    fontFamily:
      '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  loadingContainer: { textAlign: 'center', padding: '60px 20px' },
  loading: { fontSize: '1.2rem', color: '#666', marginBottom: '10px' },
  loadingHint: { fontSize: '0.9rem', color: '#999', fontStyle: 'italic' },
  header: { marginBottom: '40px' },
  headerTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '20px',
    flexWrap: 'wrap',
    gap: '10px',
  },
  backLink: {
    color: '#007bff',
    textDecoration: 'none',
    display: 'inline-flex',
    alignItems: 'center',
    padding: '8px 12px',
    borderRadius: '6px',
    transition: 'all 0.2s ease',
    backgroundColor: '#f8f9fa',
  },
  backArrow: { marginRight: '8px', fontSize: '1.2rem' },
  backText: { fontSize: '0.95rem' },
  updatedBadge: {
    fontSize: '0.8rem',
    color: '#28a745',
    backgroundColor: '#d4edda',
    padding: '4px 8px',
    borderRadius: '12px',
    fontWeight: '500',
  },
  title: {
    fontSize: '2.5rem',
    marginBottom: '20px',
    color: '#1a1a1a',
    lineHeight: '1.2',
    fontWeight: '700',
  },
  meta: {
    color: '#666',
    fontSize: '0.95rem',
    display: 'flex',
    flexWrap: 'wrap',
    gap: '20px',
    marginBottom: '15px',
  },
  date: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
  author: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
  readingTime: { display: 'inline-flex', alignItems: 'center', gap: '6px' },
  tags: { display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '15px' },
  tag: {
    fontSize: '0.85rem',
    color: '#007bff',
    backgroundColor: '#e7f1ff',
    padding: '4px 12px',
    borderRadius: '20px',
    fontWeight: '500',
  },
  introduction: {
    fontSize: '1.1rem',
    lineHeight: '1.8',
    color: '#444',
    marginBottom: '40px',
    padding: '25px',
    background: 'linear-gradient(135deg, #f8f9fa 0%, #f1f3f5 100%)',
    borderRadius: '12px',
    borderLeft: '4px solid #007bff',
  },
  introText: { margin: 0 },
  content: { marginBottom: '40px' },
  section: { marginBottom: '50px', scrollMarginTop: '20px' },
  sectionTitle: {
    fontSize: '1.8rem',
    marginBottom: '20px',
    color: '#333',
    paddingBottom: '15px',
    borderBottom: '2px solid #e9ecef',
    display: 'flex',
    alignItems: 'center',
    gap: '15px',
    fontWeight: '600',
  },
  sectionNumber: { color: '#007bff', fontSize: '1.5rem', opacity: '0.7' },
  sectionContent: { fontSize: '1.05rem', lineHeight: '1.8', color: '#444' },
  examples: {
    marginTop: '25px',
    padding: '20px',
    background: '#f8f9fa',
    borderRadius: '8px',
    borderLeft: '3px solid #28a745',
  },
  examplesTitle: {
    fontSize: '1.3rem',
    marginBottom: '15px',
    color: '#333',
    display: 'flex',
    alignItems: 'center',
    gap: '10px',
  },
  exampleIcon: { fontSize: '1.2rem' },
  examplesList: { paddingLeft: '20px' },
  example: { marginBottom: '10px', color: '#555', lineHeight: '1.6' },
  conclusion: {
    marginTop: '40px',
    padding: '30px',
    backgroundColor: '#f8f9fa',
    borderRadius: '12px',
    borderLeft: '4px solid #28a745',
  },
  conclusionTitle: { fontSize: '1.8rem', marginBottom: '20px', color: '#333' },
  conclusionText: {
    fontSize: '1.1rem',
    lineHeight: '1.8',
    color: '#444',
    margin: 0,
  },
  footer: {
    marginTop: '60px',
    paddingTop: '40px',
    borderTop: '1px solid #e9ecef',
  },
  footerActions: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: '20px',
  },
  viewAllButton: {
    display: 'inline-block',
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  scrollTopButton: {
    padding: '12px 24px',
    backgroundColor: '#f8f9fa',
    color: '#666',
    border: '1px solid #dee2e6',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  errorContainer: {
    textAlign: 'center',
    padding: '60px 20px',
    maxWidth: '600px',
    margin: '0 auto',
  },
  errorIcon: { fontSize: '3rem', marginBottom: '20px' },
  error: {
    color: '#dc3545',
    fontSize: '1.1rem',
    marginBottom: '30px',
    lineHeight: '1.6',
  },
  errorButtons: {
    display: 'flex',
    gap: '15px',
    justifyContent: 'center',
    flexWrap: 'wrap',
  },
  retryButton: {
    padding: '12px 24px',
    backgroundColor: '#007bff',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    cursor: 'pointer',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
  backButton: {
    padding: '12px 24px',
    backgroundColor: '#6c757d',
    color: 'white',
    textDecoration: 'none',
    borderRadius: '6px',
    fontWeight: '500',
    transition: 'all 0.2s ease',
  },
};

export default BlogDetail;