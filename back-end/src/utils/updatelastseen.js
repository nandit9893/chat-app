import { User } from "../models/user.models.js";

const updataeLastSeen = async (req, res, next) => {
  try {
    if (req.user && req.user._id) {
      await User.findByIdAndUpdate(
        req.user._id,
        { lastSeen: new Date() },
        { new: true }
      );
    }
    next(); 
  } catch (error) {
    console.error("Error updating lastSeen:", error);
    next(); 
  }
};

export default updataeLastSeen;
