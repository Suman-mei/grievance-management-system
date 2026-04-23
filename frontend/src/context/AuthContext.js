import React, { createContext, useState, useContext, useEffect } from 'react';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [student, setStudent] = useState(null);
  const [token, setToken] = useState(localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedStudent = localStorage.getItem('student');
    const storedToken = localStorage.getItem('token');
    if (storedStudent && storedToken) {
      setStudent(JSON.parse(storedStudent));
      setToken(storedToken);
    }
    setLoading(false);
  }, []);

  const login = (studentData, authToken) => {
    setStudent(studentData);
    setToken(authToken);
    localStorage.setItem('student', JSON.stringify(studentData));
    localStorage.setItem('token', authToken);
  };

  const logout = () => {
    setStudent(null);
    setToken(null);
    localStorage.removeItem('student');
    localStorage.removeItem('token');
  };

  return (
    <AuthContext.Provider value={{ student, token, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);