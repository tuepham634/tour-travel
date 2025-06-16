const Tour = require("../../models/tour.model");
const Order = require("../../models/order.model");
const variableConfig = require("../../config/variable");
const gererateHelper = require("../../helpers/generate.helper");
const axios = require('axios').default; // npm install axios
const CryptoJS = require('crypto-js');

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

module.exports.paymentZaloPay = async (req, res) => {
  try {
    const orderId = req.query.orderId;
  
    const orderDetail = await Order.findOne({
      _id: orderId,
      paymentStatus: "unpaid",
      deleted: false
    });

    if(!orderDetail) {
      res.redirect("/");
      return;
    }

    // APP INFO
    const config = {
      app_id: process.env.ZALOPAY_APPID,
      key1: process.env.ZALOPAY_KEY1,
      key2: process.env.ZALOPAY_KEY2,
      endpoint: `${process.env.ZALOPAY_DOMAIN}/v2/create`
    };

    const embed_data = {
      redirecturl: `${process.env.DOMAIN_WEBSITE}/order/success?orderId=${orderDetail.id}&phone=${orderDetail.phone}`
    };

    const items = [{}];
    const transID = Math.floor(Math.random() * 1000000);
    const order = {
      app_id: config.app_id,
      app_trans_id: `${moment().format('YYMMDD')}_${transID}`, // translation missing: vi.docs.shared.sample_code.comments.app_trans_id
      app_user: `${orderDetail.phone}-${orderDetail.id}`,
      app_time: Date.now(), // miliseconds
      item: JSON.stringify(items),
      embed_data: JSON.stringify(embed_data),
      amount: orderDetail.total,
      description: `Thanh toán đơn hàng ${orderDetail.orderCode}`,
      bank_code: "",
      callback_url: `${process.env.DOMAIN_WEBSITE}/order/payment-zalopay-result`
    };

    // appid|app_trans_id|appuser|amount|apptime|embeddata|item
    const data = config.app_id + "|" + order.app_trans_id + "|" + order.app_user + "|" + order.amount + "|" + order.app_time + "|" + order.embed_data + "|" + order.item;
    order.mac = CryptoJS.HmacSHA256(data, config.key1).toString();

    const response = await axios.post(config.endpoint, null, { params: order });
    console.log("ZaloPay response:", response.data);
    if(response.data.return_code == 1) {
      res.redirect(response.data.order_url);
    } else {
      res.redirect("/");
    }
  } catch (error) {
    res.redirect("/");
  }
}

module.exports.paymentZaloPayResultPost = async (req, res) => {
  const config = {
    key2: process.env.ZALOPAY_KEY2
  };

  let result = {};

  try {
    let dataStr = req.body.data;
    let reqMac = req.body.mac;

    let mac = CryptoJS.HmacSHA256(dataStr, config.key2).toString();
    console.log("mac =", mac);


    // kiểm tra callback hợp lệ (đến từ ZaloPay server)
    if (reqMac !== mac) {
      // callback không hợp lệ
      result.return_code = -1;
      result.return_message = "mac not equal";
    }
    else {
      // thanh toán thành công
      let dataJson = JSON.parse(dataStr, config.key2);
      const [ phone, orderId ] = dataJson.app_user.split("-");

      await Order.updateOne({
        _id: orderId,
        phone: phone,
        deleted: false
      }, {
        paymentStatus: "paid"
      })

      result.return_code = 1;
      result.return_message = "success";
    }
  } catch (ex) {
    result.return_code = 0; // ZaloPay server sẽ callback lại (tối đa 3 lần)
    result.return_message = ex.message;
  }

  // thông báo kết quả cho ZaloPay server
  res.json(result);
}

