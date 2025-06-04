const Tour = require("../../models/tour.model");
const moment = require("moment");
const slugify = require("slugify");

module.exports.list = async(req, res) => {
    const find = {
        deleted:false,
        status:"active"
    };
    //Điểm đi
    if(req.query.locationFrom){
        find.locations = req.query.locationFrom;
    }
    //hết điểm đi
    //điểm đến
    if(req.query.locationTo){
        const keyword = slugify(req.query.locationTo,{
            lower:true
        });
        const keywordRegex = new RegExp(keyword);
        find.slug = keywordRegex;
    }
    //hết điểm đến
    //Ngày khởi hành
    if(req.query.departureDate){
        find.departureDate = new Date(req.query.departureDate);
    }
    //Hết Ngày khởi hành
    //Số lượng hành khách
    //Người lớn
    if(req.query.stockAdult){
        find.stockAdult ={
            $gte:parseInt(req.query.stockAdult)
        }
    }
    //trẻ em
    if(req.query.stockChildren){
        find.stockChildren ={
            $gte:parseInt(req.query.stockChildren)
        }
    }
    //em bé
    if(req.query.stockBaby){
        find.stockBaby ={
            $gte:parseInt(req.query.stockBaby)
        }
    }
    //Hết số lượng khách hàng

    //Mức giá
    if(req.query.price){
        const [priceMin,priceMax] =req.query.price.split("-").map(item => parseInt(item));
        find.priceNewAdult={
            $gte:priceMin,
            $lte:priceMax
        }
    }
    //hết mức giá
    const tourList = await Tour.find(find).sort({
        position:"desc"
    })
    for(const item of tourList){
        item.departureDateFormat = moment(item.departureDate).format("DD/MM/YYYY");
    }
    
    res.render("client/pages/search",{
      pageTitle:"Trang kết quả tìm kiếm",
      tourList: tourList
    })
  }