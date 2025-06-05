import { Schema, model } from "mongoose";
import { VALID_RATING_ASPECTS } from "../config/constants.js";

const RatingSchema = new Schema(
    {
        fromUser: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        toUser: {
            type: Schema.Types.ObjectId,
            ref: "users",
            required: true,
        },
        ratings: {
            type: Object, // antes era Map
            required: true,
            validate: {
                validator: function (val) {
                    const keys = Object.keys(val);
                    const validKeys = keys.every((k) => VALID_RATING_ASPECTS.includes(k));
                    return validKeys && keys.length >= 1 && keys.length <= VALID_RATING_ASPECTS.length;
                },
                message: `Las valoraciones deben contener entre 1 y ${VALID_RATING_ASPECTS.length} aspectos válidos: ${VALID_RATING_ASPECTS.join(", ")}`,
            },
        },
        comment: {
            type: String,
            maxlength: 250,
            default: "",
        },
        weight: {
            type: Number,
            default: 1, // Calcular dinámicamente
        },
        visibility: {
            type: Boolean,
            default: true,
        },
    },
    {
        timestamps: true,
        versionKey: false,
    }
);

// Índices importantes
RatingSchema.index({ toUser: 1 });
RatingSchema.index({ fromUser: 1, toUser: 1 }, { unique: true });

const RatingModel = model("ratings", RatingSchema);
export default RatingModel;
