const Order = require("../../models/order.model");
const City = require("../../models/city.model");
const variableConfig = require("../../config/variable");
const  axios  =  require ('axios'). default ;  // npm install axios
const  CryptoJS  =  require ('crypto-js');
const moment = require("moment");

module.exports.list = async (req, res) => {

    const find = {
        deleted: false
    };

    //Status order
    if (req.query.statusOrder) {
        find.status = req.query.statusOrder
    }

    //Payment Method
    if (req.query.namePayment) {
        find.paymentMethod = req.query.namePayment
    }

    //Status Payment
    if (req.query.statusPayment) {
        find.paymentStatus = req.query.statusPayment
    }

    //Filter Date
    const FilterDate = {}

    //dateStart
    if (req.query.dateStart) {
        const startDate = moment(req.query.dateStart).startOf("date").toDate();
        FilterDate.$gte = startDate;

    }
    //dateEnd
    if (req.query.dateEnd) {
        const endDate = moment(req.query.dateEnd).endOf("date").toDate();
        FilterDate.$lte = endDate;
    }
    //object.keys(FilterDate) : trả về 1 mảng key

    if (Object.keys(FilterDate).length > 0) {
        find.createdAt = FilterDate;
    }

    // Tìm kiếm không theo slug
    if (req.query.keyword) {

        const keyword = req.query.keyword;
        const keywordRegex = new RegExp(keyword, "i"); // i = không phân biệt hoa thường

        console.log("name", keywordRegex)
        find.$or = [
            { orderCode: keywordRegex },
            { fullName: keywordRegex },
            { phone: keywordRegex },
            { "items.name": keywordRegex }
        ];

    }

    // Phân trang
    const limit = 6;

    let page = 1

    if (req.query.page) {
        const pageCurrent = parseInt(req.query.page);
        if (pageCurrent > 0) {
            page = pageCurrent
        }
    }

    const skip = (page - 1) * limit

    const totalOrder = await Order.find({
        deleted: false
    })

    const totalPage = Math.ceil(totalOrder.length / limit)

    const pagination = {
        skip: skip,
        totalOrder: totalOrder,
        totalPage: totalPage
    }
    const orderList = await Order
        .find(find)
        .sort({
            createdAt: "desc"
        })
        .limit(limit)
        .skip(skip)

    for (const orderDetail of orderList) {
        orderDetail.paymentMethodName = variableConfig.paymentMethod.find(item => item.value == orderDetail.paymentMethod).label;
        orderDetail.paymentStatusName = variableConfig.paymentStatus.find(item => item.value == orderDetail.paymentStatus).label;
        orderDetail.statusName = variableConfig.orderStatus.find(item => item.value == orderDetail.status).label;

        // Chuyển về time hiện tại từ mongoose
        orderDetail.createdAtTime = moment(orderDetail.createdAt).format("HH:mm");
        orderDetail.createdAtDate = moment(orderDetail.createdAt).format("DD/MM/YYYY");

    }

    res.render('admin/pages/order-list', {
        pageTitle: "Danh sách order",
        orderList: orderList,
        pagination: pagination

    })
}

module.exports.edit = async (req, res) => {
  const id = req.params.id;
  const orderDetail = await Order.findOne({
    _id: id,
    deleted: false,
  });
  orderDetail.createdAtFormat = moment(orderDetail.createdAt).format(
    "YYYY-MM-DDTHH:mm"
  );

  for (const item of orderDetail.items) {
    const city = await City.findOne({
      _id: item.locationFrom,
    });
    item.locationFromName = city.name;
    item.departureDateFormat = moment(item.departureDate).format("DD/MM/YYYY");
  }
  // console.log(orderDetail.locationFromName)
  res.render("admin/pages/order-edit", {
    pageTitle: `Đơn hàng:${orderDetail.orderCode}`,
    orderDetail: orderDetail,
    paymentMethod: variableConfig.paymentMethod,
    paymentStatus: variableConfig.paymentStatus,
    orderStatus: variableConfig.orderStatus,
  });
};

module.exports.editPatch = async (req, res) => {
  try {
    // console.log("Body nhận được:", req.body);
    const id = req.params.id;
    const order = await Order.findOne({
      _id: id,
      deleted: false,
    });

    if (!order) {
      res.json({
        code: "error",
        message: "Thông tin đơn hàng không hợp lệ!",
      });
      return;
    }
    await Order.updateOne(
      {
        _id: id,
        deleted: false,
      },
      req.body
    );
  
    req.flash("success", "Cập nhật đơn hàng thành công!");

    res.json({
      code: "success",
    });
  } catch (error) {
    res.json({
      code: "error",
      message: "Thông tin đơn hàng không hợp lệ!",
    });
  }
};
module.exports.deletePatch = async (req, res) => {

    if (!req.permissions.includes("order-delete")) {
        res.json({
            code: "error",
            message: "Không có quyền sử dụng tính năng này!"
        })
        return;
    }


    try {
        const id = req.params.id
        // deleted Model

        await Order.updateOne({
            _id: id
        }, {
            deleted: true,
            deletedBy: req.account.id,
            deletedAt: Date.now()

        })

        req.flash("success", "Xóa tour thành công!");

        res.json({
            code: "success"
        })
    } catch (error) {
        req.flash("error", "Xóa tour thất bại!");
    }
}
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
