const Tour = require("../../models/tour.model");
const moment = require("moment");
module.exports.home =  async (req, res) => {
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

  res.render("client/pages/home",{
    pageTitle:"Trang chủ",
    tourListSection2:tourListSection2
  })
}