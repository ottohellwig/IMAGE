const express = require("express");
const router = express.Router();
const { authenticate } = require("../middleware/authMiddleware");
const { isAdmin } = require("../middleware/roleMiddleware");
const { deleteImage } = require("../controllers/imageController");

module.exports = () => {
  const imageController = require("../controllers/imageController")();

  // Only authenticated users can upload images
  router.post("/upload", authenticate, imageController.uploadImage);

  // Only authenticated users can convert images
  router.post("/convert", imageController.convertImage);

  // Only authenticated users can list uploaded files
  router.get("/list", authenticate, imageController.listUploadedFiles);

  // Only admins can delete images
  router.post(
    "/delete-image",
    authenticate,
    isAdmin,
    imageController.deleteImage
  );

  return router;
};
