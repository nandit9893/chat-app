import mongoose, { Schema } from "mongoose";

const chatSchema = new Schema(
  {
    lastMessage: {
      type: String
    },
    messageId: {
      type: Schema.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    messageSeen: {
      type: Boolean,  
      default: false, 
    },
    receiverId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    senderId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true, 
  }
);

export const Chat = mongoose.model("Chat", chatSchema);
