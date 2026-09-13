import { useState, useEffect } from 'react'
import CartCounter from './components/CartCounter'
import './App.css'

export default function App() {
  const [backendStatus, setBackendStatus] = useState({
    loading: true,
    online: false,
    latencyMs: null,
    data: null,
    error: null,
  })

  // Function to test connectivity to FastAPI backend
  const checkBackendHealth = async () => {
    setBackendStatus((prev) => ({ ...prev, loading: true, error: null }))
    const startTime = performance.now()
    try {
      const response = await fetch('http://127.0.0.1:8000/api/health')
      const latencyMs = Math.round(performance.now() - startTime)
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      setBackendStatus({
        loading: false,
        online: true,
        latencyMs,
        data,
        error: null,
      })
    } catch (err) {
      setBackendStatus({
        loading: false,
        online: false,
        latencyMs: null,
        data: null,
        error: err.message || 'Failed to connect to FastAPI backend',
      })
    }
  }

  // Automatically check health when component mounts
  useEffect(() => {
    checkBackendHealth()
  }, [])

  return (
    <div className="container">
      {/* Top Navbar */}
      <header className="navbar">
        <div className="brand">
          <span className="brand-text">Pr</span>
          <span className="brand-accent">Amazon</span>
        </div>
        <div className="badge-phase">Phase 1: Foundation Active</div>
      </header>

      {/* Hero Section */}
      <section className="hero">
        <h1 className="hero-title">PrAmazon Architecture Setup</h1>
        <p className="hero-desc">
          Building a full-stack e-commerce platform step by step with FastAPI, React, and SQLAlchemy.
        </p>
      </section>

      {/* 3 Foundation Pillars */}
      <section className="status-grid">
        {/* Frontend Card */}
        <div className="status-card">
          <div className="card-header">
            <span className="card-title">🌐 Frontend</span>
            <span className="pill-status pill-online">
              <span className="dot dot-pulse"></span> Running
            </span>
          </div>
          <p className="card-detail">React 18/19 Single Page App powered by Vite HMR.</p>
          <span className="tech-tag">Port: 5173 (Vite Dev Server)</span>
        </div>

        {/* Backend Card */}
        <div className="status-card">
          <div className="card-header">
            <span className="card-title">⚡ Backend API</span>
            {backendStatus.loading ? (
              <span className="pill-status pill-checking">
                <span className="dot dot-pulse"></span> Checking...
              </span>
            ) : backendStatus.online ? (
              <span className="pill-status pill-online">
                <span className="dot dot-pulse"></span> Online ({backendStatus.latencyMs}ms)
              </span>
            ) : (
              <span className="pill-status pill-offline">
                <span className="dot"></span> Offline
              </span>
            )}
          </div>
          <p className="card-detail">FastAPI REST Server with CORS and interactive Swagger documentation.</p>
          <span className="tech-tag">Port: 8000 (Uvicorn)</span>
        </div>

        {/* Database Card */}
        <div className="status-card">
          <div className="card-header">
            <span className="card-title">🗄️ Database</span>
            <span className="pill-status pill-online">
              <span className="dot dot-pulse"></span> Ready
            </span>
          </div>
          <p className="card-detail">SQLAlchemy ORM configured with SQLite for zero-friction local development.</p>
          <span className="tech-tag">Target: SQLite &rarr; PostgreSQL</span>
        </div>
      </section>

      {/* Handshake Tester Box */}
      <section className="handshake-box">
        <div className="handshake-header">
          <div>
            <h2 className="handshake-title">Client-to-Server Handshake Test</h2>
            <p className="card-detail">
              Verifies CORS (Cross-Origin Resource Sharing) between React (:5173) and FastAPI (:8000).
            </p>
          </div>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <button
              className="btn-primary"
              onClick={checkBackendHealth}
              disabled={backendStatus.loading}
            >
              {backendStatus.loading ? 'Pinging...' : '🔄 Ping Backend'}
            </button>
            <a
              href="http://127.0.0.1:8000/docs"
              target="_blank"
              rel="noreferrer"
              className="btn-outline"
            >
              📖 Open Swagger Docs ↗
            </a>
          </div>
        </div>

        {/* Response viewer */}
        <div className="response-viewer">
          <div className="response-header">
            <span>GET /api/health Response</span>
            <span>
              {backendStatus.online
                ? `HTTP 200 OK • Latency: ${backendStatus.latencyMs}ms`
                : backendStatus.loading
                ? 'Request in flight...'
                : 'Connection Failed'}
            </span>
          </div>
          <pre className="response-pre">
            {backendStatus.loading
              ? '// Sending request to http://127.0.0.1:8000/api/health...'
              : backendStatus.online
              ? JSON.stringify(backendStatus.data, null, 2)
              : `// Error: ${backendStatus.error}\n// Make sure your FastAPI backend server is running!`}
          </pre>
        </div>
      </section>

      {/* Side Quest Mini Project: Interactive Cart Counter */}
      <CartCounter />

      {/* Educational Guide */}
      <section className="learning-guide">
        <h3>💡 What We Accomplished in Phase 1:</h3>
        <ol>
          <li>
            <strong>Decoupled Architecture:</strong> The user-facing React UI and the FastAPI server run as independent services. They communicate exclusively through JSON over HTTP.
          </li>
          <li>
            <strong>CORS Handshake:</strong> Browsers block cross-origin requests by default for security. We configured FastAPI's <code>CORSMiddleware</code> to allow requests from port 5173.
          </li>
          <li>
            <strong>Auto-generated Swagger:</strong> FastAPI automatically builds interactive documentation for every route at <code>/docs</code>.
          </li>
        </ol>
      </section>
    </div>
  )
}
