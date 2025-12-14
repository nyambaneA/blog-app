import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const { isAuthenticated, admin, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <header style={styles.header}>
      <div className="container" style={styles.container}>
        <Link to="/" style={styles.logo}>
          BlogApp
        </Link>
        
        <nav style={styles.nav}>
          <Link to="/" style={styles.navLink}>Home</Link>
          
          {isAuthenticated ? (
            <>
              <Link to="/admin" style={styles.navLink}>Dashboard</Link>
              <Link to="/admin/create" style={styles.navLink}>Create Blog</Link>
              <span style={styles.welcome}>Welcome, {admin?.email}</span>
              <button onClick={handleLogout} style={styles.logoutBtn}>
                Logout
              </button>
            </>
          ) : (
            <Link to="/login" style={styles.navLink}>Admin Login</Link>
          )}
        </nav>
      </div>
    </header>
  );
};

const styles = {
  header: {
    backgroundColor: '#333',
    color: 'white',
    padding: '1rem 0',
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
    boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
  },
  container: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  logo: {
    fontSize: '1.5rem',
    fontWeight: 'bold',
    color: 'white',
    textDecoration: 'none'
  },
  nav: {
    display: 'flex',
    alignItems: 'center',
    gap: '20px'
  },
  navLink: {
    color: 'white',
    textDecoration: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    transition: 'background 0.3s'
  },
  welcome: {
    marginLeft: '10px',
    color: '#ddd'
  },
  logoutBtn: {
    background: '#dc3545',
    color: 'white',
    border: 'none',
    padding: '5px 10px',
    borderRadius: '4px',
    cursor: 'pointer',
    transition: 'background 0.3s'
  }
};

export default Header;