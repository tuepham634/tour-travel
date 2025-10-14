const SettingWebsiteInfo = require("../../models/setting-website-info.model");
const Role = require("../../models/role.model");
const AccountAdmin = require("../../models/account-admin.model");
const permissionConfig = require("../../config/permission");
const bcrypt = require("bcryptjs");

module.exports.list = async (req, res) => {
  res.render("admin/pages/setting-list", {
    pageTitle: "Cài đặt chung",
  });
};

module.exports.websiteInfo = async (req, res) => {
  const settingWebsiteInfo = await SettingWebsiteInfo.findOne({});

  res.render("admin/pages/setting-website-info", {
    pageTitle: "Thông tin website",
    settingWebsiteInfo: settingWebsiteInfo,
  });
};

module.exports.websiteInfoPatch = async (req, res) => {
  if (req.files && req.files.logo) {
    req.body.logo = req.files.logo[0].path;
  } else {
    delete req.body.logo;
  }
  if (req.files && req.files.favicon) {
    req.body.favicon = req.files.favicon[0].path;
  } else {
    delete req.body.favicon;
  }
  const settingWebsiteInfo = await SettingWebsiteInfo.findOne({});
  if (settingWebsiteInfo) {
    await SettingWebsiteInfo.updateOne(
      {
        _id: settingWebsiteInfo.id,
      },
      req.body
    );
  } else {
    const newRecord = SettingWebsiteInfo(req.body);
    await newRecord.save();
  }
  req.flash("success", "Cập nhật thành công!");

  res.json({
    code: "success",
  });
};
module.exports.accountAdminList = async (req, res) => {
  const find = {
    deleted: false,
  };
  //Nhóm quyền
  const listRole = await Role.find({
    deleted: false,
  });
  //Lọc theo trạng thái
  if (req.query.status) {
    find.status = req.query.status;
  }
  //Lọc theo quyền
  if (req.query.role) {
    find.role = req.query.role;
  }

  // Lọc theo ngày tạo
  const dateFilter = {};
  if (req.query.dateStart) {
    const startDate = moment(req.query.dateStart).startOf("date").toDate();
    dateFilter.$gte = startDate;
  }
  if (req.query.dateStart) {
    const endDate = moment(req.query.dateEnd).endOf("date").toDate();
    dateFilter.$lte = endDate;
  }
  if (Object.keys(dateFilter).length > 0) {
    find.createdAt = dateFilter;
  }

  //Tìm kiếm
  if (req.query.keyword) {
    const keyword = req.query.keyword;
    const keywordRegex = new RegExp(keyword, "i"); // i = không phân biệt hoa thường

    console.log("name", keywordRegex);
    find.$or = [
      { fullName: keywordRegex },
      { phone: keywordRegex },
      { "items.name": keywordRegex },
    ];
  }

  // Phân trang
  const limitItems = 3;
  let page = 1;
  if (req.query.page) {
    const currentPage = parseInt(req.query.page);
    if (currentPage > 0) {
      page = currentPage;
    }
  }

  const totalRecord = await AccountAdmin.countDocuments(find);
  const totalPage = Math.ceil(totalRecord / limitItems);

  // Xử lý trường hợp không có bản ghi
  if (totalRecord === 0) {
    page = 1; // Đặt page về 1
  } else if (page > totalPage) {
    page = totalPage;
  }

  const skip = (page - 1) * limitItems;
  const pagination = {
    skip: skip,
    totalRecord: totalRecord,
    totalPage: totalPage,
  };
  const accountAdminList = await AccountAdmin.find(find)
    .sort({
      createdAt: "desc",
    })
    .limit(limitItems)
    .skip(skip);

  for (const item of accountAdminList) {
    if (item.role) {
      const roleInf = await Role.findOne({
        _id: item.role,
      });

      if (roleInf) {
        item.nameRole = roleInf.name;
      }
    }
  }
  console.log(accountAdminList);
  res.render("admin/pages/setting-account-admin-list", {
    pageTitle: "Tài khoản quản trị",
    accountAdminList: accountAdminList,
    listRole: listRole,
    pagination: pagination,
  });
};

module.exports.accountAdminCreate = async (req, res) => {
  const roleList = await Role.find({
    deleted: false,
  });

  res.render("admin/pages/setting-account-admin-create", {
    pageTitle: "Tạo tài khoản quản trị",
    roleList: roleList,
  });
};
module.exports.accountAdminCreatePost = async (req, res) => {
  if (!req.permissions.includes("setting-account-create")) {
    res.json({
      code: " error ",
      message: "Không có quyền sử dụng tính năng này!",
    });
    return;
  }
  const existAccount = await AccountAdmin.findOne({
    email: req.body.email,
  });
  if (existAccount) {
    res.json({
      code: "error",
      message: "Email đã tồn tại trong hệ thống!",
    });

    return;
  }

  req.body.createBy = req.account.id;
  req.body.updateBy = req.account.id;
  req.body.avatar = req.file ? req.file.path : "";

  // Mã hóa mật khẩu với bcrypt
  const salt = await bcrypt.genSalt(10); // Tạo ra chuỗi ngẫu nhiên có 10 ký tự
  req.body.password = await bcrypt.hash(req.body.password, salt);

  const newAccount = new AccountAdmin(req.body);
  await newAccount.save();
  req.flash("success", "Tạo thành công");
  res.json({
    code: "success",
  });
};

