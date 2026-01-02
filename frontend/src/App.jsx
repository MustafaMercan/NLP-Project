import { createTheme, ThemeProvider } from '@mui/material/styles';
import { Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import DataList from './pages/DataList';
import './App.css';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: { main: '#3b82f6' }, // blue-500
    secondary: { main: '#a855f7' }, // purple-500
    background: {
      default: '#0d1117',
      paper: '#111827',
    },
    text: {
      primary: '#e5e7eb',
      secondary: '#9ca3af',
    },
  },
  shape: {
    borderRadius: 12,
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: '#111827',
          border: '1px solid #1f2937',
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: {
          background: 'linear-gradient(90deg, #0f172a, #111827, #0f172a)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 10,
        },
      },
    },
    MuiTableCell: {
      styleOverrides: {
        head: {
          backgroundColor: '#0b1220',
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <Layout>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/data" element={<DataList />} />
        </Routes>
      </Layout>
    </ThemeProvider>
  );
}

export default App;
