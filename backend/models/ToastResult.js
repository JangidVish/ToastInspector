const mongoose = require('mongoose');

const toastResultSchema = new mongoose.Schema({
    imageUrl: {
        type: String,
        required: false // Optional, since we use memory upload we won't host the image URL by default unless requested (user asked "simple schema: imageUrl, category, reason, timestamp")
    },
    category: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

module.exports = mongoose.model('ToastResult', toastResultSchema);
