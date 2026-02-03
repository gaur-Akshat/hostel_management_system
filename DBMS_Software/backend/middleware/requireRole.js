// Admin has session.userId = 0; Student/Guardian have session.userId = student_id
function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.session || req.session.role == null) {
      return res.status(401).json({ error: 'Please log in.' });
    }
    if (req.session.role !== 'admin' && (req.session.userId == null || req.session.userId === 0)) {
      return res.status(401).json({ error: 'Please log in.' });
    }
    const role = req.session.role;
    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ error: 'Access denied. Insufficient permissions.' });
    }
    next();
  };
}

module.exports = requireRole;
