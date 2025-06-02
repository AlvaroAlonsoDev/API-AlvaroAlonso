// models/Post.js
import { Schema, model } from "mongoose";

const PostSchema = new Schema(
    {
        author: { type: Schema.Types.ObjectId, ref: "users", required: true },
        content: { type: String, required: true, maxlength: 280 }, // Puedes ajustar el límite

        // Si este post es respuesta a otro post:
        replyTo: { type: Schema.Types.ObjectId, ref: "posts", default: null },

        // Si quieres hilos tipo Twitter, puedes agregar esto:
        threadRoot: { type: Schema.Types.ObjectId, ref: "posts", default: null },

        // Para adjuntos tipo imagen/video en el futuro:
        media: [{ type: String }], // URLs o ids

        // Estadísticas simples (puedes incrementar aquí y tener consultas más rápidas)
        repliesCount: { type: Number, default: 0 },
        likesCount: { type: Number, default: 0 },
        // Si tuvieras sistema de “retweet” puedes añadir:
        repostsCount: { type: Number, default: 0 },

        // Estado del post
        deleted: { type: Boolean, default: false },
    },
    { versionKey: false, timestamps: true }
);

// Indices para búsquedas rápidas (usuario, raíz de hilo, respuesta...)
PostSchema.index({ author: 1, createdAt: -1 });
PostSchema.index({ replyTo: 1 });
PostSchema.index({ threadRoot: 1 });

const PostModel = model("posts", PostSchema);
export default PostModel;
