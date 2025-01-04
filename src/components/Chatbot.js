import React, { useState, useEffect, useRef } from 'react';
import {
	Box,
	Button,
	createTheme,
	Modal,
	Typography,
	TextField,
	IconButton,
	ToggleButtonGroup,
	ToggleButton,
	ThemeProvider,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PersonIcon from '@mui/icons-material/Person';
import config from '../config';
import { LocalizationProvider, DatePicker } from '@mui/x-date-pickers';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { format, set, addDays, isBefore } from 'date-fns';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';

const parseTimeSlot = (timeString) => {
	const [time, period] = timeString.split(' ');
	let [hours, minutes] = time.split(':').map(Number);

	// Convert to 24-hour format if PM
	if (period.toLowerCase() === 'pm' && hours !== 12) {
		hours += 12;
	}
	// Convert 12 AM to 00 hours
	if (period.toLowerCase() === 'am' && hours === 12) {
		hours = 0;
	}

	return { hours, minutes };
};

const Chatbot = () => {
	const [open, setOpen] = useState(false);
	const [userInput, setUserInput] = useState('');
	const [responses, setResponses] = useState([]);
	const [welcomeMessageShown, setWelcomeMessageShown] = useState(false);
	const [mode, setMode] = useState('faq');
	const chatHistoryRef = useRef(null);
	const [guidedFlow, setGuidedFlow] = useState(null);
	const [currentStep, setCurrentStep] = useState(0);
	const [flowData, setFlowData] = useState({});
	const nameInputRef = useRef(null);
	const emailInputRef = useRef(null);
	const phoneInputRef = useRef(null);
	const [currentInputType, setCurrentInputType] = useState(null); // 'name', 'email', 'phone', or null

	const theme = createTheme({
		palette: {
			primary: {
				main: '#000000',
				light: '#B3B3B3',
				dark: '#1A1A1A',
				contrastText: '#FFFFFF',
			},
		},
	});

	const handleOpen = () => {
		setOpen(true);
		if (!welcomeMessageShown) {
			setResponses([
				{
					text: 'Welcome to our AI virtual assistant chatbot! We are here to help you. How may I assist you today?',
					sender: 'ai',
				},
			]);
			setWelcomeMessageShown(true);
		}
	};

	const handleClose = () => setOpen(false);

	const handleCategoryClick = async (category) => {
		if (category === 'BookAppointment') {
			setGuidedFlow('BookAppointment');
			setCurrentStep(0);
			setFlowData({});

			try {
				// Fetch categories from the API
				const response = await fetch(`${config.apiUrl}/api/categories`);
				const categoriesData = await response.json();

				setResponses((prev) => [
					...prev,
					{ text: 'Book Appointment', sender: 'user' },
					{
						text: "Let's help you book an appointment. First, please select a service category:",
						sender: 'ai',
					},
					{
						text: 'Categories',
						sender: 'ai',
						type: 'categorySelection',
						data: categoriesData, // Now using actual categories from API
					},
				]);
			} catch (error) {
				console.error('Error fetching categories:', error);
				setResponses((prev) => [
					...prev,
					{
						text: 'Sorry, I could not fetch the categories at this time.',
						sender: 'ai',
					},
				]);
			}
		} else if (category === 'ManageAppointment') {
			setResponses((prev) => [
				...prev,
				{ text: 'Manage Appointment', sender: 'user' },
				{
					text: 'Would you like to reschedule or cancel an appointment?',
					sender: 'ai',
					type: 'appointmentAction',
					actions: ['Reschedule', 'Cancel'],
				},
			]);
		} else {
			// existing category handling
		}
	};

	const categories = [
		{ label: 'Book Appointment', value: 'BookAppointment' },
		{ label: 'Manage Appointments', value: 'ManageAppointment' },
		{ label: 'Location', value: 'Location' },
		{ label: 'Contact', value: 'Contact' },
	];

	useEffect(() => {
		// Add a small delay to ensure the content is rendered before scrolling
		const scrollTimeout = setTimeout(() => {
			if (chatHistoryRef.current) {
				chatHistoryRef.current.scrollTop = chatHistoryRef.current.scrollHeight;
			}
		}, 100);

		return () => clearTimeout(scrollTimeout);
	}, [responses, open]);

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

		if (selectedDateTime.toDateString() !== now.toDateString()) {
			return isWeekday(date) && isWithinBusinessHours(date);
		}

		if (isBefore(selectedDateTime, now)) {
			return false;
		}

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
				slots.push(format(slotDate, 'p'));
			}
		}
		return slots;
	};

	const getAvailableDates = () => {
		const dates = [];
		let currentDate = new Date();
		let daysAdded = 0;

		// Add up to 7 days initially
		while (dates.length < 7 && daysAdded < 30) {
			const date = addDays(currentDate, daysAdded);
			if (isWeekday(date)) {
				dates.push(date);
			}
			daysAdded++;
		}

		return dates;
	};

	const getPaginatedDates = (page = 0, datesPerPage = 6) => {
		const dates = [];
		let currentDate = addDays(new Date(), page * datesPerPage);
		let daysAdded = 0;
		let validDatesCount = 0;

		while (validDatesCount < datesPerPage && daysAdded < 30) {
			const date = addDays(currentDate, daysAdded);
			if (isWeekday(date)) {
				dates.push(date);
				validDatesCount++;
			}
			daysAdded++;
		}

		return dates;
	};

	const fetchBookedSlots = async (date) => {
		try {
			const formattedDate = format(date, 'yyyy-MM-dd');
			const response = await fetch(
				`${config.apiUrl}/api/appointments/booked-slots?date=${formattedDate}`
			);
			const data = await response.json();
			return data.bookedSlots;
		} catch (error) {
			console.error('Error fetching booked slots:', error);
			return [];
		}
	};

	const GuidedResponse = ({ response, onAction }) => {
		switch (response.type) {
			case 'categorySelection':
				return (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
						{response.data.map((category) => (
							<Button
								key={category._id}
								variant="outlined"
								onClick={() => onAction('selectCategory', category)}
								sx={{
									justifyContent: 'flex-start',
									textAlign: 'left',
								}}
							>
								<Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
									<img
										src={category.image?.data || '/placeholder-image.jpg'}
										alt={category.name}
										style={{ width: 30, height: 30, borderRadius: 4 }}
									/>
									{category.name}
								</Box>
							</Button>
						))}
					</Box>
				);
			case 'serviceSelection':
				return (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
						{response.data.map((service) => (
							<Button
								key={service._id}
								variant="outlined"
								onClick={() => onAction('selectService', service)}
							>
								{service.name} - RM {service.price}
							</Button>
						))}
					</Box>
				);
			case 'confirmation':
				return (
					<Box sx={{ display: 'flex', gap: 1 }}>
						{response.data.actions.map((action) => (
							<Button
								key={action.value}
								variant={action.value === 'confirm' ? 'contained' : 'outlined'}
								onClick={() => onAction('confirmation', action.value)}
								color={action.value === 'confirm' ? 'primary' : 'inherit'}
							>
								{action.label}
							</Button>
						))}
					</Box>
				);
			case 'userConfirmation':
				return (
					<Box sx={{ display: 'flex', gap: 1 }}>
						<Button
							variant="contained"
							onClick={() => onAction('userDetailsConfirm', true)}
							color="primary"
						>
							Yes, details are correct
						</Button>
						<Button
							variant="outlined"
							onClick={() => onAction('userDetailsConfirm', false)}
						>
							No, update details
						</Button>
					</Box>
				);
			case 'dateTimeSelection':
				return (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						{!response.data?.appointmentTime && (
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								<Typography variant="subtitle1" sx={{ mb: 1 }}>
									Select a preferred date:
								</Typography>
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
									{getPaginatedDates(response.data?.currentPage || 0).map(
										(date) => (
											<Button
												key={date.toISOString()}
												variant="outlined"
												onClick={() => onAction('updateDateTime', { date })}
												sx={{
													flex: '1 1 calc(33.33% - 8px)',
													minWidth: '150px',
													p: 2,
													display: 'flex',
													flexDirection: 'column',
													alignItems: 'center',
													gap: 0.5,
													borderColor: 'primary.main',
													'&:hover': {
														borderColor: 'primary.dark',
														backgroundColor: 'primary.light',
													},
												}}
											>
												<Typography variant="subtitle2">
													{format(date, 'EEEE')}
												</Typography>
												<Typography variant="body2">
													{format(date, 'MMM d, yyyy')}
												</Typography>
											</Button>
										)
									)}
								</Box>

								{/* Pagination Controls */}
								<Box
									sx={{
										display: 'flex',
										justifyContent: 'space-between',
										mt: 2,
										px: 1,
									}}
								>
									<Button
										onClick={() =>
											onAction('changeDatePage', { direction: 'prev' })
										}
										disabled={!response.data?.currentPage}
										startIcon={<ArrowBackIcon />}
										sx={{ minWidth: '100px' }}
									>
										Previous
									</Button>
									<Typography variant="body2" sx={{ alignSelf: 'center' }}>
										Page {(response.data?.currentPage || 0) + 1}
									</Typography>
									<Button
										onClick={() =>
											onAction('changeDatePage', { direction: 'next' })
										}
										disabled={(response.data?.currentPage || 0) >= 4} // Limit to 30 days (5 pages of 6 dates)
										endIcon={<ArrowForwardIcon />}
										sx={{ minWidth: '100px' }}
									>
										Next
									</Button>
								</Box>
							</Box>
						)}

						{/* Time Slot Selection */}
						{response.data?.appointmentTime && (
							<Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
								<Typography variant="subtitle1" sx={{ mb: 1 }}>
									Available time slots for{' '}
									{format(
										new Date(response.data.appointmentTime),
										'EEEE, MMMM d'
									)}
								</Typography>
								<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
									{getTimeSlots().map((slot) => {
										const bookedSlots = Array.isArray(
											response.data?.bookedSlots
										)
											? response.data.bookedSlots
											: [];
										const isBooked = bookedSlots.includes(slot);

										// Create a new date object from the ISO string
										const appointmentDate = new Date(
											response.data.appointmentTime
										);
										const { hours, minutes } = parseTimeSlot(slot);

										const slotDateTime = set(appointmentDate, {
											hours,
											minutes,
											seconds: 0,
											milliseconds: 0,
										});

										const isValid = isValidAppointmentTime(slotDateTime);
										const isSelected = response.data?.selectedTime === slot;

										return (
											<Button
												key={slot}
												variant={isSelected ? 'contained' : 'outlined'}
												onClick={() => onAction('selectTimeSlot', slot)}
												disabled={isBooked || !isValid}
												sx={{
													flex: '1 1 calc(25% - 8px)',
													minWidth: '100px',
													width: '90px',
													height: '60px',
													p: 1,
													...(isSelected && {
														bgcolor: 'primary.main',
														color: 'primary.contrastText',
														'&:hover': {
															bgcolor: 'primary.dark',
														},
													}),
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
								<Button
									variant="outlined"
									onClick={() => onAction('updateDateTime', { date: null })}
									sx={{ alignSelf: 'flex-start', mt: 1 }}
								>
									← Choose Different Date
								</Button>
							</Box>
						)}
					</Box>
				);
			case 'doctorPreferenceSelection':
				return (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						{response.data.map((option) => (
							<Button
								key={option.value}
								variant="outlined"
								onClick={() => onAction('doctorPreference', option)}
								sx={{
									justifyContent: 'flex-start',
									textAlign: 'left',
									p: 2,
								}}
							>
								{option.label}
							</Button>
						))}
						<Typography
							variant="caption"
							color="text.secondary"
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 0.5,
							}}
						>
							<InfoIcon sx={{ fontSize: 16 }} />
							This preference will be considered but cannot be guaranteed based
							on doctor availability
						</Typography>
					</Box>
				);
		}
	};

	const handleGuidedAction = async (action, data) => {
		switch (action) {
			case 'selectCategory':
				setResponses((prev) => [
					...prev,
					{
						text: data.name,
						sender: 'user',
					},
				]);

				setFlowData((prev) => ({ ...prev, category: data }));
				// Fetch services for the selected category
				try {
					const response = await fetch(
						`${config.apiUrl}/api/services?category=${data._id}`
					);
					const services = await response.json();
					setResponses((prev) => [
						...prev,
						{
							text: `Great! Here are the services available in ${data.name}:`,
							sender: 'ai',
							type: 'serviceSelection',
							data: services,
						},
					]);
				} catch (error) {
					console.error('Error fetching services:', error);
					setResponses((prev) => [
						...prev,
						{
							text: 'Sorry, I could not fetch the services at this time.',
							sender: 'ai',
						},
					]);
				}
				break;

			case 'selectService':
				setFlowData((prev) => ({
					...prev,
					selectedService: data._id,
					selectedServiceName: data.name,
				}));

				setResponses((prev) => [
					...prev,
					{ text: data.name, sender: 'user' },
					{
						text: 'Please select your preferred appointment date:',
						sender: 'ai',
						type: 'dateTimeSelection',
						data: {
							currentPage: 0,
							appointmentTime: null,
							selectedTime: null,
							bookedSlots: [],
						},
					},
				]);
				break;

			case 'updateDateTime':
				if (data.date) {
					try {
						// Ensure we have a valid Date object
						const selectedDate = new Date(data.date);
						if (isNaN(selectedDate.getTime())) {
							throw new Error('Invalid date selected');
						}

						const bookedSlots = await fetchBookedSlots(selectedDate);

						// Update flowData with the selected date
						setFlowData((prev) => ({
							...prev,
							appointmentTime: selectedDate.toISOString(),
						}));

						setResponses((prev) =>
							prev.map((response) =>
								response.type === 'dateTimeSelection'
									? {
											...response,
											data: {
												...response.data,
												appointmentTime: selectedDate.toISOString(),
												bookedSlots: Array.isArray(bookedSlots)
													? bookedSlots
													: [],
												selectedTime: null,
												currentPage: 0,
											},
									  }
									: response
							)
						);
					} catch (error) {
						console.error('Error handling date selection:', error);
						setResponses((prev) => [
							...prev,
							{
								text: 'Sorry, there was an error selecting that date. Please try again.',
								sender: 'ai',
							},
						]);
					}
				}
				break;

			case 'selectTimeSlot':
				const selectedTime = data;
				setFlowData((prev) => ({
					...prev,
					selectedTime,
				}));

				try {
					const token = localStorage.getItem('token');
					if (!token) {
						setResponses((prev) => [
							...prev,
							{ text: selectedTime, sender: 'user' },
							{ text: 'Please tell me your full name:', sender: 'ai' },
						]);
						setCurrentInputType('name');
					} else {
						const response = await fetch(
							`${config.apiUrl}/api/auth/user-details`,
							{
								method: 'GET',
								headers: {
									'Content-Type': 'application/json',
									Authorization: `Bearer ${token}`,
								},
							}
						);

						if (response.ok) {
							const userData = await response.json();
							// Store user data in flowData
							setFlowData((prev) => ({
								...prev,
								userData: {
									name: userData.name,
									email: userData.email,
									phone: userData.phone,
									weight: userData.weight,
									height: userData.height,
								},
								selectedTime: selectedTime,
							}));

							setResponses((prev) => [
								...prev,
								{
									text: selectedTime,
									sender: 'user',
								},
								{
									text: [
										'Please confirm if these details are correct:',
										'',
										`Name:  ${userData.name}`,
										`Email:  ${userData.email}`,
										`Phone:  ${userData.phone}`,
									].join('\n'),
									sender: 'ai',
									type: 'userConfirmation',
									data: userData,
								},
							]);
						} else {
							throw new Error('Authentication failed');
						}
					}
				} catch (error) {
					console.error('Error:', error);
					setResponses((prev) => [
						...prev,
						{ text: selectedTime, sender: 'user' },
						{ text: 'Please tell me your full name:', sender: 'ai' },
					]);
					setCurrentInputType('name');
				}
				break;

			case 'textInput':
				const { field, value } = data;
				// Set the current input type to match the field we're collecting
				setCurrentInputType(field);

				// Update flowData with the new value
				setFlowData((prev) => ({
					...prev,
					userData: {
						...prev.userData,
						[field]: value,
					},
				}));

				// Show user's input in chat
				setResponses((prev) => [
					...prev,
					{
						text: value,
						sender: 'user',
					},
				]);

				// Handle the sequential flow
				switch (field) {
					case 'name':
						setResponses((prev) => [
							...prev,
							{
								text: 'Please enter your email address:',
								sender: 'ai',
								type: 'textInput',
								field: 'email',
							},
						]);
						break;
					case 'email':
						if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
							setResponses((prev) => [
								...prev,
								{
									text: value,
									sender: 'user',
								},
								{
									text: "That doesn't look like a valid email address. Please try again:",
									sender: 'ai',
									type: 'textInput',
									field: 'email',
								},
							]);
							return;
						}
						setResponses((prev) => [
							...prev,
							{
								text: value,
								sender: 'user',
							},
							{
								text: 'Please enter your phone number (+601X-XXXXXXX):',
								sender: 'ai',
								type: 'textInput',
								field: 'phone',
							},
						]);
						break;
					case 'phone':
						if (!/^\+?[0-9]{8,}$/.test(value)) {
							setResponses((prev) => [
								...prev,
								{
									text: value,
									sender: 'user',
								},
								{
									text: "That doesn't look like a valid phone number. Please try again (+601X-XXXXXXX):",
									sender: 'ai',
									type: 'textInput',
									field: 'phone',
								},
							]);
							return;
						}
						// All details collected, proceed with booking
						handleFinalBooking(flowData.userData);
						break;
				}
				break;

			case 'appointmentAction':
				if (data === 'Reschedule') {
					setGuidedFlow('RescheduleAppointment');
					// Fetch user's appointments
					try {
						const response = await fetch(
							`${config.apiUrl}/api/appointments/user`
						);
						const appointments = await response.json();
						setResponses((prev) => [
							...prev,
							{
								text: 'Which appointment would you like to reschedule?',
								sender: 'ai',
								type: 'appointmentSelection',
								data: appointments,
							},
						]);
					} catch (error) {
						console.error('Error fetching appointments:', error);
						setResponses((prev) => [
							...prev,
							{
								text: 'Sorry, I could not fetch your appointments at this time.',
								sender: 'ai',
							},
						]);
					}
				} else if (data === 'Cancel') {
					setGuidedFlow('CancelAppointment');
					// Similar to reschedule, but for cancellation
					// ... implementation similar to reschedule
				}
				break;

			case 'confirmation':
				if (data === 'confirm') {
					// Check if user is logged in
					try {
						const response = await fetch(`${config.apiUrl}/api/users/me`, {
							credentials: 'include',
						});

						if (response.ok) {
							const userData = await response.json();
							setFlowData((prev) => ({ ...prev, userData }));
							setResponses((prev) => [
								...prev,
								{
									text: `Please confirm your details:\nName: ${userData.name}\nEmail: ${userData.email}\nPhone: ${userData.phone}`,
									sender: 'ai',
									type: 'userConfirmation',
									data: userData,
								},
							]);
						} else {
							// User not logged in or session expired
							setResponses((prev) => [
								...prev,
								{
									text: 'Please provide your details to proceed with the booking:',
									sender: 'ai',
									type: 'userDetailsForm',
									data: { name: '', email: '', phone: '' },
								},
							]);
						}
					} catch (error) {
						console.error('Error fetching user details:', error);
					}
				} else {
					setResponses((prev) => [
						...prev,
						{
							text: 'No problem! Is there anything else I can help you with?',
							sender: 'ai',
						},
					]);
					setGuidedFlow(null);
					setFlowData({});
				}
				break;

			case 'userDetailsConfirm':
				if (data) {
					// Details confirmed, proceed to doctor preference
					setResponses((prev) => [
						...prev,
						{
							text: 'Please select your preferred doctor gender:',
							sender: 'ai',
							type: 'doctorPreferenceSelection',
							data: [
								{ value: 'any', label: 'No Preference' },
								{ value: 'male', label: 'Male Doctor' },
								{ value: 'female', label: 'Female Doctor' },
							],
						},
					]);
				} else {
					// Start over with user details
					setCurrentInputType('name');
					setResponses((prev) => [
						...prev,
						{ text: 'Please enter your full name:', sender: 'ai' },
					]);
				}
				break;

			case 'updateUserField':
				const updatedUserData = {
					...flowData.userData,
					[data.name]: data.value,
				};

				// Update flowData
				setFlowData((prev) => ({
					...prev,
					userData: updatedUserData,
				}));

				// Find and update the userDetailsForm response
				setResponses((prev) =>
					prev.map((response) =>
						response.type === 'userDetailsForm'
							? {
									...response,
									data: updatedUserData,
							  }
							: response
					)
				);

				// Restore focus after state updates using setTimeout
				if (['name', 'email', 'phone'].includes(data.name)) {
					setTimeout(() => {
						switch (data.name) {
							case 'name':
								nameInputRef.current?.focus();
								const nameCursor = nameInputRef.current?.selectionStart;
								nameInputRef.current?.setSelectionRange(nameCursor, nameCursor);
								break;
							case 'email':
								emailInputRef.current?.focus();
								break;
							case 'phone':
								phoneInputRef.current?.focus();
								const phoneCursor = phoneInputRef.current?.selectionStart;
								phoneInputRef.current?.setSelectionRange(
									phoneCursor,
									phoneCursor
								);
								break;
						}
					}, 0);
				}
				break;

			case 'submitUserDetails':
				// Validate the user details
				const userData = flowData.userData;
				const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
				const phoneRegex = /^\+?[0-9]{8,}$/;

				if (!userData?.name || !userData?.email || !userData?.phone) {
					setResponses((prev) => [
						...prev,
						{
							text: 'Please fill in all required fields.',
							sender: 'ai',
						},
					]);
					return;
				}

				if (!emailRegex.test(userData.email)) {
					setResponses((prev) => [
						...prev,
						{
							text: 'Please enter a valid email address.',
							sender: 'ai',
						},
					]);
					return;
				}

				if (!phoneRegex.test(userData.phone)) {
					setResponses((prev) => [
						...prev,
						{
							text: 'Please enter a valid phone number (+601X-XXXXXXX).',
							sender: 'ai',
						},
					]);
					return;
				}

				handleFinalBooking(userData);
				break;

			case 'changeDatePage':
				const currentPage =
					responses.find((r) => r.type === 'dateTimeSelection')?.data
						?.currentPage || 0;
				const newPage =
					data.direction === 'next' ? currentPage + 1 : currentPage - 1;

				setResponses((prev) =>
					prev.map((response) =>
						response.type === 'dateTimeSelection'
							? {
									...response,
									data: {
										...response.data,
										currentPage: newPage,
									},
							  }
							: response
					)
				);
				break;

			case 'doctorPreference':
				// Update flowData with doctor preference
				setFlowData((prev) => ({
					...prev,
					userData: {
						...prev.userData,
						doctorPreference: data.value,
					},
				}));

				// Show selected preference and ask for notes (making it clear it's optional)
				setResponses((prev) => [
					...prev,
					{ text: data.label, sender: 'user' },
					{
						text: 'Would you like to provide any additional information or specific concerns? (Optional)\nType your message or click Send to skip.',
						sender: 'ai',
					},
				]);
				setCurrentInputType('notes');
				break;

			case 'submitNotes':
				// Handle the notes submission (allow empty notes)
				setFlowData((prev) => ({
					...prev,
					userData: {
						...prev.userData,
						notes: data || '', // data contains the notes text
					},
				}));

				// Show the notes in chat and proceed with booking
				setResponses((prev) => [
					...prev,
					{
						text: data || 'No additional notes provided',
						sender: 'user',
					},
				]);

				// Proceed with final booking
				handleFinalBooking({
					...flowData.userData,
					notes: data || '',
				});
				break;

			case 'notes':
				// Handle notes submission
				const notesText = data?.trim() || ''; // Use data parameter instead of userInputText

				// Update flowData with notes
				setFlowData((prev) => ({
					...prev,
					userData: {
						...prev.userData,
						notes: notesText,
					},
				}));

				// Show the notes or skipped message in chat
				setResponses((prev) => [
					...prev,
					{
						text: notesText || 'Skipped additional information',
						sender: 'user',
					},
				]);

				// Proceed with booking
				handleFinalBooking({
					...flowData.userData,
					notes: notesText,
				});
				setCurrentInputType(null);
				break;

			default:
				console.warn('Unhandled guided action:', action);
		}
	};

	const handleFinalBooking = async (userData) => {
		try {
			// Validate that we have a selected service
			if (!flowData.selectedService) {
				throw new Error('No treatment service selected');
			}

			// Get the selected date from ISO string
			const selectedDate = flowData.appointmentTime
				? new Date(flowData.appointmentTime)
				: null;
			console.log('Initial selectedDate:', selectedDate);
			console.log('Selected service:', flowData.selectedService); // Add this debug log

			if (!selectedDate) {
				throw new Error('No appointment date selected');
			}

			let appointmentDateTime = new Date(selectedDate); // Define this variable first

			// Parse the time from selectedTime
			if (flowData.selectedTime) {
				const timeMatch = flowData.selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);
				console.log('Time match results:', timeMatch);

				if (timeMatch) {
					let hours = parseInt(timeMatch[1]);
					const minutes = parseInt(timeMatch[2]);
					const period = timeMatch[3].toUpperCase();

					// Convert to 24-hour format
					if (period === 'PM' && hours !== 12) {
						hours += 12;
					} else if (period === 'AM' && hours === 12) {
						hours = 0;
					}

					// Set the time on appointmentDateTime
					appointmentDateTime.setHours(hours, minutes, 0, 0);
					console.log(
						'Final appointmentDateTime after setting time:',
						appointmentDateTime
					);
				}
			}

			// Validate appointment time
			const isValidTime = (date) => {
				if (!date) return false;
				const hours = date.getHours();
				const minutes = date.getMinutes();
				const isValid =
					hours >= 9 && (hours < 17 || (hours === 17 && minutes === 0));
				console.log('Time validation:', { hours, minutes, isValid });
				return isValid;
			};

			if (!isValidTime(appointmentDateTime)) {
				throw new Error(
					'Please select a valid appointment time between 9 AM and 5 PM.'
				);
			}

			// Create the appointment data object with validated service
			const appointmentData = {
				name: userData.name,
				email: userData.email,
				phone: userData.phone,
				treatment: flowData.selectedService,
				appointmentTime: appointmentDateTime.toISOString(),
				notes: [],
			};

			// Add notes to noteHistory if they exist
			if (userData.notes || userData.doctorPreference) {
				const notes = [];
				if (userData.doctorPreference) {
					switch (userData.doctorPreference) {
						case 'male':
							notes.push('Male doctor preferred');
							break;
						case 'female':
							notes.push('Female doctor preferred');
							break;
					}
				}
				if (userData.notes) {
					notes.push(userData.notes);
				}
				appointmentData.notes = notes.join('\n\n');
			}

			console.log('Appointment data:', appointmentData);

			// Make the API call
			const response = await fetch(`${config.apiUrl}/api/appointments/create`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
				},
				body: JSON.stringify(appointmentData),
			});

			if (!response.ok) {
				const errorData = await response.json();
				throw new Error(errorData.message || 'Booking failed');
			}

			const result = await response.json();

			// Show success message
			setResponses((prev) => [
				...prev,
				{
					text:
						`Great! Your appointment has been booked successfully.\n\n` +
						`Treatment: ${flowData.selectedServiceName}\n` +
						`Date: ${format(appointmentDateTime, 'MMMM d, yyyy')}\n` +
						`Time: ${format(appointmentDateTime, 'h:mm a')}\n` +
						`Name: ${appointmentData.name}\n` +
						`Email: ${appointmentData.email}\n` +
						`Phone: ${appointmentData.phone}\n\n` +
						`You will receive a confirmation email shortly.`,
					sender: 'ai',
				},
			]);

			// Reset flow
			setGuidedFlow(null);
			setFlowData({});
			setCurrentInputType(null);
		} catch (error) {
			console.error('Booking error:', error);
			setResponses((prev) => [
				...prev,
				{
					text:
						error.message ||
						'Sorry, there was an error processing your booking. Please try again later.',
					sender: 'ai',
				},
			]);
		}
	};

	const clearChatHistory = () => {
		setResponses([
			{
				text: 'Welcome to our AI virtual assistant chatbot! We are here to help you. How may I assist you today?',
				sender: 'ai',
			},
		]);
		setGuidedFlow(null);
		setFlowData({});
		setCurrentStep(0);
		setUserInput('');
	};

	const handleUserInput = (userInputText) => {
		// For notes, we want to allow empty input
		if (currentInputType !== 'notes' && !userInputText?.trim()) return;

		if (currentInputType) {
			switch (currentInputType) {
				case 'notes':
					// Handle notes (can be empty)
					const notesText = userInputText ? userInputText.trim() : '';

					setFlowData((prev) => ({
						...prev,
						userData: {
							...prev.userData,
							notes: notesText,
						},
					}));

					// Show the notes or skipped message in chat
					setResponses((prev) => [
						...prev,
						{
							text: notesText || 'Skipped additional information',
							sender: 'user',
						},
					]);

					// Proceed with booking
					handleFinalBooking({
						...flowData.userData,
						notes: notesText,
					});
					setCurrentInputType(null);
					break;

				case 'name':
					if (!userInputText || userInputText.length < 2) {
						setResponses((prev) => [
							...prev,
							{ text: userInputText || '', sender: 'user' },
							{
								text: 'Please enter a valid name (at least 2 characters):',
								sender: 'ai',
							},
						]);
						return;
					}
					// Rest of name case...
					break;

				case 'email':
					if (
						!userInputText ||
						!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(userInputText)
					) {
						setResponses((prev) => [
							...prev,
							{ text: userInputText || '', sender: 'user' },
							{
								text: "That doesn't look like a valid email address. Please try again:",
								sender: 'ai',
							},
						]);
						return;
					}
					// Rest of email case...
					break;

				case 'phone':
					if (!userInputText || !/^\+?[0-9]{8,}$/.test(userInputText)) {
						setResponses((prev) => [
							...prev,
							{ text: userInputText || '', sender: 'user' },
							{
								text: "That doesn't look like a valid phone number. Please try again (+601X-XXXXXXX):",
								sender: 'ai',
							},
						]);
						return;
					}
					// Rest of phone case...
					break;

				default:
					console.warn('Unhandled input type:', currentInputType);
					break;
			}
		} else {
			// Handle regular chat input
			setResponses((prev) => [
				...prev,
				{ text: userInputText || '', sender: 'user' },
			]);
		}
	};

	return (
		<ThemeProvider theme={theme}>
			<Button
				variant="contained"
				color="primary"
				sx={{
					position: 'fixed',
					bottom: 20,
					right: 20,
					borderRadius: '50%',
					width: '60px',
					height: '60px',
					boxShadow: 3,
					display: 'flex',
					justifyContent: 'center',
					alignItems: 'center',
					transition: 'background-color 0.3s, transform 0.3s',
					zIndex: 1000,
					'&:hover': {
						backgroundColor: 'secondary.main',
						transform: 'scale(1.1)',
					},
				}}
				onClick={handleOpen}
			>
				<ChatIcon sx={{ fontSize: 30, color: 'white' }} />
			</Button>
			<Modal open={open} onClose={handleClose}>
				<Box
					sx={{
						position: 'fixed',
						bottom: 100,
						right: 20,
						bgcolor: 'background.paper',
						boxShadow: 3,
						borderRadius: 2,
						width: '400px',
						maxHeight: '80vh',
						display: 'flex',
						flexDirection: 'column',
					}}
				>
					{/* Sticky Header */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
							position: 'sticky',
							top: 0,
							backgroundColor: 'background.paper',
							zIndex: 1,
							borderBottom: '1px solid black',
							p: 1,
						}}
					>
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<SupportAgentIcon sx={{ mr: 1 }} />
							<Typography variant="subtitle1" component="h2">
								Chat with Our Virtual Assistant
							</Typography>
						</Box>
						<Box sx={{ display: 'flex', alignItems: 'center' }}>
							<IconButton
								onClick={clearChatHistory}
								title="Clear chat history"
								sx={{ mr: 1 }}
							>
								<DeleteSweepIcon />
							</IconButton>
							<IconButton onClick={handleClose}>
								<CloseIcon />
							</IconButton>
						</Box>
					</Box>

					{/* Scrollable Chat History Area */}
					<Box
						ref={chatHistoryRef}
						sx={{
							flex: 1,
							overflowY: 'auto',
							p: 2,
							scrollBehavior: 'smooth',
							display: 'flex',
							flexDirection: 'column',
							'&::-webkit-scrollbar': {
								width: '8px',
							},
							'&::-webkit-scrollbar-track': {
								background: '#f1f1f1',
							},
							'&::-webkit-scrollbar-thumb': {
								background: '#888',
								borderRadius: '4px',
							},
						}}
					>
						<Box sx={{ marginTop: 'auto' }}>
							{responses.map((response, index) => (
								<Box
									key={index}
									sx={{
										display: 'flex',
										flexDirection: 'column',
										alignItems:
											response.sender === 'user' ? 'flex-end' : 'flex-start',
										mb: 2,
									}}
								>
									<Box sx={{ display: 'flex', alignItems: 'center' }}>
										{response.sender === 'ai' && (
											<SupportAgentIcon sx={{ mr: 1 }} />
										)}
										<Typography
											sx={{
												bgcolor:
													response.sender === 'user' ? 'grey.900' : 'grey.200',
												color: response.sender === 'user' ? 'white' : 'black',
												borderRadius: '8px',
												padding: '8px',
												maxWidth: '80%',
												whiteSpace: 'pre-line',
											}}
										>
											{response.text}
										</Typography>
										{response.sender === 'user' && (
											<PersonIcon sx={{ ml: 1 }} />
										)}
									</Box>
									{response.type && (
										<Box sx={{ mt: 1, ml: response.sender === 'user' ? 0 : 4 }}>
											<GuidedResponse
												response={response}
												onAction={handleGuidedAction}
											/>
										</Box>
									)}
								</Box>
							))}
						</Box>
					</Box>

					{/* Sticky Footer for Category Buttons */}
					<Box
						sx={{
							display: 'flex',
							justifyContent: 'space-between',
							flexWrap: 'wrap',
							backgroundColor: 'background.paper',
							p: 1,
							borderTop: '1px solid black',
						}}
					>
						{mode === 'faq' && (
							<>
								{categories.map((category, index) => (
									<Button
										key={index}
										variant="outlined"
										onClick={() => handleCategoryClick(category.value)}
										sx={{
											flex: '1 1 45%',
											mr: index % 2 === 0 ? 1 : 0,
											ml: index % 2 === 1 ? 1 : 0,
											mb: 1,
											bgcolor: 'primary.main',
											color: 'primary.contrastText',
											'&:hover': { bgcolor: 'primary.light' },
										}}
									>
										{category.label}
									</Button>
								))}
							</>
						)}
					</Box>

					<Box
						sx={{
							borderTop: '1px solid black',
							p: 2,
							backgroundColor: 'background.paper',
							display: 'flex',
							gap: 1,
						}}
					>
						<TextField
							fullWidth
							placeholder={
								currentInputType === 'name'
									? 'Enter your full name...'
									: currentInputType === 'email'
									? 'Enter your email address...'
									: currentInputType === 'phone'
									? 'Enter your phone number (+601X-XXXXXXX)...'
									: currentInputType === 'notes'
									? 'Type your message or click Send to skip (Optional)...'
									: 'Type a message...'
							}
							value={userInput}
							onChange={(e) => setUserInput(e.target.value)}
							onKeyPress={(e) => {
								if (e.key === 'Enter') {
									if (currentInputType === 'notes' || userInput.trim()) {
										handleUserInput(userInput.trim());
										setUserInput('');
									}
								}
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '20px',
								},
							}}
						/>
						<Button
							variant="contained"
							onClick={() => {
								handleUserInput(userInput); // Pass userInput directly
								setUserInput('');
							}}
							disabled={
								currentInputType !== 'notes' &&
								!userInput.trim() &&
								!currentInputType &&
								mode !== 'faq'
							}
							sx={{
								borderRadius: '20px',
								minWidth: '100px',
							}}
						>
							{currentInputType === 'notes'
								? userInput.trim()
									? 'Submit'
									: 'Skip'
								: 'Send'}
						</Button>
					</Box>
				</Box>
			</Modal>
		</ThemeProvider>
	);
};

export default Chatbot;
