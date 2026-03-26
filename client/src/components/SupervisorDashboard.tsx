import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Activity, Users, ShieldCheck, LogOut, Radio, Loader2, 
  Search, UserCheck, ClipboardCheck, Brain, Settings, Save, MessageSquare, Sparkles, Plus, Trash2
} from 'lucide-react';
import { authService } from '../services/auth.service';

const SupervisorDashboard: React.FC = () => {
  const [activeSessions, setActiveSessions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  
  const user = authService.getUser();
  const initialTenant = authService.getTenant();
  const [tenant, setTenant] = useState(initialTenant);
  
  const [questions, setQuestions] = useState<string[]>(["", "", "", ""]);
  const [aiPrompt, setAiPrompt] = useState("");
  const [savingConfig, setSavingConfig] = useState(false);

  // SYNC EDITING STATE WITH DB DATA
  useEffect(() => {
    if (tenant?.config) {
      if (tenant.config.scriptQuestions?.length > 0) {
        setQuestions(tenant.config.scriptQuestions);
      }
      if (tenant.config.aiPrompt) {
        setAiPrompt(tenant.config.aiPrompt);
      }
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

  const saveConfig = async () => {
    console.log("Iniciando despliegue estratégico...", { questions, aiPrompt });
    setSavingConfig(true);
    try {
      const resp = await fetch('/auth/tenant/config', {
        method: 'PATCH',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}` 
        },
        body: JSON.stringify({ scriptQuestions: questions, aiPrompt })
      });
      
      const data = await resp.json();
      console.log("Respuesta del servidor:", data);

      if (resp.ok) {
        authService.setTenant(data);
        setTenant(data);
        setShowSettings(false);
        alert("✅ ESTRATEGIA DESPLEGADA: Todos los vendedores han sido actualizados.");
      } else {
        alert(`❌ ERROR DE DESPLIEGUE: ${data.error || 'Error desconocido'}`);
      }
    } catch (err) {
      console.error("Critical Save Error:", err);
      alert("❌ ERROR DE CONEXIÓN: No se pudo contactar con el servidor central.");
    } finally {
      setSavingConfig(false);
    }
  };

  const addQuestion = () => setQuestions([...questions, ""]);
  const removeQuestion = (idx: number) => setQuestions(questions.filter((_, i) => i !== idx));

  useEffect(() => {
    fetchActiveSessions();
    const interval = setInterval(fetchActiveSessions, 1500); 
    return () => clearInterval(interval);
  }, []);

  const activeQuestions = tenant?.config?.scriptQuestions?.length > 0 
    ? tenant.config.scriptQuestions 
    : ["Pregunta 1", "Pregunta 2", "Pregunta 3", "Pregunta 4"];

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg-deep)', padding: '1.5rem', backgroundImage: 'radial-gradient(circle at 100% 0%, rgba(99, 102, 241, 0.05) 0%, transparent 50%)' }}>
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem', flexWrap: 'wrap', gap: '1.5rem' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: '#10b981', boxShadow: '0 0 15px #10b981', animation: 'pulse 2s infinite' }} />
            <span style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.2em' }}>OVERWATCH AI SaaS</span>
          </div>
          <h1 className="text-gradient" style={{ fontSize: '2.5rem', fontWeight: 900, letterSpacing: '-0.03em' }}>Centro de Mando</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem' }}>Tenant: <strong style={{ color: '#fff' }}>{tenant?.name?.toUpperCase() || 'Cargando...'}</strong></p>
        </div>

        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={() => setShowSettings(!showSettings)}
            style={{ padding: '14px', borderRadius: '15px', background: 'rgba(99, 102, 241, 0.1)', color: 'var(--accent-primary)', border: '1px solid rgba(99, 102, 241, 0.2)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px' }}
          >
            <Settings size={20} className={showSettings ? 'spin' : ''} />
            Configuración Estratégica
          </motion.button>

          <div className="premium-card" style={{ padding: '10px 20px', background: 'rgba(255,255,255,0.02)', display: 'flex', gap: '15px', alignItems: 'center', borderRadius: '18px' }}>
            <div style={{ height: '46px', width: '46px', borderRadius: '14px', background: 'linear-gradient(135deg, rgba(99, 102, 241, 0.2), rgba(168, 85, 247, 0.2))', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid rgba(255, 255, 255, 0.1)' }}>
              <ShieldCheck size={26} color="var(--accent-primary)" />
            </div>
            <div>
              <div style={{ fontSize: '1rem', fontWeight: 900 }}>{user?.name || 'Supervisor'}</div>
              <div style={{ fontSize: '0.7rem', color: 'var(--accent-primary)', fontWeight: 800 }}>BOSS ACCESS</div>
            </div>
          </div>
          
          <motion.button 
            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
            onClick={authService.logout} 
            style={{ padding: '16px', borderRadius: '16px', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-secondary)', border: 'none', cursor: 'pointer' }}
          >
            <LogOut size={22} />
          </motion.button>
        </div>
      </header>

      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div 
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="premium-card"
            style={{ marginBottom: '3rem', overflow: 'hidden', border: '1px solid var(--accent-primary)' }}
          >
            <div style={{ padding: '2.5rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr', gap: '3rem' }}>
                 {/* Left: Questions */}
                 <div style={{ maxHeight: '450px', overflowY: 'auto', paddingRight: '1rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h2 style={{ fontSize: '1.2rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <MessageSquare color="var(--accent-primary)" /> Guion de Preguntas
                      </h2>
                      <motion.button 
                         whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}
                         onClick={addQuestion}
                         style={{ background: 'var(--accent-primary)', border: 'none', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#fff' }}
                      >
                         <Plus size={20} />
                      </motion.button>
                    </div>

                    <div style={{ display: 'grid', gap: '1rem' }}>
                      {questions.map((q: string, idx: number) => (
                        <div key={idx} style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--accent-primary)', width: '25px' }}>{idx+1}</span>
                          <input 
                            type="text" 
                            value={q} 
                            placeholder={`Pregunta Estratégica ${idx + 1}`}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                              const newQ = [...questions];
                              newQ[idx] = e.target.value;
                              setQuestions(newQ);
                            }}
                            style={{ flex: 1, background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '12px', color: '#fff', fontSize: '0.9rem' }}
                          />
                          {questions.length > 1 && (
                            <motion.button
                               whileHover={{ color: '#f43f5e' }}
                               onClick={() => removeQuestion(idx)}
                               style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.2)', cursor: 'pointer' }}
                            >
                               <Trash2 size={18} />
                            </motion.button>
                          )}
                        </div>
                      ))}
                    </div>
                 </div>

                 {/* Right: AI Prompt */}
                 <div>
                    <h2 style={{ fontSize: '1.2rem', fontWeight: 900, marginBottom: '1.5rem', display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <Sparkles color="var(--accent-secondary)" /> Auditoría del Vendedor (Detección y Técnica)
                    </h2>
                    <textarea 
                       value={aiPrompt}
                       onChange={(e) => setAiPrompt(e.target.value)}
                       style={{ width: '100%', height: '140px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(255,255,255,0.1)', padding: '14px', borderRadius: '12px', color: '#fff', fontSize: '0.9rem', resize: 'none', lineHeight: 1.5 }}
                       placeholder="Ej: Analiza si el vendedor se saltó la pregunta del presupuesto o si la hizo de forma agresiva..."
                    />
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '10px' }}>
                      <strong>Objetivo:</strong> Evaluar si el agente CUMPLE con el guion estratético. La IA no mirará las respuestas del cliente, sino la técnica y disciplina de tu equipo.
                    </p>
                 </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '2.5rem', borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '2rem' }}>
                 <motion.button
                   whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                   onClick={saveConfig}
                   disabled={savingConfig}
                   style={{ background: 'var(--accent-primary)', color: '#fff', border: 'none', padding: '14px 30px', borderRadius: '14px', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '12px', boxShadow: '0 0 30px rgba(99, 102, 241, 0.4)' }}
                 >
                   {savingConfig ? <Loader2 className="spin" size={20} /> : <Save size={20} />}
                   DESPLEGAR NUEVA ESTRATEGIA
                 </motion.button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem', marginBottom: '3.5rem' }}>
        <MetricCard icon={<Users color="var(--accent-primary)" />} value={activeSessions.length} label="AGENTES ACTIVOS" color="var(--accent-primary)" />
        <MetricCard icon={<Activity color="#10b981" />} value={activeSessions.reduce((acc, s) => acc + (s.totalBlocksCombined || 0), 0)} label="LEADS ATENDIDOS HOY" color="#10b981" />
        <MetricCard icon={<Radio color="#f43f5e" />} value={activeSessions.length > 0 ? "STREAMING" : "IDLE"} label="CANAL OPERATIVO" color="#f43f5e" />
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2.5rem' }}>
        <h2 style={{ fontSize: '1.6rem', fontWeight: 900, display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <UserCheck size={32} color="var(--accent-primary)" /> Inteligencia de Campo en Vivo
        </h2>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '12rem' }}>
          <Loader2 className="spin" size={64} color="var(--accent-primary)" />
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '1.5rem' }}>
          <AnimatePresence mode="popLayout">
            {activeSessions.length === 0 ? (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="premium-card" style={{ textAlign: 'center', padding: '8rem', background: 'rgba(255,255,255,0.01)', borderStyle: 'dashed' }}>
                <Search size={64} style={{ opacity: 0.1, marginBottom: '2rem' }} color="#fff" />
                <h3 style={{ color: 'var(--text-muted)', fontSize: '1.3rem', fontWeight: 700 }}>Pabellón de Agentes Vacío</h3>
              </motion.div>
            ) : activeSessions.map((session: any) => (
              <AgentLiveRow key={session._id} session={session} activeQuestions={activeQuestions} />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
};

const MetricCard = ({ icon, value, label, color }: any) => (
  <div className="premium-card" style={{ display: 'flex', alignItems: 'center', gap: '2rem', padding: '2.5rem' }}>
    <div style={{ padding: '20px', borderRadius: '18px', background: `${color}15`, border: `1px solid ${color}25` }}>
      {React.cloneElement(icon, { size: 36 })}
    </div>
    <div>
      <div style={{ fontSize: '2.8rem', fontWeight: 900, lineHeight: 1, letterSpacing: '-0.05em' }}>{value}</div>
      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', fontWeight: 900, marginTop: '8px', letterSpacing: '0.15em' }}>{label}</div>
    </div>
  </div>
);

const AgentLiveRow = ({ session, activeQuestions }: any) => {
  const [analyzing, setAnalyzing] = useState(false);
  const agentName = session.vendedorId?.name || 'AGENT-X';
  const agentEmail = session.vendedorId?.email || 'N/A';
  const lastBlock = session.blocks && session.blocks.length > 0 ? session.blocks[session.blocks.length - 1] : null;
  
  const detectedCount = lastBlock?.questions?.filter((q: any) => q.detected).length || 0;
  const progressPercent = Math.round((detectedCount / activeQuestions.length) * 100);

  const handleAudit = async () => {
    setAnalyzing(true);
    try {
      const fullTranscript = (session.transcript || []).join('\n');
      const resp = await fetch('/api/interacciones/analyze', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authService.getToken()}` 
        },
        body: JSON.stringify({ 
           transcript: fullTranscript,
           keywords: activeQuestions,
           questions: activeQuestions,
           totalClients: session.totalBlocksCombined || 0
        })
      });
      const data = await resp.json();
      alert(`AUDITORÍA ESTRATÉGICA (IA GROQ)\n\nCumplimiento: ${data.compliance_score}%\n\nResumen Directivo:\n${data.summary}`);
    } catch (err) { console.error(err); } 
    finally { setAnalyzing(false); }
  };

  return (
    <motion.div 
      layout initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
      className="premium-card" style={{ padding: '2.5rem', background: 'rgba(255,255,255,0.02)' }}
    >
      <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.5fr 2fr 0.8fr', gap: '2.5rem', alignItems: 'start' }}>
        
        <div>
          <div style={{ display: 'flex', gap: '1.5rem', marginBottom: '1.5rem' }}>
            <div style={{ flexShrink: 0, height: '60px', width: '60px', borderRadius: '18px', background: 'var(--bg-deep)', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '2px solid rgba(99, 102, 241, 0.4)', position: 'relative' }}>
               <Activity size={32} color="var(--accent-primary)" />
               <div style={{ position: 'absolute', bottom: -2, right: -2, width: '14px', height: '14px', background: session.isCurrentlyActive ? '#10b981' : '#555', borderRadius: '50%', border: '3px solid var(--bg-card)', boxShadow: session.isCurrentlyActive ? '0 0 10px #10b981' : 'none' }} />
            </div>
            <div>
              <h3 style={{ fontWeight: 900, fontSize: '1.1rem' }}>{agentName.toUpperCase()}</h3>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{agentEmail}</p>
            </div>
          </div>
          <div style={{ fontSize: '0.65rem', color: 'var(--accent-primary)', fontWeight: 800, letterSpacing: '0.05em' }}>
             {session.isCurrentlyActive ? 'SISTEMA ONLINE' : 'SISTEMA OFFLINE'} | {session.cumulativeSessionsToday} BLOQUES HOY
          </div>
        </div>

        <div>
           <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', letterSpacing: '0.1em', display: 'flex', alignItems: 'center', gap: '5px' }}>
             MÉTRICAS DEL DÍA <ChartBadge />
           </span>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginTop: '12px' }}>
            {activeQuestions.map((q: string, idx: number) => {
              const count = session.combinedStats?.[q] || 0;
              return (
                <div key={idx} style={{ background: 'rgba(0,0,0,0.25)', padding: '10px', borderRadius: '10px', display: 'flex', justifyContent: 'space-between', border: count > 0 ? '1px solid rgba(99,102,241,0.2)' : '1px solid transparent' }}>
                  <span style={{ fontSize: '0.6rem', color: count > 0 ? 'var(--accent-primary)' : 'rgba(255,255,255,0.2)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '80%' }}>{q}</span>
                  <span style={{ fontSize: '0.85rem', fontWeight: 900, color: count > 0 ? '#fff' : 'rgba(255,255,255,0.1)' }}>{count}</span>
                </div>
              );
            })}
          </div>
        </div>

        <div>
           <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '10px' }}>
             <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}><ClipboardCheck size={14} /> ADHESIÓN AL GUION ACTUAL</span>
             <span style={{ color: 'var(--accent-primary)' }}>{progressPercent}%</span>
           </div>
           <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', display: 'flex', gap: '4px', marginBottom: '1.5rem' }}>
             {activeQuestions.map((_: string, idx: number) => {
               const qId = idx + 1;
               const detected = lastBlock?.questions?.some((q: any) => q.id === qId && q.detected);
               return <div key={idx} style={{ flex: 1, background: detected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', transition: 'all 0.4s' }} />
             })}
           </div>
           <div style={{ background: 'rgba(0,0,0,0.4)', padding: '15px 20px', borderRadius: '16px', borderLeft: '5px solid var(--accent-secondary)' }}>
              <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.85)', fontStyle: 'italic', lineHeight: 1.4 }}>
                "{session.transcript && session.transcript.length > 0 ? session.transcript[session.transcript.length-1] : 'Capturando audio de vendedor...'}"
              </p>
           </div>
        </div>

        <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', gap: '1.5rem', alignItems: 'flex-end' }}>
          <div>
            <div style={{ fontSize: '2.8rem', fontWeight: 900, color: 'var(--accent-primary)', lineHeight: 1 }}>{session.totalBlocksCombined || 0}</div>
            <div style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 800, marginTop: '5px' }}>CLIENTES HOY</div>
          </div>
          <button onClick={handleAudit} disabled={analyzing} style={{ cursor: 'pointer', background: 'linear-gradient(135deg, #6366f1, #a855f7)', color: '#fff', border: 'none', padding: '12px 20px', borderRadius: '14px', fontSize: '0.75rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 10px 20px rgba(99,102,241,0.3)' }}>
            {analyzing ? <Loader2 className="spin" size={16} /> : <Brain size={16} />} AUDITORÍA AI
          </button>
        </div>

      </div>
    </motion.div>
  );
};

const ChartBadge = () => (
  <div style={{ height: '12px', display: 'flex', gap: '2px', alignItems: 'flex-end' }}>
    <div style={{ width: '3px', height: '60%', background: 'var(--accent-primary)' }} />
    <div style={{ width: '3px', height: '90%', background: 'var(--accent-primary)' }} />
    <div style={{ width: '3px', height: '40%', background: 'var(--accent-primary)' }} />
  </div>
);

export default SupervisorDashboard;
