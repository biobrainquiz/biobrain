const User = require("../../models/User");
const Role = require("../../models/Role");
const Subject = require("../../models/Subject");
const Unit = require("../../models/Unit");
const Topic = require("../../models/Topic");
const Question = require("../../models/Question");
const QuizResult = require("../../models/QuizResult");
const Exam = require("../../models/Exam");
const Payment = require("../../models/Payment"); // if exists
const getDevice = require("../../utils/getDevice"); // if you use device-based views

// GETS USERS ROLE MANAGEMENT ON DASHBOARD
exports.usersRoles = async (req, res) => {
    const users = await User.find().populate("roles").sort({ username: 1 });
    const databaseRoles = await Role.find().sort({ role: 1 });
    res.render(`pages/${getDevice(req)}/admin/userroles`, { users,databaseRoles });
};



exports.addRole1 = async (req, res) => {
    const { userId, role } = req.body;
    await User.updateOne(
        { _id: userId },
        { $addToSet: { roles: role } }
    );
    res.redirect(`/admin/userroles`);

};

exports.removeRole1 = async (req, res) => {
    const { userId, role } = req.body;
    await User.updateOne(
        { _id: userId },
        { $pull: { roles: role } }
    );
     res.redirect(`/admin/userroles`);
};

// controllers/userroleController.js


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
    console.error("Add Role Error:", err);
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
    console.error("Remove Role Error:", err);
    return res.json({ success: false, msg: "Server error while removing role" });
  }
};

exports.removeRole2 = async (req, res) => {
    try {
        const { userId, role } = req.body;

        // 1️⃣ Fetch user
        const user = await User.findById(userId).populate("roles");

        if (!user) {
            return res.json({ success: false, msg: "User not found" });
        }

        // 2️⃣ Prevent removing "admin" role from the main admin user
        const adminRole = user.roles.find(r => r.role === "admin");
        if (user.username === "admin" && adminRole && adminRole._id.toString() === role) {
            return res.json({ success: false, msg: "Cannot remove 'admin' role from main admin user" });
        }

        // 3️⃣ Remove the role
        await User.updateOne(
            { _id: userId },
            { $pull: { roles: role } }
        );
        //res.redirect(`/admin/userroles`);
        return res.json({ success: true, msg: "Role removed successfully" });

    } catch (err) {
        console.error(err);
        return res.json({ success: false, msg: "Server error" });
    }
};