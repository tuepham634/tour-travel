const Category = require("../../models/category.model")
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

module.exports.createPost = async (req, res) => {
  if(req.body.position){
    req.body.position = parseInt(req.body.position);
  }else {
    const totalRecord = await Category.countDocuments({});
    req.body.position = totalRecord + 1;
  }
  req.body.createBy = req.account.id;
  req.body.updateBy = req.account.id;
  const newRecord = new Category(req.body);
  await newRecord.save()
  res.json({
    code: "success",
    message: "Tạo danh mục thành công",
  })

}