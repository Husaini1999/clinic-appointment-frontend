import React, { useState, useEffect, useRef } from 'react';
import {
	Box,
	Button,
	createTheme,
	Modal,
	Typography,
	TextField,
	IconButton,
	ThemeProvider,
	CircularProgress,
} from '@mui/material';
import ChatIcon from '@mui/icons-material/Chat';
import CloseIcon from '@mui/icons-material/Close';
import SupportAgentIcon from '@mui/icons-material/SupportAgent';
import PersonIcon from '@mui/icons-material/Person';
import config from '../config';
import { format, set, addDays, isBefore } from 'date-fns';
import InfoIcon from '@mui/icons-material/Info';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import ArrowForwardIcon from '@mui/icons-material/ArrowForward';
import DeleteSweepIcon from '@mui/icons-material/DeleteSweep';
import Fuse from 'fuse.js';
import axios from 'axios';

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

const validateAndFormatPhone = (phone) => {
	// Remove all non-digit characters except leading +
	const cleaned = phone.replace(/[^\d+]/g, '');

	// Check if it's a valid Malaysian phone number
	// Matches:
	// +60123456789, +6012-345-6789
	// 0123456789, 012-345-6789
	const mobileRegex = /^(?:\+?60|0)?1[0-46-9][0-9]{7,8}$/;

	if (!mobileRegex.test(cleaned)) {
		return { isValid: false, formatted: null };
	}

	// Standardize to +60 format
	let formatted = cleaned;
	if (formatted.startsWith('0')) {
		formatted = '+60' + formatted.substring(1);
	} else if (!formatted.startsWith('+')) {
		formatted = '+' + formatted;
	}

	return { isValid: true, formatted };
};

const parseManagementIntent = (text) => {
	const lowercaseText = text.toLowerCase().trim();
	if (
		lowercaseText.includes('reschedule') ||
		lowercaseText.includes('change')
	) {
		return 'Reschedule';
	}
	if (lowercaseText.includes('cancel') || lowercaseText.includes('delete')) {
		return 'Cancel';
	}
	return null;
};

const getAppointmentDescription = (appointment) => {
	const appointmentDate = new Date(appointment.appointmentTime);
	return {
		title: `${appointment?.treatment?.name || 'N/A'}`,
		datetime: `${format(appointmentDate, 'MMMM d, yyyy')} at ${format(
			appointmentDate,
			'h:mm a'
		)}`,
	};
};

// Add more intent patterns at the top of your file
const intentPatterns = {
	greeting: [
		'hi',
		'hello',
		'hey',
		'good morning',
		'good afternoon',
		'good evening',
		'howdy',
		"what's up",
		'hi there',
	],
	help: [
		'help',
		'what can you do',
		'what now',
		'how does this work',
		'guide me',
		'what are my options',
		'what should i do',
		'faq',
		'question',
		'info',
		'information',
		'support',
		'how to',
		'explain',
	],
	booking: [
		'book appointment',
		'make appointment',
		'schedule visit',
		'need to see doctor',
		'want to visit',
		'book a slot',
		'make booking',
		'see a doctor',
	],
	managing: [
		'manage appointment',
		'change appointment',
		'cancel booking',
		'reschedule visit',
		'view my appointment',
		'check my booking',
	],
	location: [
		'where are you',
		'clinic location',
		'address',
		'how to get there',
		'directions',
		'where is the clinic',
		'clinic address',
		'where is sunrise medical',
		'ampang clinic',
	],
	contact: [
		'contact number',
		'phone number',
		'how to contact',
		'call clinic',
		'reach you',
		'contact details',
	],
	services: [
		'what services do you offer',
		'available treatments',
		'list of services',
		'services available',
		'treatments offered',
	],
};

// Add more response variations
const responseVariations = {
	welcome: [
		"Welcome to Sunrise Medical Center's virtual assistant! How can I help you today?",
		"Hi there! I'm here to assist you with your medical needs at Sunrise Medical Center. What can I do for you?",
		"Hello! Welcome to Sunrise Medical Center's virtual assistant. How may I help you?",
		"Welcome! I'm your virtual healthcare assistant at Sunrise Medical Center. What brings you here today?",
	],
	booking: [
		"I'll help you book an appointment. First, please select a service category:",
		"Let's get you scheduled with one of our doctors. Which service are you interested in?",
		'I can help you book a visit. What type of service do you need?',
		"Sure, I'll assist you with booking. Please choose a service category:",
	],
	location: [
		'Our clinic is located at 123 Health Street, Medical District, 50000 Kuala Lumpur, Malaysia. Need directions?',
		"You can find us at 123 Health Street, Medical District, 50000 Kuala Lumpur. We're in the Medical District area.",
		"We're conveniently located at 123 Health Street, Medical District, 50000 Kuala Lumpur, with parking available.",
	],
	managing: [
		'Would you like to reschedule or cancel an appointment?',
		'I can help you manage your booking. Would you like to reschedule or cancel it?',
		'What would you like to do with your appointment - reschedule or cancel?',
		'How can I help with your appointment - reschedule or cancel?',
	],
	greeting: [
		'Hello! How can I assist you with your visit to Sunrise Medical Center today?',
		"Hi there! I'm here to help you with appointments at Sunrise Medical Center.",
		'Welcome to Sunrise Medical Center! Would you like to book an appointment or manage an existing one?',
	],
	help: [
		'I can help you with:\n• Booking appointments at Sunrise Medical Center\n• Managing your existing appointments\n• Finding our clinic location\n• Contacting us\n\nWhat would you like to do?',
		"Here's what I can assist you with:\n1. Schedule appointments with our doctors\n2. Reschedule/cancel existing appointments\n3. Get clinic location and directions\n4. Contact information\n\nHow may I help you?",
	],
	contact: [
		'You can reach us at 012-345 6789 during our operating hours.',
		'Feel free to call us at 012-345 6789 for any immediate inquiries.',
		'Our clinic contact number is 012-345 6789. How can we assist you?',
	],
};

