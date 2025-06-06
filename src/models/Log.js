import mongoose from "mongoose";

const LogSchema = new mongoose.Schema(
    {
        level: { type: String, enum: ["info", "warn", "error"], required: true },
        message: { type: String, required: true },
        meta: { type: Object }, // Opcional: para datos extra
        user: { type: mongoose.Schema.Types.ObjectId, ref: "User" }, // Opcional
    },
    { timestamps: true }
);

export default mongoose.model("Log", LogSchema);
