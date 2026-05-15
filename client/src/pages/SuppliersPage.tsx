import React, { useState } from 'react';
import {
  Box, Typography, TextField, MenuItem, Button, Alert,
  CircularProgress, Table, TableHead, TableRow, TableCell,
  TableBody, TableContainer, Paper, Chip, Grid,
} from '@mui/material';
import CompareArrowsIcon from '@mui/icons-material/CompareArrows';
import StarIcon from '@mui/icons-material/Star';
import axios from 'axios';
import { SupplierHotel } from '../types';

const CITIES = [
  { value: '', label: 'All Cities' },
  { value: 'delhi',     label: 'Delhi' },
  { value: 'mumbai',    label: 'Mumbai' },
  { value: 'bangalore', label: 'Bangalore' },
];

function SupplierTable({ title, data, color, bg, borderColor, otherNames }:
  { title: string; data: SupplierHotel[]; color: string; bg: string; borderColor: string; otherNames: string[] }) {
  return (
    <Box>
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 1.5 }}>
        <Box sx={{ width: 10, height: 10, borderRadius: '50%', bgcolor: color }} />
        <Typography variant="subtitle1" sx={{ fontWeight: 700, color: '#2c3e50' }}>{title}</Typography>
        <Chip label={`${data.length} hotels`} size="small"
          sx={{ bgcolor: bg, color: '#2c3e50', border: `1px solid ${borderColor}`, fontSize: '0.7rem' }} />
      </Box>

      {data.length === 0 ? (
        <Box sx={{ p: 3, textAlign: 'center', border: '1px dashed #BFDDF0', borderRadius: 1, bgcolor: '#FFF9D2' }}>
          <Typography variant="body2" color="text.secondary">No data</Typography>
        </Box>
      ) : (
        <TableContainer component={Paper} sx={{ border: `1px solid ${borderColor}`, boxShadow: 'none' }}>
          <Table size="small">
            <TableHead>
              <TableRow>
                <TableCell>Hotel Name</TableCell>
                <TableCell>City</TableCell>
                <TableCell align="right">Price (₹)</TableCell>
                <TableCell align="right">Commission</TableCell>
                <TableCell align="center">Overlap</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {data.map(h => {
                const inBoth = otherNames.indexOf(h.name.toLowerCase()) !== -1;
                return (
                  <TableRow key={h.hotelId}
                    sx={{ '&:hover': { bgcolor: bg }, bgcolor: 'white' }}>
                    <TableCell>
                      <Typography sx={{ fontSize: '0.85rem', fontWeight: 600, color: '#2c3e50' }}>
                        {h.name}
                      </Typography>
                    </TableCell>
                    <TableCell>
                      <Chip label={h.city} size="small"
                        sx={{ bgcolor: '#FFF9D2', color: '#6b7a8d', border: '1px solid #FFEBCC', fontSize: '0.68rem', height: 20, textTransform: 'capitalize' }} />
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ fontWeight: 700, color: '#2c3e50', fontSize: '0.9rem' }}>
                        ₹{h.price.toLocaleString('en-IN')}
                      </Typography>
                    </TableCell>
                    <TableCell align="right">
                      <Typography sx={{ color: '#6b7a8d', fontSize: '0.83rem' }}>{h.commissionPct}%</Typography>
                    </TableCell>
                    <TableCell align="center">
                      {inBoth && <StarIcon sx={{ fontSize: 16, color: '#c8923a' }} />}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}

export default function SuppliersPage() {
  const [city,    setCity]    = useState('');
  const [aData,   setAData]   = useState<SupplierHotel[]>([]);
  const [bData,   setBData]   = useState<SupplierHotel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [fetched, setFetched] = useState(false);

  const load = async () => {
    setLoading(true); setError('');
    try {
      const params = city ? { city } : {};
      const [a, b] = await Promise.all([
        axios.get<SupplierHotel[]>('/supplierA/hotels', { params }),
        axios.get<SupplierHotel[]>('/supplierB/hotels', { params }),
      ]);
      setAData(a.data); setBData(b.data); setFetched(true);
    } catch (e: any) {
      setError(e.message);
    } finally { setLoading(false); }
  };

  const aNames  = aData.map(h => h.name.toLowerCase());
  const bNames  = bData.map(h => h.name.toLowerCase());
  const overlap = aNames.filter(n => bNames.indexOf(n) !== -1);

  return (
    <Box sx={{ p: 3, maxWidth: 1200, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 0.3 }}>
          Supplier Data
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7a8d', fontFamily: 'monospace', fontSize: '0.82rem' }}>
          GET /supplierA/hotels &nbsp;|&nbsp; GET /supplierB/hotels
        </Typography>
      </Box>

      {/* Controls */}
      <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end',
        p: 2.5, bgcolor: '#FFEBCC', borderRadius: 2, border: '1px solid #BFDDF0', mb: 3 }}>
        <TextField select label="Filter by City" value={city}
          onChange={e => setCity(e.target.value)} size="small" sx={{ minWidth: 180 }}>
          {CITIES.map(c => <MenuItem key={c.value} value={c.value}>{c.label}</MenuItem>)}
        </TextField>
        <Button variant="contained" onClick={load} disabled={loading}
          startIcon={loading ? <CircularProgress size={15} /> : <CompareArrowsIcon />}
          sx={{ height: 40 }}>
          {loading ? 'Loading...' : 'Fetch Both Suppliers'}
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {fetched && !loading && (
        <>
          {/* Stats row */}
          <Box sx={{ display: 'flex', gap: 2, flexWrap: 'wrap', mb: 2.5 }}>
            {[
              { label: 'Supplier A',    value: aData.length,   bg: '#deeef9', border: '#8CC0EB' },
              { label: 'Supplier B',    value: bData.length,   bg: '#FFEBCC', border: '#f5d5a0' },
              { label: 'Overlap',       value: overlap.length, bg: '#fff3de', border: '#f5d9a0' },
            ].map(s => (
              <Box key={s.label} sx={{ px: 2.5, py: 1.5, bgcolor: s.bg, border: `1px solid ${s.border}`, borderRadius: 2, textAlign: 'center', minWidth: 100 }}>
                <Typography sx={{ fontWeight: 800, fontSize: '1.5rem', color: '#2c3e50', lineHeight: 1 }}>{s.value}</Typography>
                <Typography sx={{ fontSize: '0.72rem', color: '#6b7a8d', mt: 0.3 }}>{s.label}</Typography>
              </Box>
            ))}
          </Box>

          {/* Overlap notice */}
          {overlap.length > 0 && (
            <Box sx={{ mb: 2.5, p: 1.5, bgcolor: '#fff3de', borderRadius: 1, border: '1px solid #f5d9a0', display: 'flex', alignItems: 'flex-start', gap: 1 }}>
              <StarIcon sx={{ fontSize: 16, color: '#c8923a', mt: 0.2, flexShrink: 0 }} />
              <Box>
                <Typography variant="body2" sx={{ color: '#7a5120', fontWeight: 600, mb: 0.5 }}>
                  Found in both suppliers — best price selected in /api/hotels:
                </Typography>
                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                  {overlap.map(n => (
                    <Chip key={n} label={n} size="small"
                      sx={{ bgcolor: '#FFEBCC', color: '#7a5120', border: '1px solid #f5d5a0', textTransform: 'capitalize', fontSize: '0.72rem' }} />
                  ))}
                </Box>
              </Box>
            </Box>
          )}

          <Grid container spacing={3}>
            <Grid item xs={12} md={6}>
              <SupplierTable title="Supplier A" data={aData} color="#8CC0EB"
                bg="#deeef9" borderColor="#8CC0EB" otherNames={bNames} />
            </Grid>
            <Grid item xs={12} md={6}>
              <SupplierTable title="Supplier B" data={bData} color="#c8923a"
                bg="#FFEBCC" borderColor="#f5d5a0" otherNames={aNames} />
            </Grid>
          </Grid>
        </>
      )}

      {!fetched && (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#FFEBCC', borderRadius: 2, border: '1px dashed #BFDDF0' }}>
          <CompareArrowsIcon sx={{ fontSize: 40, color: '#BFDDF0', mb: 1 }} />
          <Typography color="text.secondary">Click "Fetch Both Suppliers" to compare listings</Typography>
        </Box>
      )}
    </Box>
  );
}
