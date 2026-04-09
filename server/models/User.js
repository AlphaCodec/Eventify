import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name:     { type: String, required: true },
    email:    { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
    role:     { type: String, enum: ['user', 'admin'], default: 'user' },
    avatar:   { type: String, default: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100' },
  },
  { timestamps: true }
);

const User = mongoose.model('User', userSchema);
export default User;
