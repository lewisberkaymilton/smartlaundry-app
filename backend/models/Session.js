const mongoose = require('mongoose');

const sessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    machine: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Machine',
      required: true,
    },
    block: {
      type: String,
      enum: ['A', 'B', 'C'],
      required: true,
    },
    machineType: {
      type: String,
      enum: ['Washer', 'Dryer'],
      required: true,
    },
    programme: {
      type: String,
      required: true,
      trim: true,
    },
    status: {
      type: String,
      enum: ['active', 'completed', 'cancelled'],
      default: 'active',
    },
    startTime: {
      type: Date,
      required: true,
      default: Date.now,
    },
    expectedEndTime: {
      type: Date,
      required: true,
    },
    endTime: {
      type: Date,
      default: null,
    },
    durationSeconds: {
      type: Number,
      required: true,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Session', sessionSchema);
