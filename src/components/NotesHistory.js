import React from 'react';
import { Box, Typography, Divider, Paper } from '@mui/material';
import { format, isValid } from 'date-fns';

function NotesHistory({ notes }) {
	if (!notes || notes.length === 0) {
		return <Typography color="text.secondary">No notes available</Typography>;
	}

	const formatDate = (dateString) => {
		try {
			const date = new Date(dateString);
			return isValid(date) ? format(date, 'PPpp') : 'Date not available';
		} catch (error) {
			return 'Date not available';
		}
	};

	return (
		<Paper
			variant="outlined"
			sx={{ p: 1, maxHeight: '200px', overflowY: 'auto' }}
		>
			{notes.map((note, index) => (
				<Box key={note._id || index} sx={{ mb: 1 }}>
					<Typography
						variant="caption"
						color="text.secondary"
						sx={{
							display: 'block',
							fontWeight: 'medium',
						}}
					>
						{formatDate(note.createdAt)}
					</Typography>
					<Typography
						variant="caption"
						sx={{
							display: 'block',
							color: 'primary.main',
							mb: 0.5,
						}}
					>
						By: {note.addedBy} ({note.type})
					</Typography>
					<Typography
						variant="body2"
						sx={{
							whiteSpace: 'pre-wrap',
							wordBreak: 'break-word',
						}}
					>
						{note.content || 'No content available'}
					</Typography>
					{index < notes.length - 1 && <Divider sx={{ my: 1 }} />}
				</Box>
			))}
		</Paper>
	);
}

export default NotesHistory;
