const Category = require("../../models/category.model")
const Tour = require("../../models/tour.model");
const categoryHelper = require("../../helpers/category.helper");
const moment = require("moment");
module.exports.list = async (req, res) => {
    //lấy slug từ params
    const slug = req.params.slug
    //Tìm danh mục theo slug
    const category = await Category.findOne({
        slug: slug,
        deleted: false,
        status: "active"
    })
    if (category) {
        const breadcrumb = {
            image: category.avatar,
            title: category.name,
            list: [{
                link: "/",
                title: "Trang Chủ"
            },]
        };

        // Tìm danh mục cha
        // Tìm danh mục cha
        if (category.parent) {
            const parentCategory = await Category.findOne({
                _id: category.parent,
                deleted: false,
                status: "active"
            })

            if (parentCategory) {
                breadcrumb.list.push({
                    link: `/category/${parentCategory.slug}`,
                    title: parentCategory.name
                })
            }
        }

        // Thêm danh mục hiện tại
        breadcrumb.list.push({
            link: `/category/${category.slug}`,
            title: category.name
        })
        // End Breadcrumb
        //Danh sách tour
        const listcategoryId = await categoryHelper.getAllSubcategoryIds(category.id);
        const find = {
            category: {$in :listcategoryId},
            deleted:false,
            status:"active"
        }
        const totalTour = await Tour.countDocuments(find);
        const tourList = await Tour.find(find).sort({position:"desc"});
        for (const item of tourList) {
            item.departureDateFormat = moment(item.departureDate).format("DD-MM-YYYY");
            
        }
        // Hết Danh sách tour

        res.render("client/pages/tour-list", {
            pageTitle: "Danh sách tour",
            breadcrumb: breadcrumb,
            category: category,
            tourList: tourList,
            totalTour: totalTour
        });
    } else {
        res.redirect("/");
    }

}