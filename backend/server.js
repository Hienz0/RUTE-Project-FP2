const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const cors = require('cors');
const nodemailer = require("nodemailer");
require('mongoose');
const autoIncrement = require('mongoose-sequence')(mongoose);
const path = require('path');
const providerControll = require('./controller/provider');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { type } = require('os');
const fs = require('fs');
const cron = require('node-cron');

const app = express();
const PORT = 3000;

app.use(cors({
  origin: 'http://localhost:4200',
  credentials: true // if you're using cookies or authentication headers
}));

// Middleware
app.use(express.json({ limit: '50mb' }));
app.use(bodyParser.json());
// app.use(bodyParser.json({ limit: '1000mb' })); // Increase the limit as needed
// app.use(bodyParser.urlencoded({ limit: '1000mb', extended: true })); // Increase the limit as needed


// Connect to MongoDB
mongoose.connect('mongodb://127.0.0.1:27017/rute', {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
});

const db = mongoose.connection;
db.on('error', console.error.bind(console, 'connection error:'));
db.once('open', () => {
  console.log('Connected to MongoDB');
});




// Secret key for token generation
const secretKey = 'your_secret_key_here';

// Function to generate a token
function generateToken(user) {
  // Generate token using user information and secret key
  return jwt.sign({ userId: user._id, name: user.name, email: user.email }, secretKey, { expiresIn: '1h' }); // Token expires in 1 hour
}



/////////////////

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: function(req, file, cb) {
    cb(null, 'uploads/');
  },
  filename: function(req, file, cb) {
    cb(null, `${Date.now()}-${file.originalname}`);
  }
});
const upload = multer({ 
  storage: storage,
  limits: { 
    fieldSize: 1024 * 1024 * 100 // 100MB for field values in bytes
  } 
});

app.use('/uploads', express.static(path.join(__dirname, 'uploads')));



////////////////////////////////////



// Define user schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    address: String,
    contact: String,
    avatar: String,
    userType: { type: String, default: 'user' },  // Add userType with default value 'user'
  });
 
  const User = mongoose.model('User', userSchema);
 
/////////////////////////////////////////////////////////
// booking accomodation

// Define the accommodation booking schema
const bookingAccommodationSchema = new mongoose.Schema({
    guestName: {
        type: String,
        required: true,
        trim: true
    },
    accommodationType: {
        type: String,
        required: true,
        enum: ['Hotel', 'Apartment', 'Hostel', 'Guesthouse', 'Homestays']
    },
    numberOfGuests: {
        type: Number,
        required: true,
        min: 1
    },
    checkInDate: {
        type: Date,
        required: true
    },
    checkOutDate: {
        type: Date,
        required: true
    },
    specialRequest: {
        type: String,
        trim: true
    },
    bookingStatus: {
        type: String,
        default: 'Booked',  // Other possible statuses: 'Cancelled', 'CheckedIn', 'CheckedOut'
        enum: ['Booked', 'Complete', 'Waiting for payment','Cancelled', 'CheckedIn', 'CheckedOut']
    },

    serviceId: { // Add serviceId field
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
  },
  userId: { // Add userId field
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
  },
  accommodationId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Accommodation', required: true }, // Reference to Accommodation
  roomTypeId: { 
    type: mongoose.Schema.Types.ObjectId, 
    required: true }, // Reference to RoomType
  roomId: { type: mongoose.Schema.Types.ObjectId, 
    required: true }, // Reference to Room
  amount: {
    type: Number,
    required: true,
    min: 0
},
  paymentStatus: {
    type: String,
    default: 'Pending', // Other possible statuses: 'Paid', 'Failed'
    enum: ['Pending', 'Paid', 'Failed']
  },

  isReviewed: { type: Boolean, default: false },
}, { timestamps: true });

// Create the Booking model
const Booking = mongoose.model('AccommodationBooking', bookingAccommodationSchema);

module.exports = Booking;



// In your backend routes (e.g., bookingRoutes.js)
app.get('/api/bookings/accommodation/:serviceId', async (req, res) => {
  try {
      const bookings = await Booking.find({ serviceId: req.params.serviceId }).populate('userId accommodationId roomTypeId roomId');
      res.json(bookings);
  } catch (error) {
      res.status(500).json({ message: 'Error fetching bookings', error });
  }
});

app.get('/api/bookings/accommodation/user/:userId', async (req, res) => {
  const userId = req.params.userId;

  try {
    console.log('Fetching all bookings for userId :', userId);

    // Retrieve all tour bookings for the user, without using populate
    const allTourBookings = await TourBooking.find({ userId: userId });

    // Retrieve all accommodation bookings for the user, without using populate
    const allAccommodationBookings = await Booking.find({ userId: userId });

    // Retrieve all vehicle bookings for the user, without using populate
    const allVehicleBookings = await VehicleBooking.find({ userId: userId });

    console.log("Tour bookings:", allTourBookings);
    console.log("Accommodation bookings:", allAccommodationBookings);
    console.log("Vehicle bookings:", allVehicleBookings);

    // Combine and send the response with all types of bookings
    return res.status(200).json({
      tourBookings: allTourBookings,
      accommodationBookings: allAccommodationBookings,
      vehicleBookings: allVehicleBookings
    });
    
  } catch (error) {
    console.error("Error fetching bookings:", error);
    return res.status(500).json({ message: "Error fetching bookings", error });
  }
});





app.get('/api/bookings/booked-dates/:serviceId/:roomTypeId', async (req, res) => {
  try {
    const { serviceId, roomTypeId } = req.params;

    // Find all rooms for the given room type
    const accommodation = await Accommodation.findOne({ serviceId: serviceId });
    const roomType = accommodation.roomTypes.find(rt => rt._id.toString() === roomTypeId);

    if (!roomType) {
      return res.status(404).json({ message: 'Room type not found' });
    }

    const totalRooms = roomType.rooms.length;
    if (totalRooms === 0) {
      return res.json([]); // No rooms available, no dates to lock
    }

    // Find bookings for the specified service and room type, excluding canceled bookings
    const bookings = await Booking.find({
      serviceId: serviceId,
      roomTypeId: roomTypeId,
      bookingStatus: { $nin: ['Canceled by Provider', 'Canceled by Traveller', 'Complete'] }
    }, 'checkInDate checkOutDate roomId');

    // Count bookings per date
    const dateCounts = {};
    bookings.forEach(booking => {
      let currentDate = new Date(booking.checkInDate);
      while (currentDate <= booking.checkOutDate) {
        const dateStr = currentDate.toISOString().split('T')[0];

        if (!dateCounts[dateStr]) {
          dateCounts[dateStr] = new Set(); // Track booked rooms by date
        }
        dateCounts[dateStr].add(booking.roomId.toString());

        currentDate.setDate(currentDate.getDate() + 1);
      }
    });

    // Determine locked dates (where all rooms are booked)
    const lockedDates = Object.keys(dateCounts).filter(dateStr => dateCounts[dateStr].size >= totalRooms);

    res.json(lockedDates);
  } catch (error) {
    console.error('Error fetching booked dates:', error);
    res.status(500).json({ message: 'Error fetching booked dates' });
  }
});






// 

// Fetch all restaurant services (where productCategory is "Restaurant")
app.get('/api/services/restaurants', async (req, res) => {
  try {
    const restaurants = await Service.find({ productCategory: 'Restaurant' });
    res.status(200).json(restaurants);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching restaurants', details: error });
  }
});

// Fetch restaurant details by ID
app.get('/api/services/restaurant/:id', async (req, res) => {
  try {
    const restaurant = await Service.findById(req.params.id);
    if (!restaurant) {
      return res.status(404).json({ error: 'Restaurant not found' });
    }
    res.status(200).json(restaurant);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching restaurant details', details: error });
  }
});


// 

// 
// Route to handle booking accommodation
app.post('/api/bookings/accommodation', async (req, res) => {
  console.log('Request body:', req.body);
  
  try {
    const bookingData = {
      ...req.body,
      serviceId: req.body.serviceId,
      userId: req.body.userId,
      bookingStatus: 'Waiting for payment'
    };
    
    // Step 1: Create the booking
    const booking = new Booking(bookingData);
    await booking.save();
    
    // Step 2: Update the room status to 'booked' in the accommodation collection
    const { accommodationId, roomTypeId, roomId } = req.body;
    
    // Find the accommodation by its ID and update the room status
    const accommodation = await Accommodation.findOneAndUpdate(
      {
        _id: accommodationId,
        'roomTypes._id': roomTypeId,
        'roomTypes.rooms._id': roomId,
      },
      {
        $set: {
          'roomTypes.$[type].rooms.$[room].status': 'booked'
        }
      },
      {
        arrayFilters: [
          { 'type._id': roomTypeId },
          { 'room._id': roomId }
        ],
        new: true,
      }
    );

    // If accommodation not found, handle the error
    if (!accommodation) {
      return res.status(404).json({ error: 'Accommodation, Room Type, or Room not found.' });
    }

    // Step 3: Return the created booking and updated accommodation
    res.status(201).json({ booking, accommodation });
  } catch (error) {
    console.error('Error details:', error);
    res.status(400).json({ error: 'Error creating booking or updating room status', details: error });
  }
});


// PUT route to update booking status
app.put('/api/bookings/status/update/:id', async (req, res) => {
  try {
    const booking = await Booking.findByIdAndUpdate(
      req.params.id,
      { bookingStatus: req.body.bookingStatus },
      { new: true }
    );

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    res.json(booking);
  } catch (error) {
    res.status(500).json({ message: 'Error updating booking status', error });
  }
});

app.put('/api/bookings/cancel', async (req, res) => {
  const { bookingId, userType } = req.body;

  // Determine the new booking status based on the user type
  let newStatus;
  if (userType === 'Traveller') {
      newStatus = 'Canceled by Traveller';
  } else if (userType === 'Provider') {
      newStatus = 'Canceled by Provider';
  } else {
      return res.status(400).json({ message: 'Invalid user type' });
  }

  try {
      // Update the booking status
      const updatedBooking = await Booking.findByIdAndUpdate(
          bookingId,
          { bookingStatus: newStatus },
          { new: true }
      );

      if (!updatedBooking) {
          return res.status(404).json({ message: 'Booking not found' });
      }

      res.status(200).json({
          message: 'Booking canceled successfully',
          booking: updatedBooking
      });
  } catch (error) {
      console.error('Error canceling booking:', error);
      res.status(500).json({ message: 'Failed to cancel booking' });
  }
});



