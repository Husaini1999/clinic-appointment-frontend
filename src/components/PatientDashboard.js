import React, { useState, useEffect, useCallback, useMemo } from 'react';
import {
	Container,
	Paper,
	Typography,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableRow,
	TableHead,
	Box,
	Chip,
	TextField,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	TablePagination,
	IconButton,
	useTheme,
	useMediaQuery,
	TableSortLabel,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
} from '@mui/material';
import { format } from 'date-fns';
import NotesHistory from './NotesHistory';
import { enhancedTableStyles } from './styles/tableStyles';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { mobileResponsiveStyles } from './styles/mobileStyles';
import config from '../config';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import ClearIcon from '@mui/icons-material/Clear';

const statusDisplayNames = {
	all: 'All',
	confirmed: 'Confirmed',
	completed: 'Completed',
	no_show: 'No Show',
	cancelled: 'Cancelled',
};

const CancelModal = React.memo(
	({ open, onClose, onCancel, appointmentId, notes, onNotesChange }) => (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle>Cancel Appointment</DialogTitle>
			<DialogContent>
				<Typography variant="body2" sx={{ mb: 2 }}>
					Are you sure you want to cancel this appointment?
				</Typography>
				<TextField
					fullWidth
					multiline
					rows={4}
					label="Cancellation Reason (Required)"
					value={notes}
					onChange={onNotesChange}
					margin="normal"
					required
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Back</Button>
				<Button
					onClick={() => onCancel(appointmentId, notes)}
					color="warning"
					variant="contained"
					disabled={!notes.trim()}
				>
					Cancel Appointment
				</Button>
			</DialogActions>
		</Dialog>
	)
);

const RescheduleModal = React.memo(
	({
		open,
		onClose,
		onReschedule,
		appointmentId,
		notes,
		onNotesChange,
		currentDateTime,
	}) => (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle>Reschedule Appointment</DialogTitle>
			<DialogContent>
				<Typography variant="body2" sx={{ mb: 2 }}>
					Please select a new date and time for this appointment.
				</Typography>
				<LocalizationProvider dateAdapter={AdapterDateFns}>
					<DateTimePicker
						label="New Appointment Time"
						value={notes.newDateTime || null}
						onChange={(newValue) => {
							onNotesChange({
								target: {
									value: {
										...notes,
										newDateTime: newValue,
									},
								},
							});
						}}
						minDate={new Date()}
						shouldDisableDate={(date) => {
							const day = date.getDay();
							return day === 0 || day === 6; // Disable weekends
						}}
						shouldDisableTime={(time, type) => {
							const hours = time.getHours();
							return hours < 9 || hours >= 17; // 9 AM to 5 PM
						}}
						sx={{ width: '100%', mt: 2 }}
					/>
				</LocalizationProvider>
				<TextField
					fullWidth
					multiline
					rows={4}
					label="Reason for Rescheduling (Required)"
					value={notes.reason || ''}
					onChange={(e) =>
						onNotesChange({
							target: {
								value: {
									...notes,
									reason: e.target.value,
								},
							},
						})
					}
					margin="normal"
					required
				/>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose}>Cancel</Button>
				<Button
					onClick={() => onReschedule(appointmentId)}
					color="primary"
					variant="contained"
					disabled={!notes.reason?.trim() || !notes.newDateTime}
				>
					Reschedule
				</Button>
			</DialogActions>
		</Dialog>
	)
);

