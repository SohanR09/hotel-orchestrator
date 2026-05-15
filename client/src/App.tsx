import React from 'react';
import { Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { AppBar, Toolbar, Typography, Box, Button, Chip } from '@mui/material';
import HotelIcon from '@mui/icons-material/Hotel';
import HotelsPage    from './pages/HotelsPage';
import SuppliersPage from './pages/SuppliersPage';
import HealthPage    from './pages/HealthPage';
import DocsPage      from './pages/DocsPage';

const NAV = [
  { label: 'Hotels',    to: '/hotels' },
  { label: 'Suppliers', to: '/suppliers' },
  { label: 'Health',    to: '/health' },
  { label: 'Docs',      to: '/docs' },
];

export default function App() {
  const { pathname } = useLocation();
  return (
    <>
      <AppBar position="fixed">
        <Toolbar sx={{ gap: 1, minHeight: '60px !important' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 4 }}>
            <Box sx={{ bgcolor: '#8CC0EB', borderRadius: '8px', p: 0.6, display: 'flex' }}>
              <HotelIcon sx={{ fontSize: 20, color: '#2c3e50' }} />
            </Box>
            <Typography sx={{ fontWeight: 700, fontSize: '1rem', color: '#2c3e50', letterSpacing: '-0.01em' }}>
              Hotel Orchestrator
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', gap: 0.5, flexGrow: 1 }}>
            {NAV.map(n => (
              <Button key={n.to} component={Link} to={n.to} size="small"
                sx={{
                  borderRadius: '8px', px: 2, fontSize: '0.85rem',
                  color: pathname === n.to ? '#2c3e50' : '#6b7a8d',
                  background: pathname === n.to ? '#BFDDF0' : 'transparent',
                  fontWeight: pathname === n.to ? 700 : 500,
                  '&:hover': { background: '#BFDDF0', color: '#2c3e50' },
                }}>
                {n.label}
              </Button>
            ))}
          </Box>
          <Chip label="API :3000" size="small"
            sx={{ bgcolor: '#BFDDF0', color: '#2c3e50', fontSize: '0.7rem', fontWeight: 600, border: '1px solid #8CC0EB' }} />
        </Toolbar>
      </AppBar>
      <Box sx={{ pt: '60px', minHeight: '100vh', bgcolor: 'background.default' }}>
        <Routes>
          <Route path="/"          element={<Navigate to="/hotels" replace />} />
          <Route path="/hotels"    element={<HotelsPage />} />
          <Route path="/suppliers" element={<SuppliersPage />} />
          <Route path="/health"    element={<HealthPage />} />
          <Route path="/docs"      element={<DocsPage />} />
        </Routes>
      </Box>
    </>
  );
}
