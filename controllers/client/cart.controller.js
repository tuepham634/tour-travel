const Tour = require("../../models/tour.model");
const City = require("../../models/city.model");
const moment = require("moment");

module.exports.cart = (req, res) => {
    res.render("client/pages/cart",{
      pageTitle:"Trang giỏ hàng"
    })
}
module.exports.detail = async(req, res) => {
  
  const cart = req.body;

  for(const item of cart){
      const tourInfo = await Tour.findOne({
        _id:item.tourId,
        deleted:false,
        status:"active"
      });

      if(tourInfo){
        item.avatar = tourInfo.avatar,
        item.name = tourInfo.name,
        item.slug = tourInfo.slug,
        item.departureDateFormat =moment(tourInfo.departureDate).format("DD/MM/YYYY");
        item.priceNewAdult = tourInfo.priceAdult,
        item.priceNewChildren = tourInfo.priceNewChildren,
        item.priceNewBaby = tourInfo.priceNewBaby;

        const city = await City.findOne({
          _id:item.locationFrom
        });
        item.locationFromName = city.name
      }
      else{
        //nếu không lấy được tour thì xóa tour khỏi giỏ hàng
        const indexItem = cart.findIndex(tour => tour.tourId == item.tourId);
        cart.splice(indexItem,1);
      }
  }
  res.json({
    code:"success",
    cart:cart
  })
}