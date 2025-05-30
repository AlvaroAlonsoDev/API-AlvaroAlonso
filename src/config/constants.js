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
    email: `test@test.com`,
    password: "test1234",
    handle: `testhandle`,
    displayName: "Follow Test User"
};

export const targetUserId = "68372fb26e490b47e8777793";