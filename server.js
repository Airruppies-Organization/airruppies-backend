require("dotenv").config();
const mongoose = require("mongoose");
const express = require("express");
const cors = require("cors");
const productRoutes = require("./router/routes");
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
app.use("/api", productRoutes);

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
