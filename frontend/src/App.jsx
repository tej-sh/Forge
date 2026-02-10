import { useState } from 'react'
import './App.css'
import Video from "./components/Video"
import ReactMarkdown from 'react-markdown'

const API_URL = 'http://localhost:8000'
// const API_URL = import.meta.env.VITE_API_URL


function App() {
  const [url, setUrl] = useState('')
  const [question, setQuestion] = useState('')
  const [messages, setMessages] = useState([])
  const [isLoaded, setIsLoaded] = useState(false)
  const [loading, setLoading] = useState(false)
  const [chatLoading, setChatLoading] = useState(false)
  const [error, setError] = useState('')
  const [showLanding, setShowLanding] = useState(true)
  const [showUrlInput, setShowUrlInput] = useState(false)
  const [newUrl, setNewUrl] = useState('')

  const handleChangeVideo = async () => {
    if (!showUrlInput) {
      setShowUrlInput(true)
      setNewUrl('')
      return
    }

    if (!newUrl.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: newUrl })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setUrl(newUrl)
        setMessages([])
        setShowUrlInput(false)
        setError('')
      } else {
        setError('Could not load video. Check the link or try another.')
      }
    } catch (err) {
      setError('Could not load video. Check the link or try another.')
    }

    setLoading(false)
  }

  const handleLoad = async () => {
    if (!url.trim()) {
      setError('Please enter a YouTube URL')
      return
    }

    setLoading(true)
    setError('')

    try {
      const response = await fetch(`${API_URL}/load`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url })
      })

      const data = await response.json()

      if (response.ok && data.success) {
        setIsLoaded(true)
        setShowLanding(false)
        setError('')
      } else {
        setError('Could not generate transcript. Please check the link or try another video.')
      }
    } catch (error) {
      setError('Could not generate transcript. Please check the link or try another video.')
    }

    setLoading(false)
  }

  const handleAsk = async () => {
    if (!question.trim()) return

    const userMessage = { role: 'user', text: question }
    setMessages(prev => [...prev, userMessage])
    setQuestion('')
    setChatLoading(true)

    try {
      const response = await fetch(`${API_URL}/qa`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, question })
      })

      const data = await response.json()

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', text: data.answer }])
      } else {
        setMessages(prev => [...prev, { role: 'error', text: data.detail || 'Error getting response' }])
      }
    } catch (error) {
      setMessages(prev => [...prev, { role: 'error', text: 'Network error. Please try again.' }])
    } finally {
      setChatLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      if (showLanding) {
        handleLoad()
      } else {
        handleAsk()
      }
    }
  }

  return (
    <div className="app">
      {showLanding && (
        <div className="landing-page">
          <h1>FORGE</h1>
          <p className="subtitle">YouTube AI Assistant</p>

          <div className="url-section">
            <input
              type="text"
              placeholder="Paste YouTube URL..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={loading}
            />
            <button onClick={handleLoad} disabled={loading}>
              {loading ? 'Loading Transcript...' : 'Load Video'}
            </button>
          </div>

          {error && <div className="error-message">{error}</div>}

          {loading && (
            <div className="loading-screen">
              <div className="spinner"></div>
              <p>Loading YouTube transcript...</p>
            </div>
          )}
        </div>
      )}

      {!showLanding && isLoaded && (
        <div className="chatvideo">
          <div className="header">
            <p className="cv-title">FORGE</p>
            {showUrlInput ? (
              <div className="header-url-input">
                <input
                  type="text"
                  placeholder="Paste new YouTube URL..."
                  value={newUrl}
                  onChange={(e) => setNewUrl(e.target.value)}
                  onKeyDown={(e) => { if (e.key === 'Enter') handleChangeVideo() }}
                  disabled={loading}
                  autoFocus
                />
                <button onClick={handleChangeVideo} disabled={loading}>
                  {loading ? 'Loading...' : 'Load'}
                </button>
                <button className="cancel-btn" onClick={() => { setShowUrlInput(false); setError('') }}>
                  Cancel
                </button>
              </div>
            ) : (
              <button className="change-video-btn" onClick={handleChangeVideo}>
                Change Video
              </button>
            )}
          </div>
          {error && !showLanding && <div className="header-error">{error}</div>}

          <div className="videochatblock">
            <Video url={url} />

            <div className="chatblock">
              <div className="chat-area">
                {messages.length === 0 ? (
                  <div className="chat-placeholder">
                    Ask me anything about this video!
                  </div>
                ) : (
                  messages.map((msg, i) => (
                    <div key={i} className={`message ${msg.role}`}>
                      <div className="message-content">
                        <ReactMarkdown>{msg.text}</ReactMarkdown>
                      </div>
                    </div>
                  ))
                )}

                {chatLoading && (
                  <div className="message assistant">
                    <div className="message-content">
                      <div className="chat-loading">
                        <span className="dot"></span>
                        <span className="dot"></span>
                        <span className="dot"></span>
                      </div>
                    </div>
                  </div>
                )}
              </div>

              <div className="question-section">
                <input
                  type="text"
                  placeholder="Ask a question..."
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={chatLoading}
                />
                <button onClick={handleAsk} disabled={!question.trim() || chatLoading}>
                  Ask
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default App