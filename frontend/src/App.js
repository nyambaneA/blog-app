import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Login from './pages/Login';
import BlogList from './pages/BlogList';
import BlogDetail from './pages/BlogDetail';
import AdminDashboard from './pages/AdminDashboard';
import CreateBlog from './pages/CreateBlog';
import EditBlog from './pages/EditBlog';
import Header from './components/Header';

function App() {
  return (
    <Router>
      <AuthProvider>
        <div className="App">
          <Header />
          <main className="container" style={{ paddingTop: '80px' }}>
            <Routes>
              <Route path="/" element={<BlogList />} />
              <Route path="/login" element={<Login />} />
              <Route path="/blogs/:id" element={<BlogDetail />} />
              <Route path="/admin" element={
                <PrivateRoute>
                  <AdminDashboard />
                </PrivateRoute>
              } />
              <Route path="/admin/create" element={
                <PrivateRoute>
                  <CreateBlog />
                </PrivateRoute>
              } />
              <Route path="/admin/edit/:id" element={
                <PrivateRoute>
                  <EditBlog />
                </PrivateRoute>
              } />
              <Route path="*" element={<Navigate to="/" />} />
            </Routes>
          </main>
        </div>
      </AuthProvider>
    </Router>
  );
}

export default App;