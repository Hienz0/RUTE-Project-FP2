const mongoose = require('mongoose');
const autoIncrement = require('mongoose-sequence')(mongoose);

const Provider = mongoose.Schema({
    providerID: Number,
    businessType: {type: String},
    name: {type: String},
    email: {type: String},
    businessName: {type: String},
    businessLocation: {type: String},
    businessDesc: {type: String},
    businessLicense: {type: String},
    imageSelf: {type: String},
    imageService: {type: String},
    status : {type: Number, default: 0},
   
});
Provider.plugin(autoIncrement, {inc_field : 'providerID'});
module.exports = mongoose.model('Provider', Provider);