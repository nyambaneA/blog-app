import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [formError, setFormError] = useState('');
  const { login, error } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError('');

    if (!email || !password) {
      setFormError('Please fill in all fields');
      return;
    }

    const result = await login(email, password);
    if (result.success) {
      navigate('/admin');
    }
  };

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h2 style={styles.title}>Admin Login</h2>
        
        {(formError || error) && (
          <div style={styles.error}>{formError || error}</div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              className="form-control"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="password">Password</label>
            <input
              type="password"
              id="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          <button type="submit" className="btn" style={styles.button}>
            Login
          </button>
        </form>

        <div style={styles.info}>
          <p>Demo Credentials:</p>
          <p>Email: admin@blog.com</p>
          <p>Password: Admin@123</p>
        </div>

        <div style={styles.links}>
          <Link to="/">← Back to Blogs</Link>
        </div>
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 'calc(100vh - 200px)'
  },
  card: {
    background: 'white',
    padding: '40px',
    borderRadius: '8px',
    boxShadow: '0 4px 20px rgba(0,0,0,0.1)',
    width: '100%',
    maxWidth: '400px'
  },
  title: {
    marginBottom: '30px',
    textAlign: 'center',
    color: '#333'
  },
  error: {
    backgroundColor: '#f8d7da',
    color: '#721c24',
    padding: '10px',
    borderRadius: '4px',
    marginBottom: '20px',
    fontSize: '14px'
  },
  button: {
    width: '100%',
    padding: '12px'
  },
  info: {
    marginTop: '20px',
    padding: '15px',
    background: '#f8f9fa',
    borderRadius: '4px',
    fontSize: '14px',
    color: '#666'
  },
  links: {
    marginTop: '20px',
    textAlign: 'center'
  }
};

export default Login;