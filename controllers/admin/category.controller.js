const Category = require("../../models/category.model");
const AccountAdmin = require("../../models/account-admin.model");
const categoryHelper = require("../../helpers/category.helper");
const moment = require("moment");
module.exports.list = async(req, res) => {
  const categoryList = await Category.find({
    deleted:false
  }).sort({
    position: "desc"
  })
  for(const item of categoryList){
    if(item.createBy){
      const infoAccountCreated = await AccountAdmin.findOne({
        _id: item.createBy
      })
      item.createdByFullName = infoAccountCreated.fullName;
    }

    if(item.updateBy){
      const infoAccountUpdated = await AccountAdmin.findOne({
        _id: item.updateBy
      })
      item.updatedByFullName = infoAccountUpdated.fullName
    }
    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
    item.updatedAtFormat = moment(item.updatedAt).format("HH:mm - DD/MM/YYYY");
  }
  

  res.render("Admin/pages/category-list",{
    pageTitle:"Quản Lý Danh Mục",
    categoryList: categoryList
  })
}
module.exports.create = async (req, res) => {
  const categoryList = await Category.find({
    deleted: false
  })
  const categoryTree = categoryHelper.buildCategoryTree(categoryList);
  res.render("Admin/pages/category-create",{
    pageTitle:"Tạo Danh Mục",
    categoryList : categoryTree
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
  req.body.avatar = req.file ? req.file.path : "";
  const newRecord = new Category(req.body);
  await newRecord.save();
  req.flash("success","Tạo danh mục thành công")
  res.json({
    code: "success"
  })

}
