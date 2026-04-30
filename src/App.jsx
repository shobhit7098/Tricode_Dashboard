import { useMemo, useState } from 'react'
import './App.css'

const STORAGE_KEYS = {
  users: 'leadflow-users',
  session: 'leadflow-session',
  leads: 'leadflow-leads',
}

const statusOptions = ['New', 'Contacted', 'Follow Up', 'Qualified', 'Closed']

const emptyLead = {
  name: '',
  contact: '',
  linkedin: '',
  status: 'New',
}

function readStorage(key, fallback) {
  try {
    const value = localStorage.getItem(key)
    return value ? JSON.parse(value) : fallback
  } catch {
    return fallback
  }
}

function writeStorage(key, value) {
  localStorage.setItem(key, JSON.stringify(value))
}

function App() {
  const [users, setUsers] = useState(() => readStorage(STORAGE_KEYS.users, []))
  const [session, setSession] = useState(() =>
    readStorage(STORAGE_KEYS.session, null),
  )
  const [leads, setLeads] = useState(() => readStorage(STORAGE_KEYS.leads, []))
  const [authMode, setAuthMode] = useState('login')
  const [authForm, setAuthForm] = useState({ name: '', email: '', password: '' })
  const [leadForm, setLeadForm] = useState(emptyLead)
  const [message, setMessage] = useState('')
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')

  const currentUser = users.find((user) => user.email === session?.email)

  const userLeads = useMemo(() => {
    return leads.filter((lead) => lead.owner === currentUser?.email)
  }, [currentUser?.email, leads])

  const filteredLeads = useMemo(() => {
    const query = searchTerm.trim().toLowerCase()

    return userLeads.filter((lead) => {
      const matchesSearch =
        !query ||
        [lead.name, lead.contact, lead.linkedin, lead.status].some((field) =>
          field.toLowerCase().includes(query),
        )
      const matchesStatus = statusFilter === 'All' || lead.status === statusFilter

      return matchesSearch && matchesStatus
    })
  }, [searchTerm, statusFilter, userLeads])

  const leadStats = useMemo(() => {
    return statusOptions.map((status) => ({
      status,
      total: userLeads.filter((lead) => lead.status === status).length,
    }))
  }, [userLeads])

  function updateAuthField(event) {
    setMessage('')
    setAuthForm((form) => ({
      ...form,
      [event.target.name]: event.target.value,
    }))
  }

  function updateLeadField(event) {
    setMessage('')
    setLeadForm((form) => ({
      ...form,
      [event.target.name]: event.target.value,
    }))
  }

  function handleAuthSubmit(event) {
    event.preventDefault()
    const email = authForm.email.trim().toLowerCase()
    const password = authForm.password.trim()

    if (!email || !password || (authMode === 'signup' && !authForm.name.trim())) {
      setMessage('Please saari details fill karo.')
      return
    }

    const existingUser = users.find((user) => user.email === email)

    if (authMode === 'signup') {
      if (existingUser) {
        setMessage('Is email se account already bana hua hai.')
        return
      }

      const nextUsers = [
        ...users,
        {
          name: authForm.name.trim(),
          email,
          password,
        },
      ]

      setUsers(nextUsers)
      writeStorage(STORAGE_KEYS.users, nextUsers)
      setSession({ email })
      writeStorage(STORAGE_KEYS.session, { email })
      setMessage('Account ready hai. Ab leads add karo.')
      return
    }

    if (!existingUser || existingUser.password !== password) {
      setMessage('Email ya password galat hai.')
      return
    }

    setSession({ email })
    writeStorage(STORAGE_KEYS.session, { email })
    setMessage('Welcome back. Dashboard open ho gaya.')
  }

  function handleLeadSubmit(event) {
    event.preventDefault()

    if (!leadForm.name.trim() || !leadForm.contact.trim()) {
      setMessage('Lead ka name aur contact info required hai.')
      return
    }

    const nextLead = {
      id: crypto.randomUUID(),
      owner: currentUser.email,
      name: leadForm.name.trim(),
      contact: leadForm.contact.trim(),
      linkedin: leadForm.linkedin.trim(),
      status: leadForm.status,
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
    }

    const nextLeads = [nextLead, ...leads]
    setLeads(nextLeads)
    writeStorage(STORAGE_KEYS.leads, nextLeads)
    setLeadForm(emptyLead)
    setMessage('Lead add ho gayi.')
  }

  function updateLeadStatus(id, status) {
    const nextLeads = leads.map((lead) =>
      lead.id === id ? { ...lead, status } : lead,
    )
    setLeads(nextLeads)
    writeStorage(STORAGE_KEYS.leads, nextLeads)
  }

  function deleteLead(id) {
    const nextLeads = leads.filter((lead) => lead.id !== id)
    setLeads(nextLeads)
    writeStorage(STORAGE_KEYS.leads, nextLeads)
  }

  function logout() {
    setSession(null)
    localStorage.removeItem(STORAGE_KEYS.session)
    setMessage('')
  }

  if (!currentUser) {
    return (
      <main className="auth-shell">
        <section className="brand-panel">
          <span className="eyebrow">LeadFlow CRM</span>
          <h1>Login karo, leads sambhalo, follow-up miss mat hone do.</h1>
          <p>
            Name, contact info, LinkedIn URL aur status ke saath saari leads ek
            clean dashboard me manage karo.
          </p>
          <div className="brand-card">
            <strong>Fast setup</strong>
            <span>No backend needed for demo. Data browser me save hota hai.</span>
          </div>
        </section>

        <section className="auth-card">
          <div className="toggle-group" aria-label="Choose login or signup">
            <button
              className={authMode === 'login' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('login')}
            >
              Login
            </button>
            <button
              className={authMode === 'signup' ? 'active' : ''}
              type="button"
              onClick={() => setAuthMode('signup')}
            >
              Sign Up
            </button>
          </div>

          <form onSubmit={handleAuthSubmit}>
            <h2>{authMode === 'login' ? 'Welcome back' : 'Create account'}</h2>
            <p className="muted">
              {authMode === 'login'
                ? 'Apna email aur password enter karo.'
                : 'Ek quick account banao aur dashboard start karo.'}
            </p>

            {authMode === 'signup' && (
              <label>
                Full Name
                <input
                  name="name"
                  onChange={updateAuthField}
                  placeholder="Rahul Sharma"
                  type="text"
                  value={authForm.name}
                />
              </label>
            )}

            <label>
              Email
              <input
                name="email"
                onChange={updateAuthField}
                placeholder="you@example.com"
                type="email"
                value={authForm.email}
              />
            </label>

            <label>
              Password
              <input
                name="password"
                onChange={updateAuthField}
                placeholder="Minimum 4 characters"
                type="password"
                value={authForm.password}
              />
            </label>

            {message && <p className="notice">{message}</p>}

            <button className="primary-btn" type="submit">
              {authMode === 'login' ? 'Login Now' : 'Create Account'}
            </button>
          </form>
        </section>
      </main>
    )
  }

  return (
    <main className="dashboard-shell">
      <header className="topbar">
        <div>
          <span className="eyebrow">LeadFlow CRM</span>
          <h1>Hi {currentUser.name}, aaj ki pipeline ready hai.</h1>
        </div>
        <button className="ghost-btn" type="button" onClick={logout}>
          Logout
        </button>
      </header>

      <section className="stats-grid" aria-label="Lead status summary">
        {leadStats.map((item) => (
          <article className="stat-card" key={item.status}>
            <span>{item.status}</span>
            <strong>{item.total}</strong>
          </article>
        ))}
      </section>

      <section className="workspace">
        <form className="lead-form" onSubmit={handleLeadSubmit}>
          <div>
            <span className="eyebrow">New Lead</span>
            <h2>Add lead details</h2>
          </div>

          <label>
            Name
            <input
              name="name"
              onChange={updateLeadField}
              placeholder="Lead ka naam"
              type="text"
              value={leadForm.name}
            />
          </label>

          <label>
            Contact Info
            <input
              name="contact"
              onChange={updateLeadField}
              placeholder="Phone ya email"
              type="text"
              value={leadForm.contact}
            />
          </label>

          <label>
            LinkedIn URL
            <input
              name="linkedin"
              onChange={updateLeadField}
              placeholder="https://linkedin.com/in/username"
              type="url"
              value={leadForm.linkedin}
            />
          </label>

          <label>
            Status
            <select
              name="status"
              onChange={updateLeadField}
              value={leadForm.status}
            >
              {statusOptions.map((status) => (
                <option key={status}>{status}</option>
              ))}
            </select>
          </label>

          {message && <p className="notice">{message}</p>}

          <button className="primary-btn" type="submit">
            Add Lead
          </button>
        </form>

        <section className="lead-board">
          <div className="board-header">
            <div>
              <span className="eyebrow">Pipeline</span>
              <h2>{userLeads.length} leads saved</h2>
            </div>
            <div className="filters">
              <input
                onChange={(event) => setSearchTerm(event.target.value)}
                placeholder="Search leads"
                type="search"
                value={searchTerm}
              />
              <select
                onChange={(event) => setStatusFilter(event.target.value)}
                value={statusFilter}
              >
                <option>All</option>
                {statusOptions.map((status) => (
                  <option key={status}>{status}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="lead-list">
            {filteredLeads.length === 0 ? (
              <div className="empty-state">
                <strong>No leads yet</strong>
                <span>Pehli lead add karo, table yahin show hogi.</span>
              </div>
            ) : (
              filteredLeads.map((lead) => (
                <article className="lead-card" key={lead.id}>
                  <div>
                    <h3>{lead.name}</h3>
                    <p>{lead.contact}</p>
                    {lead.linkedin ? (
                      <a href={lead.linkedin} rel="noreferrer" target="_blank">
                        LinkedIn profile
                      </a>
                    ) : (
                      <span className="muted">LinkedIn URL not added</span>
                    )}
                  </div>
                  <div className="lead-actions">
                    <span className="date">{lead.createdAt}</span>
                    <select
                      onChange={(event) =>
                        updateLeadStatus(lead.id, event.target.value)
                      }
                      value={lead.status}
                    >
                      {statusOptions.map((status) => (
                        <option key={status}>{status}</option>
                      ))}
                    </select>
                    <button type="button" onClick={() => deleteLead(lead.id)}>
                      Delete
                    </button>
                  </div>
                </article>
              ))
            )}
          </div>
        </section>
      </section>
    </main>
  )
}

export default App
