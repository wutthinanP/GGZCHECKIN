import React, { useState, useEffect } from 'react';
import { PRIMARY_DARK, PRIMARY } from '../styles/tokens';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { api } from '../services/api';
import CameraModal from '../components/CameraModal';
import LiveMapModal from '../components/LiveMapModal';
import SelfiePreviewModal from '../components/SelfiePreviewModal';
import confetti from 'canvas-confetti';
import {
  Clock,
  MapPin,
  Camera,
  Coffee,
  Play,
  LogOut,
  Calendar,
  AlertCircle,
  CheckCircle2,
  FileEdit,
  Home,
  ShieldAlert,
} from 'lucide-react';

export default function EmployeeAttendancePage({ onNavigate }) {
  const { user } = useAuth();
  const { lastEvent } = useRealtime();
  const [todayData, setTodayData] = useState({ attendance: null, events: [] });
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [gpsLocation, setGpsLocation] = useState(null);
  const [gpsError, setGpsError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Modals
  const [cameraModalOpen, setCameraModalOpen] = useState(false);
  const [cameraActionType, setCameraActionType] = useState('check-in'); // 'check-in' | 'check-out'
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selfieModalData, setSelfieModalData] = useState(null);

  // Live timer
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // GPS Acquisition
  const acquireGps = () => {
    const isHttp = window.location.protocol === 'http:' && window.location.hostname !== 'localhost' && window.location.hostname !== '127.0.0.1';

    if (!navigator.geolocation) {
      setGpsError('เบราว์เซอร์ไม่รองรับการระบุตำแหน่ง GPS');
      return;
    }

    if (isHttp && window.isSecureContext === false) {
      setGpsError('เบราว์เซอร์บล็อก GPS บน HTTP (จำเป็นต้องใช้ HTTPS เช่น Cloudflare Tunnel เพื่อเปิดใช้งาน)');
      return;
    }

    setGpsError(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGpsLocation({
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude,
          accuracy: Math.round(pos.coords.accuracy),
        });
      },
      (err) => {
        console.warn('GPS error:', err);
        if (err.code === 1) {
          setGpsError('ถูกปฏิเสธสิทธิ์ GPS กรุณากดอนุญาต (Allow Location) ในเบราว์เซอร์');
        } else if (err.code === 2) {
          setGpsError('ไม่สามารถระบุพิกัดได้ กรุณาเปิด Location ในการตั้งค่าอุปกรณ์');
        } else {
          setGpsError('ดึงพิกัด GPS ไม่สำเร็จ กรุณาลองใหม่อีกครั้ง');
        }
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  };

  useEffect(() => {
    acquireGps();
  }, []);

  // Load today's attendance
  const loadTodayAttendance = async (silent = false) => {
    try {
      if (!silent) setLoading(true);
      const data = await api.getMyToday();
      setTodayData(data);
    } catch (err) {
      console.error('Load today attendance error:', err);
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    loadTodayAttendance();
  }, []);

  // Realtime updates + 5s polling
  useEffect(() => {
    if (lastEvent) {
      loadTodayAttendance(true);
    }
  }, [lastEvent]);

  useEffect(() => {
    const timer = setInterval(() => {
      loadTodayAttendance(true);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  // Trigger Camera for Check-in / Check-out
  const handleOpenCheckIn = () => {
    setCameraActionType('check-in');
    setCameraModalOpen(true);
  };

  const handleOpenCheckOut = () => {
    setCameraActionType('check-out');
    setCameraModalOpen(true);
  };

  // Submit Check-in or Check-out with captured selfie
  const handleCaptureSelfie = async (selfieBase64) => {
    setActionLoading(true);
    try {
      const payload = {
        latitude: gpsLocation?.latitude || null,
        longitude: gpsLocation?.longitude || null,
        accuracy: gpsLocation?.accuracy || null,
        selfie: selfieBase64,
      };

      if (cameraActionType === 'check-in') {
        await api.checkIn(payload);
        confetti({ particleCount: 80, spread: 60, origin: { y: 0.6 } });
      } else {
        await api.checkOut(payload);
        confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } });
      }

      await loadTodayAttendance();
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาดในการบันทึกเวลา');
    } finally {
      setActionLoading(false);
    }
  };

  // Break actions
  const handleBreakStart = async () => {
    if (!confirm('ยืนยันเริ่มช่วงพัก?')) return;
    setActionLoading(true);
    try {
      await api.breakStart();
      await loadTodayAttendance();
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  const handleBreakEnd = async () => {
    if (!confirm('ยืนยันกลับจากการพัก?')) return;
    setActionLoading(true);
    try {
      await api.breakEnd();
      await loadTodayAttendance();
    } catch (err) {
      alert(err.message || 'เกิดข้อผิดพลาด');
    } finally {
      setActionLoading(false);
    }
  };

  const att = todayData.attendance;
  const isCheckedIn = !!att?.check_in_at;
  const isCheckedOut = !!att?.check_out_at;

  // Determine current break status from events
  const lastBreakEvent = todayData.events
    .filter((e) => e.event_type === 'break_start' || e.event_type === 'break_end')
    .slice(-1)[0];
  const isOnBreak = lastBreakEvent?.event_type === 'break_start';

  const formatStatus = (st) => {
    switch (st) {
      case 'present':
        return { label: 'เข้างานตรงเวลา', className: 'badge-present' };
      case 'late':
        return { label: `มาสาย (${att?.late_minutes || 0} นาที)`, className: 'badge-late' };
      case 'wfh':
        return { label: 'Work From Home', className: 'badge-wfh' };
      case 'leave':
        return { label: 'ลาหยุด', className: 'badge-leave' };
      case 'absent':
        return { label: 'ขาดงาน', className: 'badge-absent' };
      default:
        return { label: 'ยังไม่ลงเวลา', className: 'badge-not-checked-in' };
    }
  };

  const currentStatusInfo = formatStatus(att?.status || 'not_checked_in');

  return (
    <div style={{ maxWidth: '780px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Top Banner Card */}
      <div className="glass-card" style={{ padding: '28px', textAlign: 'center', position: 'relative', overflow: 'hidden' }}>
        <div
          style={{
            position: 'absolute',
            top: '-40px',
            right: '-40px',
            width: '160px',
            height: '160px',
            background: 'radial-gradient(circle, rgba(0,102,51,0.15) 0%, transparent 70%)',
            pointerEvents: 'none',
          }}
        />

        {/* Date & Shift */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '8px' }}>
          <Calendar size={16} />
          <span>
            {currentTime.toLocaleDateString('th-TH', {
              weekday: 'long',
              day: 'numeric',
              month: 'long',
              year: 'numeric',
            })}
          </span>
        </div>

        {/* Big Live Clock */}
        <div style={{ fontSize: '2.8rem', fontWeight: 800, letterSpacing: '1px', fontFamily: 'var(--font-mono)', color: 'var(--text-primary)', margin: '4px 0 12px' }}>
          {currentTime.toLocaleTimeString('th-TH')}
        </div>

        {/* Status Badge */}
        <div style={{ display: 'flex', justifyContent: 'center', gap: '10px', alignItems: 'center' }}>
          <span className={`badge ${currentStatusInfo.className}`} style={{ padding: '6px 16px', fontSize: '0.88rem' }}>
            <span className="badge-dot" />
            {currentStatusInfo.label}
          </span>

          {user?.schedule && (
            <span className="badge badge-not-checked-in">
              กะ: {user.schedule.name} ({user.schedule.startTime} - {user.schedule.endTime})
            </span>
          )}
        </div>
      </div>

      {/* GPS Location Status Bar */}
      <div
        className="glass-panel"
        style={{
          padding: '12px 18px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '10px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', fontSize: '0.88rem' }}>
          <MapPin size={18} color={gpsLocation ? '#10b981' : '#f59e0b'} />
          {gpsLocation ? (
            <span>
              พิกัด GPS: <b>{gpsLocation.latitude.toFixed(5)}, {gpsLocation.longitude.toFixed(5)}</b>{' '}
              <span style={{ color: '#10b981', fontSize: '0.8rem' }}>(ความแม่นยำ ±{gpsLocation.accuracy} ม.)</span>
            </span>
          ) : gpsError ? (
            <span style={{ color: '#f87171' }}>{gpsError}</span>
          ) : (
            <span style={{ color: 'var(--text-muted)' }}>กำลังค้นหาพิกัด GPS...</span>
          )}
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          {gpsLocation && (
            <button
              className="btn btn-outline btn-sm"
              onClick={() =>
                setSelfieModalData(null) ||
                setMapModalOpen(true)
              }
            >
              🗺️ ดูตำแหน่ง Google Maps
            </button>
          )}

          <button className="btn btn-outline btn-sm" onClick={acquireGps}>
            🔄 ดึงพิกัดใหม่
          </button>
        </div>
      </div>

      {/* Leave Day Notice Alert */}
      {att?.status === 'leave' && (
        <div
          className="glass-panel"
          style={{
            padding: '16px 20px',
            background: 'rgba(99, 102, 241, 0.15)',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            borderRadius: 'var(--radius-md)',
            display: 'flex',
            alignItems: 'center',
            gap: '14px',
          }}
        >
          <Calendar size={28} color="#818cf8" style={{ flexShrink: 0 }} />
          <div>
            <div style={{ fontWeight: 700, fontSize: '1rem', color: '#c7d2fe' }}>
              วันนี้คุณอยู่ในสถานะ: ลาหยุด (อนุมัติแล้ว)
            </div>
            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', marginTop: '2px' }}>
              ระบบได้บันทึกสถานะการลางานของคุณเรียบร้อยแล้ว ไม่จำเป็นต้องกด Check-in ในวันนี้
            </div>
          </div>
        </div>
      )}

      {/* Main Action Buttons Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
        {/* Check In Button */}
        <button
          className="btn btn-success btn-lg"
          onClick={handleOpenCheckIn}
          disabled={isCheckedIn || att?.status === 'leave' || actionLoading}
          style={{
            height: '110px',
            flexDirection: 'column',
            gap: '8px',
            opacity: isCheckedIn || att?.status === 'leave' ? 0.5 : 1,
            cursor: isCheckedIn || att?.status === 'leave' ? 'not-allowed' : 'pointer',
          }}
        >
          <Camera size={28} />
          <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {isCheckedIn ? 'Check-in แล้ว' : 'Check-in (ลงเวลาเข้างาน)'}
          </span>
          {isCheckedIn && (
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              เวลา {new Date(att.check_in_at).toLocaleTimeString('th-TH')}
            </span>
          )}
        </button>

        {/* Check Out Button */}
        <button
          className="btn btn-danger btn-lg"
          onClick={handleOpenCheckOut}
          disabled={!isCheckedIn || isCheckedOut || actionLoading}
          style={{
            height: '110px',
            flexDirection: 'column',
            gap: '8px',
            opacity: !isCheckedIn || isCheckedOut ? 0.5 : 1,
            cursor: !isCheckedIn || isCheckedOut ? 'not-allowed' : 'pointer',
          }}
        >
          <LogOut size={28} />
          <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>
            {isCheckedOut ? 'Check-out แล้ว' : 'Check-out (ลงเวลาออกงาน)'}
          </span>
          {isCheckedOut && (
            <span style={{ fontSize: '0.8rem', opacity: 0.9 }}>
              เวลา {new Date(att.check_out_at).toLocaleTimeString('th-TH')}
            </span>
          )}
        </button>
      </div>

      {/* Break Actions */}
      {isCheckedIn && !isCheckedOut && (
        <div className="glass-card" style={{ padding: '20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <div style={{ fontWeight: 600, fontSize: '0.98rem', display: 'flex', alignItems: 'center', gap: '8px' }}>
              <Coffee size={18} color="#f59e0b" /> การพักระหว่างวัน
            </div>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)' }}>
              {isOnBreak ? 'สถานะ: อยู่ระหว่างพัก' : 'สถานะ: ทำงานตามปกติ'}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            {!isOnBreak ? (
              <button className="btn btn-warning" onClick={handleBreakStart} disabled={actionLoading}>
                <Coffee size={18} /> เริ่มพัก
              </button>
            ) : (
              <button className="btn btn-primary" onClick={handleBreakEnd} disabled={actionLoading}>
                <Play size={18} /> กลับจากพัก
              </button>
            )}
          </div>
        </div>
      )}

      {/* Today's Timeline */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Clock size={18} color={PRIMARY} /> ไทม์ไลน์กิจกรรมวันนี้
        </h3>

        {todayData.events.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '32px', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
            ยังไม่มีกิจกรรมในวันนี้ กดปุ่ม Check-in เพื่อเริ่มต้นวันทำงาน
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', position: 'relative', paddingLeft: '16px' }}>
            {/* Timeline vertical bar */}
            <div
              style={{
                position: 'absolute',
                left: '6px',
                top: '10px',
                bottom: '10px',
                width: '2px',
                background: 'var(--border-highlight)',
              }}
            />

            {todayData.events.map((evt, idx) => (
              <div key={evt.id || idx} style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', position: 'relative' }}>
                <div
                  style={{
                    width: '14px',
                    height: '14px',
                    borderRadius: '50%',
                    background:
                      evt.event_type === 'check_in'
                        ? '#10b981'
                        : evt.event_type === 'check_out'
                        ? '#ef4444'
                        : evt.event_type === 'break_start'
                        ? '#f59e0b'
                        : PRIMARY,
                    border: '3px solid #fff',
                    zIndex: 2,
                    marginTop: '4px',
                  }}
                />
                <div className="glass-panel" style={{ flex: 1, padding: '12px 16px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 600, fontSize: '0.92rem' }}>
                      {evt.event_type === 'check_in' && '🟢 Check-in'}
                      {evt.event_type === 'check_out' && '🔴 Check-out'}
                      {evt.event_type === 'break_start' && '🍜 เริ่มพัก'}
                      {evt.event_type === 'break_end' && '🏃 กลับจากพัก'}
                      {evt.event_type === 'manual_adjust' && '📝 ปรับปรุงเวลา'}
                    </span>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: '0.85rem', color: PRIMARY }}>
                      {new Date(evt.event_at).toLocaleTimeString('th-TH')}
                    </span>
                  </div>

                  {evt.latitude && evt.longitude && (
                    <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px', marginTop: '4px' }}>
                      <MapPin size={12} /> พิกัด {parseFloat(evt.latitude).toFixed(4)}, {parseFloat(evt.longitude).toFixed(4)} (±{evt.accuracy || '-'}ม.)
                    </div>
                  )}

                  {evt.selfie && (
                    <div style={{ marginTop: '8px' }}>
                      <button
                        className="btn btn-outline btn-sm"
                        style={{ fontSize: '0.75rem', padding: '4px 10px' }}
                        onClick={() =>
                          setSelfieModalData({
                            selfieUrl: evt.selfie,
                            userName: `${user?.firstName} ${user?.lastName}`,
                            time: evt.event_at,
                            accuracy: evt.accuracy,
                            title: `รูป Selfie (${evt.event_type})`,
                          })
                        }
                      >
                        📷 ดูรูป Selfie
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Quick Request Links */}
      <div className="glass-card" style={{ padding: '20px' }}>
        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '12px', color: 'var(--text-secondary)' }}>
          📌 เมนูลัดคำขอ
        </h4>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px' }}>
          <button className="btn btn-outline" onClick={() => onNavigate('requests', 'leave')}>
            <Calendar size={16} /> ยื่นใบลา
          </button>
          <button className="btn btn-outline" onClick={() => onNavigate('requests', 'wfh')}>
            <Home size={16} /> ขอ WFH
          </button>
          <button className="btn btn-outline" onClick={() => onNavigate('requests', 'edit')}>
            <FileEdit size={16} /> ขอแก้ไขเวลา (ลืมกด)
          </button>
        </div>
      </div>

      {/* Camera Modal */}
      <CameraModal
        isOpen={cameraModalOpen}
        onClose={() => setCameraModalOpen(false)}
        onCapture={handleCaptureSelfie}
        title={cameraActionType === 'check-in' ? 'ถ่ายรูป Selfie ตอน Check-in' : 'ถ่ายรูป Selfie ตอน Check-out'}
      />

      {/* Selfie Preview Modal */}
      <SelfiePreviewModal
        isOpen={!!selfieModalData}
        onClose={() => setSelfieModalData(null)}
        data={selfieModalData}
      />

      {/* Live Google Map Modal */}
      <LiveMapModal
        isOpen={mapModalOpen}
        onClose={() => setMapModalOpen(false)}
        title="ตำแหน่ง GPS ของคุณบน Google Maps"
        locations={
          gpsLocation
            ? [
                {
                  latitude: gpsLocation.latitude,
                  longitude: gpsLocation.longitude,
                  accuracy: gpsLocation.accuracy,
                  name: `${user?.firstName || ''} ${user?.lastName || ''}`,
                  eventType: 'ตำแหน่งปัจจุบัน',
                },
              ]
            : []
        }
      />
    </div>
  );
}
