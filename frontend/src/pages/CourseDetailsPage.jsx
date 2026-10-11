import { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import '../courses.css';

/**
 * Sample courses used for visual testing when backend is offline.
 * Matches the same sample catalog used in CoursesPage.jsx.
 */
const SAMPLE_COURSES = [
  {
    _id: 'sample-1',
    title: 'Full-Stack Web Development with MERN',
    description: 'Learn MongoDB, Express, React, and Node.js from scratch to build modern full-stack web applications with authentication and REST APIs.',
    instructor: 'Dr. Angela Yu',
    duration: '12 Weeks',
    price: 4999
  },
  {
    _id: 'sample-2',
    title: 'Data Structures & Algorithms Mastery',
    description: 'Comprehensive guide to mastering problem solving, trees, graphs, dynamic programming, and recursion in modern programming languages.',
    instructor: 'Prof. Abdul Bari',
    duration: '10 Weeks',
    price: 3499
  },
  {
    _id: 'sample-3',
    title: 'Python for Data Science & Machine Learning',
    description: 'Master NumPy, Pandas, Matplotlib, Scikit-Learn, and build real-world machine learning predictive models and neural networks.',
    instructor: 'Jose Portilla',
    duration: '8 Weeks',
    price: 2999
  },
  {
    _id: 'sample-4',
    title: 'Cloud Computing & DevOps Fundamentals',
    description: 'Hands-on practice with Docker, Kubernetes, CI/CD pipelines, container orchestration, and cloud deployment architectures.',
    instructor: 'Stephane Maarek',
    duration: '6 Weeks',
    price: 3999
  }
];

/**
 * CourseDetailsPage Component
 * Displays full course details fetched from GET /api/courses/:id
 * Handles loading, error, not found, and fallback visual testing states.
 */
export default function CourseDetailsPage() {
  const { id } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [isUsingSampleData, setIsUsingSampleData] = useState(false);

  const { API_BASE_URL: authApiUrl } = useAuth();
  const API_BASE_URL = authApiUrl || import.meta.env.VITE_API_URL || 'http://localhost:5001/api';

  useEffect(() => {
    let isMounted = true;

    axios
      .get(`${API_BASE_URL}/courses/${id}`)
      .then((res) => {
        if (!isMounted) return;

        // Backend returns: { success: true, course: { ... } }
        if (res.data?.success && res.data?.course) {
          setCourse(res.data.course);
          setError('');
          setIsUsingSampleData(false);
        } else if (res.data && (res.data._id || res.data.title)) {
          setCourse(res.data);
          setError('');
          setIsUsingSampleData(false);
        } else {
          setCourse(null);
          setError(res.data?.message || 'Course not found');
        }
      })
      .catch((err) => {
        if (!isMounted) return;

        // Backend returns 404 for missing course and 400 for invalid ID
        if (err.response?.status === 404) {
          setCourse(null);
          setError('Course not found');
        } else if (err.response?.status === 400) {
          setCourse(null);
          setError(err.response?.data?.message || 'Invalid course ID');
        } else {
          // Backend is offline or network error: check sample data for visual testing
          const sample = SAMPLE_COURSES.find((c) => c._id === id);
          if (sample) {
            setCourse(sample);
            setIsUsingSampleData(true);
            setError('');
          } else {
            setCourse(null);
            setError(
              err.response?.data?.message ||
                'Unable to load course details. Backend server may be offline.'
            );
          }
        }
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [id, API_BASE_URL]);

  // Loading state
  if (loading) {
    return (
      <div className="courses-page-container">
        <div className="courses-loading-state">
          <div className="spinner"></div>
          <p>Loading course details...</p>
        </div>
      </div>
    );
  }

  // Error or Not Found state
  if (error || !course) {
    return (
      <div className="courses-page-container">
        <div className="course-details-error-card">
          <span className="error-icon">🔍</span>
          <h2>{error === 'Course not found' ? 'Course Not Found' : 'Course Unavailable'}</h2>
          <p className="error-hint">
            {error || 'The course you are looking for does not exist or could not be loaded.'}
          </p>
          <div className="action-buttons">
            <Link to="/courses" className="btn btn-primary">
              &larr; Back to Courses
            </Link>
          </div>
        </div>
      </div>
    );
  }

  // Success state: display course details
  return (
    <div className="courses-page-container">
      {/* Navigation header with Back to Courses link */}
      <div className="course-details-nav">
        <Link to="/courses" className="back-link">
          &larr; Back to Courses
        </Link>
      </div>

      {/* Visual testing notice when backend is offline */}
      {isUsingSampleData && (
        <div className="courses-alert-banner" role="alert">
          <span className="banner-icon">⚠️</span>
          <div className="banner-content">
            <strong>Visual Testing Mode: Sample Course Displayed</strong>
            <p>
              Backend API at <code>{API_BASE_URL}/courses/{id}</code> is offline. Displaying
              sample course data for visual review.
            </p>
          </div>
        </div>
      )}

      {/* Detailed course card */}
      <div className="course-details-card">
        <div className="course-details-header">
          <div className="course-details-tags">
            <span className="course-category-tag">Course Details</span>
            <span className="course-duration-badge">⏱️ {course.duration || 'Self-paced'}</span>
          </div>

          <h1 className="course-details-title">{course.title}</h1>

          <div className="course-details-instructor">
            <span className="instructor-icon">👨‍🏫</span>
            <span className="instructor-text">
              Taught by <strong>{course.instructor || 'Instructor'}</strong>
            </span>
          </div>
        </div>

        <div className="course-details-body">
          <div className="course-details-section">
            <h3>Course Overview</h3>
            <p className="course-details-description">{course.description}</p>
          </div>

          {/* Quick info grid */}
          <div className="course-meta-grid">
            <div className="meta-box">
              <span className="meta-box-label">Duration</span>
              <span className="meta-box-value">⏱️ {course.duration}</span>
            </div>
            <div className="meta-box">
              <span className="meta-box-label">Instructor</span>
              <span className="meta-box-value">👨‍🏫 {course.instructor}</span>
            </div>
            <div className="meta-box">
              <span className="meta-box-label">Tuition Fee</span>
              <span className="meta-box-value price-accent">
                ₹{typeof course.price === 'number' ? course.price.toLocaleString('en-IN') : course.price}
              </span>
            </div>
          </div>
        </div>

        <div className="course-details-footer">
          <div className="course-price-container">
            <span className="course-price-label">Tuition Fee</span>
            <span className="course-price-value">
              ₹{typeof course.price === 'number' ? course.price.toLocaleString('en-IN') : course.price}
            </span>
          </div>

          <div className="course-details-actions">
            <Link to="/courses" className="btn btn-outline">
              &larr; Back to Courses
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
