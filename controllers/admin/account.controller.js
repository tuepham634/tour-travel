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