const Result = require("../models/Result");
const logger = require("../utils/logger");
const getDevice = require("../utils/getDevice");

// ==============================
// HOME PAGE CONTROLLER
// ==============================
exports.getHomePage = async (req, res) => {
    
    console.log("Controller hit");

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

        //console.log(leaderboard);
        console.log("Controller leaderboard:", leaderboard.length);
        console.log("Device:", device);
        res.render(`pages/${device}/index`, { leaderboard: [] , currentuser: req.user || null});
        /*res.render("desktop/home/index", {
            leaderboard,
            currentuser: req.user || null
        });*/

    } catch (error) {
        logger.error("Error loading homepage:", error);

        res.render(`pages/${device}/index`, { leaderboard: [], currentuser: req.user || null });

        /*res.render("desktop/home/index", {
                    leaderboard: [],
                    currentUser: req.user || null
                });*/
    }
};