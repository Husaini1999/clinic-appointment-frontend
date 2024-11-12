import React from 'react';
import { Navigate } from 'react-router-dom';
import { Container } from '@mui/material';
import PatientDashboard from './PatientDashboard';
import StaffDashboard from './StaffDashboard';

function Dashboard() {
	// Get user from localStorage
	const userString = localStorage.getItem('user');
	const token = localStorage.getItem('token');

	// Check if user is logged in
	if (!token || !userString) {
		return <Navigate to="/login" />;
	}

	try {
		const user = JSON.parse(userString);

		// Validate user object
		if (!user || !user.role) {
			localStorage.clear(); // Clear invalid data
			return <Navigate to="/login" />;
		}

		// Render appropriate dashboard based on user role
		return (
			<Container>
				{user.role === 'staff' || user.role === 'admin' ? (
					<StaffDashboard />
				) : (
					<PatientDashboard />
				)}
			</Container>
		);
	} catch (error) {
		console.error('Error parsing user data:', error);
		localStorage.clear(); // Clear corrupted data
		return <Navigate to="/login" />;
	}
}

export default Dashboard;
