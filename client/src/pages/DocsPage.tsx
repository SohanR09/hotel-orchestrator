import React, { useEffect, useState } from 'react';
import { Box, Typography, CircularProgress, Alert } from '@mui/material';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import axios from 'axios';

export default function DocsPage() {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState('');

  useEffect(() => {
    axios.get<string>('/docs/readme')
      .then(r  => setContent(r.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <Box sx={{ p: 3, maxWidth: 860, mx: 'auto' }}>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h5" sx={{ fontWeight: 700, color: '#2c3e50', mb: 0.3 }}>API Docs</Typography>
        <Typography variant="body2" sx={{ color: '#6b7a8d', fontFamily: 'monospace', fontSize: '0.82rem' }}>
          GET /docs/readme — rendered from server README.md
        </Typography>
      </Box>

      {loading && <Box sx={{ textAlign: 'center', py: 8 }}><CircularProgress sx={{ color: '#8CC0EB' }} /></Box>}
      {error   && <Alert severity="error">{error}</Alert>}

      {content && (
        <Box sx={{
          p: { xs: 2.5, md: 4 },
          bgcolor: 'white',
          borderRadius: 2,
          border: '1px solid #BFDDF0',
          boxShadow: '0 2px 12px rgba(140,192,235,0.1)',
          '& h1': { color: '#2c3e50', fontSize: '1.6rem', fontWeight: 700, mt: 0, mb: 1.5, pb: 1, borderBottom: '2px solid #BFDDF0' },
          '& h2': { color: '#2c3e50', fontSize: '1.2rem', fontWeight: 700, mt: 3, mb: 1, pb: 0.5, borderBottom: '1px solid #FFEBCC' },
          '& h3': { color: '#1d4e6b', fontSize: '1rem', fontWeight: 700, mt: 2, mb: 0.75 },
          '& h4': { color: '#6b7a8d', fontSize: '0.9rem', fontWeight: 700, mt: 1.5, mb: 0.5 },
          '& p':  { color: '#4a5568', lineHeight: 1.8, mb: 1.5, fontSize: '0.9rem' },
          '& code': { bgcolor: '#FFF9D2', color: '#1d4e6b', px: 0.75, py: 0.2, borderRadius: 0.75, fontSize: '0.82rem', fontFamily: 'monospace', border: '1px solid #FFEBCC' },
          '& pre': { bgcolor: '#FFF9D2', border: '1px solid #BFDDF0', borderRadius: 1.5, p: 2, overflow: 'auto', mb: 2, '& code': { bgcolor: 'transparent', border: 'none', p: 0, color: '#2c3e50' } },
          '& ul,& ol': { color: '#4a5568', pl: 3, mb: 1.5, '& li': { mb: 0.5, fontSize: '0.9rem', lineHeight: 1.7 } },
          '& table': { width: '100%', borderCollapse: 'collapse', mb: 2.5, fontSize: '0.85rem', display: 'table' },
          '& thead': { bgcolor: '#BFDDF0' },
          '& th': { bgcolor: '#BFDDF0', color: '#2c3e50', fontWeight: 700, fontSize: '0.78rem', p: '10px 14px', textAlign: 'left', border: '1px solid #8CC0EB' },
          '& td': { color: '#4a5568', p: '9px 14px', border: '1px solid #BFDDF0', verticalAlign: 'top' },
          '& tbody tr:nth-of-type(even) td': { bgcolor: '#FFF9D2' },
          '& tbody tr:hover td': { bgcolor: '#deeef9' },
          '& a':  { color: '#1d4e6b', textDecorationColor: '#BFDDF0' },
          '& blockquote': { borderLeft: '3px solid #8CC0EB', pl: 2, ml: 0, my: 1.5, bgcolor: '#deeef9', py: 1, borderRadius: '0 8px 8px 0' },
          '& hr': { border: 'none', borderTop: '1px solid #BFDDF0', my: 2.5 },
          '& strong': { color: '#2c3e50', fontWeight: 700 },
        }}>
          <ReactMarkdown children={content} remarkPlugins={[remarkGfm]} />
        </Box>
      )}
    </Box>
  );
}
