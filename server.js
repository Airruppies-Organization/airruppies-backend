require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const shopperRoutes = require("./router/shopperRoutes");
const userRoutes = require("./router/userRoutes");
const merchantRoutes = require("./router/merchantRoutes");
const adminRoutes = require("./router/adminAuthRoute");
const cashierAuthRoutes = require("./router/cashierAuthRoute");
const cashierRoutes = require("./router/cashierRoute");
// const pageGutter = require("./pageGutter");
// const { productFormat, cartFormat } = require("./SchemaModel/schema");

const app = express();

// middleware
app.use(express.json());

//cookie-parser
app.use(cookieParser());

// cors
// app.use(cors());
app.use(
  cors({
    origin: "http://localhost:3000", // Allow your frontend domain
    credentials: true, // Allow credentials (cookies)
  })
);

app.use((req, res, next) => {
  console.log(`${req.path} :: ${req.method}`);
  next();
});

// routes
app.use("/api", shopperRoutes);
app.use("/auth", userRoutes);
app.use("/merchant/admin/auth", adminRoutes);
app.use("/merchant/api", merchantRoutes);
app.use("/merchant/cashier/auth", cashierAuthRoutes);
app.use("/merchant/cashier", cashierRoutes);

// connecting to the database
mongoose
  .connect(process.env.DATABASE_URI)
  .then(() => {
    app.listen(process.env.PORT, () => {
      console.log(
        `connected to db and app is listening on PORT ${process.env.PORT}...`
      );
    });
  })
  .catch((err) => {
    console.log(err);
  });
