import React, { useEffect, useState } from 'react';
import { Box, Button, Typography } from '@mui/material';
import { DatePicker } from '@mui/x-date-pickers/DatePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addDays, format, startOfDay } from 'date-fns';
import config from '../config';
import {
	createDateTimeFromSlot,
	getTimeSlots,
	isValidAppointmentTime,
	isWeekday,
} from '../utils/dateUtils';

const timeSlots = getTimeSlots();
const morningSlots = timeSlots.filter((slot) => slot.endsWith('AM'));
const afternoonSlots = timeSlots.filter((slot) => slot.endsWith('PM'));

const AppointmentSlotPicker = ({ value, onChange }) => {
	const [selectedDate, setSelectedDate] = useState(() =>
		value ? startOfDay(new Date(value)) : null
	);
	const [bookedSlots, setBookedSlots] = useState([]);

	useEffect(() => {
		if (!selectedDate) {
			setBookedSlots([]);
			return undefined;
		}

		let cancelled = false;

		const loadBookedSlots = async () => {
			try {
				const formattedDate = format(selectedDate, 'yyyy-MM-dd');
				const response = await fetch(
					`${config.apiUrl}/api/appointments/booked-slots?date=${formattedDate}`
				);
				const data = await response.json();
				if (!cancelled) {
					setBookedSlots(data.bookedSlots || []);
				}
			} catch (error) {
				console.error('Error fetching booked slots:', error);
				if (!cancelled) {
					setBookedSlots([]);
				}
			}
		};

		loadBookedSlots();

		return () => {
			cancelled = true;
		};
	}, [selectedDate]);

	const selectedSlot = value ? format(new Date(value), 'h:mm a') : null;

	const handleDateChange = (newValue) => {
		setSelectedDate(newValue ? startOfDay(newValue) : null);
		onChange(null);
	};

	const renderSlots = (title, slots) => (
		<Box>
			<Typography
				variant="caption"
				color="text.secondary"
				sx={{ fontWeight: 700, letterSpacing: 0.4 }}
			>
				{title}
			</Typography>
			<Box
				sx={{
					display: 'grid',
					gridTemplateColumns: 'repeat(auto-fill, minmax(88px, 1fr))',
					gap: 1,
					mt: 1,
				}}
			>
				{slots.map((slot) => {
					const slotDate = createDateTimeFromSlot(selectedDate, slot);
					const isBooked = bookedSlots.includes(slot);
					const isSelected = selectedSlot === slot;
					const disabled =
						isBooked || !isValidAppointmentTime(slotDate);

					return (
						<Button
							key={slot}
							size="small"
							variant={isSelected ? 'contained' : 'outlined'}
							disabled={disabled}
							onClick={() => onChange(slotDate)}
							sx={{
								minHeight: 48,
								px: 0.5,
								borderRadius: 2,
								textTransform: 'none',
								fontWeight: isSelected ? 700 : 500,
								lineHeight: 1.1,
								...(isBooked && {
									bgcolor: 'grey.100',
									color: 'text.disabled',
									borderColor: 'grey.300',
								}),
							}}
						>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									alignItems: 'center',
								}}
							>
								{slot}
								{isBooked && (
									<Typography
										variant="caption"
										color="error"
										sx={{ fontSize: 10, lineHeight: 1.2 }}
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
	);

	return (
		<LocalizationProvider dateAdapter={AdapterDateFns}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
				<Typography variant="body2" color="text.secondary">
					Monday to Friday, 9:00 AM – 5:00 PM, in 30-minute slots.
				</Typography>
				<DatePicker
					label="Date"
					value={selectedDate}
					onChange={handleDateChange}
					shouldDisableDate={(date) => !isWeekday(date)}
					minDate={startOfDay(new Date())}
					maxDate={addDays(new Date(), 30)}
					slotProps={{
						textField: {
							fullWidth: true,
							size: 'small',
						},
					}}
				/>
				{selectedDate ? (
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
						{renderSlots('Morning', morningSlots)}
						{renderSlots('Afternoon', afternoonSlots)}
						{value && (
							<Box
								sx={{
									px: 1.5,
									py: 1,
									borderRadius: 2,
									bgcolor: 'grey.100',
									border: '1px solid',
									borderColor: 'divider',
								}}
							>
								<Typography variant="body2" sx={{ fontWeight: 600 }}>
									{format(new Date(value), "EEEE, MMMM d 'at' h:mm a")}
								</Typography>
							</Box>
						)}
					</Box>
				) : (
					<Typography variant="body2" color="text.secondary">
						Choose a date to see available times.
					</Typography>
				)}
			</Box>
		</LocalizationProvider>
	);
};

export default AppointmentSlotPicker;
