import React, { useState, useEffect } from 'react';
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TextField,
	Button,
	Typography,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Alert,
	Box,
	Stepper,
	Step,
	StepLabel,
	IconButton,
	useTheme,
	useMediaQuery,
	InputAdornment,
	Tooltip,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { addDays, set, format, isBefore } from 'date-fns';
import InfoIcon from '@mui/icons-material/Info';
import { isValidPhoneNumber } from 'libphonenumber-js'; // Ensure this import is present
import config from '../config';
import { DEMO_CONFIG } from '../config/demo';
import { Link, useNavigate } from 'react-router-dom';
import {
	isWeekday,
	isWithinBusinessHours,
	isValidAppointmentTime,
	getTimeSlots,
	toAppointmentISOString,
} from '../utils/dateUtils';

function BookingModal({ open, onClose, initialCategory, initialService }) {
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
	const [activeStep, setActiveStep] = useState(0);
	const [formData, setFormData] = useState({
		treatment: initialService?._id || '',
		treatmentName: initialService?.name || '',
		appointmentTime: null,
		notes: '',
		name: '',
		email: '',
		phone: '',
		weight: '',
		height: '',
		address: '',
	});
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [emailError, setEmailError] = useState('');
	const [phoneError, setPhoneError] = useState('');
	const [doctorPreference, setDoctorPreference] = useState('any');
	const [services, setServices] = useState([]);
	const [selectedService, setSelectedService] = useState(
		initialService || null
	);
	const [categories, setCategories] = useState([]);
	const [selectedCategory, setSelectedCategory] = useState(
		initialCategory?._id || ''
	);
	const [bookedSlots, setBookedSlots] = useState([]);
	const [preFilledData, setPreFilledData] = useState({
		name: '',
		email: '',
		phone: '',
		address: '',
		weight: '',
		height: '',
	});
	const navigate = useNavigate();

	// Check if user is using demo credentials
	const isDemoUser = () => {
		if (!DEMO_CONFIG.ENABLE_DEMO_MODE) return false;
		const user = JSON.parse(localStorage.getItem('user'));
		return DEMO_CONFIG.DEMO_CREDENTIALS.some(
			(cred) => cred.email === user?.email
		);
	};

	useEffect(() => {
		const fetchUserDetails = async () => {
			if (open && localStorage.getItem('token')) {
				try {
					const response = await fetch(
						`${config.apiUrl}/api/auth/user-details`,
						{
							headers: {
								Authorization: `Bearer ${localStorage.getItem('token')}`,
							},
						}
					);

					if (response.ok) {
						const userData = await response.json();
						setPreFilledData({
							name: userData.name || '',
							email: userData.email || '',
							phone: userData.phone || '',
							address: userData.address || '',
							weight: userData.weight || '',
							height: userData.height || '',
						});
						setFormData((prevData) => ({
							...prevData,
							name: userData.name || '',
							email: userData.email || '',
							phone: userData.phone || '',
							weight: userData.weight || '',
							height: userData.height || '',
							address: userData.address || '',
						}));
					}
				} catch (error) {
					console.error('Error fetching user details:', error);
				}
			}
		};

		fetchUserDetails();
	}, [open]);

	useEffect(() => {
		const fetchServices = async () => {
			try {
				const response = await fetch(`${config.apiUrl}/api/services`);
				const data = await response.json();
				setServices(data);
			} catch (error) {
				console.error('Error fetching services:', error);
			}
		};
		fetchServices();
	}, []);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await fetch(`${config.apiUrl}/api/categories`);
				const data = await response.json();
				setCategories(data);
			} catch (error) {
				console.error('Error fetching categories:', error);
			}
		};
		fetchCategories();
	}, []);

	useEffect(() => {
		if (open && initialCategory && initialService && initialService.name) {
			setSelectedCategory(initialCategory._id);
			setSelectedService(initialService);
			setFormData((prev) => ({
				...prev,
				treatmentName: initialService.name,
				treatment: initialService._id,
			}));
		}
	}, [open, initialCategory, initialService]);

	const steps = [
		'Personal Details',
		'Select Service',
		'Choose Date and Time',
		'Additional Information',
	];

	const handleNext = async () => {
		if (activeStep === 0) {
			// Validate required fields for step 1
			if (
				!formData.name ||
				!formData.email ||
				!formData.phone ||
				!formData.address
			) {
				setError('Please fill in all required fields');
				return;
			}

			// Validate email format
			if (!isValidEmail(formData.email)) {
				setEmailError('Please enter a valid email address');
				return;
			}

			// Only check for existing email if user is NOT logged in
			if (!localStorage.getItem('token')) {
				try {
					// Check if email exists in User collection
					const response = await fetch(
						`${config.apiUrl}/api/auth/check-email/${formData.email}`
					);
					const data = await response.json();

					if (data.exists) {
						setError(
							'This email is already registered. Please login to book an appointment.'
						);
						return;
					}
				} catch (error) {
					console.error('Error checking email:', error);
					setError('An error occurred. Please try again.');
					return;
				}
			}

			// Clear any existing errors and proceed
			setError('');
			setEmailError('');
			setActiveStep((prevStep) => prevStep + 1);
		} else if (activeStep === steps.length - 1) {
			handleSubmit();
		} else {
			setActiveStep((prevStep) => prevStep + 1);
		}
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
		setError('');
	};

	const handleSubmit = async () => {
		if (
			!formData.appointmentTime ||
			!isValidAppointmentTime(formData.appointmentTime)
		) {
			setError('Please select a valid appointment time.');
			return;
		}

		try {
			const cleanPhone = formData.phone.replace(/\s+/g, '');

			// Format doctor preference message
			let preferenceMessage = '';
			switch (doctorPreference) {
				case 'male':
					preferenceMessage = 'Male doctor preferred';
					break;
				case 'female':
					preferenceMessage = 'Female doctor preferred';
					break;
				case 'any':
				default:
					break;
			}

			// Combine preference message with notes
			const notesWithPreference = `${preferenceMessage}\n\n${formData.notes}`;

			// First, update the user's phone number if they're logged in (but not in demo mode)
			const token = localStorage.getItem('token');
			if (token && !isDemoUser()) {
				const updateResponse = await fetch(
					`${config.apiUrl}/api/auth/update-user`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({
							phone: cleanPhone,
							address: formData.address,
							...(formData.weight && { weight: formData.weight }),
							...(formData.height && { height: formData.height }),
						}),
					}
				);

				if (!updateResponse.ok) {
					throw new Error('Failed to update user details');
				}
			}

			// Create appointment with formatted notes
			const appointmentData = {
				...formData,
				status: 'confirmed',
				doctorPreference,
				appointmentTime: toAppointmentISOString(formData.appointmentTime),
				phone: cleanPhone,
				notes: notesWithPreference,
			};

			// Only include weight/height in appointment if user is not logged in
			if (!token) {
				appointmentData.weight = formData.weight || null;
				appointmentData.height = formData.height || null;
			}

			const response = await fetch(`${config.apiUrl}/api/appointments/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(appointmentData),
			});

			const data = await response.json();

			if (response.ok) {
				// Personalized success message based on login status
				if (localStorage.getItem('token')) {
					setSuccess(
						'Appointment booked successfully! You can view and manage your appointments in your dashboard.'
					);
				} else {
					setSuccess(
						'Appointment booked successfully! Create an account to manage your appointments and access additional features.'
					);
				}

				// Reset all states after successful submission
				setTimeout(() => {
					onClose();
					setFormData({
						treatment: '',
						treatmentName: '',
						appointmentTime: null,
						notes: '',
						name: '',
						email: '',
						phone: '',
						weight: '',
						height: '',
						address: '',
					});
					setDoctorPreference('any');
					setActiveStep(0);
					setError('');
					setSuccess('');
					setEmailError('');
					setPhoneError('');
					setSelectedService(null);
					setSelectedCategory('');
					setBookedSlots([]);

					// Navigate to dashboard if user is logged in
					if (localStorage.getItem('token')) {
						navigate('/dashboard');
					}
				}, 4000);
			} else {
				setError(data.message);
			}
		} catch (error) {
			console.error('Error booking appointment:', error);
			setError(error.message || 'Failed to book appointment');
		}
	};

	const handleEmailChange = (e) => {
		const emailValue = e.target.value;
		setFormData({ ...formData, email: emailValue });

		// Validate email live
		if (!isValidEmail(emailValue)) {
			setEmailError(
				'Please enter a valid email address. Example: user@example.com'
			);
		} else {
			setEmailError('');
		}
	};

	const handlePhoneChange = (e) => {
		const phoneValue = e.target.value;
		setFormData({ ...formData, phone: phoneValue });

		// Validate phone live
		if (!isValidPhone(phoneValue)) {
			setPhoneError('Please enter a valid phone number. Example: +60123456789');
		} else {
			setPhoneError('');
		}
	};

	const isValidEmail = (email) => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	const isValidPhone = (phone) => {
		return isValidPhoneNumber(phone);
	};

	const handleTreatmentChange = (event) => {
		const selected = services.find(
			(service) => service._id === event.target.value
		);
		setSelectedService(selected);
		setFormData((prev) => ({
			...prev,
			treatment: selected?._id || '',
			treatmentName: selected?.name || '',
		}));
	};

	const handleCategoryChange = (event) => {
		setSelectedCategory(event.target.value);
		setSelectedService(null);
		setFormData((prev) => ({
			...prev,
			treatment: '',
			treatmentName: '',
		}));
	};

	const getStepContent = (step) => {
		switch (step) {
			case 0:
				return (
					<Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
						{localStorage.getItem('token') && (
							<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
								<Typography variant="h6">Personal Information</Typography>
								<Tooltip
									title={
										<Typography>
											To update your personal information, please go to{' '}
											<Link
												to="/profile"
												style={{
													color: 'inherit',
													textDecoration: 'underline',
												}}
												onClick={() => onClose()}
											>
												Profile Settings
											</Link>
										</Typography>
									}
									placement="right"
									arrow
								>
									<InfoIcon
										color="primary"
										sx={{
											cursor: 'help',
											fontSize: '1.2rem',
										}}
									/>
								</Tooltip>
							</Box>
						)}
						<TextField
							fullWidth
							label="Full Name"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
							disabled={!!localStorage.getItem('token') && !!preFilledData.name}
							sx={{
								'& .MuiInputBase-input.Mui-disabled': {
									bgcolor: 'rgba(0, 0, 0, 0.05)',
									WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
								},
							}}
						/>
						<TextField
							fullWidth
							label="Email"
							type="email"
							value={formData.email}
							onChange={handleEmailChange}
							error={!!emailError}
							helperText={emailError}
							required
							disabled={
								!!localStorage.getItem('token') && !!preFilledData.email
							}
							sx={{
								'& .MuiInputBase-input.Mui-disabled': {
									bgcolor: 'rgba(0, 0, 0, 0.05)',
									WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
								},
							}}
						/>
						<TextField
							fullWidth
							label="Phone Number"
							value={formData.phone}
							onChange={handlePhoneChange}
							error={!!phoneError}
							helperText={phoneError}
							required
							disabled={
								!!localStorage.getItem('token') && !!preFilledData.phone
							}
							sx={{
								'& .MuiInputBase-input.Mui-disabled': {
									bgcolor: 'rgba(0, 0, 0, 0.05)',
									WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
								},
							}}
						/>
						<TextField
							fullWidth
							label="Address"
							multiline
							minRows={2}
							maxRows={4}
							value={formData.address}
							onChange={(e) =>
								setFormData({ ...formData, address: e.target.value })
							}
							required
							placeholder="Please enter your complete address including street, city, state, and postal code."
							disabled={
								!!localStorage.getItem('token') && !!preFilledData.address
							}
							sx={{
								'& .MuiInputBase-root.Mui-disabled': {
									bgcolor: 'rgba(0, 0, 0, 0.05)',
								},
								'& .MuiInputBase-input.Mui-disabled': {
									WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
								},
							}}
						/>
						<TextField
							fullWidth
							label="Weight (kg)"
							value={formData.weight}
							onChange={(e) =>
								setFormData({ ...formData, weight: e.target.value })
							}
							disabled={
								!!localStorage.getItem('token') && !!preFilledData.weight
							}
							sx={{
								'& .MuiInputBase-input.Mui-disabled': {
									bgcolor: 'rgba(0, 0, 0, 0.05)',
									WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
								},
							}}
						/>
						<TextField
							fullWidth
							label="Height (cm)"
							value={formData.height}
							onChange={(e) =>
								setFormData({ ...formData, height: e.target.value })
							}
							disabled={
								!!localStorage.getItem('token') && !!preFilledData.height
							}
							sx={{
								'& .MuiInputBase-input.Mui-disabled': {
									bgcolor: 'rgba(0, 0, 0, 0.05)',
									WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
								},
							}}
						/>
					</Box>
				);
			case 1:
				return (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						<FormControl fullWidth required>
							<InputLabel>Select Category</InputLabel>
							<Select
								value={selectedCategory}
								onChange={handleCategoryChange}
								label="Select Category"
							>
								{categories.map((category) => (
									<MenuItem key={category._id} value={category._id}>
										<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
											{category.image?.data && (
												<Box
													component="img"
													src={category.image.data}
													alt={category.name}
													sx={{ width: 24, height: 24, borderRadius: '50%' }}
												/>
											)}
											{category.name}
										</Box>
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<FormControl fullWidth required>
							<InputLabel>Select Service</InputLabel>
							<Select
								value={formData.treatment}
								onChange={handleTreatmentChange}
								label="Select Service"
								disabled={!selectedCategory}
							>
								{services
									.filter((service) => {
										if (!service || !service.category) return false;
										const serviceCategory =
											service.category._id || service.category;
										return (
											serviceCategory?.toString() ===
											selectedCategory?.toString()
										);
									})
									.map((service) => (
										<MenuItem key={service._id} value={service._id}>
											{service.name}
										</MenuItem>
									))}
							</Select>
						</FormControl>

						{selectedService && (
							<Box
								sx={{
									bgcolor: 'grey.50',
									p: 2,
									borderRadius: 1,
									border: '1px solid',
									borderColor: 'grey.200',
								}}
							>
								<Typography variant="subtitle1" color="primary" gutterBottom>
									Service Details
								</Typography>

								<Box sx={{ display: 'grid', gap: 2 }}>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<Typography variant="body2" color="text.secondary">
											Duration:
										</Typography>
										<Typography variant="body1">
											{selectedService.duration} minutes
										</Typography>
									</Box>

									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
										}}
									>
										<Typography variant="body2" color="text.secondary">
											Price:
										</Typography>
										<Typography variant="body1">
											RM {selectedService.price}
										</Typography>
									</Box>

									<Box sx={{ mt: 1 }}>
										<Typography variant="body2" color="text.secondary">
											Description:
										</Typography>
										<Typography variant="body1" sx={{ mt: 0.5 }}>
											{selectedService.description}
										</Typography>
									</Box>
								</Box>
							</Box>
						)}
					</Box>
				);
			case 2:
				return (
					<LocalizationProvider dateAdapter={AdapterDateFns}>
						<Box sx={{ mt: 2 }}>
							<Box
								sx={{
									mb: 2,
									bgcolor: '#000',
									p: 3,
									borderRadius: 1,
									boxShadow: 2,
								}}
							>
								<Typography
									variant="h6"
									color="#FF5733"
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 1,
										fontWeight: 'bold',
									}}
								>
									<InfoIcon fontSize="small" sx={{ color: '#FF5733' }} />
									Appointment Guidelines:
								</Typography>
								<Typography variant="body1" color="#FF5733" sx={{ mt: 1 }}>
									<ul>
										<li>Available Monday-Friday, 9:00 AM - 5:00 PM</li>
										<li>Appointments are scheduled in 30-minute slots</li>
										<li>Please arrive 10 minutes before your appointment</li>
										<li>Bookings can be made up to 30 days in advance</li>
									</ul>
								</Typography>
							</Box>

							<DatePicker
								label="Select Appointment Date"
								value={formData.appointmentTime}
								onChange={(newValue) => {
									// Reset the time when date changes by setting hours and minutes to 0
									const newDate = newValue
										? set(newValue, { hours: 0, minutes: 0, seconds: 0 })
										: null;
									setFormData({
										...formData,
										appointmentTime: newDate,
									});
								}}
								shouldDisableDate={(date) => !isWeekday(date)}
								minDate={new Date()}
								maxDate={addDays(new Date(), 30)}
								views={['year', 'month', 'day']}
								slotProps={{
									textField: {
										fullWidth: true,
										required: true,
									},
								}}
							/>

							<Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
								<Typography
									variant="subtitle2"
									color="text.secondary"
									sx={{ width: '100%' }}
								>
									Available Time Slots:
								</Typography>
								{getTimeSlots().map((slot) => {
									const isBooked = bookedSlots.includes(slot);
									return (
										<Button
											key={slot}
											size="small"
											variant={
												formData.appointmentTime &&
												format(formData.appointmentTime, 'h:mm a') === slot
													? 'contained'
													: 'outlined'
											}
											color="primary"
											onClick={() => {
												if (formData.appointmentTime) {
													const [time, period] = slot.split(' ');
													const [hours, minutes] = time.split(':');
													let hour = parseInt(hours);

													if (period === 'PM' && hour !== 12) {
														hour += 12;
													} else if (period === 'AM' && hour === 12) {
														hour = 0;
													}

													const newDate = set(formData.appointmentTime, {
														hours: hour,
														minutes: parseInt(minutes),
													});

													setFormData({
														...formData,
														appointmentTime: newDate,
													});
												}
											}}
											disabled={
												!formData.appointmentTime ||
												!isWeekday(formData.appointmentTime) ||
												isBooked ||
												(() => {
													if (!formData.appointmentTime) return true;

													const now = new Date();
													const slotTime = new Date(formData.appointmentTime);
													const [time, period] = slot.split(' ');
													const [hours, minutes] = time.split(':');
													let hour = parseInt(hours);

													if (period === 'PM' && hour !== 12) {
														hour += 12;
													} else if (period === 'AM' && hour === 12) {
														hour = 0;
													}

													slotTime.setHours(hour, parseInt(minutes), 0, 0);

													if (slotTime.toDateString() !== now.toDateString()) {
														return false;
													}

													return isBefore(slotTime, now);
												})()
											}
											sx={{
												minWidth: '90px',
												width: '90px', // Fixed width
												height: '60px', // Fixed height
												fontSize: '0.875rem',
												display: 'flex',
												flexDirection: 'column',
												justifyContent: 'center',
												alignItems: 'center',
												padding: '8px',
												...(isBooked && {
													bgcolor: 'grey.300',
													color: 'grey.500',
													borderColor: 'grey.400',
													cursor: 'not-allowed',
													'&:hover': {
														bgcolor: 'grey.300',
														borderColor: 'grey.400',
													},
													'&.Mui-disabled': {
														bgcolor: 'grey.300',
														color: 'grey.500',
													},
												}),
											}}
										>
											<Box
												sx={{
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'center',
													width: '100%',
													height: '100%',
													justifyContent: 'center',
												}}
											>
												{slot}
												{isBooked && (
													<Typography
														variant="caption"
														display="block"
														color="error"
														sx={{ mt: 0.5 }}
													>
														Booked
													</Typography>
												)}
											</Box>
										</Button>
									);
								})}
							</Box>
						</Box>
					</LocalizationProvider>
				);
			case 3:
				return (
					<Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 3 }}>
						<FormControl fullWidth>
							<InputLabel>Preferred Doctor Gender</InputLabel>
							<Select
								value={doctorPreference}
								label="Preferred Doctor Gender"
								onChange={(e) => setDoctorPreference(e.target.value)}
							>
								<MenuItem value="any">No Preference</MenuItem>
								<MenuItem value="male">Male Doctor</MenuItem>
								<MenuItem value="female">Female Doctor</MenuItem>
							</Select>
							<Typography
								variant="caption"
								color="text.secondary"
								sx={{
									mt: 1,
									ml: 1,
									display: 'flex',
									alignItems: 'center',
									gap: 0.5,
								}}
							>
								<InfoIcon sx={{ fontSize: 16 }} />
								This preference will be considered but cannot be guaranteed
								based on doctor availability
							</Typography>
						</FormControl>

						<TextField
							fullWidth
							multiline
							rows={4}
							label="Additional Notes"
							value={formData.notes}
							onChange={(e) =>
								setFormData({ ...formData, notes: e.target.value })
							}
							placeholder="Please provide any additional information or specific concerns..."
						/>
					</Box>
				);
			default:
				return 'Unknown step';
		}
	};

	const isStepValid = (step) => {
		switch (step) {
			case 0:
				return (
					formData.name &&
					formData.email &&
					formData.phone &&
					formData.address &&
					!emailError &&
					!phoneError
				);
			case 1:
				return formData.treatment;
			case 2:
				return (
					formData.appointmentTime &&
					isValidAppointmentTime(formData.appointmentTime)
				);
			case 3:
				return true; // Notes are optional
			default:
				return false;
		}
	};

	const fetchBookedSlots = async (date) => {
		try {
			const formattedDate = format(date, 'yyyy-MM-dd');
			const response = await fetch(
				`${config.apiUrl}/api/appointments/booked-slots?date=${formattedDate}`
			);
			const data = await response.json();
			setBookedSlots(data.bookedSlots || []);
		} catch (error) {
			console.error('Error fetching booked slots:', error);
			setBookedSlots([]);
		}
	};

	useEffect(() => {
		if (formData.appointmentTime) {
			fetchBookedSlots(formData.appointmentTime);
		}
	}, [formData.appointmentTime]);

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullScreen={fullScreen}
			maxWidth="sm"
			fullWidth
			sx={{
				'& .MuiDialog-paper': {
					overflowX: 'hidden', // Prevent horizontal scrolling
					margin: { xs: 2, sm: 3 }, // Responsive margins
				},
			}}
		>
			<DialogTitle
				sx={{
					m: 0,
					p: 2,
					bgcolor: 'primary.main',
					color: 'white',
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'space-between',
				}}
			>
				<Typography variant="h6" component="div">
					Book an Appointment
				</Typography>
				<IconButton
					onClick={onClose}
					sx={{
						color: 'white',
						'&:hover': {
							bgcolor: 'rgba(255,255,255,0.1)',
						},
					}}
				>
					<CloseIcon />
				</IconButton>
			</DialogTitle>

			<DialogContent
				sx={{
					mt: 2,
					p: { xs: 2, sm: 3 }, // Responsive padding
					overflowX: 'hidden', // Prevent horizontal scrolling
				}}
			>
				{(error || success) && (
					<Alert
						severity={error ? 'error' : 'success'}
						sx={{ mb: 3 }}
						onClose={() => {
							setError('');
							setSuccess('');
						}}
					>
						{error || success}
					</Alert>
				)}

				<Stepper
					activeStep={activeStep}
					sx={{
						mb: 4,
						'& .MuiStepLabel-root .Mui-completed': {
							color: 'secondary.main',
						},
						'& .MuiStepLabel-root .Mui-active': {
							color: 'secondary.main',
						},
					}}
				>
					{steps.map((label) => (
						<Step key={label}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>

				<Box sx={{ minHeight: '200px' }}>{getStepContent(activeStep)}</Box>
			</DialogContent>

			<DialogActions
				sx={{
					p: { xs: 2, sm: 3 },
					gap: 1,
					overflowX: 'hidden', // Prevent horizontal scrolling
				}}
			>
				<Button
					disabled={activeStep === 0}
					onClick={handleBack}
					variant="outlined"
					sx={{
						borderRadius: '50px',
						px: 3,
					}}
				>
					Back
				</Button>
				<Button
					variant="contained"
					onClick={handleNext}
					disabled={!isStepValid(activeStep)}
					sx={{
						borderRadius: '50px',
						px: 4,
						bgcolor: 'secondary.main',
						'&:hover': {
							bgcolor: 'secondary.dark',
						},
					}}
				>
					{activeStep === steps.length - 1 ? 'Book Appointment' : 'Next'}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

export default BookingModal;
