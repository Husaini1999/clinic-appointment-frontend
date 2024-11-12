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
} from '@mui/material';
import { format } from 'date-fns';
import NotesHistory from './NotesHistory';
import { enhancedTableStyles } from './styles/tableStyles';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import { mobileResponsiveStyles } from './styles/mobileStyles';
import config from '../config';

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
			case 'approved':
				return 'success';
			case 'pending':
				return 'warning';
			case 'rejected':
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

	const statusOptions = ['all', 'pending', 'approved', 'rejected', 'cancelled'];

	const filterAppointmentsByStatus = (appointments) => {
		if (statusFilter === 'all') return appointments;
		return appointments.filter(
			(appointment) => appointment.status === statusFilter
		);
	};

	const sortAppointmentsByDate = (appointments, order = 'asc') => {
		return [...appointments].sort((a, b) => {
			const dateA = new Date(a.appointmentTime);
			const dateB = new Date(b.appointmentTime);
			return order === 'asc'
				? dateA.getTime() - dateB.getTime()
				: dateB.getTime() - dateA.getTime();
		});
	};

	const filteredUpcomingAppointments = sortAppointmentsByDate(
		filterAppointmentsByStatus(upcomingAppointments),
		'asc' // Ascending order for upcoming appointments
	);

	const filteredPastAppointments = sortAppointmentsByDate(
		filterAppointmentsByStatus(pastAppointments),
		'desc' // Descending order for past appointments
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
					...mobileResponsiveStyles.filterBox,
					mb: 3,
				}}
			>
				<Typography variant="body1">Filter by Status:</Typography>
				<Box sx={mobileResponsiveStyles.chipGroup}>
					{statusOptions.map((status) => (
						<Chip
							key={status}
							label={status.charAt(0).toUpperCase() + status.slice(1)}
							onClick={() => setStatusFilter(status)}
							color={statusFilter === status ? 'primary' : 'default'}
							sx={{
								fontSize: { xs: '0.75rem', sm: '0.875rem' },
							}}
						/>
					))}
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
								Treatment
							</TableCell>
							<TableCell width="20%" align="center">
								Date & Time
							</TableCell>
							<TableCell width="15%" align="center">
								Status
							</TableCell>
							<TableCell width="25%" align="center" className="hide-on-mobile">
								Notes History
							</TableCell>
							<TableCell width="15%" align="center">
								Actions
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{paginatedUpcomingAppointments.length > 0 ? (
							paginatedUpcomingAppointments.map((appointment, index) => (
								<TableRow key={appointment._id}>
									<TableCell>{index + 1}</TableCell>
									<TableCell align="center">{appointment.treatment}</TableCell>
									<TableCell align="center">
										{format(new Date(appointment.appointmentTime), 'PP')}
										<br />
										{format(new Date(appointment.appointmentTime), 'p')}
									</TableCell>
									<TableCell align="center">
										<Chip
											label={appointment.status}
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
										{appointment.status === 'pending' && (
											<Box
												sx={{
													display: 'flex',
													justifyContent: 'center',
													alignItems: 'center',
													height: '100%',
												}}
											>
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
									<TableCell>{index + 1}</TableCell>
									<TableCell align="center">{appointment.treatment}</TableCell>
									<TableCell align="center">
										{format(new Date(appointment.appointmentTime), 'PP')}
										<br />
										{format(new Date(appointment.appointmentTime), 'p')}
									</TableCell>
									<TableCell align="center">
										<Chip
											label={appointment.status}
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
		</Container>
	);
}

export default Dashboard;
