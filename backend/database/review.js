const reviewSchema = new mongoose.Schema({
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user who made the review
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }, // Reference to the product being reviewed
    rating: { type: Number, required: true, min: 1, max: 5 }, // Rating between 1 to 5 stars
    comment: String, // Optional comment
    createdAt: { type: Date, default: Date.now } // Timestamp for the review
  });
  
  const Review = mongoose.model('Review', reviewSchema);
  