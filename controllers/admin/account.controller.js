const AccountAdmin = require("../../models/account-admin.model");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
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
module.exports.logoutPost = async (req, res) => {
  res.clearCookie("token");
  res.json({
    code: "success",
    message: "Đăng xuất thành công!"
  })
}