// Route to check room availability for specific dates
// app.get('/api/bookings/check-availability', async (req, res) => {  // Add missing "/"
//   try {
//     const { serviceId, roomNumber, checkInDate, checkOutDate } = req.query;

//     // Find overlapping bookings for the specified room and dates
//     const overlappingBookings = await Booking.find({
//       serviceId,
//       roomNumber,
//       $or: [
//         { checkInDate: { $lt: new Date(checkOutDate) }, checkOutDate: { $gt: new Date(checkInDate) } }
//       ]
//     });

//     // If overlapping bookings exist, room is unavailable
//     const isAvailable = overlappingBookings.length === 0;
//     res.status(200).json(isAvailable);
//   } catch (error) {
//     console.error('Error checking room availability:', error);
//     res.status(500).json({ message: 'Error checking room availability' });
//   }
// });

// Route to check room availability for specific dates
app.get('/api/bookings/check-availability', async (req, res) => {  
  try {
    const { serviceId, roomNumber, checkInDate, checkOutDate } = req.query;

    // Convert dates from string to Date objects for accurate comparisons
    const checkIn = new Date(checkInDate);
    const checkOut = new Date(checkOutDate);

    // Find overlapping bookings for the specified room and dates, excluding canceled bookings
    const overlappingBookings = await Booking.find({
      serviceId,
      roomNumber,
      bookingStatus: { $nin: ['Canceled by Provider', 'Canceled by Traveller', 'Complete'] },
      $or: [
        { 
          checkInDate: { $lt: checkOut },
          checkOutDate: { $gt: checkIn }
        },
        { 
          checkOutDate: checkIn // Block same-day check-in by matching checkIn date to existing checkOut date
        }
      ]
    });

    // If overlapping bookings exist, room is unavailable
    const isAvailable = overlappingBookings.length === 0;
    res.status(200).json(isAvailable);
  } catch (error) {
    console.error('Error checking room availability:', error);
    res.status(500).json({ message: 'Error checking room availability' });
  }
});



// 

// manage accommodation

const roomSchema = new mongoose.Schema({
  number: { type: String, required: true },
  status: { type: String, default: 'available' }, // Status for each room
  isLocked: { type: Boolean, default: false }, // Indicates if the room is locked
  lockReason: { type: String, default: '' } // Reason for locking the room
});


const roomTypeSchema = new mongoose.Schema({
  name: { type: String, required: true },
  price: { type: Number, required: true },
  rooms: [roomSchema],
  amenities: [String],
  images: [String]
});

const accommodationSchema = new mongoose.Schema({
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  roomTypes: [roomTypeSchema],
});


module.exports = mongoose.model('Accommodation', accommodationSchema);
// Model Definition
const Accommodation = mongoose.model('Accommodation', accommodationSchema);


// POST route to publish accommodation
const uploadMultiple = upload.array('images', 10); // Limit to 10 images per room type

app.post('/api/services/accommodations', upload.array('images', 10), async (req, res) => {
  try {
    // Parse room types from request body
    const roomTypes = req.body.roomTypes.map((roomType, index) => {
      const parsedRoomType = JSON.parse(roomType);
      
      // Get images associated with this room type
      const images = req.files
        .filter((file) => file.fieldname === 'images' && file.originalname.includes(`image_${index}_`)) // Filter for images of the current room type
        .map((file) => `/uploads/${file.filename}`);
        
      return { ...parsedRoomType, images }; // Return the room type with its associated images
    });

    const { serviceId } = req.body;

    // Find existing accommodation by serviceId
    let accommodation = await Accommodation.findOne({ serviceId });

    if (accommodation) {
      // Append new roomTypes to existing roomTypes
      accommodation.roomTypes.push(...roomTypes);
      await accommodation.save();
      res.status(200).json(accommodation);
    } else {
      // Create a new accommodation if none exists with the serviceId
      const newAccommodation = new Accommodation({
        serviceId,
        roomTypes,
      });
      const savedAccommodation = await newAccommodation.save();
      res.status(201).json(savedAccommodation);
    }
  } catch (error) {
    console.error('Error publishing accommodation:', error);
    res.status(500).json({ error: 'Failed to publish accommodation' });
  }
});



// Accommodation Controller
// Get accommodation by serviceId
app.get('/api/accommodation/service/:serviceId', async (req, res) => {
  try {
    const accommodations = await Accommodation.find({ serviceId: req.params.serviceId });
    if (!accommodations.length) {
      return res.status(404).json({ message: 'No accommodations found' });
    }
    res.json(accommodations); // Send an array of accommodations
  } catch (error) {
    res.status(500).json({ message: 'Server error', error });
  }
});


// Update a specific room type within an accommodation
app.put('/api/services/accommodations/:id/roomtype', upload.array('images'), async (req, res) => {
  const { id } = req.params;
  const roomTypeData = req.body;

  if (roomTypeData.rooms) {
    roomTypeData.rooms = JSON.parse(roomTypeData.rooms);
  }

  try {
    const accommodation = await Accommodation.findById(id);
    if (!accommodation) return res.status(404).send('Accommodation not found');

    const roomTypeIndex = accommodation.roomTypes.findIndex(
      (rt) => rt._id.toString() === roomTypeData._id
    );
    if (roomTypeIndex === -1) return res.status(404).send('Room Type not found');

    // const existingImages = (accommodation.roomTypes[roomTypeIndex].images || []).filter(image => image.startsWith('/uploads'));
    const existingImages = roomTypeData.images || [];
    console.log('Existing images:', existingImages);

    console.log('Images to be processed from roomTypeData:', roomTypeData.images);

    if (req.files) {
      const newImagePaths = req.files.map(file => `/uploads/${file.filename}`);
      console.log('New images being uploaded:', newImagePaths);
      roomTypeData.images = [...existingImages, ...newImagePaths];
    } else {
      roomTypeData.images = existingImages;
    }

    accommodation.roomTypes[roomTypeIndex] = { 
      ...accommodation.roomTypes[roomTypeIndex]._doc, 
      ...roomTypeData,
      images: roomTypeData.images
    };

    await accommodation.save();
    res.status(200).send(accommodation.roomTypes[roomTypeIndex]);
  } catch (error) {
    console.error('Error updating room type:', error);
    res.status(500).send('Internal Server Error');
  }
});


// DELETE room type by accommodation and room type IDs
app.delete('/api/services/accommodations/:accommodationId/room-types/:roomTypeId', async (req, res) => {
  const { accommodationId, roomTypeId } = req.params;

  try {
    const accommodation = await Accommodation.findOneAndUpdate(
      { _id: accommodationId },
      { $pull: { roomTypes: { _id: roomTypeId } } },
      { new: true }
    );

    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    res.status(200).json({ message: 'Room type deleted successfully', accommodation });
  } catch (error) {
    console.error('Error deleting room type:', error);
    res.status(500).json({ message: 'Error deleting room type', error });
  }
});


