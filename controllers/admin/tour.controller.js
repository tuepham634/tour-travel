module.exports.list = (req, res) => {
    res.render("Admin/pages/tour-list",{
        pageTitle:"Quản lý tour"
    })
}
module.exports.create = (req, res) => {
    res.render("Admin/pages/tour-create",{
        pageTitle:"Tạo tour"
    })
}
module.exports.trash = (req, res) => {
    res.render("Admin/pages/tour-trash",{
        pageTitle:"Thùng rác tour"
    })
}