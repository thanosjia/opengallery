import mongoose from 'mongoose';

const workshopSchema = new mongoose.Schema({
  Title: String,
  Host: String,
  Description: String,
  enrolledUsers: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { collection: 'workshops' });

export default mongoose.model('Workshop', workshopSchema);
