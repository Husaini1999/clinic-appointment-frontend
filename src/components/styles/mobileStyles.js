export const mobileResponsiveStyles = {
	container: {
		padding: {
			xs: 2,
			sm: 3,
			md: 4,
		},
	},
	typography: {
		h4: {
			fontSize: {
				xs: '1.5rem',
				sm: '2rem',
				md: '2.125rem',
			},
		},
		h5: {
			fontSize: {
				xs: '1.25rem',
				sm: '1.5rem',
				md: '1.75rem',
			},
		},
	},
	filterBox: {
		flexDirection: {
			xs: 'column',
			sm: 'row',
		},
		alignItems: {
			xs: 'flex-start',
			sm: 'center',
		},
		gap: 2,
	},
	chipGroup: {
		display: 'flex',
		flexWrap: 'wrap',
		gap: 1,
		mt: { xs: 1, sm: 0 },
	},
	tableContainer: {
		width: '100%',
		overflowX: 'auto',
		'& .MuiTable-root': {
			minWidth: {
				xs: '600px',
				sm: '800px',
				md: '100%',
			},
		},
		'& .MuiTableCell-root': {
			padding: {
				xs: '8px 4px',
				sm: '16px',
			},
			fontSize: {
				xs: '0.75rem',
				sm: '0.875rem',
			},
		},
		'& .hide-on-mobile': {
			display: {
				xs: 'none !important',
				sm: 'table-cell !important',
			},
		},
	},
};
