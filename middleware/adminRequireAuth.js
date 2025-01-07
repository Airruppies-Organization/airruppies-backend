const jwt = require("jsonwebtoken");
const Admin = require("../schema/adminSchema");

const adminRequireAuth = async (req, res, next) => {
  // verify authentication
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Authorisation token required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const { _id } = jwt.verify(token, process.env.ADMIN_JWT_SECRET);
      if (!_id) {
      res.status(400).json({ error: "Token already expired" });
    }
    req.admin = await Admin.findById({ _id }).select("merchant_id"); // it is this id that we will use for datafetching

    next();
  } catch (error) {
    res.status(401).json({ error: "Request is not authorized" });
  }
};

module.exports = adminRequireAuth;
