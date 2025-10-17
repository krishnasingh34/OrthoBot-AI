import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import "../CSS/Auth.css";
import medAnimationVideo from "../assets/med_animation.mp4";

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { login, signup, isAuthenticated, isLoading: authLoading } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [errors, setErrors] = useState({});
  const [toast, setToast] = useState({ 
    show: false, 
    message: location.state?.message || '', 
    type: 'info' 
  });
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    password: "",
  });

  const validateEmail = (email) => {
    // Check if email contains "@" and "." with "." coming after "@"
    const atIndex = email.indexOf('@');
    const dotIndex = email.lastIndexOf('.');
    return atIndex > 0 && dotIndex > atIndex && dotIndex < email.length - 1;
  };

  const validatePassword = (password) => {
    // Password must be at least 8 characters long
    if (password.length < 8) return false;
    
    // Must have at least 1 uppercase letter
    if (!/[A-Z]/.test(password)) return false;
    
    // Must have at least 1 lowercase letter
    if (!/[a-z]/.test(password)) return false;
    
    // Must have at least 1 number
    if (!/\d/.test(password)) return false;
    
    // Must have at least 1 special character
    if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password)) return false;
    
    return true;
  };

  const validateForm = () => {
    const newErrors = {};

    if (!isLogin) {
      if (!formData.firstName.trim()) {
        newErrors.firstName = "First name is required";
      }
      if (!formData.lastName.trim()) {
        newErrors.lastName = "Last name is required";
      }
    }

    if (!formData.email.trim()) {
      newErrors.email = "Email is required";
    } else if (!validateEmail(formData.email)) {
      newErrors.email = "Email must contain '@' and '.' with '.' coming after '@'";
    }

    if (!formData.password) {
      newErrors.password = "Password is required";
    } else if (!validatePassword(formData.password)) {
      newErrors.password = "Password must be at least 8 characters long";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ""
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      return;
    }

    try {
      let result;
      
      if (isLogin) {
        result = await login({
          email: formData.email,
          password: formData.password
        });
      } else {
        result = await signup(formData);
      }
      
      // Show success toast
      const successMessage = isLogin ? 'Login successful!' : 'Account created successfully!';
      showToast(successMessage, 'success');
      
      // Get redirect URL from location state or query params
      const redirectTo = location.state?.returnUrl || searchParams.get('redirect') || '/';
      
      // Redirect after showing toast
      setTimeout(() => {
        navigate(redirectTo);
      }, 1500);
      
    } catch (error) {
      console.error("Authentication error:", error);
      
      // Handle different types of errors
      const errorMessage = error.message || 'An error occurred. Please try again.';
      
      if (errorMessage.toLowerCase().includes('email')) {
        setErrors({ email: errorMessage });
      } else if (errorMessage.toLowerCase().includes('password')) {
        setErrors({ password: errorMessage });
      } else if (errorMessage.toLowerCase().includes('user') && errorMessage.toLowerCase().includes('exist')) {
        setErrors({ email: 'User already exists with this email' });
      } else if (errorMessage.toLowerCase().includes('invalid')) {
        setErrors({ email: errorMessage });
      } else {
        // For other errors, show in email field as it's always visible
        setErrors({ email: errorMessage });
      }
    }
  };

  const toggleAuthMode = () => {
    setIsLogin(!isLogin);
    setFormData({
      firstName: "",
      lastName: "",
      email: "",
      password: "",
    });
    setErrors({});
    setShowPassword(false);
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => {
      setToast({ show: false, message: '', type: '' });
    }, 4000);
  };

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const redirectTo = searchParams.get('redirect') || '/';
      navigate(redirectTo);
    }
  }, [isAuthenticated, navigate, searchParams]);
  
  // Add body class for auth page to ensure full screen
  useEffect(() => {
    document.body.classList.add('auth-page');
    return () => {
      document.body.classList.remove('auth-page');
    };
  }, []);

  return (
    <div className="auth-container">
      <div className="auth-background">
        <video 
          className="auth-background-video"
          autoPlay 
          loop 
          muted 
          playsInline
        >
          <source src={medAnimationVideo} type="video/mp4" />
          Your browser does not support the video tag.
        </video>
        <div className="auth-gradient-overlay"></div>
      </div>

      {/* Toast Notification */}
      {toast.show && (
        <motion.div
          className={`auth-toast auth-toast-${toast.type}`}
          initial={{ opacity: 0, y: -50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -50, scale: 0.9 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="auth-toast-content">
            <svg className="auth-toast-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 12l2 2 4-4"></path>
              <circle cx="12" cy="12" r="10"></circle>
            </svg>
            <span className="auth-toast-message">{toast.message}</span>
          </div>
        </motion.div>
      )}
      
      <motion.div 
        className="auth-card"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
      >
        <div className="auth-header">
          <h1 className="auth-title">
            {isLogin ? "Login to Your Account" : "Create Your Account"}
          </h1>
          <p className="auth-subtitle">
            {isLogin 
              ? "Welcome back to OrthoBot AI - Your orthopedic health companion" 
              : "Join our OrthoBot AI community and start your journey to better orthopedic health"
            }
          </p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>

          {!isLogin && (
            <div className="auth-name-row">
              <div className="auth-input-group">
                <div className="auth-input-container">
                  <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First Name"
                    value={formData.firstName}
                    onChange={handleInputChange}
                    className={`auth-input ${errors.firstName ? 'auth-input-error' : ''}`}
                    disabled={authLoading}
                  />
                </div>
                {errors.firstName && (
                  <span className="auth-field-error">{errors.firstName}</span>
                )}
              </div>
              
              <div className="auth-input-group">
                <div className="auth-input-container">
                  <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last Name"
                    value={formData.lastName}
                    onChange={handleInputChange}
                    className={`auth-input ${errors.lastName ? 'auth-input-error' : ''}`}
                    disabled={authLoading}
                  />
                </div>
                {errors.lastName && (
                  <span className="auth-field-error">{errors.lastName}</span>
                )}
              </div>
            </div>
          )}

          <div className="auth-input-group">
            <div className="auth-input-container">
              <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"></path>
                <polyline points="22,6 12,13 2,6"></polyline>
              </svg>
              <input
                type="email"
                name="email"
                placeholder="Email Address"
                value={formData.email}
                onChange={handleInputChange}
                className={`auth-input ${errors.email ? 'auth-input-error' : ''}`}
                disabled={authLoading}
              />
            </div>
            {errors.email && (
              <span className="auth-field-error">{errors.email}</span>
            )}
          </div>

          <div className="auth-input-group">
            <div className="auth-input-container">
              <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect>
                <circle cx="12" cy="16" r="1"></circle>
                <path d="M7 11V7a5 5 0 0 1 10 0v4"></path>
              </svg>
              <input
                type={showPassword ? "text" : "password"}
                name="password"
                placeholder="Password"
                value={formData.password}
                onChange={handleInputChange}
                className={`auth-input ${errors.password ? 'auth-input-error' : ''}`}
                disabled={authLoading}
              />
              <button
                type="button"
                className="auth-password-toggle"
                onClick={togglePasswordVisibility}
                disabled={authLoading}
              >
                {showPassword ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                    <line x1="1" y1="1" x2="23" y2="23"></line>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                    <circle cx="12" cy="12" r="3"></circle>
                  </svg>
                )}
              </button>
            </div>
            {errors.password && (
              <span className="auth-field-error">{errors.password}</span>
            )}
          </div>

          <motion.button
            type="submit"
            className="auth-submit-btn"
            whileHover={!authLoading ? { scale: 1.02 } : {}}
            whileTap={!authLoading ? { scale: 0.98 } : {}}
            disabled={authLoading}
          >
            {authLoading ? (
              <div className="auth-loading">
                <div className="auth-spinner"></div>
                {isLogin ? "Signing In..." : "Creating Account..."}
              </div>
            ) : (
              isLogin ? "Login" : "Sign Up"
            )}
          </motion.button>
        </form>

        <div className="auth-switch">
          <p>
            {isLogin ? "Don't have an account? " : "Already have an account? "}
            <button 
              type="button" 
              className="auth-switch-btn"
              onClick={toggleAuthMode}
            >
              {isLogin ? "Sign Up" : "Login"}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;
