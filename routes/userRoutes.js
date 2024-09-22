const express = require("express");
const userController = require("../controllers/userController")();
const { isAdmin } = require("../middleware/roleMiddleware");

module.exports = () => {
  const router = express.Router();

  router.post("/signup", userController.signup);
  router.post("/confirm", userController.confirmEmail);
  router.post("/login", userController.login);
  router.post("/logout", userController.logout);

  // Protected route example
  router.get("/admin", isAdmin, (req, res) => {
    res.json({ message: "Welcome, Admin!" });
  });

  return router;
};
