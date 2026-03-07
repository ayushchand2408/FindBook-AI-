const jwt = require("jsonwebtoken");

function auth(req, res, next) {

  const token = req.headers.authorization;

  if (!token) {
    return res.status(401).json({ error: "No token" });
  }

  try {
    const decoded = jwt.verify(token, "secretkey");

    req.userId = decoded.userId;

    next();

  } catch {
    res.status(401).json({ error: "Invalid token" });
  }

}

module.exports = auth;