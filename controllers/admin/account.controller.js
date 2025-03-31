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