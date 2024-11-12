import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import config from '../config';

function Signup() {
	const [formData, setFormData] = useState({
		name: '',
		email: '',
		password: '',
		confirmPassword: '',
	});
	const [error, setError] = useState('');
	const [emailError, setEmailError] = useState('');
	const [passwordError, setPasswordError] = useState('');
	const [successMessage, setSuccessMessage] = useState('');
	const [showPassword, setShowPassword] = useState(false);
	const [showConfirmPassword, setShowConfirmPassword] = useState(false);
	const [snackbarOpen, setSnackbarOpen] = useState(false);
	const [loading, setLoading] = useState(false); // Loading state
	const navigate = useNavigate();

	const handleChange = (e) => {
		setFormData({
			...formData,
			[e.target.name]: e.target.value,
		});
	};

	const validateEmail = (email) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const handleSubmit = async (e) => {
		e.preventDefault();
		setError('');
		setEmailError('');
		setPasswordError('');
		setSuccessMessage('');
		setLoading(true); // Set loading to true

		if (
			!formData.name ||
			!formData.email ||
			!formData.password ||
			!formData.confirmPassword
		) {
			setError('Please fill in all fields.');
			setLoading(false); // Set loading to false on error
			return;
		}

		if (!validateEmail(formData.email)) {
			setEmailError(
				'Please enter a valid email address. Example: user@example.com'
			);
			setLoading(false); // Set loading to false on error
			return;
		}

		if (formData.password !== formData.confirmPassword) {
			setPasswordError('Passwords do not match.');
			setLoading(false); // Set loading to false on error
			return;
		}

		try {
			const response = await fetch(`${config.apiUrl}/api/auth/signup`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(formData),
			});

			const data = await response.json();

			if (response.ok) {
				setSuccessMessage('Signup successful! You can now log in.');
				setSnackbarOpen(true);
				setTimeout(() => {
					setLoading(false); // Set loading to false before navigating
					navigate('/login');
				}, 3000); // Wait for 3 seconds before navigating
			} else {
				setError(data.message);
				setLoading(false); // Set loading to false on error
			}
		} catch (err) {
			setError('An error occurred. Please try again.');
			setLoading(false); // Set loading to false on error
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
					Sign Up
				</Typography>
				{error && (
					<Alert severity="error" sx={{ mt: 2 }}>
						{error}
					</Alert>
				)}
				{emailError && (
					<Alert severity="error" sx={{ mt: 2 }}>
						{emailError}
					</Alert>
				)}
				{passwordError && (
					<Alert severity="error" sx={{ mt: 2 }}>
						{passwordError}
					</Alert>
				)}
				<Box component="form" onSubmit={handleSubmit} sx={{ mt: 1 }}>
					<TextField
						margin="normal"
						required
						fullWidth
						id="name"
						label="Full Name"
						name="name"
						autoComplete="name"
						autoFocus
						value={formData.name}
						onChange={handleChange}
						disabled={loading} // Disable input when loading
					/>
					<TextField
						margin="normal"
						required
						fullWidth
						id="email"
						label="Email Address"
						name="email"
						autoComplete="email"
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
						autoComplete="new-password"
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
					<TextField
						margin="normal"
						required
						fullWidth
						name="confirmPassword"
						label="Confirm Password"
						type={showConfirmPassword ? 'text' : 'password'}
						id="confirmPassword"
						autoComplete="new-password"
						value={formData.confirmPassword}
						onChange={handleChange}
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<IconButton
										aria-label="toggle confirm password visibility"
										onClick={() => setShowConfirmPassword(!showConfirmPassword)}
										onMouseDown={(e) => e.preventDefault()}
									>
										{showConfirmPassword ? <Visibility /> : <VisibilityOff />}
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
							'Sign Up'
						)}
					</Button>
					<Typography variant="body2" align="center">
						Already have an account?{' '}
						<Link href="/login" variant="body2">
							Login
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

export default Signup;
