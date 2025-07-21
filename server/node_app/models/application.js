import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  question: { type: String, required: true },
  _id: false,
});

const sectionSchema = new mongoose.Schema({
  id: { type: String, required: true },
  sectionName: { type: String, required: true },
  questions: [questionSchema],
  _id: false,
});

const attachmentSchema = new mongoose.Schema({
  $id: String,
  bucketId: String,
  $createdAt: String,
  $updatedAt: String,
  $permissions: [String],
  name: String,
  signature: String,
  mimeType: String,
  sizeOriginal: Number,
  chunksTotal: Number,
  chunksUploaded: Number,
}, { _id: false });




const applicationSchema = new mongoose.Schema({
  companyName: {
    type: String,
    required: true,
    trim: true,
  },
  logo: {
    type: String,
    required: true,
    trim: true,
  },
  domain: {
    type: String,
    required: true,
    trim: true,
  },
  role: {
    type: String,
    required: true,
    trim: true,
  },
  location: {
    type: String,
    required: true,
    trim: true,
  },
  source: {
    type: String,
    required: true,
    trim: true,
  },
  jobPostLink: {
    type: String,
    required: true,
    trim: true,
  },
  jobType: {
    type: String,
    required: true,
    trim: true,
  },
  status: {
    type: String,
    enum: ["saved", "applied", "interviewing", "offered", "rejected"],
    required: true,
  },
  statusTimestamps: {
    applied: {
      type: Date,
    },
    interviewing: {
      type: Date,
    },
    offered: {
      type: Date,
    },
    rejected: {
      type: Date,
    },
  },
  description: {
    type: String,
    required: true,
    trim: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  interviewQuestions: [sectionSchema],
  attachments:[attachmentSchema],
});

const Application = mongoose.model("Application", applicationSchema);

export { Application };
