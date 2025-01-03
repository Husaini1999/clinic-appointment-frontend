import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
	Container,
	Typography,
	Box,
	Grid,
	Card,
	CardMedia,
	CardContent,
	IconButton,
	Button,
	Modal,
	Fade,
	Backdrop,
} from '@mui/material';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import CloseIcon from '@mui/icons-material/Close';
import BookingModal from './Booking';
import config from '../config';

function CategoryServices() {
	const { categoryId } = useParams();
	const navigate = useNavigate();
	const [category, setCategory] = useState(null);
	const [services, setServices] = useState([]);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState(null);
	const [openBooking, setOpenBooking] = useState(false);
	const [selectedService, setSelectedService] = useState(null);
	const [openImagePreview, setOpenImagePreview] = useState(false);
	const [selectedImage, setSelectedImage] = useState(null);

	useEffect(() => {
		const fetchCategoryAndServices = async () => {
			try {
				setLoading(true);

				// Fetch category details
				const categoryResponse = await fetch(
					`${config.apiUrl}/api/categories/${categoryId}`
				);
				if (!categoryResponse.ok) {
					throw new Error('Category not found');
				}
				const categoryData = await categoryResponse.json();
				setCategory(categoryData);

				// Fetch services for this category using the new endpoint
				const servicesResponse = await fetch(
					`${config.apiUrl}/api/services/category/${categoryId}`
				);
				const servicesData = await servicesResponse.json();
				setServices(servicesData);
			} catch (error) {
				console.error('Error fetching data:', error);
				setError(error.message);
			} finally {
				setLoading(false);
			}
		};

		if (categoryId) {
			fetchCategoryAndServices();
		}
	}, [categoryId]);

	const handleBookNow = (service) => {
		setSelectedService(service);
		setOpenBooking(true);
	};

	const handleImageClick = (imageUrl) => {
		setSelectedImage(imageUrl);
		setOpenImagePreview(true);
	};

	const handleClosePreview = () => {
		setOpenImagePreview(false);
		setSelectedImage(null);
	};

	if (loading) {
		return (
			<Container>
				<Typography>Loading...</Typography>
			</Container>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Box sx={{ mb: 4, display: 'flex', alignItems: 'center' }}>
				<IconButton onClick={() => navigate(-1)} sx={{ mr: 2 }}>
					<ArrowBackIcon />
				</IconButton>
				<Typography variant="h4" component="h1">
					{category?.name} Services
				</Typography>
			</Box>

			{services.length === 0 ? (
				<Typography variant="h6" color="text.secondary" sx={{ mt: 4 }}>
					No services found for this category.
				</Typography>
			) : (
				<Grid container spacing={3}>
					{services.map((service) => (
						<Grid item xs={12} sm={6} md={4} key={service._id}>
							<Card
								sx={{
									height: '100%',
									display: 'flex',
									flexDirection: 'column',
									transition: 'transform 0.2s ease-in-out',
									'&:hover': {
										transform: 'translateY(-5px)',
										boxShadow: (theme) => theme.shadows[4],
									},
								}}
							>
								<CardMedia
									component="img"
									height="200"
									image={service.image?.data || '/placeholder-image.jpg'}
									alt={service.name}
									sx={{
										objectFit: 'cover',
										cursor: 'pointer',
										'&:hover': {
											opacity: 0.9,
										},
									}}
									onClick={() =>
										handleImageClick(
											service.image?.data || '/placeholder-image.jpg'
										)
									}
								/>
								<CardContent sx={{ flexGrow: 1 }}>
									<Typography gutterBottom variant="h6" component="h2">
										{service.name}
									</Typography>
									<Typography
										variant="body2"
										color="text.secondary"
										sx={{ mb: 2 }}
									>
										{service.description}
									</Typography>
									<Box
										sx={{
											display: 'flex',
											justifyContent: 'space-between',
											alignItems: 'center',
											mt: 'auto',
										}}
									>
										<Typography variant="h6" color="primary">
											RM {service.price}
										</Typography>
										<Typography variant="body2" color="text.secondary">
											{service.duration} mins
										</Typography>
									</Box>
									<Button
										variant="contained"
										fullWidth
										sx={{
											mt: 2,
											bgcolor: 'secondary.main',
											'&:hover': {
												bgcolor: 'secondary.dark',
											},
										}}
										onClick={() => handleBookNow(service)}
									>
										Book Now
									</Button>
								</CardContent>
							</Card>
						</Grid>
					))}
				</Grid>
			)}

			<Modal
				open={openImagePreview}
				onClose={handleClosePreview}
				closeAfterTransition
				BackdropComponent={Backdrop}
				BackdropProps={{
					timeout: 500,
				}}
				sx={{
					display: 'flex',
					alignItems: 'center',
					justifyContent: 'center',
				}}
			>
				<Fade in={openImagePreview}>
					<Box
						sx={{
							position: 'relative',
							maxWidth: '90vw',
							maxHeight: '90vh',
							bgcolor: 'background.paper',
							borderRadius: 1,
							boxShadow: 24,
							p: 1,
						}}
					>
						<IconButton
							onClick={handleClosePreview}
							sx={{
								position: 'absolute',
								right: 8,
								top: 8,
								bgcolor: 'rgba(0, 0, 0, 0.5)',
								color: 'white',
								'&:hover': {
									bgcolor: 'rgba(0, 0, 0, 0.7)',
								},
								zIndex: 1,
							}}
						>
							<CloseIcon />
						</IconButton>
						<img
							src={selectedImage}
							alt="Service preview"
							style={{
								maxWidth: '100%',
								maxHeight: '85vh',
								display: 'block',
								objectFit: 'contain',
							}}
						/>
					</Box>
				</Fade>
			</Modal>

			<BookingModal
				open={openBooking}
				onClose={() => setOpenBooking(false)}
				initialCategory={category}
				initialService={selectedService}
			/>
		</Container>
	);
}

export default CategoryServices;
