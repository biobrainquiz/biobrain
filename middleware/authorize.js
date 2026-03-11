function authorize(...allowedRoles) {
    return (req, res, next) => {
        
        const user = req.session.user;
        if (!user)
            return res.redirect("/login");
        const userRoles = user.roles.map(r => r.role);
         const hasRole = userRoles.some(role =>
            allowedRoles.includes(role)
        );

        if (!hasRole)
            return res.status(403).render("errors/403");
        next();

    };
}
module.exports = authorize;