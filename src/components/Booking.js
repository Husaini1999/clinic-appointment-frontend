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
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { addDays, set, format, isBefore } from 'date-fns';
import InfoIcon from '@mui/icons-material/Info';
import { isValidPhoneNumber } from 'libphonenumber-js'; // Ensure this import is present
import config from '../config';

function BookingModal({ open, onClose }) {
	const theme = useTheme();
	const fullScreen = useMediaQuery(theme.breakpoints.down('md'));
	const [activeStep, setActiveStep] = useState(0);
	const [formData, setFormData] = useState({
		treatment: '',
		appointmentTime: null,
		notes: '',
		name: '',
		email: '',
		phone: '',
		weight: '',
		height: '',
	});
	const [error, setError] = useState('');
	const [success, setSuccess] = useState('');
	const [emailError, setEmailError] = useState('');
	const [phoneError, setPhoneError] = useState('');
	const [doctorPreference, setDoctorPreference] = useState('any');
	const [services, setServices] = useState([]);
	const [selectedService, setSelectedService] = useState(null);

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
						setFormData((prevData) => ({
							...prevData,
							name: userData.name || '',
							email: userData.email || '',
							phone: userData.phone || '',
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

	const steps = [
		'Personal Details',
		'Select Service',
		'Choose Date and Time',
		'Additional Information',
	];

	const handleNext = () => {
		if (activeStep === steps.length - 1) {
			handleSubmit();
		} else {
			setActiveStep((prevStep) => prevStep + 1);
		}
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
		setError('');
	};

	const isWeekday = (date) => {
		if (!date) return false;
		const day = date.getDay();
		return day !== 0 && day !== 6;
	};

	const isWithinBusinessHours = (date) => {
		if (!date) return false;
		const hours = date.getHours();
		const minutes = date.getMinutes();
		return hours >= 9 && (hours < 17 || (hours === 17 && minutes === 0));
	};

	const isValidAppointmentTime = (date) => {
		if (!date) return false;

		const now = new Date();
		const selectedDateTime = new Date(date);

		// If it's a future date (not today), only check business hours and weekday
		if (selectedDateTime.toDateString() !== now.toDateString()) {
			return isWeekday(date) && isWithinBusinessHours(date);
		}

		// If it's today, check if the time has passed
		if (isBefore(selectedDateTime, now)) {
			return false;
		}

		// Check if it's a weekday and within business hours
		return isWeekday(date) && isWithinBusinessHours(date);
	};

	const getTimeSlots = () => {
		const slots = [];
		const startHour = 9;
		const endHour = 17;
		const interval = 30; // minutes

		for (let hour = startHour; hour <= endHour; hour++) {
			for (let minute = 0; minute < 60; minute += interval) {
				if (hour === endHour && minute > 0) break;

				const slotDate = new Date();
				slotDate.setHours(hour, minute, 0, 0);
				slots.push(format(slotDate, 'p')); // Using 'p' format for consistent 12-hour time
			}
		}
		return slots;
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

			// First, update the user's phone number if they're logged in
			const token = localStorage.getItem('token');
			if (token) {
				const updateResponse = await fetch(
					`${config.apiUrl}/api/auth/update-user`,
					{
						method: 'PUT',
						headers: {
							'Content-Type': 'application/json',
							Authorization: `Bearer ${token}`,
						},
						body: JSON.stringify({ phone: cleanPhone }),
					}
				);

				if (!updateResponse.ok) {
					throw new Error('Failed to update user details');
				}
			}

			// Create appointment with formatted notes
			const response = await fetch(`${config.apiUrl}/api/appointments/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					...formData,
					phone: cleanPhone,
					notes: notesWithPreference,
				}),
			});

			const data = await response.json();

			if (response.ok) {
				setSuccess(
					'Appointment booked successfully! We will send a confirmation email shortly.'
				);

				setTimeout(() => {
					onClose();
					setFormData({
						treatment: '',
						appointmentTime: null,
						notes: '',
						name: '',
						email: '',
						phone: '',
						weight: '',
						height: '',
					});
					setDoctorPreference('any'); // Reset doctor preference
					setActiveStep(0);
					setSuccess('');
					setError('');
				}, 1000);
			} else {
				setError(data.message);
			}
		} catch (err) {
			console.error('Error:', err);
			setError('An error occurred. Please try again.');
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
			(service) => service.name === event.target.value
		);
		setSelectedService(selected);
		setFormData({ ...formData, treatment: event.target.value });
	};

	const getStepContent = (step) => {
		switch (step) {
			case 0:
				return (
					<Box sx={{ mt: 2, display: 'flex', flexDirection: 'column', gap: 2 }}>
						<TextField
							fullWidth
							label="Full Name"
							value={formData.name}
							onChange={(e) =>
								setFormData({ ...formData, name: e.target.value })
							}
							required
							disabled={!!formData.name && localStorage.getItem('token')}
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
							disabled={!!formData.email && localStorage.getItem('token')}
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
							disabled={!!formData.phone && localStorage.getItem('token')}
							sx={{
								'& .MuiInputBase-input.Mui-disabled': {
									bgcolor: 'rgba(0, 0, 0, 0.05)',
									WebkitTextFillColor: 'rgba(0, 0, 0, 0.6)',
								},
							}}
						/>
						<TextField
							fullWidth
							label="Weight (kg)"
							type="number"
							value={formData.weight}
							onChange={(e) =>
								setFormData({ ...formData, weight: e.target.value })
							}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">kg</InputAdornment>
								),
							}}
							placeholder="Optional"
						/>
						<TextField
							fullWidth
							label="Height (cm)"
							type="number"
							value={formData.height}
							onChange={(e) =>
								setFormData({ ...formData, height: e.target.value })
							}
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">cm</InputAdornment>
								),
							}}
							placeholder="Optional"
						/>
					</Box>
				);
			case 1:
				return (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
						<FormControl fullWidth required>
							<InputLabel>Select Service</InputLabel>
							<Select
								value={formData.treatment}
								onChange={handleTreatmentChange}
								label="Select Service"
							>
								{services.map((service) => (
									<MenuItem key={service._id} value={service.name}>
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
								{getTimeSlots().map((slot) => (
									<Button
										key={slot}
										size="small"
										variant={
											formData.appointmentTime &&
											format(formData.appointmentTime, 'p') === slot
												? 'contained'
												: 'outlined'
										}
										color="primary"
										onClick={() => {
											if (formData.appointmentTime) {
												const [time, period] = slot.split(' ');
												const [hours, minutes] = time.split(':');
												let hour = parseInt(hours);

												// Convert to 24-hour format for setting
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
											(() => {
												if (!formData.appointmentTime) return true;

												const now = new Date();
												const slotTime = new Date(formData.appointmentTime);
												const [time, period] = slot.split(' ');
												const [hours, minutes] = time.split(':');
												let hour = parseInt(hours);

												// Convert to 24-hour format
												if (period === 'PM' && hour !== 12) {
													hour += 12;
												} else if (period === 'AM' && hour === 12) {
													hour = 0;
												}

												slotTime.setHours(hour, parseInt(minutes), 0, 0);

												// If it's a future date, only check business hours
												if (slotTime.toDateString() !== now.toDateString()) {
													return false;
												}

												// If it's today, check if the time has passed
												return isBefore(slotTime, now);
											})()
										}
										sx={{
											minWidth: '90px',
											fontSize: '0.875rem',
										}}
									>
										{slot}
									</Button>
								))}
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

	return (
		<Dialog
			open={open}
			onClose={onClose}
			fullScreen={fullScreen}
			maxWidth="sm"
			fullWidth
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

			<DialogContent sx={{ mt: 2, p: 3 }}>
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

			<DialogActions sx={{ p: 3, gap: 1 }}>
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
