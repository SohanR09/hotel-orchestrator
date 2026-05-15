import React, { useEffect, useState } from 'react';
import {
  Box, Typography, Button, Alert, CircularProgress,
  Card, CardContent, Chip, Grid, Divider,
} from '@mui/material';
import CheckCircleIcon  from '@mui/icons-material/CheckCircle';
import CancelIcon       from '@mui/icons-material/Cancel';
import RefreshIcon      from '@mui/icons-material/Refresh';
import SpeedIcon        from '@mui/icons-material/Speed';
import axios from 'axios';
import { HealthResponse } from '../types';

function ServiceCard({ name, endpoint, data }:
  { name: string; endpoint: string; data: { status: string; latencyMs?: number; error?: string } }) {
  const ok = data.status === 'healthy';
  return (
    <Card sx={{ height: '100%', border: `1px solid ${ok ? '#b5dfc8' : '#f5c0c3'}`, bgcolor: ok ? '#f0faf4' : '#fef2f3' }}>
      <CardContent sx={{ p: 2.5 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50' }}>{name}</Typography>
          {ok
            ? <CheckCircleIcon sx={{ color: '#5a9e7a', fontSize: 22 }} />
            : <CancelIcon sx={{ color: '#c0616b', fontSize: 22 }} />}
        </Box>
        <Typography sx={{ color: '#6b7a8d', fontFamily: 'monospace', fontSize: '0.75rem', mb: 1.5, wordBreak: 'break-all' }}>
          {endpoint}
        </Typography>
        <Divider sx={{ mb: 1.5 }} />
        <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
          <Chip label={data.status} size="small"
            sx={{
              bgcolor: ok ? '#e4f5ec' : '#fde8ea',
              color: ok ? '#2d6b4a' : '#7f2d31',
              border: `1px solid ${ok ? '#b5dfc8' : '#f5c0c3'}`,
              fontWeight: 600,
            }} />
          {data.latencyMs !== undefined && (
            <Chip icon={<SpeedIcon sx={{ fontSize: '13px !important' }} />}
              label={`${data.latencyMs}ms`} size="small"
              sx={{ bgcolor: '#deeef9', color: '#2c3e50', border: '1px solid #BFDDF0' }} />
          )}
        </Box>
        {data.error && (
          <Typography sx={{ mt: 1.5, color: '#c0616b', fontSize: '0.78rem', fontFamily: 'monospace',
            bgcolor: '#fde8ea', p: 1, borderRadius: 1, border: '1px solid #f5c0c3' }}>
            {data.error}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}

export default function HealthPage() {
  const [health,  setHealth]  = useState<HealthResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [lastChecked, setLastChecked] = useState<Date | null>(null);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const res = await axios.get<HealthResponse>('/health');
      setHealth(res.data);
      setLastChecked(new Date());
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  useEffect(() => { load(); }, []);

  const ok = health?.status === 'healthy';

  return (
    <Box sx={{ p: 3, maxWidth: 900, mx: 'auto' }}>
      <Box sx={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', mb: 3, flexWrap: 'wrap', gap: 1 }}>
        <Box>
          <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 0.3 }}>System Health</Typography>
          <Typography variant="body2" sx={{ color: '#6b7a8d', fontFamily: 'monospace', fontSize: '0.82rem' }}>
            GET /health
          </Typography>
        </Box>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          {lastChecked && (
            <Typography variant="caption" sx={{ color: '#6b7a8d' }}>
              Last: {lastChecked.toLocaleTimeString()}
            </Typography>
          )}
          <Button size="small" startIcon={<RefreshIcon />} onClick={load}
            disabled={loading} variant="outlined" sx={{ height: 34 }}>
            Refresh
          </Button>
        </Box>
      </Box>

      {loading && !health && (
        <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress sx={{ color: '#8CC0EB' }} /></Box>
      )}
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {health && (
        <>
          {/* Overall banner */}
          <Box sx={{
            display: 'flex', alignItems: 'center', gap: 2, mb: 3,
            p: 2.5, borderRadius: 2,
            bgcolor: ok ? '#e4f5ec' : '#fff3de',
            border: `1px solid ${ok ? '#b5dfc8' : '#f5d9a0'}`,
          }}>
            {ok
              ? <CheckCircleIcon sx={{ color: '#5a9e7a', fontSize: 36 }} />
              : <CancelIcon sx={{ color: '#c8923a', fontSize: 36 }} />}
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700, color: ok ? '#2d6b4a' : '#7a5120' }}>
                System {health.status.toUpperCase()}
              </Typography>
              <Typography variant="body2" sx={{ color: '#6b7a8d', fontSize: '0.8rem' }}>
                {new Date(health.timestamp).toLocaleString()}
              </Typography>
            </Box>
          </Box>

          {/* Service cards */}
          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={12} sm={4}>
              <ServiceCard name="Supplier A" endpoint="/supplierA/hotels" data={health.services.supplierA} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <ServiceCard name="Supplier B" endpoint="/supplierB/hotels" data={health.services.supplierB} />
            </Grid>
            <Grid item xs={12} sm={4}>
              <ServiceCard name="Redis Cache" endpoint="redis://localhost:6379" data={health.services.redis} />
            </Grid>
          </Grid>

          {/* Raw JSON */}
          <Box>
            <Typography variant="body2" sx={{ color: '#6b7a8d', mb: 1, fontWeight: 600 }}>Raw JSON Response</Typography>
            <Box component="pre" sx={{
              p: 2, bgcolor: '#FFFFFF', border: '1px solid #BFDDF0', borderRadius: 2,
              fontSize: '0.78rem', color: '#2c3e50', overflow: 'auto', m: 0, lineHeight: 1.7,
            }}>
              {JSON.stringify(health, null, 2)}
            </Box>
          </Box>
        </>
      )}
    </Box>
  );
}
