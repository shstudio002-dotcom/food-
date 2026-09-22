const jwt = require('jsonwebtoken'); 
const protect = (req, res, next) => { let token = req.headers.authorization; if (token && token.startsWith('Bearer')) { try { token = token.split(' ')[1]; req.user = jwt.verify(token, process.env.JWT_SECRET); next(); } catch (error) { return res.status(401).json({ message: 'Not authorized, token failed' }); } } else { return res.status(401).json({ message: 'Not authorized, no token' }); } }; 
const adminOnly = (req, res, next) => { if (req.user && req.user.role === 'admin') next(); else res.status(403).json({ message: 'Access denied: Admin only' }); }; 
module.exports = { protect, adminOnly }; 
