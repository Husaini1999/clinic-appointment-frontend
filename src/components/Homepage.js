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
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import HealingIcon from '@mui/icons-material/Healing';
import ChildCareIcon from '@mui/icons-material/ChildCare';
import ElderlyIcon from '@mui/icons-material/Elderly';
import VaccinesIcon from '@mui/icons-material/Vaccines';
import BookingModal from './Booking';
import Chatbot from './Chatbot';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import config from '../config';
import { motion } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';
import FilterListIcon from '@mui/icons-material/FilterList';

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
					minHeight: '92vh',
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
						py: { xs: 8, md: 15 },
					}}
				>
					<Typography
						variant="h1"
						component="h1"
						gutterBottom
						sx={{
							fontSize: { xs: '2.5rem', md: '4rem' },
							fontWeight: 800,
							color: 'white',
							textShadow: '2px 2px 4px rgba(0,0,0,0.3)',
							mb: 4,
							lineHeight: 1.2,
						}}
					>
						Welcome to <br />
						<Box
							component="span"
							sx={{
								color: 'secondary.main',
								display: 'block',
								mt: 1,
							}}
						>
							Primer Cherang Clinic
						</Box>
					</Typography>
					<Typography
						variant="h5"
						component="h2"
						gutterBottom
						sx={{
							fontSize: { xs: '1.2rem', md: '1.5rem' },
							mb: 6,
							color: 'rgba(255,255,255,0.9)',
							fontWeight: 400,
							maxWidth: '800px',
							mx: 'auto',
							lineHeight: 1.6,
						}}
					>
						Your Health is Our Priority. Experience compassionate care with our
						team of dedicated healthcare professionals.
					</Typography>
					<Box sx={{ display: 'flex', gap: 3, justifyContent: 'center' }}>
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
					py: 12,
					bgcolor: 'background.default',
					position: 'relative',
				}}
			>
				<Container maxWidth="lg">
					<Typography
						variant="h2"
						component="h2"
						gutterBottom
						align="center"
						color="primary"
						sx={{ mb: 6 }}
					>
						About Us
					</Typography>
					<Box sx={{ mb: 4, textAlign: 'center' }}>
						<HealthAndSafetyIcon
							sx={{ fontSize: 60, color: 'secondary.main', mb: 2 }}
						/>
						<Typography variant="body1" paragraph sx={{ lineHeight: 1.6 }}>
							Welcome to Primer Clinic! Our mission is to provide compassionate
							and high-quality healthcare to our community. We believe in
							treating our patients with respect and dignity, ensuring that they
							receive the best possible care.
						</Typography>
						<Typography variant="body1" paragraph sx={{ lineHeight: 1.6 }}>
							Our team of dedicated healthcare professionals is committed to
							your health and well-being. With years of experience in various
							medical fields, we are here to support you and your family with
							all your healthcare needs.
						</Typography>
						<Typography variant="body1" paragraph sx={{ lineHeight: 1.6 }}>
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
					py: 8,
					bgcolor: 'background.default',
					position: 'relative',
				}}
			>
				<Container maxWidth="lg">
					<Typography
						variant="h2"
						component="h2"
						gutterBottom
						align="center"
						sx={{ mb: 6 }}
					>
						Our Services
					</Typography>

					{/* Search Bar */}
					<Box sx={{ mb: 4, display: 'flex', justifyContent: 'center' }}>
						<TextField
							value={searchTerm}
							onChange={(e) => setSearchTerm(e.target.value)}
							placeholder="Search services..."
							variant="outlined"
							sx={{ width: { xs: '100%', sm: '400px' } }}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<SearchIcon color="action" />
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
					py: 12,
					bgcolor: 'primary.light',
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
						sx={{ mb: 6 }}
					>
						Contact Us
					</Typography>
					<Grid container spacing={4}>
						<Grid item xs={12} md={4}>
							<Paper
								sx={{
									p: 4,
									height: '100%',
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-5px)',
										boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
									},
								}}
							>
								<LocationOnIcon
									sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }}
								/>
								<Typography variant="h6" gutterBottom>
									Location
								</Typography>
								<Typography>
									123 Cherang Street
									<br />
									Kuala Lumpur, 50450
									<br />
									Malaysia
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} md={4}>
							<Paper
								sx={{
									p: 4,
									height: '100%',
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-5px)',
										boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
									},
								}}
							>
								<PhoneIcon
									sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }}
								/>
								<Typography variant="h6" gutterBottom>
									Phone
								</Typography>
								<Typography>
									+60 3-1234 5678
									<br />
									Emergency: +60 3-1234 5679
								</Typography>
							</Paper>
						</Grid>
						<Grid item xs={12} md={4}>
							<Paper
								sx={{
									p: 4,
									height: '100%',
									transition: 'all 0.3s ease',
									'&:hover': {
										transform: 'translateY(-5px)',
										boxShadow: '0 8px 24px rgba(0,0,0,0.15)',
									},
								}}
							>
								<EmailIcon
									sx={{ fontSize: 40, color: 'secondary.main', mb: 2 }}
								/>
								<Typography variant="h6" gutterBottom>
									Email
								</Typography>
								<Typography>
									info@primercherang.com
									<br />
									support@primercherang.com
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
