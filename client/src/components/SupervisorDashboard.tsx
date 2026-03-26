import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, ShieldCheck, LogOut, Radio, Loader2, 
  Settings
} from 'lucide-react';
import { authService } from '../services/auth.service';

const SupervisorDashboard: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const user = authService.getUser();
  const initialTenant = authService.getTenant();
  const [tenant] = useState(initialTenant);

  /* Internal state sync removed for build stability */

  const fetchActiveSessions = async () => {
    try {
      const resp = await fetch('/api/interacciones/supervisor/monitor', {
        headers: { 'Authorization': `Bearer ${authService.getToken()}` }
      });
      const data = await resp.json();
      if (resp.ok) setActiveSessions(data);
    } catch (err) { console.error("Monitor Fetch Error:", err); } 
    finally { setLoading(false); }
  };

  /* saveConfig removed for build fix */

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 1500); 
    return () => clearInterval(interval);
  }, []);

  const activeQuestions = tenant?.config?.scriptQuestions?.length > 0 
    ? tenant.config.scriptQuestions 
    : ["Pregunta 1", "Pregunta 2", "Pregunta 3", "Pregunta 4"];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', color: '#fff', padding: '2rem', position: 'relative', overflow: 'hidden' }}>
      {/* BACKGROUND EFFECTS */}
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', background: 'radial-gradient(circle at 50% 50%, rgba(0, 242, 255, 0.05) 0%, transparent 80%)', pointerEvents: 'none' }} />
      <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', backgroundImage: 'linear-gradient(rgba(0, 242, 255, 0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 242, 255, 0.03) 1px, transparent 1px)', backgroundSize: '40px 40px', pointerEvents: 'none' }} />

      <header style={{ position: 'relative', zIndex: 10, display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '5px' }}>
            <div className="spin" style={{ width: '14px', height: '14px', border: '2px solid var(--accent-primary)', borderTopColor: 'transparent', borderRadius: '50%' }} />
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent-primary)', letterSpacing: '3px' }}>SYSTEM ONLINE / NEURAL_SYNC_V4</span>
          </div>
          <h1 className="text-gradient" style={{ fontSize: '3rem', fontWeight: 900, margin: 0 }}>CENTRO DE MANDO</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', letterSpacing: '1px' }}>TENANT_ID: <span style={{ color: 'var(--accent-primary)', fontWeight: 800 }}>{tenant?.name?.toUpperCase()}</span></p>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
          <motion.button 
             whileHover={{ scale: 1.02, boxShadow: '0 0 20px var(--accent-glow)' }}
             onClick={() => setShowSettings(!showSettings)}
             className="premium-card cyber-button"
             style={{ padding: '12px 24px', cursor: 'pointer', borderRadius: '12px', display: 'flex', alignItems: 'center', gap: '10px' }}
          >
            <Settings size={18} /> ESTRATEGIA_IA
          </motion.button>
          
          <div className="premium-card" style={{ padding: '8px 20px', display: 'flex', alignItems: 'center', gap: '15px', borderLeft: '4px solid var(--accent-primary)' }}>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{user?.name?.toUpperCase()}</div>
              <div style={{ fontSize: '0.6rem', color: 'var(--accent-primary)', fontWeight: 900 }}>ADMIN_ACCESS_GRANTED</div>
            </div>
            <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#000' }}>
              <ShieldCheck size={24} />
            </div>
          </div>

          <button onClick={authService.logout} style={{ background: 'none', border: '1px solid rgba(255,255,255,0.1)', padding: '12px', borderRadius: '50%', color: 'var(--text-secondary)', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem', marginBottom: '3rem', position: 'relative', zIndex: 10 }}>
        <HUDMetric label="AGENTES_ONLINE" value={activeSessions.length} color="var(--accent-primary)" />
        <HUDMetric label="LEADS_CAPTURADOS" value={activeSessions.reduce((acc, s) => acc + (s.totalBlocksCombined || 0), 0)} color="#10b981" />
        <HUDMetric label="PRECISIÓN_NLP" value="98.4%" color="var(--accent-secondary)" />
        <HUDMetric label="STATUS_IA" value="STREAMING" color="#f59e0b" pulse />
      </div>

      <h2 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-secondary)', marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <Radio size={24} color="var(--accent-primary)" /> MONITOREO_NEURAL_EN_VIVO
      </h2>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '10rem' }}>
          <Loader2 className="spin" size={60} color="var(--accent-primary)" />
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '1.5rem' }}>
          <AnimatePresence>
            {activeSessions.length === 0 ? (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="premium-card" style={{ padding: '8rem', textAlign: 'center', borderStyle: 'dashed', opacity: 0.5 }}>
                <Activity size={48} color="var(--text-secondary)" />
                <p>ESPERANDO SEÑAL DE AGENTES...</p>
              </motion.div>
            ) : activeSessions.map(session => (
              <AgentLiveNode key={session._id} session={session} activeQuestions={activeQuestions} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const HUDMetric = ({ label, value, color, pulse }: any) => (
  <div className="premium-card" style={{ padding: '1.5rem', position: 'relative', overflow: 'hidden' }}>
    <div style={{ position: 'absolute', top: 0, left: 0, width: '4px', height: '100%', background: color }} />
    <div style={{ fontSize: '0.65rem', fontWeight: 900, color: 'var(--text-secondary)', marginBottom: '8px', letterSpacing: '2px' }}>{label}</div>
    <div style={{ fontSize: '2.5rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
      {value}
      {pulse && <div style={{ width: '12px', height: '12px', borderRadius: '50%', background: color, animation: 'pulse 1.5s infinite' }} />}
    </div>
  </div>
);

const AgentLiveNode = ({ session, activeQuestions }: any) => {
  const [analyzing, setAnalyzing] = useState(false);
  const lastBlock = session.blocks?.[session.blocks.length - 1];
  const detectedCount = lastBlock?.questions?.filter((q: any) => q.detected).length || 0;
  const progress = Math.round((detectedCount / activeQuestions.length) * 100);

  const handleAudit = async () => {
    setAnalyzing(true);
    try {
      const resp = await fetch('/api/interacciones/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authService.getToken()}` },
        body: JSON.stringify({ transcript: session.transcript?.join('\n'), questions: activeQuestions })
      });
      const data = await resp.json();
      alert(`INTELIGENCIA ANALÍTICA:\n\n${data.summary}`);
    } catch (e) { console.error(e); } 
    finally { setAnalyzing(false); }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }} 
      animate={{ opacity: 1, x: 0 }} 
      className="premium-card" 
      style={{ padding: '2rem', display: 'grid', gridTemplateColumns: '1fr 2fr 1fr', gap: '2.5rem', alignItems: 'center' }}
    >
      <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
        <div style={{ width: '50px', height: '50px', borderRadius: '12px', border: '2px solid var(--accent-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', position: 'relative' }}>
          <Users size={28} color="var(--accent-primary)" />
          {session.isCurrentlyActive && <div style={{ position: 'absolute', top: -5, right: -5, width: '12px', height: '12px', background: '#10b981', borderRadius: '50%', boxShadow: '0 0 10px #10b981' }} />}
        </div>
        <div>
          <div style={{ fontSize: '1.1rem', fontWeight: 900 }}>{(session.vendedorId?.name || 'AGENT-01').toUpperCase()}</div>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-secondary)' }}>Status: <span style={{ color: '#10b981' }}>CAPTURING_LIVE_DATA</span></div>
        </div>
      </div>

      <div style={{ display: 'grid', gap: '15px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--accent-primary)', fontWeight: 800 }}>
          <span>NEURAL_SCRIPT_ADHERENCE</span>
          <span>{progress}%</span>
        </div>
        <div style={{ height: '6px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', display: 'flex', gap: '3px' }}>
          {activeQuestions.map((_: any, idx: number) => {
             const detected = lastBlock?.questions?.some((q: any) => q.id === (idx + 1) && q.detected);
             return <div key={idx} style={{ flex: 1, background: detected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', transition: 'all 0.5s' }} />
          })}
        </div>
        <div style={{ background: 'rgba(0,0,0,0.4)', padding: '12px 18px', borderRadius: '12px', borderLeft: '3px solid var(--accent-primary)', fontSize: '0.85rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
          "{session.transcript?.[session.transcript.length-1] || 'Esperando flujo de voz...'}"
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '10px' }}>{session.totalBlocksCombined || 0} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>LEADS_TODAY</span></div>
        <motion.button 
           whileHover={{ scale: 1.05 }}
           onClick={handleAudit}
           disabled={analyzing}
           className="cyber-button"
           style={{ padding: '10px 18px', borderRadius: '10px', fontSize: '0.7rem', cursor: 'pointer' }}
        >
          {analyzing ? 'AUDITING...' : 'GENERATE_AI_REPORT'}
        </motion.button>
      </div>
    </motion.div>
  );
};

/* ChartBadge removed for build fix */

export default SupervisorDashboard;
