const Result = require("../models/Result");
const logger = require("../utils/logger");
const getDevice = require("../utils/getDevice");

// ==============================
// HOME PAGE CONTROLLER
// ==============================
exports.getHomePage = async (req, res) => {
    
    const device = getDevice(req);
    try {
        
        // 🔥 Top 5 leaderboard (best score per user)
        const leaderboard = await Result.aggregate([
            {
                $group: {
                    _id: "$userid",
                    username: { $first: "$username" },
                    finalscore: { $max: "$finalscore" },
                    accuracy: { $max: "$accuracy" }
                }
            },
            { $sort: { finalscore: -1 } },
            { $limit: 5 }
        ]);
        res.render(`pages/${device}/index`, { leaderboard, currentuser: req.user || null});
    } catch (error) {
        logger.error("Error loading homepage:", error);
        res.render(`pages/${device}/index`, { leaderboard: [], currentuser: req.user || null });
    }
};