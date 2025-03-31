const express = require('express')
const path = require('path')
require('dotenv').config()


const clientRoutes = require('./routes/client/index.route');
const app = express()
const port = 3000
const database = require('./config/database');
database.connect();
// Thiết lập views
app.set('views', path.join(__dirname,"views"))
app.set('view engine', 'pug')
// Thiết lập thư mục chứa file tĩnh của frontend
app.use(express.static(path.join(__dirname,"public")))
//thiết lập đường dẫn
app.use('/', clientRoutes);

app.listen(port, () => {
  console.log(`Website trang chạy trên cổng ${port}`)
})