import React, { useState, useEffect } from 'react';
import { X, UserCheck, Calendar, Clock, MapPin, Camera, LogIn, LogOut } from 'lucide-react';

export default function SelfiePreviewModal({ isOpen, onClose, data }) {
  if (!isOpen || !data) return null;

  const hasCheckIn = !!(data.checkInSelfie || (data.selfieUrl && data.type !== 'checkout'));
  const hasCheckOut = !!(data.checkOutSelfie || (data.selfieUrl && data.type === 'checkout'));

  const checkInUrl = data.checkInSelfie || (!hasCheckOut ? data.selfieUrl : null);
  const checkOutUrl = data.checkOutSelfie || (data.type === 'checkout' ? data.selfieUrl : null);

  // Tab state: 'checkin' | 'checkout'
  const [activeTab, setActiveTab] = useState(
    data.initialTab || (checkInUrl ? 'checkin' : 'checkout')
  );

  useEffect(() => {
    if (data.initialTab) {
      setActiveTab(data.initialTab);
    } else if (checkInUrl) {
      setActiveTab('checkin');
    } else if (checkOutUrl) {
      setActiveTab('checkout');
    }
  }, [data]);

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 99999 }}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '480px', width: '100%' }}>
        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Camera size={20} color="#10b981" /> {data.title || 'รูปถ่าย Selfie ยืนยันตัวตน'}
            </h3>
            {data.userName && (
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
                พนักงาน: <b style={{ color: '#fff' }}>{data.userName}</b>
              </p>
            )}
          </div>
          <button className="btn btn-outline btn-sm btn-icon" onClick={onClose}>
            <X size={18} />
          </button>
        </div>

        {/* Tab switch if both selfies exist */}
        {checkInUrl && checkOutUrl && (
          <div style={{ display: 'flex', gap: '8px', marginBottom: '14px', background: 'rgba(0,0,0,0.3)', padding: '4px', borderRadius: '10px' }}>
            <button
              className="btn btn-sm"
              style={{
                flex: 1,
                background: activeTab === 'checkin' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'checkin' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
              }}
              onClick={() => setActiveTab('checkin')}
            >
              🟢 รูปเข้างาน (Check-in)
            </button>
            <button
              className="btn btn-sm"
              style={{
                flex: 1,
                background: activeTab === 'checkout' ? 'var(--primary)' : 'transparent',
                color: activeTab === 'checkout' ? '#fff' : 'var(--text-secondary)',
                fontWeight: 600,
              }}
              onClick={() => setActiveTab('checkout')}
            >
              🔴 รูปออกงาน (Check-out)
            </button>
          </div>
        )}

        {/* Image Container */}
        <div
          style={{
            width: '100%',
            height: '380px',
            borderRadius: 'var(--radius-lg)',
            overflow: 'hidden',
            background: '#090d16',
            border: '1px solid var(--border-subtle)',
            marginBottom: '14px',
            position: 'relative',
          }}
        >
          {activeTab === 'checkin' ? (
            checkInUrl ? (
              <img
                src={checkInUrl}
                alt="Check-in Selfie"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                ไม่มีรูปถ่ายตอนเข้างาน
              </div>
            )
          ) : (
            checkOutUrl ? (
              <img
                src={checkOutUrl}
                alt="Check-out Selfie"
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            ) : (
              <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}>
                ไม่มีรูปถ่ายตอนออกงาน
              </div>
            )
          )}

          {/* Badge indicator on photo */}
          <div
            style={{
              position: 'absolute',
              top: '12px',
              left: '12px',
              padding: '4px 10px',
              borderRadius: '20px',
              fontSize: '0.8rem',
              fontWeight: 700,
              backdropFilter: 'blur(8px)',
              background: activeTab === 'checkin' ? 'rgba(16, 185, 129, 0.85)' : 'rgba(239, 68, 68, 0.85)',
              color: '#fff',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
            }}
          >
            {activeTab === 'checkin' ? <LogIn size={14} /> : <LogOut size={14} />}
            {activeTab === 'checkin' ? 'เข้างาน (Check-in)' : 'ออกงาน (Check-out)'}
          </div>
        </div>

        {/* Details Card */}
        <div className="glass-panel" style={{ padding: '12px 16px', display: 'flex', flexDirection: 'column', gap: '6px', fontSize: '0.85rem' }}>
          {activeTab === 'checkin' ? (
            <>
              {data.checkInTime && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>เวลาเข้างาน:</span>
                  <span style={{ fontWeight: 600, color: '#10b981' }}>{new Date(data.checkInTime).toLocaleString('th-TH')}</span>
                </div>
              )}
              {data.checkInAccuracy && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ความแม่นยำ GPS:</span>
                  <span style={{ color: '#10b981' }}>±{data.checkInAccuracy} เมตร</span>
                </div>
              )}
            </>
          ) : (
            <>
              {data.checkOutTime && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>เวลาออกงาน:</span>
                  <span style={{ fontWeight: 600, color: '#ef4444' }}>{new Date(data.checkOutTime).toLocaleString('th-TH')}</span>
                </div>
              )}
              {data.checkOutAccuracy && (
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ color: 'var(--text-muted)' }}>ความแม่นยำ GPS:</span>
                  <span style={{ color: '#ef4444' }}>±{data.checkOutAccuracy} เมตร</span>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
