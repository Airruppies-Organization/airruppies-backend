const jwt = require("jsonwebtoken");
const Cashier = require("../schema/cashierSchema");

const cashierRequireAuth = async (req, res, next) => {
  // verify authentication

  const token = req.cookies?.cashierToken;

  if (!token) {
    return res.status(401).json({ error: "Authentication token required" });
  }

  try {
    const { _id } = jwt.verify(token, process.env.CASHIER_JWT_SECRET);

    req.cashier = await Cashier.findById({ _id }).select("merchant_id"); // it is this id that we will use for datafetching

    next();
  } catch (error) {
    res.status(401).json({ error: "Request is not authorized" });
  }
};

module.exports = cashierRequireAuth;
