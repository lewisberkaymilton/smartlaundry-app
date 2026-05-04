const mongoose = require('mongoose');

const machineSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Machine name is required'],
      trim: true,
    },
    block: {
      type: String,
      enum: ['A', 'B', 'C'],
      required: [true, 'Block is required'],
    },
    type: {
      type: String,
      enum: ['Washer', 'Dryer'],
      required: true,
      default: 'Washer',
    },
    status: {
      type: String,
      enum: ['Available', 'Washing', 'Out of Order'],
      default: 'Available',
    },
    currentUser: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      default: null,
    },
    currentSession: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Session',
      default: null,
    },
    currentUsageStart: {
      type: Date,
      default: null,
    },
    currentUsageEnd: {
      type: Date,
      default: null,
    },
    sessionDurationMinutes: {
      type: Number,
      default: 45,
    },
    programme: {
      type: String,
      default: null,
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model('Machine', machineSchema);
