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

export const testUser = {
    email: "followtestuser@example.com",
    password: "test1234",
    handle: "followtesthandle",
    displayName: "Follow Test User"
};

export const targetUserId = "68372fb26e490b47e8777793";