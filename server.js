require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const shopperRoutes = require("./router/shopperRoutes");
const userRoutes = require("./router/userRoutes");
const merchantRoutes = require("./router/merchantRoutes");
const adminRoutes = require("./router/adminRoutes");
// const pageGutter = require("./pageGutter");
// const { productFormat, cartFormat } = require("./SchemaModel/schema");

const app = express();

// middleware
app.use(express.json());
app.use(cors());

app.use((req, res, next) => {
  console.log(`${req.path} :: ${req.method}`);
  next();
});

// routes
app.use("/api", shopperRoutes);
app.use("/auth", userRoutes);
app.use("/merchant/admin/auth", adminRoutes);
app.use("/merchant/api", merchantRoutes);

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
