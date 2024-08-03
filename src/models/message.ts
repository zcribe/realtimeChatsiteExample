import { Schema, model } from "mongoose";

export interface IMessage {
  message: string;
  author: string;
}

const messageSchema = new Schema<IMessage>({
  message: { type: String, required: true },
  author: { type: String, required: true }
});

messageSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    returnedObject._id = undefined;
    returnedObject.__v = undefined;
  },
});

const Message = model<IMessage>("Message", messageSchema);

export default Message;
