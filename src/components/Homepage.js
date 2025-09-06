import React, { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import {
	Container,
	Typography,
	Box,
	Grid,
	Paper,
	Button,
	IconButton,
	TextField,
	InputAdornment,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import BookingModal from './Booking';
import Chatbot from './Chatbot';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import config from '../config';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';

function Homepage() {
	const location = useLocation();
	const [openBooking, setOpenBooking] = useState(false);
	const [categories, setCategories] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [visibleCategories, setVisibleCategories] = useState(6);
	const navigate = useNavigate();

	useEffect(() => {
		if (location.state?.scrollTo) {
			const element = document.getElementById(location.state.scrollTo);
			if (element) {
				element.scrollIntoView({ behavior: 'smooth' });
			}
		}
	}, [location]);

	useEffect(() => {
		const fetchCategories = async () => {
			try {
				const response = await fetch(`${config.apiUrl}/api/categories`);
				const data = await response.json();
				setCategories(data);
			} catch (error) {
				console.error('Error fetching categories:', error);
			}
		};
		fetchCategories();
	}, []);

	const handleBookingClick = () => {
		setOpenBooking(true);
	};

	const filteredCategories = categories.filter(
		(category) =>
			category.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
			category.description?.toLowerCase().includes(searchTerm.toLowerCase())
	);

	const handleLoadMore = () => {
		setVisibleCategories((prev) => prev + 6);
	};

	return (
		<Box sx={{ overflow: 'auto' }}>
			{/* Hero Section */}
			<Box
				id="home"
				sx={{
					position: 'relative',
					minHeight: '95vh',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					background: 'linear-gradient(135deg, #000000 0%, #1A1A1A 100%)',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'url(/hero-bg.jpg) center/cover',
						opacity: 0.1,
						zIndex: 1,
					},
				}}
			>
				<Container
					maxWidth="md"
					sx={{
						position: 'relative',
						zIndex: 2,
						textAlign: 'center',
						py: { xs: 10, md: 16 },
					}}
				>
					<Typography
						variant="h1"
						component="h1"
						gutterBottom
						sx={{
							fontSize: { xs: '2.75rem', sm: '3.5rem', md: '4.5rem' },
							fontWeight: 800,
							color: 'white',
							textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
							mb: 4,
							lineHeight: 1.1,
							letterSpacing: '-0.02em',
						}}
					>
						Welcome to <br />
						<Box
							component="span"
							sx={{
								color: 'secondary.main',
								display: 'block',
								mt: 2,
							}}
						>
							Sunrise Medical Center
						</Box>
					</Typography>
					<Typography
						variant="h5"
						sx={{
							fontSize: { xs: '1.25rem', md: '1.75rem' },
							mb: 8,
							color: 'rgba(255,255,255,0.9)',
							fontWeight: 300,
							maxWidth: '800px',
							mx: 'auto',
							lineHeight: 1.8,
							letterSpacing: '0.01em',
						}}
					>
						Your Health is Our Priority. Experience compassionate care with our
						team of dedicated healthcare professionals.
					</Typography>
					<Box
						sx={{
							display: 'flex',
							gap: 4,
							justifyContent: 'center',
							flexWrap: 'wrap',
						}}
					>
						<Button
							variant="contained"
							color="secondary"
							size="large"
							sx={{
								py: 2,
								px: 6,
								fontSize: '1.1rem',
								fontWeight: 600,
								borderRadius: '50px',
								'&:hover': {
									transform: 'translateY(-3px)',
									boxShadow: '0 6px 20px rgba(220,38,38,0.4)',
								},
							}}
							onClick={handleBookingClick}
						>
							Book Appointment
						</Button>
						<Button
							variant="outlined"
							color="inherit"
							size="large"
							sx={{
								py: 2,
								px: 6,
								fontSize: '1.1rem',
								fontWeight: 600,
								borderRadius: '50px',
								borderColor: 'rgba(255,255,255,0.5)',
								color: 'white',
								'&:hover': {
									borderColor: 'white',
									backgroundColor: 'rgba(255,255,255,0.1)',
								},
							}}
							onClick={() =>
								document
									.getElementById('services')
									.scrollIntoView({ behavior: 'smooth' })
							}
						>
							Our Services
						</Button>
					</Box>
				</Container>
				<IconButton
					sx={{
						position: 'absolute',
						bottom: 40,
						left: '50%',
						transform: 'translateX(-50%)',
						color: 'white',
						zIndex: 2,
						animation: 'bounce 2s infinite',
						'@keyframes bounce': {
							'0%, 100%': {
								transform: 'translateX(-50%) translateY(0)',
							},
							'50%': {
								transform: 'translateX(-50%) translateY(10px)',
							},
						},
					}}
					onClick={() =>
						document
							.getElementById('services')
							.scrollIntoView({ behavior: 'smooth' })
					}
				>
					<KeyboardArrowDownIcon sx={{ fontSize: 48 }} />
				</IconButton>
			</Box>

			{/* About Us Section */}
			<Box
				id="about"
				sx={{
					py: { xs: 6, md: 10 },
					bgcolor: '#ffffff',
					position: 'relative',
					borderBottom: '1px solid',
					borderColor: 'grey.100',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: '8px',
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.03) 0%, transparent 100%)',
					},
				}}
			>
				<Container maxWidth="lg">
					<Typography
						variant="h2"
						component="h2"
						gutterBottom
						align="center"
						sx={{
							fontSize: { xs: '2.5rem', md: '3.5rem' },
							mb: 5,
							color: '#000000',
							fontWeight: 700,
							letterSpacing: '-0.02em',
						}}
					>
						About Us
					</Typography>
					<Box
						sx={{
							mb: 4,
							textAlign: 'center',
							maxWidth: '900px',
							mx: 'auto',
						}}
					>
						<HealthAndSafetyIcon
							sx={{
								fontSize: 72,
								color: 'secondary.main',
								mb: 4,
							}}
						/>
						<Typography
							variant="body1"
							paragraph
							sx={{
								lineHeight: 1.8,
								fontSize: '1.125rem',
								color: 'text.primary',
								mb: 3,
							}}
						>
							Welcome to Sunrise Medical Center! Our mission is to provide
							compassionate and high-quality healthcare to our community. We
							believe in treating our patients with respect and dignity,
							ensuring that they receive the best possible care.
						</Typography>
						<Typography
							variant="body1"
							paragraph
							sx={{
								lineHeight: 1.8,
								fontSize: '1.125rem',
								color: 'text.primary',
								mb: 3,
							}}
						>
							Our team of dedicated healthcare professionals is committed to
							your health and well-being. With years of experience in various
							medical fields, we are here to support you and your family with
							all your healthcare needs.
						</Typography>
						<Typography
							variant="body1"
							paragraph
							sx={{
								lineHeight: 1.8,
								fontSize: '1.125rem',
								color: 'text.primary',
								mb: 3,
							}}
						>
							At Primer Clinic, we offer a wide range of services, including
							general checkups, dental care, physiotherapy, and more. We strive
							to create a welcoming environment where you can feel comfortable
							and cared for.
						</Typography>
						<Button
							variant="text"
							color="secondary"
							size="large"
							sx={{
								mt: 4,
								py: 2,
								px: 4,
								fontSize: '1rem',
								fontWeight: 600,
							}}
							onClick={() =>
								document
									.getElementById('services')
									.scrollIntoView({ behavior: 'smooth' })
							}
						>
							Explore Our Services
						</Button>
					</Box>
				</Container>
			</Box>

			{/* Services Section */}
			<Box
				id="services"
				sx={{
					py: { xs: 6, md: 10 },
					bgcolor: '#f8f9fa',
					position: 'relative',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: '8px',
						background:
							'linear-gradient(180deg, rgba(0,0,0,0.03) 0%, transparent 100%)',
					},
				}}
			>
				<Container maxWidth="lg">
					<Typography
						variant="h2"
						component="h2"
						gutterBottom
						align="center"
						sx={{
							fontSize: { xs: '2.5rem', md: '3.5rem' },
							mb: 2,
							color: '#000000',
							fontWeight: 700,
							letterSpacing: '-0.02em',
						}}
					>
						Our Services
					</Typography>

					{/* Search Bar */}
					<Box
						sx={{
							mb: 5,
							mt: 2,
							display: 'flex',
							justifyContent: 'center',
							maxWidth: '600px',
							mx: 'auto',
						}}
					>
						<TextField
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search services..."
							variant="outlined"
							fullWidth
							sx={{
								backgroundColor: 'white',
								borderRadius: 2,
								'& .MuiOutlinedInput-root': {
									fontSize: '1.1rem',
									py: 1,
									'&:hover fieldset': {
										borderColor: 'grey.400',
									},
								},
							}}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon sx={{ color: 'grey.600' }} />
									</InputAdornment>
								),
							}}
						/>
					</Box>

					<Grid container spacing={4}>
						{filteredCategories
							.slice(0, visibleCategories)
							.map((category, index) => (
								<Grid item xs={12} sm={6} md={4} key={category._id}>
									<motion.div
										initial={{ opacity: 0, y: 20 }}
										animate={{ opacity: 1, y: 0 }}
										transition={{
											duration: 0.5,
											delay: index * 0.1, // Stagger effect
											ease: 'easeOut',
										}}
									>
										<Paper
											sx={{
												p: 3,
												height: '100%',
												cursor: 'pointer',
												transition: 'all 0.3s ease',
												'&:hover': {
													transform: 'translateY(-5px)',
													boxShadow: '0 8px 24px rgba(0,0,0,0.12)',
												},
											}}
											onClick={() => navigate(`/category/${category._id}`)}
										>
											{category.image?.data ? (
												<Box
													component="img"
													src={category.image.data}
													alt={category.name}
													sx={{
														width: '100%',
														height: 200,
														objectFit: 'cover',
														borderRadius: 1,
														mb: 2,
													}}
												/>
											) : (
												<Box
													sx={{
														width: '100%',
														height: 200,
														bgcolor: 'primary.light',
														borderRadius: 1,
														mb: 2,
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
													}}
												>
													<HealthAndSafetyIcon
														sx={{ fontSize: 60, color: 'white' }}
													/>
												</Box>
											)}
											<Typography
												variant="h5"
												gutterBottom
												sx={{
													fontWeight: 600,
													color: 'primary.main',
													mb: 2,
												}}
											>
												{category.name}
											</Typography>
											<Typography
												color="text.secondary"
												sx={{ lineHeight: 1.7 }}
											>
												{category.description}
											</Typography>
										</Paper>
									</motion.div>
								</Grid>
							))}
					</Grid>

					{/* Load More Button */}
					{filteredCategories.length > visibleCategories && (
						<Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
							<Button
								variant="outlined"
								color="primary"
								onClick={handleLoadMore}
								sx={{
									py: 1,
									px: 4,
									borderRadius: '50px',
									'&:hover': {
										transform: 'translateY(-2px)',
									},
								}}
							>
								Load More
							</Button>
						</Box>
					)}

					{/* No Results Message */}
					{filteredCategories.length === 0 && (
						<Box sx={{ textAlign: 'center', mt: 4 }}>
							<Typography variant="h6" color="text.secondary">
								No services found matching your search.
							</Typography>
						</Box>
					)}
				</Container>
			</Box>

			{/* Contact Section */}
			<Box
				id="contact"
				sx={{
					py: { xs: 6, md: 10 },
					bgcolor: '#000000',
					color: 'white',
					position: 'relative',
				}}
			>
				<Container maxWidth="lg">
					<Typography
						variant="h2"
						component="h2"
						gutterBottom
						align="center"
						sx={{
							fontSize: { xs: '2.5rem', md: '3.5rem' },
							mb: 5,
							fontWeight: 700,
							letterSpacing: '-0.02em',
						}}
					>
						Contact Us
					</Typography>
					<Grid container spacing={4}>
						<Grid item xs={12} md={4}>
							<Paper
								sx={{
									p: 5,
									height: '100%',
									transition: 'all 0.3s ease',
									backgroundColor: 'rgba(255,255,255,0.98)',
									'&:hover': {
										transform: 'translateY(-5px)',
										boxShadow: '0 12px 28px rgba(255,0,0,0.2)',
									},
								}}
							>
								<LocationOnIcon
									sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }}
								/>
								<Typography
									variant="h6"
									gutterBottom
									sx={{
										fontSize: '1.25rem',
										fontWeight: 600,
										color: '#000000',
										mb: 2,
									}}
								>
									Location
								</Typography>
								<Typography
									sx={{
										fontSize: '1.1rem',
										color: '#666666',
										lineHeight: 1.8,
									}}
								>
									123 Health Street, Medical District, 50000 Kuala Lumpur,
									Malaysia.
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} md={4}>
							<Paper
								sx={{
									p: 5,
									height: '100%',
									transition: 'all 0.3s ease',
									backgroundColor: 'rgba(255,255,255,0.98)',
									'&:hover': {
										transform: 'translateY(-5px)',
										boxShadow: '0 12px 28px rgba(255,0,0,0.2)',
									},
								}}
							>
								<PhoneIcon
									sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }}
								/>
								<Typography
									variant="h6"
									gutterBottom
									sx={{
										fontSize: '1.25rem',
										fontWeight: 600,
										color: '#000000',
										mb: 2,
									}}
								>
									Phone
								</Typography>
								<Typography
									sx={{
										fontSize: '1.1rem',
										color: '#666666',
										lineHeight: 1.8,
									}}
								>
									+60 12-345 6789
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} md={4}>
							<Paper
								sx={{
									p: 5,
									height: '100%',
									transition: 'all 0.3s ease',
									backgroundColor: 'rgba(255,255,255,0.98)',
									'&:hover': {
										transform: 'translateY(-5px)',
										boxShadow: '0 12px 28px rgba(255,0,0,0.2)',
									},
								}}
							>
								<EmailIcon
									sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }}
								/>
								<Typography
									variant="h6"
									gutterBottom
									sx={{
										fontSize: '1.25rem',
										fontWeight: 600,
										color: '#000000',
										mb: 2,
									}}
								>
									Email
								</Typography>
								<Typography
									sx={{
										fontSize: '1.1rem',
										color: '#666666',
										lineHeight: 1.8,
									}}
								>
									info@sunrisemedical.com
									<br />
									support@sunrisemedical.com
								</Typography>
							</Paper>
						</Grid>
					</Grid>
				</Container>
			</Box>

			<BookingModal open={openBooking} onClose={() => setOpenBooking(false)} />
			<Chatbot />
		</Box>
	);
}

export default Homepage;
