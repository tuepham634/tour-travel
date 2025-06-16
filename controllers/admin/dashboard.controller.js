const AccountAdmin = require("../../models/account-admin.model");
const Order = require("../../models/order.model");
const variableConfig = require("../../config/variable");
const moment = require("moment");
module.exports.dashboard = async (req, res) => {
  if (!req.permissions.includes("dashboard-view")) {
    res.json({
      code: "error",
      message: "Không có quyền sử dụng tính năng này! ",
    });
    return;
  }
  // Section 1
  const overview = {
    totalAdmin: 0,
    totalUser: 0,
    totalOrder: 0,
    totalPrice: 0,
  };

  overview.totalAdmin = await AccountAdmin.countDocuments({
    deleted: false,
  });

  const orderList = await Order.find({
    deleted: false,
  });

  overview.totalOrder = orderList.length;

  overview.totalPrice = orderList.reduce((sum, item) => {
    return sum + item.total;
  }, 0);
  // End Section 1

  // Các đơn hàng mới
  const orderListNew = await Order.find({
    deleted:false,
  })
  .sort({
    createdAt: "desc"
  })
  .limit(3)
  for (const orderDetail of orderListNew) {
      orderDetail.paymentMethodName = variableConfig.paymentMethod.find(
        (item) => item.value == orderDetail.paymentMethod
      ).label;
  
      orderDetail.paymentStatusName = variableConfig.paymentStatus.find(
        (item) => item.value == orderDetail.paymentStatus
      ).label;
  
      orderDetail.statusName = variableConfig.orderStatus.find(
        (item) => item.value == orderDetail.status
      ).label;
  
      orderDetail.createdAtTime = moment(orderDetail.createdAt).format("HH:mm");
      orderDetail.createdAtDate = moment(orderDetail.createdAt).format(
        "DD/MM/YYYY"
      );
    }
  console.log(orderListNew);
  res.render("Admin/pages/dashboard", {
    pageTitle: "Tổng Quan",
    overview: overview,
    orderListNew:orderListNew
  });
};

module.exports.revenueChartPost = async (req, res) => {
  const { currentMonth, currentYear, previousMonth, previousYear, arrayDay } =
    req.body;
  //truy vấn tất cả đơn hàng trong tháng hiện tại
  const ordersCurrentMonth = await Order.find({
    deleted: false,
    createdAt: {
      $gte: new Date(currentYear, currentMonth - 1, 1),
      $lt: new Date(currentYear, currentMonth, 1),
    },
  });

  //truy vấn tất cả đơn hàng trong tháng trước
  const ordersPreviousMonth = await Order.find({
    deleted: false,
    createdAt: {
      $gte: new Date(previousYear, previousMonth - 1, 1),
      $lt: new Date(previousYear, previousMonth, 1),
    },
  });
  //Tạo mảng doanh thu theo từng ngày
  const dataMonthCurrent = [];
  const dataMonthPrevious = [];
  for (const day of arrayDay) {
    //Tính tổng doanh thu theo ngày của tháng này
    let totalCurrent = 0;
    for (const order of ordersCurrentMonth) {
      const orderDate = new Date(order.createdAt).getDate();
      if (day == orderDate) {
        totalCurrent += order.total;
      }
    }
    dataMonthCurrent.push(totalCurrent);

    //Tính tổng doanh thu theo ngày của tháng này
    let totalPrevious = 0;
    for (const order of ordersPreviousMonth) {
      const orderDate = new Date(order.createdAt).getDate();
      if (day == orderDate) {
        totalPrevious += order.total;
      }
    }
    dataMonthPrevious.push(totalPrevious);
  }

  res.json({
    code: "success",
    dataMonthCurrent: dataMonthCurrent,
    dataMonthPrevious: dataMonthPrevious,
  });
};
