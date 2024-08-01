import { Schema, model } from "mongoose";

export interface IUser {
  username: string;
  passwordHash: string;
}

const userSchema = new Schema<IUser>({
  username: { type: String, required: true },
  passwordHash: { type: String, required: true },
});

userSchema.set("toJSON", {
  transform: (document, returnedObject) => {
    returnedObject.id = returnedObject._id.toString();
    returnedObject._id = undefined;
    returnedObject.__v = undefined;
    returnedObject.passwordHash = undefined;
  },
});

const User = model<IUser>("User", userSchema);

export default User;
