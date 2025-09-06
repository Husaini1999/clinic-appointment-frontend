import React, { useEffect, useState, useRef } from 'react';
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
	useTheme,
	useMediaQuery,
} from '@mui/material';
import LocationOnIcon from '@mui/icons-material/LocationOn';
import PhoneIcon from '@mui/icons-material/Phone';
import EmailIcon from '@mui/icons-material/Email';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import BookingModal from './Booking';
import Chatbot from './Chatbot';
import HealthAndSafetyIcon from '@mui/icons-material/HealthAndSafety';
import LocalHospitalIcon from '@mui/icons-material/LocalHospital';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import FavoriteIcon from '@mui/icons-material/Favorite';
import config from '../config';
import { motion, useScroll, useTransform, useSpring } from 'framer-motion';
import SearchIcon from '@mui/icons-material/Search';

function Homepage() {
	const location = useLocation();
	const [openBooking, setOpenBooking] = useState(false);
	const [categories, setCategories] = useState([]);
	const [searchTerm, setSearchTerm] = useState('');
	const [visibleCategories, setVisibleCategories] = useState(6);
	const navigate = useNavigate();
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));

	// Refs for parallax effects
	const heroRef = useRef(null);
	const aboutRef = useRef(null);
	const servicesRef = useRef(null);
	const contactRef = useRef(null);

	// Parallax scroll effects
	const { scrollYProgress } = useScroll();
	const heroY = useTransform(scrollYProgress, [0, 1], ['0%', '50%']);
	const aboutY = useTransform(scrollYProgress, [0, 1], ['0%', '30%']);
	const servicesY = useTransform(scrollYProgress, [0, 1], ['0%', '20%']);

	// Spring animations for smoother effects
	const springConfig = { stiffness: 100, damping: 30, restDelta: 0.001 };
	const heroSpring = useSpring(heroY, springConfig);
	const aboutSpring = useSpring(aboutY, springConfig);
	const servicesSpring = useSpring(servicesY, springConfig);

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
				ref={heroRef}
				id="home"
				sx={{
					position: 'relative',
					minHeight: '100vh',
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					background:
						'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
					overflow: 'hidden',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: `
							radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
							radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
							radial-gradient(circle at 40% 40%, rgba(120, 219, 255, 0.2) 0%, transparent 50%)
						`,
						zIndex: 1,
					},
					'&::after': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: 'url(/hero-bg.jpg) center/cover',
						opacity: 0.05,
						zIndex: 1,
					},
				}}
			>
				{/* Floating Medical Icons */}
				<motion.div
					style={{
						position: 'absolute',
						top: '10%',
						left: '10%',
						zIndex: 2,
						y: heroSpring,
					}}
					animate={{
						y: [0, -20, 0],
						rotate: [0, 5, 0],
					}}
					transition={{
						duration: 6,
						repeat: Infinity,
						ease: 'easeInOut',
					}}
				>
					<HealthAndSafetyIcon
						sx={{
							fontSize: 60,
							color: 'rgba(255, 255, 255, 0.1)',
							transform: 'rotate(15deg)',
						}}
					/>
				</motion.div>

				<motion.div
					style={{
						position: 'absolute',
						top: '20%',
						right: '15%',
						zIndex: 2,
						y: heroSpring,
					}}
					animate={{
						y: [0, 15, 0],
						rotate: [0, -5, 0],
					}}
					transition={{
						duration: 8,
						repeat: Infinity,
						ease: 'easeInOut',
						delay: 1,
					}}
				>
					<LocalHospitalIcon
						sx={{
							fontSize: 50,
							color: 'rgba(255, 255, 255, 0.08)',
							transform: 'rotate(-10deg)',
						}}
					/>
				</motion.div>

				<motion.div
					style={{
						position: 'absolute',
						bottom: '20%',
						left: '20%',
						zIndex: 2,
						y: heroSpring,
					}}
					animate={{
						y: [0, -10, 0],
						rotate: [0, 8, 0],
					}}
					transition={{
						duration: 7,
						repeat: Infinity,
						ease: 'easeInOut',
						delay: 2,
					}}
				>
					<MedicalServicesIcon
						sx={{
							fontSize: 45,
							color: 'rgba(255, 255, 255, 0.06)',
							transform: 'rotate(20deg)',
						}}
					/>
				</motion.div>

				<motion.div
					style={{
						position: 'absolute',
						bottom: '15%',
						right: '10%',
						zIndex: 2,
						y: heroSpring,
					}}
					animate={{
						y: [0, 12, 0],
						rotate: [0, -8, 0],
					}}
					transition={{
						duration: 9,
						repeat: Infinity,
						ease: 'easeInOut',
						delay: 0.5,
					}}
				>
					<FavoriteIcon
						sx={{
							fontSize: 40,
							color: 'rgba(255, 255, 255, 0.05)',
							transform: 'rotate(-15deg)',
						}}
					/>
				</motion.div>
				<Container
					maxWidth="md"
					sx={{
						position: 'relative',
						zIndex: 3,
						textAlign: 'center',
						py: { xs: 10, md: 16 },
					}}
				>
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, ease: 'easeOut' }}
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
								background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
								backgroundClip: 'text',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
							}}
						>
							Welcome to <br />
							<motion.span
								initial={{ opacity: 0, scale: 0.8 }}
								animate={{ opacity: 1, scale: 1 }}
								transition={{ duration: 0.8, delay: 0.5, ease: 'easeOut' }}
								style={{
									color: '#ff6b6b',
									display: 'block',
									marginTop: '1rem',
									background:
										'linear-gradient(45deg, #ff6b6b 30%, #ffa726 90%)',
									backgroundClip: 'text',
									WebkitBackgroundClip: 'text',
									WebkitTextFillColor: 'transparent',
								}}
							>
								Sunrise Medical Center
							</motion.span>
						</Typography>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, delay: 0.3, ease: 'easeOut' }}
					>
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
							Your Health is Our Priority. Experience compassionate care with
							our team of dedicated healthcare professionals.
						</Typography>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 1, delay: 0.6, ease: 'easeOut' }}
					>
						<Box
							sx={{
								display: 'flex',
								gap: 4,
								justifyContent: 'center',
								flexWrap: 'wrap',
							}}
						>
							<motion.div
								whileHover={{ scale: 1.05, y: -5 }}
								whileTap={{ scale: 0.95 }}
								transition={{ type: 'spring', stiffness: 300, damping: 20 }}
							>
								<Button
									variant="contained"
									size="large"
									sx={{
										py: 2,
										px: 6,
										fontSize: '1.1rem',
										fontWeight: 600,
										borderRadius: '50px',
										background:
											'linear-gradient(45deg, #ff6b6b 30%, #ffa726 90%)',
										boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
										'&:hover': {
											background:
												'linear-gradient(45deg, #ff5252 30%, #ff9800 90%)',
											boxShadow: '0 8px 25px rgba(255, 107, 107, 0.5)',
										},
									}}
									onClick={handleBookingClick}
								>
									Book Appointment
								</Button>
							</motion.div>

							<motion.div
								whileHover={{ scale: 1.05, y: -5 }}
								whileTap={{ scale: 0.95 }}
								transition={{ type: 'spring', stiffness: 300, damping: 20 }}
							>
								<Button
									variant="outlined"
									size="large"
									sx={{
										py: 2,
										px: 6,
										fontSize: '1.1rem',
										fontWeight: 600,
										borderRadius: '50px',
										borderColor: 'rgba(255,255,255,0.5)',
										color: 'white',
										backdropFilter: 'blur(10px)',
										'&:hover': {
											borderColor: 'white',
											backgroundColor: 'rgba(255,255,255,0.1)',
											backdropFilter: 'blur(15px)',
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
							</motion.div>
						</Box>
					</motion.div>
				</Container>
				<motion.div
					style={{
						position: 'absolute',
						bottom: 40,
						left: '50%',
						transform: 'translateX(-50%)',
						zIndex: 3,
					}}
					animate={{
						y: [0, 10, 0],
					}}
					transition={{
						duration: 2,
						repeat: Infinity,
						ease: 'easeInOut',
					}}
				>
					<IconButton
						sx={{
							color: 'white',
							backgroundColor: 'rgba(255, 255, 255, 0.1)',
							backdropFilter: 'blur(10px)',
							border: '1px solid rgba(255, 255, 255, 0.2)',
							'&:hover': {
								backgroundColor: 'rgba(255, 255, 255, 0.2)',
								transform: 'scale(1.1)',
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
				</motion.div>
			</Box>

			{/* About Us Section */}
			<Box
				ref={aboutRef}
				id="about"
				sx={{
					py: { xs: 6, md: 10 },
					background: 'linear-gradient(135deg, #f8f9fa 0%, #e9ecef 100%)',
					position: 'relative',
					overflow: 'hidden',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: '8px',
						background:
							'linear-gradient(90deg, #ff6b6b 0%, #ffa726 50%, #ff6b6b 100%)',
					},
					'&::after': {
						content: '""',
						position: 'absolute',
						top: '-50%',
						right: '-20%',
						width: '40%',
						height: '200%',
						background:
							'radial-gradient(circle, rgba(255, 107, 107, 0.05) 0%, transparent 70%)',
						transform: 'rotate(15deg)',
						zIndex: 1,
					},
				}}
			>
				<Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: 'easeOut' }}
						viewport={{ once: true }}
					>
						<Typography
							variant="h2"
							component="h2"
							gutterBottom
							align="center"
							sx={{
								fontSize: { xs: '2.5rem', md: '3.5rem' },
								mb: 5,
								background: 'linear-gradient(45deg, #2c3e50 30%, #34495e 90%)',
								backgroundClip: 'text',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								fontWeight: 700,
								letterSpacing: '-0.02em',
							}}
						>
							About Us
						</Typography>
					</motion.div>

					<Box
						sx={{
							mb: 4,
							textAlign: 'center',
							maxWidth: '900px',
							mx: 'auto',
						}}
					>
						<motion.div
							initial={{ opacity: 0, scale: 0.5 }}
							whileInView={{ opacity: 1, scale: 1 }}
							transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
							viewport={{ once: true }}
						>
							<HealthAndSafetyIcon
								sx={{
									fontSize: 72,
									color: '#ff6b6b',
									mb: 4,
									filter: 'drop-shadow(0 4px 8px rgba(255, 107, 107, 0.3))',
								}}
							/>
						</motion.div>
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
							viewport={{ once: true }}
						>
							<Typography
								variant="body1"
								paragraph
								sx={{
									lineHeight: 1.8,
									fontSize: '1.125rem',
									color: '#2c3e50',
									mb: 3,
									fontWeight: 400,
								}}
							>
								Welcome to Sunrise Medical Center! Our mission is to provide
								compassionate and high-quality healthcare to our community. We
								believe in treating our patients with respect and dignity,
								ensuring that they receive the best possible care.
							</Typography>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
							viewport={{ once: true }}
						>
							<Typography
								variant="body1"
								paragraph
								sx={{
									lineHeight: 1.8,
									fontSize: '1.125rem',
									color: '#2c3e50',
									mb: 3,
									fontWeight: 400,
								}}
							>
								Our team of dedicated healthcare professionals is committed to
								your health and well-being. With years of experience in various
								medical fields, we are here to support you and your family with
								all your healthcare needs.
							</Typography>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
							viewport={{ once: true }}
						>
							<Typography
								variant="body1"
								paragraph
								sx={{
									lineHeight: 1.8,
									fontSize: '1.125rem',
									color: '#2c3e50',
									mb: 3,
									fontWeight: 400,
								}}
							>
								At Sunrise Medical Center, we offer a wide range of services,
								including general checkups, dental care, physiotherapy, and
								more. We strive to create a welcoming environment where you can
								feel comfortable and cared for.
							</Typography>
						</motion.div>

						<motion.div
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, delay: 1, ease: 'easeOut' }}
							viewport={{ once: true }}
						>
							<motion.div
								whileHover={{ scale: 1.05 }}
								whileTap={{ scale: 0.95 }}
							>
								<Button
									variant="contained"
									size="large"
									sx={{
										mt: 4,
										py: 2,
										px: 4,
										fontSize: '1rem',
										fontWeight: 600,
										borderRadius: '50px',
										background:
											'linear-gradient(45deg, #ff6b6b 30%, #ffa726 90%)',
										boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
										'&:hover': {
											background:
												'linear-gradient(45deg, #ff5252 30%, #ff9800 90%)',
											boxShadow: '0 8px 25px rgba(255, 107, 107, 0.5)',
										},
									}}
									onClick={() =>
										document
											.getElementById('services')
											.scrollIntoView({ behavior: 'smooth' })
									}
								>
									Explore Our Services
								</Button>
							</motion.div>
						</motion.div>
					</Box>
				</Container>
			</Box>

			{/* Services Section */}
			<Box
				ref={servicesRef}
				id="services"
				sx={{
					py: { xs: 6, md: 10 },
					background: 'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
					position: 'relative',
					overflow: 'hidden',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						height: '8px',
						background:
							'linear-gradient(90deg, #ff6b6b 0%, #ffa726 50%, #ff6b6b 100%)',
					},
					'&::after': {
						content: '""',
						position: 'absolute',
						top: '-30%',
						left: '-10%',
						width: '30%',
						height: '160%',
						background:
							'radial-gradient(circle, rgba(255, 167, 38, 0.05) 0%, transparent 70%)',
						transform: 'rotate(-15deg)',
						zIndex: 1,
					},
				}}
			>
				<Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: 'easeOut' }}
						viewport={{ once: true }}
					>
						<Typography
							variant="h2"
							component="h2"
							gutterBottom
							align="center"
							sx={{
								fontSize: { xs: '2.5rem', md: '3.5rem' },
								mb: 2,
								background: 'linear-gradient(45deg, #2c3e50 30%, #34495e 90%)',
								backgroundClip: 'text',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
								fontWeight: 700,
								letterSpacing: '-0.02em',
							}}
						>
							Our Services
						</Typography>
					</motion.div>

					{/* Search Bar */}
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
						viewport={{ once: true }}
					>
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
									borderRadius: '50px',
									boxShadow: '0 4px 20px rgba(0, 0, 0, 0.1)',
									'& .MuiOutlinedInput-root': {
										fontSize: '1.1rem',
										py: 1,
										borderRadius: '50px',
										'&:hover fieldset': {
											borderColor: '#ff6b6b',
										},
										'&.Mui-focused fieldset': {
											borderColor: '#ff6b6b',
											borderWidth: 2,
										},
									},
								}}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchIcon sx={{ color: '#ff6b6b' }} />
										</InputAdornment>
									),
								}}
							/>
						</Box>
					</motion.div>

					<Grid container spacing={4}>
						{filteredCategories
							.slice(0, visibleCategories)
							.map((category, index) => (
								<Grid item xs={12} sm={6} md={4} key={category._id}>
									<motion.div
										initial={{ opacity: 0, y: 50, scale: 0.9 }}
										whileInView={{ opacity: 1, y: 0, scale: 1 }}
										transition={{
											duration: 0.6,
											delay: index * 0.1,
											ease: 'easeOut',
										}}
										viewport={{ once: true }}
										whileHover={{ y: -10, scale: 1.02 }}
									>
										<Paper
											sx={{
												p: 3,
												height: '100%',
												cursor: 'pointer',
												borderRadius: '20px',
												background:
													'linear-gradient(135deg, #ffffff 0%, #f8f9fa 100%)',
												boxShadow: '0 4px 20px rgba(0, 0, 0, 0.08)',
												border: '1px solid rgba(255, 107, 107, 0.1)',
												transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
												'&:hover': {
													transform: 'translateY(-10px) scale(1.02)',
													boxShadow: '0 20px 40px rgba(255, 107, 107, 0.2)',
													border: '1px solid rgba(255, 107, 107, 0.3)',
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
														borderRadius: '15px',
														mb: 2,
														transition: 'transform 0.3s ease',
														'&:hover': {
															transform: 'scale(1.05)',
														},
													}}
												/>
											) : (
												<Box
													sx={{
														width: '100%',
														height: 200,
														background:
															'linear-gradient(135deg, #ff6b6b 0%, #ffa726 100%)',
														borderRadius: '15px',
														mb: 2,
														display: 'flex',
														alignItems: 'center',
														justifyContent: 'center',
														transition: 'transform 0.3s ease',
														'&:hover': {
															transform: 'scale(1.05)',
														},
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
													background:
														'linear-gradient(45deg, #2c3e50 30%, #34495e 90%)',
													backgroundClip: 'text',
													WebkitBackgroundClip: 'text',
													WebkitTextFillColor: 'transparent',
													mb: 2,
												}}
											>
												{category.name}
											</Typography>
											<Typography
												sx={{
													lineHeight: 1.7,
													color: '#5a6c7d',
													fontSize: '0.95rem',
												}}
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
						<motion.div
							initial={{ opacity: 0, y: 30 }}
							whileInView={{ opacity: 1, y: 0 }}
							transition={{ duration: 0.8, ease: 'easeOut' }}
							viewport={{ once: true }}
						>
							<Box sx={{ mt: 4, display: 'flex', justifyContent: 'center' }}>
								<motion.div
									whileHover={{ scale: 1.05, y: -5 }}
									whileTap={{ scale: 0.95 }}
								>
									<Button
										variant="contained"
										onClick={handleLoadMore}
										sx={{
											py: 2,
											px: 6,
											borderRadius: '50px',
											background:
												'linear-gradient(45deg, #ff6b6b 30%, #ffa726 90%)',
											boxShadow: '0 4px 15px rgba(255, 107, 107, 0.3)',
											fontWeight: 600,
											'&:hover': {
												background:
													'linear-gradient(45deg, #ff5252 30%, #ff9800 90%)',
												boxShadow: '0 8px 25px rgba(255, 107, 107, 0.5)',
											},
										}}
									>
										Load More
									</Button>
								</motion.div>
							</Box>
						</motion.div>
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
				ref={contactRef}
				id="contact"
				sx={{
					py: { xs: 6, md: 10 },
					background:
						'linear-gradient(135deg, #0a0a0a 0%, #1a1a2e 50%, #16213e 100%)',
					color: 'white',
					position: 'relative',
					overflow: 'hidden',
					'&::before': {
						content: '""',
						position: 'absolute',
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: `
							radial-gradient(circle at 30% 20%, rgba(255, 107, 107, 0.1) 0%, transparent 50%),
							radial-gradient(circle at 70% 80%, rgba(255, 167, 38, 0.1) 0%, transparent 50%)
						`,
						zIndex: 1,
					},
				}}
			>
				<Container maxWidth="lg" sx={{ position: 'relative', zIndex: 2 }}>
					<motion.div
						initial={{ opacity: 0, y: 50 }}
						whileInView={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.8, ease: 'easeOut' }}
						viewport={{ once: true }}
					>
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
								background: 'linear-gradient(45deg, #ffffff 30%, #e3f2fd 90%)',
								backgroundClip: 'text',
								WebkitBackgroundClip: 'text',
								WebkitTextFillColor: 'transparent',
							}}
						>
							Contact Us
						</Typography>
					</motion.div>

					<Grid container spacing={4}>
						<Grid item xs={12} md={4}>
							<motion.div
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
								viewport={{ once: true }}
								whileHover={{ y: -10, scale: 1.02 }}
							>
								<Paper
									sx={{
										p: 5,
										height: '100%',
										borderRadius: '20px',
										background:
											'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%)',
										backdropFilter: 'blur(10px)',
										border: '1px solid rgba(255, 255, 255, 0.2)',
										boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
										transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
										'&:hover': {
											transform: 'translateY(-10px) scale(1.02)',
											boxShadow: '0 20px 40px rgba(255, 107, 107, 0.2)',
											border: '1px solid rgba(255, 107, 107, 0.3)',
										},
									}}
								>
									<LocationOnIcon
										sx={{
											fontSize: 40,
											color: '#ff6b6b',
											mb: 2,
											filter: 'drop-shadow(0 2px 4px rgba(255, 107, 107, 0.3))',
										}}
									/>
									<Typography
										variant="h6"
										gutterBottom
										sx={{
											fontSize: '1.25rem',
											fontWeight: 600,
											color: '#2c3e50',
											mb: 2,
										}}
									>
										Location
									</Typography>
									<Typography
										sx={{
											fontSize: '1.1rem',
											color: '#5a6c7d',
											lineHeight: 1.8,
										}}
									>
										123 Health Street, Medical District, 50000 Kuala Lumpur,
										Malaysia.
									</Typography>
								</Paper>
							</motion.div>
						</Grid>

						<Grid item xs={12} md={4}>
							<motion.div
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.4, ease: 'easeOut' }}
								viewport={{ once: true }}
								whileHover={{ y: -10, scale: 1.02 }}
							>
								<Paper
									sx={{
										p: 5,
										height: '100%',
										borderRadius: '20px',
										background:
											'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%)',
										backdropFilter: 'blur(10px)',
										border: '1px solid rgba(255, 255, 255, 0.2)',
										boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
										transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
										'&:hover': {
											transform: 'translateY(-10px) scale(1.02)',
											boxShadow: '0 20px 40px rgba(255, 107, 107, 0.2)',
											border: '1px solid rgba(255, 107, 107, 0.3)',
										},
									}}
								>
									<PhoneIcon
										sx={{
											fontSize: 40,
											color: '#ff6b6b',
											mb: 2,
											filter: 'drop-shadow(0 2px 4px rgba(255, 107, 107, 0.3))',
										}}
									/>
									<Typography
										variant="h6"
										gutterBottom
										sx={{
											fontSize: '1.25rem',
											fontWeight: 600,
											color: '#2c3e50',
											mb: 2,
										}}
									>
										Phone
									</Typography>
									<Typography
										sx={{
											fontSize: '1.1rem',
											color: '#5a6c7d',
											lineHeight: 1.8,
										}}
									>
										+60 12-345 6789
									</Typography>
								</Paper>
							</motion.div>
						</Grid>

						<Grid item xs={12} md={4}>
							<motion.div
								initial={{ opacity: 0, y: 30 }}
								whileInView={{ opacity: 1, y: 0 }}
								transition={{ duration: 0.8, delay: 0.6, ease: 'easeOut' }}
								viewport={{ once: true }}
								whileHover={{ y: -10, scale: 1.02 }}
							>
								<Paper
									sx={{
										p: 5,
										height: '100%',
										borderRadius: '20px',
										background:
											'linear-gradient(135deg, rgba(255,255,255,0.95) 0%, rgba(248,249,250,0.95) 100%)',
										backdropFilter: 'blur(10px)',
										border: '1px solid rgba(255, 255, 255, 0.2)',
										boxShadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
										transition: 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)',
										'&:hover': {
											transform: 'translateY(-10px) scale(1.02)',
											boxShadow: '0 20px 40px rgba(255, 107, 107, 0.2)',
											border: '1px solid rgba(255, 107, 107, 0.3)',
										},
									}}
								>
									<EmailIcon
										sx={{
											fontSize: 40,
											color: '#ff6b6b',
											mb: 2,
											filter: 'drop-shadow(0 2px 4px rgba(255, 107, 107, 0.3))',
										}}
									/>
									<Typography
										variant="h6"
										gutterBottom
										sx={{
											fontSize: '1.25rem',
											fontWeight: 600,
											color: '#2c3e50',
											mb: 2,
										}}
									>
										Email
									</Typography>
									<Typography
										sx={{
											fontSize: '1.1rem',
											color: '#5a6c7d',
											lineHeight: 1.8,
										}}
									>
										info@sunrisemedical.com
										<br />
										support@sunrisemedical.com
									</Typography>
								</Paper>
							</motion.div>
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
