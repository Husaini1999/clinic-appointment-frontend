import React, { useState } from 'react';
import {
	Button,
	Box,
	Drawer,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Divider,
	useTheme,
	useMediaQuery,
} from '@mui/material';
import HomeIcon from '@mui/icons-material/Home';
import InfoIcon from '@mui/icons-material/Info';
import MedicalServicesIcon from '@mui/icons-material/MedicalServices';
import ContactMailIcon from '@mui/icons-material/ContactMail';
import { useNavigate, useLocation } from 'react-router-dom';
import DashboardIcon from '@mui/icons-material/Dashboard';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import ExitToAppIcon from '@mui/icons-material/ExitToApp';
import BookingModal from './Booking'; // Import the BookingModal component

function Navbar({ mobileOpen, onMobileClose }) {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const navigate = useNavigate();
	const location = useLocation();
	const user = JSON.parse(localStorage.getItem('user'));
	const [openBooking, setOpenBooking] = useState(false); // State to manage modal open/close

	const handleNavigation = (path) => {
		if (path === '/') {
			if (location.pathname === '/') {
				window.scrollTo({ top: 0, behavior: 'smooth' });
			} else {
				navigate('/');
			}
			onMobileClose();
			return;
		}

		if (path.startsWith('/#')) {
			const element = document.getElementById(path.substring(2));
			if (element) {
				element.scrollIntoView({ behavior: 'smooth' });
			} else if (location.pathname !== '/') {
				navigate('/', { state: { scrollTo: path.substring(2) } });
			}
		} else {
			navigate(path);
		}

		onMobileClose();
	};

	const handleLogout = () => {
		localStorage.removeItem('token');
		localStorage.removeItem('user');
		navigate('/');
		onMobileClose();
	};

	const handleOpenBooking = () => {
		setOpenBooking(true);
		onMobileClose();
	};

	const handleCloseBooking = () => {
		setOpenBooking(false);
	};

	// Define navigation items
	const navItems = [
		{ label: 'Home', path: '/' },
		{ label: 'About Us', path: '/#about' },
		{ label: 'Services', path: '/#services' },
		{ label: 'Contact', path: '/#contact' },
	];

	const drawer = (
		<Box sx={{ width: 250, pt: 2 }}>
			<List>
				{navItems.map((item) => (
					<ListItem
						button
						key={item.label}
						onClick={() => handleNavigation(item.path)}
					>
						<ListItemIcon>
							{item.label === 'Home' && <HomeIcon />}
							{item.label === 'About Us' && <InfoIcon />}
							{item.label === 'Services' && <MedicalServicesIcon />}
							{item.label === 'Contact' && <ContactMailIcon />}
						</ListItemIcon>
						<ListItemText primary={item.label} />
					</ListItem>
				))}
			</List>

			<Divider />

			{user ? (
				<List>
					<ListItem button onClick={() => handleNavigation('/dashboard')}>
						<ListItemIcon>
							<DashboardIcon />
						</ListItemIcon>
						<ListItemText primary="Dashboard" />
					</ListItem>
					{user.role === 'patient' && (
						<ListItem button onClick={handleOpenBooking}>
							<ListItemIcon>
								<CalendarTodayIcon />
							</ListItemIcon>
							<ListItemText primary="Book Appointment" />
						</ListItem>
					)}
					<ListItem button onClick={() => handleNavigation('/profile')}>
						<ListItemIcon>
							<AccountCircleIcon />
						</ListItemIcon>
						<ListItemText primary="Profile" />
					</ListItem>
					<ListItem
						button
						onClick={handleLogout}
						sx={{
							color: 'secondary.main',
							'&:hover': {
								backgroundColor: 'secondary.light',
								color: 'white',
							},
						}}
					>
						<ListItemIcon>
							<ExitToAppIcon sx={{ color: 'inherit' }} />
						</ListItemIcon>
						<ListItemText primary="Logout" />
					</ListItem>
				</List>
			) : (
				<List>
					<ListItem button onClick={() => handleNavigation('/login')}>
						<ListItemIcon>
							<AccountCircleIcon sx={{ color: 'inherit' }} />
						</ListItemIcon>
						<ListItemText primary="Login" />
					</ListItem>
				</List>
			)}
		</Box>
	);

	if (isMobile) {
		return (
			<>
				<Drawer
					variant="temporary"
					anchor="left"
					open={mobileOpen}
					onClose={onMobileClose}
					ModalProps={{
						keepMounted: true, // Better open performance on mobile.
					}}
					sx={{
						'& .MuiDrawer-paper': {
							width: 250,
							boxSizing: 'border-box',
							backgroundColor: 'background.paper',
						},
					}}
				>
					{drawer}
				</Drawer>
				<BookingModal open={openBooking} onClose={handleCloseBooking} />
			</>
		);
	}

	// Return desktop navigation
	return (
		<Box
			sx={{
				display: 'flex',
				gap: { xs: 1, md: 2 },
				alignItems: 'center',
			}}
		>
			{navItems.map((item) => (
				<Button
					key={item.label}
					color="primary"
					onClick={() => handleNavigation(item.path)}
					sx={{
						fontWeight: 500,
						px: 1,
						color: 'text.primary',
						'&:hover': {
							backgroundColor: 'rgba(0,0,0,0.05)',
						},
					}}
				>
					{item.label}
				</Button>
			))}

			{user ? (
				<>
					<Box
						sx={{
							border: '1px solid',
							borderColor: 'primary.main',
							borderRadius: '8px',
							padding: '4px',
							display: 'flex',
							gap: 1,
						}}
					>
						<Button
							color="primary"
							onClick={() => handleNavigation('/dashboard')}
							sx={{
								fontWeight: 500,
								px: 1,
								color: 'text.primary',
								'&:hover': {
									backgroundColor: 'rgba(0,0,0,0.05)',
								},
							}}
						>
							<DashboardIcon sx={{ mr: 1 }} />
							Dashboard
						</Button>
						{user.role === 'patient' && (
							<Button
								color="primary"
								onClick={handleOpenBooking}
								sx={{
									fontWeight: 500,
									px: 1,
									color: 'text.primary',
									'&:hover': {
										backgroundColor: 'rgba(0,0,0,0.05)',
									},
								}}
							>
								<CalendarTodayIcon sx={{ mr: 1 }} />
								Book Appointment
							</Button>
						)}
						<Button
							color="primary"
							onClick={() => handleNavigation('/profile')}
							sx={{
								fontWeight: 500,
								px: 1,
								color: 'text.primary',
								'&:hover': {
									backgroundColor: 'rgba(0,0,0,0.05)',
								},
							}}
						>
							<AccountCircleIcon sx={{ mr: 1 }} />
							Profile
						</Button>
					</Box>
					<Button
						color="secondary"
						variant="contained"
						onClick={handleLogout}
						sx={{
							fontWeight: 500,
							px: 3,
							borderRadius: '50px',
							boxShadow: 'none',
							'&:hover': {
								boxShadow: '0 4px 12px rgba(220,38,38,0.2)',
								backgroundColor: 'secondary.dark',
							},
						}}
					>
						Logout
					</Button>
					<BookingModal open={openBooking} onClose={handleCloseBooking} />
				</>
			) : (
				<>
					<Button
						color="secondary"
						variant="contained"
						onClick={() => handleNavigation('/login')}
						sx={{
							fontWeight: 500,
							px: 1,
							ml: { xs: 1, md: 2 },
							borderRadius: '50px',
							boxShadow: 'none',
							'&:hover': {
								boxShadow: '0 4px 12px rgba(220,38,38,0.2)',
								backgroundColor: 'secondary.dark',
							},
						}}
					>
						Login
					</Button>
				</>
			)}
		</Box>
	);
}

export default Navbar;
