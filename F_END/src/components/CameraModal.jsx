import React, { useRef, useState, useEffect } from 'react';
import { Camera, RefreshCw, Check, X, AlertCircle } from 'lucide-react';

export default function CameraModal({ isOpen, onClose, onCapture, title = 'ถ่ายรูป Selfie เพื่อยืนยันตัวตน' }) {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);
  const [preview, setPreview] = useState(null);
  const [cameraError, setCameraError] = useState(null);

  const startCamera = async () => {
    try {
      setCameraError(null);
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }

      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('เบราว์เซอร์ไม่อนุญาตให้เปิดกล้องบนการเชื่อมต่อที่ไม่ปลอดภัย (ต้องใช้งานผ่าน HTTPS หรือ localhost)');
      }

      const constraints = {
        video: {
          facingMode: 'user',
          width: { ideal: 640 },
          height: { ideal: 640 },
        },
      };

      const mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.warn('Camera access failed or unavailable:', err);
      const isHttp = window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';
      if (isHttp) {
        setCameraError('เบราว์เซอร์บล็อกการเปิดกล้องเพราะเข้าผ่าน HTTP (จำเป็นต้องใช้ HTTPS เช่น Cloudflare Tunnel หรือ Localtunnel เพื่อความปลอดภัย)');
      } else {
        setCameraError('ไม่สามารถเข้าถึงกล้องหน้าได้ กรุณาอนุญาต (Allow) การใช้งานกล้องในเบราว์เซอร์');
      }
    }
  };

  useEffect(() => {
    if (isOpen) {
      setPreview(null);
      startCamera();
    } else {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
        setStream(null);
      }
    }
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [isOpen]);

  const takePhoto = () => {
    if (!videoRef.current) return;
    const video = videoRef.current;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;

    const ctx = canvas.getContext('2d');
    // Mirror front camera
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

    const base64 = canvas.toDataURL('image/jpeg', 0.85);
    setPreview(base64);
  };

  const handleConfirm = () => {
    if (preview) {
      onCapture(preview);
      onClose();
    }
  };

  const retake = () => {
    setPreview(null);
    startCamera();
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ fontSize: '1.15rem', fontWeight: '600', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <Camera size={20} color="#006633" /> {title}
          </h3>
          <button className="btn btn-outline btn-sm btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Camera View / Preview */}
        <div
          style={{
            position: 'relative',
            width: '100%',
            height: '340px',
            background: '#090d16',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            border: '2px dashed var(--border-highlight)',
          }}
        >
          {preview ? (
            <img
              src={preview}
              alt="Selfie Preview"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          ) : cameraError ? (
            <div style={{ padding: '24px', textAlign: 'center', color: 'var(--text-secondary)' }}>
              <AlertCircle size={40} color="#ef4444" style={{ margin: '0 auto 12px' }} />
              <p style={{ fontSize: '0.92rem', color: '#f87171', fontWeight: 600, marginBottom: '8px' }}>
                ไม่สามารถเปิดกล้องสดได้
              </p>
              <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '16px' }}>
                {cameraError}
              </p>
              <button className="btn btn-outline btn-sm" onClick={startCamera}>
                <RefreshCw size={14} /> ลองเปิดกล้องใหม่อีกครั้ง
              </button>
            </div>
          ) : (
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              style={{
                width: '100%',
                height: '100%',
                objectFit: 'cover',
                transform: 'scaleX(-1)',
              }}
            />
          )}

          {/* Guidelines overlay */}
          {!preview && !cameraError && (
            <div
              style={{
                position: 'absolute',
                width: '200px',
                height: '240px',
                border: '2px dashed rgba(255,255,255,0.4)',
                borderRadius: '50%',
                pointerEvents: 'none',
              }}
            />
          )}
        </div>

        {/* Controls */}
        <div style={{ marginTop: '20px', display: 'flex', justifyContent: 'center', gap: '12px' }}>
          {preview ? (
            <>
              <button className="btn btn-outline" onClick={retake}>
                <RefreshCw size={18} /> ถ่ายใหม่
              </button>
              <button className="btn btn-success" onClick={handleConfirm}>
                <Check size={18} /> ยืนยันรูปนี้
              </button>
            </>
          ) : !cameraError ? (
            <button className="btn btn-primary btn-lg" onClick={takePhoto} style={{ minWidth: '180px' }}>
              <Camera size={20} /> ถ่ายรูปสด
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
