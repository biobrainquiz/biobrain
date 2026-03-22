const User = require("../../models/User");
const Role = require("../../models/Role");
const getDevice = require("../../utils/getDevice"); 
const logger = require("../../utils/logger");

// GETS USERS ROLE MANAGEMENT ON DASHBOARD
exports.usersRoles = async (req, res) => {
    const users = await User.find().populate("roles").sort({ username: 1 });
    const databaseRoles = await Role.find().sort({ role: 1 });
    res.render(`pages/${getDevice(req)}/admin/userroles`, { users,databaseRoles });
};

exports.addRole = async (req, res) => {
  try {
    const { userId, role: roleId } = req.body;

    if (!userId || !roleId) {
      return res.json({ success: false, msg: "User or role not specified" });
    }

    // 1️⃣ Fetch user
    const user = await User.findById(userId).populate("roles");
    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    // 2️⃣ Check if role exists in DB
    const role = await Role.findById(roleId);
    if (!role) {
      return res.json({ success: false, msg: "Role not found in database" });
    }

    // 3️⃣ Prevent duplicate role
    if (user.roles.some(r => r._id.equals(role._id))) {
      return res.json({ success: false, msg: "User already has this role" });
    }

    // 4️⃣ Add role
    user.roles.push(role._id);
    await user.save();

    return res.json({ success: true, msg: `Role '${role.role}' added successfully` });

  } catch (err) {
    logger.error("Add Role Error:", err);
    return res.json({ success: false, msg: "Server error while adding role" });
  }
};

exports.removeRole = async (req, res) => {
  try {
    const { userId, role: roleId } = req.body;

    if (!userId || !roleId) {
      return res.json({ success: false, msg: "User or role not specified" });
    }

    // 1️⃣ Fetch user
    const user = await User.findById(userId).populate("roles");
    if (!user) {
      return res.json({ success: false, msg: "User not found" });
    }

    // 2️⃣ Fetch role info
    const role = await Role.findById(roleId);
    if (!role) {
      return res.json({ success: false, msg: "Role not found in database" });
    }

    // 3️⃣ Rule: main admin cannot remove admin role
    if (user.username === "admin" && role.role === "admin") {
      return res.json({ success: false, msg: "Cannot remove 'admin' role from main admin user" });
    }

    // 4️⃣ Rule: other users cannot remove their default role
    const defaultRoles = ["student"]; // define your default roles here
    if (user.username !== "admin" && defaultRoles.includes(role.role)) {
      return res.json({ success: false, msg: `Cannot remove default role '${role.role}'` });
    }

    // 5️⃣ Remove role
    user.roles = user.roles.filter(r => !r._id.equals(role._id));
    await user.save();

    return res.json({ success: true, msg: `Role '${role.role}' removed successfully` });

  } catch (err) {
    logger.error("Remove Role Error:", err);
    return res.json({ success: false, msg: "Server error while removing role" });
  }
};
