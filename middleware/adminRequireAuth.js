const jwt = require("jsonwebtoken");
const Admin = require("../schema/adminSchema");

const adminRequireAuth = async (req, res, next) => {
  // Fetch token from cookies
  const token = req.cookies?.adminToken;

  if (!token) {
    return res.status(401).json({ error: "Authentication token required" });
  }

  try {
    const { _id } = jwt.verify(token, process.env.ADMIN_JWT_SECRET);

    if (!_id) {
      return res.status(400).json({ error: "Token is invalid or expired" });
    }

    req.admin = await Admin.findById({ _id }).select("merchant_id"); // Fetch admin data

    next();
  } catch (error) {
    res.status(401).json({ error: "Request is not authorized" });
  }
};

module.exports = adminRequireAuth;
