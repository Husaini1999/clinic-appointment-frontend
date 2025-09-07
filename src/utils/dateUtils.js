import { format, isBefore, isAfter, startOfDay, endOfDay } from 'date-fns';

/**
 * Date and Time Utility Functions
 * All functions work with local time to ensure consistency across the application
 */

/**
 * Check if a date is a weekday (Monday to Friday)
 * @param {Date} date - The date to check
 * @returns {boolean} - True if it's a weekday
 */
export const isWeekday = (date) => {
	if (!date) return false;
	const day = date.getDay();
	return day !== 0 && day !== 6; // 0 = Sunday, 6 = Saturday
};

/**
 * Check if a time is within business hours (9 AM to 5 PM local time)
 * @param {Date} date - The date/time to check
 * @returns {boolean} - True if within business hours
 */
export const isWithinBusinessHours = (date) => {
	if (!date) return false;
	const localHours = date.getHours();
	const minutes = date.getMinutes();
	return (
		localHours >= 9 && (localHours < 17 || (localHours === 17 && minutes === 0))
	);
};

/**
 * Check if an appointment time is valid (weekday, business hours, and not in the past)
 * @param {Date} date - The appointment date/time to validate
 * @returns {boolean} - True if valid
 */
export const isValidAppointmentTime = (date) => {
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

/**
 * Generate time slots for appointment booking (9 AM to 5 PM, 30-minute intervals)
 * @returns {string[]} - Array of formatted time slots
 */
export const getTimeSlots = () => {
	const slots = [];
	const startHour = 9;
	const endHour = 17;
	const interval = 30;

	for (let hour = startHour; hour <= endHour; hour++) {
		for (let minute = 0; minute < 60; minute += interval) {
			if (hour === endHour && minute > 0) break;

			// Create a date object for the slot using local time
			const slotDate = new Date();
			slotDate.setHours(hour, minute, 0, 0);
			slots.push(format(slotDate, 'h:mm a'));
		}
	}
	return slots;
};

/**
 * Format appointment date and time for display
 * @param {string|Date} appointmentTime - The appointment time (ISO string or Date object)
 * @returns {Object} - Object with formatted date and time
 */
export const formatAppointmentDateTime = (appointmentTime) => {
	const date = new Date(appointmentTime);
	return {
		date: format(date, 'PP'),
		time: format(date, 'p'),
		dateTime: format(date, 'PPp'),
		full: format(date, "EEEE, MMMM do, yyyy 'at' h:mm a"),
	};
};

/**
 * Check if an appointment is today
 * @param {string|Date} appointmentTime - The appointment time
 * @returns {boolean} - True if the appointment is today
 */
export const isToday = (appointmentTime) => {
	const appointmentDate = new Date(appointmentTime);
	const today = new Date();

	appointmentDate.setHours(0, 0, 0, 0);
	today.setHours(0, 0, 0, 0);

	return appointmentDate.getTime() === today.getTime();
};

/**
 * Check if an appointment is tomorrow
 * @param {string|Date} appointmentTime - The appointment time
 * @returns {boolean} - True if the appointment is tomorrow
 */
export const isTomorrow = (appointmentTime) => {
	const appointmentDate = new Date(appointmentTime);
	const tomorrow = new Date();
	tomorrow.setDate(tomorrow.getDate() + 1);

	appointmentDate.setHours(0, 0, 0, 0);
	tomorrow.setHours(0, 0, 0, 0);

	return appointmentDate.getTime() === tomorrow.getTime();
};

/**
 * Get relative time description for an appointment
 * @param {string|Date} appointmentTime - The appointment time
 * @returns {string} - Relative time description
 */
export const getRelativeTimeDescription = (appointmentTime) => {
	if (isToday(appointmentTime)) {
		return 'Today';
	} else if (isTomorrow(appointmentTime)) {
		return 'Tomorrow';
	} else {
		const appointmentDate = new Date(appointmentTime);
		const today = new Date();

		if (isBefore(appointmentDate, today)) {
			return 'Past';
		} else {
			return format(appointmentDate, 'MMM d');
		}
	}
};

/**
 * Create a date object for a specific time slot on a given date
 * @param {Date} date - The base date
 * @param {string} timeSlot - The time slot (e.g., "9:00 AM")
 * @returns {Date} - Date object with the specified time
 */
export const createDateTimeFromSlot = (date, timeSlot) => {
	const [time, period] = timeSlot.split(' ');
	const [hours, minutes] = time.split(':').map(Number);

	let hour24 = hours;
	if (period === 'PM' && hours !== 12) {
		hour24 += 12;
	} else if (period === 'AM' && hours === 12) {
		hour24 = 0;
	}

	const newDate = new Date(date);
	newDate.setHours(hour24, minutes, 0, 0);
	return newDate;
};

/**
 * Convert appointment time to ISO string for API calls
 * @param {Date} date - The appointment date/time
 * @returns {string} - ISO string representation
 */
export const toAppointmentISOString = (date) => {
	return new Date(date).toISOString();
};

/**
 * Parse appointment time from API response
 * @param {string} isoString - ISO string from API
 * @returns {Date} - Local Date object
 */
export const parseAppointmentTime = (isoString) => {
	return new Date(isoString);
};

/**
 * Get business hours range for display
 * @returns {string} - Formatted business hours
 */
export const getBusinessHours = () => {
	return '9:00 AM - 5:00 PM (Monday to Friday)';
};

/**
 * Check if current time is within business hours
 * @returns {boolean} - True if currently within business hours
 */
export const isCurrentlyBusinessHours = () => {
	return isWeekday(new Date()) && isWithinBusinessHours(new Date());
};

export default {
	isWeekday,
	isWithinBusinessHours,
	isValidAppointmentTime,
	getTimeSlots,
	formatAppointmentDateTime,
	isToday,
	isTomorrow,
	getRelativeTimeDescription,
	createDateTimeFromSlot,
	toAppointmentISOString,
	parseAppointmentTime,
	getBusinessHours,
	isCurrentlyBusinessHours,
};