const HUGGING_FACE_API_URL =
	'https://api-inference.huggingface.co/models/facebook/bart-large-mnli';
const HUGGING_FACE_TOKEN = process.env.REACT_APP_HUGGING_FACE_TOKEN; // Add this to your .env file

const Chatbot = () => {
	const [open, setOpen] = useState(false);
	const [userInput, setUserInput] = useState('');
	const [responses, setResponses] = useState([]);
	const [welcomeMessageShown, setWelcomeMessageShown] = useState(false);
	const chatHistoryRef = useRef(null);
	const [guidedFlow, setGuidedFlow] = useState(null);
	const [currentStep, setCurrentStep] = useState(0);
	const [flowData, setFlowData] = useState({});
	const nameInputRef = useRef(null);
	const emailInputRef = useRef(null);
	const phoneInputRef = useRef(null);
	const [currentInputType, setCurrentInputType] = useState(null); // 'name', 'email', 'phone', or null
	const [conversationContext, setConversationContext] = useState({
		lastIntent: null,
		interactionCount: 0,
		timeOfDay: new Date().getHours(),
	});
	const [isProcessing, setIsProcessing] = useState(false);
	const [confidence, setConfidence] = useState(1);
	// Add this state for input validation
	const [isInputValid, setIsInputValid] = useState(true);
	const [inputHelperText, setInputHelperText] = useState('');
	// Add these validation functions at the top level
	const isValidName = (name) => name?.trim().length >= 2;
	const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
	const isValidPhoneInput = (phone) => {
		const { isValid } = validateAndFormatPhone(phone);
		return isValid;
	};

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

	// Modify your handleOpen function to include the test
	const handleOpen = () => {
		setOpen(true);

		if (!welcomeMessageShown) {
			const welcomeIndex = Math.floor(
				Math.random() * responseVariations.welcome.length
			);
			setResponses([
				{
					text: responseVariations.welcome[welcomeIndex],
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
			setFlowData({});
			setCurrentStep(0);
			setCurrentInputType(null);

			try {
				const response = await fetch(`${config.apiUrl}/api/categories`);
				const categoriesData = await response.json();

				setResponses((prev) => [
					...prev,
					{
						text: 'Tip: If you have an account, logging in first will make booking faster as your details will be pre-filled.',
						sender: 'ai',
					},
					{
						text: "Let's help you book an appointment. First, please select a service category:",
						sender: 'ai',
					},
					{
						text: 'Categories',
						sender: 'ai',
						type: 'categorySelection',
						data: categoriesData,
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
			setGuidedFlow('ManageAppointment');
			setFlowData({});
			setCurrentStep(0);
			setCurrentInputType(null);

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
		{ label: 'Help/FAQ', value: 'Help' },
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
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						<Typography
							variant="body2"
							color="text.secondary"
							sx={{
								display: 'flex',
								alignItems: 'center',
								gap: 0.5,
								mb: 1,
							}}
						>
							<InfoIcon sx={{ fontSize: 16 }} />
							To update your personal information, please visit Profile Settings
							in the main menu.
						</Typography>
						<Button
							variant="contained"
							onClick={() => onAction('userDetailsConfirm', true)}
							color="primary"
						>
							Confirm and Continue
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
			case 'managementOptions':
				return (
					<Box>
						<Typography variant="body1" sx={{ mb: 2 }}>
							{response.text}
						</Typography>
						<Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
							{response.data.map((option) => (
								<Button
									key={option.value}
									variant="outlined"
									onClick={() => onAction('appointmentAction', option.value)}
									sx={{
										flex: '1 1 calc(50% - 8px)',
										minWidth: '150px',
									}}
								>
									{option.label}
								</Button>
							))}
						</Box>
					</Box>
				);
			case 'appointmentSelection':
				const appointments = Array.isArray(response.data)
					? response.data
					: response.data?.appointments || [];
				const currentPage = response.data?.currentPage || 0;

				return (
					<Box>
						{/* Appointments List */}
						<Box
							sx={{ display: 'flex', flexDirection: 'column', gap: 1, mb: 2 }}
						>
							{appointments
								.slice(currentPage * 3, (currentPage + 1) * 3)
								.map((appointment) => {
									const { title, datetime } =
										getAppointmentDescription(appointment);
									return (
										<Button
											key={appointment._id}
											variant="outlined"
											onClick={() => onAction('selectAppointment', appointment)}
											sx={{
												p: 2,
												textAlign: 'left',
												display: 'flex',
												flexDirection: 'column',
												alignItems: 'flex-start',
												borderColor: 'primary.main',
												'&:hover': {
													borderColor: 'primary.dark',
													backgroundColor: 'primary.light',
												},
											}}
										>
											<Typography
												variant="subtitle1"
												sx={{ fontWeight: 'bold' }}
											>
												{title}
											</Typography>
											<Typography variant="body2" color="text.secondary">
												{datetime}
											</Typography>
										</Button>
									);
								})}
						</Box>

						{/* Pagination Controls */}
						{appointments.length > 3 && (
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
										onAction('changeAppointmentPage', { direction: 'prev' })
									}
									disabled={!currentPage}
									startIcon={<ArrowBackIcon />}
									sx={{ minWidth: '100px' }}
								>
									Previous
								</Button>
								<Typography variant="body2" sx={{ alignSelf: 'center' }}>
									Page {currentPage + 1} of {Math.ceil(appointments.length / 3)}
								</Typography>
								<Button
									onClick={() =>
										onAction('changeAppointmentPage', { direction: 'next' })
									}
									disabled={
										currentPage >= Math.ceil(appointments.length / 3) - 1
									}
									endIcon={<ArrowForwardIcon />}
									sx={{ minWidth: '100px' }}
								>
									Next
								</Button>
							</Box>
						)}
					</Box>
				);
		}
	};

	const handleGuidedAction = async (action, data, userInputText) => {
		// Add the user's selection to the chat history
		if (
			action === 'help' ||
			action === 'booking' ||
			action === 'managing' ||
			action === 'location' ||
			action === 'contact'
		) {
			setResponses((prev) => [
				...prev,
				{
					text: data?.label || action.charAt(0).toUpperCase() + action.slice(1),
					sender: 'user',
				},
			]);
		}

		switch (action) {
			case 'booking':
				try {
					// Set the guided flow
					setGuidedFlow('BookAppointment');

					// Fetch categories for services
					const response = await fetch(`${config.apiUrl}/api/categories`);
					const categories = await response.json();

					setResponses((prev) => [
						...prev,
						{
							text: "Let's get you scheduled. Please select a service category:",
							sender: 'ai',
							type: 'categorySelection',
							data: categories,
						},
					]);
				} catch (error) {
					console.error('Error fetching categories:', error);
					setResponses((prev) => [
						...prev,
						{
							text: 'Sorry, I could not fetch the service categories at this time.',
							sender: 'ai',
						},
					]);
				}
				break;

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
				// Handle "Choose Different Date" button click
				if (data.date === null) {
					// Remove the previous dateTimeSelection response and add a new one
					setResponses((prev) => [
						// Keep all responses except the last dateTimeSelection
						...prev.filter((response) => response.type !== 'dateTimeSelection'),
						{
							text: 'Please select a new date for your appointment:',
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
					return;
				}

				// For new appointment booking flow
				if (guidedFlow === 'BookAppointment' && data.date) {
					try {
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

						// Update only the most recent dateTimeSelection response
						setResponses((prev) => {
							const withoutLastDateSelection = prev.filter(
								(response) => response.type !== 'dateTimeSelection'
							);
							return [
								...withoutLastDateSelection,
								{
									text: 'Please select a preferred time:',
									sender: 'ai',
									type: 'dateTimeSelection',
									data: {
										appointmentTime: selectedDate.toISOString(),
										bookedSlots: Array.isArray(bookedSlots) ? bookedSlots : [],
										selectedTime: null,
										currentPage: 0,
									},
								},
							];
						});
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
				// For rescheduling flow
				else if (guidedFlow === 'RescheduleAppointment' && data.date) {
					try {
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

						// Update only the most recent dateTimeSelection response
						setResponses((prev) => {
							const withoutLastDateSelection = prev.filter(
								(response) => response.type !== 'dateTimeSelection'
							);
							return [
								...withoutLastDateSelection,
								{
									text: 'Please select a preferred time:',
									sender: 'ai',
									type: 'dateTimeSelection',
									data: {
										appointmentTime: selectedDate.toISOString(),
										bookedSlots: Array.isArray(bookedSlots) ? bookedSlots : [],
										selectedTime: null,
										currentPage: 0,
									},
								},
							];
						});
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

			// BOOKING APPOINTMENT TIME SLOT
			case 'selectTimeSlot':
				const selectedTime = data;
				setFlowData((prev) => ({
					...prev,
					selectedTime,
				}));

				if (guidedFlow === 'BookAppointment') {
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
										address: userData.address,
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
											`Address: ${userData.address}`,
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
				} else if (guidedFlow === 'RescheduleAppointment') {
					// Calculate new date time for the rescheduled appointment
					const selectedDate = new Date(flowData.appointmentTime);
					const { hours, minutes } = parseTimeSlot(selectedTime);
					const newDateTime = set(selectedDate, {
						hours,
						minutes,
						seconds: 0,
						milliseconds: 0,
					});

					// Update flowData with the new date time
					setFlowData((prev) => ({
						...prev,
						selectedTime,
						newDateTime: newDateTime.toISOString(),
					}));

					// Ask for reschedule reason
					setResponses((prev) => [
						...prev,
						{ text: selectedTime, sender: 'user' },
						{
							text: 'Please provide a reason for rescheduling (Required):',
							sender: 'ai',
						},
					]);
					setCurrentInputType('rescheduleNotes');
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
						if (!value || value.length < 2) {
							setResponses((prev) => [
								...prev,
								{ text: value || '', sender: 'user' },
								{
									text: 'Please enter a valid name (at least 2 characters):',
									sender: 'ai',
									type: 'textInput',
									field: 'name',
								},
							]);
							return;
						}

						// Update flowData with the name
						setFlowData((prev) => ({
							...prev,
							userData: {
								...prev.userData,
								name: value,
							},
						}));

						// Show the name in chat and ask for email
						setResponses((prev) => [
							...prev,
							{ text: value, sender: 'user' },
							{
								text: 'Please enter your email address:',
								sender: 'ai',
								type: 'textInput',
								field: 'email',
							},
						]);

						// Change input type to email
						setCurrentInputType('email');
						break;
					case 'email':
						if (!value || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
							setResponses((prev) => [
								...prev,
								{
									text: value || '',
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
						const { isValid, formatted } = validateAndFormatPhone(value);
						if (!isValid) {
							setResponses((prev) => [
								...prev,
								{
									text: value || '',
									sender: 'user',
								},
								{
									text:
										'Please enter a valid Malaysian phone number:\n' +
										'Examples: +60123456789',
									sender: 'ai',
									type: 'textInput',
									field: 'phone',
								},
							]);
							return;
						}

						// Update flowData with formatted phone
						setFlowData((prev) => ({
							...prev,
							userData: {
								...prev.userData,
								phone: formatted,
							},
						}));

						// // Check if user is logged in and has address
						// const token = localStorage.getItem('token');
						// if (token) {
						// 	try {
						// 		const response = await fetch(
						// 			`${config.apiUrl}/api/auth/user-details`,
						// 			{
						// 				headers: {
						// 					Authorization: `Bearer ${token}`,
						// 				},
						// 			}
						// 		);
						// 		const userData = await response.json();

						// 		if (userData.address) {
						// 			// Use existing address and move to doctor preference
						// 			setFlowData((prev) => ({
						// 				...prev,
						// 				userData: {
						// 					...prev.userData,
						// 					address: userData.address,
						// 				},
						// 			}));
						// 			setResponses((prev) => [
						// 				...prev,
						// 				{ text: formatted, sender: 'user' },
						// 				{
						// 					text: `Using your current address: ${userData.address}`,
						// 					sender: 'ai',
						// 				},
						// 				{
						// 					text: 'Please select your preferred doctor gender:',
						// 					sender: 'ai',
						// 					type: 'doctorPreferenceSelection',
						// 					data: [
						// 						{ value: 'any', label: 'No Preference' },
						// 						{ value: 'male', label: 'Male Doctor' },
						// 						{ value: 'female', label: 'Female Doctor' },
						// 					],
						// 				},
						// 			]);
						// 			setCurrentInputType(null);
						// 			setIsProcessing(false);
						// 			break;
						// 		}
						// 	} catch (error) {
						// 		console.error('Error fetching user details:', error);
						// 	}
						// }

						// If not logged in or no address found, ask for address
						setResponses((prev) => [
							...prev,
							{ text: formatted, sender: 'user' },
							{
								text: 'Please enter your complete address:',
								sender: 'ai',
								type: 'textInput',
								field: 'address',
							},
						]);
						setCurrentInputType('address');
						setIsProcessing(false);
						break;
					case 'address':
						if (!value?.trim()) {
							setResponses((prev) => [
								...prev,
								{ text: '', sender: 'user' },
								{
									text: 'Please enter a valid address:',
									sender: 'ai',
									type: 'textInput',
									field: 'address',
								},
							]);
							setIsProcessing(false);
							return;
						}

						// Update flowData with address
						setFlowData((prev) => ({
							...prev,
							userData: {
								...prev.userData,
								address: value.trim(),
							},
						}));

						setResponses((prev) => [
							...prev,
							{ text: value, sender: 'user' },
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
						setCurrentInputType(null);
						setIsProcessing(false);
						break;
				}
				break;

			case 'appointmentAction':
				if (data === 'Reschedule' || data === 'Cancel') {
					const action = data;
					setGuidedFlow(
						action === 'Reschedule'
							? 'RescheduleAppointment'
							: 'CancelAppointment'
					);

					try {
						const token = localStorage.getItem('token');
						if (!token) {
							setResponses((prev) => [
								...prev,
								{
									text: 'You are not logged in, kindly log in or create an account with your email address you have used before.\n\nOr you may contact our support at 012-3456789 for appointments rescheduling or cancellation',
									sender: 'ai',
								},
							]);
							return;
						}

						const cachedUser = JSON.parse(localStorage.getItem('user'));
						const response = await fetch(
							`${config.apiUrl}/api/appointments/patient?email=${cachedUser.email}`,
							{
								headers: {
									Authorization: `Bearer ${localStorage.getItem('token')}`,
								},
							}
						);
						const appointments = await response.json();

						// Sort appointments by date in ascending order
						const sortedAppointments = appointments
							.filter((apt) => apt.status === 'confirmed')
							.sort(
								(a, b) =>
									new Date(a.appointmentTime) - new Date(b.appointmentTime)
							);

						if (sortedAppointments.length === 0) {
							setResponses((prev) => [
								...prev,
								{
									text: `You have no upcoming appointments to ${action.toLowerCase()}.`,
									sender: 'ai',
								},
							]);
							return;
						}
						setResponses((prev) => [
							...prev,
							{
								text: `Which appointments would you like to ${action.toLowerCase()}?`,
								sender: 'ai',
								type: 'appointmentSelection',
								data: {
									appointments: sortedAppointments,
									currentPage: 0,
								},
							},
						]);
					} catch (error) {
						console.error('Error fetching appointments:', error);
						setResponses((prev) => [
							...prev,
							{
								text: 'Sorry, there was an error fetching your appointments. Please try again later.',
								sender: 'ai',
							},
						]);
					}
				}
				break;

			case 'selectAppointment':
				const selectedAppointment = data;
				setFlowData((prev) => ({
					...prev,
					selectedAppointment,
				}));

				// Add user's selection to chat
				setResponses((prev) => [
					...prev,
					{
						text: `Selected appointment: ${format(
							new Date(selectedAppointment.appointmentTime),
							'PPpp'
						)}`,
						sender: 'user',
					},
				]);

				if (guidedFlow === 'RescheduleAppointment') {
					setResponses((prev) => [
						...prev,
						{
							text: 'Please select a new date for your appointment:',
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
				} else if (guidedFlow === 'CancelAppointment') {
					setResponses((prev) => [
						...prev,
						{
							text: 'Please provide a reason for cancellation:',
							sender: 'ai',
						},
					]);
					setCurrentInputType('cancellationReason');
				}
				break;

			case 'rescheduleNotes':
				if (!userInputText?.trim()) {
					setResponses((prev) => [
						...prev,
						{ text: '', sender: 'user' },
						{
							text: 'Please provide a reason for rescheduling (Required):',
							sender: 'ai',
						},
					]);
					return;
				}

				const handleReschedule = async () => {
					// Add async function
					try {
						const notes = userInputText?.trim();
						const response = await fetch(
							`${config.apiUrl}/api/appointments/${flowData.selectedAppointment._id}/reschedule`,
							{
								method: 'PUT',
								headers: {
									'Content-Type': 'application/json',
									Authorization: `Bearer ${localStorage.getItem('token')}`,
								},
								body: JSON.stringify({
									newDateTime: flowData.newDateTime,
									reason: notes,
								}),
							}
						);

						if (!response.ok) {
							throw new Error('Failed to reschedule appointment');
						}

						const { title } = getAppointmentDescription(
							flowData.selectedAppointment
						);
						const newDateTime = new Date(flowData.newDateTime);

						setResponses((prev) => [
							...prev,
							{ text: notes, sender: 'user' },
							{
								text: `Your appointment for ${title} has been rescheduled to ${format(
									newDateTime,
									'MMMM d, yyyy'
								)} at ${format(newDateTime, 'h:mm a')}.`,
								sender: 'ai',
							},
						]);

						// Reset states
						setGuidedFlow(null);
						setFlowData({});
						setCurrentInputType(null);
					} catch (error) {
						console.error('Error rescheduling appointment:', error);
						setResponses((prev) => [
							...prev,
							{
								text: 'Sorry, there was an error rescheduling your appointment. Please try again later.',
								sender: 'ai',
							},
						]);
					}
				};

				handleReschedule(); // Call the async function
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

			case 'cancellationReason':
				if (!userInputText?.trim()) {
					setResponses((prev) => [
						...prev,
						{
							text: 'Please provide a reason for cancellation:',
							sender: 'ai',
							type: 'textInput',
							field: 'cancellationReason',
						},
					]);
					return;
				}

				try {
					// Add user's input to responses first
					setResponses((prev) => [
						...prev,
						{
							text: userInputText,
							sender: 'user',
						},
					]);

					const response = await fetch(
						`${config.apiUrl}/api/appointments/${flowData.selectedAppointment._id}/status`,
						{
							method: 'PUT',
							headers: {
								'Content-Type': 'application/json',
								Authorization: `Bearer ${localStorage.getItem('token')}`,
							},
							body: JSON.stringify({
								status: 'cancelled',
								notes: userInputText,
							}),
						}
					);

					if (response.ok) {
						// Get appointment details for the confirmation message
						const { title, datetime } = getAppointmentDescription(
							flowData.selectedAppointment
						);

						setResponses((prev) => [
							...prev,
							{
								text:
									`Your appointment has been cancelled successfully:\n\n` +
									`Treatment: ${title}\n` +
									`Date and Time: ${datetime}\n` +
									`Cancellation Reason: ${userInputText}\n\n`,
								sender: 'ai',
							},
						]);

						// Reset states after successful cancellation
						setGuidedFlow(null);
						setFlowData({});
						setCurrentInputType(null);
					} else {
						throw new Error('Failed to cancel appointment');
					}
				} catch (error) {
					console.error('Error cancelling appointment:', error);
					setResponses((prev) => [
						...prev,
						{
							text: 'Sorry, there was an error cancelling your appointment. Please try again later.',
							sender: 'ai',
						},
					]);
				}
				break;

			case 'management':
				const intent = parseManagementIntent(userInputText);
				if (intent) {
					setResponses((prev) => [
						...prev,
						{ text: userInputText, sender: 'user' },
					]);
					handleGuidedAction('appointmentAction', intent);
				} else {
					setResponses((prev) => [
						...prev,
						{ text: userInputText, sender: 'user' },
						{
							text: 'Would you like to reschedule or cancel an appointment? Please specify.',
							sender: 'ai',
							type: 'textInput',
							field: 'management',
						},
					]);
					if (
						userInputText.toLowerCase().includes('cancel') ||
						userInputText.toLowerCase().includes('reschedule')
					) {
						setCurrentInputType('management'); // Keep the input type as management
					} else {
						setGuidedFlow(null);
						setFlowData({});
						setCurrentStep(0);
						setCurrentInputType(null);
					}
					setIsProcessing(false); // Reset processing state
					break; // Use break instead of return to continue the flow
				}
			case 'changeAppointmentPage':
				if (data.direction === 'prev' || data.direction === 'next') {
					setResponses((prev) =>
						prev.map((r) => {
							if (r.type === 'appointmentSelection') {
								return {
									...r,
									data: {
										...r.data,
										currentPage:
											(r.data.currentPage || 0) +
											(data.direction === 'next' ? 1 : -1),
									},
								};
							}
							return r;
						})
					);
				}
				break;

			case 'rescheduleNotes':
				handleGuidedAction('rescheduleNotes', null, userInputText);
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

			if (!selectedDate) {
				throw new Error('No appointment date selected');
			}

			let appointmentDateTime = new Date(selectedDate);

			// Parse the time from selectedTime
			if (flowData.selectedTime) {
				const timeMatch = flowData.selectedTime.match(/(\d+):(\d+)\s*(AM|PM)/i);

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
				}
			}

			// Validate appointment time
			const isValidTime = (date) => {
				if (!date) return false;
				const hours = date.getHours();
				const minutes = date.getMinutes();
				const isValid =
					hours >= 9 && (hours < 17 || (hours === 17 && minutes === 0));
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
				address: userData.address,
				treatment: flowData.selectedService,
				appointmentTime: appointmentDateTime.toISOString(), // Send directly in local time
				status: 'confirmed', // Change default status to confirmed
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
						`Phone: ${appointmentData.phone}\n` +
						`Address: ${appointmentData.address}\n\n` +
						`We hope to see you soon!`,
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
		resetState();
	};

	const resetState = () => {
		setGuidedFlow(null);
		setFlowData({});
		setCurrentStep(0);
		setUserInput('');
		setCurrentInputType(null);
		setIsProcessing(false);
	};

	// const handleManageAppointments = () => {
	// 	// Reset only flow-related states
	// 	setGuidedFlow(null);
	// 	setFlowData({});
	// 	setCurrentStep(0);
	// 	setCurrentInputType(null);

	// 	// Add new responses without clearing history
	// 	setResponses((prev) => [
	// 		...prev,
	// 		{
	// 			text: 'Would you like to reschedule or cancel an appointment?',
	// 			sender: 'ai',
	// 			type: 'managementOptions',
	// 			data: [
	// 				{ value: 'Reschedule', label: 'Reschedule Appointment' },
	// 				{ value: 'Cancel', label: 'Cancel Appointment' },
	// 			],
	// 		},
	// 	]);
	// };

	const handleUserInput = async (userInputText) => {
		setIsProcessing(true); // Set at start of processing

		try {
			if (currentInputType) {
				// Handle guided input types
				switch (currentInputType) {
					case 'name':
						if (!isValidName(userInputText)) {
							setResponses((prev) => [
								...prev,
								{ text: userInputText || '', sender: 'user' },
								{
									text: 'Please enter a valid name (at least 2 characters):',
									sender: 'ai',
									type: 'textInput',
									field: 'name',
								},
							]);
							setIsProcessing(false); // Reset here if validation fails
							return;
						}

						setFlowData((prev) => ({
							...prev,
							userData: {
								...prev.userData,
								name: userInputText,
							},
						}));

						setResponses((prev) => [
							...prev,
							{ text: userInputText, sender: 'user' },
							{
								text: 'Please enter your email address:',
								sender: 'ai',
								type: 'textInput',
								field: 'email',
							},
						]);
						setCurrentInputType('email');
						setIsProcessing(false); // Reset after processing
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
									type: 'textInput',
									field: 'email',
								},
							]);
							return;
						}
						// Update flowData with email
						setFlowData((prev) => ({
							...prev,
							userData: {
								...prev.userData,
								email: userInputText,
							},
						}));
						// Show next prompt
						setResponses((prev) => [
							...prev,
							{ text: userInputText, sender: 'user' },
							{
								text: 'Please enter your phone number (+601X-XXXXXXX):',
								sender: 'ai',
								type: 'textInput',
								field: 'phone',
							},
						]);
						setCurrentInputType('phone');
						setIsProcessing(false); // Reset after processing
						break;

					case 'phone':
						const { isValid, formatted } =
							validateAndFormatPhone(userInputText);
						if (!isValid) {
							setResponses((prev) => [
								...prev,
								{
									text: userInputText || '',
									sender: 'user',
								},
								{
									text:
										'Please enter a valid Malaysian phone number:\n' +
										'Examples: 0123456789, +60123456789',
									sender: 'ai',
									type: 'textInput',
									field: 'phone',
								},
							]);
							setIsProcessing(false);
							return;
						}

						// Update flowData with formatted phone
						setFlowData((prev) => ({
							...prev,
							userData: {
								...prev.userData,
								phone: formatted,
							},
						}));

						// If not logged in or no address found, ask for address
						setResponses((prev) => [
							...prev,
							{ text: formatted, sender: 'user' },
							{
								text: 'Please enter your complete address:',
								sender: 'ai',
								type: 'textInput',
								field: 'address',
							},
						]);
						setCurrentInputType('address');
						setIsProcessing(false);
						break;
					case 'address':
						if (!userInputText?.trim()) {
							setResponses((prev) => [
								...prev,
								{ text: '', sender: 'user' },
								{
									text: 'Please enter a valid address:',
									sender: 'ai',
									type: 'textInput',
									field: 'address',
								},
							]);
							setIsProcessing(false);
							return;
						}

						// Update flowData with address
						setFlowData((prev) => ({
							...prev,
							userData: {
								...prev.userData,
								address: userInputText.trim(),
							},
						}));

						setResponses((prev) => [
							...prev,
							{ text: userInputText, sender: 'user' },
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
						setCurrentInputType(null);
						setIsProcessing(false);
						break;
					case 'notes':
						// Handle notes (allow empty for skipping)
						setFlowData((prev) => ({
							...prev,
							userData: {
								...prev.userData,
								notes: userInputText || '',
							},
						}));

						// Show the notes or skipped message in chat
						setResponses((prev) => [
							...prev,
							{
								text: userInputText || 'Skipped additional information',
								sender: 'user',
							},
						]);

						// Proceed with booking
						handleFinalBooking({
							...flowData.userData,
							notes: userInputText || '',
						});
						setCurrentInputType(null);
						setIsProcessing(false); // Reset after processing
						break;

					case 'management':
						const intent = parseManagementIntent(userInputText);
						if (intent) {
							setResponses((prev) => [
								...prev,
								{ text: userInputText, sender: 'user' },
							]);
							handleGuidedAction('appointmentAction', intent);
						} else {
							setResponses((prev) => [
								...prev,
								{ text: userInputText, sender: 'user' },
								{
									text: 'Would you like to reschedule or cancel an appointment? Please specify.',
									sender: 'ai',
									type: 'textInput',
									field: 'management',
								},
							]);
							if (
								userInputText.toLowerCase().includes('cancel') ||
								userInputText.toLowerCase().includes('reschedule')
							) {
								setCurrentInputType('management'); // Keep the input type as management
							} else {
								setGuidedFlow(null);
								setFlowData({});
								setCurrentStep(0);
								setCurrentInputType(null);
							}
						}
						setIsProcessing(false); // Reset processing state
						break; // Use break instead of return to continue the flow

					case 'rescheduleNotes':
						if (!userInputText?.trim()) {
							setResponses((prev) => [
								...prev,
								{ text: '', sender: 'user' },
								{
									text: 'Please provide a reason for rescheduling (Required):',
									sender: 'ai',
								},
							]);
							return;
						}

						const handleReschedule = async () => {
							// Add async function
							try {
								const notes = userInputText?.trim();
								const response = await fetch(
									`${config.apiUrl}/api/appointments/${flowData.selectedAppointment._id}/reschedule`,
									{
										method: 'PUT',
										headers: {
											'Content-Type': 'application/json',
											Authorization: `Bearer ${localStorage.getItem('token')}`,
										},
										body: JSON.stringify({
											newDateTime: flowData.newDateTime,
											reason: notes,
										}),
									}
								);

								if (!response.ok) {
									throw new Error('Failed to reschedule appointment');
								}

								const { title } = getAppointmentDescription(
									flowData.selectedAppointment
								);
								const newDateTime = new Date(flowData.newDateTime);

								setResponses((prev) => [
									...prev,
									{ text: notes, sender: 'user' },
									{
										text: `Your appointment for ${title} has been rescheduled to ${format(
											newDateTime,
											'MMMM d, yyyy'
										)} at ${format(newDateTime, 'h:mm a')}.`,
										sender: 'ai',
									},
								]);

								// Reset states
								setGuidedFlow(null);
								setFlowData({});
								setCurrentInputType(null);
							} catch (error) {
								console.error('Error rescheduling appointment:', error);
								setResponses((prev) => [
									...prev,
									{
										text: 'Sorry, there was an error rescheduling your appointment. Please try again later.',
										sender: 'ai',
									},
								]);
							}
						};

						handleReschedule(); // Call the async function
						break;

					case 'cancellationReason':
						if (!userInputText?.trim()) {
							setResponses((prev) => [
								...prev,
								{
									text: 'Please provide a reason for cancellation:',
									sender: 'ai',
									type: 'textInput',
									field: 'cancellationReason',
								},
							]);
							return;
						}

						// Pass the cancellation reason to handleGuidedAction
						handleGuidedAction('cancellationReason', null, userInputText);
						break;

					default:
						console.warn('Unhandled input type:', currentInputType);
						break;
				}
			} else {
				setIsProcessing(true); // Show processing state
				setResponses((prev) => [
					...prev,
					{ text: userInputText, sender: 'user' },
				]);
				console.log('USER INPUT', userInputText);
				// Update conversation context
				setConversationContext((prev) => ({
					...prev,
					interactionCount: prev.interactionCount + 1,
					timeOfDay: new Date().getHours(),
				}));

				// First check for management intents
				const managementIntent = parseManagementIntent(userInputText);
				if (managementIntent) {
					handleGuidedAction('appointmentAction', managementIntent);
					setIsProcessing(false);
					return;
				}

				// Detect intent with NLP
				const detectedIntent = await detectIntent(userInputText);

				// Get response based on confidence
				const getContextAwareResponse = (intent) => {
					const responses = responseVariations[intent] || [];
					const baseResponse =
						responses[Math.floor(Math.random() * responses.length)];

					// Add context-aware additions based on confidence
					if (confidence < 0.5) {
						return `I didn't quite catch that. Could you please rephrase your question so I can better assist you?`;
					}
					return baseResponse;
				};

				console.log('Detected Intent:', detectedIntent);
				console.log('Confidence Score:', confidence);
				switch (detectedIntent) {
					case 'booking':
						// const bookingResponse = getContextAwareResponse('booking');
						// setResponses((prev) => [
						// 	...prev,
						// 	{ text: bookingResponse, sender: 'ai' },
						// ]);
						handleCategoryClick('BookAppointment');
						break;

					case 'managing':
						const managingResponse = getContextAwareResponse('managing');
						setResponses((prev) => [
							...prev,
							{ text: managingResponse, sender: 'ai' },
						]);
						setCurrentInputType('management');
						break;

					case 'location':
						const locationResponse = getContextAwareResponse('location');
						setResponses((prev) => [
							...prev,
							{ text: locationResponse, sender: 'ai' },
						]);
						break;

					case 'greeting':
						const greetingResponse = getContextAwareResponse('greeting');
						setResponses((prev) => [
							...prev,
							{
								text: greetingResponse,
								sender: 'ai',
							},
						]);
						break;

					case 'help':
						const helpResponse = getContextAwareResponse('help');
						setResponses((prev) => [
							...prev,
							{
								text: helpResponse,
								sender: 'ai',
								type: 'options',
								data: [
									{ label: 'Book Appointment', value: 'booking' },
									{ label: 'Manage Appointments', value: 'managing' },
									{ label: 'Find Clinic Location', value: 'location' },
									{ label: 'Contact Us', value: 'contact' },
									{ label: 'Help/FAQ', value: 'help' },
								],
							},
						]);
						break; // Just use break instead of return

					case 'services':
						const services = await fetchServices();
						const servicesList = services
							.map((service) => `- ${service.name}`)
							.sort((a, b) => a.localeCompare(b)) // Sort in ascending alphabetical order
							.join('\n');
						setResponses((prev) => [
							...prev,
							{
								text: `Here are the services we offer:\n${servicesList}\nand more. \n\nFor more info, you may view our services on our website.`,
								sender: 'ai',
							},
						]);
						break;

					// Add a default case to handle low-confidence scenarios
					default:
						if (confidence < 0.5) {
							setResponses((prev) => [
								...prev,
								{
									text: "I'm not sure I understood that. Could you please rephrase?",
									sender: 'ai',
								},
							]);
						}
						break;
				}
				setUserInput('');
				setIsProcessing(false);
			}
		} catch (error) {
			console.error('Error in handleUserInput:', error);
			setIsProcessing(false); // Reset on error
		}

		setIsProcessing(false); // Ensure it's always reset at the end
	};

	// Modify detectIntent to use fuzzy matching
	const detectIntent = async (text) => {
		const lowercaseText = text.toLowerCase().trim();

		const directMatches = {
			help: ['help', 'faq', 'what can you do', 'guide me'],
			booking: ['book', 'appointment', 'schedule', 'book appointment'],
			managing: ['manage', 'reschedule', 'cancel', 'change appointment'],
			location: ['where', 'location', 'address', 'clinic location'],
			contact: ['contact', 'phone', 'call', 'reach'],
			services: ['services', 'treatments', 'available services'],
		};

		for (const [intent, patterns] of Object.entries(directMatches)) {
			if (patterns.some((pattern) => lowercaseText.includes(pattern))) {
				setConfidence(1.0); // Set high confidence for exact matches
				return intent;
			}
		}
		console.log(text);
		// If no exact match, use Hugging Face API
		return await processWithHuggingFace(text);
	};

	const processWithHuggingFace = async (text) => {
		try {
			console.log('📡 Sending request to Hugging Face API...');
			console.log('Token available:', !!HUGGING_FACE_TOKEN);

			if (!HUGGING_FACE_TOKEN) {
				console.error('Hugging Face token is missing');
				return null;
			}

			const response = await fetch(HUGGING_FACE_API_URL, {
				method: 'POST',
				headers: {
					Authorization: `Bearer ${HUGGING_FACE_TOKEN}`,
					'Content-Type': 'application/json',
				},
				body: JSON.stringify({
					inputs: text,
					parameters: {
						candidate_labels: [
							'greeting',
							'help',
							'booking appointment',
							'managing appointment',
							'asking location',
							'contact information',
						],
					},
				}),
			});

			const data = await response.json();
			console.log('API Response:', data);

			if (data && data.labels && data.labels.length > 0) {
				const labelMapping = {
					greeting: 'greeting',
					help: 'help',
					'booking appointment': 'booking',
					'managing appointment': 'managing',
					'asking location': 'location',
					'contact information': 'contact',
				};

				setConfidence(data.scores[0]);
				return labelMapping[data.labels[0]];
			}
			return null;
		} catch (error) {
			console.error('Hugging Face API error details:', {
				message: error.message,
				status: error.status,
				statusText: error.statusText,
			});
			return null;
		}
	};

	const fetchServices = async () => {
		try {
			const response = await axios.get(`${config.apiUrl}/api/services?limit=5`);
			return response.data;
		} catch (error) {
			console.error('Error fetching services:', error);
			return [];
		}
	};

	// Modify the input change handler
	const handleInputChange = (e) => {
		const value = e.target.value;
		setUserInput(value);

		// Validate based on current input type
		switch (currentInputType) {
			case 'name':
				setIsInputValid(isValidName(value));
				setInputHelperText(
					isValidName(value) ? '' : 'Name must be at least 2 characters'
				);
				break;
			case 'email':
				setIsInputValid(isValidEmail(value));
				setInputHelperText(
					isValidEmail(value) ? '' : 'Please enter a valid email address'
				);
				break;
			case 'phone':
				setIsInputValid(isValidPhoneInput(value));
				setInputHelperText(
					isValidPhoneInput(value)
						? ''
						: 'Enter a valid Malaysian phone number (e.g., +60123456789)'
				);
				break;
			default:
				setIsInputValid(true);
				setInputHelperText('');
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
					{/* Remove this section
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
						</Box>
					*/}

					<Box
						sx={{
							borderTop: '1px solid black',
							p: 2,
							backgroundColor: 'background.paper',
							display: 'flex',
							gap: 1,
						}}
					>
						<Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
							<TextField
								fullWidth
								placeholder={
									currentInputType === 'name'
										? 'Enter your full name...'
										: currentInputType === 'email'
										? 'Enter your email address...'
										: currentInputType === 'phone'
										? 'Enter your phone number (e.g., +60123456789)...'
										: currentInputType === 'notes'
										? 'Type your message or click Skip to skip notes (Optional)...'
										: 'Type a message...'
								}
								value={userInput}
								onChange={handleInputChange}
								onKeyDown={(e) => {
									if (
										e.key === 'Enter' &&
										(isInputValid || currentInputType === 'notes')
									) {
										if (currentInputType === 'notes' || userInput.trim()) {
											handleUserInput(userInput.trim());
											setUserInput('');
										}
									}
								}}
								error={!isInputValid && userInput !== ''}
								helperText={userInput !== '' ? inputHelperText : ''}
								sx={{
									'& .MuiOutlinedInput-root': {
										borderRadius: '20px',
									},
								}}
								disabled={isProcessing}
							/>
							<Button
								variant="contained"
								onClick={() => {
									if (currentInputType === 'notes' || userInput.trim()) {
										handleUserInput(userInput.trim());
										setUserInput('');
									}
								}}
								disabled={
									isProcessing ||
									(!isInputValid &&
										userInput !== '' &&
										currentInputType !== 'notes') // Don't disable for empty notes
								}
								sx={{
									borderRadius: '20px',
									minWidth: '100px',
									height: '56px',
									bgcolor: 'primary.main',
									'&:hover': {
										bgcolor: 'primary.dark',
									},
								}}
							>
								{isProcessing ? (
									<CircularProgress size={24} color="inherit" />
								) : currentInputType === 'notes' ? (
									userInput.trim() ? (
										'Submit'
									) : (
										'Skip'
									)
								) : (
									'Send'
								)}
							</Button>
						</Box>
					</Box>
				</Box>
			</Modal>
		</ThemeProvider>
	);
};

export default Chatbot;
