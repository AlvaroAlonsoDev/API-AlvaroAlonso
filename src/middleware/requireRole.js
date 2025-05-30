/**
 * Middleware que verifica si el usuario tiene el rol necesario (o superior).
 * Uso: router.delete(..., authMiddleware, requireRole("admin"), ...)
 */

const ROLE_HIERARCHY = {
    user: 1,
    admin: 2,
    test: 3,
    root: 4,
};

export const requireRole = (requiredRole) => {
    return (req, res, next) => {
        try {
            const user = req.user;

            if (!user || !user.role) {
                return res.status(401).json({
                    message: "No autenticado",
                    errorCode: "UNAUTHORIZED",
                });
            }

            const userRoleLevel = ROLE_HIERARCHY[user.role] || 0;
            const requiredRoleLevel = ROLE_HIERARCHY[requiredRole] || Infinity;

            if (userRoleLevel < requiredRoleLevel) {
                return res.status(403).json({
                    message: `Acceso restringido a usuarios con rol "${requiredRole}" o superior`,
                    errorCode: "FORBIDDEN",
                });
            }

            next();
        } catch (error) {
            return res.status(500).json({
                message: "Error al verificar rol",
                errorCode: "ROLE_CHECK_FAILED",
                errorDetails: error,
            });
        }
    };
};
