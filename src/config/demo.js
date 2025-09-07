// Demo Mode Configuration
export const DEMO_CONFIG = {
	// Set this to true to enable demo mode
	ENABLE_DEMO_MODE: true,

	// Demo credentials
	DEMO_CREDENTIALS: [
		{
			role: 'Admin',
			email: 'admin@gmail.com',
			password: 'admin12345',
			description:
				'Full access to all features including user management, appointment management, and system settings.',
			color: '#ff6b6b',
		},
		{
			role: 'Staff',
			email: 'staff@gmail.com',
			password: 'staff12345',
			description:
				'Access to appointment management, patient records, and service management.',
			color: '#ffa726',
		},
		{
			role: 'Patient',
			email: 'patient@gmail.com',
			password: 'patient12345',
			description:
				'Access to book appointments, view personal records, and manage profile.',
			color: '#4caf50',
		},
	],

	// Demo mode messages
	DEMO_MESSAGES: {
		title: 'Demo Mode Active',
		subtitle:
			'Click "Use This" to auto-fill credentials, then click "Sign In" to start exploring!',
		warning:
			'This is a demonstration website. All data is for testing purposes only.',
		callToAction:
			'Ready to explore? Choose a role below and click "Use This" to get started!',
	},
};

export default DEMO_CONFIG;
