"use client";

import React, { useState, useEffect, useCallback } from 'react';
import { NewsItem, VistaActual } from '../types';

export default function WatchApp() {
  // 1. GESTIÓN DE ESTADO GLOBAL
  const [temasPreferidos, setTemasPreferidos] = useState<string[]>([
    'Tecnología',
    'Inteligencia Artificial',
    'Negocios'
  ]);
  const [horaNotificacion, setHoraNotificacion] = useState<string>('08:00');
  const [historial, setHistorial] = useState<NewsItem[]>([]);
  const [vistaActual, setVistaActual] = useState<VistaActual>('feed');

  // Estados locales auxiliares
  const [news, setNews] = useState<NewsItem[]>([]);
  const [indiceActual, setIndiceActual] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  // Motor Gemini conectado al estado global de temas
  const fetchCuratedNews = useCallback(async (temas: string[]) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/daily-brief?temas=${encodeURIComponent(temas.join(','))}`);
      if (!res.ok) throw new Error('Error al consultar Gemini');
      const data: NewsItem[] = await res.json();
      setNews(data);
      setIndiceActual(0);
    } catch (err) {
      console.error(err);
      setError('Error al sincronizar feed');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCuratedNews(temasPreferidos);
  }, [temasPreferidos, fetchCuratedNews]);

  return (
    <div style={{ padding: 20, color: '#fff', background: '#0B0D17', minHeight: '100vh' }}>
      <h2>Visor de Resúmenes de Noticias del Día - DailyBrief AI</h2>
      <p>Vista actual: {vistaActual} | Hora alerta: {horaNotificacion}</p>
      <nav style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setVistaActual('feed')}>Feed</button>
        <button onClick={() => setVistaActual('ajustes')}>Ajustes</button>
        <button onClick={() => setVistaActual('historial')}>Historial ({historial.length})</button>
      </nav>
      {loading ? <p>Cargando noticias...</p> : error ? <p>{error}</p> : (
        <div>
          <h3>{news[indiceActual]?.titular}</h3>
          <p>{news[indiceActual]?.resumen}</p>
        </div>
      )}
    </div>
  );
}
