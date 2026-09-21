import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { useRealtime } from '../context/RealtimeContext';
import { PRIMARY_DARK, PRIMARY, GLASS_TOPBAR } from '../styles/tokens';
import {
  Clock,
  Bell,
  LogOut,
  User,
  Shield,
  Briefcase,
  Layers,
  FileText,
  Calendar,
  Settings,
  Menu,
  X,
  MapPin,
} from 'lucide-react';

export default function Navbar({ currentTab, setCurrentTab }) {
  const { user, logout } = useAuth();
  const { lastEvent } = useRealtime();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Realtime event listener (kept for future use)
  useEffect(() => {
    // placeholder
  }, [lastEvent]);

  // เมนูลงเวลา + ประวัติ
  const navItems = [
    { id: 'attendance', label: 'ลงเวลา', icon: Clock, show: true },
    { id: 'history', label: 'ประวัติ', icon: Calendar, show: true },
  ];

  return (
    <header
      className="sticky top-0 left-0 right-0 z-50"
      style={{
        background: 'rgba(255,255,255,0.85)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(0,0,0,0.05)',
        boxShadow: '0 4px 30px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          maxWidth: '1360px',
          margin: '0 auto',
          padding: '0 20px',
          height: '64px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {/* Brand & Live Clock */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div
            onClick={() => setCurrentTab('attendance')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              cursor: 'pointer',
            }}
            className="group"
          >
            <div
              style={{
                width: '42px',
                height: '42px',
                borderRadius: '14px',
                background: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '0 4px 16px rgba(0,80,40,0.12)',
                transition: 'transform 0.5s',
              }}
            >
              <Clock size={24} color={PRIMARY} />
            </div>
            <div>
              <div style={{ 
                fontWeight: 900, 
                fontSize: '1.1rem', 
                letterSpacing: '-0.5px', 
                lineHeight: 1.2,
                color: PRIMARY_DARK,
                fontFamily: "'Montserrat', sans-serif",
              }}>
                CHECK-IN
              </div>
              <div style={{ 
                fontSize: '0.6rem', 
                fontWeight: 700,
                letterSpacing: '0.2em',
                opacity: 0.4,
                textTransform: 'uppercase',
                color: PRIMARY_DARK,
              }}>
                Online Attendance
              </div>
            </div>
          </div>

          {/* Real-time Clock Pill */}
          <div
            style={{
              padding: '4px 14px',
              display: 'none',
              alignItems: 'center',
              gap: '6px',
              fontSize: '0.78rem',
              color: PRIMARY_DARK,
              opacity: 0.5,
              fontWeight: 700,
              background: 'rgba(255,255,255,0.5)',
              borderRadius: '20px',
              border: '1px solid rgba(255,255,255,0.6)',
            }}
            id="desktop-clock"
          >
            <span style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#10b981' }} />
            <span>
              {currentTime.toLocaleDateString('th-TH', {
                weekday: 'short',
                day: 'numeric',
                month: 'short',
              })}{' '}
              {currentTime.toLocaleTimeString('th-TH')}
            </span>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '2px' }} className="desktop-nav">
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => setCurrentTab(item.id)}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '5px',
                    padding: '6px 14px',
                    borderRadius: '9999px',
                    border: 'none',
                    background: isActive ? 'rgba(0,102,51,0.08)' : 'transparent',
                    color: PRIMARY_DARK,
                    fontWeight: isActive ? 800 : 600,
                    fontSize: '0.78rem',
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    opacity: isActive ? 1 : 0.45,
                    letterSpacing: '0.05em',
                    textTransform: 'uppercase',
                    fontFamily: "'Prompt', sans-serif",
                  }}
                >
                  <Icon size={14} />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </nav>

        {/* User Profile & Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>

          {/* User Profile Pill */}
          <div
            onClick={() => setCurrentTab('profile')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              cursor: 'pointer',
              transition: 'all 0.2s',
            }}
          >
            <div
              style={{
                width: '34px',
                height: '34px',
                borderRadius: '50%',
                background: `linear-gradient(135deg, ${PRIMARY} 0%, #10b981 100%)`,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '0.82rem',
                color: 'white',
                border: '2px solid rgba(255,255,255,0.8)',
                boxShadow: '0 2px 8px rgba(0,102,51,0.2)',
              }}
            >
              {user?.firstName ? user.firstName.charAt(0) : 'U'}
            </div>
            <div style={{ display: 'none' }} className="desktop-user-info">
              <div style={{ fontSize: '0.82rem', fontWeight: 800, lineHeight: 1.2, color: PRIMARY_DARK }}>
                {user?.firstName} {user?.lastName}
              </div>
              <div style={{ fontSize: '0.65rem', fontWeight: 700, color: PRIMARY, textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                {user?.role?.replace('_', ' ')}
              </div>
            </div>
          </div>

          {/* Logout Button */}
          <button 
            onClick={logout} 
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              border: 'none',
              background: 'transparent',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'background 0.2s',
              opacity: 0.4,
            }}
            title="ออกจากระบบ"
          >
            <LogOut size={18} color={PRIMARY_DARK} />
          </button>

          {/* Mobile Menu Toggle */}
          <button
            className="mobile-menu-btn"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '12px',
              border: 'none',
              background: 'rgba(0,0,0,0.05)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            {mobileMenuOpen ? <X size={20} color={PRIMARY_DARK} /> : <Menu size={20} color={PRIMARY_DARK} />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div
          style={{
            background: 'rgba(255,255,255,0.95)',
            backdropFilter: 'blur(20px)',
            borderBottom: '1px solid rgba(0,0,0,0.05)',
            padding: '12px 16px',
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
          }}
          className="mobile-nav-drawer"
        >
          {navItems
            .filter((item) => item.show)
            .map((item) => {
              const Icon = item.icon;
              const isActive = currentTab === item.id;
              return (
                <button
                  key={item.id}
                  onClick={() => {
                    setCurrentTab(item.id);
                    setMobileMenuOpen(false);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '10px',
                    padding: '10px 16px',
                    borderRadius: '14px',
                    background: isActive ? 'rgba(0,102,51,0.08)' : 'transparent',
                    border: 'none',
                    color: PRIMARY_DARK,
                    fontWeight: isActive ? 800 : 500,
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: '0.88rem',
                    opacity: isActive ? 1 : 0.6,
                    fontFamily: "'Prompt', sans-serif",
                  }}
                >
                  <Icon size={18} color={isActive ? PRIMARY : PRIMARY_DARK} />
                  <span>{item.label}</span>
                </button>
              );
            })}
        </div>
      )}

      <style>{`
        @media (min-width: 1024px) {
          #desktop-clock { display: flex !important; }
          .desktop-nav { display: flex !important; }
          .desktop-user-info { display: block !important; }
          .mobile-menu-btn { display: none !important; }
          .mobile-nav-drawer { display: none !important; }
        }
        @media (max-width: 1023px) {
          .desktop-nav { display: none !important; }
        }
      `}</style>
    </header>
  );
}
