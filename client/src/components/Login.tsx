import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, LogIn, Loader2, ShieldCheck } from 'lucide-react';
import { NavLink } from 'react-router-dom';
import { authService } from '../services/auth.service';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });

      const data = await response.json();

      if (!response.ok) throw new Error(data.error || 'Error al iniciar sesión');

      authService.setToken(data.token);
      authService.setUser(data.user);
      authService.setTenant(data.tenant);

      // Redirect based on role
      window.location.href = data.user.role === 'supervisor' ? '/supervisor' : '/';
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', padding: '1rem' }}>
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card" 
        style={{ width: '100%', maxWidth: '400px', padding: '2.5rem' }}
      >
        <div style={{ textAlign: 'center', marginBottom: '2.5rem' }}>
          <div style={{ background: 'rgba(99, 102, 241, 0.1)', width: '64px', height: '64px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <ShieldCheck size={32} color="var(--accent-primary)" />
          </div>
          <h1 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>Stat-IQ Access</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Bienvenido al centro de inteligencia SaaS</p>
        </div>

        <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
          <div style={{ position: 'relative' }}>
            <Mail size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="email" 
              placeholder="Email Corporativo"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 48px', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.9rem' }}
            />
          </div>

          <div style={{ position: 'relative' }}>
            <Lock size={18} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
            <input 
              type="password" 
              placeholder="Contraseña"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              style={{ width: '100%', padding: '12px 16px 12px 48px', border: '1px solid var(--glass-border)', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', color: '#fff', fontSize: '0.9rem' }}
            />
          </div>

          {error && <div style={{ color: 'var(--accent-secondary)', fontSize: '0.8rem', background: 'rgba(244,63,94,0.1)', padding: '10px', borderRadius: '8px', border: '1px solid rgba(244,63,94,0.2)' }}>{error}</div>}

          <button 
            type="submit" 
            disabled={loading}
            style={{ width: '100%', padding: '14px', borderRadius: '12px', background: 'var(--accent-primary)', color: '#fff', fontWeight: 600, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', boxShadow: '0 10px 20px -5px var(--accent-glow)' }}
          >
            {loading ? <Loader2 className="spin" size={20} /> : <><LogIn size={18} /> ENTRAR AL SISTEMA</>}
          </button>
        </form>

        <p style={{ textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2rem' }}>
          ¿Sin cuenta? <NavLink to="/register" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 600 }}>Crea una empresa gratis</NavLink>
        </p>

        <p style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '1.5rem' }}>
          Seguridad SaaS Multi-tenant Nivel Profesional
        </p>
      </motion.div>
    </div>
  );
};

export default Login;
