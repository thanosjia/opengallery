import mongoose from 'mongoose';

const artworkSchema = new mongoose.Schema({
  Title: String,
  Artist: String,
  artistID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },
  Year: String,
  Category: String,
  Medium: String,
  Description: String,
  Poster: String,
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
  reviews: [{
    userId: mongoose.Schema.Types.ObjectId,
    review: String
  }]
}, { collection: 'artworks' });

export default mongoose.model('Artwork', artworkSchema);
