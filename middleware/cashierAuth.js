const jwt = require("jsonwebtoken");
const Cashier = require("../schema/cashierSchema");

const cashierAuth = async (req, res, next) => {
  // verify authentication
  const { authorization } = req.headers;

  if (!authorization) {
    return res.status(401).json({ error: "Authorisation token required" });
  }

  const token = authorization.split(" ")[1];

  try {
    const { _id } = jwt.verify(token, process.env.CASHIER_JWT_SECRET);
    req.cashier = await Cashier.findById({ _id }).select("_id");

    next();
  } catch (error) {
    res.status(401).json({ error: "Request is not authorized" });
  }
};

module.exports = cashierAuth;
