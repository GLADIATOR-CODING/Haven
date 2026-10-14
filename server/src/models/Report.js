import mongoose from 'mongoose';

const privateDetailSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    kind: { type: String, enum: ['secret', 'text'], default: 'text' },
    value: { type: String }, // Plaintext hint for moderator review
    valueHash: { type: String }, // Normalized HMAC hash for secret checks
  },
  { _id: false }
);

const reportSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ['lost', 'found'],
      required: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['pending_review', 'published', 'claim_pending', 'handed_over', 'expired', 'rejected', 'open', 'matched', 'resolved'],
      required: true,
      index: true,
    },
    reporterId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    category: {
      type: String,
      required: true,
      index: true,
    },
    title: {
      type: String,
      trim: true,
      default: '',
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    colors: [{ type: String }],
    brand: {
      type: String,
      trim: true,
      default: '',
    },
    location: {
      type: String, // Location key from org configuration
      required: true,
    },
    locationNote: {
      type: String,
      trim: true,
      default: '',
    },
    occurredFrom: {
      type: Date,
      required: true,
    },
    occurredTo: {
      type: Date,
      required: true,
    },
    photo: {
      url: { type: String, default: '' },
      publicId: { type: String, default: '' },
    },
    geo: {
      lat: { type: Number },
      lng: { type: Number },
      accuracy: { type: Number },
    },
    privateDetails: {
      type: [privateDetailSchema],
      select: false, // Default omitted by Mongoose
    },
    expiresAt: {
      type: Date,
      required: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for high-speed candidate matching and user filtering
reportSchema.index({ orgId: 1, type: 1, status: 1, category: 1, occurredFrom: 1 });
reportSchema.index({ orgId: 1, reporterId: 1, createdAt: -1 });

export const Report = mongoose.model('Report', reportSchema);
