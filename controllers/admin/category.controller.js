const moment = require("moment");
const slugify = require("slugify");
const Category = require("../../models/category.model");
const AccountAdmin = require("../../models/account-admin.model");
const categoryHelper = require("../../helpers/category.helper");
module.exports.list = async(req, res) => {
  const find ={
    deleted: false
  }
  //lọc theo trạng thái
  if(req.query.status){
    find.status = req.query.status
  }
    //end lọc theo trạng thái
  //lọc theo người tạo
  if(req.query.createBy) {
    find.createBy = req.query.createBy;
  }
  // Hết Lọc theo người tạo
  //Lọc theo ngày
  const dataFilter = {}
  if(req.query.startDate){
    const startDate = moment(req.query.startDate).startOf("Date").toDate();
    dataFilter.$gte = startDate
  }
  if(req.query.endDate){
    const endDate = moment(req.query.endDate).endOf("Date").toDate();
    dataFilter.$lte = endDate;
  }
  if(Object.keys(dataFilter).length >0){
    find.createdAt = dataFilter
  }
  //Hết Lọc theo ngày
  //Tìm kiếm
  if(req.query.keyword){
    const keyword = slugify(req.query.keyword,{
      lower:true
    })
    const keywordRegex = new RegExp(keyword);
    find.slug = keywordRegex;
    console.log(keywordRegex);
  }
  //hết Tìm kiếm
  //phân trang
  //hết phân trang
 const limitPages = 3;
let page = parseInt(req.query.page) || 1;

if (isNaN(page) || page < 1) {
  page = 1;
}

const totalRecord = await Category.countDocuments(find);
const totalPages = Math.ceil(totalRecord / limitPages);

// Nếu totalPages = 0, giữ page = 1 để skip không bị âm
if (page > totalPages && totalPages > 0) {
  page = totalPages;
}

const skip = (page - 1) * limitPages;
    const pagination = {
      skip:skip,
      totalPages:totalPages,
      totalRecord:totalRecord
    }
  const categoryList = await Category.find(
    find
  ).sort({
    position: "desc"
  })
  .limit(limitPages)
  .skip(skip);

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
    // Danh sách tài khoản quản trị
  const accountAdminList = await AccountAdmin
    .find({})
    .select("id fullName");
  // Hết Danh sách tài khoản quản trị


  res.render("admin/pages/category-list",{
    pageTitle:"Quản Lý Danh Mục",
    categoryList: categoryList,
    accountAdminList: accountAdminList,
    pagination:pagination
  })
}
module.exports.create = async (req, res) => {
  const categoryList = await Category.find({
    deleted: false
  })
  const categoryTree = categoryHelper.buildCategoryTree(categoryList);
  res.render("admin/pages/category-create",{
    pageTitle:"Tạo Danh Mục",
    categoryList : categoryTree
  })
}
module.exports.createPost = async (req, res) => {
  console.log(req.body);
  try {
    if (req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      const totalRecord = await Category.countDocuments({});
      req.body.position = totalRecord + 1;
    }
    req.body.createBy = req.account.id;
    req.body.updateBy = req.account.id;
    req.body.avatar = req.file ? req.file.path : "";
    const newRecord = new Category(req.body);
    await newRecord.save();
    req.flash("success", "Tạo danh mục thành công");
    res.json({
      code: "success",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Tạo danh mục thất bại"
    });
  }
};
module.exports.edit = async (req,res) => {
  try {
    const categoryList = await Category.find({
      deleted:false
    })
    const categoryTree = categoryHelper.buildCategoryTree(categoryList);
    const id = req.params.id;
    const categoryDetail = await Category.findOne({
      _id:id,
      deleted:false
    });

    res.render(`admin/pages/category-edit`,{
      pageTitle:"Sửa Danh Mục",
      categoryList :categoryTree,
      categoryDetail:categoryDetail
    })
  } catch (error) {
      res.redirect(`/${pathAdmin}/category/list`);
  }
}
module.exports.editPatch = async (req,res) => {
  try {
    const id = req.params.id;

    if(req.body.position){
      req.body.position = parseInt(req.body.position);
    }else {
      const totalRecord = await Category.countDocuments({});
      req.body.position = totalRecord + 1;
    }
    req.body.updateBy = req.account.id;
    if(req.file){
      req.body.avatar = req.file.path
    }else{
      delete req.body.avatar
    }

    await Category.updateOne({
      _id:id,
      deleted:false
    },req.body)
    req.flash("Cập nhật danh mục thành công");
    res.json({
      code: "success"
    })

  } catch (error) {
      res.json({
        code: "error",
        message: "Id không hợp lệ!"
      })

  }
}
module.exports.deletePatch = async (req,res) => {
 try {
  const id = req.params.id;
  await Category.updateOne({
    _id: id,
  },{
    deleted:true,
    updateBy:req.account.id,
    deletedAt:Date.now()
  })
  req.flash("success", "Xóa danh mục thành công");
  res.json({
    code:"success"
  })
 } catch (error) {
    res.json({
      code: "error",
      message:"Id không hợp lệ!!!"
    })
 }
} 
module.exports.changeMultiPatch = async (req,res) => {
  try {
    const {option, ids} = req.body;
    switch (option) {
      case "active":
      case "inactive":
        await Category.updateMany({
          _id:{$in: ids}
        },{
          status:option
        })
        req.flash("success","Đổi trạng thái thành công!");
        break;
      case "delete":
        await Category.updateMany({
          _id:{$in: ids}
        },{
          deleted: true,
          deletedBy: req.account.id,
          deletedAt: Date.now()
        })
        req.flash("success","Xóa thành công!");
        break;
    }
    res.json({
        code:"success"
    })
  } catch (error) {
    res.json({
      code: "error",
      message: "Id không tồn tại trong hệ thông!"
    })
  }
  
}