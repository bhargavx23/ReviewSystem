const jwt = require("jsonwebtoken");
const User = require("../../models/User");
const Batch = require("../../models/Batch");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");

    if (!token) {
      return res
        .status(401)
        .json({ message: "No token, authorization denied" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // If token belongs to a student
    if (decoded.role === "student") {
      // If token includes sid -> batch session flow
      if (decoded.sid) {
        // Do not mix include and exclude in select(); exclude OTP fields only so studentSession is returned
        const batch = await Batch.findById(decoded.id).select(
          "-otp -otpExpires",
        );
        if (!batch)
          return res.status(401).json({ message: "Token is not valid" });

        // ensure stored session exists and matches sid and is not expired
        if (
          !batch.studentSession ||
          !batch.studentSession.id ||
          batch.studentSession.id !== decoded.sid
        ) {
          if (process.env.DEBUG_SESSION === "1") {
            console.log("[SESSION] mismatch: decoded.sid=", decoded.sid);
            console.log("[SESSION] stored=", batch.studentSession);
          }
          return res
            .status(401)
            .json({ message: "Session invalid or expired" });
        }

        const sessExpires = batch.studentSession.expires
          ? new Date(batch.studentSession.expires).getTime()
          : 0;

        if (process.env.DEBUG_SESSION === "1") {
          console.log(
            "[SESSION] decoded.sid=",
            decoded.sid,
            "stored.sid=",
            batch.studentSession.id,
          );
          console.log(
            "[SESSION] sessExpires=",
            sessExpires,
            "now=",
            Date.now(),
          );
        }

        if (!sessExpires || sessExpires < Date.now()) {
          return res
            .status(401)
            .json({ message: "Session invalid or expired" });
        }

        // Normalize user-like object for downstream code
        req.user = {
          id: batch._id,
          role: "student",
          batch: batch,
        };
        return next();
      }

      // Otherwise treat as a normal User record (legacy or explicit student user)
      const user = await User.findById(decoded.id).select("-otp -otpExpires");
      if (!user) return res.status(401).json({ message: "Token is not valid" });
      req.user = user;
      return next();
    }

    // Otherwise, treat as normal User
    const user = await User.findById(decoded.id).select("-otp -otpExpires");

    if (!user) {
      return res.status(401).json({ message: "Token is not valid" });
    }

    req.user = user;
    next();
  } catch (err) {
    res.status(401).json({ message: "Token is not valid" });
  }
};

const roleAuth = (roles) => (req, res, next) => {
  const role = req.user && req.user.role ? req.user.role : req.user?.role;
  if (!roles.includes(role)) {
    return res.status(403).json({ message: "Access denied" });
  }
  next();
};

module.exports = { auth, roleAuth };
