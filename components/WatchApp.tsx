"use client";

import React, { useState, useEffect } from 'react';
import { NewsItem } from '../types';

export default function WatchApp() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<boolean>(false);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch('/api/daily-brief');
        if (!res.ok) {
          throw new Error('Error en la respuesta de la API');
        }
        const data: NewsItem[] = await res.json();
        setNews(data);
      } catch (err) {
        console.error('Error fetching news:', err);
        setError(true);
      } finally {
        setLoading(false);
      }
    };

    fetchNews();
  }, []);

  if (loading) {
    return <div>Cargando noticias...</div>;
  }

  if (error) {
    return <div>Error al cargar</div>;
  }

  return (
    <div>
      <h2>DailyBrief AI</h2>
      {news.map((noticia) => (
        <div key={noticia.id} style={{ marginBottom: '10px' }}>
          <strong>{noticia.categoria}</strong> - {noticia.resumen}
          <br />
          <small>{noticia.fuente} • {noticia.tiempo}</small>
        </div>
      ))}
    </div>
  );
}
