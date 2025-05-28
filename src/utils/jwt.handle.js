import pkg from 'jsonwebtoken';
import { expiresToken } from '../config/config.js';
const { sign, verify } = pkg;

const JWT_SECRET = process.env.JWT_SECRET || "token.01010101";

export const generateToken = (_id) => {
    const jwt = sign({ _id }, JWT_SECRET, {
        expiresIn: expiresToken,
    });
    return jwt;
};

export const verifyToken = (jwt) => {
    const isOk = verify(jwt, JWT_SECRET);
    return isOk;
};

export const getToken = (data) => {
    const jwt = data.split(" ").pop();
    return jwt;
}
