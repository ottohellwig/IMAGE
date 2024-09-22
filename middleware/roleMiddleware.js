const jwt = require("jsonwebtoken");

const isAdmin = (req, res, next) => {
  const token = req.cookies.token;
  if (!token) {
    return res.status(403).json({ message: "Access denied" });
  }

  try {
    const decodedToken = jwt.decode(token, { complete: true });
    console.log("Decoded token:", decodedToken); // Log the decoded token for debugging

    const groups = decodedToken.payload["cognito:groups"] || [];
    if (groups.includes("Admin")) {
      next();
    } else {
      res.status(403).json({ message: "Access denied" });
    }
  } catch (error) {
    console.error("Token decoding error:", error); // Log the error for debugging
    res.status(403).json({ message: "Access denied" });
  }
};

module.exports = { isAdmin };
