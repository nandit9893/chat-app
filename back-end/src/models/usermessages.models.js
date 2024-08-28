import mongoose, { Schema } from "mongoose";

const messageSchema = new Schema(
  {
    messages: [
      {
        senderId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        content: {
          type: String,
          required: false,
        },
        timestamp: {
          type: Date,
          default: Date.now,
        },
        imageUrl: {
          type: String,
          default: ""
        }
      },
    ],
  },
  {
    timestamps: true,
  }
);

export const Message = mongoose.model("Message", messageSchema);
