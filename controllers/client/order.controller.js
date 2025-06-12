const Tour = require("../../models/tour.model");
const Order = require("../../models/order.model");

module.exports.createPost = async (req, res) => {
  try {
    console.log(req.body.items);
    // Danh sách tour
    for (const item of req.body.items) {
      const infoTour = await Tour.findOne({
        _id: item.tourId,
        deleted: false,
        status: "active",
      });
      if (infoTour) {
        // Thêm giá
        item.priceNewAdult = infoTour.priceAdult;
        item.priceNewChildren = infoTour.priceChildren;
        item.priceNewBaby = infoTour.priceBaby;
        // Ngày khởi hành
        item.departureDate = infoTour.departureDate;
        // Ảnh
        item.avatar = infoTour.avatar;
        // Tiêu đề
        item.name = infoTour.name;
        // Cập nhật lại số lượng còn lại của tour
        if (
          infoTour.stockAdult < item.quantityAdult  ||
          infoTour.stockChildren < item.quantityChildren  ||
          infoTour.stockBaby < item.quantityBaby 
        ) {
          res.json({
            code: "error",
            message: `Số lượng chỗ của tour ${item.name} đã hết, vui lòng chọn lại`,
          });
          return;
        }

        await Tour.updateOne(
          {
            _id: item.tourId,
          },
          {
            stockAdult: infoTour.stockAdult - item.quantityAdult,
            stockChildren: infoTour.stockChildren - item.quantityChildren,
            stockBaby: infoTour.stockBaby - item.quantityBaby,
          }
        );
      }
    }

    // Thanh toán
    // Tạm tính
    req.body.Subtotal = req.body.items.reduce((sum, item) => {
      return (
        sum +
        ((item.priceNewAdult * item.quantityAdult) +
          (item.priceNewChildren * item.quantityChildren) + 
          (item.priceNewBaby * item.quantityBaby)
        )
      );
    },0);
    // Giảm
    req.body.discount = 0;
    // Thanh toán
    req.body.total = req.body.Subtotal - req.body.discount;
    // Trạng thái thanh toán
    req.body.paymentsStatus = "unpaid";

    // Trạng thái đơn hàng
    req.body.status = "initial";

    console.log(req.body);
    const newOrder = new Order(req.body);
    await newOrder.save();

    res.json({
      code: "success",
      message: "Đặt hàng thành công"
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Đặt hàng thất bại"
    });
  }
};
