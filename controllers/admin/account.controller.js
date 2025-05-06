const AccountAdmin = require("../../models/account-admin.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const ForgotPassword = require("../../models/forgot-password.model");
const generateHelper = require("../../helpers/generate.helper");
const mailHelper = require("../../helpers/mail.helper");
module.exports.login = (req, res) => {
    res.render("Admin/pages/login",{
      pageTitle:"Đăng Nhập"
    })
  }
module.exports.loginPost = async(req, res) => {
  const {email, password,rememberPassword} = req.body
  const existAccount = await AccountAdmin.findOne({
    email : email
  })
  if(!existAccount) {
    res.json({
      code:"error",
      message:"Email không tồn tại"
    })
    return;
  }
  const isPasswordValid = await bcrypt.compare(password, existAccount.password);
  if(!isPasswordValid) {
    res.json({
      code: "error",
      message: "Mật khẩu không đúng!"
    });
    return;
  }

  if(existAccount.status != "active") {
    res.json({
      code: "error",
      message: "Tài khoản chưa được kích hoạt!"
    });
    return;
  }
  // Tạo JWT
  const token = jwt.sign(
    {
      id: existAccount.id,
      email: existAccount.email
    },
    process.env.JWT_SECRET,
    {
      expiresIn: rememberPassword ? '30d' : '1d' // Token có thời hạn 30 ngày hoặc 1 ngày
    }
  )

  // Lưu token vào cookie
  res.cookie("token", token, {
    maxAge: rememberPassword ? (30 * 24 * 60 * 60 * 1000) : (24 * 60 * 60 * 1000), // Token có hiệu lực trong 1 ngày
    httpOnly: true,
    sameSite: "strict"
  })

  res.json({
    code: "success",
    message: "Đăng nhập tài khoản thành công!"
  });
  // console.log("Đăng nhập:", existAccount._id, existAccount.email);


}
module.exports.register = (req, res) => {
    res.render("Admin/pages/register",{
      pageTitle:"Đăng Ký"
    })
}

module.exports.registerPost = async(req, res) => {
  const { fullName, email, password} = req.body
  const exitsAccout = await AccountAdmin.findOne({
    email : email
  })
  if(exitsAccout) {
    res.json({
      code:"error",
      message:"Email đã tồn tại"
    })
    return;
  }
  // Mã hóa mật khẩu với bcrypt
  const salt = await bcrypt.genSalt(10); // Tạo ra chuỗi ngẫu nhiên có 10 ký tự
  const hashedPassword = await bcrypt.hash(password, salt);

  const newAccount = new AccountAdmin({
    fullName:fullName,
    email:email,
    password:hashedPassword,
    status:"initial"
  })
  await newAccount.save();
  res.json({
    code:"success",
    message:"Đăng ký tài khoản thành công"
  })
}
module.exports.registerInitial = (req, res) => {
  res.render("Admin/pages/register-initial",{
    pageTitle:"Đăng Ký"
  })
}
module.exports.forgotPassword = (req, res) => {
  res.render("Admin/pages/forgot-password",{
    pageTitle:"Quên Mật Khẩu"
  })
}
module.exports.forgotPasswordPost = async (req, res) => {
  const {email} =req.body
// Kiểm tra xem email có tồn tại trong hệ thống không
  const existAccount = await AccountAdmin.findOne({
    email:email
  })
  if(!existAccount){
    res.jon({
      code:"error",
      message:"Email không tồn tại trong hệ thống "
    })
    return
  }
// Kiểm tra email đã tồn tại trong ForgotPassword chưa
  const existEmailForgotPassword = await ForgotPassword.findOne({
    email:email
  })
  if(existEmailForgotPassword) {
    res.json({
      code:"error",
      message:"Vui long gửi lại sau 5 phút"
    })

    return;
  }
// Tạo mã OTP
  const otp = generateHelper.generateRandomNumber(6);
 // Lưu vào database: email, otp. sau 5 phút sẽ tự động xóa bản ghi.
  const newRecord = new ForgotPassword({
    email:email,
    otp:otp,
    expireAt: Date.now() +5*60*1000
  })
  await newRecord.save();
 // Gửi mã OTP qua email cho người dùng tự động
  const subject = 'Mã OTP lấy lại mật khẩu';
  const content = `Mã OTP của bạn là <b style="color: green;">${otp}</b>. Mã OTP có hiệu lực trong 5 phút, vui lòng không cung cấp cho bất kỳ ai.`;
  mailHelper.sendMail(email,subject,content);

  res.json({
    code:"success",
    message:"Đã gửi otp qua email"
  })
}
module.exports.otpPassword = (req, res) => {
  res.render("Admin/pages/otp-password",{
    pageTitle:"Nhập Mã OTP"
  })
}
module.exports.otpPasswordPost = async (req, res) => {
  const {email, otp} = req.body;
  // Kiểm tra có tồn tại bản ghi trong ForgotPassword
  const existRecord = await ForgotPassword.findOne({
    otp : otp,
    email : email
  })
  if(!existRecord){
    res.json({
      code : "error",
      message: "Mã OTP không chính xác"
    })
    return;
  }
  // Tìm thông tin của người dùng trong AccountAdmin
  const account = await AccountAdmin.findOne({
    email : email
  })
  // Tạo JWT 
  const token = jwt.sign({
    id : account.id,
    email : account.email
  },
  process.env.JWT_SECRET,
  {
    expiresIn: '1d' // token có thời hạn 1 ngày
  }
 )

  // // Lưu token vào cookie
  res.cookie("token",token,{
    maxAge: 24 * 60 * 60 * 1000, // Token có hiệu lực trong 1 ngày
    httpOnly:true,
    sameSite: "strict"
  })
  res.json({
    code: "success",
    message: "Xác thực OTP thành công!"
  })
}
module.exports.resetPassword = (req, res) => {
  res.render("Admin/pages/reset-password",{
    pageTitle:"Đổi Mật Khẩu"
  })
}
module.exports.resetPasswordPost = async(req, res) => {
  const { password} = req.body;
  const salt = bcrypt.genSaltSync(10); // Tạo ra chuỗi ngẫu nhiên có 10 ký tự
  const hashedPassword = bcrypt.hashSync(password, salt);
  await AccountAdmin.updateOne({
    _id: req.account.id
  },
  {
    password: hashedPassword
  })
  // Xóa bản ghi trong ForgotPassword
  await ForgotPassword.deleteOne({
    email: req.account.email
  })
  res.clearCookie("token");
  res.json({
    code: "success",
    message: "Đổi mật khẩu thành công!"
  })
  // console.log("Reset mật khẩu cho ID:", req.account?._id || req.account?.id);
  // console.log("Email:", req.account?.email);

}
module.exports.logoutPost = async (req, res) => {
  res.clearCookie("token");
  res.json({
    code: "success",
    message: "Đăng xuất thành công!"
  })
}
