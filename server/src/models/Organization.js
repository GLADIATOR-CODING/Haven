import mongoose from 'mongoose';

const verificationPromptSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    kind: { type: String, enum: ['secret', 'text'], default: 'text' },
    required: { type: Boolean, default: false },
  },
  { _id: false }
);

const categorySchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    icon: { type: String, default: 'package' },
    keywords: [{ type: String }],
    sensitive: { type: Boolean, default: false },
    autoApproveClaims: { type: Boolean, default: false },
    verificationPrompts: [verificationPromptSchema],
  },
  { _id: false }
);

const locationSchema = new mongoose.Schema(
  {
    key: { type: String, required: true },
    label: { type: String, required: true },
    zone: { type: String, default: 'main' },
  },
  { _id: false }
);

const organizationSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true, index: true },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    templateKey: { type: String, default: 'blank' },
    join: {
      code: { type: String, unique: true, sparse: true, uppercase: true, trim: true },
      rotatedAt: { type: Date, default: Date.now },
      expiresAt: { type: Date, default: null },
      expiryDays: { type: Number, default: 30 },
    },
    allowedDomains: [{ type: String, lowercase: true, trim: true }],
    categories: [categorySchema],
    locations: [locationSchema],
    claimPolicy: {
      minMatchingDetails: { type: Number, default: 1 },
      maxAttempts: { type: Number, default: 3 },
    },
    matchSensitivity: {
      type: String,
      enum: ['strict', 'balanced', 'lenient'],
      default: 'balanced',
    },
    handoverInstructions: {
      type: String,
      default: 'Please visit the security / reception desk during working hours.',
    },
    expiryDays: { type: Number, default: 60 },
    timeWindowHours: { type: Number, default: 72 },
    aiEnabled: { type: Boolean, default: true },
    accentColor: { type: String, default: '#3b82f6' },
  },
  {
    timestamps: true,
  }
);

export const Organization = mongoose.model('Organization', organizationSchema);
