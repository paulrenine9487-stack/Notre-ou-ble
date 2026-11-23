import React from 'react';
import { NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/useAuth';
import {
  Home,
  BookOpen,
  Music,
  LogOut,
  ShieldCheck,
  User as UserIcon,
  X
} from 'lucide-react';

export default function UserSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  const navItems = [
    {
      label: 'My Dashboard',
      path: '/dashboard',
      icon: Home
    },
    {
      label: 'Learning Modules',
      path: '/learning',
      icon: BookOpen
    },
    {
      label: 'Practice Journal',
      path: '/practice',
      icon: Music
    }
  ];

  const isAdmin = user && (user.role === 'ADMIN' || user.role === 'SUPERADMIN');

  return (
    <>
      {/* Mobile Drawer Overlay */}
      <div 
        className={`mobile-overlay ${isOpen ? 'open' : ''}`}
        onClick={onClose}
      />

      <aside className={`dash-sidebar ${isOpen ? 'open' : ''}`}>
        {/* Brand Header */}
        <div>
          <div className="dash-sidebar-brand">
            <div style={{ flex: 1, minWidth: 0, display: 'flex', alignItems: 'center' }}>
              <img
                src="/NoTreble-Classicfinal.png"
                alt="No Tre(ou)ble"
                style={{
                  height: '32px',
                  width: 'auto',
                  maxWidth: '100%',
                  objectFit: 'contain',
                  display: 'block'
                }}
              />
            </div>
            {/* Mobile Close Button */}
            <button
              onClick={onClose}
              className="sidebar-close-btn"
              aria-label="Close Navigation"
            >
              <X size={20} />
            </button>
          </div>

          {/* Navigation Menu */}
          <nav className="dash-sidebar-nav">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path || (item.path === '/learning' && location.pathname.startsWith('/learning'));
              return (
                <NavLink
                  key={item.path}
                  to={item.path}
                  onClick={onClose}
                  className={`dash-nav-item ${isActive ? 'active' : ''}`}
                >
                  <Icon size={16} />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}

            {/* Elevated Admin Portal Route Link (Only shown for ADMIN / SUPERADMIN) */}
            {isAdmin && (
              <div style={{ marginTop: '12px', paddingTop: '12px', borderTop: '1px solid rgba(255, 255, 255, 0.08)' }}>
                <NavLink
                  to="/ResonovaNotreoble"
                  onClick={onClose}
                  className={`dash-nav-item ${location.pathname.startsWith('/Resonova') ? 'active' : ''}`}
                  style={{
                    color: '#C7D2FE',
                    background: location.pathname.startsWith('/Resonova') ? '#493078' : 'rgba(99, 102, 241, 0.15)'
                  }}
                >
                  <ShieldCheck size={16} />
                  <span>Teacher Studio</span>
                </NavLink>
              </div>
            )}
          </nav>
        </div>

        {/* Sidebar Footer with Authenticated User & Logout */}
        <div className="dash-sidebar-footer">
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            padding: '8px 10px',
            borderRadius: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.06)',
            border: '1px solid rgba(255, 255, 255, 0.1)'
          }}>
            <div style={{
              width: '32px',
              height: '32px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '0.84rem'
            }}>
              {user?.username ? user.username.charAt(0).toUpperCase() : <UserIcon size={16} />}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{
                fontSize: '0.82rem',
                fontWeight: 700,
                color: '#FFFFFF',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap'
              }}>
                {user?.username || 'Vocalist'}
              </div>
              <div style={{
                fontSize: '0.68rem',
                color: '#A5B4FC',
                fontWeight: 600
              }}>
                {user?.role || 'USER'}
              </div>
            </div>
          </div>

          <button
            onClick={handleLogout}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              width: '100%',
              padding: '10px 16px',
              borderRadius: '10px',
              backgroundColor: 'rgba(255, 255, 255, 0.06)',
              border: '1px solid rgba(255, 255, 255, 0.1)',
              color: '#E2E8F0',
              fontSize: '0.88rem',
              fontWeight: 650,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.12)';
              e.currentTarget.style.color = '#FFFFFF';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255, 255, 255, 0.06)';
              e.currentTarget.style.color = '#E2E8F0';
            }}
          >
            <LogOut size={16} color="#CBD5E1" />
            <span>Sign Out</span>
          </button>
        </div>
      </aside>
    </>
  );
}
