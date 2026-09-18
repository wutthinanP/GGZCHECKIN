import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { RealtimeProvider } from './context/RealtimeContext';
import { PRIMARY } from './styles/tokens';
import PageBackground from './components/PageBackground';
import Navbar from './components/Navbar';
import LoginPage from './pages/LoginPage';
import EmployeeAttendancePage from './pages/EmployeeAttendancePage';
import EmployeeHistoryPage from './pages/EmployeeHistoryPage';

function MainApp() {
  const { user, loading } = useAuth();
  const [currentTab, setCurrentTab] = useState('attendance');

  if (loading) {
    return (
      <PageBackground>
        <div style={{ 
          minHeight: '100vh', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          position: 'relative',
          zIndex: 1,
        }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{
              fontWeight: 900,
              letterSpacing: '0.2em',
              color: PRIMARY,
              fontSize: '0.82rem',
              textTransform: 'uppercase',
              fontFamily: "'Montserrat', sans-serif",
            }}
            className="animate-pulse"
            >
              Loading System...
            </p>
          </div>
        </div>
      </PageBackground>
    );
  }

  if (!user) {
    return <LoginPage />;
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Navbar */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
      />

      {/* Main Content Area */}
      <main style={{ flex: 1, paddingBottom: '60px', position: 'relative', zIndex: 1 }}>
        {currentTab === 'attendance' && <EmployeeAttendancePage />}
        {currentTab === 'history' && <EmployeeHistoryPage />}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <RealtimeProvider>
        <MainApp />
      </RealtimeProvider>
    </AuthProvider>
  );
}
