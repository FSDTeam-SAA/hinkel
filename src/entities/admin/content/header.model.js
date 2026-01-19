import mongoose from 'mongoose';

const HeaderSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    subtitle: { type: String }
  },
  { timestamps: true }
);

const Header = mongoose.model('Header', HeaderSchema);
export default Header;
