const jwt = require("jsonwebtoken");
const User = require("../models/UserModel");
//right user in service
const protect = async (req, res, next) => {
  //get the token the user is passing
  let token;
  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith("Bearer")
    
  ) {
    try {
      token = req.headers.authorization.split(" ")[1];
      console.log("Token received:", token);
      const decoded = jwt.verify(token, process.env.JWT_SECRET);//if token is valid it returns the payload
      req.user = await User.findById(decoded.id).select("-password");
      console.log(req.user);

      next();
    } catch (error) {
      res.status(401).json({ message: "Not authorized, token failed" });
    }
  }
  if (!token) {
    res.status(401).json({ message: "Not authorized, token not found" });
  }
};
//only admin
const isAdmin = async (req, res, next) => {
  try {
    if (req.user && req.user.isAdmin) {
      next();
    } else {
      res.status(403).json({ message: "Not authorized admin only" });
    }
  } catch (error) {
    res.status(401).json({ message: "Not authorized " });
  }
};

module.exports = { protect, isAdmin };