// Update service by ID
// Update service by ID
app.put('/api/services/update/:id', upload.array('productImages', 10), async (req, res) => {
  // console.log(req.body);
  try {
    const { productName, productDescription, location } = req.body;

    // Initialize an array to hold processed image URLs
    let processedImages = [];

    // Check if productImages is in the request body
    if (req.body.productImages) {
      for (let image of req.body.productImages) {
        // Check if the image is a Base64 string
        if (image.startsWith('data:image/')) {
          const base64Data = image.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`; // Generate a unique file name
          const filePath = path.join(__dirname, 'uploads', fileName);

          // Write the buffer to the file system
          await fs.promises.writeFile(filePath, buffer);
          // Push the URL of the saved image to processedImages
          processedImages.push(`uploads/${fileName}`);
        } else {
          // If it's not a Base64 string, assume it's a URL from the request
          processedImages.push(image);
        }
      }
    }

    // Update the service with the new product images and other details
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { productName, productDescription, productImages: processedImages, location },
      { new: true }
    );

    if (!updatedService) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Respond with a success message and the updated service
    res.json({
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get accommodation by serviceId
app.get('/api/services/accommodations/service/:serviceId', async (req, res) => {
  const { serviceId } = req.params;
  
  try {
    const accommodation = await Accommodation.findOne({ serviceId })
      .select('roomTypes') // Only fetch room types field
      .populate({
        path: 'roomTypes',
        select: 'name price amenities images', // Exclude 'rooms' field
      });

    if (!accommodation) {
      return res.status(404).json({ message: 'Accommodation not found' });
    }

    res.json(accommodation);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

app.get('/api/services/rooms/available/:roomTypeId', async (req, res) => {
  const { roomTypeId } = req.params;
  const { checkInDate, checkOutDate } = req.query;

  console.log(`Received request for room availability with roomTypeId: ${roomTypeId}`);
  console.log(`Check-in Date: ${checkInDate}, Check-out Date: ${checkOutDate}`);

  const checkIn = new Date(checkInDate);
  const checkOut = new Date(checkOutDate);

  if (isNaN(checkIn.getTime()) || isNaN(checkOut.getTime())) {
    console.error('Invalid date format detected');
    return res.status(400).json({ message: 'Invalid check-in or check-out date format.' });
  }

  try {
    const accommodation = await Accommodation.findOne({ 'roomTypes._id': roomTypeId });

    if (!accommodation) {
      console.warn(`No accommodation found for roomTypeId: ${roomTypeId}`);
      return res.status(404).json({ message: 'Accommodation not found for this room type.' });
    }

    const roomType = accommodation.roomTypes.id(roomTypeId);
    console.log(`Found room type: ${roomType.name} with ${roomType.rooms.length} rooms`);

    // Check each room for availability
    const availableRooms = await Promise.all(roomType.rooms.map(async (room) => {
      console.log(`Checking room ID: ${room._id} for availability`);

      const overlappingBooking = await Booking.findOne({
        roomId: room._id,
        bookingStatus: { $nin: ['Canceled by Provider', 'Canceled by Traveller', 'Complete'] }, // Exclude specific canceled bookings
        $or: [
          {
            checkInDate: { $lte: checkOut }, // Prevents booking if check-in date <= new check-out
            checkOutDate: { $gte: checkIn }  // Prevents booking if check-out date >= new check-in
          }
        ]
      });

      if (!overlappingBooking) {
        console.log(`Room ID: ${room._id} is available`);
        return room;
      } else {
        console.log(`Room ID: ${room._id} is not available due to overlapping booking`);
        return null;
      }
    }));

    // Filter out the available rooms
    const availableRoom = availableRooms.filter(room => room !== null);

    if (availableRoom.length > 0) {
      console.log(`Available rooms found: ${availableRoom.map(room => room._id).join(', ')}`);
      res.json(availableRoom);
    } else {
      console.log('No available rooms found for the selected date range');
      res.status(200).json({ message: 'No available rooms found for this room type and date range.' });
    }
  } catch (error) {
    console.error('Error finding available room:', error);
    res.status(500).json({ message: 'Error finding available room', error });
  }
});



// Get booking by ID
app.get('/api/bookings/accommodationBooking/:id', async (req, res) => {
  try {
    const booking = await Booking.findById(req.params.id).populate('userId serviceId accommodationId roomTypeId roomId');
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }
    res.status(200).json(booking);
  } catch (error) {
    console.error('Error fetching booking:', error);
    res.status(500).json({ message: 'Server error' });
  }
});

app.put('/api/services/:accommodationId/roomType', async (req, res) => {
  const { accommodationId } = req.params;
  const updatedRoomType = req.body;

  try {
    const accommodation = await Accommodation.findById(accommodationId);
    const roomType = accommodation.roomTypes.id(updatedRoomType._id);

    if (!roomType) {
      return res.status(404).send({ error: 'Room type not found' });
    }

    // Check if all rooms are locked
    const allRoomsLocked = roomType.rooms.every(room => room.isLocked);

    roomType.rooms.forEach((room, index) => {
      if (allRoomsLocked) {
        // Unlock all rooms if they are all locked
        room.isLocked = false;
        room.status = 'available';
        room.lockReason = '';
      } else {
        // Update each room based on the provided updatedRoomType data
        room.isLocked = updatedRoomType.rooms[index].isLocked;
        room.lockReason = updatedRoomType.rooms[index].lockReason;
        room.status = updatedRoomType.rooms[index].status;
      }
    });

    await accommodation.save();
    res.send({ success: true });
  } catch (error) {
    res.status(500).send({ error: 'Failed to update room type' });
  }
});

app.put('/api/services/:accommodationId/room-types/:roomTypeId/rooms/:roomId/status', async (req, res) => {
  try {
    const { accommodationId, roomTypeId, roomId } = req.params;
    const { status, isLocked, lockReason } = req.body;

    // Find the accommodation and room by IDs
    const accommodation = await Accommodation.findById(accommodationId);
    if (!accommodation) return res.status(404).json({ message: 'Accommodation not found' });

    const roomType = accommodation.roomTypes.id(roomTypeId);
    if (!roomType) return res.status(404).json({ message: 'Room type not found' });

    const room = roomType.rooms.id(roomId);
    if (!room) return res.status(404).json({ message: 'Room not found' });

    // Toggle lock/unlock status
    if (room.isLocked) {
      // Unlock the room
      room.isLocked = false;
      room.status = 'available';
      room.lockReason = '';
    } else {
      // Lock the room with the provided details
      room.isLocked = isLocked;
      room.status = status;
      room.lockReason = lockReason;
    }

    // Save the updated accommodation document
    await accommodation.save();

    res.status(200).json({ message: 'Room status updated successfully', room });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Failed to update room status', error });
  }
});













// Update restaurantservice by ID
app.put('/api/services/update/restaurant/:id', upload.array('productImages', 10), async (req, res) => {
  // console.log(req.body);
  try {
    const { productName, productDescription, location } = req.body;

    // Initialize an array to hold processed image URLs
    let processedImages = [];

    // Check if productImages is in the request body
    if (req.body.productImages) {
      for (let image of req.body.productImages) {
        // Check if the image is a Base64 string
        if (image.startsWith('data:image/')) {
          const base64Data = image.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`; // Generate a unique file name
          const filePath = path.join(__dirname, 'uploads', fileName);

          // Write the buffer to the file system
          await fs.promises.writeFile(filePath, buffer);
          // Push the URL of the saved image to processedImages
          processedImages.push(`uploads/${fileName}`);
        } else {
          // If it's not a Base64 string, assume it's a URL from the request
          processedImages.push(image);
        }
      }
    }

    // Update the service with the new product images and other details
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { productName, productDescription, productImages: processedImages, location },
      { new: true }
    );

    if (!updatedService) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Respond with a success message and the updated service
    res.json({
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});




const restaurantMenuSchema = new mongoose.Schema({
  serviceId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Service',
    required: true,
  },
  menuFiles: [
    {
      fileName: String,
      fileUrl: String,
      uploadedAt: {
        type: Date,
        default: Date.now,
      },
    },
  ],
});

const RestaurantMenu = mongoose.model('RestaurantMenu', restaurantMenuSchema);


// POST endpoint for uploading menu
app.post('/api/services/upload-menu', upload.any(), async (req, res) => {
  const { serviceId } = req.body;
  console.log('body: ', req.body);
  console.log('files: ', req.files);

  if (!req.files && !Object.keys(req.body).some(key => key.startsWith('fileUrl'))) {
    return res.status(400).json({ message: 'No files or URLs provided' });
  }

  try {
    // Extract uploaded files from req.files, removing numeric prefix and extension from fileName
    const menuFiles = (req.files || []).map(file => {
      let originalNameWithoutExt = file.originalname.replace(/\.[^/.]+$/, ''); // Remove extension
      originalNameWithoutExt = originalNameWithoutExt.replace(/^\d+-/, ''); // Remove numeric prefix if it exists
      return {
        fileName: originalNameWithoutExt, // Store name without extension or prefix
        fileUrl: `/uploads/${file.filename}`, // Use the actual saved filename for the URL path
        uploadedAt: new Date(),
      };
    });

    // Extract file URLs from req.body (handle keys like fileUrl0, fileUrl1, etc.)
    Object.keys(req.body).forEach((key) => {
      if (key.startsWith('fileUrl') && req.body[key]) {
        const urlSegments = req.body[key].split('/');
        const placeholderNameWithExt = urlSegments[urlSegments.length - 1];
        let placeholderNameWithoutExt = placeholderNameWithExt.replace(/\.[^/.]+$/, ''); // Remove extension
        placeholderNameWithoutExt = placeholderNameWithoutExt.replace(/^\d+-/, ''); // Remove numeric prefix if it exists
        menuFiles.push({
          fileName: placeholderNameWithoutExt || 'URL-file',
          fileUrl: req.body[key],
          uploadedAt: new Date(),
        });
      }
    });

    // Use findOneAndUpdate to update if exists, or create if it doesn’t
    const updatedMenu = await RestaurantMenu.findOneAndUpdate(
      { serviceId },
      { menuFiles }, // Replace the existing menuFiles array with new data
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(201).json({
      message: 'Menu items uploaded successfully',
      menu: updatedMenu,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Server error, could not upload menu' });
  }
});






// Route to get restaurant menu by serviceId
// Route to get all restaurant menus by serviceId
app.get('/api/services/restaurantMenu/:serviceId', async (req, res) => {
  try {
    const serviceId = req.params.serviceId;

    // Find all restaurant menus associated with the serviceId
    const restaurantMenus = await RestaurantMenu.find({ serviceId }).exec();

    if (!restaurantMenus.length) {
      return res.status(404).json({ message: 'No menus found for this service' });
    }

    // Flatten menuFiles arrays if each menu has multiple files
    const menuFiles = restaurantMenus.flatMap((menu) => menu.menuFiles);

    res.json({ menuFiles });
  } catch (error) {
    console.error('Error fetching restaurant menus:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// white space











// booking tour

// Define the tour booking schema
const bookingTourSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    tourName: {
        type: String,
        required: true,
        trim: true
    },

    tourguideType: {
      type: String,
      required: true,
      enum: ['With Guide', 'Tour Only']
    },

    tourDate: {
        type: Date,
        required: true,

        validate: {
          validator: function(value) {
            const now = new Date();
            return value >= now.setHours(0, 0, 0, 0);
          },
          message: 'Tour date must be in the future'
      }

    },

    pickupLocation: {
      type: String,
      required: true,
      
    },

    numberOfParticipants: {
        type: Number,
        required: true,
        min: 1
    },
    specialRequest: {
        type: String,
        trim: true
    },
    amount: {
      type: Number,
      required: true,
      min: 0
  },
    bookingStatus: {
        type: String,
        default: 'Booked',  // Other possible statuses: 'Cancelled', 'Completed'
        enum: ['Booked', 'Cancelled', 'Completed']
    },
    serviceId: { // Add serviceId field
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Service',
      required: true
  },
  userId: { // Add userId field
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true
  },

  tourTime: { // Add the tourTime field
    type: String,
    required: true,
    enum: ['9:00-11:00','13:00-15:00', '17:00-19:00'] // Restrict to available time options
},

paymentStatus: {
  type: String,
  default: 'Pending', // Other possible statuses: 'Paid', 'Failed'
  enum: ['Pending', 'Paid', 'Failed']
},

isReviewed: { type: Boolean, default: false },

}, { timestamps: true });

// Create the Booking model
const TourBooking = mongoose.model('TourBooking', bookingTourSchema);

module.exports = TourBooking;

// Route to handle booking tour guide

app.post('/api/bookings/tour-guide', async (req, res) => {
  try {
    const bookingData = {
      ...req.body,
      serviceId: req.body.serviceId, // Make sure these are passed from the client side
      userId: req.body.userId,      // or set here if you have access to current user
      // tourTime: req.body.tourTime
    };
    const booking = new TourBooking(bookingData);
    await booking.save();
    res.status(201).json(booking);
  } catch (error) {
    console.error('Error details:', error); // Log error details for debugging
    res.status(400).json({ error: 'Error creating booking', details: error });
  }
});

// GET route to fetch bookings by userId
app.get('/api/services/bookings/user/:userId', async (req, res) => {
  try {
    const userId = req.params.userId;
    const bookings = await TourBooking.find({ userId: userId });
    res.status(200).json(bookings);
  } catch (error) {
    console.error('Error fetching user bookings:', error);
    res.status(500).json({ error: 'Error fetching bookings' });
  }
});




// app.post('/api/bookings/tour-guide', async (req, res) => {
//   try {
//     const booking = new TourBooking(req.body);
//     await booking.save();
//     res.status(201).json(booking);
//   } catch (error) {
//     console.error('Error details:', error); // Log error details for debugging
//     res.status(400).json({ error: 'Error creating tour guide booking', details: error });
//   }
// });



///////////

// ///////////


// Add admin account
const adminData = {
  name: 'Admin',
  email: 'admin@mail.com',
  password: 'adminpassword',
  userType: 'admin'
};

//Ensure that admin data is not duplicated in the database
async function addAdminIfNotExists() {
  try {
    const existingAdmin = await User.findOne({ email: adminData.email });
    if (existingAdmin) {
      console.log('Admin user already exists:', existingAdmin);
    } else {
      const saltRounds = 10;
      adminData.password = await bcrypt.hash(adminData.password, saltRounds);
      const newAdmin = new User(adminData);
      await newAdmin.save();
      console.log('Admin user added:', newAdmin);
    }
  } catch (error) {
    console.error('Error adding admin user:', error);
  }
}

addAdminIfNotExists();

////////////////////////////
// const mongoose = require('mongoose');




// Define provider schema
const ProviderSchema = new mongoose.Schema({

    providerID: Number,

    businessType: {type: String},

    businessSubcategory: {type: String},

    name: {type: String},

    email: {type: String},

    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },

    businessName: {type: String},

    businessLocation: {type: String},

    businessCoordinates: { 
      type: { type: String, default: 'Point' }, 
      coordinates: [Number] // [longitude, latitude]
    },

    businessDesc: {type: String},

    price: { type: Number },

    businessLicense: {type: String},

    imageSelf: {type: String},

    imageService: [{ type: String }],

    status : {type: Number, default: 0},

   

});
// Apply autoIncrement plugin to the schema
ProviderSchema.plugin(autoIncrement, {inc_field : 'providerID'});
// Create the model using the schema
Provider = mongoose.model('Provider', ProviderSchema);


ProviderSchema.index({ businessCoordinates: '2dsphere' });





// Middleware to verify JWT
function authMiddleware(req, res, next) {
  const token = req.headers['authorization']?.split(' ')[1];
  if (token) {
    jwt.verify(token, secretKey, (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Unauthorized access' });
      } else {

      console.log(decoded);
        req.user = decoded;
        next();
      }
    });
  } else {
    return res.status(403).json({ message: 'No token provided' });
  }
}



/////////////////////////////////////

// Provider registration route to register a new provider on the RUTE platform
app.post('/api/register-provider', authMiddleware, upload.fields([
  { name: 'businessLicense', maxCount: 1 },
  { name: 'imageSelf', maxCount: 1 },
  { name: 'imageService', maxCount: 10 }
]), async (req, res) => {
  const { businessType, businessSubcategory, businessName, businessLocation, businessDesc, price, businessCoordinates } = req.body;
  const { userId, name, email } = req.user;
  console.log('bbbbbbb : ', req.user);

  try {
    // Parse the businessCoordinates safely
    let coordinates;
    try {
      coordinates = JSON.parse(businessCoordinates); // Parse the object
    } catch (err) {
      return res.status(400).json({ message: 'Invalid coordinates format' });
    }
    
    // Check if lat and lng exist in the parsed coordinates
    if (!coordinates || typeof coordinates.lat !== 'number' || typeof coordinates.lng !== 'number') {
      return res.status(400).json({ message: 'Invalid coordinates provided' });
    }

    const imageServiceFiles = req.files['imageService'];
    
    // Check if at least 3 service images are uploaded
    if (!imageServiceFiles || imageServiceFiles.length < 3) {
      return res.status(400).json({ message: 'You must upload at least 3 service images.' });
    }

    const newProvider = new Provider({
      businessType,
      businessName,
      businessLocation,
      businessCoordinates: {
        type: 'Point',
        coordinates: [coordinates.lng, coordinates.lat] // MongoDB expects [lng, lat]
      },
      businessDesc,
      price: Number(price),
      businessLicense: req.files['businessLicense'][0].path,
      imageSelf: req.files['imageSelf'][0].path,
      imageService: req.files['imageService'].map(file => file.path),
      name,
      email,
      userId,
      status: 0
    });

    // Conditionally add subcategory if businessType is Accommodation or Transportation
    if (businessType === 'Accommodation' || businessType === 'Transportation') {
      newProvider.businessSubcategory = businessSubcategory;
    }

    await newProvider.save();
    res.status(201).json({ message: 'Provider registered successfully' });
  } catch (error) {
    console.error('Error registering provider:', error);
    res.status(500).json({ message: 'Internal Server Error', error });
  }
});



// Signup route for creating a new RUTE account
app.post('/signup', async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ message: 'All fields are required' });
  }

  try {
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ message: 'Email is already in use' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = new User({ name, email, password: hashedPassword, userType: 'user' });
    await newUser.save();
    console.log('User saved to database:', newUser);
    res.status(201).json({ message: 'User created successfully' });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ message: 'Error creating user', error });
  }
});




