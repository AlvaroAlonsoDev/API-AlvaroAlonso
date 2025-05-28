// models/CircleFollow.js
import { Schema, model } from "mongoose";

const FollowSchema = new Schema(
    {
        follower: { type: Schema.Types.ObjectId, ref: "users", required: true },
        following: { type: Schema.Types.ObjectId, ref: "users", required: true },
        createdAt: { type: Date, default: Date.now },
    },
    { versionKey: false }
);

FollowSchema.index({ follower: 1, following: 1 }, { unique: true });

const FollowModel = model("follows", FollowSchema);
export default FollowModel;
