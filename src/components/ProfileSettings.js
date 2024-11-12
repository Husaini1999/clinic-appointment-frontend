import React, { useState, useEffect, useCallback } from 'react';
import {
	Box,
	Container,
	Paper,
	Typography,
	TextField,
	Button,
	Snackbar,
	Alert,
	Grid,
	IconButton,
	InputAdornment,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
} from '@mui/material';
import {
	Visibility,
	VisibilityOff,
	CheckCircle as CheckCircleIcon,
	Cancel as CancelIcon,
} from '@mui/icons-material';
import { isValidPhoneNumber } from 'libphonenumber-js';
import config from '../config';

function ProfileSettings() {
	const [userData, setUserData] = useState({
		name: '',
		email: '',
		phone: '',
	});

	const [passwordData, setPasswordData] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	const [showPasswords, setShowPasswords] = useState({
		current: false,
		new: false,
		confirm: false,
	});

	const [loading, setLoading] = useState(false);
	const [message, setMessage] = useState({ text: '', severity: 'success' });
	const [snackbarOpen, setSnackbarOpen] = useState(false);

	const [passwordValidation, setPasswordValidation] = useState({
		minLength: false,
		hasNumber: false,
	});

	const [passwordErrors, setPasswordErrors] = useState({
		currentPassword: '',
		newPassword: '',
		confirmPassword: '',
	});

	const [phoneError, setPhoneError] = useState('');

	const fetchUserData = useCallback(async () => {
		try {
			const response = await fetch(`${config.apiUrl}/api/auth/user-details`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});

			if (response.ok) {
				const data = await response.json();
				setUserData({
					name: data.name || '',
					email: data.email || '',
					phone: data.phone || '',
				});
			}
		} catch (error) {
			showMessage('Error fetching user data', 'error');
		}
	}, []);

	useEffect(() => {
		fetchUserData();
	}, [fetchUserData]);

	const handleProfileUpdate = async (e) => {
		e.preventDefault();

		// Remove spaces from phone number before validation and submission
		const cleanPhone = userData.phone.replace(/\s+/g, '');

		if (!cleanPhone || !isValidPhoneNumber(cleanPhone)) {
			setPhoneError('Please enter a valid phone number');
			showMessage('Please enter a valid phone number', 'error');
			return;
		}
		setPhoneError('');
		setLoading(true);

		try {
			const response = await fetch(`${config.apiUrl}/api/auth/update-user`, {
				method: 'PUT',
				headers: {
					'Content-Type': 'application/json',
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				// Send cleaned phone number to backend
				body: JSON.stringify({
					...userData,
					phone: cleanPhone,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				showMessage('Profile updated successfully', 'success');
				const user = JSON.parse(localStorage.getItem('user'));
				localStorage.setItem(
					'user',
					JSON.stringify({ ...user, ...userData, phone: cleanPhone })
				);
			} else {
				showMessage(data.message || 'Error updating profile', 'error');
			}
		} catch (error) {
			showMessage('Error updating profile', 'error');
		} finally {
			setLoading(false);
		}
	};

	// Reference to validatePassword function
	// Reference: frontend/src/components/ProfileSettings.js lines 203-213

	const validatePassword = (password) => {
		const validations = {
			minLength: password.length >= 6,
			hasNumber: /\d/.test(password),
		};
		setPasswordValidation(validations);
		return Object.values(validations).every(Boolean);
	};

	// Reference to handlePasswordChange function
	// Reference: frontend/src/components/ProfileSettings.js lines 120-201

	const handlePasswordChange = async (e) => {
		e.preventDefault();
		setPasswordErrors({
			currentPassword: '',
			newPassword: '',
			confirmPassword: '',
		});

		if (!validatePassword(passwordData.newPassword)) {
			setPasswordErrors((prev) => ({
				...prev,
				newPassword: 'Password does not meet requirements',
			}));
			return;
		}

		if (passwordData.newPassword !== passwordData.confirmPassword) {
			setPasswordErrors((prev) => ({
				...prev,
				confirmPassword: 'Passwords do not match',
			}));
			return;
		}

		setLoading(true);

		try {
			const response = await fetch(
				`${config.apiUrl}/api/auth/change-password`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
					body: JSON.stringify({
						currentPassword: passwordData.currentPassword,
						newPassword: passwordData.newPassword,
					}),
				}
			);

			const data = await response.json();

			if (response.ok) {
				showMessage('Password updated successfully', 'success');
				setPasswordData({
					currentPassword: '',
					newPassword: '',
					confirmPassword: '',
				});
				setPasswordValidation({
					minLength: false,
					hasNumber: false,
				});
			} else {
				if (data.message.includes('current password')) {
					setPasswordErrors((prev) => ({
						...prev,
						currentPassword: 'Current password is incorrect',
					}));
				} else if (data.message.includes('at least 6 characters')) {
					setPasswordErrors((prev) => ({
						...prev,
						newPassword: 'Password must be at least 6 characters',
					}));
				} else {
					showMessage(data.message || 'Error updating password', 'error');
				}
			}
		} catch (error) {
			showMessage('Error updating password', 'error');
		} finally {
			setLoading(false);
		}
	};

	const showMessage = (text, severity) => {
		setMessage({ text, severity });
		setSnackbarOpen(true);
	};

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
			<Typography variant="h4" gutterBottom>
				Profile Settings
			</Typography>

			<Paper sx={{ p: 3, mb: 3 }}>
				<Typography variant="h6" gutterBottom>
					Personal Information
				</Typography>
				<form onSubmit={handleProfileUpdate}>
					<Grid container spacing={2}>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Name"
								value={userData.name}
								onChange={(e) =>
									setUserData({ ...userData, name: e.target.value })
								}
								disabled={loading}
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Email"
								value={userData.email}
								disabled
								helperText="Email cannot be changed"
							/>
						</Grid>
						<Grid item xs={12}>
							<TextField
								fullWidth
								label="Phone"
								value={userData.phone}
								onChange={(e) =>
									setUserData({ ...userData, phone: e.target.value })
								}
								error={!!phoneError}
								helperText={phoneError}
								disabled={loading}
								required
								placeholder="+60123456789"
							/>
						</Grid>
						<Grid item xs={12}>
							<Button type="submit" variant="contained" disabled={loading}>
								Update Profile
							</Button>
						</Grid>
					</Grid>
				</form>
			</Paper>

			<Paper sx={{ p: 3 }}>
				<Typography variant="h6" gutterBottom>
					Change Password
				</Typography>
				<form onSubmit={handlePasswordChange}>
					<Grid container spacing={2}>
						{/* Current Password Field */}
						<Grid item xs={12}>
							<TextField
								fullWidth
								type={showPasswords.current ? 'text' : 'password'}
								label="Current Password"
								value={passwordData.currentPassword}
								onChange={(e) => {
									setPasswordData({
										...passwordData,
										currentPassword: e.target.value,
									});
									setPasswordErrors({
										...passwordErrors,
										currentPassword: '',
									});
								}}
								error={!!passwordErrors.currentPassword}
								helperText={passwordErrors.currentPassword}
								disabled={loading}
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											<IconButton
												onClick={() =>
													setShowPasswords({
														...showPasswords,
														current: !showPasswords.current,
													})
												}
												edge="end"
											>
												{showPasswords.current ? (
													<VisibilityOff />
												) : (
													<Visibility />
												)}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>
						</Grid>

						{/* New Password Field */}
						<Grid item xs={12}>
							<TextField
								fullWidth
								type={showPasswords.new ? 'text' : 'password'}
								label="New Password"
								value={passwordData.newPassword}
								onChange={(e) => {
									const newPass = e.target.value;
									setPasswordData({
										...passwordData,
										newPassword: newPass,
									});
									validatePassword(newPass);
									setPasswordErrors({
										...passwordErrors,
										newPassword: '',
									});
								}}
								error={!!passwordErrors.newPassword}
								helperText={passwordErrors.newPassword}
								disabled={loading}
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											<IconButton
												onClick={() =>
													setShowPasswords({
														...showPasswords,
														new: !showPasswords.new,
													})
												}
												edge="end"
											>
												{showPasswords.new ? <VisibilityOff /> : <Visibility />}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>
						</Grid>

						{/* Password Requirements */}
						{passwordData.newPassword && (
							<Grid item xs={12}>
								<Box sx={{ mt: 1 }}>
									<Typography variant="caption" color="textSecondary">
										Password Requirements:
									</Typography>
									<List dense>
										<ListItem>
											<ListItemIcon>
												{passwordValidation.minLength ? (
													<CheckCircleIcon color="success" fontSize="small" />
												) : (
													<CancelIcon color="error" fontSize="small" />
												)}
											</ListItemIcon>
											<ListItemText
												primary="At least 6 characters"
												sx={{
													color: passwordValidation.minLength
														? 'success.main'
														: 'error.main',
												}}
											/>
										</ListItem>
										<ListItem>
											<ListItemIcon>
												{passwordValidation.hasNumber ? (
													<CheckCircleIcon color="success" fontSize="small" />
												) : (
													<CancelIcon color="error" fontSize="small" />
												)}
											</ListItemIcon>
											<ListItemText
												primary="Contains a number"
												sx={{
													color: passwordValidation.hasNumber
														? 'success.main'
														: 'error.main',
												}}
											/>
										</ListItem>
										{/* Add more password requirements here */}
									</List>
								</Box>
							</Grid>
						)}

						{/* Confirm Password Field */}
						<Grid item xs={12}>
							<TextField
								fullWidth
								type={showPasswords.confirm ? 'text' : 'password'}
								label="Confirm New Password"
								value={passwordData.confirmPassword}
								onChange={(e) => {
									setPasswordData({
										...passwordData,
										confirmPassword: e.target.value,
									});
									setPasswordErrors({
										...passwordErrors,
										confirmPassword: '',
									});
								}}
								error={!!passwordErrors.confirmPassword}
								helperText={passwordErrors.confirmPassword}
								disabled={loading}
								InputProps={{
									endAdornment: (
										<InputAdornment position="end">
											<IconButton
												onClick={() =>
													setShowPasswords({
														...showPasswords,
														confirm: !showPasswords.confirm,
													})
												}
												edge="end"
											>
												{showPasswords.confirm ? (
													<VisibilityOff />
												) : (
													<Visibility />
												)}
											</IconButton>
										</InputAdornment>
									),
								}}
							/>
						</Grid>

						<Grid item xs={12}>
							<Button
								type="submit"
								variant="contained"
								disabled={
									loading || !Object.values(passwordValidation).every(Boolean)
								}
							>
								Change Password
							</Button>
						</Grid>
					</Grid>
				</form>
			</Paper>

			<Snackbar
				open={snackbarOpen}
				autoHideDuration={6000}
				onClose={() => setSnackbarOpen(false)}
			>
				<Alert
					onClose={() => setSnackbarOpen(false)}
					severity={message.severity}
					sx={{ width: '100%' }}
				>
					{message.text}
				</Alert>
			</Snackbar>
		</Container>
	);
}

export default ProfileSettings;
