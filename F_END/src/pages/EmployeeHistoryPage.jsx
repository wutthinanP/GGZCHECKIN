import React, { useState, useEffect } from 'react';
import { PRIMARY } from '../styles/tokens';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SelfiePreviewModal from '../components/SelfiePreviewModal';
import LiveMapModal from '../components/LiveMapModal';
import { Calendar, Clock, MapPin, Camera, Filter, ArrowUpRight } from 'lucide-react';

export default function EmployeeHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  // Modals
  const [selfieModalData, setSelfieModalData] = useState(null);
  const [mapLocations, setMapLocations] = useState(null);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const params = {};
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;
      const data = await api.getMyHistory(params);
      setHistory(data);
    } catch (err) {
      console.error('Load history error:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [startDate, endDate]);

  const formatStatus = (st, lateMins) => {
    switch (st) {
      case 'present':
        return <span className="badge badge-present"><span className="badge-dot" /> ตรงเวลา</span>;
      case 'late':
        return <span className="badge badge-late"><span className="badge-dot" /> สาย {lateMins} นาที</span>;
      case 'wfh':
        return <span className="badge badge-wfh"><span className="badge-dot" /> WFH</span>;
      case 'leave':
        return <span className="badge badge-leave"><span className="badge-dot" /> ลา</span>;
      case 'absent':
        return <span className="badge badge-absent"><span className="badge-dot" /> ขาดงาน</span>;
      default:
        return <span className="badge badge-not-checked-in"><span className="badge-dot" /> ไม่ลงเวลา</span>;
    }
  };

  // Summary stats
  const totalWorkedMinutes = history.reduce((acc, cur) => acc + (cur.worked_minutes || 0), 0);
  const totalOtMinutes = history.reduce((acc, cur) => acc + (cur.overtime_minutes || 0), 0);
  const lateCount = history.filter((h) => h.status === 'late').length;

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Filter */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700 }}>ประวัติการลงเวลาของฉัน</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ตรวจสอบรายการเข้างาน ย้อนหลัง คำนวณชั่วโมงทำงาน และ OT
            </p>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
              <Filter size={16} color="var(--text-muted)" />
              <span>ตั้งแต่:</span>
              <input
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', width: 'auto' }}
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
              <span>ถึง:</span>
              <input
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', width: 'auto' }}
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
            {(startDate || endDate) && (
              <button
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
              >
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>จำนวนวันที่บันทึก</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px' }}>{history.length} วัน</div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ชั่วโมงทำงานรวม</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px', color: '#10b981' }}>
              {(totalWorkedMinutes / 60).toFixed(1)} ชม.
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ชั่วโมง OT รวม</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px', color: PRIMARY }}>
              {(totalOtMinutes / 60).toFixed(1)} ชม.
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>จำนวนครั้งที่สาย</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px', color: '#f59e0b' }}>
              {lateCount} ครั้ง
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="table-container">
        <table className="custom-table">
          <thead>
            <tr>
              <th>วันที่</th>
              <th>สถานะ</th>
              <th>เวลาเข้า (Check-in)</th>
              <th>เวลาออก (Check-out)</th>
              <th>เวลาสาย</th>
              <th>ชม. ทำงาน</th>
              <th>OT</th>
              <th>รูป & GPS</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  กำลังโหลดข้อมูล...
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '40px', color: 'var(--text-muted)' }}>
                  ไม่พบประวัติการลงเวลา
                </td>
              </tr>
            ) : (
              history.map((row) => (
                <tr key={row.id}>
                  <td style={{ fontWeight: 600 }}>
                    {new Date(row.work_date).toLocaleDateString('th-TH', {
                      weekday: 'short',
                      day: 'numeric',
                      month: 'short',
                      year: 'numeric',
                    })}
                  </td>
                  <td>{formatStatus(row.status, row.late_minutes)}</td>
                  <td>
                    {row.check_in_at
                      ? new Date(row.check_in_at).toLocaleTimeString('th-TH')
                      : '-'}
                  </td>
                  <td>
                    {row.check_out_at
                      ? new Date(row.check_out_at).toLocaleTimeString('th-TH')
                      : '-'}
                  </td>
                  <td>
                    {row.late_minutes > 0 ? (
                      <span style={{ color: '#f59e0b', fontWeight: 600 }}>+{row.late_minutes} น.</span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>{(row.worked_minutes / 60).toFixed(1)} ชม.</td>
                  <td>
                    {row.overtime_minutes > 0 ? (
                      <span style={{ color: PRIMARY, fontWeight: 600 }}>
                        +{(row.overtime_minutes / 60).toFixed(1)} ชม.
                      </span>
                    ) : (
                      '-'
                    )}
                  </td>
                  <td>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      {(row.check_in_selfie || row.check_out_selfie) && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="ดูรูป Selfie"
                          onClick={() =>
                            setSelfieModalData({
                              selfieUrl: row.check_in_selfie || row.check_out_selfie,
                              userName: `${user?.firstName} ${user?.lastName}`,
                              time: row.check_in_at || row.check_out_at,
                              accuracy: row.check_in_accuracy,
                              title: 'รูปถ่าย Selfie ยืนยันตัวตน',
                            })
                          }
                        >
                          <Camera size={14} />
                        </button>
                      )}

                      {row.check_in_latitude && row.check_in_longitude && (
                        <button
                          className="btn btn-outline btn-sm"
                          style={{ padding: '4px 8px' }}
                          title="ดูพิกัด GPS บนแผนที่"
                          onClick={() =>
                            setMapLocations([
                              {
                                latitude: row.check_in_latitude,
                                longitude: row.check_in_longitude,
                                accuracy: row.check_in_accuracy,
                                name: `${user?.firstName} ${user?.lastName}`,
                                eventType: 'Check-in',
                                time: row.check_in_at,
                                selfieUrl: row.check_in_selfie,
                              },
                              ...(row.check_out_latitude
                                ? [
                                    {
                                      latitude: row.check_out_latitude,
                                      longitude: row.check_out_longitude,
                                      accuracy: row.check_out_accuracy,
                                      name: `${user?.firstName} ${user?.lastName}`,
                                      eventType: 'Check-out',
                                      time: row.check_out_at,
                                      selfieUrl: row.check_out_selfie,
                                    },
                                  ]
                                : []),
                            ])
                          }
                        >
                          <MapPin size={14} color="#10b981" />
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Selfie Modal */}
      <SelfiePreviewModal
        isOpen={!!selfieModalData}
        onClose={() => setSelfieModalData(null)}
        data={selfieModalData}
      />

      {/* Map Modal */}
      <LiveMapModal
        isOpen={!!mapLocations}
        onClose={() => setMapLocations(null)}
        locations={mapLocations || []}
        title="ตำแหน่ง Check-in / Check-out บนแผนที่"
      />
    </div>
  );
}
