"use client";

import React, { useState, useEffect, useCallback, useTransition } from 'react';
import { NewsItem, VistaActual } from '../types';

// Temas disponibles para seleccionar en Wear OS
const TEMAS_DISPONIBLES = [
  'Tecnología',
  'Inteligencia Artificial',
  'Negocios',
  'Ciencia',
  'Salud',
  'Cripto'
];

export default function WatchApp() {
  // -------------------------------------------------------------
  // 1. GESTIÓN DE ESTADO GLOBAL (Wear OS & Mobile)
  // -------------------------------------------------------------
  const [temasPreferidos, setTemasPreferidos] = useState<string[]>([
    'Tecnología',
    'Inteligencia Artificial',
    'Negocios'
  ]);
  const [horaNotificacion, setHoraNotificacion] = useState<string>('08:00');
  const [historial, setHistorial] = useState<NewsItem[]>([]);
  const [vistaActual, setVistaActual] = useState<VistaActual>('feed');

  // Estados complementarios de la UI
  const [news, setNews] = useState<NewsItem[]>([]);
  const [indiceActual, setIndiceActual] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [notificacionToast, setNotificacionToast] = useState<string | null>(null);
  const [hapticFeedback, setHapticFeedback] = useState<boolean>(false);
  const [, startTransition] = useTransition();

  // Reloj digital en vivo para la barra de estado de Wear OS
  const [relojActual, setRelojActual] = useState<string>('12:00');

  useEffect(() => {
    const actualizarReloj = () => {
      const ahora = new Date();
      setRelojActual(ahora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    };
    actualizarReloj();
    const timer = setInterval(actualizarReloj, 1000);
    return () => clearInterval(timer);
  }, []);

  // -------------------------------------------------------------
  // 2. LÓGICA DEL MOTOR GEMINI (Filtrado por Temas)
  // -------------------------------------------------------------
  const fetchCuratedNews = useCallback(async (temas: string[]) => {
    setLoading(true);
    setError(null);

    // Prompt configurado exactamente para Gemini SDK
    // const prompt = `Actúa como un curador de noticias. Dame 3 titulares súper cortos y un resumen de una línea basados EXCLUSIVAMENTE en estos temas: ${temas.join(', ')}.`;

    try {
      const res = await fetch(`/api/daily-brief?temas=${encodeURIComponent(temas.join(','))}`);
      if (!res.ok) {
        throw new Error('Error al conectar con el servicio Gemini');
      }
      const data: NewsItem[] = await res.json();
      setNews(data);
      setIndiceActual(0);
    } catch (err) {
      console.error('[Gemini Engine Error]:', err);
      setError('No se pudo sincronizar el feed de noticias.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Cargar noticias iniciales o cuando cambian los temas preferidos
  useEffect(() => {
    fetchCuratedNews(temasPreferidos);
  }, [temasPreferidos, fetchCuratedNews]);

  // -------------------------------------------------------------
  // 3. LÓGICA DEL HISTORIAL (Memoria optimizada para Wear OS, máx 10)
  // -------------------------------------------------------------
  const avanzarNoticia = () => {
    if (news.length === 0) return;

    const noticiaActual = news[indiceActual];

    // Simular vibración háptica de Wear OS
    triggerHaptic();

    if (noticiaActual) {
      const itemConFecha: NewsItem = {
        ...noticiaActual,
        leidoEn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistorial(prevHistorial => {
        // Prevenir duplicados consecutivos y ubicar al inicio
        const sinDuplicado = prevHistorial.filter(item => item.id !== itemConFecha.id);
        const nuevoHistorial = [itemConFecha, ...sinDuplicado];

        // Límite estricto de 10 elementos para no saturar memoria del reloj Wear OS
        return nuevoHistorial.slice(0, 10);
      });
    }

    // Avanzar cíclicamente en el feed
    setIndiceActual(prev => (prev + 1) % news.length);
  };

  const retrocederNoticia = () => {
    triggerHaptic();
    setIndiceActual(prev => (prev - 1 + news.length) % news.length);
  };

  // -------------------------------------------------------------
  // 4. SIMULACIÓN DE PROGRAMACIÓN DE ALERTA (Cronjob nativo Wear OS)
  // -------------------------------------------------------------
  const programarAlerta = (hora: string) => {
    setHoraNotificacion(hora);

    // Simulación del registro de alarma nativa / cronjob Wear OS
    console.log(`%c[Wear OS Native AlarmManager]%c Cronjob registrado con éxito para las ${hora} hs.`,
      'background: #8B5CF6; color: #fff; font-weight: bold; padding: 2px 6px; border-radius: 4px;',
      'color: #06B6D4; font-weight: bold;'
    );
    console.log(`[Wear OS Background Sync] Filtro activo para Gemini: [${temasPreferidos.join(', ')}]`);

    // Mostrar feedback háptico y notificación en pantalla
    triggerHaptic();
    mostrarToast(`⏰ Alerta Wear OS: Cronjob programado para las ${hora}`);
  };

  // Helpers auxiliares
  const triggerHaptic = () => {
    setHapticFeedback(true);
    setTimeout(() => setHapticFeedback(false), 200);
  };

  const mostrarToast = (mensaje: string) => {
    setNotificacionToast(mensaje);
    setTimeout(() => setNotificacionToast(null), 3500);
  };

  const toggleTema = (tema: string) => {
    triggerHaptic();
    setTemasPreferidos(prev => {
      if (prev.includes(tema)) {
        if (prev.length <= 1) {
          mostrarToast('⚠️ Debes mantener al menos un tema activo');
          return prev;
        }
        return prev.filter(t => t !== tema);
      } else {
        return [...prev, tema];
      }
    });
  };

  const noticiaActiva = news[indiceActual];

  return (
    <div style={styles.container}>
      {/* Marco de Simulación Wear OS (Smartwatch Circular de 44mm) */}
      <div style={{
        ...styles.watchBezel,
        transform: hapticFeedback ? 'scale(0.995)' : 'scale(1)',
        transition: 'transform 0.15s ease-out'
      }}>
        {/* Corona Digital Interativa Wear OS */}
        <button
          title="Corona Digital Wear OS: Gira / Pulsa para avanzar noticia"
          onClick={avanzarNoticia}
          style={styles.digitalCrown}
        >
          <span style={styles.crownNotch}></span>
        </button>

        {/* Botón Lateral Wear OS (Acceso rápido a Ajustes) */}
        <button
          title="Botón Lateral Wear OS: Ajustes"
          onClick={() => {
            triggerHaptic();
            setVistaActual(prev => prev === 'ajustes' ? 'feed' : 'ajustes');
          }}
          style={styles.hardwareButton}
        />

        {/* Pantalla AMOLED Circular */}
        <div style={styles.watchScreen}>
          {/* Barra de Estado Superior Wear OS */}
          <div style={styles.statusBar}>
            <span style={styles.statusTime}>{relojActual}</span>
            <div style={styles.statusIcons}>
              <span style={styles.badgePulse}>● AI</span>
              <span style={styles.batteryChip}>98% ⚡</span>
            </div>
          </div>

          {/* Banner Toast Simulado de Notificaciones / Alertas Wear OS */}
          {notificacionToast && (
            <div style={styles.toastBanner}>
              <span style={styles.toastText}>{notificacionToast}</span>
            </div>
          )}

          {/* Contenido Principal según la vista seleccionada */}
          <div style={styles.screenContent}>
            {/* VISTA 1: FEED DE NOTICIAS */}
            {vistaActual === 'feed' && (
              <div style={styles.feedContainer}>
                {loading ? (
                  <div style={styles.centerBox}>
                    <div style={styles.spinner}></div>
                    <p style={styles.loadingText}>Curando noticias con Gemini...</p>
                    <span style={styles.subtextTopics}>
                      {temasPreferidos.slice(0, 2).join(' • ')}
                    </span>
                  </div>
                ) : error ? (
                  <div style={styles.centerBox}>
                    <span style={{ fontSize: '24px' }}>⚠️</span>
                    <p style={styles.errorText}>{error}</p>
                    <button
                      onClick={() => fetchCuratedNews(temasPreferidos)}
                      style={styles.retryButton}
                    >
                      Reintentar
                    </button>
                  </div>
                ) : noticiaActiva ? (
                  <div style={styles.newsCard}>
                    {/* Encabezado: Categoría & Contador */}
                    <div style={styles.cardHeader}>
                      <span style={styles.categoryBadge}>
                        {noticiaActiva.categoria}
                      </span>
                      <span style={styles.counterBadge}>
                        {indiceActual + 1}/{news.length}
                      </span>
                    </div>

                    {/* Titular súper corto */}
                    <h1 style={styles.newsTitle}>
                      {noticiaActiva.titular || 'Actualización de última hora'}
                    </h1>

                    {/* Resumen de una línea */}
                    <p style={styles.newsSummary}>
                      {noticiaActiva.resumen}
                    </p>

                    {/* Meta Info (Fuente & Tiempo) */}
                    <div style={styles.metaRow}>
                      <span style={styles.metaFuente}>{noticiaActiva.fuente}</span>
                      <span style={styles.metaBullet}>•</span>
                      <span style={styles.metaTiempo}>{noticiaActiva.tiempo}</span>
                    </div>

                    {/* Botón de acción: Siguiente Noticia (Guarda en Historial) */}
                    <div style={styles.feedActions}>
                      <button
                        onClick={retrocederNoticia}
                        style={styles.btnSecondary}
                        title="Noticia anterior"
                      >
                        ◀
                      </button>
                      <button
                        onClick={avanzarNoticia}
                        style={styles.btnPrimaryNext}
                        title="Avanzar y guardar en historial"
                      >
                        Siguiente Noticia ➔
                      </button>
                    </div>
                  </div>
                ) : (
                  <div style={styles.centerBox}>
                    <p style={styles.emptyText}>No hay noticias disponibles.</p>
                  </div>
                )}
              </div>
            )}

            {/* VISTA 2: AJUSTES & PROGRAMACIÓN DE ALERTAS */}
            {vistaActual === 'ajustes' && (
              <div style={styles.settingsContainer}>
                <h2 style={styles.viewTitle}>⚙️ Preferencias</h2>
                
                {/* Selector de Temas para Gemini */}
                <div style={styles.sectionBox}>
                  <label style={styles.sectionLabel}>Temas de Interés (Gemini):</label>
                  <div style={styles.chipsGrid}>
                    {TEMAS_DISPONIBLES.map(tema => {
                      const activo = temasPreferidos.includes(tema);
                      return (
                        <button
                          key={tema}
                          onClick={() => toggleTema(tema)}
                          style={{
                            ...styles.chipButton,
                            ...(activo ? styles.chipButtonActive : styles.chipButtonInactive)
                          }}
                        >
                          {activo ? '✓ ' : '+ '} {tema}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* Programador de Hora de Notificación */}
                <div style={styles.sectionBox}>
                  <label style={styles.sectionLabel}>Hora de Alerta Diaria:</label>
                  <div style={styles.timePickerRow}>
                    <input
                      type="time"
                      value={horaNotificacion}
                      onChange={(e) => setHoraNotificacion(e.target.value)}
                      style={styles.timeInput}
                    />
                    <button
                      onClick={() => programarAlerta(horaNotificacion)}
                      style={styles.btnSaveAlert}
                    >
                      Programar
                    </button>
                  </div>
                  <small style={styles.alertNotice}>
                    Simula el registro de cronjob local / AlarmManager nativo en Wear OS.
                  </small>
                </div>

                {/* Botón para forzar actualización con Gemini */}
                <button
                  onClick={() => {
                    triggerHaptic();
                    fetchCuratedNews(temasPreferidos);
                    setVistaActual('feed');
                  }}
                  style={styles.btnRefreshGemini}
                >
                  ⚡ Regenerar Feed con Temas
                </button>
              </div>
            )}

            {/* VISTA 3: HISTORIAL DE NOTICIAS LEÍDAS (Máximo 10) */}
            {vistaActual === 'historial' && (
              <div style={styles.historyContainer}>
                <div style={styles.historyHeader}>
                  <h2 style={styles.viewTitle}>📜 Historial ({historial.length}/10)</h2>
                  {historial.length > 0 && (
                    <button
                      onClick={() => {
                        triggerHaptic();
                        setHistorial([]);
                        mostrarToast('Historial vaciado');
                      }}
                      style={styles.btnClearHistory}
                    >
                      Limpiar
                    </button>
                  )}
                </div>

                {historial.length === 0 ? (
                  <div style={styles.centerBox}>
                    <span style={{ fontSize: '28px', opacity: 0.6 }}>📭</span>
                    <p style={styles.emptyText}>Aún no has leído noticias en esta sesión.</p>
                    <small style={styles.subtextTopics}>
                      Avanza en el Feed para acumular hasta 10 noticias.
                    </small>
                  </div>
                ) : (
                  <div style={styles.historyList}>
                    {historial.map((item, index) => (
                      <div key={`${item.id}-${index}`} style={styles.historyCard}>
                        <div style={styles.historyCardTop}>
                          <span style={styles.historyCategory}>{item.categoria}</span>
                          <span style={styles.historyTime}>{item.leidoEn || item.tiempo}</span>
                        </div>
                        <strong style={styles.historyTitle}>{item.titular || item.resumen}</strong>
                        <p style={styles.historyExcerpt}>{item.resumen}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* -------------------------------------------------------------
              MENÚ DE NAVEGACIÓN INFERIOR (Diseño Vibrante Stitch)
             ------------------------------------------------------------- */}
          <nav style={styles.bottomNav}>
            <button
              onClick={() => {
                triggerHaptic();
                setVistaActual('feed');
              }}
              style={{
                ...styles.navButton,
                ...(vistaActual === 'feed' ? styles.navButtonActive : {})
              }}
              title="Feed de Noticias"
            >
              <span style={styles.navIcon}>📰</span>
              <span style={styles.navLabel}>Feed</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic();
                setVistaActual('ajustes');
              }}
              style={{
                ...styles.navButton,
                ...(vistaActual === 'ajustes' ? styles.navButtonActive : {})
              }}
              title="Ajustes y Temas"
            >
              <span style={styles.navIcon}>⚙️</span>
              <span style={styles.navLabel}>Ajustes</span>
            </button>

            <button
              onClick={() => {
                triggerHaptic();
                setVistaActual('historial');
              }}
              style={{
                ...styles.navButton,
                ...(vistaActual === 'historial' ? styles.navButtonActive : {})
              }}
              title="Historial de Lectura"
            >
              <div style={styles.badgeWrapper}>
                <span style={styles.navIcon}>📜</span>
                {historial.length > 0 && (
                  <span style={styles.historyBadgeCount}>{historial.length}</span>
                )}
              </div>
              <span style={styles.navLabel}>Historial</span>
            </button>
          </nav>
        </div>
      </div>

      {/* Panel Informativo de Especificación Wear OS / Mobile */}
      <div style={styles.deviceInfoPanel}>
        <h3 style={styles.deviceInfoTitle}>
          Visor de Resúmenes de Noticias del Día • DailyBrief AI
        </h3>
        <p style={styles.deviceInfoText}>
          Diseño visual vibrante inspirado en Stitch para Wear OS y React Native. 
          Incluye integración con el SDK de Gemini (filtrado por temas), gestión de estado global, 
          memoria de historial LIFO acotada a 10 elementos y simulación de cronjobs nativos.
        </p>
        <div style={styles.tagRow}>
          <span style={styles.tag}>Wear OS 5.0</span>
          <span style={styles.tag}>React Native Ready</span>
          <span style={styles.tag}>Gemini SDK</span>
          <span style={styles.tag}>AlarmManager Sim</span>
        </div>
      </div>
    </div>
  );
}

// -------------------------------------------------------------
// ESTILOS VISUALES VIBRANTES DE STITCH PARA WEAR OS
// -------------------------------------------------------------
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    backgroundColor: '#05070E',
    backgroundImage: 'radial-gradient(circle at 50% 20%, rgba(139, 92, 246, 0.15), transparent 70%), radial-gradient(circle at 80% 80%, rgba(6, 182, 212, 0.12), transparent 60%)',
    padding: '20px',
    boxSizing: 'border-box',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif',
    color: '#FFFFFF'
  },
  watchBezel: {
    position: 'relative',
    width: '380px',
    height: '380px',
    borderRadius: '50%',
    backgroundColor: '#111420',
    padding: '12px',
    boxSizing: 'border-box',
    boxShadow: '0 25px 60px -10px rgba(0, 0, 0, 0.9), 0 0 40px rgba(139, 92, 246, 0.25), inset 0 0 15px rgba(255, 255, 255, 0.08)',
    border: '3px solid #232738',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  },
  digitalCrown: {
    position: 'absolute',
    right: '-14px',
    top: '110px',
    width: '14px',
    height: '48px',
    backgroundColor: '#2A2E42',
    border: '1px solid #4B526D',
    borderRadius: '4px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '2px 0 8px rgba(0, 0, 0, 0.5)',
    zIndex: 10
  },
  crownNotch: {
    width: '6px',
    height: '24px',
    borderTop: '2px solid #8B5CF6',
    borderBottom: '2px solid #8B5CF6'
  },
  hardwareButton: {
    position: 'absolute',
    right: '-10px',
    top: '220px',
    width: '10px',
    height: '36px',
    backgroundColor: '#24283B',
    border: '1px solid #3E445C',
    borderRadius: '3px',
    cursor: 'pointer',
    boxShadow: '2px 0 6px rgba(0, 0, 0, 0.4)',
    zIndex: 10
  },
  watchScreen: {
    width: '100%',
    height: '100%',
    borderRadius: '50%',
    backgroundColor: '#000000',
    overflow: 'hidden',
    position: 'relative',
    display: 'flex',
    flexDirection: 'column',
    boxShadow: 'inset 0 0 35px rgba(0, 0, 0, 0.95)'
  },
  statusBar: {
    height: '42px',
    paddingTop: '10px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingLeft: '65px',
    paddingRight: '65px',
    boxSizing: 'border-box',
    fontSize: '11px',
    fontWeight: 600,
    color: '#9CA3AF',
    zIndex: 5
  },
  statusTime: {
    color: '#F3F4F6',
    letterSpacing: '0.5px'
  },
  statusIcons: {
    display: 'flex',
    alignItems: 'center',
    gap: '6px'
  },
  badgePulse: {
    color: '#06B6D4',
    fontSize: '10px',
    fontWeight: 700,
    textShadow: '0 0 8px rgba(6, 182, 212, 0.8)'
  },
  batteryChip: {
    color: '#10B981',
    fontSize: '10px'
  },
  toastBanner: {
    position: 'absolute',
    top: '46px',
    left: '50%',
    transform: 'translateX(-50%)',
    width: '82%',
    backgroundColor: 'rgba(139, 92, 246, 0.92)',
    backdropFilter: 'blur(8px)',
    color: '#FFFFFF',
    padding: '6px 12px',
    borderRadius: '20px',
    textAlign: 'center',
    boxShadow: '0 4px 15px rgba(139, 92, 246, 0.5)',
    zIndex: 20,
    animation: 'fadeIn 0.3s ease'
  },
  toastText: {
    fontSize: '11px',
    fontWeight: 600,
    lineHeight: '1.2'
  },
  screenContent: {
    flex: 1,
    overflowY: 'auto',
    padding: '0 32px',
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    scrollbarWidth: 'none'
  },
  feedContainer: {
    display: 'flex',
    flexDirection: 'column',
    justifyContent: 'center',
    minHeight: '100%',
    paddingBottom: '8px'
  },
  newsCard: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    textAlign: 'center'
  },
  cardHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: '6px'
  },
  categoryBadge: {
    backgroundColor: 'rgba(139, 92, 246, 0.22)',
    border: '1px solid rgba(139, 92, 246, 0.5)',
    color: '#C084FC',
    fontSize: '10px',
    fontWeight: 700,
    padding: '2px 8px',
    borderRadius: '12px',
    textTransform: 'uppercase',
    letterSpacing: '0.8px'
  },
  counterBadge: {
    fontSize: '10px',
    color: '#6B7280',
    fontWeight: 600
  },
  newsTitle: {
    fontSize: '15px',
    lineHeight: '1.25',
    fontWeight: 800,
    margin: '4px 0 6px 0',
    color: '#FFFFFF',
    background: 'linear-gradient(135deg, #FFFFFF 30%, #A5B4FC 100%)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  newsSummary: {
    fontSize: '12px',
    lineHeight: '1.35',
    color: '#D1D5DB',
    margin: '0 0 8px 0',
    padding: '6px 10px',
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    borderRadius: '10px',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
    fontSize: '10px',
    color: '#9CA3AF',
    marginBottom: '10px'
  },
  metaFuente: {
    color: '#06B6D4',
    fontWeight: 600
  },
  metaBullet: {
    color: '#4B5563'
  },
  metaTiempo: {
    color: '#9CA3AF'
  },
  feedActions: {
    display: 'flex',
    gap: '8px',
    width: '100%',
    justifyContent: 'center'
  },
  btnSecondary: {
    backgroundColor: '#1E2235',
    color: '#FFFFFF',
    border: '1px solid #374151',
    borderRadius: '20px',
    padding: '8px 12px',
    fontSize: '12px',
    cursor: 'pointer'
  },
  btnPrimaryNext: {
    flex: 1,
    background: 'linear-gradient(135deg, #8B5CF6 0%, #06B6D4 100%)',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '20px',
    padding: '8px 14px',
    fontSize: '12px',
    fontWeight: 700,
    cursor: 'pointer',
    boxShadow: '0 4px 12px rgba(139, 92, 246, 0.4)'
  },
  settingsContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: '6px',
    paddingBottom: '16px'
  },
  viewTitle: {
    fontSize: '13px',
    fontWeight: 700,
    color: '#F3F4F6',
    margin: '0 0 10px 0',
    textAlign: 'center'
  },
  sectionBox: {
    width: '100%',
    marginBottom: '10px',
    backgroundColor: 'rgba(255, 255, 255, 0.03)',
    borderRadius: '12px',
    padding: '8px',
    boxSizing: 'border-box',
    border: '1px solid rgba(255, 255, 255, 0.06)'
  },
  sectionLabel: {
    display: 'block',
    fontSize: '10px',
    fontWeight: 600,
    color: '#9CA3AF',
    marginBottom: '6px'
  },
  chipsGrid: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '4px',
    justifyContent: 'center'
  },
  chipButton: {
    border: 'none',
    padding: '4px 8px',
    borderRadius: '12px',
    fontSize: '10px',
    fontWeight: 600,
    cursor: 'pointer',
    transition: 'all 0.2s ease'
  },
  chipButtonActive: {
    backgroundColor: '#8B5CF6',
    color: '#FFFFFF',
    boxShadow: '0 2px 6px rgba(139, 92, 246, 0.4)'
  },
  chipButtonInactive: {
    backgroundColor: '#1F2437',
    color: '#9CA3AF',
    border: '1px solid #374151'
  },
  timePickerRow: {
    display: 'flex',
    gap: '6px',
    alignItems: 'center'
  },
  timeInput: {
    backgroundColor: '#0F1322',
    border: '1px solid #4B5563',
    borderRadius: '8px',
    color: '#FFFFFF',
    padding: '4px 8px',
    fontSize: '12px',
    fontWeight: 600,
    flex: 1,
    outline: 'none',
    colorScheme: 'dark'
  },
  btnSaveAlert: {
    backgroundColor: '#06B6D4',
    color: '#000000',
    border: 'none',
    borderRadius: '8px',
    padding: '6px 10px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer'
  },
  alertNotice: {
    display: 'block',
    fontSize: '9px',
    color: '#6B7280',
    marginTop: '4px',
    lineHeight: '1.2'
  },
  btnRefreshGemini: {
    width: '100%',
    backgroundColor: 'rgba(139, 92, 246, 0.15)',
    border: '1px solid #8B5CF6',
    color: '#C084FC',
    borderRadius: '16px',
    padding: '8px',
    fontSize: '11px',
    fontWeight: 700,
    cursor: 'pointer',
    marginTop: '4px'
  },
  historyContainer: {
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    paddingBottom: '16px'
  },
  historyHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '8px'
  },
  btnClearHistory: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#EF4444',
    fontSize: '10px',
    fontWeight: 600,
    cursor: 'pointer'
  },
  historyList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
    width: '100%'
  },
  historyCard: {
    backgroundColor: 'rgba(255, 255, 255, 0.04)',
    border: '1px solid rgba(255, 255, 255, 0.08)',
    borderRadius: '10px',
    padding: '8px',
    textAlign: 'left'
  },
  historyCardTop: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: '3px'
  },
  historyCategory: {
    fontSize: '9px',
    color: '#06B6D4',
    fontWeight: 700,
    textTransform: 'uppercase'
  },
  historyTime: {
    fontSize: '9px',
    color: '#9CA3AF'
  },
  historyTitle: {
    display: 'block',
    fontSize: '11px',
    lineHeight: '1.25',
    color: '#F3F4F6',
    marginBottom: '2px'
  },
  historyExcerpt: {
    fontSize: '10px',
    color: '#9CA3AF',
    margin: 0,
    lineHeight: '1.2'
  },
  bottomNav: {
    height: '56px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-around',
    paddingBottom: '8px',
    backgroundColor: 'rgba(10, 12, 22, 0.95)',
    borderTop: '1px solid rgba(255, 255, 255, 0.06)',
    zIndex: 10
  },
  navButton: {
    background: 'none',
    border: 'none',
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '2px',
    cursor: 'pointer',
    color: '#6B7280',
    padding: '4px 10px',
    borderRadius: '12px',
    transition: 'all 0.2s ease'
  },
  navButtonActive: {
    color: '#06B6D4',
    transform: 'translateY(-2px)'
  },
  navIcon: {
    fontSize: '15px'
  },
  navLabel: {
    fontSize: '9px',
    fontWeight: 600,
    letterSpacing: '0.3px'
  },
  badgeWrapper: {
    position: 'relative',
    display: 'inline-block'
  },
  historyBadgeCount: {
    position: 'absolute',
    top: '-4px',
    right: '-8px',
    backgroundColor: '#8B5CF6',
    color: '#FFFFFF',
    fontSize: '8px',
    fontWeight: 700,
    width: '14px',
    height: '14px',
    borderRadius: '50%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 0 6px rgba(139, 92, 246, 0.8)'
  },
  centerBox: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '160px',
    textAlign: 'center',
    gap: '6px'
  },
  spinner: {
    width: '24px',
    height: '24px',
    border: '3px solid rgba(139, 92, 246, 0.2)',
    borderTop: '3px solid #06B6D4',
    borderRadius: '50%',
    animation: 'spin 0.8s linear infinite'
  },
  loadingText: {
    fontSize: '11px',
    color: '#E5E7EB',
    margin: 0,
    fontWeight: 500
  },
  subtextTopics: {
    fontSize: '10px',
    color: '#8B5CF6',
    fontWeight: 600
  },
  errorText: {
    fontSize: '11px',
    color: '#F87171',
    margin: 0
  },
  retryButton: {
    backgroundColor: '#374151',
    color: '#FFFFFF',
    border: 'none',
    borderRadius: '12px',
    padding: '4px 12px',
    fontSize: '10px',
    cursor: 'pointer',
    marginTop: '6px'
  },
  emptyText: {
    fontSize: '11px',
    color: '#9CA3AF',
    margin: 0
  },
  deviceInfoPanel: {
    marginTop: '24px',
    maxWidth: '480px',
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.02)',
    padding: '16px 20px',
    borderRadius: '16px',
    border: '1px solid rgba(255, 255, 255, 0.08)'
  },
  deviceInfoTitle: {
    fontSize: '15px',
    fontWeight: 700,
    color: '#FFFFFF',
    margin: '0 0 8px 0',
    background: 'linear-gradient(90deg, #A78BFA, #38BDF8)',
    WebkitBackgroundClip: 'text',
    WebkitTextFillColor: 'transparent'
  },
  deviceInfoText: {
    fontSize: '12px',
    lineHeight: '1.5',
    color: '#9CA3AF',
    margin: '0 0 12px 0'
  },
  tagRow: {
    display: 'flex',
    gap: '8px',
    justifyContent: 'center',
    flexWrap: 'wrap'
  },
  tag: {
    fontSize: '10px',
    fontWeight: 600,
    color: '#38BDF8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.3)',
    padding: '3px 8px',
    borderRadius: '8px'
  }
};
