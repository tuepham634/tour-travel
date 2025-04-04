const AccountAdmin = require("../../models/account-admin.model")

module.exports.login = (req, res) => {
    res.render("Admin/pages/login",{
      pageTitle:"Đăng Nhập"
    })
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
  const newAccount = new AccountAdmin({
    fullName:fullName,
    email:email,
    password:password,
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
module.exports.otpPassword = (req, res) => {
  res.render("Admin/pages/otp-password",{
    pageTitle:"Nhập Mã OTP"
  })
}
module.exports.resetPassword = (req, res) => {
  res.render("Admin/pages/reset-password",{
    pageTitle:"Đổi Mật Khẩu"
  })
}