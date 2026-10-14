import mongoose from 'mongoose';

const matchSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    lostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    foundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    band: {
      type: String,
      enum: ['high', 'possible'],
      required: true,
    },
    breakdown: {
      time: { score: Number, weight: Number, raw: String },
      location: { score: Number, weight: Number, raw: String },
      colors: { score: Number, weight: Number, raw: String },
      text: { score: Number, weight: Number, raw: String },
    },
    explanation: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: ['suggested', 'dismissed', 'claimed'],
      default: 'suggested',
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound unique index ensuring no duplicate matches between the same pair
matchSchema.index({ lostId: 1, foundId: 1 }, { unique: true });
matchSchema.index({ orgId: 1, status: 1, score: -1 });

export const Match = mongoose.model('Match', matchSchema);
