import React, { useState, useEffect } from 'react';
import {
	Box,
	Button,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	IconButton,
	TextField,
	Typography,
	Select,
	MenuItem,
	FormControl,
	InputLabel,
	Grid,
	Card,
	CardContent,
	CardMedia,
	CardActions,
	Snackbar,
	Alert,
	Accordion,
	AccordionSummary,
	AccordionDetails,
	InputAdornment,
	FormHelperText,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import CategoryIcon from '@mui/icons-material/Category';
import SearchIcon from '@mui/icons-material/Search';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import config from '../config';

function ServiceManagement() {
	const [categories, setCategories] = useState([]);
	const [services, setServices] = useState([]);
	const [openServiceDialog, setOpenServiceDialog] = useState(false);
	const [openCategoryDialog, setOpenCategoryDialog] = useState(false);
	const [editingService, setEditingService] = useState(null);
	const [editingCategory, setEditingCategory] = useState(null);
	const [imagePreview, setImagePreview] = useState(null);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [deleteType, setDeleteType] = useState(''); // 'service' or 'category'
	const [snackbar, setSnackbar] = useState({
		open: false,
		message: '',
		severity: 'success', // 'success' | 'error'
	});

	const [serviceFormData, setServiceFormData] = useState({
		name: '',
		category: '',
		description: '',
		duration: '',
		price: '',
		image: null,
	});

	const [categoryFormData, setCategoryFormData] = useState({
		name: '',
		description: '',
		image: null,
	});

	const [searchQuery, setSearchQuery] = useState('');
	const [expandedCategories, setExpandedCategories] = useState(new Set());

	// Add validation state
	const [errors, setErrors] = useState({
		name: '',
		description: '',
		duration: '',
		price: '',
		category: '',
	});

	const handleSearch = (e) => {
		const query = e.target.value;
		setSearchQuery(query);

		if (!query) {
			setExpandedCategories(new Set());
			return;
		}

		const matchingCategories = new Set();
		const lowerQuery = query.toLowerCase();

		// First, find all services that match the search
		services.forEach((service) => {
			if (
				service?.name?.toLowerCase().includes(lowerQuery) ||
				service?.description?.toLowerCase().includes(lowerQuery)
			) {
				// Add the parent category to matching set
				const categoryId = service?.category?._id || service?.category;
				if (categoryId) {
					matchingCategories.add(categoryId.toString());
				}
			}
		});

		// Then, find categories that match the search
		categories.forEach((category) => {
			if (
				category?.name?.toLowerCase().includes(lowerQuery) ||
				category?.description?.toLowerCase().includes(lowerQuery)
			) {
				matchingCategories.add(category._id.toString());
			}
		});

		setExpandedCategories(matchingCategories);
	};

	// Fetch functions
	const fetchCategories = async () => {
		try {
			const response = await fetch(`${config.apiUrl}/api/categories`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setCategories(data);
			}
		} catch (error) {
			console.error('Error fetching categories:', error);
			setSnackbar({
				open: true,
				message: 'Error fetching categories',
				severity: 'error',
			});
		}
	};

	const fetchServices = async () => {
		try {
			const response = await fetch(`${config.apiUrl}/api/services`, {
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});
			if (response.ok) {
				const data = await response.json();
				setServices(data);
			}
		} catch (error) {
			console.error('Error fetching services:', error);
			setSnackbar({
				open: true,
				message: 'Error fetching services',
				severity: 'error',
			});
		}
	};

	useEffect(() => {
		fetchCategories();
		fetchServices();
	}, []);

	// Add these handler functions
	const handleEditCategory = (category) => {
		setEditingCategory(category);
		setCategoryFormData({
			name: category.name,
			description: category.description,
			image: null,
		});
		setImagePreview(category.image?.data || null);
		setOpenCategoryDialog(true);
	};

	const handleDeleteCategory = (category) => {
		handleDeleteClick(category._id, 'category', category.name);
	};

	const handleDeleteClick = (id, type, name) => {
		setItemToDelete({ id, name });
		setDeleteType(type);
		setDeleteDialogOpen(true);
	};

	const handleDeleteConfirm = async () => {
		try {
			const url =
				deleteType === 'service'
					? `${config.apiUrl}/api/services/${itemToDelete.id}`
					: `${config.apiUrl}/api/categories/${itemToDelete.id}`;

			const response = await fetch(url, {
				method: 'DELETE',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
			});

			if (response.ok) {
				if (deleteType === 'service') {
					fetchServices();
				} else {
					fetchCategories();
					fetchServices();
				}
				setDeleteDialogOpen(false);
				setItemToDelete(null);
				setSnackbar({
					open: true,
					message: `${deleteType} deleted successfully`,
					severity: 'success',
				});
			} else {
				const error = await response.json();
				setSnackbar({
					open: true,
					message: error.message || `Error deleting ${deleteType}`,
					severity: 'error',
				});
			}
		} catch (error) {
			console.error(`Error deleting ${deleteType}:`, error);
			setSnackbar({
				open: true,
				message: `Error deleting ${deleteType}`,
				severity: 'error',
			});
		}
	};

	const handleEditService = (service) => {
		setEditingService(service);
		setServiceFormData({
			name: service.name,
			category: service.category._id || service.category,
			description: service.description,
			duration: service.duration,
			price: service.price,
			image: null,
		});
		setImagePreview(service.image?.url || null);
		setOpenServiceDialog(true);
	};

	const handleImageChange = (event) => {
		const file = event.target.files[0];
		if (file) {
			setServiceFormData((prev) => ({
				...prev,
				image: file,
			}));

			// Create preview URL
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	const handleCategoryImageChange = (event) => {
		const file = event.target.files[0];
		if (file) {
			setCategoryFormData((prev) => ({
				...prev,
				image: file,
			}));

			// Create preview URL
			const reader = new FileReader();
			reader.onloadend = () => {
				setImagePreview(reader.result);
			};
			reader.readAsDataURL(file);
		}
	};

	useEffect(() => {
		return () => {
			// Cleanup preview URL when component unmounts
			if (imagePreview) {
				URL.revokeObjectURL(imagePreview);
			}
		};
	}, [imagePreview]);

	// Add validation function
	const validateForm = () => {
		const newErrors = {};
		let isValid = true;

		// Validate name
		if (!serviceFormData.name.trim()) {
			newErrors.name = 'Service name is required';
			isValid = false;
		} else if (serviceFormData.name.length < 3) {
			newErrors.name = 'Service name must be at least 3 characters';
			isValid = false;
		}

		// Validate category
		if (!serviceFormData.category) {
			newErrors.category = 'Category is required';
			isValid = false;
		}

		// Description is optional, only validate length if provided
		if (
			serviceFormData.description.trim() &&
			serviceFormData.description.length < 10
		) {
			newErrors.description =
				'Description must be at least 10 characters if provided';
			isValid = false;
		}

		// Validate duration - changed minimum to 5 minutes
		const duration = Number(serviceFormData.duration);
		if (!duration) {
			newErrors.duration = 'Duration is required';
			isValid = false;
		} else if (duration < 5) {
			newErrors.duration = 'Minimum duration is 5 minutes';
			isValid = false;
		} else if (duration > 240) {
			newErrors.duration = 'Maximum duration is 240 minutes';
			isValid = false;
		}

		// Validate price
		const price = Number(serviceFormData.price);
		if (!price) {
			newErrors.price = 'Price is required';
			isValid = false;
		} else if (price <= 0) {
			newErrors.price = 'Price must be greater than 0';
			isValid = false;
		} else if (price > 10000) {
			newErrors.price = 'Maximum price is RM 10,000';
			isValid = false;
		}

		setErrors(newErrors);
		return isValid;
	};

	// Update handleServiceSubmit
	const handleServiceSubmit = async () => {
		if (!validateForm()) {
			return;
		}

		try {
			const formData = new FormData();
			Object.keys(serviceFormData).forEach((key) => {
				if (serviceFormData[key] !== null) {
					formData.append(key, serviceFormData[key]);
				}
			});

			const url = editingService
				? `${config.apiUrl}/api/services/${editingService._id}`
				: `${config.apiUrl}/api/services`;

			const response = await fetch(url, {
				method: editingService ? 'PUT' : 'POST',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				body: formData,
			});

			if (response.ok) {
				setOpenServiceDialog(false);
				setEditingService(null);
				setServiceFormData({
					name: '',
					category: '',
					description: '',
					duration: '',
					price: '',
					image: null,
				});
				fetchServices();
				setSnackbar({
					open: true,
					message: `Service ${
						editingService ? 'updated' : 'created'
					} successfully`,
					severity: 'success',
				});
			} else {
				const error = await response.json();
				setSnackbar({
					open: true,
					message: error.message || 'Error submitting service',
					severity: 'error',
				});
			}
		} catch (error) {
			console.error('Error submitting service:', error);
			setSnackbar({
				open: true,
				message: 'Error submitting service',
				severity: 'error',
			});
		}
	};

	const handleCategorySubmit = async () => {
		try {
			const formData = new FormData();
			Object.keys(categoryFormData).forEach((key) => {
				if (categoryFormData[key] !== null) {
					formData.append(key, categoryFormData[key]);
				}
			});

			const url = editingCategory
				? `${config.apiUrl}/api/categories/${editingCategory._id}`
				: `${config.apiUrl}/api/categories`;

			const response = await fetch(url, {
				method: editingCategory ? 'PUT' : 'POST',
				headers: {
					Authorization: `Bearer ${localStorage.getItem('token')}`,
				},
				body: formData,
			});

			if (response.ok) {
				setOpenCategoryDialog(false);
				setEditingCategory(null);
				setCategoryFormData({
					name: '',
					description: '',
					image: null,
				});
				setImagePreview(null);
				fetchCategories();
				setSnackbar({
					open: true,
					message: `Category ${
						editingCategory ? 'updated' : 'created'
					} successfully`,
					severity: 'success',
				});
			} else {
				const error = await response.json();
				setSnackbar({
					open: true,
					message: error.message || 'Error submitting category',
					severity: 'error',
				});
			}
		} catch (error) {
			console.error('Error submitting category:', error);
			setSnackbar({
				open: true,
				message: 'Error submitting category',
				severity: 'error',
			});
		}
	};

	const handleSnackbarClose = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	// Render the categories and their services
	return (
		<Box sx={{ p: 3 }}>
			<Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
				{/* Header and Buttons */}
				<Box
					sx={{
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center',
					}}
				>
					<Typography variant="h5">Service Management</Typography>
					<Box sx={{ display: 'flex', gap: 2 }}>
						<Button
							variant="contained"
							startIcon={<CategoryIcon />}
							onClick={() => {
								setEditingCategory(null);
								setCategoryFormData({ name: '', description: '' });
								setOpenCategoryDialog(true);
							}}
						>
							Add Category
						</Button>
						<Button
							variant="contained"
							startIcon={<AddIcon />}
							onClick={() => {
								setEditingService(null);
								setServiceFormData({
									name: '',
									category: '',
									description: '',
									duration: '',
									price: '',
									image: null,
								});
								setImagePreview(null);
								setOpenServiceDialog(true);
							}}
						>
							Add Service
						</Button>
					</Box>
				</Box>

				{/* Search Bar */}
				<TextField
					fullWidth
					variant="outlined"
					placeholder="Search categories and services..."
					value={searchQuery}
					onChange={handleSearch}
					InputProps={{
						startAdornment: (
							<InputAdornment position="start">
								<SearchIcon />
							</InputAdornment>
						),
					}}
					sx={{ mb: 2 }}
				/>

				{/* Categories and Services */}
				{categories.map((category) => {
					if (!category?._id) return null;

					// Get services for this category
					const categoryServices = services.filter(
						(service) =>
							service?.category?._id?.toString() === category._id.toString() ||
							service?.category?.toString() === category._id.toString()
					);

					// If there's a search query, filter services
					const displayServices = searchQuery
						? categoryServices.filter((service) => {
								const lowerQuery = searchQuery.toLowerCase();

								// Show service if either:
								// 1. The service matches the search
								// 2. The category matches the search and it's the parent category
								return (
									service?.name?.toLowerCase().includes(lowerQuery) ||
									service?.description?.toLowerCase().includes(lowerQuery) ||
									category.name?.toLowerCase().includes(lowerQuery) ||
									category.description?.toLowerCase().includes(lowerQuery)
								);
						  })
						: categoryServices;

					// Only show categories that have matching services or match the search themselves
					if (
						searchQuery &&
						!displayServices.length &&
						!category.name?.toLowerCase().includes(searchQuery.toLowerCase()) &&
						!category.description
							?.toLowerCase()
							.includes(searchQuery.toLowerCase())
					) {
						return null;
					}

					return (
						<Accordion
							key={category._id}
							expanded={expandedCategories.has(category._id.toString())}
							onChange={() => {
								const newExpanded = new Set(expandedCategories);
								if (newExpanded.has(category._id.toString())) {
									newExpanded.delete(category._id.toString());
								} else {
									newExpanded.add(category._id.toString());
								}
								setExpandedCategories(newExpanded);
							}}
						>
							<AccordionSummary
								expandIcon={<ExpandMoreIcon />}
								sx={{
									'& .MuiAccordionSummary-content': {
										display: 'flex',
										justifyContent: 'space-between',
										alignItems: 'center',
									},
								}}
							>
								<Box
									sx={{
										display: 'flex',
										alignItems: 'center',
										gap: 2,
									}}
								>
									{/* Category Image */}
									<Box
										sx={{
											width: 40,
											height: 40,
											borderRadius: 1,
											overflow: 'hidden',
											flexShrink: 0,
											bgcolor: 'grey.100',
										}}
									>
										<img
											src={category.image?.data || '/placeholder-image.jpg'}
											alt={category.name}
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'cover',
											}}
										/>
									</Box>
									{/* Category Name */}
									<Typography variant="h6">{category.name}</Typography>
								</Box>

								{/* Action Buttons */}
								<Box
									sx={{
										display: 'flex',
										gap: 1,
										'& button': {
											'&:hover': { backgroundColor: 'rgba(0, 0, 0, 0.04)' },
										},
									}}
								>
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											handleEditCategory(category);
										}}
										sx={{ color: 'primary.main' }}
									>
										<EditIcon fontSize="small" />
									</IconButton>
									<IconButton
										size="small"
										onClick={(e) => {
											e.stopPropagation();
											handleDeleteCategory(category);
										}}
										sx={{ color: 'error.main' }}
									>
										<DeleteIcon fontSize="small" />
									</IconButton>
								</Box>
							</AccordionSummary>
							<AccordionDetails>
								<Grid container spacing={2}>
									{displayServices.map((service) => (
										<Grid item xs={12} sm={6} md={4} key={service._id}>
											<Card>
												<CardMedia
													component="img"
													height="140"
													image={
														service.image?.data || '/placeholder-image.jpg'
													}
													alt={service.name}
													sx={{ objectFit: 'cover' }}
												/>
												<CardContent>
													<Typography variant="h6">{service.name}</Typography>
													<Typography variant="body2" color="text.secondary">
														{service.description}
													</Typography>
													<Typography variant="body2">
														Duration: {service.duration} minutes
													</Typography>
													<Typography variant="body2">
														Price: RM {service.price}
													</Typography>
												</CardContent>
												<CardActions>
													<IconButton
														onClick={() => handleEditService(service)}
													>
														<EditIcon />
													</IconButton>
													<IconButton
														onClick={() =>
															handleDeleteClick(
																service._id,
																'service',
																service.name
															)
														}
													>
														<DeleteIcon />
													</IconButton>
												</CardActions>
											</Card>
										</Grid>
									))}
								</Grid>
							</AccordionDetails>
						</Accordion>
					);
				})}
			</Box>

			{/* Service Dialog */}
			<Dialog
				open={openServiceDialog}
				onClose={() => setOpenServiceDialog(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					{editingService ? 'Edit Service' : 'Add New Service'}
				</DialogTitle>
				<DialogContent>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
						<FormControl fullWidth error={!!errors.category}>
							<InputLabel>Category</InputLabel>
							<Select
								value={serviceFormData.category}
								onChange={(e) => {
									setServiceFormData({
										...serviceFormData,
										category: e.target.value,
									});
									setErrors({ ...errors, category: '' });
								}}
								label="Category"
								required
							>
								{categories.map((category) => (
									<MenuItem key={category._id} value={category._id}>
										{category.name}
									</MenuItem>
								))}
							</Select>
							{errors.category && (
								<FormHelperText error>{errors.category}</FormHelperText>
							)}
						</FormControl>

						<TextField
							label="Service Name"
							value={serviceFormData.name}
							onChange={(e) => {
								setServiceFormData({
									...serviceFormData,
									name: e.target.value,
								});
								setErrors({ ...errors, name: '' });
							}}
							fullWidth
							required
							error={!!errors.name}
							helperText={errors.name}
						/>

						<TextField
							label="Description (Optional)"
							value={serviceFormData.description}
							onChange={(e) => {
								setServiceFormData({
									...serviceFormData,
									description: e.target.value,
								});
								setErrors({ ...errors, description: '' });
							}}
							fullWidth
							multiline
							rows={3}
							error={!!errors.description}
							helperText={
								errors.description ||
								'Optional: Minimum 10 characters if provided'
							}
						/>

						<TextField
							label="Duration (minutes)"
							value={serviceFormData.duration}
							onChange={(e) => {
								setServiceFormData({
									...serviceFormData,
									duration: e.target.value,
								});
								setErrors({ ...errors, duration: '' });
							}}
							type="number"
							fullWidth
							required
							error={!!errors.duration}
							helperText={
								errors.duration || 'Minimum: 5 minutes, Maximum: 240 minutes'
							}
							InputProps={{
								inputProps: { min: 5, max: 240 },
							}}
						/>

						<TextField
							label="Price (MYR)"
							value={serviceFormData.price}
							onChange={(e) => {
								setServiceFormData({
									...serviceFormData,
									price: e.target.value,
								});
								setErrors({ ...errors, price: '' });
							}}
							type="number"
							fullWidth
							required
							error={!!errors.price}
							helperText={errors.price || 'Maximum: RM 10,000'}
							InputProps={{
								inputProps: { min: 0, max: 10000 },
								startAdornment: (
									<InputAdornment position="start">RM</InputAdornment>
								),
							}}
						/>

						<Box sx={{ mt: 2 }}>
							<input
								type="file"
								accept="image/*"
								onChange={handleImageChange}
								style={{ display: 'none' }}
								id="service-image"
							/>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: 2,
									alignItems: 'center',
								}}
							>
								{/* Image Preview */}
								{(imagePreview ||
									(editingService && editingService.image?.url)) && (
									<Box
										sx={{
											width: '100%',
											height: 200,
											position: 'relative',
											borderRadius: 1,
											overflow: 'hidden',
											mb: 2,
										}}
									>
										<img
											src={imagePreview || editingService?.image?.url}
											alt="Service preview"
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'cover',
											}}
										/>
										<IconButton
											sx={{
												position: 'absolute',
												top: 8,
												right: 8,
												bgcolor: 'rgba(255, 255, 255, 0.8)',
												'&:hover': {
													bgcolor: 'rgba(255, 255, 255, 0.9)',
												},
											}}
											onClick={() => {
												setImagePreview(null);
												setServiceFormData((prev) => ({
													...prev,
													image: null,
												}));
											}}
										>
											<DeleteIcon />
										</IconButton>
									</Box>
								)}

								{/* Upload Button */}
								<label htmlFor="service-image">
									<Button
										variant="outlined"
										component="span"
										startIcon={imagePreview ? <EditIcon /> : <AddIcon />}
									>
										{imagePreview ? 'Change Image' : 'Upload Image'}
									</Button>
								</label>

								{/* Upload Status */}
								{serviceFormData.image && !imagePreview && (
									<Typography variant="caption" color="text.secondary">
										Loading preview...
									</Typography>
								)}
								{imagePreview && (
									<Typography variant="caption" color="success.main">
										Image uploaded successfully
									</Typography>
								)}
							</Box>
						</Box>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenServiceDialog(false)}>Cancel</Button>
					<Button
						onClick={handleServiceSubmit}
						variant="contained"
						disabled={Object.keys(errors).some((key) => errors[key])}
					>
						{editingService ? 'Update' : 'Add'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Category Dialog */}
			<Dialog
				open={openCategoryDialog}
				onClose={() => setOpenCategoryDialog(false)}
				maxWidth="sm"
				fullWidth
			>
				<DialogTitle>
					{editingCategory ? 'Edit Category' : 'Add New Category'}
				</DialogTitle>
				<DialogContent>
					<Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 2 }}>
						<TextField
							label="Category Name"
							value={categoryFormData.name}
							onChange={(e) =>
								setCategoryFormData({
									...categoryFormData,
									name: e.target.value,
								})
							}
							fullWidth
							required
						/>
						<TextField
							label="Description"
							value={categoryFormData.description}
							onChange={(e) =>
								setCategoryFormData({
									...categoryFormData,
									description: e.target.value,
								})
							}
							fullWidth
							multiline
							rows={3}
						/>
						<Box sx={{ mt: 2 }}>
							<input
								type="file"
								accept="image/*"
								onChange={handleCategoryImageChange}
								style={{ display: 'none' }}
								id="category-image"
							/>
							<Box
								sx={{
									display: 'flex',
									flexDirection: 'column',
									gap: 2,
									alignItems: 'center',
								}}
							>
								{/* Image Preview */}
								{(imagePreview ||
									(editingCategory && editingCategory.image?.data)) && (
									<Box
										sx={{
											width: '100%',
											height: 200,
											position: 'relative',
											borderRadius: 1,
											overflow: 'hidden',
											mb: 2,
										}}
									>
										<img
											src={imagePreview || editingCategory?.image?.data}
											alt="Category preview"
											style={{
												width: '100%',
												height: '100%',
												objectFit: 'cover',
											}}
										/>
										<IconButton
											sx={{
												position: 'absolute',
												top: 8,
												right: 8,
												bgcolor: 'rgba(255, 255, 255, 0.8)',
												'&:hover': {
													bgcolor: 'rgba(255, 255, 255, 0.9)',
												},
											}}
											onClick={() => {
												setImagePreview(null);
												setCategoryFormData((prev) => ({
													...prev,
													image: null,
												}));
											}}
										>
											<DeleteIcon />
										</IconButton>
									</Box>
								)}

								{/* Upload Button */}
								<label htmlFor="category-image">
									<Button
										variant="outlined"
										component="span"
										startIcon={imagePreview ? <EditIcon /> : <AddIcon />}
									>
										{imagePreview ? 'Change Image' : 'Upload Image'}
									</Button>
								</label>
							</Box>
						</Box>
					</Box>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenCategoryDialog(false)}>Cancel</Button>
					<Button onClick={handleCategorySubmit} variant="contained">
						{editingCategory ? 'Update' : 'Add'}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Delete Confirmation Dialog */}
			<Dialog
				open={deleteDialogOpen}
				onClose={() => setDeleteDialogOpen(false)}
				maxWidth="xs"
				fullWidth
			>
				<DialogTitle>Confirm Delete</DialogTitle>
				<DialogContent>
					<Typography>
						Are you sure you want to delete this {deleteType}:{' '}
						<strong>{itemToDelete?.name}</strong>?
						{deleteType === 'category' && (
							<Typography color="error" sx={{ mt: 1 }}>
								Warning: Deleting a category will affect all services in this
								category.
							</Typography>
						)}
					</Typography>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setDeleteDialogOpen(false)}>Cancel</Button>
					<Button
						onClick={handleDeleteConfirm}
						variant="contained"
						color="error"
					>
						Delete
					</Button>
				</DialogActions>
			</Dialog>

			{/* Snackbar for success/error messages */}
			<Snackbar
				open={snackbar.open}
				autoHideDuration={6000}
				onClose={handleSnackbarClose}
				anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
			>
				<Alert
					onClose={handleSnackbarClose}
					severity={snackbar.severity}
					variant="filled"
					sx={{ width: '100%' }}
				>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</Box>
	);
}

export default ServiceManagement;
