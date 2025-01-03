const PERMISSIONS = {
	ADMIN: {
		users: ['view_all', 'create', 'edit', 'delete', 'change_role'],
		appointments: [
			'view_all',
			'reschedule',
			'cancel',
			'mark_no_show',
			'add_notes',
			'view_analytics',
		],
		system: ['manage_treatments', 'manage_settings'],
	},
	STAFF: {
		users: ['view_patients'],
		appointments: [
			'view_all',
			'reschedule',
			'cancel',
			'mark_no_show',
			'add_notes',
		],
		system: ['view_treatments'],
	},
	PATIENT: {
		users: ['view_self', 'edit_self'],
		appointments: ['view_own', 'create', 'reschedule_own', 'add_notes'],
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
