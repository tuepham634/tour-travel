const moment = require("moment");
const slugify = require('slugify');
const Category = require("../../models/category.model");
const AccountAdmin = require("../../models/account-admin.model");
const City = require("../../models/city.model");
const Tour = require("../../models/tour.model");
const categoryHelper = require("../../helpers/category.helper");
module.exports.list = async (req, res) => {
  const find = {
    deleted: false,
  };
  //Lọc theo trạng thái
  if(req.query.status) {
    find.status = req.query.status;
  }
  //hết lọc theo trạng thái
  //Lấy danh sách người tạo
    const accountAdminList = await AccountAdmin
    .find({})
    .select("id fullName");

  //End lấy danh sách

      // Lọc theo người tạo
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
  //Lấy danh mục
  const categoryList = await Category.find({
    deleted: false
  })
  const categoryTree = categoryHelper.buildCategoryTree(categoryList);

  //lấy danh mục

  //Loc theo danh mục
  const categoryId = req.query.category || "";
  if (categoryId) {
    const categoryIds = await categoryHelper.getAllSubcategoryIds(categoryId);
    find.category = { $in: categoryIds }; // Lọc tất cả tour thuộc danh mục cha + con
  }
  //End lọc theo danh mục
  //lọc theo mức giá
  if(req.query.priceAdult){
    const [priceMin,priceMax] =req.query.priceAdult.split("-").map(item => parseInt(item));
    find.priceAdult={
        $gte:priceMin,
        $lte:priceMax
    }
  }
  //end lọc theo mức giá
  //phân trang

 const limitPages = 3;
  let page = parseInt(req.query.page) || 1;

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  const totalRecord = await Tour.countDocuments(find);
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
  //hết phân trang
    // Tìm kiếm
  if(req.query.keyword) {
    const keyword = slugify(req.query.keyword, {
      lower: true
    });
    const keywordRegex = new RegExp(keyword);
    find.slug = keywordRegex;
  }
  // Hết Tìm kiếm


  const tourList = await Tour.find(find).sort({
    position: "asc",
  }).limit(limitPages)
  .skip(skip);
  
  for (const item of tourList) {
    if (item.createBy) {
      const infoAccountCreated = await AccountAdmin.findOne({
        _id: item.createBy,
      });
      item.createdByFullName = infoAccountCreated.fullName;
    }
    if (item.updateBy) {
      const infoAccountUpdated = await AccountAdmin.findOne({
        _id: item.updateBy,
      });
      item.updatedByFullName = infoAccountUpdated.fullName;
    }
    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
    item.updatedAtFormat = moment(item.updatedAt).format("HH:mm - DD/MM/YYYY");
  }

  res.render("admin/pages/tour-list", {
    pageTitle: "Quản lý tour",
    tourList: tourList,
    accountAdminList: accountAdminList,
    categoryList:categoryTree,
    parent: categoryId,
    pagination:pagination

  });
};
module.exports.create = async (req, res) => {
  const categoryList = await Category.find({
    deleted: false,
  });
  const categoryTree = categoryHelper.buildCategoryTree(categoryList);
  const cityList = await City.find({});
  res.render("admin/pages/tour-create", {
    pageTitle: "Tạo tour",
    categoryList: categoryTree,
    cityList: cityList,
  });
};
module.exports.createPost = async (req, res) => {
  if (!req.permissions.includes("tour-create")) {
    res.json({
      code: "error",
      message: "Không có quyền sử dụng tính năng này! ",
    });
    return;
  }
  // Bắt lỗi name
  if (!req.body.name || req.body.name.trim() === "") {
    return res.json({
      code: "error",
      message: "Vui lòng nhập tên tour!",
    });
  }

  // Bắt lỗi category
  if (!req.body.category || req.body.category.trim() === "") {
    return res.json({
      code: "error",
      message: "Vui lòng chọn danh mục!",
    });
  }

  // Bắt lỗi departureDate
  if (!req.body.departureDate) {
    return res.json({
      code: "error",
      message: "Vui lòng chọn ngày khởi hành!",
    });
  }
  // Bắt lỗi avatar (file upload)
  if (!(req.files && req.files.avatar && req.files.avatar.length > 0)) {
    return res.json({
      code: "error",
      message: "Vui lòng tải ảnh đại diện cho tour!",
    });
  }
  if (req.body.position) {
    req.body.position = parseInt(req.body.position);
  } else {
    const totalRecord = await Tour.countDocuments({});
    req.body.position = totalRecord + 1;
  }
  req.body.createBy = req.account.id;
  req.body.updateBy = req.account.id;
    if(req.files && req.files.avatar) {
    req.body.avatar = req.files.avatar[0].path;
  } else {
    delete req.body.avatar;
  }

  req.body.priceAdult = req.body.priceAdult ? parseInt(req.body.priceAdult) : 0;
  req.body.priceChildren = req.body.priceChildren
    ? parseInt(req.body.priceChildren)
    : 0;
  req.body.priceBaby = req.body.priceBaby ? parseInt(req.body.priceBaby) : 0;
  req.body.priceNewAdult = req.body.priceNewAdult
    ? parseInt(req.body.priceNewAdult)
    : req.body.priceAdult;
  req.body.priceNewChildren = req.body.priceNewChildren
    ? parseInt(req.body.priceNewChildren)
    : req.body.priceChildren;
  req.body.priceNewBaby = req.body.priceNewBaby
    ? parseInt(req.body.priceNewBaby)
    : req.body.priceBaby;
  req.body.stockAdult = req.body.stockAdult ? parseInt(req.body.stockAdult) : 0;
  req.body.stockChildren = req.body.stockChildren
    ? parseInt(req.body.stockChildren)
    : 0;
  req.body.stockBaby = req.body.stockBaby ? parseInt(req.body.stockBaby) : 0;
  req.body.locations = req.body.locations ? JSON.parse(req.body.locations) : [];
  req.body.departureDate = req.body.departureDate
    ? new Date(req.body.departureDate)
    : null;
  req.body.schedules = req.body.schedules ? JSON.parse(req.body.schedules) : [];
  if(req.files && req.files.images && req.files.images.length > 0) {
    req.body.images = req.files.images.map(file => file.path);
  } else {
    delete req.body.images;
  }

  const newRecord = new Tour(req.body);
  await newRecord.save();
  req.flash("success", "Tạo tour thành công");
  res.json({
    code: "success",
  });
};
module.exports.edit = async (req, res) => {
  try {
    const id = req.params.id;
    const tourDetail = await Tour.findOne({
      _id: id,
      deleted: false,
    });
    if (tourDetail) {
      tourDetail.departureDateFomart = moment(tourDetail.departureDate).format(
        "YYYY-MM-DD"
      );
      const categoryList = await Category.find({
        deleted: false,
      });
      const categoryTree = categoryHelper.buildCategoryTree(categoryList);
      const cityList = await City.find({});

      res.render("admin/pages/tour-edit", {
        pageTitle: "Chỉnh sửa tour",
        categoryList: categoryTree,
        cityList: cityList,
        tourDetail: tourDetail,
      });
    } else {
      res.redirect(`/${pathAdmin}/tour/list`);
    }
  } catch (error) {
    res.redirect(`/${pathAdmin}/tour/list`);
  }
};
module.exports.editPatch = async (req, res) => {
  if (!req.permissions.includes("tour-edit")) {
    res.json({
      code: "error",
      message: "Không có quyền sử dụng tính năng này! ",
    });
    return;
  }
  try {
    const id = req.params.id;
    if (req.body.position) {
      req.body.position = parseInt(req.body.position);
    } else {
      const totalRecord = await Tour.countDocuments({});
      req.body.position = totalRecord + 1;
    }
    req.body.updateBy = req.account.id;
    if (req.file) {
      req.body.avatar = req.file.path;
    } else {
      delete req.body.avatar;
    }
    req.body.priceAdult = req.body.priceAdult
      ? parseInt(req.body.priceAdult)
      : 0;
    req.body.priceChildren = req.body.priceChildren
      ? parseInt(req.body.priceChildren)
      : 0;
    req.body.priceBaby = req.body.priceBaby ? parseInt(req.body.priceBaby) : 0;
    req.body.priceNewAdult = req.body.priceNewAdult
      ? parseInt(req.body.priceNewAdult)
      : req.body.priceAdult;
    req.body.priceNewChildren = req.body.priceNewChildren
      ? parseInt(req.body.priceNewChildren)
      : req.body.priceChildren;
    req.body.priceNewBaby = req.body.priceNewBaby
      ? parseInt(req.body.priceNewBaby)
      : req.body.priceBaby;
    req.body.stockAdult = req.body.stockAdult
      ? parseInt(req.body.stockAdult)
      : 0;
    req.body.stockChildren = req.body.stockChildren
      ? parseInt(req.body.stockChildren)
      : 0;
    req.body.stockBaby = req.body.stockBaby ? parseInt(req.body.stockBaby) : 0;
    req.body.locations = req.body.locations
      ? JSON.parse(req.body.locations)
      : [];
    req.body.departureDate = req.body.departureDate
      ? new Date(req.body.departureDate)
      : null;
    req.body.schedules = req.body.schedules
      ? JSON.parse(req.body.schedules)
      : [];
    if(req.files && req.files.images && req.files.images.length > 0) {
      req.body.images = req.files.images.map(file => file.path);
    } else {
      delete req.body.images;
    }
    await Tour.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body
    );
    req.flash("success", "Cập nhật tour thành công");
    res.json({
      code: "success",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "ID không tồn tại",
    });
  }
};
module.exports.deletePatch = async (req, res) => {
  if (!req.permissions.includes("tour-delete")) {
    res.json({
      code: "error",
      message: "Không có quyền sử dụng tính năng này! ",
    });
    return;
  }
  try {
    const id = req.params.id;
    await Tour.updateOne(
      {
        _id: id,
      },
      {
        deleted: true,
        deletedBy: req.account.id,
        deletedAt: Date.now(),
      }
    );
    req.flash("success", "Xóa tour thành công");
    res.json({
      code: "success",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "id không hợp lệ",
    });
  }
};
module.exports.ChangeMultiPatch = async (req, res) => {
    try {
    const {option, ids} = req.body;
    switch (option) {
      case "active":
      case "inactive":
        await Tour.updateMany({
          _id:{$in: ids}
        },{
          status:option
        })
        req.flash("success","Đổi trạng thái thành công!");
        break;
      case "delete":
        await Tour.updateMany({
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
module.exports.trash = async (req, res) => {
   const find = {
    deleted: true,
  };
 
  //phân trang

 const limitPages = 3;
  let page = parseInt(req.query.page) || 1;

  if (isNaN(page) || page < 1) {
    page = 1;
  }

  const totalRecord = await Tour.countDocuments(find);
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
  //hết phân trang
    // Tìm kiếm
  if(req.query.keyword) {
    const keyword = slugify(req.query.keyword, {
      lower: true
    });
    const keywordRegex = new RegExp(keyword);
    find.slug = keywordRegex;
  }
  // Hết Tìm kiếm


  const tourList = await Tour.find(find).sort({
    position: "asc",
  }).limit(limitPages)
  .skip(skip);
  
  for (const item of tourList) {
    if (item.createBy) {
      const infoAccountCreated = await AccountAdmin.findOne({
        _id: item.createBy,
      });
      item.createdByFullName = infoAccountCreated.fullName;
    }
    if (item.updateBy) {
      const infoAccountUpdated = await AccountAdmin.findOne({
        _id: item.updateBy,
      });
      item.updatedByFullName = infoAccountUpdated.fullName;
    }
    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
    item.updatedAtFormat = moment(item.updatedAt).format("HH:mm - DD/MM/YYYY");
  }

  res.render("admin/pages/tour-trash", {
    pageTitle: "Quản lý tour",
    tourList: tourList,
    pagination:pagination

  });
};
module.exports.undoPatch = async (req, res) => {
  if (!req.permissions.includes("tour-trash")) {
    res.json({
      code: "error",
      message: "Không có quyền sử dụng tính năng này!",
    });
    return;
  }
  try {
    const id = req.params.id;
    await Tour.updateOne(
      {
        _id: id,
      },
      {
        deleted: false,
      }
    );
    req.flash("success", "Khôi phục thành công");
    res.json({
      code: "success",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Id không hợp lệ",
    });
  }
};
module.exports.deleteDestroyPatch = async (req, res) => {
  if (!req.permissions.includes("tour-trash")) {
    res.json({
      code: "error",
      message: "Không có quyền sử dụng tính năng này!",
    });
    return;
  }
  try {
    const id = req.params.id;
    await Tour.deleteOne({
      _id: id,
    });
    req.flash("success", "Xóa vĩnh viễn");
    res.json({
      code: "success",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "ID khong tồn tại",
    });
  }
};
module.exports.trashChangeMultiPatch = async (req, res) => {
  if (!req.permissions.includes("tour-trash")) {
    res.json({
      code: " error ",
      message: "Không có quyền sử dụng tính năng này!",
    });
    return;
  }
  try {
    const { option, ids } = req.body;
    switch (option) {
      case "undo":
        // console.log("Chạy vào đây a")
        await Tour.updateMany(
          {
            _id: {
              $in: ids,
            },
          },
          {
            deleted: false,
          }
        );
        req.flash("success", "Khôi phục thành công");
        break;

      case "delete-destroy":
        // console.log("Chạy vào đây b")
        await Tour.deleteMany({
          _id: {
            $in: ids,
          },
        });
        req.flash("success", "Xóa vĩnh viễn thành công");
        break;
    }
    res.json({
      code: "success",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Id không tồn tại",
    });
  }
};
