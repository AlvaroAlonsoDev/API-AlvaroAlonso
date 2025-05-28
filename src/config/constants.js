// Campos que se deben excluir al devolver datos del usuario al frontend
export const restrictedFields = [
    "passwordHash",
    "verifyPhone",
    "verifyEmail",
    "__v",
    "accountStatus",
    "emailVerificationToken",
    "trustScore"
];
