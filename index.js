const express = require('express')
const path = require('path')
require('dotenv').config() //dùng để load các biến môi trường từ file .env vào process.env.
const adminRoutes = require('./routes/admin/index.route');
const clientRoutes = require('./routes/client/index.route');
const variableConfig = require("./config/variable");
const app = express()
const port = 3000
const database = require('./config/database');
database.connect();
// Thiết lập views
app.set('views', path.join(__dirname,"views"))
app.set('view engine', 'pug')
// Thiết lập thư mục chứa file tĩnh của frontend
app.use(express.static(path.join(__dirname,"public")))
// Tạo biến toàn cục trong file PUG
app.locals.pathAdmin = variableConfig.pathAdmin;
//Cho phép gửi data dạng json
app.use(express.json());
//thiết lập đường dẫn
app.use(`/${variableConfig.pathAdmin}`, adminRoutes);
app.use('/', clientRoutes);

app.listen(port, () => {
  console.log(`Website trang chạy trên cổng ${port}`)
})