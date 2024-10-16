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



// Define user schema and model
const userSchema = new mongoose.Schema({
    name: String,
    email: String,
    password: String,
    address: String,
    contact: String,
    userType: { type: String, default: 'user' }  // Add userType with default value 'user'
  });
  
  const User = mongoose.model('User', userSchema);

/////////////////////////////////////////////////////////

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
  const { businessType, businessSubcategory, businessName, businessLocation, businessDesc, price } = req.body;
  const { userId, name, email } = req.user;
  console.log('bbbbbbb : ', req.user);

  try {

    const imageServiceFiles = req.files['imageService'];
    
    // Check if at least 3 service images are uploaded
    if (!imageServiceFiles || imageServiceFiles.length < 3) {
      return res.status(400).json({ message: 'You must upload at least 3 service images.' });
    }

    const newProvider = new Provider({
      businessType,
      businessName,
      businessLocation,
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
const reviewSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true }, // Reference to the user who made the review
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true }, // Reference to the product being reviewed
  rating: { type: Number, required: true, min: 1, max: 5 }, // Rating between 1 to 5 stars
  comment: String, // Optional comment
  createdAt: { type: Date, default: Date.now } // Timestamp for the review
});

const Review = mongoose.model('Review', reviewSchema);

app.post('/add-review', async (req, res) => {
 
    const { userId, productId, rating, comment } = req.body;
  
    // Validate the input
    if (!userId || !productId || !rating) {
      return res.status(400).json({ message: 'Missing required fields: userId, productId, or rating.' });
    }
  
    try {
      // // Check if the user has booked the product in any of the three booking types
      // const accommodationBooking = await AccommodationBooking.findOne({ userId, productId, status: 'completed' });
      // const tourGuideBooking = await TourGuideBooking.findOne({ userId, productId, status: 'completed' });
      // const transportationBooking = await TransportationBooking.findOne({ userId, productId, status: 'completed' });
  
      // // If no booking found, restrict the review
      // if (!accommodationBooking && !tourGuideBooking && !transportationBooking) {
      //   return res.status(400).json({ message: 'You can only review products you have booked.' });
      // }
  
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
  
      // Return success message
      res.status(200).json({ message: 'Review added successfully and average rating updated' });
  
    } catch (error) {
      console.error('Error:', error); // Log the actual error
      res.status(500).json({ message: 'Error adding review', error });
    }
 
});


//Customize Profile
app.put('/customizeProfile', upload.single('avatar'), async (req, res) => {
  try {
    const { userId, name, address, contact, currentPassword, newPassword, confirmNewPassword } = req.body;

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
      location: providerData.businessLocation
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
  averageRating: { type: Number, default: 0 }, // Store average rating for the product
  totalReviews: { type: Number, default: 0 }   // Store the total number of reviews
});

const Service = mongoose.model('Service', serviceSchema);

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
