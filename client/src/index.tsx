import React from 'react';
import ReactDOM from 'react-dom';
import { BrowserRouter } from 'react-router-dom';
import { createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import App from './App';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary:    { main: '#8CC0EB', dark: '#6aaad8', contrastText: '#2c3e50' },
    secondary:  { main: '#FFEBCC', dark: '#f5d5a0', contrastText: '#2c3e50' },
    background: { default: '#FFF9D2', paper: '#FFEBCC' },
    success:    { main: '#5a9e7a' },
    error:      { main: '#c0616b' },
    warning:    { main: '#c8923a' },
    info:       { main: '#8CC0EB' },
    text:       { primary: '#2c3e50', secondary: '#6b7a8d' },
    divider:    '#BFDDF0',
  },
  typography: {
    fontFamily: '"DM Sans", "Segoe UI", sans-serif',
    h1: { fontWeight: 700 },
    h2: { fontWeight: 700 },
    h3: { fontWeight: 700 },
    h4: { fontWeight: 600 },
    h5: { fontWeight: 600 },
    h6: { fontWeight: 600 },
    button: { textTransform: 'none', fontWeight: 600 },
    body1: { lineHeight: 1.7 },
    body2: { lineHeight: 1.6 },
  },
  shape: { borderRadius: 10 },
  components: {
    MuiCssBaseline: {
      styleOverrides: `
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600;700&display=swap');
        body { background: #FFF9D2; }
      `,
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: '#FFEBCC',
          boxShadow: 'none',
          borderBottom: '1px solid #BFDDF0',
          color: '#2c3e50',
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          background: '#ffffff',
          border: '1px solid #BFDDF0',
          boxShadow: '0 2px 12px rgba(140,192,235,0.12)',
          transition: 'box-shadow 0.2s, transform 0.2s',
          '&:hover': {
            boxShadow: '0 6px 24px rgba(140,192,235,0.22)',
            transform: 'translateY(-2px)',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        contained: {
          background: '#8CC0EB',
          color: '#2c3e50',
          fontWeight: 700,
          boxShadow: 'none',
          '&:hover': { background: '#6aaad8', boxShadow: 'none' },
        },
        outlined: {
          borderColor: '#8CC0EB',
          color: '#2c3e50',
          '&:hover': { background: '#BFDDF0', borderColor: '#8CC0EB' },
        },
        text: { color: '#2c3e50', '&:hover': { background: '#BFDDF0' } },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            background: '#fff',
            '& fieldset': { borderColor: '#BFDDF0' },
            '&:hover fieldset': { borderColor: '#8CC0EB' },
            '&.Mui-focused fieldset': { borderColor: '#8CC0EB' },
          },
          '& .MuiInputLabel-root.Mui-focused': { color: '#6aaad8' },
        },
      },
    },
    MuiTableHead: {
      styleOverrides: {
        root: {
          '& .MuiTableCell-head': {
            background: '#BFDDF0',
            color: '#2c3e50',
            fontWeight: 700,
            fontSize: '0.75rem',
            letterSpacing: '0.06em',
          },
        },
      },
    },
    MuiTableCell: {
      styleOverrides: { root: { borderBottom: '1px solid #BFDDF0' } },
    },
    MuiChip: {
      styleOverrides: {
        root: { fontWeight: 600, fontSize: '0.73rem' },
      },
    },
    MuiAlert: {
      styleOverrides: {
        standardError:   { background: '#fde8ea', color: '#7f2d31', border: '1px solid #f5c0c3' },
        standardSuccess: { background: '#e4f5ec', color: '#2d6b4a', border: '1px solid #b5dfc8' },
        standardWarning: { background: '#fff3de', color: '#7a5120', border: '1px solid #f5d9a0' },
        standardInfo:    { background: '#deeef9', color: '#1d4e6b', border: '1px solid #BFDDF0' },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: { backgroundImage: 'none' },
      },
    },
  },
});

ReactDOM.render(
  <React.StrictMode>
    <BrowserRouter>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        <App />
      </ThemeProvider>
    </BrowserRouter>
  </React.StrictMode>,
  document.getElementById('root')
);
