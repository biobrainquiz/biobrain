const User = require("../models/User");
logger = require("../utils/logger");

function authorize(...allowedRoles) {
    return async (req, res, next) => {

        if (!req.session.user?._id) {
            return res.redirect("/authentication/login");
        }

        try {
            // 🔥 Always get latest data from DB
            const user = await User.findById(req.session.user._id).populate("roles");

            if (!user) {
                return res.redirect("/authentication/login");
            }

            const userRoles = user.roles.map(r => r.role);
            const hasRole = userRoles.some(role =>
                allowedRoles.includes(role)
            );

            if (!hasRole) {
                return res.status(403).render("errors/403");
            }

            // optional: attach fresh user
            req.user = user;

            next();

        } catch (err) {
            logger.error("Error authorizing user:", err);
            return res.status(500).send("Server Error");
        }
    };
}

/*function authorize1(...allowedRoles) {
    return (req, res, next) => {
        
        const user = req.session.user;
        if (!user)
            return res.redirect("/authentication/login");
        const userRoles = user.roles.map(r => r.role);
         const hasRole = userRoles.some(role =>
            allowedRoles.includes(role)
        );

        if (!hasRole)
            return res.status(403).render("errors/403");
        next();

    };
}*/
module.exports = authorize;