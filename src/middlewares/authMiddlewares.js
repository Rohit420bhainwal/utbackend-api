const jwt = require("jsonwebtoken");

module.exports = (roles = [], appType = null) => {
  return (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ message: "No token provided" });
      }

      const token = authHeader.split(" ")[1];
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      req.user = decoded;
      // ✅ Role check
      if (roles.length && !roles.includes(decoded.role)) {
        return res.status(403).json({   message: `Access denied. Your role: ${decoded.role}`, });
      }

      // ✅ App check
      if (appType) {
        const clientApp = req.headers["x-app-type"];
        if (!clientApp || clientApp !== appType) {
          return res.status(403).json({ message: "Access denied (app)" });
        }
      }

   
      next();
    } catch (err) {
      return res.status(401).json({ message: "Invalid token" });
    }
  };
};
