const { createProxyMiddleware } = require('http-proxy-middleware');

module.exports = function (app) {
	app.use(
		'/api',
		createProxyMiddleware({
			target: 'http://127.0.0.1:5000',
			changeOrigin: true,
			secure: false,
			onError: (err, req, res) => {
				console.error('Proxy Error:', err);
				res.status(500).json({ message: 'Proxy error occurred' });
			},
		})
	);
};
