const provider = require('../server');
const nodemailer = require("nodemailer");

const getDataProviderByStatus0 = async (req, res) => {
    try {
        const dataMerchant = await provider.find({status : 0});
        res.json(dataMerchant);
    }catch(err) {
        console.error('Error Get Data : ', err);
    }  
    
};
const getProviderByID = async (req, res) => {
    try {
      const providerID = req.params.providerID;
      console.log('Requested providerID:', providerID);
  
      // Temukan provider berdasarkan ID
      const providerData = await provider.findOne({ providerID });
      console.log('Found providerData:', providerData);
  
      if (!providerData) {
        return res.status(404).json({ message: 'Provider tidak ditemukan' });
      }
  
      res.json(providerData);
    } catch (error) {
      console.error('Error mengambil data provider:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
  };


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
    });

    const mailOptions = {
        from: 'madeyudaadiwinata@gmail.com',
        to: email,
        subject: 'Merchant Approval',
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

const approveProvider = async (req, res) => {
    try {
        const { providerID } = req.params;

        // Retrieve merchant from the database
        const providerData = await provider.findOne({ providerID });

        if (!providerData) {
            return res.status(404).json({ message: 'Provider not found' });
        }

        // Update status to 1
        providerData.status = 1;

        // Save changes
        const updatedProvider = await providerData.save();

        // Call sendEmail with merchant email and password
        sendEmail(updatedProvider.email, updatedProvider.name);

        res.json({ message: 'Merchant status updated successfully', updatedProvider });
    } catch (error) {
        console.error('Error updating merchant status:', error);
        res.status(500).json({ message: 'Error updating status', error: error.message });
    }
};

const sendEmailReject = (email, name) => {
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
    });

    const mailOptions = {
        from: 'madeyudaadiwinata@gmail.com',
        to: email,
        subject: 'Merchant Approval',
        text: `Dear ${name},\n\nYour provider request has been reject.\nPlease provide correct and complete data and re-register.\nBest Regards,\nRUTE`,
    };

    transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
            console.error('Error sending email:', error);
        } else {
            console.log('Email sent:', info.response);
        }
    });
};
const rejectProvider = async (req, res) => {
    try {
        const { providerID } = req.params;

        // Retrieve provider from the database
        const providerData = await provider.findOne({ providerID });

        if (!providerData) {
            return res.status(404).json({ message: 'Provider not found' });
        }

        // Delete provider
        await provider.deleteOne({ providerID });

        // Call sendEmail with provider email and name
        sendEmailReject(providerData.email, providerData.name);

        res.json({ message: 'Provider deleted successfully' });
    } catch (error) {
        console.error('Error deleting provider:', error);
        res.status(500).json({ message: 'Error deleting provider', error: error.message });
    }
};
  
  
  

module.exports = {
    getDataProviderByStatus0,
   getProviderByID,
   approveProvider,
   rejectProvider,
}