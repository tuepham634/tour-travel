const mongoose = require('mongoose');

const schema = new mongoose.Schema(
  {
    fullName: String,
    email: String,
    phone: String,
    role: String,
    positionCompany: String,
    status: String,
    password: String,
    avatar: String,
    createBy: String,
    updateBy: String,
    deleted: {
      type: Boolean,
      default: false
    },
    deletedBy: String,
    deletedAt: Date
  },
  {
    timestamps: true, // Tự động sinh ra trường createdAt và updatedAt
  }
);

const AccountAdmin = mongoose.model('AccountAdmin', schema,'accounts-admin');

 module.exports = AccountAdmin;