export const expiresToken = "100h";

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
    email: `test${Date.now()}@test.com`,
    password: "test1234",
    handle: `testhandle${Date.now()}`,
    displayName: "Follow Test User"
};

export const targetUserId = "68372fb26e490b47e8777793";

export const VALID_RATING_ASPECTS = [
    "sincerity",
    "kindness",
    "trust",
    "vibe",
    "responsibility"
];