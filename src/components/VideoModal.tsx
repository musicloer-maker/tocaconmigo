'use client';

import React, { useState, useRef } from 'react';
import { MusicianProfile } from '@/types';
import { X, Upload, Camera, AlertCircle, Check, Pause, RefreshCw } from 'lucide-react';

interface VideoModalProps {
  musician?: MusicianProfile | null;
  isMyVideoMode?: boolean;
  onClose: () => void;
  onSaveVideo?: (videoUrl: string, duration: number) => void;
}

export const VideoModal: React.FC<VideoModalProps> = ({
  musician,
  isMyVideoMode = false,
  onClose,
  onSaveVideo,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'record'>('upload');
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState(false);
  const [videoPreviewUrl, setVideoPreviewUrl] = useState<string | null>(musician?.video_url || null);
  const [detectedDuration, setDetectedDuration] = useState<number>(musician?.video_duration_seconds || 0);

  const [isRecording, setIsRecording] = useState(false);
  const [recordingSecondsLeft, setRecordingSecondsLeft] = useState(120);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const videoStreamRef = useRef<HTMLVideoElement | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    setUploadSuccess(false);

    if (!file) return;

    if (!['video/mp4', 'video/webm', 'video/quicktime'].includes(file.type)) {
      setUploadError('Formato no soportado. Por favor sube un vídeo en MP4, WebM o MOV.');
      return;
    }

    const tempVideo = document.createElement('video');
    tempVideo.preload = 'metadata';

    tempVideo.onloadedmetadata = () => {
      window.URL.revokeObjectURL(tempVideo.src);
      const durationSec = Math.round(tempVideo.duration);

      if (durationSec > 120) {
        setUploadError(`El vídeo dura ${Math.floor(durationSec / 60)}m ${durationSec % 60}s. El límite máximo permitido es de 2 minutos (120 segundos).`);
        setVideoPreviewUrl(null);
      } else {
        setDetectedDuration(durationSec);
        const objectUrl = URL.createObjectURL(file);
        setVideoPreviewUrl(objectUrl);
        setUploadError(null);
      }
    };

    tempVideo.src = URL.createObjectURL(file);
  };

  const handleConfirmUpload = () => {
    if (!videoPreviewUrl) return;
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setUploadSuccess(true);
      onSaveVideo?.(videoPreviewUrl, detectedDuration || 45);
      setTimeout(() => {
        onClose();
      }, 1200);
    }, 1500);
  };

  const startWebcamRecording = async () => {
    try {
      setUploadError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      if (videoStreamRef.current) {
        videoStreamRef.current.srcObject = stream;
        videoStreamRef.current.play();
      }

      recordedChunksRef.current = [];
      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const blob = new Blob(recordedChunksRef.current, { type: 'video/webm' });
        const recordedUrl = URL.createObjectURL(blob);
        setVideoPreviewUrl(recordedUrl);
        setDetectedDuration(120 - recordingSecondsLeft);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      setRecordingSecondsLeft(120);

      timerIntervalRef.current = setInterval(() => {
        setRecordingSecondsLeft((prev) => {
          if (prev <= 1) {
            stopWebcamRecording();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } catch (err) {
      setUploadError('No se pudo acceder a la cámara o micrófono. Por favor comprueba los permisos o usa la pestaña de subir archivo.');
    }
  };

  const stopWebcamRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (timerIntervalRef.current) clearInterval(timerIntervalRef.current);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.85)',
      backdropFilter: 'blur(8px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 100,
      padding: '1rem',
    }}>
      <div className="glass-panel" style={{
        maxWidth: '640px',
        width: '100%',
        maxHeight: '90vh',
        overflowY: 'auto',
        padding: '1.5rem',
        position: 'relative',
        border: '1px solid var(--border-glow)',
      }}>
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '16px',
            right: '16px',
            color: 'var(--text-secondary)',
            padding: '6px',
            borderRadius: '50%',
            backgroundColor: 'var(--bg-surface-hover)',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700 }}>
            {isMyVideoMode ? 'Gestión de tu vídeo "Así toco"' : `Vídeo de ${musician?.display_name}`}
          </h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
            El objetivo de este vídeo es dar confianza y mostrar cómo tocas. Máximo 2 minutos (120 s).
          </p>
        </div>

        <div style={{
          backgroundColor: 'rgba(245, 158, 11, 0.08)',
          border: '1px solid rgba(245, 158, 11, 0.2)',
          borderRadius: 'var(--radius-md)',
          padding: '10px 14px',
          fontSize: '0.8rem',
          color: 'var(--accent-gold)',
          marginBottom: '20px',
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
        }}>
          <AlertCircle size={16} flexShrink={0} />
          <span>Recuerda: TocaConmigo no califica la habilidad musical. No hay valoraciones ni estrellas.</span>
        </div>

        {!isMyVideoMode && (
          <div>
            {musician?.video_url ? (
              <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#000' }}>
                <video
                  controls
                  autoPlay
                  src={musician.video_url}
                  style={{ width: '100%', maxHeight: '380px', objectFit: 'contain' }}
                />
              </div>
            ) : (
              <p style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '2rem' }}>
                Este músico aún no ha subido su vídeo.
              </p>
            )}
          </div>
        )}

        {isMyVideoMode && (
          <div>
            <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
              <button
                onClick={() => setActiveTab('upload')}
                className="btn-secondary"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  borderColor: activeTab === 'upload' ? 'var(--accent-amber)' : 'var(--border-color)',
                  color: activeTab === 'upload' ? 'var(--accent-amber)' : 'var(--text-primary)',
                }}
              >
                <Upload size={16} />
                <span>1. Subir archivo de vídeo</span>
              </button>

              <button
                onClick={() => setActiveTab('record')}
                className="btn-secondary"
                style={{
                  flex: 1,
                  justifyContent: 'center',
                  borderColor: activeTab === 'record' ? 'var(--accent-amber)' : 'var(--border-color)',
                  color: activeTab === 'record' ? 'var(--accent-amber)' : 'var(--text-primary)',
                }}
              >
                <Camera size={16} />
                <span>2. Grabar con Webcam</span>
              </button>
            </div>

            {uploadError && (
              <div style={{
                backgroundColor: 'rgba(224, 86, 56, 0.15)',
                border: '1px solid var(--accent-terracotta)',
                color: '#fca5a5',
                padding: '10px 14px',
                borderRadius: 'var(--radius-md)',
                fontSize: '0.85rem',
                marginBottom: '16px',
              }}>
                {uploadError}
              </div>
            )}

            {activeTab === 'upload' && (
              <div style={{ textAlign: 'center' }}>
                <label style={{
                  display: 'block',
                  border: '2px dashed var(--border-color)',
                  borderRadius: 'var(--radius-lg)',
                  padding: '2.5rem 1.5rem',
                  cursor: 'pointer',
                  backgroundColor: 'var(--bg-surface)',
                  transition: 'border-color 0.2s',
                }}>
                  <Upload size={36} style={{ color: 'var(--accent-amber)', marginBottom: '8px' }} />
                  <p style={{ fontWeight: 600, fontSize: '0.95rem' }}>Selecciona tu archivo de vídeo</p>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                    Formatos MP4, WebM o MOV. Máximo 2 minutos (120 seg) y 50 MB.
                  </p>
                  <input
                    type="file"
                    accept="video/mp4,video/webm,video/quicktime"
                    onChange={handleFileChange}
                    style={{ display: 'none' }}
                  />
                </label>
              </div>
            )}

            {activeTab === 'record' && (
              <div style={{ textAlign: 'center' }}>
                <div style={{
                  borderRadius: 'var(--radius-md)',
                  overflow: 'hidden',
                  backgroundColor: '#000',
                  aspectRatio: '16/9',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  position: 'relative',
                  marginBottom: '14px',
                }}>
                  <video
                    ref={videoStreamRef}
                    muted
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />

                  {isRecording && (
                    <div style={{
                      position: 'absolute',
                      top: '12px',
                      right: '12px',
                      backgroundColor: 'rgba(224, 86, 56, 0.9)',
                      color: '#fff',
                      padding: '4px 12px',
                      borderRadius: 'var(--radius-full)',
                      fontWeight: 700,
                      fontSize: '0.9rem',
                    }}>
                      Grabando: {Math.floor(recordingSecondsLeft / 60)}:{String(recordingSecondsLeft % 60).padStart(2, '0')}
                    </div>
                  )}
                </div>

                {!isRecording ? (
                  <button onClick={startWebcamRecording} className="btn-primary" style={{ margin: '0 auto' }}>
                    <Camera size={18} />
                    <span>Iniciar grabación cámara</span>
                  </button>
                ) : (
                  <button onClick={stopWebcamRecording} className="btn-primary" style={{ background: 'var(--accent-terracotta)', color: '#fff', margin: '0 auto' }}>
                    <Pause size={18} />
                    <span>Detener grabación</span>
                  </button>
                )}
              </div>
            )}

            {videoPreviewUrl && (
              <div style={{ marginTop: '20px', paddingTop: '16px', borderTop: '1px solid var(--border-color)' }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '8px' }}>
                  Previsualización del vídeo ({detectedDuration}s detectados)
                </h4>
                <div style={{ borderRadius: 'var(--radius-md)', overflow: 'hidden', backgroundColor: '#000', marginBottom: '14px' }}>
                  <video controls src={videoPreviewUrl} style={{ width: '100%', maxHeight: '250px' }} />
                </div>

                <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
                  <button onClick={() => setVideoPreviewUrl(null)} className="btn-secondary" style={{ fontSize: '0.85rem' }}>
                    <RefreshCw size={14} />
                    <span>Descartar y elegir otro</span>
                  </button>

                  <button onClick={handleConfirmUpload} disabled={isUploading} className="btn-primary" style={{ fontSize: '0.85rem' }}>
                    {uploadSuccess ? (
                      <>
                        <Check size={16} />
                        <span>¡Vídeo guardado con éxito!</span>
                      </>
                    ) : isUploading ? (
                      <span>Guardando vídeo...</span>
                    ) : (
                      <>
                        <Check size={16} />
                        <span>Publicar mi vídeo "Así toco"</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
