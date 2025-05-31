const Tour = require("../../models/tour.model");
const moment = require("moment");
const categoryHelper = require("../../helpers/category.helper");
module.exports.home =  async (req, res) => {
  //Section2
  const tourListSection2 = await Tour.find({
    deleted:false,
    status:"active"
  }).sort({
    position:"desc"
  })
  .limit(6);

  for(const item of tourListSection2){
    item.departureDateFormat = moment(item.departureDate).format("DD/MM/YYYY");
  }


  //End Section2

  //Section4 Tour trong nươc
  const categoryIdSection4 = "681dab2fe0f543e13bb78116";
  const listcategoryId = await categoryHelper.getAllSubcategoryIds(categoryIdSection4);
  const tourlistSection4 = await Tour.find({
    category: {$in: listcategoryId},
    deleted:false,
    status:"active",
  })
  .sort({
      position: "desc"
  })
  .limit(8);
  for (const item of tourlistSection4) {
    item.departureDateFormat = moment(item.departureDate).format("DD/MM/YYYY");
  }
  //EndSection4
  res.render("client/pages/home",{
    pageTitle:"Trang chủ",
    tourListSection2:tourListSection2,
    tourlistSection4:tourlistSection4
  })
}

