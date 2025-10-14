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
  const categoryIdSection4 = "683fda500b3d833c43ee4b4e";
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

 
    //Section4 Tour nước ngoài
  const categoryIdSection6 = "683fdadc0b3d833c43ee4b5e";
  const listcategoryId6 = await categoryHelper.getAllSubcategoryIds(categoryIdSection6);
  const tourlistSection6 = await Tour.find({
    category: {$in: listcategoryId6},
    deleted:false,
    status:"active",
  })
  .sort({
      position: "desc"
  })
  .limit(8);
  for (const item of tourlistSection6) {
    item.departureDateFormat = moment(item.departureDate).format("DD/MM/YYYY");
  }
  //EndSection4
  
  res.render("client/pages/home",{
    pageTitle:"Trang chủ",
    tourListSection2:tourListSection2,
    tourlistSection4:tourlistSection4,
    tourlistSection6:tourlistSection6
  })
}

