'use client';
import { useEffect, useRef, useCallback } from 'react';
import Script from 'next/script';

interface Props {
  imageUrl: string;
  height?: number;
}

export default function PannellumViewer({ imageUrl, height = 420 }: Props) {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewerRef    = useRef<any>(null);

  const init = useCallback(() => {
    const pn = (window as any).pannellum;
    if (!pn || !containerRef.current) return;
    if (viewerRef.current) { try { viewerRef.current.destroy(); } catch {} }
    viewerRef.current = pn.viewer(containerRef.current, {
      type: 'equirectangular',
      panorama: imageUrl,
      autoLoad: true,
      showZoomCtrl: false,
      showFullscreenCtrl: true,
      mouseZoom: true,
      hfov: 100,
      minHfov: 50,
      maxHfov: 130,
    });
  }, [imageUrl]);

  useEffect(() => {
    // If Pannellum was already loaded by a previous mount, init immediately
    if ((window as any).pannellum) init();
    return () => {
      if (viewerRef.current) {
        try { viewerRef.current.destroy(); } catch {}
        viewerRef.current = null;
      }
    };
  }, [init]);

  return (
    <>
      {/* eslint-disable-next-line @next/next/no-css-tags */}
      <link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.css" />
      <Script
        src="https://cdn.jsdelivr.net/npm/pannellum@2.5.6/build/pannellum.js"
        strategy="afterInteractive"
        onLoad={init}
      />
      <div ref={containerRef} style={{ width: '100%', height, borderRadius: 16, overflow: 'hidden', background: '#0F172A' }} />
    </>
  );
}
