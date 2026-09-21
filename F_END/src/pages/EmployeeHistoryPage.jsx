import React, { useState, useEffect } from 'react';
import { PRIMARY } from '../styles/tokens';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import SelfiePreviewModal from '../components/SelfiePreviewModal';
import LiveMapModal from '../components/LiveMapModal';
import {
  Calendar,
  Clock,
  MapPin,
  Camera,
  Filter,
  ArrowUpRight,
  ChevronLeft,
  ChevronRight,
  AlertTriangle,
  Inbox,
  RotateCcw,
} from 'lucide-react';

export default function EmployeeHistoryPage() {
  const { user } = useAuth();
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [dateError, setDateError] = useState('');

  // Pagination states
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(5);
  const [totalRecords, setTotalRecords] = useState(0);

  // Modals
  const [selfieModalData, setSelfieModalData] = useState(null);
  const [mapLocations, setMapLocations] = useState(null);

  const loadHistory = async () => {
    // Validate date range on client-side
    if (startDate && endDate && startDate > endDate) {
      setDateError('ช่วงวันที่ไม่ถูกต้อง: วันที่เริ่มต้นต้องไม่มากกว่าวันที่สิ้นสุด (Start date cannot be after end date)');
      setHistory([]);
      setTotalRecords(0);
      setLoading(false);
      return;
    }

    setDateError('');

    try {
      setLoading(true);
      const params = {
        page,
        limit: pageSize,
      };
      if (startDate) params.startDate = startDate;
      if (endDate) params.endDate = endDate;

      const res = await api.getMyHistoryWithMeta(params);
      setHistory(res.records || []);
      setTotalRecords(res.total || 0);
    } catch (err) {
      console.error('Load history error:', err);
      setDateError(err.message || 'เกิดข้อผิดพลาดในการโหลดข้อมูลประวัติ');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadHistory();
  }, [startDate, endDate, page, pageSize]);

  // Reset page to 1 when date filter changes
  const handleStartDateChange = (val) => {
    setStartDate(val);
    setPage(1);
  };

  const handleEndDateChange = (val) => {
    setEndDate(val);
    setPage(1);
  };

  const handleClearFilter = () => {
    setStartDate('');
    setEndDate('');
    setDateError('');
    setPage(1);
  };

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

  // Summary stats (calculated from currently loaded data)
  const totalWorkedMinutes = history.reduce((acc, cur) => acc + (cur.worked_minutes || 0), 0);
  const totalOtMinutes = history.reduce((acc, cur) => acc + (cur.overtime_minutes || 0), 0);
  const lateCount = history.filter((h) => h.status === 'late').length;

  const totalPages = Math.max(1, Math.ceil(totalRecords / pageSize));

  return (
    <div style={{ maxWidth: '1080px', margin: '0 auto', padding: '24px 16px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* Header & Filter */}
      <div className="glass-card" style={{ padding: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px', marginBottom: '20px' }}>
          <div>
            <h2 style={{ fontSize: '1.35rem', fontWeight: 700, color: 'var(--text-primary)' }}>ประวัติการลงเวลาของฉัน</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              ตรวจสอบรายการเข้างาน ย้อนหลัง คำนวณชั่วโมงทำงาน OT พร้อมระบบแบ่งหน้า (Pagination)
            </p>
          </div>

          {/* Date Filter */}
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
              <Filter size={16} color="var(--text-muted)" />
              <span>ตั้งแต่:</span>
              <input
                id="filter-start-date"
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', width: 'auto' }}
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
              />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '0.88rem' }}>
              <span>ถึง:</span>
              <input
                id="filter-end-date"
                type="date"
                className="form-input"
                style={{ padding: '6px 10px', width: 'auto' }}
                value={endDate}
                onChange={(e) => handleEndDateChange(e.target.value)}
              />
            </div>
            {(startDate || endDate) && (
              <button
                id="btn-clear-filter"
                className="btn btn-outline btn-sm"
                style={{ display: 'flex', alignItems: 'center', gap: '4px' }}
                onClick={handleClearFilter}
              >
                <RotateCcw size={14} />
                ล้างตัวกรอง
              </button>
            )}
          </div>
        </div>

        {/* Invalid Date Range Alert Banner */}
        {dateError && (
          <div
            id="date-range-error-banner"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '12px 16px',
              marginBottom: '18px',
              borderRadius: 'var(--radius-md)',
              background: 'rgba(239, 68, 68, 0.12)',
              border: '1px solid rgba(239, 68, 68, 0.3)',
              color: '#ef4444',
              fontSize: '0.88rem',
            }}
          >
            <AlertTriangle size={18} />
            <span style={{ fontWeight: 500 }}>{dateError}</span>
          </div>
        )}

        {/* Stats row */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '14px' }}>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>จำนวนวันที่บันทึก (ทั้งหมด)</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px', color: 'var(--text-primary)' }}>
              {totalRecords} วัน
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ชั่วโมงทำงานในหน้านี้</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px', color: '#10b981' }}>
              {(totalWorkedMinutes / 60).toFixed(1)} ชม.
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>ชั่วโมง OT ในหน้านี้</div>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, marginTop: '4px', color: PRIMARY }}>
              {(totalOtMinutes / 60).toFixed(1)} ชม.
            </div>
          </div>
          <div className="glass-panel" style={{ padding: '16px', borderRadius: 'var(--radius-md)' }}>
            <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>จำนวนครั้งที่สายในหน้านี้</div>
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
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
                    <div className="animate-spin" style={{ width: '24px', height: '24px', border: `3px solid ${PRIMARY}`, borderTopColor: 'transparent', borderRadius: '50%' }} />
                    <span>กำลังโหลดข้อมูลประวัติ...</span>
                  </div>
                </td>
              </tr>
            ) : history.length === 0 ? (
              <tr>
                <td colSpan={8} style={{ textAlign: 'center', padding: '50px 20px', color: 'var(--text-muted)' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                    <div style={{ padding: '14px', borderRadius: '50%', background: 'rgba(255,255,255,0.05)' }}>
                      <Inbox size={36} strokeWidth={1.5} color="var(--text-muted)" />
                    </div>
                    <div style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-primary)' }}>
                      ไม่พบประวัติการลงเวลา
                    </div>
                    <div style={{ fontSize: '0.85rem', maxWidth: '360px', lineHeight: 1.5 }}>
                      {dateError
                        ? 'กรุณาแก้ไขช่วงวันที่ให้ถูกต้อง'
                        : startDate || endDate
                        ? 'ไม่พบข้อมูลในช่วงวันที่เลือก ลองเปลี่ยนช่วงวันหรือกดปุ่ม "ล้างตัวกรอง"'
                        : 'ยังไม่มีข้อมูลประวัติการลงเวลาในระบบ'}
                    </div>
                  </div>
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

      {/* Pagination Bar */}
      {totalRecords > 0 && (
        <div
          className="glass-card"
          style={{
            padding: '12px 20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
          }}
        >
          <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>
              แสดง {((page - 1) * pageSize) + 1} - {Math.min(page * pageSize, totalRecords)} จาก {totalRecords} รายการ
            </span>
            <span style={{ color: 'var(--text-muted)' }}>|</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span>แสดง:</span>
              <select
                className="form-input"
                style={{ padding: '3px 8px', width: 'auto', fontSize: '0.82rem' }}
                value={pageSize}
                onChange={(e) => {
                  setPageSize(Number(e.target.value));
                  setPage(1);
                }}
              >
                <option value={5}>5 รายการ</option>
                <option value={10}>10 รายการ</option>
                <option value={20}>20 รายการ</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <button
              id="btn-prev-page"
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
              disabled={page <= 1 || loading}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
            >
              <ChevronLeft size={16} />
              <span>ก่อนหน้า</span>
            </button>

            <span style={{ fontSize: '0.85rem', fontWeight: 600, padding: '0 8px' }}>
              หน้า {page} / {totalPages}
            </span>

            <button
              id="btn-next-page"
              className="btn btn-outline btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 12px' }}
              disabled={page >= totalPages || loading}
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            >
              <span>ถัดไป</span>
              <ChevronRight size={16} />
            </button>
          </div>
        </div>
      )}

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
