// ER: Admin uses session.userId = 0 (hardcoded). Student/Guardian use session.userId = USERS.user_id, session.studentId = STUDENT.student_id
function requireLogin(req, res, next) {
  if (!req.session || req.session.role == null) {
    return res.status(401).json({ error: 'Please log in.' });
  }
  if (req.session.role !== 'admin' && (req.session.userId == null || req.session.userId === 0)) {
    return res.status(401).json({ error: 'Please log in.' });
  }
  next();
}

module.exports = requireLogin;
