const Tour = require("../../models/tour.model");
const Order = require("../../models/order.model");
const variableConfig = require("../../config/variable");
const gererateHelper = require("../../helpers/generate.helper");

const moment = require("moment");
const City = require("../../models/city.model");

module.exports.createPost = async (req, res) => {
  try {
     req.body.orderCode = "OD" + gererateHelper.generateRandomNumber(10);
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
          infoTour.stockAdult < item.quantityAdult ||
          infoTour.stockChildren < item.quantityChildren ||
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
    req.body.subTotal = req.body.items.reduce((sum, item) => {
      return (
        sum +
        (item.priceNewAdult * item.quantityAdult +
          item.priceNewChildren * item.quantityChildren +
          item.priceNewBaby * item.quantityBaby)
      );
    }, 0);
    // Giảm
    req.body.discount = 0;
    // Thanh toán
    req.body.total = req.body.subTotal - req.body.discount;
    // Trạng thái thanh toán
    req.body.paymentStatus = "unpaid";

    // Trạng thái đơn hàng
    req.body.status = "initial";

    const newOrder = new Order(req.body);
    await newOrder.save();

    res.json({
      code: "success",
      message: "Đặt hàng thành công",
      orderId: newOrder.id,
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Đặt hàng thất bại",
    });
  }
};

module.exports.success = async (req, res) => {
  try {
    const { orderId, phone } = req.query;
    const orderDetail = await Order.findOne({
      _id: orderId,
      phone: phone,
    });
    if (!orderDetail) {
      res.redirect("/");
      return;
    }
    orderDetail.paymentMethodName = variableConfig.paymentMethod.find(
      (item) => item.value == orderDetail.paymentMethod
    ).label;

    orderDetail.paymentStatusName = variableConfig.paymentStatus.find(
      (item) => item.value == orderDetail.paymentStatus
    ).label;


    orderDetail.statusName = variableConfig.orderStatus.find(
      (item) => item.value == orderDetail.status
    ).label;

    orderDetail.createdAtFormat = moment(orderDetail.createdAt).format(
      "HH:mm-DD/MM/YYYY"
    );

    for (const item of orderDetail.items) {
      const infoTour = await Tour.findOne({
        _id: item.tourId,
        deleted: false,
      });
      if (infoTour) {
        item.slug = infoTour.slug;
      }
      item.departureDateFormat = moment(item.departureDate).format(
        "DD/MM/YYYY"
      );

      const city = await City.findOne({
        _id: item.locationFrom,
      });
      if (city) {
        item.locationFromName = city.name;
      }
    }
    console.log(orderDetail);
    res.render("client/pages/order-success", {
      pageTitle: "Đặt hàng thành công",
      orderDetail: orderDetail,
    });
  } catch (error) {
    console.error("Lỗi hiển thị trang success:", error); // Thêm dòng này
    res.redirect("/");
  }
};
