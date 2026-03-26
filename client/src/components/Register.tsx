import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Users, ShieldCheck, Mail, Lock, User, Briefcase, ChevronRight, Loader2, ArrowLeft, Sparkles } from 'lucide-react';
import { NavLink, useNavigate } from 'react-router-dom';

// 1. INTERFACES (Added to eliminate TypeScript "any" errors)
interface RoleButtonProps {
  title: string;
  desc: string;
  icon: React.ReactNode;
  onClick: () => void;
  color: string;
}

interface FormInputProps {
  icon: React.ReactNode;
  placeholder: string;
  type: string;
  value: string;
  onChange: (value: string) => void;
}

// 2. STYLES & INTERFACE COMPONENTS
const inputStyle: React.CSSProperties = {
  width: '100%',
  padding: '14px 16px 14px 52px',
  border: '1px solid rgba(255,255,255,0.1)',
  borderRadius: '14px',
  background: 'rgba(255,255,255,0.03)',
  color: '#fff',
  fontSize: '0.95rem',
  outline: 'none',
  transition: 'border-color 0.3s ease'
};

const RoleButton: React.FC<RoleButtonProps> = ({ title, desc, icon, onClick, color }) => (
  <motion.button 
    whileHover={{ scale: 1.03, borderColor: color, background: 'rgba(255,255,255,0.04)' }}
    onClick={onClick} 
    style={{ display: 'flex', alignItems: 'center', gap: '1.5rem', width: '100%', padding: '1.5rem', textAlign: 'left', background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: '20px', cursor: 'pointer', transition: 'border-color 0.3s ease' }}
  >
    <div style={{ padding: '14px', background: color.startsWith('var') ? `rgba(99, 102, 241, 0.1)` : `${color}1A`, borderRadius: '16px', border: color.startsWith('var') ? `1px solid rgba(99, 102, 241, 0.2)` : `1px solid ${color}33` }}>
      {icon}
    </div>
    <div style={{ flex: 1 }}>
      <div style={{ fontWeight: 800, fontSize: '1.2rem', color: '#fff', marginBottom: '4px' }}>{title}</div>
      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', lineHeight: 1.3 }}>{desc}</div>
    </div>
    <ChevronRight size={22} className="text-muted" />
  </motion.button>
);

const FormInput: React.FC<FormInputProps> = ({ icon, placeholder, type, value, onChange }) => (
  <div style={{ position: 'relative' }}>
    <div style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>
      {icon}
    </div>
    <input 
      type={type} 
      placeholder={placeholder} 
      required 
      value={value} 
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.value)} 
      style={inputStyle} 
    />
  </div>
);

