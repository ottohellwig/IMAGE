const express = require("express");
const fileUpload = require("express-fileupload");
const cookieParser = require("cookie-parser");
const cors = require("cors");
const path = require("path");
require("dotenv").config();

const app = express();
app.use(
  cors({
    origin: "http://ec2-3-106-55-3.ap-southeast-2.compute.amazonaws.com:3000",
  })
);
app.use(express.json());
app.use(fileUpload());
app.use(cookieParser());

app.use(express.static("public"));

const userRoutes = require("./routes/userRoutes")();
const imageRoutes = require("./routes/imageRoutes")();
const imageController = require("./controllers/imageController")();

// Define the /upload endpoint
app.post("/upload", imageController.uploadImage);

// Use the routes
app.use("/users", userRoutes);
app.use("/images", imageRoutes);
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
