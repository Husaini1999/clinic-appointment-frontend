import React from 'react';
import Header from './Header';
import Chatbot from './Chatbot';

const Layout = ({ children }) => {
	return (
		<div>
			<Header />
			<main>
				{' '}
				{/* Adjust margin based on your header height */}
				{children}
			</main>
			<Chatbot />
		</div>
	);
};

export default Layout;
