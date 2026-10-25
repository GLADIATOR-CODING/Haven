import mongoose from 'mongoose';

const claimAnswerSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, default: '' },
    value: { type: String, default: '' },
  },
  { _id: false }
);

const autoCheckSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    result: { type: String, enum: ['match', 'needs_review', 'no_match'], required: true },
  },
  { _id: false }
);

const claimSchema = new mongoose.Schema(
  {
    orgId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Organization',
      required: true,
      index: true,
    },
    foundId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
      required: true,
      index: true,
    },
    lostId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
    claimantId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    answers: [claimAnswerSchema],
    autoCheck: [autoCheckSchema],
    status: {
      type: String,
      enum: ['submitted', 'needs_info', 'approved', 'rejected', 'collected'],
      default: 'submitted',
      index: true,
    },
    moderatorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    decisionNote: {
      type: String,
      default: '',
    },
    handoverCode: {
      type: String,
      default: '',
    },
    handoverAttempts: {
      type: Number,
      default: 0,
    },
    decidedAt: {
      type: Date,
    },
  },
  {
    timestamps: true,
  }
);

// Unique partial index for active claims by claimant to prevent duplicate concurrent claims
claimSchema.index(
  { orgId: 1, foundId: 1, claimantId: 1 },
  {
    unique: true,
    partialFilterExpression: {
      status: { $in: ['submitted', 'needs_info', 'approved'] },
    },
  }
);
claimSchema.index({ orgId: 1, status: 1, createdAt: -1 });

export const Claim = mongoose.model('Claim', claimSchema);
