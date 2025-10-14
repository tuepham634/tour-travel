const Contact = require("../../models/contact.model");
const moment = require("moment");
module.exports.list = async (req, res) => {
  const find = {
    deleted: false,
  };

  //Filter Date
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
  // Tìm kiếm không theo slug
  if (req.query.keyword) {
    const keyword = req.query.keyword;
    const keywordRegex = new RegExp(keyword, "i"); // i = không phân biệt hoa thường

    console.log("name", keywordRegex);
    find.$or = [{ email: keywordRegex }, { "items.name": keywordRegex }];
  }
  // Phân trang
  const limitItems = 5;
  let page = 1;
  if (req.query.page) {
    const currentPage = parseInt(req.query.page);
    if (currentPage > 0) {
      page = currentPage;
    }
  }

  const totalRecord = await Contact.countDocuments(find);
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
  // End phân trang
  const contactList = await Contact.find(find)
    .sort({
      createdAt: "desc",
    })
    .limit(limitItems)
    .skip(skip);

  for (const item of contactList) {
    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
  }
  res.render("admin/pages/contact-list", {
    pageTitle: "Thông tin liên hệ",
    listContact: contactList,
    pagination: pagination,
  });
};

module.exports.deletePatch = async (req, res) => {
  console.log("Chạy vào đây")
  // if (!req.permissions.includes("contact-delete")) {
  //   res.json({
  //     code: "error",
  //     message: "Không có quyền sử dụng tính năng này!",
  //   });
  //   console.log('Chạy vào if')
  //   return;
  // }
  try {
    console.log("Chạy vào try")
    const id = req.params.id;
    // deleted Model

    await Contact.updateOne(
      {
        _id: id,
      },
      {
        deleted: true,
        deletedBy: req.account.id,
        deletedAt: Date.now(),
      }
    );

    req.flash("success", "Xóa thông tin liên hệ thành công!");

    res.json({
      code: "success",
    });
  } catch (error) {
    req.flash("error", "Xóa thông tin liên hệ thất bại!");
  }
};
module.exports.changeMultiPatch = async (req, res) => {
  console.log("chạy vào đây:....")
  try {
    const { option, ids } = req.body;

    switch (option) {
      case "delete":
        await Contact.updateMany(
          {
            _id: { $in: ids },
          },
          {
            deleted: true,
            deletedBy: req.account.id,
            deletedAt: Date.now(),
          }
        );
        req.flash("success", "Xóa thành công!");
        break;
    }

    res.json({
      code: "success",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Id không tồn tại trong hệ thông!",
    });
  }
};