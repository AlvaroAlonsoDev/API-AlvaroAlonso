// models/PostLike.js
import { Schema, model } from "mongoose";

const PostLikeSchema = new Schema(
    {
        user: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: true
        },
        post: {
            type: Schema.Types.ObjectId,
            ref: "posts",
            required: true
        },
        createdAt: {
            type: Date,
            default: Date.now
        }
    },
    { versionKey: false }
);

// Un usuario solo puede dar like una vez a un post
PostLikeSchema.index({ user: 1, post: 1 }, { unique: true });

const PostLikeModel = model("post_likes", PostLikeSchema);
export default PostLikeModel;
