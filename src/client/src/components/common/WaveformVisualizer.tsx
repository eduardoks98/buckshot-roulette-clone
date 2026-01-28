// ==========================================
// WAVEFORM VISUALIZER - Audio Selection Component
// Visual waveform display with region selection
// ==========================================

import { useRef, useEffect, useState, useCallback, MouseEvent } from 'react';
import './WaveformVisualizer.css';

export interface WaveformVisualizerProps {
  audioBuffer: AudioBuffer | null;
  start: number;           // Selection start in seconds
  duration: number;        // Selection duration in seconds
  onSelectionChange: (start: number, duration: number) => void;
  isPlaying?: boolean;
  currentTime?: number;    // Current playback time in seconds
  isLoading?: boolean;
}

export function WaveformVisualizer({
  audioBuffer,
  start,
  duration,
  onSelectionChange,
  isPlaying = false,
  currentTime = 0,
  isLoading = false,
}: WaveformVisualizerProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isDragging, setIsDragging] = useState<'start' | 'end' | 'region' | null>(null);
  const [dragStartX, setDragStartX] = useState(0);
  const [dragStartValue, setDragStartValue] = useState({ start: 0, duration: 0 });

  const totalDuration = audioBuffer?.duration ?? 0;

  // Draw waveform on canvas
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || !audioBuffer) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;
    const centerY = height / 2;

    // Clear canvas
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, width, height);

    // Get audio data (mono mix)
    const rawData = audioBuffer.getChannelData(0);
    const samples = width * 2; // 2 samples per pixel for detail
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData: number[] = [];

    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j] || 0);
      }
      filteredData.push(sum / blockSize);
    }

    // Normalize
    const maxAmplitude = Math.max(...filteredData);
    const normalizedData = filteredData.map(v => v / maxAmplitude);

    // Calculate selection region in pixels
    const startPx = (start / totalDuration) * width;
    const endPx = ((start + duration) / totalDuration) * width;

    // Draw unselected region (dimmed)
    ctx.fillStyle = 'rgba(100, 100, 100, 0.4)';
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * width;
      const barHeight = normalizedData[i] * (height * 0.8);

      // Skip if in selection region (draw later with highlight)
      if (x >= startPx && x <= endPx) continue;

      ctx.fillRect(x, centerY - barHeight / 2, Math.max(1, width / samples - 1), barHeight);
    }

    // Draw selection highlight background
    ctx.fillStyle = 'rgba(16, 185, 129, 0.15)';
    ctx.fillRect(startPx, 0, endPx - startPx, height);

    // Draw selected region (highlighted)
    ctx.fillStyle = '#10b981';
    for (let i = 0; i < samples; i++) {
      const x = (i / samples) * width;
      const barHeight = normalizedData[i] * (height * 0.8);

      // Only draw in selection region
      if (x < startPx || x > endPx) continue;

      ctx.fillRect(x, centerY - barHeight / 2, Math.max(1, width / samples - 1), barHeight);
    }

    // Draw selection handles
    const handleWidth = 4;

    // Start handle
    ctx.fillStyle = '#10b981';
    ctx.fillRect(startPx - handleWidth / 2, 0, handleWidth, height);

    // End handle
    ctx.fillRect(endPx - handleWidth / 2, 0, handleWidth, height);

    // Draw playhead if playing
    if (isPlaying && currentTime >= 0) {
      const playheadX = (currentTime / totalDuration) * width;
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(playheadX - 1, 0, 2, height);
    }

  }, [audioBuffer, start, duration, totalDuration, isPlaying, currentTime]);

  // Format time as mm:ss.ms
  const formatTime = useCallback((seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 100);
    return `${mins}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(2, '0')}`;
  }, []);

  // Get position from mouse event
  const getPositionFromEvent = useCallback((e: MouseEvent): number => {
    const canvas = canvasRef.current;
    if (!canvas || !totalDuration) return 0;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const ratio = x / rect.width;
    return Math.max(0, Math.min(totalDuration, ratio * totalDuration));
  }, [totalDuration]);

  // Check if mouse is near a handle
  const getHitTarget = useCallback((e: MouseEvent): 'start' | 'end' | 'region' | null => {
    const canvas = canvasRef.current;
    if (!canvas || !totalDuration) return null;

    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = rect.width;

    const startPx = (start / totalDuration) * width;
    const endPx = ((start + duration) / totalDuration) * width;
    const handleHitZone = 10; // pixels

    if (Math.abs(x - startPx) < handleHitZone) return 'start';
    if (Math.abs(x - endPx) < handleHitZone) return 'end';
    if (x > startPx && x < endPx) return 'region';

    return null;
  }, [start, duration, totalDuration]);

  // Mouse handlers
  const handleMouseDown = useCallback((e: MouseEvent) => {
    const target = getHitTarget(e);
    const position = getPositionFromEvent(e);

    if (target) {
      setIsDragging(target);
      setDragStartX(e.clientX);
      setDragStartValue({ start, duration });
    } else {
      // Click outside selection - move start to click position
      const newStart = Math.min(position, totalDuration - 0.1);
      onSelectionChange(newStart, Math.min(duration, totalDuration - newStart));
    }
  }, [getHitTarget, getPositionFromEvent, start, duration, totalDuration, onSelectionChange]);

  const handleMouseMove = useCallback((e: MouseEvent) => {
    if (!isDragging || !totalDuration) return;

    const canvas = canvasRef.current;
    if (!canvas) return;

    const rect = canvas.getBoundingClientRect();
    const deltaX = e.clientX - dragStartX;
    const deltaTime = (deltaX / rect.width) * totalDuration;

    if (isDragging === 'start') {
      const newStart = Math.max(0, Math.min(dragStartValue.start + deltaTime, dragStartValue.start + dragStartValue.duration - 0.05));
      const newDuration = dragStartValue.start + dragStartValue.duration - newStart;
      onSelectionChange(newStart, newDuration);
    } else if (isDragging === 'end') {
      const newEnd = Math.max(dragStartValue.start + 0.05, Math.min(totalDuration, dragStartValue.start + dragStartValue.duration + deltaTime));
      onSelectionChange(dragStartValue.start, newEnd - dragStartValue.start);
    } else if (isDragging === 'region') {
      const newStart = Math.max(0, Math.min(totalDuration - dragStartValue.duration, dragStartValue.start + deltaTime));
      onSelectionChange(newStart, dragStartValue.duration);
    }
  }, [isDragging, dragStartX, dragStartValue, totalDuration, onSelectionChange]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(null);
  }, []);

  // Update cursor based on hover
  const handleMouseMoveHover = useCallback((e: MouseEvent) => {
    if (isDragging) return;

    const target = getHitTarget(e);
    const canvas = canvasRef.current;
    if (!canvas) return;

    if (target === 'start' || target === 'end') {
      canvas.style.cursor = 'ew-resize';
    } else if (target === 'region') {
      canvas.style.cursor = 'grab';
    } else {
      canvas.style.cursor = 'crosshair';
    }
  }, [isDragging, getHitTarget]);

  // Global mouse up listener
  useEffect(() => {
    const handleGlobalMouseUp = () => setIsDragging(null);
    window.addEventListener('mouseup', handleGlobalMouseUp);
    return () => window.removeEventListener('mouseup', handleGlobalMouseUp);
  }, []);

  return (
    <div className="waveform-visualizer" ref={containerRef}>
      {isLoading && (
        <div className="waveform-loading">
          <span>Carregando audio...</span>
        </div>
      )}

      <canvas
        ref={canvasRef}
        width={600}
        height={80}
        className={`waveform-canvas ${!audioBuffer ? 'waveform-canvas--empty' : ''}`}
        onMouseDown={handleMouseDown}
        onMouseMove={(e) => {
          handleMouseMoveHover(e);
          if (isDragging) handleMouseMove(e);
        }}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      />

      <div className="waveform-timeline">
        <span className="waveform-time waveform-time--start">0:00</span>
        <span className="waveform-time waveform-time--selection">
          {formatTime(start)} → {formatTime(start + duration)} ({duration.toFixed(2)}s)
        </span>
        <span className="waveform-time waveform-time--end">{formatTime(totalDuration)}</span>
      </div>

      {!audioBuffer && !isLoading && (
        <div className="waveform-placeholder">
          Selecione um arquivo para visualizar
        </div>
      )}
    </div>
  );
}

export default WaveformVisualizer;