// 3. MAIN REGISTER COMPONENT
const Register: React.FC = () => {
  const [role, setRole] = useState<'agent' | 'supervisor' | null>(null);
  const [formData, setFormData] = useState({ name: '', email: '', password: '', companyName: '', tenantSlug: '' });
  const [tenants, setTenants] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    if (role === 'agent') {
      fetch('/auth/tenants')
        .then(r => r.ok ? r.json() : [])
        .then(d => setTenants(Array.isArray(d) ? d : []))
        .catch(() => setTenants([]));
    }
  }, [role]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    const endpoint = role === 'supervisor' ? '/auth/signup-boss' : '/auth/signup-agent';
    
    try {
      const resp = await fetch(`${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      
      const data = await resp.json().catch(() => ({ error: 'Error del servidor central' }));
      if (!resp.ok) throw new Error(data.error || 'Error al registrarse');
      
      alert(data.message);
      navigate('/login');
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-deep)', padding: '1rem', backgroundImage: 'radial-gradient(circle at 50% 50%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)' }}>
      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="premium-card" 
        style={{ width: '100%', maxWidth: '520px', padding: '3.5rem 2.5rem', background: 'rgba(28, 28, 30, 0.8)', backdropFilter: 'blur(16px)', border: '1px solid rgba(255,255,255,0.05)', boxShadow: '0 20px 50px rgba(0,0,0,0.4)' }}
      >
        <AnimatePresence mode="wait">
          {!role ? (
            <motion.div 
              key="role-select"
              initial={{ x: -30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <div style={{ textAlign: 'center', marginBottom: '3.5rem' }}>
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.2 }} style={{ display: 'inline-block', padding: '8px 16px', background: 'rgba(99, 102, 241, 0.1)', borderRadius: '20px', border: '1px solid rgba(99, 102, 241, 0.2)', marginBottom: '1rem' }}>
                    <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--accent-primary)', letterSpacing: '0.1em' }}><Sparkles size={12} style={{ marginRight: 6 }} /> REGISTRO INTELIGENTE</span>
                </motion.div>
                <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.02em', lineHeight: 1.1 }}>¿Cómo usarás Stat-IQ?</h1>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', marginTop: '1rem' }}>Desbloquea el poder de la IA en tus llamadas</p>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <RoleButton 
                  title="Soy un Jefe / CEO" 
                  desc="Quiero crear mi empresa y supervisar agentes" 
                  icon={<ShieldCheck size={28} color="var(--accent-primary)" />} 
                  onClick={() => setRole('supervisor')} 
                  color="var(--accent-primary)"
                />

                <RoleButton 
                  title="Soy un Vendedor" 
                  desc="Quiero unirme a una empresa y grabar llamadas" 
                  icon={<Users size={28} color="#f43f5e" />} 
                  onClick={() => setRole('agent')} 
                  color="#f43f5e"
                />
              </div>
              
              <div style={{ textAlign: 'center', marginTop: '3.5rem' }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
                  ¿Ya eres usuario? <NavLink to="/login" style={{ color: 'var(--accent-primary)', textDecoration: 'none', fontWeight: 700, borderBottom: '1px solid transparent' }}>Iniciar Sesión</NavLink>
                </p>
              </div>
            </motion.div>
          ) : (
            <motion.div 
              key="auth-form"
              initial={{ x: 30, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -30, opacity: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 30 }}
            >
              <button 
                onClick={() => setRole(null)} 
                style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'none', color: 'var(--text-muted)', fontSize: '0.85rem', fontWeight: 600, marginBottom: '2.5rem', border: 'none', cursor: 'pointer', outline: 'none' }}
              >
                <ArrowLeft size={16} /> VOLVER A SELECCIÓN
              </button>

              <div style={{ marginBottom: '2.5rem' }}>
                <h2 className="text-gradient" style={{ fontSize: '1.8rem', fontWeight: 800 }}>
                  {role === 'supervisor' ? 'Crea tu Cuenta de Empresa' : 'Únete como Vendedor'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '0.5rem' }}>Completa los campos para activar tu acceso SaaS</p>
              </div>

              <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                <FormInput icon={<User size={20} />} placeholder="Nombre completo" type="text" value={formData.name} onChange={(v: string) => setFormData(prev => ({ ...prev, name: v }))} />
                <FormInput icon={<Mail size={20} />} placeholder="Email corporativo" type="email" value={formData.email} onChange={(v: string) => setFormData(prev => ({ ...prev, email: v }))} />
                <FormInput icon={<Lock size={20} />} placeholder="Contraseña de acceso" type="password" value={formData.password} onChange={(v: string) => setFormData(prev => ({ ...prev, password: v }))} />

                {role === 'supervisor' ? (
                  <FormInput icon={<Briefcase size={20} />} placeholder="Nombre de tu organización" type="text" value={formData.companyName} onChange={(v: string) => setFormData(prev => ({ ...prev, companyName: v }))} />
                ) : (
                  <div style={{ position: 'relative' }}>
                    <Briefcase size={20} style={{ position: 'absolute', left: '16px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
                    <select 
                      required 
                      value={formData.tenantSlug} 
                      onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFormData(prev => ({ ...prev, tenantSlug: e.target.value }))} 
                      style={{ ...inputStyle, paddingLeft: '52px', appearance: 'none', cursor: 'pointer' }}
                    >
                      <option value="">Selecciona tu empresa...</option>
                      {Array.isArray(tenants) && tenants.map(t => <option key={t.slug} value={t.slug} style={{ color: '#000' }}>{t.name}</option>)}
                    </select>
                  </div>
                )}

                {error && <div style={{ color: '#fff', fontSize: '0.8rem', background: 'rgba(244,63,94,0.2)', padding: '12px', borderRadius: '12px', border: '1px solid var(--accent-secondary)' }}>{error}</div>}

                <motion.button 
                  whileHover={{ scale: 1.02 }} 
                  whileTap={{ scale: 0.98 }}
                  type="submit" 
                  disabled={loading} 
                  style={{ width: '100%', padding: '16px', borderRadius: '14px', background: 'var(--accent-primary)', color: '#fff', fontWeight: 700, fontSize: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', marginTop: '1rem', border: 'none', cursor: 'pointer', boxShadow: '0 15px 30px -5px var(--accent-glow)' }}
                >
                  {loading ? <Loader2 className="spin" size={24} /> : 'ACTIVAR CUENTA AHORA'}
                </motion.button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
};

export default Register;
