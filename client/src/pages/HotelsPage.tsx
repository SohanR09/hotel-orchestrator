import React, { useState } from 'react';
import {
  Box, Typography, TextField, MenuItem, Button, Grid,
  Card, CardContent, Chip, Alert, CircularProgress, Divider,
} from '@mui/material';
import SearchIcon     from '@mui/icons-material/Search';
import TrendingDownIcon from '@mui/icons-material/TrendingDown';
import StorefrontIcon from '@mui/icons-material/Storefront';
import PercentIcon    from '@mui/icons-material/Percent';
import axios from 'axios';
import { Hotel } from '../types';

const CITIES = ['delhi', 'mumbai', 'bangalore'];

const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

export default function HotelsPage() {
  const [city,     setCity]     = useState('delhi');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [hotels,   setHotels]   = useState<Hotel[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState('');
  const [searched, setSearched] = useState(false);

  const search = async () => {
    setLoading(true); setError(''); setSearched(true);
    try {
      const params: any = { city };
      if (minPrice) params.minPrice = Number(minPrice);
      if (maxPrice) params.maxPrice = Number(maxPrice);
      const res = await axios.get<Hotel[]>('/api/hotels', { params });
      setHotels(res.data);
    } catch (e: any) {
      setError(e.response?.data?.error || e.message);
      setHotels([]);
    } finally { setLoading(false); }
  };

  const sorted   = hotels.slice().sort((a, b) => a.price - b.price);
  const cheapest = sorted[0]?.price;

  return (
    <Box sx={{ p: 3, maxWidth: 1100, mx: 'auto' }}>
      {/* Header */}
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 0.3 }}>
          Hotel Search
        </Typography>
        <Typography variant="body2" sx={{ color: '#6b7a8d', fontFamily: 'monospace', fontSize: '0.82rem' }}>
          GET /api/hotels?city=&#123;city&#125;&amp;minPrice=&#123;min&#125;&amp;maxPrice=&#123;max&#125;
        </Typography>
      </Box>

      {/* Filter bar */}
      <Box sx={{
        display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'flex-end',
        p: 2.5, bgcolor: '#FFEBCC', borderRadius: 2, border: '1px solid #BFDDF0', mb: 3,
      }}>
        <TextField select label="City" value={city} onChange={e => setCity(e.target.value)}
          size="small" sx={{ minWidth: 140 }}>
          {CITIES.map(c => <MenuItem key={c} value={c}>{cap(c)}</MenuItem>)}
        </TextField>
        <TextField label="Min Price (₹)" value={minPrice}
          onChange={e => setMinPrice(e.target.value)} size="small" type="number" sx={{ width: 150 }}
          placeholder="e.g. 5000" />
        <TextField label="Max Price (₹)" value={maxPrice}
          onChange={e => setMaxPrice(e.target.value)} size="small" type="number" sx={{ width: 150 }}
          placeholder="e.g. 12000" />
        <Button variant="contained" onClick={search} disabled={loading}
          startIcon={loading ? <CircularProgress size={15} /> : <SearchIcon />}
          sx={{ height: 40 }}>
          {loading ? 'Searching...' : 'Search'}
        </Button>
        {(minPrice || maxPrice) && (
          <Button variant="text" size="small" onClick={() => { setMinPrice(''); setMaxPrice(''); }}
            sx={{ color: '#6b7a8d', fontSize: '0.78rem' }}>
            Clear filters
          </Button>
        )}
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {/* Results summary */}
      {searched && !loading && !error && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 2.5, flexWrap: 'wrap' }}>
          <Typography variant="body2" sx={{ color: '#6b7a8d' }}>
            <strong style={{ color: '#2c3e50' }}>{hotels.length}</strong> result{hotels.length !== 1 ? 's' : ''} in <strong style={{ color: '#2c3e50' }}>{cap(city)}</strong>
            {(minPrice || maxPrice) && <span> &nbsp;·&nbsp; ₹{minPrice || '0'} – ₹{maxPrice || '∞'}</span>}
          </Typography>
          {cheapest && (
            <Chip icon={<TrendingDownIcon sx={{ fontSize: '14px !important' }} />}
              label={`Cheapest: ₹${cheapest.toLocaleString('en-IN')}`} size="small"
              sx={{ bgcolor: '#e4f5ec', color: '#2d6b4a', border: '1px solid #b5dfc8', fontWeight: 600 }} />
          )}
        </Box>
      )}

      {/* Hotel cards */}
      {searched && !loading && hotels.length > 0 && (
        <Grid container spacing={2}>
          {sorted.map((h, i) => (
            <Grid item xs={12} sm={6} md={4} key={i}>
              <Card sx={{ height: '100%' }}>
                <CardContent sx={{ p: 2.5 }}>
                  {/* Rank + Name */}
                  <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                    <Typography variant="h6" sx={{ fontWeight: 700, fontSize: '1rem', color: '#2c3e50', lineHeight: 1.3, flex: 1, pr: 1 }}>
                      {h.name}
                    </Typography>
                    <Box sx={{ bgcolor: '#BFDDF0', color: '#2c3e50', fontWeight: 700, fontSize: '0.72rem',
                      borderRadius: '6px', px: 1, py: 0.3, whiteSpace: 'nowrap' }}>
                      #{i + 1}
                    </Box>
                  </Box>

                  <Divider sx={{ mb: 1.5 }} />

                  {/* Price */}
                  <Typography sx={{ fontSize: '1.75rem', fontWeight: 800, color: '#2c3e50', lineHeight: 1, mb: 0.3 }}>
                    ₹{h.price.toLocaleString('en-IN')}
                  </Typography>
                  <Typography variant="caption" sx={{ color: '#6b7a8d', display: 'block', mb: 1.5 }}>
                    per night
                  </Typography>

                  {/* Tags */}
                  <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                    <Chip icon={<StorefrontIcon sx={{ fontSize: '13px !important' }} />}
                      label={h.supplier} size="small"
                      sx={{
                        bgcolor: h.supplier === 'Supplier A' ? '#deeef9' : '#FFEBCC',
                        color: '#2c3e50', border: `1px solid ${h.supplier === 'Supplier A' ? '#8CC0EB' : '#f5d5a0'}`,
                        fontSize: '0.72rem',
                      }} />
                    <Chip icon={<PercentIcon sx={{ fontSize: '13px !important' }} />}
                      label={`${h.commissionPct}% commission`} size="small"
                      sx={{ bgcolor: '#FFF9D2', color: '#2c3e50', border: '1px solid #FFEBCC', fontSize: '0.72rem' }} />
                  </Box>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      )}

      {searched && !loading && hotels.length === 0 && !error && (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#FFEBCC', borderRadius: 2, border: '1px dashed #BFDDF0' }}>
          <Typography color="text.secondary">No hotels found for this query.</Typography>
        </Box>
      )}

      {!searched && (
        <Box sx={{ p: 6, textAlign: 'center', bgcolor: '#FFEBCC', borderRadius: 2, border: '1px dashed #BFDDF0' }}>
          <SearchIcon sx={{ fontSize: 40, color: '#BFDDF0', mb: 1 }} />
          <Typography color="text.secondary">Select a city and click Search to find hotels</Typography>
        </Box>
      )}
    </Box>
  );
}
