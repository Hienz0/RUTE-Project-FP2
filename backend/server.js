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
const fs = require('fs');

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
        enum: ['Booked', 'Cancelled', 'CheckedIn', 'CheckedOut']
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
    required: true } // Reference to Room
}, { timestamps: true });

// Create the Booking model
const Booking = mongoose.model('AccommodationBooking', bookingAccommodationSchema);

module.exports = Booking;




app.get('/api/bookings/booked-dates/:serviceId/:roomTypeId', async (req, res) => {
  try {
      const { serviceId, roomTypeId } = req.params;

      // Find bookings for the specified service and room type
      const bookings = await Booking.find({ serviceId: serviceId, roomTypeId: roomTypeId }, 'checkInDate checkOutDate');

      // Extract dates in 'YYYY-MM-DD' format
      const bookedDates = [];
      bookings.forEach(booking => {
          let currentDate = new Date(booking.checkInDate);
          while (currentDate <= booking.checkOutDate) {
              bookedDates.push(currentDate.toISOString().split('T')[0]);
              currentDate.setDate(currentDate.getDate() + 1);
          }
      });

      // Remove duplicates
      const uniqueDates = [...new Set(bookedDates)];
      res.json(uniqueDates);
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

    // Find overlapping bookings for the specified room and dates, allowing for a one-day gap
    const overlappingBookings = await Booking.find({
      serviceId,
      roomNumber,
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
        bookingStatus: { $ne: 'Cancelled' }, // Exclude cancelled bookings
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
    tourDate: {
        type: Date,
        required: true
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
    bookingStatus: {
        type: String,
        default: 'Booked',  // Other possible statuses: 'Cancelled', 'Completed'
        enum: ['Booked', 'Cancelled', 'Completed']
    }
}, { timestamps: true });

// Create the Booking model
const TourBooking = mongoose.model('TourBooking', bookingTourSchema);

module.exports = TourBooking;



///////////
// book transportation

// Define the vehicle booking schema (for car and motorcycle with conditional pickup/dropoff)
const bookingVehicleSchema = new mongoose.Schema({
    customerName: {
        type: String,
        required: true,
        trim: true
    },
    vehicleType: {
        type: String,
        required: true,
        enum: ['Car', 'Motorcycle']  // Restrict to car or motorcycle
    },
    vehicleModel: {
        type: String,
        required: true,
        trim: true
    },
    licensePlate: {
        type: String,
        required: true,
        trim: true
    },
    withDriver: {
        type: Boolean,
        required: true,  // Indicates whether the vehicle is rented with a driver
        default: false
    },
    driverName: {
        type: String,
        trim: true,
        required: function () {
            return this.withDriver === true; // Only required if `withDriver` is true
        }
    },
    pickupLocation: {
        type: String,
        trim: true,
        required: function () {
            return this.withDriver === true; // Only required if `withDriver` is true
        }
    },
    dropoffLocation: {
        type: String,
        trim: true,
        required: function () {
            return this.withDriver === true; // Only required if `withDriver` is true
        }
    },
    vehiclePickupLocation: {
        type: String,
        trim: true,
        required: function () {
            return this.withDriver === false; // Only required if `withDriver` is false (rental)
        }
    },
    pickupDate: {
        type: Date,
        required: true
    },
    dropoffDate: {
        type: Date,
        required: true
    },
    rentalDuration: {
        type: Number,
        required: true  // Duration in hours or days
    },
    specialRequest: {
        type: String,
        trim: true
    },
    bookingStatus: {
        type: String,
        default: 'Booked',  // Other possible statuses: 'Cancelled', 'Completed'
        enum: ['Booked', 'Cancelled', 'Completed']
    }
}, { timestamps: true });

// Create the Booking model
const VehicleBooking = mongoose.model('VehicleBooking', bookingVehicleSchema);

module.exports = VehicleBooking;

// ///////////

//add admin account

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


// app.post('/register-provider', authMiddleware, upload.fields([{ name: 'businessLicense' }, { name: 'imageSelf' }, { name: 'imageService' }]), async (req, res) => {
//   const { businessName, businessLocation, businessDesc } = req.body;
//   const name = req.user.name;
//   const email = req.user.email;

//   try {
//     const newProvider = new Provider({
//       name,
//       email,
//       businessName,
//       businessLocation,
//       businessDesc,
//       businessLicense: req.files['businessLicense'][0].path,
//       imageSelf: req.files['imageSelf'][0].path,
//       imageService: req.files['imageService'][0].path
//     });

//     await newProvider.save();
//     res.status(201).json({ message: 'Provider registration submitted successfully.' });
//   } catch (error) {
//     console.error('Error registering provider:', error);
//     res.status(500).json({ message: 'Error registering provider.', error });
//   }
// });



///////////////////////////////////////////////



  //////////////////////////////////////////////////////////////////////////////////////////////
//   const PendingProviderSchema = new Schema({
//     userId: {
//         type: Schema.Types.ObjectId,
//         ref: 'User',
//         required: true
//     },
//     userName: {
//         type: String,
//         required: true
//     },
//     businessName: {
//         type: String,
//         required: true
//     },
//     businessLocation: {
//         type: String,
//         required: true
//     },
//     businessDescription: {
//         type: String,
//         required: true
//     },
//     businessLicenseFile: {
//         type: String, // Store the file path or URL
//         required: true
//     }
// }, {
//     timestamps: true
// });

// const PendingProvider = mongoose.model('PendingProvider', PendingProviderSchema);








// // Provider registration route
// app.post('/register-provider', authMiddleware, async (req, res) => {
//     const { businessName, businessLocation, businessDescription, businessLicenseFile } = req.body;
//     const userId = req.user.userId;
//     const userName = req.user.name;
  
//     console.log('Received provider registration:', {
//       userId,
//       userName,
//       businessName,
//       businessLocation,
//       businessDescription,
//       businessLicenseFile
//     });
  
//     try {
//       const newProvider = new PendingProvider({
//         userId,
//         userName,
//         businessName,
//         businessLocation,
//         businessDescription,
//         businessLicenseFile
//       });
  
//       await newProvider.save();
//       console.log('Provider registration saved:', newProvider);
//       res.status(201).json({ message: 'Provider registration submitted successfully.' });
//     } catch (error) {
//       console.error('Error registering provider:', error);
//       res.status(500).json({ message: 'Error registering provider.', error });
//     }
//   });







  
  // Signup route
  // Signup route
// app.post('/signup', async (req, res) => {
//     const { name, email, password } = req.body;
  
//     // Basic validation
//     if (!name || !email || !password) {
//       return res.status(400).json({ message: 'All fields are required' });
//     }
  
//     // Log the received data
//     console.log('Received data:', { name, email, password });
  
//     // Save the new user to the database
//     try {
//       const newUser = new User({ name, email, password, userType: 'user' });
//       await newUser.save();
//       console.log('User saved to database:', newUser);
//       res.status(201).json({ message: 'User created successfully' });
//     } catch (error) {
//       console.error('Error creating user:', error);
//       res.status(500).json({ message: 'Error creating user', error });
//     }
//   });

// Signup route
// app.post('/signup', async (req, res) => {
//   const { name, email, password } = req.body;

//   // Basic validation
//   if (!name || !email || !password) {
//     return res.status(400).json({ message: 'All fields are required' });
//   }

//   // Log the received data
//   console.log('Received data:', { name, email, password });

//   try {
//     // Hash the password
//     const hashedPassword = await bcrypt.hash(password, 10);

//     // Save the new user to the database
//     const newUser = new User({ name, email, password: hashedPassword, userType: 'user' });
//     await newUser.save();
//     console.log('User saved to database:', newUser);
//     res.status(201).json({ message: 'User created successfully' });
//   } catch (error) {
//     console.error('Error creating user:', error);
//     res.status(500).json({ message: 'Error creating user', error });
//   }
// });

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



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////



// Signin route
// app.post('/signin', async (req, res) => {
//     const { email, password } = req.body;
  
//     // Log the received login data
//     console.log('Received login data:', { email, password });
  
//     // Find the user by email
//     const user = await User.findOne({ email });
  
//     // Check if the user exists and the password is correct
//     if (!user || user.password !== password) {
//       return res.status(401).json({ message: 'Invalid email or password' });
//     }
  
//     // Generate a token
//     const token = generateToken(user);
  
//     // Include user details in the response
//     const response = { token, user: { userId: user._id, name: user.name, email: user.email, userType: user.userType } };
//     console.log('Sending response:', response); // Debugging response from server
//     res.status(200).json(response);
//   });

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
    const response = { token, user: { userId: user._id, name: user.name, email: user.email, userType: user.userType } };
    console.log('Sending response:', response); // Debugging response from server
    res.status(200).json(response);
  } catch (error) {
    console.error('Error signing in:', error);
    res.status(500).json({ message: 'Error signing in', error });
  }
});


  //yuda
//yuda

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
  }
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

// 

// API routes for services
// GET services - Only return services with status 'accepted'
app.get('/api/services', authMiddleware, async (req, res) => {
  try {
    const services = await Service.find({ userId: req.user.userId, status: 'accepted' });
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

  


app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
  })