// Signin route to validate the user who will log in
app.post('/signin', async (req, res) => {
  const { email, password } = req.body;

  // Log the received login data
  console.log('Received login data:', { email, password });

  try {
    // Find the user by email
    const user = await User.findOne({ email });

    // Check if the user exists and the password is correct
    if (!user || !await bcrypt.compare(password, user.password)) {
      return res.status(401).json({ message: 'Invalid email or password' });
    }

    // Generate a token
    const token = generateToken(user);

    // Include user details in the response
    const response = { token, user: { userId: user._id, name: user.name, email: user.email, userType: user.userType, avatar: user.avatar, contact: user.contact, address: user.address } };
    console.log('Sending response:', response); // Debugging response from server
    res.status(200).json(response);
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ message: 'Error signing in', error });
  }
});


  //yuda
//yuda
// book transportation
const transportationSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  productName: { type: String, required: true },
  productDescription: { type: String },
  productImages: [{ type: String }],
  productCategory: { type: String, required: true },
  productSubcategory: [
    {
      name: {type: String},
      type: { type: String, enum: ['car', 'motorcycle', 'bycycle'] },
      quantity: { type: Number  },
      price: { type: Number  }
    }
  ],
  location: { type: String },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },
  createdAt: { type: Date, default: Date.now }
});

const Transportation = mongoose.model('Transportation', transportationSchema);

