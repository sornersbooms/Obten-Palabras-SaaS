import React, { useState, useEffect, useRef, useCallback } from 'react';
import styles from './Dashboard.module.css';
import { useSpeechRecognition } from '../hooks/useSpeechRecognition';
import { useKeywordMatcher } from '../hooks/useKeywordMatcher';
import { authService } from '../services/auth.service';
import {
  Activity, Users, LogOut, Radio, Loader2,
  ClipboardCheck, ArrowUpRight, BarChartHorizontal, Mic, MicOff, History
} from 'lucide-react';
import { motion } from 'framer-motion';

const Dashboard: React.FC = () => {
  const [interimTranscript, setInterimTranscript] = useState<string>('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const feedRef = useRef<HTMLDivElement>(null);

  const user = authService.getUser();
  const tenant = authService.getTenant();

  // DYNAMIC SCRIPT: Load from tenant config or use global fallback
  const QUESTIONS = tenant?.config?.scriptQuestions && tenant.config.scriptQuestions.length > 0
    ? tenant.config.scriptQuestions
    : [
      "¿Cómo puedo ayudarte?",
      "¿Qué presupuesto tienes?",
      "¿Buscas algo específico?",
      "¿Quieres agendar una cita?"
    ];

  const {
    globalQuestionStats,
    currentBlockQuestions,
    blocksHistory,
    currentBlockId,
    currentBlockTranscript,
    processTranscript
  } = useKeywordMatcher(QUESTIONS);

  // CALLBACKS MUST BE DEFINED BEFORE HOOKS THAT USE THEM
  const onSpeechResult = useCallback(({ transcript, isFinal }: { transcript: string; isFinal: boolean }) => {
    if (isFinal) {
      setInterimTranscript('');
      processTranscript(transcript, true);
    } else {
      setInterimTranscript(transcript);
      processTranscript(transcript, false);
    }
  }, [processTranscript]);

  const { isListening, error, startListening, stopListening } = useSpeechRecognition(onSpeechResult);

  // AUTH PROTECTED FETCH WRAPPER
  const authFetch = (url: string, options: any = {}) => {
    return fetch(url, {
      ...options,
      headers: {
        ...options.headers,
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authService.getToken()}`
      }
    });
  };

  // SYNC WITH BACKEND (The "Police" monitor)
  useEffect(() => {
    if (isListening && !sessionId) {
      // Start session on backend
      authFetch('/api/interacciones', {
        method: 'POST',
        body: JSON.stringify({ clienteId: currentBlockId })
      })
        .then(r => r.json())
        .then(d => {
          if (d?._id) setSessionId(d._id);
        }).catch(err => console.error("Sync init error:", err));
    }

    if (sessionId) {
      // Periodic Update for Supervisor overwataching
      const timer = setTimeout(() => {
        // CONVERT ARRAY STATS TO OBJECT FOR MONGO MAP
        const statsObj: Record<string, number> = {};
        QUESTIONS.forEach((q: string, idx: number) => {
          statsObj[q] = globalQuestionStats[idx];
        });

        authFetch(`/api/interacciones/${sessionId}`, {
          method: 'PATCH',
          body: JSON.stringify({
            transcript: currentBlockTranscript,
            questionStats: statsObj,
            blocks: blocksHistory
          })
        });
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [isListening, currentBlockTranscript, globalQuestionStats, blocksHistory, sessionId, currentBlockId, QUESTIONS]);

  useEffect(() => {
    if (feedRef.current) feedRef.current.scrollTop = feedRef.current.scrollHeight;
  }, [currentBlockTranscript, interimTranscript]);

  const toggleSession = () => isListening ? stopListening() : startListening();

  const handleAuditSession = async () => {
    setIsAnalyzing(true);
    const fullTranscript = [
      ...blocksHistory.map(b => b.transcript.join(' ')).reverse(),
      currentBlockTranscript.join(' ')
    ].join('\n--- NUEVO CLIENTE ---\n');

    try {
      const resp = await authFetch('/api/interacciones/analyze', {
        method: 'POST',
        body: JSON.stringify({
          transcript: fullTranscript,
          keywords: QUESTIONS,
          questions: QUESTIONS,
          totalClients: totalClients
        })
      });
      const data = await resp.json();
      alert(`Auditoría Global (Groq AI):\n\nTOTAL CLIENTES: ${data.total_clients}\nCUMPLIMIENTO: ${data.compliance_score}%\n\nResumen:\n${data.summary}`);
    } catch (err) {
      console.error(err);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const detectedCount = currentBlockQuestions.filter((q: any) => q.detected).length;
  const progressPercent = Math.round((detectedCount / QUESTIONS.length) * 100);
  const totalClients = blocksHistory.length + (currentBlockQuestions.some((q: any) => q.detected) ? 1 : 0);

  return (
    <div className={styles.dashboard}>
      <header className={styles.header}>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
          <div style={{ background: 'var(--accent-primary)', padding: '12px', borderRadius: '14px', boxShadow: '0 0 20px var(--accent-glow)' }}>
            <Activity color="#fff" size={28} />
          </div>
          <div>
            <h1 className={`${styles.title} text-gradient`} style={{ fontSize: '1.5rem', marginBottom: 0 }}>Stat-IQ Agent</h1>
            <p className={styles.subtitle}>{tenant?.name?.toUpperCase() || 'EMPRESA'} | <span style={{ color: 'var(--accent-primary)', fontWeight: 700 }}>{user?.name || 'Vendedor'}</span></p>
          </div>
        </div>

        <div className={styles.recordingSection}>
          <button className={`${styles.recordBtn} ${isListening ? styles.active : ''}`} onClick={toggleSession}>
            {isListening ? <Mic size={20} /> : <MicOff size={20} />}
            <span className={styles.desktopOnly}>{isListening ? 'ESCUCHANDO...' : 'GRABAR FEED'}</span>
          </button>
          <button onClick={authService.logout} style={{ padding: '12px', background: 'rgba(244,63,94,0.1)', color: 'var(--accent-secondary)', borderRadius: '12px', cursor: 'pointer' }}>
            <LogOut size={20} />
          </button>
        </div>
      </header>

      {error && <div className={styles.errorAlert} style={{ marginBottom: '1rem' }}>{error}</div>}

      <div className={styles.topGrid}>
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
            <Users size={20} className="text-accent" />
            <h3 style={{ fontSize: '1rem' }}>{currentBlockId}</h3>
          </div>

          <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-muted)', marginBottom: '10px' }}>
            <span>AVANCE DEL CIERRE</span>
            <span style={{ color: 'var(--accent-primary)' }}>{progressPercent}%</span>
          </div>
          <div style={{ height: '8px', background: 'rgba(255,255,255,0.05)', borderRadius: '10px', overflow: 'hidden', display: 'flex', gap: '4px', marginBottom: '1.5rem' }}>
            {QUESTIONS.map((_: string, idx: number) => {
              const qId = idx + 1;
              const detected = currentBlockQuestions.some((q: { id: number; detected: boolean }) => q.id === qId && q.detected);
              return <div key={idx} style={{ flex: 1, background: detected ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)', transition: 'all 0.4s' }} />
            })}
          </div>

          <div className={styles.questionsGrid}>
            {currentBlockQuestions.map((q: { id: number; detected: boolean; pattern: string }) => (
              <motion.div
                key={q.id}
                animate={q.detected ? { scale: 1, borderColor: '#6366f1' } : { scale: 1 }}
                className={`${styles.questionCard} premium-card ${q.detected ? styles.detected : ''}`}
                style={{ padding: '1rem' }}
              >
                {q.detected && <span className={styles.detectedBadge}>HECHO</span>}
                <div style={{ fontSize: '0.6rem', color: 'var(--text-muted)' }}>Q{q.id}</div>
                <h3 style={{ fontSize: '0.8rem', color: q.detected ? '#fff' : 'var(--text-secondary)' }}>{q.pattern}</h3>
              </motion.div>
            ))}
          </div>
        </div>

        <div className="premium-card" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ fontSize: '0.65rem', color: 'var(--text-muted)', fontWeight: 800 }}>PERSONAS ATENDIDAS</div>
          <motion.div
            key={totalClients}
            initial={{ scale: 1.4 }}
            animate={{ scale: 1 }}
            style={{ fontSize: '5rem', fontWeight: 900, color: 'var(--accent-primary)', lineHeight: 1, margin: '1rem 0' }}
          >
            {totalClients}
          </motion.div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '5px', fontSize: '0.7rem', color: 'var(--accent-primary)' }}>
            <ArrowUpRight size={14} />
            <span>EN VIVO</span>
          </div>
        </div>
      </div>

      <div className={styles.statsSection}>
        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.5rem' }}>
            <BarChartHorizontal size={18} className="text-accent" />
            <h2 style={{ fontSize: '1.1rem' }}>Métricas Acumuladas</h2>
          </div>
          <div className={styles.keywordsContainer}>
            {QUESTIONS.map((q: string, idx: number) => (
              <div key={idx} className={styles.keywordChip} style={{ justifyContent: 'space-between', width: '100%' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: globalQuestionStats[idx] > 0 ? 'var(--accent-primary)' : '#333' }} />
                  <span style={{ fontSize: '0.8rem' }}>{q}</span>
                </div>
                <span className={styles.keywordCount}>{globalQuestionStats[idx]}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="premium-card">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
            <Radio className={isListening ? 'text-accent' : 'text-muted'} size={18} />
            <h2 style={{ fontSize: '1.1rem' }}>Monitor de Voz</h2>
          </div>
          <div className={styles.pulseContainer}>
            {isListening ? (
              <motion.p initial={{ opacity: 0.5 }} animate={{ opacity: 1 }} style={{ fontSize: '1.1rem', color: '#fff', fontStyle: 'italic' }}>
                "{interimTranscript || 'Procesando voz...'}"
              </motion.p>
            ) : <p style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>El micrófono está apagado.</p>}
          </div>
        </div>
      </div>

      <div className="premium-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1.5rem', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <ClipboardCheck size={18} className="text-accent" />
            <h2 style={{ fontSize: '1.1rem' }}>Auditoría Estratégica AI</h2>
          </div>
          <button onClick={handleAuditSession} className={styles.recordBtn} style={{ fontSize: '0.75rem', padding: '10px 20px' }} disabled={isAnalyzing || totalClients === 0}>
            {isAnalyzing ? <><Loader2 className="spin" size={14} /> ANALIZANDO...</> : 'REPORTE GLOBAL GROQ'}
          </button>
        </div>
        <div className={styles.transcriptFeed} ref={feedRef}>
          {currentBlockTranscript.length > 0 ? (
            currentBlockTranscript.map((line, i) => (
              <div key={i} style={{ marginBottom: '0.8rem', borderLeft: '2px solid rgba(99,102,241,0.3)', paddingLeft: '1rem' }}>{line}</div>
            ))
          ) : !interimTranscript && <div style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>Aún no hay transcripción...</div>}
          {interimTranscript && <div style={{ color: 'var(--accent-primary)', opacity: 0.6, paddingLeft: '1rem' }}>{interimTranscript}...</div>}
        </div>
      </div>

      {/* Historial Footer Mini */}
      {blocksHistory.length > 0 && (
        <div className="premium-card" style={{ padding: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
            <History size={16} className="text-muted" />
            <span style={{ fontSize: '0.8rem', fontWeight: 600 }}>Sesiones recientes en esta grabación</span>
          </div>
          <div style={{ display: 'flex', gap: '0.5rem', overflowX: 'auto' }}>
            {blocksHistory.map(b => (
              <div key={b.id} style={{ background: 'rgba(0,0,0,0.2)', padding: '8px 12px', borderRadius: '8px', fontSize: '0.7rem', border: '1px solid var(--glass-border)' }}>
                {b.id}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
