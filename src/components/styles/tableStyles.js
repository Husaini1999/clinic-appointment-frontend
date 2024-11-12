import { alpha } from '@mui/material/styles';

export const enhancedTableStyles = {
	root: {
		'& .MuiTableCell-root': {
			padding: '16px',
			verticalAlign: 'top',
		},
		'& .MuiTableRow-root': {
			'&:nth-of-type(odd)': {
				backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.05),
			},
			'&:hover': {
				backgroundColor: (theme) => alpha(theme.palette.primary.main, 0.1),
				transition: 'background-color 0.2s ease',
			},
		},
		'& .MuiTableHead-root': {
			'& .MuiTableCell-root': {
				backgroundColor: (theme) => theme.palette.primary.main,
				color: 'white',
				fontWeight: 'bold',
			},
		},
		'& .notes-cell': {
			minWidth: '250px',
			maxWidth: '300px',
		},
		'& .status-cell': {
			textAlign: 'center',
		},
		'& .actions-cell': {
			textAlign: 'center',
			minWidth: '120px',
		},
	},
	tableContainer: {
		borderRadius: 2,
		boxShadow: (theme) => theme.shadows[3],
		marginBottom: 3,
	},
};