// get Transportation data by id
// Get Transportation data by id including productSubcategory details
app.get('/transportationService/:id', async (req, res) => {
  try {
    const transportId = req.params.id;

    // Find the Service by _id
    const service = await Service.findById(transportId);
    if (!service) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Find Transportation documents that match the serviceId
    const transportationData = await Transportation.findOne({ serviceId: transportId }).exec();

    // Prepare the response object
    const response = {
      serviceDetails: service
    };

    // Add transportationData only if it exists
    if (transportationData) {
      response.transportationData = {
        productSubcategory: transportationData.productSubcategory,
      };
    }

    // Send the response
    res.json(response);

  } catch (error) {
    console.error('Error retrieving provider data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});



app.post('/manage/transportation', async (req, res) => {
  try {
    const { userId, serviceId, productSubCategory } = req.body;
    let { productName, productDescription, productImages, location } = req.body;

    console.log('Request Data:', req.body);

    // Verifikasi apakah user ada
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User tidak ditemukan' });
    }

    // Cari service berdasarkan ID
    const service = await Service.findById(serviceId);
    if (!service) {
      return res.status(404).json({ success: false, message: 'Service tidak ditemukan' });
    }

    // Gunakan data service sebagai default jika field opsional tidak diisi
    productName = productName || service.productName;
    productDescription = productDescription || service.productDescription;
    productImages = productImages || service.productImages;
    location = location || service.location;

    // Cek apakah transportation dengan serviceId ini sudah ada
    let transportation = await Transportation.findOne({ serviceId: service._id });

    // Siapkan data transportation
    const transportationData = {
      userId: user._id,
      productName,
      productDescription,
      productImages,
      productCategory: service.productCategory,
      location,
      serviceId: service._id,
      productSubcategory: transportation ? transportation.productSubcategory : [],
    };


    console.log('Transportation Data:', productSubCategory);

    // Proses update, add, atau delete pada productSubCategory
    for (const newSubCategory of productSubCategory) {
      const existingIndex = transportationData.productSubcategory.findIndex(
        (existing) => existing._id?.toString() === newSubCategory._id?.toString()
      );

      if (newSubCategory.action === 'delete') {
        // Hapus subkategori menggunakan splice jika ditemukan
        if (existingIndex !== -1) {
          transportationData.productSubcategory.splice(existingIndex, 1);
        }
      } else if (existingIndex !== -1) {
        // Update subkategori jika sudah ada
        transportationData.productSubcategory[existingIndex] = newSubCategory;
      } else {
        // Tambahkan subkategori baru
        transportationData.productSubcategory.push(newSubCategory);
      }
    }

    if (transportation) {
      // Update dokumen transportation yang sudah ada
      Object.assign(transportation, transportationData);
      transportation.markModified('productSubcategory'); // Tandai array sebagai berubah
      await transportation.save();

      res.status(200).json({
        success: true,
        message: 'Transportation berhasil diperbarui',
        data: transportation,
      });
    } else {
      // Buat dan simpan transportation baru
      const newTransportation = new Transportation(transportationData);
      await newTransportation.save();

      res.status(201).json({
        success: true,
        message: 'Transportation berhasil dibuat',
        data: newTransportation,
      });
    }

    // Update dokumen service jika ada perubahan
    if (
      productName !== service.productName ||
      productDescription !== service.productDescription ||
      JSON.stringify(productImages) !== JSON.stringify(service.productImages) ||
      location !== service.location
    ) {
      service.productName = productName;
      service.productDescription = productDescription;
      service.productImages = productImages;
      service.location = location;
      service.status = 'published';
      await service.save();
    }
  } catch (error) {
    console.error('Error mengelola transportation:', error);
    res.status(500).json({ success: false, message: 'Gagal mengelola transportation' });
  }
});







app.get('/transportationService', async (req, res) => { 
  try {
    const transportationData = await Transportation.aggregate([
      {
        $lookup: {
          from: 'services', // Name of the Service collection in MongoDB
          localField: 'serviceId',
          foreignField: '_id',
          as: 'serviceDetails'
        }
      },
      {
        $unwind: '$serviceDetails' // Unwind to simplify accessing serviceDetails
      },
      {
        $project: {
          userId: 1,
          productName: 1,
          productDescription: 1,
          productImages: 1,
          productCategory: 1,
          productSubcategory: 1,
          location: 1,
          createdAt: 1,
          serviceId: 1,
          averageRating: '$serviceDetails.averageRating', // Map average rating
          totalReviews: '$serviceDetails.totalReviews'    // Map total reviews
        }
      }
    ]);

    res.json(transportationData);
  } catch (error) {
    console.error('Error retrieving transportation data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


// Define the vehicle booking schema (for car and motorcycle with conditional pickup/dropoff)
const bookingVehicleSchema = new mongoose.Schema({
  customerName: {
      type: String,
      required: true,
      trim: true
  },
  productName: {type: String, required: true},
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service' },

  vehicleBooking: [
    {
      name: {
        type: String,
        required: true,
        trim: true
      },
      quantity: {
        type: Number,
        required: true
      },
      selectedVehicleType:{
        type: String,
        required: true
      },
      pricePerVehicle: {
        type: Number,
        required: true
      },
      totalPrice: {
        type: Number,
        required: true
      }
    }
  ],
  totalBookingPrice: {
      type: Number,
      required: true
  },
  vehicleDropoffLocation: {
      type: String,
      trim: true,
  },
  vehiclePickupLocation: {
      type: String,
      trim: true,
  },
  rentalDuration: {
      type: Number,
      required: true  // Duration in hours or days
  },
  pickupDate: {
    type: Date, // Storing the pickup date
    required: true
  },
  dropoffDate: {
    type: Date, // Storing the dropoff date
    required: true
  },
  specialRequest: {
      type: String,
      trim: true
  },
  bookingStatus: {
      type: String,
      default: 'Booked',  // Other possible statuses: 'Cancelled', 'Completed'
      enum: ['Booked', 'Cancelled', 'Complete', 'Waiting for payment']
  },
  isReviewed: { type: Boolean, default: false },
  paymentStatus: {
    type: String,
    default: 'Pending',  // Possible statuses: 'Pending', 'Paid', 'Failed'
    enum: ['Pending', 'Paid', 'Failed']
  }

  
}, { timestamps: true });

// Create the Booking model
const VehicleBooking = mongoose.model('VehicleBooking', bookingVehicleSchema);


app.get('/transportationsDetails/:serviceId', async (req, res) => {
  try {
    const { serviceId } = req.params;
    
    // Find a single transportation document matching the serviceId
    const transportationData = await Transportation.findOne({ serviceId });

    if (!transportationData) {
      return res.status(404).json({ message: 'Transportation data not found for this service' });
    }

    res.json(transportationData);
  } catch (error) {
    console.error('Error retrieving transportation details:', error);
    res.status(500).json({ message: 'Server error' });
  }
});






// 1. Function to check and update TourBooking status
async function updateTourBookings() {
  const today = new Date();
  try {
      const expiredTours = await TourBooking.find({
          tourDate: { $lt: today },
          bookingStatus: 'Booked'
      });

      if (expiredTours.length > 0) {
          await TourBooking.updateMany(
              { _id: { $in: expiredTours.map(tour => tour._id) } },
              { $set: { bookingStatus: 'Complete' } }
          );
          console.log(`${expiredTours.length} tour bookings marked as Completed.`);
      }
  } catch (error) {
      console.error('Error updating tour bookings:', error);
  }
}

// 2. Function to check and update AccommodationBooking status
async function updateAccommodationBookings() {
  const today = new Date();
  try {
      const expiredAccommodations = await Booking.find({
          checkOutDate: { $lt: today },
          bookingStatus: 'Booked'
      });

      if (expiredAccommodations.length > 0) {
          await Booking.updateMany(
              { _id: { $in: expiredAccommodations.map(acc => acc._id) } },
              { $set: { bookingStatus: 'Complete' } }
          );
          console.log(`${expiredAccommodations.length} accommodation bookings marked as CheckedOut.`);
      }
  } catch (error) {
      console.error('Error updating accommodation bookings:', error);
  }
}

// 3. Function to check and update VehicleBooking status
async function updateVehicleBookings() {
  const today = new Date();
  try {
      const expiredVehicles = await VehicleBooking.find({
          dropoffDate: { $lt: today },
          bookingStatus: 'Booked'
      });

      if (expiredVehicles.length > 0) {
          await VehicleBooking.updateMany(
              { _id: { $in: expiredVehicles.map(veh => veh._id) } },
              { $set: { bookingStatus: 'Complete' } }
          );
          console.log(`${expiredVehicles.length} vehicle bookings marked as Completed.`);
      }
  } catch (error) {
      console.error('Error updating vehicle bookings:', error);
  }
}

// Combined function to run all updates
async function updateAllBookings() {
  await updateTourBookings();
  await updateAccommodationBookings();
  await updateVehicleBookings();
}

updateAllBookings()

cron.schedule('0 0 * * *', updateAllBookings);  // Runs every day at midnight



// Route untuk booking transportasi
app.post('/api/bookTransports', async (req, res) => {
  console.log("Request received at /bookTransports");
  
  const {
    serviceId,
    userId,
    pickupDate,
    dropoffDate,
    vehicleBooking,
    specialRequest,
    pickupLocation,
    dropoffLocation,
    totalBookingPrice
  } = req.body;
  
  console.log("Booking Data:", {
    serviceId,
    userId,
    pickupDate,
    dropoffDate,
    specialRequest,
    pickupLocation,
    dropoffLocation,
    totalBookingPrice,
    vehicleBooking
  });

  try {
    const user = await User.findById(userId);
    if (!user) {
      console.log("User not found");
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const service = await Transportation.findOne({ serviceId: serviceId });

    if (!service) {
      console.log("Service not found");
      return res.status(404).json({ success: false, message: 'Service not found' });
    }

    if (!pickupDate || !dropoffDate) {
      return res.status(400).json({ success: false, message: 'Pickup and Dropoff dates are required' });
    }

    const start = new Date(pickupDate);
    const end = new Date(dropoffDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0); // Set time to 00:00 for date-only validation

    if (start < today) {
      return res.status(400).json({
        success: false,
        message: 'Booking for past dates is not allowed'
      });
    }

    const rentalDuration = Math.floor((end - start) / (1000 * 60 * 60 * 24));
    if (rentalDuration <= 0) {
      return res.status(400).json({ success: false, message: 'Dropoff date must be after pickup date' });
    }

    // Loop through each vehicle in the booking to check quantity
    for (const vehicle of vehicleBooking) {
      const { name, quantity: requestedQuantity } = vehicle;

      // Get the maximum quantity for this vehicle type in Transportation schema
      const serviceVehicle = service.productSubcategory.find(v => v.name === name);
      if (!serviceVehicle) {
        return res.status(400).json({ success: false, message: `Vehicle ${name} not found in service.` });
      }

      // Check existing bookings for the same vehicle type
      const existingBookings = await VehicleBooking.aggregate([
        { $match: { serviceId: serviceId } },
        { $unwind: "$vehicleBooking" },
        { $match: {
          "vehicleBooking.name": name,
          $or: [
            { pickupDate: { $lte: end, $gte: start } },
            { dropoffDate: { $lte: end, $gte: start } },
            { pickupDate: { $lte: start }, dropoffDate: { $gte: end } }
          ]
        }},
        { $group: { _id: null, totalBooked: { $sum: "$vehicleBooking.quantity" }}}
      ]);

      const totalBooked = existingBookings[0]?.totalBooked || 0;

      // Check if the requested quantity exceeds the available quantity
      if (totalBooked + requestedQuantity > serviceVehicle.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient quantity for ${name}. Only ${serviceVehicle.quantity - totalBooked} available.`
        });
      }
    }

    // If all checks pass, create the new booking
    const newBooking = new VehicleBooking({
      customerName: user.name,
      productName: service.productName,
      userId,
      serviceId,
      vehicleBooking,
      vehiclePickupLocation: pickupLocation,
      vehicleDropoffLocation: dropoffLocation,
      rentalDuration,
      pickupDate: start,
      dropoffDate: end,
      specialRequest,
      bookingStatus: 'Waiting for payment',
      totalBookingPrice
    });

    await newBooking.save();

   

    res.status(201).json({
      success: true,
      message: 'Transportation booked successfully!',
      bookingDetails: newBooking
    });
  } catch (error) {
    console.error('Error creating booking:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});



app.get('/api/bookedDates/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Dapatkan data transportation berdasarkan serviceId
    const transportationData = await Transportation.findOne({ serviceId: id });
    if (!transportationData) {
      return res.status(404).json({
        success: false,
        message: 'Data transportasi tidak ditemukan'
      });
    }

    // Ambil data booking berdasarkan serviceId
    const bookings = await VehicleBooking.find(
      { serviceId: id },
      'pickupDate dropoffDate vehicleBooking'
    );

    // Hitung jumlah kendaraan yang dipesan per tanggal
    const dateCounts = {};
    bookings.forEach(booking => {
      booking.vehicleBooking.forEach(vehicle => {
        let currentDate = new Date(booking.pickupDate);
        const endDate = new Date(booking.dropoffDate);

        // Iterasi setiap hari dari pickupDate ke dropoffDate
        while (currentDate <= endDate) {
          const dateString = currentDate.toISOString().split('T')[0]; // Format tanggal sebagai string
          if (!dateCounts[dateString]) {
            dateCounts[dateString] = 0;
          }
          dateCounts[dateString] += vehicle.quantity;

          // Tambahkan satu hari
          currentDate.setDate(currentDate.getDate() + 1);
        }
      });
    });

    // Cari tanggal yang harus dinonaktifkan berdasarkan quantity di transportationData
    const disabledDates = [];
    for (const [date, count] of Object.entries(dateCounts)) {
      if (count >= transportationData.productSubcategory.reduce((acc, item) => acc + item.quantity, 0)) {
        disabledDates.push(date);
      }
    }

    res.status(200).json({
      success: true,
      disabledDates,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: 'Gagal mengambil tanggal yang sudah dibooking',
      error: error.message
    });
  }
});

app.get('/remaining-quantity', async (req, res) => {
  try {
    const { serviceId, pickupDate, dropoffDate } = req.query;
    const pickup = new Date(pickupDate);
    const dropoff = new Date(dropoffDate);

    // Ambil detail transportasi berdasarkan serviceId
    const transportation = await Transportation.findOne({ serviceId });
    if (!transportation) {
      return res.status(404).json({ message: 'Layanan tidak ditemukan.' });
    }

    // Buat objek untuk menyimpan sisa kuantitas per subkategori
    const availableQuantities = {};

    // Iterasi setiap subkategori dalam productSubcategory
    for (const subcategory of transportation.productSubcategory) {
      // Inisialisasi kuantitas tersedia untuk setiap subkategori
      let availableQuantity = subcategory.quantity || 0;

      // Ambil pemesanan terkait dengan serviceId yang bertumpuk dengan tanggal yang dipilih
      const bookings = await VehicleBooking.find({
        serviceId,
        bookingStatus: 'Booked',
        $or: [
          { pickupDate: { $lt: dropoff }, dropoffDate: { $gt: pickup } }
        ],
        'vehicleBooking.selectedVehicleType': subcategory.type
      });

      // Kurangi kuantitas berdasarkan pemesanan yang bertumpuk untuk tipe kendaraan spesifik
      bookings.forEach((booking) => {
        booking.vehicleBooking.forEach((vehicle) => {
          if (vehicle.selectedVehicleType === subcategory.type) {
            availableQuantity -= vehicle.quantity;
          }
        });
      });

      // Pastikan kuantitas tidak negatif
      availableQuantities[subcategory._id] = Math.max(availableQuantity, 0);
    }
    console.log(availableQuantities);
    res.json({ availableQuantities });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan saat menghitung sisa kuantitas.' });
  }
});






// Book transportation endpoint




const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
  bookingId: { type: mongoose.Schema.Types.ObjectId, required: true }, // ID dari booking terkait
  rating: { type: Number, required: true, min: 1, max: 5 },
  comment: String,
  createdAt: { type: Date, default: Date.now },
});

const Review = mongoose.model('Review', reviewSchema);

app.post('/add-review', async (req, res) => {
  const { userId, bookingId, rating, comment } = req.body;

  // Validasi input
  if (!userId || !bookingId || !rating) {
    return res.status(400).json({
      message: 'Missing required fields: userId, bookingId, or rating.',
    });
  }

  try {
    let booking; // Untuk menyimpan data booking yang ditemukan
    let serviceId; // Untuk menyimpan serviceId terkait booking

    // Cari bookingId di tiga skema
    booking = await Booking.findOne({ _id: bookingId });
    if (!booking) booking = await TourBooking.findOne({ _id: bookingId });
    if (!booking) booking = await VehicleBooking.findOne({ _id: bookingId });

    if (!booking) {
      return res.status(404).json({ message: 'Booking not found' });
    }

    // Pastikan booking belum direview
    if (booking.isReviewed) {
      return res.status(400).json({ message: 'Booking has already been reviewed' });
    }

    // Ambil serviceId terkait dari booking
    serviceId = booking.serviceId;

    if (!serviceId) {
      return res.status(400).json({ message: 'Service ID is missing from booking data.' });
    }

    // Buat review baru dengan bookingId dan serviceId
    const review = new Review({ userId, bookingId, serviceId, rating, comment });
    await review.save();

    // Cari service berdasarkan serviceId dan hitung rata-rata rating baru
    const service = await Service.findById(serviceId);
    if (service) {
      const newTotalReviews = service.totalReviews + 1;
      let newAverageRating =
        (service.averageRating * service.totalReviews + rating) / newTotalReviews;

      newAverageRating = parseFloat(newAverageRating.toFixed(1));
      service.averageRating = newAverageRating;
      service.totalReviews = newTotalReviews;
      await service.save();
    }

    // Tandai booking sebagai telah direview
    booking.isReviewed = true;
    await booking.save();

    res.status(200).json({
      message: 'Review added successfully and average rating updated',
    });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ message: 'Error adding review', error });
  }
});




//Customize Profile
app.put('/customizeProfile', upload.single('avatar'), async (req, res) => {
  try {
    const { userId, name, address, contact, currentPassword, newPassword, confirmNewPassword } = req.body;

    console.log(req.body);

    // Cari pengguna berdasarkan userId
    let user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update profil (jika ada perubahan)
    if (name) user.name = name;
    if (address) user.address = address;
    if (contact) user.contact = contact;

    // Jika foto profil diunggah
    if (req.file) {
      user.avatar = req.file.path;  // Simpan path foto di database
    }

    // Jika ingin mengganti password, lakukan validasi
    if (currentPassword || newPassword || confirmNewPassword) {
      // Pastikan semua kolom terkait password diberikan
      if (!currentPassword || !newPassword || !confirmNewPassword) {
        return res.status(400).json({ message: 'Please provide all password fields' });
      }

      // Periksa apakah currentPassword cocok dengan password lama
      const isMatch = await bcrypt.compare(currentPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ message: 'Current password is incorrect' });
      }

      // Pastikan newPassword dan confirmNewPassword cocok
      if (newPassword !== confirmNewPassword) {
        return res.status(400).json({ message: 'New password and confirm password do not match' });
      }

      // Hash password baru
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(newPassword, salt);
    }

    // Simpan perubahan profil dan password (jika ada)
    await user.save();
    
    if (name) {
      await Provider.updateMany({ userId: userId }, { name: name });
    }

    res.status(200).json({ message: 'Profile and password updated successfully', user });

  } catch (error) {
    console.error('Error updating profile and password:', error);
    res.status(500).json({ message: 'Error updating profile and password', error: error.message || error });
  }
});



app.get('/pending-services', async (req, res) => {
  try {
    // Dapatkan layanan dengan status 'pending' dan sertakan informasi nama pengguna (userId)
    const services = await Service.find({ status: 'pending' }).populate('userId', 'name');
  
    res.json(services);
  } catch (error) {
    console.error('Error retrieving pending services:', error);
    res.status(500).send({ message: 'Error retrieving pending services', error });
  }
});


app.get('/getServices/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;

    // Temukan layanan berdasarkan _id
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    res.json(service);
  } catch (error) {
    console.error('Error retrieving provider data:', error);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});


app.get('/getProviderStatus0', async (req, res) => {
  try {
    const dataProvider = await Provider.find({ status: 0 });
    res.json(dataProvider);
  } catch (err) {
    console.error('Error Get Data: ', err);
    res.status(500).json({ message: 'Internal Server Error' });
  }
});

app.get('/getProvider/:providerID', async (req,res) =>{
try {
  const providerID = req.params.providerID;
  console.log('Requested providerID:', providerID);

  // Temukan provider berdasarkan ID
  const providerData = await Provider.findOne({ providerID });
  console.log('Found providerData:', providerData);

  if (!providerData) {
    return res.status(404).json({ message: 'Provider tidak ditemukan' });
  }

  res.json(providerData);
} catch (error) {
  console.error('Error mengambil data provider:', error);
  res.status(500).json({ message: 'Internal Server Error' });
}
});

////////////////////////////////////////
const sendEmail = (email, name) => {
// Pastikan email penerima (recipients) telah didefinisikan
if (!email) {
    console.error('No recipients defined');
    return;
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'madeyudaadiwinata@gmail.com',
        pass: 'hncq lgcx hkhz hjlq',
    },
    secure: true,
    tls: {
      rejectUnauthorized: false,
    },
});

const mailOptions = {
    from: 'madeyudaadiwinata@gmail.com',
    to: email,
    subject: 'Provider Approval',
    text: `Dear ${name},\n\nYour provider request has been approved.\nBest Regards,\nRUTE`,
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error sending email:', error);
    } else {
        console.log('Email sent:', info.response);
    }
});
};


app.put('/approve/:providerID', async (req, res) => {
  try {
    const { providerID } = req.params;

    // Retrieve provider from the database
    const providerData = await Provider.findOne({ providerID });

    if (!providerData) {
      return res.status(404).json({ message: 'Provider not found' });
    }

    // Update provider status to 1
    providerData.status = 1;
    const updatedProvider = await providerData.save();

    // Find the corresponding user by userId
    const userId = providerData.userId;
    const user = await User.findById(userId);

    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update userType to 'provider'
    user.userType = 'provider';
    await user.save();

    // Create new service entry with provider's business data
    const newService = new Service({
      productName: providerData.businessName,
      productDescription: providerData.businessDesc,
      productPrice: providerData.price,
      productImages: providerData.imageService,
      productCategory: providerData.businessType,
      productSubcategory: providerData.businessSubcategory,
      userId: providerData.userId,
      providerId: providerData._id,
      status: 'accepted', // Optional: set the status to approved or any other status
      businessLicense: providerData.businessLicense,
      location: providerData.businessLocation,
      businessCoordinates: {
        type: 'Point',
        coordinates: providerData.businessCoordinates.coordinates // Use the array directly
      }
    });
    

    await newService.save();

    // Send approval email
    sendEmail(updatedProvider.email, updatedProvider.name);

    res.json({ message: 'Provider status updated successfully and service created', updatedProvider, newService });
  } catch (error) {
    console.error('Error updating provider status:', error);
    res.status(500).json({ message: 'Error updating status', error: error.message });
  }
});




//////////////////////////////////////////////////////////////////

const sendEmailReject = (email, name, message) => {
if (!email) {
  console.error('No recipients defined');
  return;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'madeyudaadiwinata@gmail.com',
    pass: 'hncq lgcx hkhz hjlq',
  },
  secure: true,
  tls: {
    rejectUnauthorized: false,
  },
});

const mailOptions = {
  from: 'madeyudaadiwinata@gmail.com',
  to: email,
  subject: 'Provider Rejected',
  text: `Dear ${name},\n\nYour provider request has been rejected.\n\nReason: ${message}\nPlease provide correct and complete data and re-register.\n\nBest Regards,\nRUTE`,
};

transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error('Error sending email:', error);
  } else {
    console.log('Email sent:', info.response);
  }
});
};

app.delete('/reject/:providerID', async (req, res) => {
try {
  const { providerID } = req.params;
  const { message } = req.body;

  const providerData = await Provider.findOne({ providerID });

  if (!providerData) {
    return res.status(404).json({ message: 'Provider not found' });
  }

  await Provider.deleteOne({ providerID });

  sendEmailReject(providerData.email, providerData.name, message);

  res.json({ message: 'Provider deleted successfully' });
} catch (error) {
  console.error('Error deleting provider:', error);
  res.status(500).json({ message: 'Error deleting provider', error: error.message });
}
});

const approveServices = (email, name) => {
// Pastikan email penerima (recipients) telah didefinisikan
if (!email) {
    console.error('No recipients defined');
    return;
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'madeyudaadiwinata@gmail.com',
        pass: 'hncq lgcx hkhz hjlq',
    },
    secure: true,
    tls: {
      rejectUnauthorized: false,
    },
});

const mailOptions = {
    from: 'madeyudaadiwinata@gmail.com',
    to: email,
    subject: 'Services Approval',
    text: `Dear ${name},\n\nYour services request has been approved.\nBest Regards,\nRUTE`,
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error sending email:', error);
    } else {
        console.log('Email sent:', info.response);
    }
});
};
app.put('/service/approve/:id', async (req, res) => {
try {
  const serviceId = req.params.id;

  // Temukan layanan berdasarkan _id
  const service = await Service.findById(serviceId);

  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  // Perbarui status menjadi 'approved'
  service.status = 'accepted';
  const updatedService = await service.save();

  // Temukan pengguna yang terkait dengan layanan
  const user = await User.findById(service.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Jalankan fungsi approveServices dengan email dan name pengguna
  approveServices(user.email, user.name);

  res.json({ message: 'Service status updated to approved successfully', updatedService });
} catch (error) {
  console.error('Error updating service status:', error);
  res.status(500).json({ message: 'Error updating service status', error: error.message });
}
});
const rejectServices = (email, name, message) => {
// Pastikan email penerima (recipients) telah didefinisikan
if (!email) {
    console.error('No recipients defined');
    return;
}

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'madeyudaadiwinata@gmail.com',
        pass: 'hncq lgcx hkhz hjlq',
    },
    secure: true,
    tls: {
      rejectUnauthorized: false,
    },
});

const mailOptions = {
    from: 'madeyudaadiwinata@gmail.com',
    to: email,
    subject: 'Services Rejected',
    text: `Dear ${name},\n\nYour services request has been rejected.\n\nReason: ${message}\nBest Regards,\nRUTE`,
};

transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
        console.error('Error sending email:', error);
    } else {
        console.log('Email sent:', info.response);
    }
});
};
app.delete('/service/reject/:id', async (req, res) => {
try {
  const { id } = req.params;
  const { message } = req.body;

  // Temukan layanan berdasarkan _id
  const service = await Service.findById(id);

  if (!service) {
    return res.status(404).json({ message: 'Service not found' });
  }

  // Hapus layanan berdasarkan _id
  await Service.deleteOne({ _id: id });

  // Temukan pengguna yang terkait dengan layanan
  const user = await User.findById(service.userId);

  if (!user) {
    return res.status(404).json({ message: 'User not found' });
  }

  // Jalankan fungsi rejectServices dengan email dan name pengguna
  rejectServices(user.email, user.name, message);

  res.json({ message: 'Service deleted successfully' });
} catch (error) {
  console.error('Error deleting service:', error);
  res.status(500).json({ message: 'Error deleting service', error: error.message });
}
});









///////////////////////////////////////////////////////////////////////////////////////


//angga

// Service Schema and Model

// Define the Service schema and model
const serviceSchema = new mongoose.Schema({
  productName: String,
  productDescription: String,
  productPrice: Number,
  productImages: [String],
  productCategory: String,
  productSubcategory: String,
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  providerId: { type: mongoose.Schema.Types.ObjectId, ref: 'Provider' },
  status: { type: String, default: 'pending' }, // Add status field with default value
  businessLicense: String, // New field for business license image
  location: String, // New field for location
  businessCoordinates: {
    type: { type: String, default: 'Point' },
    coordinates: { type: [Number], required: true }, // [lng, lat] format
  },
 
  averageRating: { type: Number, default: 0 }, // Store average rating for the product
  totalReviews: { type: Number, default: 0 }   // Store the total number of reviews
});


const Service = mongoose.model('Service', serviceSchema);

// 
// Route to get services with productCategory "Accommodation"
app.get('/api/services/accommodation', async (req, res) => {
  try {
    const services = await Service.find({ productCategory: 'Accommodation' });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching services' });
  }
});

// Route to get services with productCategory "tour guide"
app.get('/api/services/tour-guide', async (req, res) => {
  try {
    const services = await Service.find({ productCategory: 'Tour Guide' });
    res.json(services);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching services' });
  }
});

// Route to get a specific service by ID
app.get('/api/services/:id', async (req, res) => {
  try {
    const service = await Service.findById(req.params.id);
    if (!service) {
      return res.status(404).json({ error: 'Service not found' });
    }
    res.json(service);
  } catch (err) {
    res.status(500).json({ error: 'Error fetching service details' });
  }
});

// Route to get service by serviceId
app.get('/getServiceById/:bookingId', async (req, res) => { 
  try {
    const bookingId = req.params.bookingId;

    // Cek bookingId di ketiga koleksi
    const [booking, tourBooking, vehicleBooking] = await Promise.all([
      Booking.findById(bookingId),
      TourBooking.findById(bookingId),
      VehicleBooking.findById(bookingId),
    ]);

    // Tentukan sumber data berdasarkan hasil pencarian
    const foundBooking = booking || tourBooking || vehicleBooking;

    if (!foundBooking) {
      return res.status(404).json({ message: 'Booking not found in any schema' });
    }

    // Ambil serviceId dari dokumen yang ditemukan
    const { serviceId } = foundBooking;

    if (!serviceId) {
      return res.status(404).json({ message: 'Service ID not found in booking' });
    }

    // Cari data layanan berdasarkan serviceId
    const service = await Service.findById(serviceId);

    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Kirim data layanan sebagai respons
    res.json(service);
  } catch (error) {
    console.error('Error fetching service:', error);
    res.status(500).json({ message: 'Server error' });
  }
});



// 

// API routes for services
// GET services - Only return services with status 'accepted'
app.get('/api/services', authMiddleware, async (req, res) => {
  try {
    const services = await Service.find({ userId: req.user.userId, status:  {$in: ['accepted', 'published'] }  });
    res.json(services);
  } catch (err) {
    res.status(500).send(err);
  }
});

// POST service - Create a new service with default status 'pending'
app.post('/api/services', authMiddleware, upload.fields([
  { name: 'productImages', maxCount: 10 },
  { name: 'businessLicense', maxCount: 1 }
]), async (req, res) => {
  try {
    const { productName, productDescription, productPrice, productCategory, productSubcategory, location } = req.body;
    
    const productImages = req.files['productImages'] ? req.files['productImages'].map(file => file.path) : [];
    const businessLicense = req.files['businessLicense'] ? req.files['businessLicense'][0].path : null;

    const newService = new Service({
      productName,
      productDescription,
      productPrice,
      productCategory,
      productSubcategory,
      productImages,
      businessLicense,
      location,
      userId: req.user.userId,
      status: 'pending'
    });

    const savedService = await newService.save();
    res.json(savedService);
  } catch (err) {
    res.status(500).send(err);
  }
});

// PUT service - Update an existing service
// PUT service - Update an existing service
// PUT endpoint to update an existing service
app.put('/api/services/:id', upload.fields([
  { name: 'productImages', maxCount: 10 },
  { name: 'businessLicense', maxCount: 1 }
]), async (req, res) => {
  try {
    const updateData = { ...req.body };

    // Handle new product images
    if (req.files['productImages']) {
      const newImagePaths = req.files['productImages'].map(file => file.path); // Store file paths directly
      updateData.productImages = [...(updateData.productImages || []), ...newImagePaths];
    }

    // Fetch existing product images
    const existingService = await Service.findById(req.params.id, 'productImages');
    if (!existingService) {
      return res.status(404).json({ message: 'Service not found' });
    }
    let existingImages = existingService.productImages || [];

    // Handle image removal
    if (req.body.imagesToRemove) {
      const imagesToRemove = req.body.imagesToRemove instanceof Array 
                              ? req.body.imagesToRemove 
                              : [req.body.imagesToRemove];
      existingImages = existingImages.filter(image => !imagesToRemove.includes(image));
    }

    // Combine existing and new images
    updateData.productImages = [...(existingImages || []), ...(updateData.productImages || [])];

    // Handle businessLicense update
    if (req.files['businessLicense']) {
      updateData.businessLicense = req.files['businessLicense'][0].path; // Store file path directly
    }

    // Find and update the service
    const updatedService = await Service.findOneAndUpdate(
      { _id: req.params.id },
      updateData,
      { new: true }
    );

    // Check if the service exists
    if (!updatedService) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Respond with the updated service
    res.json(updatedService);
  } catch (err) {
    res.status(500).send(err);
  }
});







// DELETE service - Delete an existing service
app.delete('/api/services/:id', authMiddleware, async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.sendStatus(204);
  } catch (err) {
    res.status(500).send(err);
  }
});


// DELETE service - Delete an existing service
app.delete('/api/services/:id', authMiddleware, async (req, res) => {
  try {
    const service = await Service.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!service) {
      return res.status(404).json({ message: 'Service not found' });
    }
    res.sendStatus(204);
  } catch (err) {
    res.status(500).send(err);
  }
});

///////////////////////////////////////////////////////


///search functionality testing

// Route to search services
// GET search services
app.get('/api/search', authMiddleware, async (req, res) => {
  console.log('masuk server');
  const { term, category } = req.query;
  const query = {status: 'accepted' };

  console.log('term: ', term);
  console.log('category', category);

  console.log(query);

  if (term) {
    query.productName = { $regex: new RegExp(term, 'i') }; // Case-insensitive search for service name
  }

  if (category) {
    query.productCategory = category; // Exact match for category
  }

  try {
    console.log('final query: ', query);
    const services = await Service.find(query);
    console.log('services: ', services);
    res.json(services);
  } catch (err) {
    console.error(err);
    res.status(500).send('Server Side Error');
  }
});






// setting midtrans payment

 ///////////////////////////////////////////
 //midtrans

 const midtransClient = require("midtrans-client");

 // Initialize Midtrans Snap client
const snap = new midtransClient.Snap({
  isProduction: false, // Set to true in production
  serverKey: "SB-Mid-server-EkQFDkUqZ0I0nG-avUrCzTi0",
});

// Create transaction route
app.post('/api/create-transaction', async (req, res) => {
  const { bookingId, amount, userId, bookingType } = req.body;

  const shortTimestamp = Date.now().toString().slice(-6);

  if (!bookingId || !amount || !userId || !bookingType) {
    return res.status(400).json({ error: 'Required parameters missing' });
  }

  try {
    // Define the transaction payload for Midtrans
    const midtransTransaction = {
      transaction_details: {
        order_id: `ord-${bookingType.slice(0, 3)}-${bookingId.slice(-6)}-${shortTimestamp}`, // Unique order ID with booking type
        gross_amount: amount,
      },
      customer_details: {
        user_id: userId,
      },
    };

    // Create the transaction with Midtrans
    const transaction = await snap.createTransaction(midtransTransaction);
    res.json({ token: transaction.token });
    console.log(`Transaction created successfully for ${bookingType}:`, transaction);
  } catch (error) {
    console.error('Midtrans transaction creation failed:', error);
    res.status(500).json({ error: 'Transaction creation failed', details: error });
  }
});

// Define the route to handle payment updates
app.post('/api/payments/update-status', async (req, res) => {
  const { bookingId, bookingType } = req.body;

  // Select the appropriate booking model based on the booking type
  let BookingModel;
  switch (bookingType) {
    case 'Accommodation':
      BookingModel = Booking;
      break;
    case 'Tour Guide':
      BookingModel = TourBooking;
      break;
    case 'Transportation':
      BookingModel = VehicleBooking;
      break;
    default:
      return res.status(400).json({ error: 'Invalid booking type' });
  }

  try {
    // Common status update
    const updateData = {
      paymentStatus: 'Paid',
      bookingStatus: 'Pending',
    };

    // Additional custom updates per booking type (if needed)
    if (bookingType === 'Tour Guide') {
      updateData.confirmationStatus = 'Awaiting Guide Confirmation';
    } else if (bookingType === 'Transportation') {
      updateData.vehicleStatus = 'Reserved';
    }

    // Update the booking in the database
    await BookingModel.findByIdAndUpdate(bookingId, updateData);
    res.status(200).json({ message: `${bookingType} payment and booking status updated successfully.` });
    console.log(`${bookingType} booking updated successfully: ${bookingId}`);
  } catch (error) {
    console.error('Error updating payment and booking status:', error);
    res.status(500).json({ error: 'Failed to update payment and booking status' });
  }
});


////////////////////////////////////////////////////////



// backup midtrans

 ///////////////////////////////////////////
 //midtrans

//  const midtransClient = require("midtrans-client");

//  // Initialize Midtrans Snap client
// const snap = new midtransClient.Snap({
//   isProduction: false, // Set to true in production
//   serverKey: "SB-Mid-server-EkQFDkUqZ0I0nG-avUrCzTi0",
// });

// // Create transaction route
// app.post('/api/create-transaction', async (req, res) => {
//   const { bookingId, amount, userId } = req.body;
//   if (!bookingId || !amount || !userId) {
//     return res.status(400).json({ error: 'Required parameters missing' });
//   }

//   try {
//     // Define the transaction payload
//     const midtransTransaction = {
//       transaction_details: {
//         order_id: `order-${bookingId}-${Date.now()}`, // Unique order ID
//         gross_amount: amount, // Total amount to be charged
//       },
//       customer_details: {
//         user_id: userId,
//       },
//     };

//     // Create the transaction with Midtrans
//     const transaction = await snap.createTransaction(midtransTransaction);
//     res.json({ token: transaction.token });
//     console.log(transaction);
//   } catch (error) {
//     console.error("Midtrans transaction creation failed:", error);
//     res.status(500).json({ error: "Transaction creation failed", details: error });
//   }
// });

// // Define the route to handle payment updates
// app.post('/api/payments/update-status', async (req, res) => {
//     const { bookingId, bookingType } = req.body;

//     // Identify the correct model based on booking type
//     let BookingModel;
//     if (bookingType === 'Accommodation') BookingModel = AccommodationBooking;
//     else if (bookingType === 'Tour Guide') BookingModel = TourBooking;
//     else if (bookingType === 'Transportation') BookingModel = VehicleBooking;
//     else return res.status(400).json({ error: 'Invalid booking type' });

//     try {
//         // Update payment status to 'Paid'
//         await BookingModel.findByIdAndUpdate(bookingId, { paymentStatus: 'Paid' });
//         res.status(200).json({ message: 'Payment status updated successfully.' });
//     } catch (error) {
//         console.error('Error updating payment status:', error);
//         res.status(500).json({ error: 'Failed to update payment status' });
//     }
// });


////////////////////////////////////////////////////////


  

app.put('/api/services/update/tourGuide/:id', upload.array('productImages', 10), async (req, res) => {
  // console.log(req.body);
  try {
    const { productName, productDescription, productPrice, location } = req.body;

    // Initialize an array to hold processed image URLs
    let processedImages = [];

    // Check if productImages is in the request body
    if (req.body.productImages) {
      for (let image of req.body.productImages) {
        // Check if the image is a Base64 string
        if (image.startsWith('data:image/')) {
          const base64Data = image.split(',')[1];
          const buffer = Buffer.from(base64Data, 'base64');
          const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.jpg`; // Generate a unique file name
          const filePath = path.join(__dirname, 'uploads', fileName);

          // Write the buffer to the file system
          await fs.promises.writeFile(filePath, buffer);
          // Push the URL of the saved image to processedImages
          processedImages.push(`uploads/${fileName}`);
        } else {
          // If it's not a Base64 string, assume it's a URL from the request
          processedImages.push(image);
        }
      }
    }

    // Update the service with the new product images and other details
    const updatedService = await Service.findByIdAndUpdate(
      req.params.id,
      { productName, productDescription, productPrice, productImages: processedImages, location },
      { new: true }
    );

    if (!updatedService) {
      return res.status(404).json({ message: 'Service not found' });
    }

    // Respond with a success message and the updated service
    res.json({
      message: 'Service updated successfully',
      service: updatedService
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



// //////////////////////////////////////////////////////////////////

//changes after merge 1

// Define the route for fetching transportation bookings by user ID
app.get('/api/bookings/transportation/user/:userId', async (req, res) => {
  try {
      // Log the incoming request parameter
      console.log(`Received request for transportation bookings with userId: ${req.params.userId}`);

      // Find bookings by userId and populate relevant fields if needed
      const bookings = await VehicleBooking.find({ userId: req.params.userId })
                                           .populate('userId serviceId'); // Populate references to User and Service

      // Log the response data
      console.log('Transportation bookings found:', bookings);

      // Send the bookings as JSON
      res.json(bookings);
  } catch (error) {
      console.error('Error fetching transportation bookings:', error);
      res.status(500).json({ message: 'Error fetching transportation bookings', error });
  }
});





////////////////////////////
// async function injectDummyData() {
//   try {
//     // Count existing vehicle bookings
//     const existingCount = await VehicleBooking.countDocuments();
    
//     if (existingCount >= 10) {
//       console.log('There are already 10 or more vehicle bookings. No new data injected.');
//       return; // Exit if there are already 10 or more bookings
//     }

//     const dummyData = [];

//     for (let i = 1; i <= 10; i++) {
//       const booking = new VehicleBooking({
//         customerName: `Customer ${i}`,
//         productName: `Product ${i}`,
//         userId: new mongoose.Types.ObjectId(), // Replace with actual user IDs if available
//         serviceId: new mongoose.Types.ObjectId(), // Replace with actual service IDs if available
//         vehicleBooking: [
//           {
//             name: `Vehicle ${i}`,
//             quantity: Math.floor(Math.random() * 3) + 1, // Quantity between 1 and 3
//             selectedVehicleType: i % 2 === 0 ? 'Car' : 'Motorcycle',
//             pricePerVehicle: Math.floor(Math.random() * 100) + 50, // Price between 50 and 150
//             totalPrice: Math.floor(Math.random() * 300) + 100, // Total price between 100 and 400
//           },
//         ],
//         vehicleDropoffLocation: `Location ${i}`,
//         vehiclePickupLocation: `Location ${i}`,
//         rentalDuration: Math.floor(Math.random() * 7) + 1, // Duration between 1 and 7 days
//         pickupDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000), // Pickup dates spread over 10 days
//         dropoffDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // Dropoff dates spread over 10 days
//         specialRequest: i % 2 === 0 ? 'No special requests' : 'Add GPS',
//         bookingStatus: 'Booked',
//         paymentStatus: i % 3 === 0 ? 'Paid' : 'Pending', // Alternates between Paid and Pending
//       });

//       dummyData.push(booking);
//     }

//     await VehicleBooking.insertMany(dummyData);
//     console.log('Dummy vehicle booking data injected successfully!');
//   } catch (error) {
//     console.error('Error injecting dummy data:', error);
//   }
// }


// async function injectDummyData() {

//   const dummyData = [];

//   for (let i = 1; i <= 10; i++) {
//     const booking = new VehicleBooking({
//       customerName: `Customer ${i}`,
//       productName: `Product ${i}`,
//       userId: new mongoose.Types.ObjectId(), // Replace with actual user IDs if available
//       serviceId: new mongoose.Types.ObjectId(), // Replace with actual service IDs if available
//       vehicleBooking: [
//         {
//           name: `Vehicle ${i}`,
//           quantity: Math.floor(Math.random() * 3) + 1, // Quantity between 1 and 3
//           selectedVehicleType: i % 2 === 0 ? 'Car' : 'Motorcycle',
//           pricePerVehicle: Math.floor(Math.random() * 100) + 50, // Price between 50 and 150
//           totalPrice: Math.floor(Math.random() * 300) + 100, // Total price between 100 and 400
//         },
//       ],
//       vehicleDropoffLocation: `Location ${i}`,
//       vehiclePickupLocation: `Location ${i}`,
//       rentalDuration: Math.floor(Math.random() * 7) + 1, // Duration between 1 and 7 days
//       pickupDate: new Date(Date.now() + i * 24 * 60 * 60 * 1000), // Pickup dates spread over 10 days
//       dropoffDate: new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000), // Dropoff dates spread over 10 days
//       specialRequest: i % 2 === 0 ? 'No special requests' : 'Add GPS',
//       bookingStatus: 'Booked',
//       paymentStatus: i % 3 === 0 ? 'Paid' : 'Pending', // Alternates between Paid and Pending
//     });

//     dummyData.push(booking);
//   }

//   try {
//     await VehicleBooking.insertMany(dummyData);
//     console.log('Dummy data injected successfully!');
//   } catch (error) {
//     console.error('Error injecting dummy data:', error);
//   }
// }

// injectDummyData();




// async function injectDummyData() {
//   try {
//     // Count existing tour bookings
//     const existingCount = await TourBooking.countDocuments();
    
//     if (existingCount >= 10) {
//       console.log('There are already 10 or more tour bookings. No new data injected.');
//       return; // Exit if there are already 10 or more bookings
//     }

//     const dummyData = [];

//     for (let i = 1; i <= 10; i++) {
//       const tourDate = new Date(Date.now() + (i * 24 * 60 * 60 * 1000)); // Tour dates spread over 10 days

//       const booking = new TourBooking({
//         customerName: `Tourist ${i}`,
//         tourName: `Tour ${i}`,
//         tourguideType: i % 2 === 0 ? 'With Guide' : 'Tour Only',
//         tourDate: tourDate,
//         pickupLocation: `Pickup Location ${i}`,
//         numberOfParticipants: Math.floor(Math.random() * 10) + 1, // Between 1 and 10 participants
//         specialRequest: i % 2 === 0 ? 'No special requests' : 'Vegetarian meals only',
//         bookingStatus: 'Booked',
//         serviceId: new mongoose.Types.ObjectId(), // Replace with actual service IDs if available
//         userId: new mongoose.Types.ObjectId(), // Replace with actual user IDs if available
//         tourTime: i % 3 === 0 ? '9:00-11:00' : i % 3 === 1 ? '13:00-15:00' : '17:00-19:00', // Rotate tour times
//         paymentStatus: i % 3 === 0 ? 'Paid' : 'Pending', // Alternate between Paid and Pending
//       });

//       dummyData.push(booking);
//     }

//     await TourBooking.insertMany(dummyData);
//     console.log('Dummy tour booking data injected successfully!');
//   } catch (error) {
//     console.error('Error injecting dummy data:', error);
//   }
// }

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  })
