import { AppBar, Container, CssBaseline, Toolbar, Typography, Button, Stack } from '@mui/material';
import { Link, useLocation } from 'react-router-dom';

const navItems = [
  { label: 'Dashboard', to: '/' },
  { label: 'Veriler', to: '/data' },
];

export default function Layout({ children }) {
  const location = useLocation();

  return (
    <>
      <CssBaseline />
      <AppBar position="sticky" color="primary" enableColorOnDark>
        <Toolbar>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 700 }}>
            GTÜ NLP Dashboard
          </Typography>
          <Stack direction="row" spacing={1}>
            {navItems.map((item) => (
              <Button
                key={item.to}
                component={Link}
                to={item.to}
                color="inherit"
                variant={location.pathname === item.to ? 'contained' : 'outlined'}
                sx={{
                  bgcolor: location.pathname === item.to ? 'secondary.main' : 'transparent',
                  borderColor: 'rgba(255,255,255,0.18)',
                  '&:hover': {
                    borderColor: 'secondary.main',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
          </Stack>
        </Toolbar>
      </AppBar>
      <Container maxWidth="xl" sx={{ py: 3 }}>
        {children}
      </Container>
    </>
  );
}

