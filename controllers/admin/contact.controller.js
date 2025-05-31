const Contact = require("../../models/contact.model");
const moment = require("moment");
module.exports.list = async (req, res) => {
  const find={
    deleted:false
  }
  const listContact = await Contact.find(find)
    .sort({
      createdAt: "desc"
    });
  for (const item of listContact) {
    item.createdAtFormat = moment(item.createdAt).format("HH:mm - DD/MM/YYYY");
  }

    res.render("admin/pages/contact-list", {
      pageTitle: "Thông tin liên hệ",
      listContact:listContact
    })
  }
  