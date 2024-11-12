const PERMISSIONS = {
	ADMIN: {
		users: ['view_all', 'create', 'edit', 'delete', 'change_role'],
		appointments: [
			'view_all',
			'approve',
			'reject',
			'cancel',
			'add_notes',
			'view_analytics',
		],
		system: ['manage_treatments', 'manage_settings'],
	},
	STAFF: {
		users: ['view_patients'],
		appointments: ['view_all', 'approve', 'reject', 'add_notes'],
		system: ['view_treatments'],
	},
	PATIENT: {
		users: ['view_self', 'edit_self'],
		appointments: ['view_own', 'create', 'cancel_own', 'add_notes'],
	},
};

export const hasPermission = (userRole, action) => {
	const rolePermissions = PERMISSIONS[userRole.toUpperCase()];
	return (
		rolePermissions &&
		Object.values(rolePermissions).some((permissions) =>
			permissions.includes(action)
		)
	);
};
