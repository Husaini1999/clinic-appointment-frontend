export const isAdmin = (role) => role?.toUpperCase() === 'ADMIN';
export const isStaff = (role) => role?.toUpperCase() === 'STAFF';

export const canManageUsers = (role) => {
	return isAdmin(role);
};

export const canViewAnalytics = (role) => {
	return isAdmin(role);
};

export const canChangeUserRole = (role) => {
	return isAdmin(role);
};

export const canRescheduleAppointments = (role) => {
	return ['admin', 'staff', 'patient'].includes(role?.toLowerCase());
};

export const canMarkNoShow = (role) => {
	return ['admin', 'staff'].includes(role?.toLowerCase());
};

export const canCancelAppointments = (role) => {
	return ['admin', 'staff'].includes(role?.toLowerCase());
};
