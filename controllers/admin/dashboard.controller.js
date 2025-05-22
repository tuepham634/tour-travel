module.exports.dashboard = (req, res) => {
  if (!req.permissions.includes("dashboard-view")){
    res.json({
      code:"error",
      message:"Không có quyền sử dụng tính năng này! "
    })
    return;
  }
  res.render("Admin/pages/dashboard",{
    pageTitle:"Tổng Quan"
  })
  }