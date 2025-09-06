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
	Accordion,
	AccordionSummary,
	AccordionDetails,
	Card,
	CardContent,
	Chip,
	Divider,
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import InfoIcon from '@mui/icons-material/Info';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import config from '../config';
import DEMO_CONFIG from '../config/demo';

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

	const showMessage = (message, severity = 'success') => {
		if (severity === 'error') {
			setError(message);
		} else {
			setSuccessMessage(message);
			setSnackbarOpen(true);
		}
	};

	useEffect(() => {
		if (expired) {
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

	const handleDemoLogin = (email, password) => {
		setFormData({ email, password });
		// Clear any existing errors when demo credentials are used
		setError('');
		// Show a brief success message
		showMessage(
			'Demo credentials filled! Now click "Sign In" to start exploring.',
			'success'
		);
	};

	const handleCopyToClipboard = (text) => {
		navigator.clipboard.writeText(text);
		showMessage('Copied to clipboard!', 'success');
	};

	return (
		<Container
			component="main"
			maxWidth="sm"
			sx={{
				display: 'flex',
				flexDirection: 'column',
				justifyContent: 'center',
				alignItems: 'center',
				minHeight: '100vh',
				gap: 3,
			}}
		>
			{/* Demo Mode Section */}
			{DEMO_CONFIG.ENABLE_DEMO_MODE && (
				<Paper
					elevation={3}
					sx={{
						width: '100%',
						maxWidth: 500,
						background: 'linear-gradient(135deg, #fff3e0 0%, #ffe0b2 100%)',
						border: '2px solid #ffa726',
					}}
				>
					<Accordion sx={{ boxShadow: 'none', background: 'transparent' }}>
						<AccordionSummary
							expandIcon={<ExpandMoreIcon />}
							sx={{
								background: 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)',
								color: 'white',
								'& .MuiAccordionSummary-content': {
									alignItems: 'center',
									gap: 1,
								},
							}}
						>
							<InfoIcon />
							<Typography variant="h6" sx={{ fontWeight: 600 }}>
								{DEMO_CONFIG.DEMO_MESSAGES.title}
							</Typography>
						</AccordionSummary>
						<AccordionDetails sx={{ p: 3 }}>
							<Alert severity="info" sx={{ mb: 2 }}>
								{DEMO_CONFIG.DEMO_MESSAGES.warning}
							</Alert>

							<Alert severity="success" sx={{ mb: 3 }}>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{DEMO_CONFIG.DEMO_MESSAGES.callToAction}
								</Typography>
							</Alert>

							{DEMO_CONFIG.DEMO_CREDENTIALS.map((credential, index) => (
								<Card
									key={index}
									sx={{
										mb: 2,
										border: `2px solid ${credential.color}`,
										'&:hover': {
											boxShadow: `0 4px 20px ${credential.color}40`,
										},
									}}
								>
									<CardContent sx={{ p: 2 }}>
										<Box
											sx={{
												display: 'flex',
												justifyContent: 'space-between',
												alignItems: 'center',
												mb: 2,
											}}
										>
											<Chip
												label={credential.role}
												sx={{
													backgroundColor: credential.color,
													color: 'white',
													fontWeight: 600,
												}}
											/>
											<Button
												size="small"
												variant="contained"
												onClick={() =>
													handleDemoLogin(credential.email, credential.password)
												}
												sx={{
													backgroundColor: credential.color,
													color: 'white',
													fontWeight: 600,
													'&:hover': {
														backgroundColor: credential.color,
														opacity: 0.9,
														transform: 'translateY(-1px)',
													},
													transition: 'all 0.2s ease',
												}}
											>
												🚀 Try {credential.role}
											</Button>
										</Box>

										<Box sx={{ mb: 2 }}>
											<Typography
												variant="body2"
												sx={{ fontWeight: 600, mb: 1 }}
											>
												Email:
											</Typography>
											<Box
												sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
											>
												<Typography
													variant="body2"
													sx={{
														fontFamily: 'monospace',
														backgroundColor: '#f5f5f5',
														p: 1,
														borderRadius: 1,
														flex: 1,
													}}
												>
													{credential.email}
												</Typography>
												<IconButton
													size="small"
													onClick={() =>
														handleCopyToClipboard(credential.email)
													}
												>
													<ContentCopyIcon fontSize="small" />
												</IconButton>
											</Box>
										</Box>

										<Box sx={{ mb: 2 }}>
											<Typography
												variant="body2"
												sx={{ fontWeight: 600, mb: 1 }}
											>
												Password:
											</Typography>
											<Box
												sx={{ display: 'flex', alignItems: 'center', gap: 1 }}
											>
												<Typography
													variant="body2"
													sx={{
														fontFamily: 'monospace',
														backgroundColor: '#f5f5f5',
														p: 1,
														borderRadius: 1,
														flex: 1,
													}}
												>
													{credential.password}
												</Typography>
												<IconButton
													size="small"
													onClick={() =>
														handleCopyToClipboard(credential.password)
													}
												>
													<ContentCopyIcon fontSize="small" />
												</IconButton>
											</Box>
										</Box>

										<Typography
											variant="body2"
											sx={{ color: 'text.secondary', fontStyle: 'italic' }}
										>
											{credential.description}
										</Typography>
									</CardContent>
								</Card>
							))}
						</AccordionDetails>
					</Accordion>
				</Paper>
			)}

			{/* Login Form */}
			<Paper
				elevation={3}
				sx={{
					padding: 4,
					width: '100%',
					maxWidth: 500,
					...(formData.email &&
						formData.password && {
							border: '2px solid #4caf50',
							boxShadow: '0 4px 20px rgba(76, 175, 80, 0.2)',
						}),
				}}
			>
				<Typography component="h1" variant="h5" align="center" sx={{ mb: 2 }}>
					Login
				</Typography>

				{DEMO_CONFIG.ENABLE_DEMO_MODE &&
					formData.email &&
					formData.password && (
						<Alert severity="success" sx={{ mb: 2 }}>
							<Typography variant="body2" sx={{ fontWeight: 600 }}>
								✅ Demo credentials loaded! Click "Sign In" to start exploring.
							</Typography>
						</Alert>
					)}
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
						sx={{
							mt: 3,
							mb: 2,
							...(formData.email &&
								formData.password && {
									background:
										'linear-gradient(45deg, #4caf50 30%, #66bb6a 90%)',
									fontSize: '1.1rem',
									fontWeight: 600,
									py: 1.5,
									'&:hover': {
										background:
											'linear-gradient(45deg, #43a047 30%, #5cb85c 90%)',
										transform: 'translateY(-2px)',
										boxShadow: '0 6px 20px rgba(76, 175, 80, 0.4)',
									},
								}),
						}}
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