const CollapsibleNotesCell = ({ notes }) => {
	const [isExpanded, setIsExpanded] = useState(false);

	return (
		<TableCell
			className="hide-on-mobile"
			sx={{
				borderRight: 'none',
				borderLeft: 'none',
				padding: '8px',
				verticalAlign: 'middle',
				position: 'relative',
				minHeight: '60px',
				textAlign: notes?.length === 0 ? 'center' : 'left',
				color: notes?.length === 0 ? 'text.secondary' : 'inherit',
			}}
		>
			{notes?.length === 0 ? (
				'No notes available'
			) : (
				<Box
					sx={{
						position: 'relative',
						maxHeight: isExpanded ? '1000px' : '60px',
						overflow: 'hidden',
						transition: 'max-height 0.3s ease-in-out',
					}}
				>
					<Box className="notes-content">
						<NotesHistory notes={notes} />
					</Box>
					<IconButton
						size="small"
						onClick={() => setIsExpanded(!isExpanded)}
						sx={{
							position: 'absolute',
							bottom: 0,
							right: 4,
							backgroundColor: 'background.paper',
							boxShadow: 1,
							'&:hover': { backgroundColor: 'grey.100' },
						}}
					>
						{isExpanded ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
					</IconButton>
				</Box>
			)}
		</TableCell>
	);
};

function Dashboard() {
	const [patientAppointments, setPatientAppointments] = useState([]);
	const [cancelModalOpen, setCancelModalOpen] = useState(false);
	const [selectedAppointment, setSelectedAppointment] = useState(null);
	const [cancelNotes, setCancelNotes] = useState('');
	const [statusFilter, setStatusFilter] = useState('all');
	const [rowsPerPage, setRowsPerPage] = useState(5);
	const [upcomingPage, setUpcomingPage] = useState(0);
	const [pastPage, setPastPage] = useState(0);
	const [rescheduleModalOpen, setRescheduleModalOpen] = useState(false);
	const [rescheduleNotes, setRescheduleNotes] = useState({
		reason: '',
		newDateTime: null,
	});
	const [timeFilter, setTimeFilter] = useState('all');
	const [sortValue, setSortValue] = useState('appointmentTime_asc');
	const [upcomingOrderBy, setUpcomingOrderBy] = useState('appointmentTime');
	const [upcomingOrder, setUpcomingOrder] = useState('asc');
	const [pastOrderBy, setPastOrderBy] = useState('appointmentTime');
	const [pastOrder, setPastOrder] = useState('desc');

	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	// Use useMemo to ensure user is stable
	const user = useMemo(() => JSON.parse(localStorage.getItem('user')), []);

	const fetchAppointments = useCallback(async () => {
		if (!user) return; // Ensure user is defined

		if (user.role === 'patient') {
			try {
				const endpoint = `${
					config.apiUrl
				}/api/appointments/patient?email=${encodeURIComponent(user.email)}`;
				const response = await fetch(endpoint, {
					headers: {
						Authorization: `Bearer ${localStorage.getItem('token')}`,
					},
				});
				if (!response.ok) {
					throw new Error('Network response was not ok');
				}
				const data = await response.json();
				setPatientAppointments(data);
			} catch (error) {
				console.error('Error fetching patient appointments:', error);
			}
		}
	}, [user]); // Depend on user

	useEffect(() => {
		fetchAppointments(); // Fetch appointments
	}, [fetchAppointments]); // Depend on stable function

	const getStatusColor = (status) => {
		switch (status) {
			case 'confirmed':
				return 'info';
			case 'completed':
				return 'success';
			case 'no_show':
				return 'error';
			case 'cancelled':
				return 'default';
			default:
				return 'default';
		}
	};

	const handleCancelClick = (appointment) => {
		setSelectedAppointment(appointment);
		setCancelModalOpen(true);
	};

	const handleCancelClose = () => {
		setCancelModalOpen(false);
		setSelectedAppointment(null);
		setCancelNotes('');
	};

	const handleCancelAppointment = async (appointmentId, notes) => {
		try {
			const token = localStorage.getItem('token');
			const user = JSON.parse(localStorage.getItem('user'));

			if (!token) {
				console.error('No token found');
				return;
			}

			console.log('Sending request with token:', token); // Debug log

			const response = await fetch(
				`${config.apiUrl}/api/appointments/${appointmentId}/status`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						status: 'cancelled',
						notes: notes,
						cancelledBy: user.role,
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Server error:', errorData);
				return;
			}

			handleCancelClose();
			fetchAppointments();
		} catch (error) {
			console.error('Error cancelling appointment:', error);
		}
	};

	const tableHeaders = [
		{ label: 'No.' },
		{ label: 'Treatment' },
		{ label: 'Date & Time' },
		{ label: 'Status' },
		{ label: 'Notes History' },
		{ label: 'Actions' },
	];

	const today = new Date();

	const upcomingAppointments = patientAppointments.filter(
		(appointment) => new Date(appointment.appointmentTime) >= today
	);

	const pastAppointments = patientAppointments.filter(
		(appointment) => new Date(appointment.appointmentTime) < today
	);

	const statusOptions = [
		'all',
		'confirmed',
		'completed',
		'no_show',
		'cancelled',
	];

	const filterAppointmentsByStatus = (appointments) => {
		if (statusFilter === 'all') return appointments;
		return appointments.filter(
			(appointment) => appointment.status === statusFilter
		);
	};

	const filterAppointmentsByDay = (appointments) => {
		const today = new Date();
		today.setHours(0, 0, 0, 0);

		const tomorrow = new Date(today);
		tomorrow.setDate(tomorrow.getDate() + 1);

		switch (timeFilter) {
			case 'today':
				return appointments.filter((appointment) => {
					const appointmentDate = new Date(appointment.appointmentTime);
					appointmentDate.setHours(0, 0, 0, 0);
					return appointmentDate.getTime() === today.getTime();
				});
			case 'tomorrow':
				return appointments.filter((appointment) => {
					const appointmentDate = new Date(appointment.appointmentTime);
					appointmentDate.setHours(0, 0, 0, 0);
					return appointmentDate.getTime() === tomorrow.getTime();
				});
			default:
				return appointments;
		}
	};

	const sortAppointmentsByDate = (appointments, sortOrder, sortBy) => {
		if (!sortBy) return appointments;

		return [...appointments].sort((a, b) => {
			let result;
			if (sortBy === 'appointmentTime') {
				result = new Date(a.appointmentTime) - new Date(b.appointmentTime);
			} else if (sortBy === 'treatment') {
				result = (a.treatment?.name || '').localeCompare(
					b.treatment?.name || ''
				);
			} else {
				result = (a[sortBy] || '').localeCompare(b[sortBy] || '');
			}
			return sortOrder === 'asc' ? result : -result;
		});
	};

	const filteredUpcomingAppointments = sortAppointmentsByDate(
		filterAppointmentsByDay(filterAppointmentsByStatus(upcomingAppointments)),
		upcomingOrder,
		upcomingOrderBy
	);

	const filteredPastAppointments = sortAppointmentsByDate(
		filterAppointmentsByStatus(pastAppointments),
		pastOrder,
		pastOrderBy
	);

	const paginateAppointments = (appointments, page) => {
		const startIndex = page * rowsPerPage;
		return appointments.slice(startIndex, startIndex + rowsPerPage);
	};

	const paginatedUpcomingAppointments = paginateAppointments(
		filteredUpcomingAppointments,
		upcomingPage
	);
	const paginatedPastAppointments = paginateAppointments(
		filteredPastAppointments,
		pastPage
	);

	const mergedTableStyles = {
		...enhancedTableStyles.root,
		...mobileResponsiveStyles.tableContainer,
		width: '100%',
		tableLayout: 'fixed',
		'& .MuiTableCell-root': {
			padding: {
				xs: '8px 4px',
				sm: '16px',
			},
			height: 'auto',
			display: 'table-cell',
			verticalAlign: 'middle',
			textAlign: 'center',
			wordBreak: 'break-word',
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
			},
		},
		'& .MuiTableHead-root .MuiTableCell-root': {
			backgroundColor: (theme) => theme.palette.primary.main,
			color: 'white',
			fontWeight: 'bold',
			'& .MuiTableSortLabel-root': {
				color: 'white',
				'&:hover': {
					color: 'rgba(255, 255, 255, 0.8)',
				},
				'&.Mui-active': {
					color: 'white',
					'& .MuiTableSortLabel-icon': {
						color: 'white !important',
					},
				},
			},
		},
		'& .hide-on-mobile': {
			display: {
				xs: 'none !important',
				sm: 'table-cell !important',
			},
		},
	};

	const handleUpcomingPageChange = (event, newPage) => {
		setUpcomingPage(newPage);
	};

	const handlePastPageChange = (event, newPage) => {
		setPastPage(newPage);
	};

	const handleRowsPerPageChange = (event) => {
		setRowsPerPage(parseInt(event.target.value, 10));
		setUpcomingPage(0);
		setPastPage(0);
	};

	const handleRescheduleClick = (appointment) => {
		setSelectedAppointment(appointment);
		setRescheduleModalOpen(true);
	};

	const handleRescheduleClose = () => {
		setRescheduleModalOpen(false);
		setSelectedAppointment(null);
		setRescheduleNotes({ reason: '', newDateTime: null });
	};

	const handleRescheduleAppointment = async (appointmentId) => {
		try {
			const token = localStorage.getItem('token');
			if (!token) {
				console.error('No token found');
				return;
			}

			const response = await fetch(
				`${config.apiUrl}/api/appointments/${appointmentId}/reschedule`,
				{
					method: 'PUT',
					headers: {
						'Content-Type': 'application/json',
						Authorization: `Bearer ${token}`,
					},
					body: JSON.stringify({
						newDateTime: rescheduleNotes.newDateTime,
						reason: rescheduleNotes.reason,
					}),
				}
			);

			if (!response.ok) {
				const errorData = await response.json();
				console.error('Server error:', errorData);
				return;
			}

			handleRescheduleClose();
			fetchAppointments();
		} catch (error) {
			console.error('Error rescheduling appointment:', error);
		}
	};

	const handleUpcomingSort = (property) => {
		const isAsc = upcomingOrderBy === property && upcomingOrder === 'asc';
		const isDesc = upcomingOrderBy === property && upcomingOrder === 'desc';

		if (isDesc) {
			setUpcomingOrder('asc');
			setUpcomingOrderBy('');
		} else {
			setUpcomingOrder(isAsc ? 'desc' : 'asc');
			setUpcomingOrderBy(property);
		}
	};

	const handlePastSort = (property) => {
		const isAsc = pastOrderBy === property && pastOrder === 'asc';
		const isDesc = pastOrderBy === property && pastOrder === 'desc';

		if (isDesc) {
			setPastOrder('asc');
			setPastOrderBy('');
		} else {
			setPastOrder(isAsc ? 'desc' : 'asc');
			setPastOrderBy(property);
		}
	};

	const handleSort = (value) => {
		setSortValue(value); // Always update sortValue

		if (!value) {
			setUpcomingOrderBy('');
			setUpcomingOrder('asc');
			setPastOrderBy('');
			setPastOrder('desc');
			return;
		}

		const [field, direction] = value.split('_');
		setUpcomingOrderBy(field);
		setUpcomingOrder(direction);
		setPastOrderBy(field);
		setPastOrder(direction);
	};

	const clearAllFilters = () => {
		setTimeFilter('all');
		setStatusFilter('all');
		setSortValue('appointmentTime_asc');
		setUpcomingOrderBy('appointmentTime');
		setUpcomingOrder('asc');
		setPastOrderBy('appointmentTime');
		setPastOrder('desc');
	};

	// Add time filter options array
	const timeFilterOptions = ['all', 'today', 'tomorrow'];

	// Add time display names object
	const timeDisplayNames = {
		all: 'All',
		today: 'Today',
		tomorrow: 'Tomorrow',
	};

	// Add sort options
	const sortOptions = [
		{ value: 'appointmentTime_asc', label: 'Date & Time (Earliest First)' },
		{ value: 'appointmentTime_desc', label: 'Date & Time (Latest First)' },
		{ value: 'treatment_asc', label: 'Treatment (A-Z)' },
		{ value: 'treatment_desc', label: 'Treatment (Z-A)' },
	];

	return (
		<Container
			maxWidth="lg"
			sx={{
				...mobileResponsiveStyles.container,
				mt: { xs: 2, sm: 4 },
			}}
		>
			<Box
				sx={{
					display: 'flex',
					flexDirection: { xs: 'column', sm: 'row' },
					justifyContent: 'space-between',
					mb: { xs: 2, sm: 4 },
				}}
			>
				<Typography
					variant="h4"
					component="h1"
					sx={mobileResponsiveStyles.typography.h4}
				>
					Welcome, {user.name}
				</Typography>
			</Box>

			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'flex-start',
					gap: 3,
					mb: 4,
					backgroundColor: 'background.paper',
					p: 3, // Increased padding
					borderRadius: 1,
					boxShadow: 1,
					flexWrap: 'wrap', // Allow wrapping on smaller screens
				}}
			>
				{/* Left Column - Filters */}
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						gap: 3,
						flex: '1', // Takes more space for filters
						maxWidth: '60%', // Added max width
					}}
				>
					{/* Time Filter */}
					<Box>
						<Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
							Filter by Time:
						</Typography>
						<Box sx={mobileResponsiveStyles.chipGroup}>
							{timeFilterOptions.map((time) => (
								<Chip
									key={time}
									label={timeDisplayNames[time]}
									onClick={() => setTimeFilter(time)}
									color={timeFilter === time ? 'primary' : 'default'}
									sx={{
										fontSize: { xs: '0.75rem', sm: '0.875rem' },
										m: 0.5,
									}}
								/>
							))}
						</Box>
					</Box>

					{/* Status Filter */}
					<Box>
						<Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
							Filter by Status:
						</Typography>
						<Box sx={mobileResponsiveStyles.chipGroup}>
							{statusOptions.map((status) => (
								<Chip
									key={status}
									label={statusDisplayNames[status]}
									onClick={() => setStatusFilter(status)}
									color={statusFilter === status ? 'primary' : 'default'}
									sx={{
										fontSize: { xs: '0.75rem', sm: '0.875rem' },
										m: 0.5,
									}}
								/>
							))}
						</Box>
					</Box>
				</Box>

				{/* Right Column - Sort and Clear */}
				<Box
					sx={{
						display: 'flex',
						flexDirection: 'column',
						alignItems: 'stretch',
						gap: 6,
						flex: '1', // Takes less space
						minWidth: '250px', // Ensures dropdown doesn't get too narrow
					}}
				>
					{/* Sort Dropdown */}
					<Box>
						<Typography variant="body1" sx={{ mb: 1, fontWeight: 500 }}>
							Sort by:
						</Typography>
						<FormControl size="small" fullWidth>
							<Select
								value={sortValue}
								onChange={(e) => handleSort(e.target.value)}
								displayEmpty
							>
								{sortOptions.map((option) => (
									<MenuItem key={option.value} value={option.value}>
										{option.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Box>

					{/* Clear Filters Button */}
					<Button
						variant="outlined"
						onClick={clearAllFilters}
						startIcon={<ClearIcon />}
						size="small"
						sx={{
							mt: 'auto', // Pushes button to bottom
							alignSelf: 'flex-end',
						}}
					>
						Clear All Filters
					</Button>
				</Box>
			</Box>

			{/* Upcoming Appointments Table */}
			<Typography variant="h5" sx={{ mb: 2 }}>
				Upcoming Appointments
			</Typography>
			<TableContainer component={Paper} sx={mergedTableStyles}>
				<Table
					sx={{
						...mergedTableStyles,
						stickyHeader: true,
						'& .MuiTableCell-root': {
							whiteSpace: { xs: 'normal', sm: 'nowrap' },
							padding: { xs: '8px 4px', sm: '16px' },
						},
					}}
				>
					<TableHead>
						<TableRow>
							<TableCell width="5%">No.</TableCell>
							<TableCell width="20%" align="center">
								<TableSortLabel
									active={upcomingOrderBy === 'treatment'}
									direction={
										upcomingOrderBy === 'treatment' ? upcomingOrder : 'asc'
									}
									onClick={() => handleUpcomingSort('treatment')}
								>
									Treatment
								</TableSortLabel>
							</TableCell>
							<TableCell width="20%" align="center">
								<TableSortLabel
									active={upcomingOrderBy === 'appointmentTime'}
									direction={
										upcomingOrderBy === 'appointmentTime'
											? upcomingOrder
											: 'asc'
									}
									onClick={() => handleUpcomingSort('appointmentTime')}
								>
									Date & Time
								</TableSortLabel>
							</TableCell>
							<TableCell width="15%" align="center">
								Status
							</TableCell>
							<TableCell width="20%" align="center" className="hide-on-mobile">
								Notes History
							</TableCell>
							<TableCell width="20%" align="center">
								Actions
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{paginatedUpcomingAppointments.length > 0 ? (
							paginatedUpcomingAppointments.map((appointment, index) => (
								<TableRow key={appointment._id}>
									<TableCell>
										{upcomingPage * rowsPerPage + index + 1}
									</TableCell>
									<TableCell align="center">
										{appointment.treatment?.name || 'N/A'}
									</TableCell>
									<TableCell align="center">
										{format(new Date(appointment.appointmentTime), 'PP')}
										<br />
										{format(new Date(appointment.appointmentTime), 'p')}
									</TableCell>
									<TableCell align="center">
										<Chip
											label={statusDisplayNames[appointment.status]}
											color={getStatusColor(appointment.status)}
											sx={{
												fontWeight: 'medium',
												minWidth: '90px',
											}}
										/>
									</TableCell>
									<CollapsibleNotesCell notes={appointment.noteHistory} />
									<TableCell
										className="actions-cell"
										sx={{
											height: '60px',
											padding: '8px',
											textAlign: 'center',
											verticalAlign: 'middle',
										}}
									>
										{appointment.status === 'confirmed' && (
											<Box
												sx={{
													display: 'flex',
													justifyContent: 'center',
													alignItems: 'center',
													gap: 1,
													height: '100%',
												}}
											>
												<Button
													variant="contained"
													color="primary"
													size="small"
													onClick={() => handleRescheduleClick(appointment)}
													sx={{
														boxShadow: 2,
														'&:hover': {
															boxShadow: 4,
															backgroundColor: (theme) =>
																theme.palette.primary.dark,
														},
														padding: '4px 12px',
														fontSize: '0.8rem',
														minWidth: 'auto',
														textTransform: 'none',
														borderRadius: '4px',
														fontWeight: 500,
													}}
												>
													Reschedule
												</Button>
												<Button
													variant="contained"
													color="error"
													size="small"
													onClick={() => handleCancelClick(appointment)}
													sx={{
														boxShadow: 2,
														'&:hover': {
															boxShadow: 4,
															backgroundColor: (theme) =>
																theme.palette.error.dark,
														},
														padding: '4px 12px',
														fontSize: '0.8rem',
														minWidth: 'auto',
														textTransform: 'none',
														borderRadius: '4px',
														fontWeight: 500,
													}}
												>
													Cancel
												</Button>
											</Box>
										)}
									</TableCell>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={isMobile ? 5 : tableHeaders.length}
									align="center"
									sx={{
										py: 4,
										color: 'text.secondary',
										fontSize: { xs: '0.875rem', sm: '1rem' },
									}}
								>
									No upcoming appointments available for the selected status.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
			{filteredUpcomingAppointments.length > 0 && (
				<TablePagination
					rowsPerPageOptions={[5, 10, 25]}
					component="div"
					count={filteredUpcomingAppointments.length}
					rowsPerPage={rowsPerPage}
					page={upcomingPage}
					onPageChange={handleUpcomingPageChange}
					onRowsPerPageChange={handleRowsPerPageChange}
					sx={{
						borderTop: '1px solid rgba(224, 224, 224, 1)',
						backgroundColor: '#fff',
					}}
				/>
			)}

			{/* Past Appointments Table */}
			<Typography variant="h5" sx={{ mb: 2, mt: 4 }}>
				Past Appointments
			</Typography>
			<TableContainer component={Paper} sx={mergedTableStyles}>
				<Table
					sx={{
						...mergedTableStyles,
						stickyHeader: true,
						'& .MuiTableCell-root': {
							whiteSpace: { xs: 'normal', sm: 'nowrap' },
							padding: { xs: '8px 4px', sm: '16px' },
						},
					}}
				>
					<TableHead>
						<TableRow>
							<TableCell width="5%">No.</TableCell>
							<TableCell width="20%" align="center">
								Treatment
							</TableCell>
							<TableCell width="20%" align="center">
								Date & Time
							</TableCell>
							<TableCell width="15%" align="center">
								Status
							</TableCell>
							<TableCell width="40%" align="center" className="hide-on-mobile">
								Notes History
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{paginatedPastAppointments.length > 0 ? (
							paginatedPastAppointments.map((appointment, index) => (
								<TableRow key={appointment._id}>
									<TableCell>{pastPage * rowsPerPage + index + 1}</TableCell>
									<TableCell align="center">
										{appointment.treatment?.name || 'N/A'}
									</TableCell>
									<TableCell align="center">
										{format(new Date(appointment.appointmentTime), 'PP')}
										<br />
										{format(new Date(appointment.appointmentTime), 'p')}
									</TableCell>
									<TableCell align="center">
										<Chip
											label={statusDisplayNames[appointment.status]}
											color={getStatusColor(appointment.status)}
											sx={{
												fontWeight: 'medium',
												minWidth: '90px',
											}}
										/>
									</TableCell>
									<CollapsibleNotesCell
										notes={appointment.noteHistory}
										className="hide-on-mobile"
									/>
								</TableRow>
							))
						) : (
							<TableRow>
								<TableCell
									colSpan={isMobile ? 4 : tableHeaders.length}
									align="center"
									sx={{
										py: 4,
										color: 'text.secondary',
										fontSize: { xs: '0.875rem', sm: '1rem' },
									}}
								>
									No past appointments available for the selected status.
								</TableCell>
							</TableRow>
						)}
					</TableBody>
				</Table>
			</TableContainer>
			{filteredPastAppointments.length > 0 && (
				<TablePagination
					rowsPerPageOptions={[5, 10, 25]}
					component="div"
					count={filteredPastAppointments.length}
					rowsPerPage={rowsPerPage}
					page={pastPage}
					onPageChange={handlePastPageChange}
					onRowsPerPageChange={handleRowsPerPageChange}
					sx={{
						borderTop: '1px solid rgba(224, 224, 224, 1)',
						backgroundColor: '#fff',
					}}
				/>
			)}

			<CancelModal
				open={cancelModalOpen}
				onClose={handleCancelClose}
				onCancel={handleCancelAppointment}
				appointmentId={selectedAppointment?._id}
				notes={cancelNotes}
				onNotesChange={(e) => setCancelNotes(e.target.value)}
			/>

			<RescheduleModal
				open={rescheduleModalOpen}
				onClose={handleRescheduleClose}
				onReschedule={handleRescheduleAppointment}
				appointmentId={selectedAppointment?._id}
				notes={rescheduleNotes}
				onNotesChange={(e) => setRescheduleNotes(e.target.value)}
				currentDateTime={selectedAppointment?.appointmentTime}
			/>
		</Container>
	);
}

export default Dashboard;
