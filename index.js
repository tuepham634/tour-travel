const express = require('express')
const path = require('path')
<<<<<<< HEAD
require('dotenv').config()
const mongoose = require('mongoose');
mongoose.connect(process.env.DATABASE);
=======
const mongoose = require('mongoose');
mongoose.connect('mongodb+srv://tuepham634:160104@cluster0.6ivfjre.mongodb.net/tour-management');
>>>>>>> 7b086d182ff63f2a5346e3af59eb550767400a97

const Tour = mongoose.model('Tour', {
   name: String ,
   vehicle: String
});


const app = express()
const port = 3000

// Thiết lập views
app.set('views', path.join(__dirname,"views"))
app.set('view engine', 'pug')
// Thiết lập thư mục chứa file tĩnh của frontend
app.use(express.static(path.join(__dirname,"public")))
app.get('/', (req, res) => {
  res.render("client/pages/home",{
    pageTitle:"Trang chủ"
  })
})
app.get('/tours',async(req, res) => {
    const tourList = await Tour.find({});
    console.log(tourList);
    res.render("client/pages/tour-list",{
      pageTitle:"Danh sách tour",
      tourList:tourList
    })
  })
app.listen(port, () => {
  console.log(`Website trang chạy trên cổng ${port}`)
})