module.exports.accountAdminEdit = async (req, res) => {
  try {
    const roleList = await Role.find({
      deleted: false,
    });
    const id = req.params.id;
    const accountAdminDetail = await AccountAdmin.findOne({
      _id: id,
      deleted: false,
    });
    if (!accountAdminDetail) {
      res.redirect(`/${pathAdmin}/setting/account-admin/list`);
      return;
    }
    res.render("admin/pages/setting-account-admin-edit", {
      pageTitle: "Tạo tài khoản quản trị",
      roleList: roleList,
      accountAdminDetail: accountAdminDetail,
    });
  } catch (error) {
    res.redirect(`/${pathAdmin}/setting/account-admin/list`);
  }
};
module.exports.accountAdminEditPatch = async (req, res) => {
  if (!req.permissions.includes("setting-account-edit")) {
    res.json({
      code: " error ",
      message: "Không có quyền sử dụng tính năng này!",
    });
    return;
  }
  try {
    const id = req.params.id;
    req.body.updateBy = req.account.id;
    if (req.file) {
      req.body.avatar = req.file.path;
    } else {
      delete req.body.avatar;
    }

    // Mã hóa mật khẩu với bcrypt
    if (req.body.password) {
      const salt = await bcrypt.genSalt(10); // Tạo salt - Chuỗi ngẫu nhiên có 10 ký tự
      req.body.password = await bcrypt.hash(req.body.password, salt); // Mã hóa mật khẩu
    }

    await AccountAdmin.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body
    );
    req.flash("success", "Cập nhật tài khoản quản trị thành công!");

    res.json({
      code: "success",
    });
  } catch (error) {
    res.redirect(`/${pathAdmin}/setting/account-admin/list`);
  }
};
module.exports.changeMultiAccountAdminPatch = async (req, res) => {
  try {
    const { option, ids } = req.body;
    switch (option) {
      case "initial":
      case "active":
      case "inactive":
        await AccountAdmin.updateMany(
          {
            _id: { $in: ids },
          },
          {
            status: option,
          }
        );
        req.flash("success", "Đổi trạng thái thành công !");
        break;
      case "delete":
        await AccountAdmin.updateMany(
          {
            _id: { $in: ids },
          },
          {
            deleted: true,
            deletedBy: req.account.id,
            deletedAt: Date.now(),
          }
        );
        req.flash("success", "Xóa tài khoản quản trị thành công !");
        break;
      default:
        break;
    }
    res.json({
      code: "success",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Id không tồn tại trong hệ thống !",
    });
  }
};
module.exports.roleList = async (req, res) => {
  const roleList = await Role.find({});

  res.render("admin/pages/setting-role-list", {
    pageTitle: "Nhóm quyền",
    roleList: roleList,
  });
};

module.exports.roleCreate = async (req, res) => {
  res.render("admin/pages/setting-role-create", {
    pageTitle: "Tạo nhóm quyền",
    permissionList: permissionConfig.permissionList,
  });
};
module.exports.roleCreatePost = async (req, res) => {
  if (!req.permissions.includes("rolelist-create")) {
    res.json({
      code: " error ",
      message: "Không có quyền sử dụng tính năng này!",
    });
    return;
  }
  req.body.createBy = req.account.id;
  req.body.updateBy = req.account.id;
  const newRecord = Role(req.body);
  await newRecord.save();
  req.flash("success", "Tạo nhóm quyền thành công");
  res.json({
    code: "success",
  });
};
module.exports.roleEdit = async (req, res) => {
  try {
    const id = req.params.id;

    const roleDetail = await Role.findOne({
      _id: id,
      deleted: false,
    });

    if (roleDetail) {
      res.render("admin/pages/setting-role-edit", {
        pageTitle: "Chỉnh sửa nhóm quyền",
        permissionList: permissionConfig.permissionList,
        roleDetail: roleDetail,
      });
    } else {
      res.redirect(`/${pathAdmin}/setting/role/list`);
    }
  } catch (error) {
    res.redirect(`/${pathAdmin}/setting/role/list`);
  }
};

module.exports.roleEditPatch = async (req, res) => {
  if (!req.permissions.includes("rolelist-edit")) {
    res.json({
      code: " error ",
      message: "Không có quyền sử dụng tính năng này!",
    });
    return;
  }
  try {
    const id = req.params.id;

    req.body.updateBy = req.account.id;

    await Role.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body
    );

    req.flash("success", "Cập nhật nhóm quyền thành công!");

    res.json({
      code: "success",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Id không tồn tại!",
    });
  }
};
