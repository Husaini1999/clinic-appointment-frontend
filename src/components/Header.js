import React from 'react';
import {
	AppBar,
	Container,
	Toolbar,
	Typography,
	useScrollTrigger,
	Slide,
	IconButton,
	Box,
	useTheme,
	useMediaQuery,
} from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import Navbar from './Navbar';
import { useNavigate, useLocation } from 'react-router-dom';
import { DEMO_CONFIG } from '../config/demo';

const Header = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down('md'));
	const [mobileOpen, setMobileOpen] = React.useState(false);
	const navigate = useNavigate();
	const location = useLocation();

	const handleTitleClick = () => {
		if (location.pathname === '/') {
			window.scrollTo({ top: 0, behavior: 'smooth' });
		} else {
			navigate('/');
		}
	};

	function HideOnScroll({ children }) {
		const trigger = useScrollTrigger();
		return (
			<Slide appear={false} direction="down" in={!trigger}>
				{children}
			</Slide>
		);
	}

	const handleDrawerToggle = () => {
		setMobileOpen((prevState) => !prevState);
	};

	return (
		<HideOnScroll>
			<AppBar
				position="sticky"
				sx={{
					bgcolor: 'rgba(255, 255, 255, 0.95)',
					backdropFilter: 'blur(8px)',
					boxShadow: '0 2px 20px rgba(0,0,0,0.05)',
					borderBottom: '0px solid rgba(0,0,0,0.05)',
				}}
			>
				<Container maxWidth="xl">
					<Toolbar
						disableGutters
						sx={{
							height: 70,
							display: 'flex',
							justifyContent: 'space-between',
							alignItems: 'center',
						}}
					>
						{isMobile && (
							<IconButton
								color="primary"
								aria-label="open drawer"
								edge="start"
								onClick={handleDrawerToggle}
								sx={{ mr: 2 }}
							>
								<MenuIcon />
							</IconButton>
						)}

						<Typography
							variant="h6"
							component="div"
							onClick={handleTitleClick}
							sx={{
								cursor: 'pointer',
								color: 'primary.main',
								fontWeight: 700,
								fontSize: { xs: '1.2rem', sm: '1.5rem' },
								letterSpacing: '-0.5px',
								position: { xs: 'absolute', md: 'static' },
								left: '50%',
								transform: { xs: 'translateX(-50%)', md: 'none' },
								display: 'flex',
								alignItems: 'center',
								gap: 2,
								'&:hover': {
									opacity: 0.8,
								},
								transition: 'opacity 0.2s ease-in-out',
							}}
						>
							Sunrise Medical Center
						</Typography>

						<Box sx={{ display: { xs: 'none', md: 'block' } }}>
							<Navbar
								mobileOpen={mobileOpen}
								onMobileClose={handleDrawerToggle}
							/>
						</Box>

						{isMobile && (
							<Navbar
								mobileOpen={mobileOpen}
								onMobileClose={handleDrawerToggle}
							/>
						)}
					</Toolbar>
				</Container>
				{/* Demo Mode Banner */}
				{DEMO_CONFIG.ENABLE_DEMO_MODE && (
					<Box
						sx={{
							background: 'linear-gradient(135deg, #ffa726 0%, #ff9800 100%)',
							color: 'white',
							py: 1,
							textAlign: 'center',
							position: 'sticky',
							top: 0,
							zIndex: 999,
							boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
						}}
					>
						<Typography variant="body2" sx={{ fontWeight: 600 }}>
							🚀 DEMO MODE ACTIVE - Click "Login" to start exploring with demo
							credentials
						</Typography>
					</Box>
				)}
			</AppBar>
		</HideOnScroll>
	);
};

export default Header;
