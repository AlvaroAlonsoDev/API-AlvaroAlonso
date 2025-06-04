import mongoose, { connect } from "mongoose";

async function dbConnect() {
    mongoose.set('strictQuery', false);
    // Usa la base de datos de test si estás en test
    const DB_URI = process.env.NODE_ENV === "test"
        ? process.env.DB_URI_TEST
        : process.env.DB_URI;
    await connect(DB_URI);
}

export default dbConnect;