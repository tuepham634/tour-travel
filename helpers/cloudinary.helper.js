const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');

cloudinary.config({ 
  cloud_name: 'dtjrwa4nz', 
  api_key: '245259236462399', 
  api_secret: 'tlcpI8SClhmwEGrrhTj8_mIVfbg' // Click 'View API Keys' above to copy your API secret
});
module.exports.storage = new CloudinaryStorage({
    cloudinary: cloudinary,
});