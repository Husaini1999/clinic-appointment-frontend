import React, { useState, useEffect, useCallback } from 'react';
import {
	Container,
	Grid,
	Paper,
	Typography,
	Tabs,
	Tab,
	Box,
	Card,
	CardContent,
} from '@mui/material';
import PendingActionsIcon from '@mui/icons-material/PendingActions';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ServiceManagement from './ServiceManagement';
import PeopleIcon from '@mui/icons-material/People';
import PersonOffIcon from '@mui/icons-material/PersonOff';
import AppointmentManagement from './AppointmentManagement';
import UserManagement from './UserManagement';
import { canViewAnalytics } from '../utils/roleUtils';
import config from '../config';

function TabPanel({ children, value, index }) {
	return (
		<div hidden={value !== index}>
			{value === index && <Box sx={{ p: 3 }}>{children}</Box>}
		</div>
	);
}

function StaffDashboard() {
	const [activeTab, setActiveTab] = useState(0);
	const [appointments, setAppointments] = useState([]);
	const [stats, setStats] = useState({
		confirmed: 0,
		completed: 0,
		no_show: 0,
		totalPatients: 0,
	});

	const user = JSON.parse(localStorage.getItem('user'));
	const showAnalytics = canViewAnalytics(user.role);

	const fetchAppointments = useCallback(async () => {
		try {
			const response = await fetch(`${config.apiUrl}/api/appointments`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				const sortedData = [...data].sort((a, b) =>
					a.patientName.localeCompare(b.patientName)
				);
				setAppointments(sortedData);

				setStats({
					confirmed: sortedData.filter((apt) => apt.status === 'confirmed')
						.length,
					completed: sortedData.filter((apt) => apt.status === 'completed')
						.length,
					no_show: sortedData.filter((apt) => apt.status === 'no_show').length,
					totalPatients: new Set(sortedData.map((apt) => apt.email)).size,
				});
			}
		} catch (error) {
			console.error('Error:', error);
		}
	}, []);

	useEffect(() => {
		fetchAppointments();
	}, [fetchAppointments]);

	const StatCard = ({ title, value, icon, color }) => (
		<Card sx={{ height: '100%' }}>
			<CardContent>
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<Box>
						<Typography color="textSecondary" gutterBottom>
							{title}
						</Typography>
						<Typography variant="h4" component="div">
							{value}
						</Typography>
					</Box>
					<Box sx={{ color: color }}>{icon}</Box>
				</Box>
			</CardContent>
		</Card>
	);

	return (
		<Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
			{/* Only show statistics for admin */}
			{showAnalytics && (
				<Grid container spacing={3} sx={{ mb: 4 }}>
					<Grid item xs={12} sm={6} md={3}>
						<StatCard
							title="Confirmed Appointments"
							value={stats.confirmed}
							icon={<PendingActionsIcon sx={{ fontSize: 40 }} />}
							color="info.main"
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<StatCard
							title="Completed Appointments"
							value={stats.completed}
							icon={<CheckCircleIcon sx={{ fontSize: 40 }} />}
							color="success.main"
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<StatCard
							title="No Show Appointments"
							value={stats.no_show}
							icon={<PersonOffIcon sx={{ fontSize: 40 }} />}
							color="error.main"
						/>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<StatCard
							title="Total Patients"
							value={stats.totalPatients}
							icon={<PeopleIcon sx={{ fontSize: 40 }} />}
							color="primary.main"
						/>
					</Grid>
				</Grid>
			)}

			<Paper sx={{ width: '100%', mb: 2 }}>
				<Tabs
					value={activeTab}
					onChange={(e, newValue) => setActiveTab(newValue)}
					sx={{ borderBottom: 1, borderColor: 'divider' }}
				>
					<Tab label="Appointments" />
					{user.role?.toUpperCase() === 'ADMIN' && [
						<Tab key="user" label="User Management" />,
						<Tab key="service" label="Service Management" />,
					]}
				</Tabs>
			</Paper>

			<TabPanel value={activeTab} index={0}>
				<AppointmentManagement
					appointments={appointments}
					onRefresh={fetchAppointments}
				/>
			</TabPanel>

			{user.role?.toUpperCase() === 'ADMIN' && [
				<TabPanel key="user-panel" value={activeTab} index={1}>
					<UserManagement />
				</TabPanel>,
				<TabPanel key="service-panel" value={activeTab} index={2}>
					<ServiceManagement />
				</TabPanel>,
			]}
		</Container>
	);
}

export default StaffDashboard;
