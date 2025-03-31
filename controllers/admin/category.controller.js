module.exports.list = (req, res) => {
    res.render("Admin/pages/category-list",{
      pageTitle:"Quản Lý Danh Mục"
    })
  }
  module.exports.create = (req, res) => {
    res.render("Admin/pages/category-create",{
      pageTitle:"Tạo Danh Mục"
    })
  }