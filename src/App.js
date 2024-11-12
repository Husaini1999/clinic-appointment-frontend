import React from 'react';
import {
	BrowserRouter as Router,
	Routes,
	Route,
	Navigate,
} from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import Login from './components/Login';
import Dashboard from './components/Dashboard';
import Booking from './components/Booking';
import Homepage from './components/Homepage';
import Signup from './components/Signup';
import Layout from './components/Layout';
import ProfileSettings from './components/ProfileSettings';

const theme = createTheme({
	palette: {
		primary: {
			main: '#1A1A1A',
			light: '#2C2C2C',
			dark: '#000000',
			contrastText: '#ffffff',
		},
		secondary: {
			main: '#DC2626',
			light: '#EF4444',
			dark: '#B91C1C',
			contrastText: '#ffffff',
		},
		background: {
			default: '#F9FAFB',
			paper: '#FFFFFF',
		},
		text: {
			primary: '#1A1A1A',
			secondary: '#4B5563',
		},
	},
	typography: {
		fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
		h1: {
			fontWeight: 700,
			fontSize: '3.5rem',
			lineHeight: 1.2,
		},
		h2: {
			fontWeight: 600,
			fontSize: '2.5rem',
			lineHeight: 1.3,
		},
		h3: {
			fontWeight: 600,
			fontSize: '2rem',
			lineHeight: 1.4,
		},
		body1: {
			fontSize: '1rem',
			lineHeight: 1.6,
		},
	},
	components: {
		MuiButton: {
			styleOverrides: {
				root: {
					borderRadius: 8,
					textTransform: 'none',
					padding: '8px 24px',
					fontSize: '1rem',
					transition: 'all 0.2s ease-in-out',
					'&:hover': {
						transform: 'translateY(-2px)',
						boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
					},
				},
				contained: {
					boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
				},
			},
		},
		MuiPaper: {
			styleOverrides: {
				root: {
					borderRadius: 12,
					boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
				},
			},
		},
	},
	breakpoints: {
		values: {
			xs: 0,
			sm: 600,
			md: 900,
			lg: 1200,
			xl: 1536,
		},
	},
});

const PrivateRoute = ({ children, role }) => {
	const token = localStorage.getItem('token');
	const user = JSON.parse(localStorage.getItem('user'));

	if (!token) {
		return <Navigate to="/login" />;
	}

	if (role && user.role !== role) {
		return <Navigate to="/dashboard" />; // Redirect to a default dashboard if role doesn't match
	}

	return children;
};

function App() {
	return (
		<ThemeProvider theme={theme}>
			<CssBaseline />
			<Router>
				<Layout>
					<Routes>
						<Route path="/" element={<Homepage />} />
						<Route path="/login" element={<Login />} />
						<Route path="/signup" element={<Signup />} />
						<Route
							path="/dashboard"
							element={
								<PrivateRoute>
									<Dashboard />
								</PrivateRoute>
							}
						/>
						<Route path="/booking" element={<Booking />} />
						<Route
							path="/profile"
							element={
								<PrivateRoute>
									<ProfileSettings />
								</PrivateRoute>
							}
						/>
					</Routes>
				</Layout>
			</Router>
		</ThemeProvider>
	);
}

export default App;
