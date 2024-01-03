import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  accountType: {
    type: String,
    required: true,
    default: 'Patron'
  },
  followers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  following: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reviews: [{
    artworkId: mongoose.Schema.Types.ObjectId,
    review: String
  }],
  followedArtistArtworkCounts: {
    type: Map,
    of: Number
  }
}, { collection: 'users' });

export default mongoose.model('User', userSchema);
