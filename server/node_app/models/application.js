import mongoose from "mongoose";

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
});

const Application = mongoose.model("Application", applicationSchema);

export { Application };
