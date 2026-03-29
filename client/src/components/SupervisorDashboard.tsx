import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, ShieldCheck, LogOut, Radio, Loader2, 
  Settings, X, Plus, Trash2
} from 'lucide-react';
import { authService } from '../services/auth.service';

const SupervisorDashboard: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const user = authService.getUser();
  const initialTenant = authService.getTenant();
  const [tenant, setTenant] = useState(initialTenant);
  const [questions, setQuestions] = useState<string[]>([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [aiPrompt, setAiPrompt] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (tenant?.config) {
      setQuestions(tenant.config.scriptQuestions || []);
      setAiPrompt(tenant.config.aiPrompt || "");
    }
  }, [tenant]);

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

  const handleSaveConfig = async () => {
    setSaving(true);
    try {
      const resp = await fetch('/auth/tenant/config', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}`
        },
        body: JSON.stringify({ 
          scriptQuestions: questions,
          aiPrompt: aiPrompt
        })
      });
      const updatedTenant = await resp.json();
      if (resp.ok) {
        setTenant(updatedTenant);
        // Actualizar el tenant en localStorage para que persista
        localStorage.setItem('tenant', JSON.stringify(updatedTenant));
        setShowSettings(false);
      }
    } catch (err) {
      console.error("Save Config Error:", err);
    } finally {
      setSaving(false);
    }
  };

  const addQuestion = () => {
    if (newQuestion.trim()) {
      setQuestions([...questions, newQuestion.trim()]);
      setNewQuestion("");
    }
  };

  const removeQuestion = (idx: number) => {
    setQuestions(questions.filter((_, i) => i !== idx));
  };

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 1500); 
    return () => clearInterval(interval);
  }, []);

  const activeQuestions = tenant?.config?.scriptQuestions?.length > 0 
    ? tenant.config.scriptQuestions 
    : ["Pregunta 1", "Pregunta 2", "Pregunta 3", "Pregunta 4"];

  const totalDetectionRatio = activeSessions.length > 0
    ? activeSessions.reduce((acc, s) => {
        const lastBlock = s.blocks?.[s.blocks.length - 1];
        const detectedCount = lastBlock?.questions?.filter((q: any) => q.detected).length || 0;
        return acc + (detectedCount / activeQuestions.length);
      }, 0) / activeSessions.length
    : 1; // Default to 100% if no sessions or everything is perfect
    
  const realPrecision = Math.round(totalDetectionRatio * 100);

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
             whileHover={{ scale: 1.05 }}
             whileTap={{ scale: 0.95 }}
             onClick={() => setShowSettings(!showSettings)}
             className="cyber-button-premium"
             style={{ 
               padding: '12px 28px', 
               cursor: 'pointer', 
               borderRadius: '14px', 
               fontSize: '0.8rem',
               textTransform: 'uppercase'
             }}
          >
            <Settings size={20} className="spin-slow" /> 
            <span style={{ position: 'relative', zIndex: 1 }}>ESTRATEGIA_IA</span>
            <div style={{
               position: 'absolute',
               top: 0,
               left: '-100%',
               width: '100%',
               height: '100%',
               background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.4), transparent)',
               animation: 'shimmer 2.5s infinite linear'
            }} />
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
        <HUDMetric label="PRECISIÓN_NLP" value={`${realPrecision}%`} color="var(--accent-secondary)" />
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

      {/* MODAL DE CONFIGURACIÓN / ESTRATEGIA */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ 
              position: 'fixed', top: 0, left: 0, width: '100vw', height: '100vh', 
              background: 'rgba(5, 11, 26, 0.95)', zIndex: 1000,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              backdropFilter: 'blur(10px)'
            }}
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="premium-card"
              style={{ width: '90%', maxWidth: '600px', border: '2px solid var(--accent-primary)', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '4px', background: 'linear-gradient(90deg, var(--accent-primary), var(--accent-secondary))' }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <Settings color="var(--accent-primary)" size={28} className="spin-slow" /> ESTRATEGIA_NEURAL
                </h2>
                <button onClick={() => setShowSettings(false)} style={{ background: 'none', color: 'var(--text-secondary)' }}>
                  <X size={24} />
                </button>
              </div>

              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '1.5rem' }}>
                CONFIGURA LAS PREGUNTAS Y FRASES CLAVE QUE TUS AGENTES DEBEN SEGUIR EN EL SCRIPT DE VENTAS.
              </p>

              <div style={{ display: 'flex', gap: '10px', marginBottom: '1.5rem' }}>
                <input 
                  type="text" 
                  value={newQuestion}
                  onChange={(e) => setNewQuestion(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && addQuestion()}
                  placeholder="Ej: ¿Qué presupuesto tienes?"
                  style={{ 
                    flex: 1, background: '#000', border: '1px solid rgba(255,255,255,0.1)', 
                    borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '0.9rem' 
                  }}
                />
                <button onClick={addQuestion} className="cyber-button-premium" style={{ width: '50px', justifyContent: 'center', borderRadius: '10px' }}>
                  <Plus size={24} />
                </button>
              </div>

              <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'grid', gap: '10px', paddingRight: '10px', marginBottom: '1.5rem' }}>
                {questions.map((q, idx) => (
                  <div key={idx} style={{ 
                    display: 'flex', justifyContent: 'space-between', alignItems: 'center', 
                    background: 'rgba(255,255,255,0.03)', padding: '12px 15px', borderRadius: '10px',
                    border: '1px solid rgba(255,255,255,0.05)'
                  }}>
                    <span style={{ fontSize: '0.9rem' }}>{q}</span>
                    <button onClick={() => removeQuestion(idx)} style={{ background: 'none', color: '#ff4444', opacity: 0.6 }}>
                      <Trash2 size={18} />
                    </button>
                  </div>
                ))}
                {questions.length === 0 && (
                  <div style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-secondary)', fontStyle: 'italic' }}>
                    No hay frases configuradas.
                  </div>
                )}
              </div>

              {/* ENTRENAMIENTO DE IA / PROMPT */}
              <div style={{ borderTop: '1px solid rgba(255,255,255,0.1)', paddingTop: '1.5rem' }}>
                <h3 style={{ fontSize: '1rem', fontWeight: 800, color: 'var(--accent-primary)', marginBottom: '10px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                   NÚCLEO_DE_ANÁLISIS_IA
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.75rem', marginBottom: '10px' }}>
                  ENTRENA A LA IA: DEFINE AQUÍ LAS REGLAS, MÉTRICAS O DATOS ESPECÍFICOS QUE DEBE ANALIZAR PARA GENERAR LOS REPORTES.
                </p>
                <textarea 
                   value={aiPrompt}
                   onChange={(e) => setAiPrompt(e.target.value)}
                   placeholder="Ej: Analiza si el agente suena empático, si ofreció el descuento del 20% y si cerró con una invitación a la tienda..."
                   style={{ 
                     width: '100%', height: '100px', background: '#000', border: '1px solid rgba(255,255,255,0.1)', 
                     borderRadius: '10px', padding: '12px', color: '#fff', fontSize: '0.85rem', resize: 'none',
                     fontFamily: 'monospace'
                   }}
                />
              </div>

              <div style={{ marginTop: '2rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
                <button 
                  onClick={() => setShowSettings(false)}
                  style={{ background: 'rgba(255,255,255,0.05)', color: '#fff', padding: '12px 24px', borderRadius: '12px', fontWeight: 600 }}
                >
                  CANCELAR
                </button>
                <button 
                  onClick={handleSaveConfig}
                  disabled={saving}
                  className="cyber-button-premium"
                  style={{ padding: '12px 32px', borderRadius: '12px', opacity: saving ? 0.5 : 1 }}
                >
                  {saving ? 'GUARDANDO...' : 'GUARDAR ESTRATEGIA'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
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
  const leads = session.totalBlocksCombined || 0;
  const scriptSize = activeQuestions.length;
  const expectedCount = leads * scriptSize;
  const realCount = Object.values(session.combinedStats || {}).reduce((a: any, b: any) => a + (b || 0), 0) as number;
  const adherence = expectedCount > 0 ? ((realCount / expectedCount) * 100).toFixed(1) : "0";

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
        {/* NUEVO CÁLCULO DE CUMPLIMIENTO ACUMULADO */}
        <div style={{ background: 'rgba(0, 242, 255, 0.05)', padding: '15px', borderRadius: '12px', border: '1px solid rgba(0, 242, 255, 0.1)' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent-primary)', letterSpacing: '1px' }}>CUMPLIMIENTO_SCRIPT_ACUMULADO</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
               <span style={{ fontSize: '1.4rem', fontWeight: 900, color: '#fff' }}>{adherence}%</span>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '15px', alignItems: 'center' }}>
            <div style={{ flex: 1, height: '4px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
               <motion.div 
                 initial={{ width: 0 }}
                 animate={{ width: `${Math.min(Number(adherence), 100)}%` }}
                 style={{ height: '100%', background: 'var(--accent-primary)', boxShadow: '0 0 10px var(--accent-primary)' }}
               />
            </div>
            <div style={{ fontSize: '0.8rem', fontWeight: 800, color: 'var(--text-secondary)', fontFamily: 'monospace' }}>
              {realCount} / <span style={{ color: 'var(--accent-primary)' }}>{expectedCount}</span>
            </div>
          </div>
          <div style={{ fontSize: '0.6rem', color: 'rgba(255,255,255,0.3)', marginTop: '8px', letterSpacing: '0.5px' }}>
            FÓRMULA: ( {realCount} REALES / {scriptSize} PREGUNTAS x {leads} CLIENTES )
          </div>
        </div>

        {/* CONTADORES DE PREGUNTAS / FRASES */}
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginTop: '5px' }}>
          {activeQuestions.map((q: string, idx: number) => {
            const count = session.combinedStats?.[q] || session.questionStats?.[q] || 0;
            const itemAdherence = leads > 0 ? Math.min(Math.round((count / leads) * 100), 100) : 0;
            
            return (
              <div key={idx} style={{ 
                background: count > 0 ? 'rgba(0, 242, 255, 0.1)' : 'rgba(255,255,255,0.03)', 
                padding: '8px 14px', 
                borderRadius: '10px', 
                fontSize: '0.65rem', 
                display: 'flex', 
                flexDirection: 'column',
                gap: '5px',
                border: count > 0 ? '1px solid rgba(0, 242, 255, 0.3)' : '1px solid rgba(255,255,255,0.05)',
                minWidth: '140px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '5px' }}>
                  <span style={{ color: count > 0 ? '#fff' : 'var(--text-secondary)', fontWeight: 600 }}>
                    {q.length > 25 ? q.substring(0, 25) + '...' : q}
                  </span>
                  <div style={{ display: 'flex', gap: '5px' }}>
                    <span style={{ 
                      background: count > 0 ? 'var(--accent-primary)' : '#333', 
                      color: count > 0 ? '#000' : '#888', 
                      padding: '2px 6px', 
                      borderRadius: '5px', 
                      fontWeight: 900 
                    }}>
                      {count}
                    </span>
                  </div>
                </div>
                {/* BARRA DE PROGRESO INDIVIDUAL */}
                <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.05)', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ 
                    width: `${itemAdherence}%`, 
                    height: '100%', 
                    background: itemAdherence > 80 ? '#10b981' : (itemAdherence > 40 ? '#f59e0b' : '#ef4444'),
                    transition: 'width 1s ease-in-out'
                  }} />
                </div>
                <div style={{ fontSize: '0.55rem', color: 'var(--text-secondary)', display: 'flex', justifyContent: 'space-between' }}>
                  <span>ADHERENCIA:</span>
                  <span style={{ color: itemAdherence > 0 ? '#fff' : 'inherit' }}>{itemAdherence}%</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '10px' }}>{leads} <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)' }}>LEADS_TODAY</span></div>
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
