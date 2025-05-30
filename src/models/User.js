import { Schema, model } from "mongoose";
import { nanoid } from "nanoid";

const UserSchema = new Schema(
    {
        handle: {
            type: String,
            required: true,
            unique: true,
            lowercase: true,
            trim: true,
        },
        displayName: {
            type: String,
            required: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            validate: {
                validator: (email) => {
                    return /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,6}$/.test(email);
                },
                message: (props) => `${props.value} is not a valid email`,
            },
        },
        passwordHash: {
            type: String,
            minlength: 4,
            required: true
        },
        authProvider: {
            type: String,
            enum: ["email", "google", "apple"],
            default: "email",
        },
        avatar: {
            type: String,
            default: "",
        },
        description: {
            type: String,
            maxlength: 160,
            default: "",
        },
        gender: {
            type: String,
            enum: ["male", "female", "custom", "N/A"],
            default: "N/A"
        },
        birthDate: {
            type: Date,
            default: null,
        },
        location: {
            type: String,
            default: "",
        },
        isHidden: {
            type: Boolean,
            default: false,
        },
        trustScore: {
            type: Number,
            default: 1,
        },
        role: {
            type: String,
            enum: ["user", "admin"],
            default: "user",
        },
        emailVerificationToken: {
            type: String,
            default: () => nanoid(4),
        },
        emailVerified: {
            type: Boolean,
            default: false,
        },
        lastLogin: {
            type: Date,
            default: null,
        },
        referralUserId: {
            type: Schema.Types.ObjectId,
            ref: "users",
            default: null,
        }
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Indexes útiles para búsquedas y ranking
// UserSchema.index({ handle: 1 });
UserSchema.index({ role: 1 });
// UserSchema.index({ email: 1 });

const UserModel = model("users", UserSchema);
export default UserModel;