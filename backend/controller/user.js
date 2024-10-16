const Review= require('../database/review');


const addReview = async (userId, productId, rating, comment) => {
    try {
    //   // Check if the user has booked the product in any of the three booking types
    //   const accommodationBooking = await AccommodationBooking.findOne({ userId, productId, status: 'completed' });
    //   const tourGuideBooking = await TourGuideBooking.findOne({ userId, productId, status: 'completed' });
    //   const transportationBooking = await TransportationBooking.findOne({ userId, productId, status: 'completed' });
  
    //   // If no booking found, restrict the review
    //   if (!accommodationBooking && !tourGuideBooking && !transportationBooking) {
    //     return { message: 'You can only review products you have booked.' };
    //   }
  
      // Create the review
    const review = new Review({ userId, productId, rating, comment });
    await review.save();

    // Find the product (service) to update its average rating
    const service = await Service.findById(productId);

    if (service) {
      // Calculate new average rating
      const newTotalReviews = service.totalReviews + 1;
      const newAverageRating = ((service.averageRating * service.totalReviews) + rating) / newTotalReviews;

      // Update service with new rating and review count
      service.averageRating = newAverageRating;
      service.totalReviews = newTotalReviews;
      await service.save();
    }

    return { message: 'Review added successfully and average rating updated' };
  } catch (error) {
    console.error('Error:', error); // Log the actual error
    return { message: 'Error adding review', error };
  }
  };
  


module.exports = {
    addReview,
}