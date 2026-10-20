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

  // 3. LÓGICA DEL HISTORIAL (Al avanzar, agrega al inicio con tope de 10)
  const avanzarNoticia = () => {
    if (news.length === 0) return;

    const noticiaActual = news[indiceActual];
    if (noticiaActual) {
      const itemConFecha: NewsItem = {
        ...noticiaActual,
        leidoEn: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
      };

      setHistorial(prevHistorial => {
        // Prevenir duplicados y agregar al inicio
        const filtrado = prevHistorial.filter(item => item.id !== itemConFecha.id);
        const nuevo = [itemConFecha, ...filtrado];
        // Limitar array a los últimos 10 elementos para no saturar la memoria del reloj
        return nuevo.slice(0, 10);
      });
    }

    setIndiceActual(prev => (prev + 1) % news.length);
  };

  return (
    <div style={{ padding: 20, color: '#fff', background: '#0B0D17', minHeight: '100vh' }}>
      <h2>Visor de Resúmenes de Noticias del Día - DailyBrief AI</h2>
      <p>Vista actual: {vistaActual} | Hora alerta: {horaNotificacion}</p>
      <nav style={{ display: 'flex', gap: 10 }}>
        <button onClick={() => setVistaActual('feed')}>Feed</button>
        <button onClick={() => setVistaActual('ajustes')}>Ajustes</button>
        <button onClick={() => setVistaActual('historial')}>Historial ({historial.length}/10)</button>
      </nav>
      {loading ? <p>Cargando noticias...</p> : error ? <p>{error}</p> : (
        <div>
          <h3>{news[indiceActual]?.titular}</h3>
          <p>{news[indiceActual]?.resumen}</p>
          <button onClick={avanzarNoticia}>Siguiente Noticia (Guardar en Historial)</button>
        </div>
      )}
    </div>
  );
}
