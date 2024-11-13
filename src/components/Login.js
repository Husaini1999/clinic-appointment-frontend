import React, { useState, useEffect } from 'react';
import {
	Box,
	Container,
	Paper,
	TextField,
	Button,
	Typography,
	Alert,
	Snackbar,
	Link,
	InputAdornment,
	IconButton,
	CircularProgress,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import config from '../config';

function Login() {
	const [formData, setFormData] = useState({
		email: '',
		password: '',
	});
	const [error, setError] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [loading, setLoading] = useState(false); // Loading state
	const navigate = useNavigate();
	const location = useLocation();
	const searchParams = new URLSearchParams(location.search);
	const expired = searchParams.get('expired');

	useEffect(() => {
		if (expired) {
			// Show message that session expired
			showMessage('Your session has expired. Please log in again.', 'warning');
		}
	}, [expired]);

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		if (!formData.email || !formData.password) {
			setError('Please fill in all fields.');
			return;
		}
		setLoading(true);
		try {
			const controller = new AbortController();
			const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

			const response = await fetch(`${config.apiUrl}/api/auth/login`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
				signal: controller.signal,
			});

			clearTimeout(timeoutId);

			const data = await response.json();

			if (response.ok) {
				localStorage.setItem('token', data.token);
				localStorage.setItem('user', JSON.stringify(data.user));
				setSuccessMessage('Login successful! Welcome back.');
				setSnackbarOpen(true);

				setTimeout(() => {
					setLoading(false);
					navigate('/dashboard');
				}, 3000);

				if (data.user.role === 'patient') {
					// Redirect to patient dashboard
				} else {
					// Redirect to staff dashboard
				}
			} else {
				setError(data.message);
				setLoading(false);
			}
		} catch (err) {
			if (err.name === 'AbortError') {
				setError('Request timed out. Please try again.');
			} else {
				setError('An error occurred. Please try again.');
			}
			setLoading(false);
		}
	};

	const handleSnackbarClose = () => {
		setSnackbarOpen(false);
	};

	return (
		<Container
			component="main"
			maxWidth="xs"
			sx={{
				display: 'flex',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '100vh',
			}}
		>
			<Paper elevation={3} sx={{ padding: 4 }}>
				<Typography component="h1" variant="h5" align="center" sx={{ mb: 2 }}>
					Login
				</Typography>
				{error && (
					<Alert severity="error" sx={{ mt: 2 }}>
						{error}
					</Alert>
				)}
				<Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
					<TextField
						margin="normal"
						required
						fullWidth
						id="email"
						label="Email Address"
						name="email"
						autoComplete="email"
						autoFocus
						value={formData.email}
						onChange={handleChange}
						disabled={loading} // Disable input when loading
					/>
					<TextField
						margin="normal"
						required
						fullWidth
						name="password"
						label="Password"
						type={showPassword ? 'text' : 'password'}
						id="password"
						autoComplete="current-password"
						value={formData.password}
						onChange={handleChange}
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										aria-label="toggle password visibility"
										onClick={() => setShowPassword(!showPassword)}
										onMouseDown={(e) => e.preventDefault()}
									>
										{showPassword ? <Visibility /> : <VisibilityOff />}
									</IconButton>
								</InputAdornment>
							),
						}}
						disabled={loading} // Disable input when loading
					/>
					<Button
						type="submit"
						fullWidth
						variant="contained"
						sx={{ mt: 3, mb: 2 }}
						disabled={loading} // Disable button when loading
					>
						{loading ? (
							<CircularProgress size={24} color="inherit" />
						) : (
							'Sign In'
						)}
					</Button>
					<Typography variant="body2" align="center">
						Don't have an account?{' '}
						<Link href="/signup" variant="body2">
							Sign Up
						</Link>
					</Typography>
				</Box>
			</Paper>
			<Snackbar
				open={snackbarOpen}
				autoHideDuration={3000}
				onClose={handleSnackbarClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Alert
					onClose={handleSnackbarClose}
					severity="success"
					sx={{ width: '100%' }}
				>
					{successMessage}
				</Alert>
			</Snackbar>
		</Container>
	);
}

export default Login;
