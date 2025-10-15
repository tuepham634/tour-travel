#  Website_TourTravel

##  Giới thiệu
**Website_Tourism** là dự án web quản lý và đặt tour du lịch trực tuyến, được xây dựng bằng **Node.js**, **Express**, **Mongoose**,  **Pug**  và triển khai ứng dụng trên Render
Ứng dụng cho phép người dùng xem tour, đặt tour, thanh toán trực tuyến qua **ZaloPay** hoặc **VNPay**, đồng thời hỗ trợ quản trị viên quản lý dữ liệu tour, khách hàng và thanh toán.

 **Demo:** https://tourtravel-fau1.onrender.com/


 Trang admin : 
 ![alt text](/tour-travel/public/assets/images/image.png)
 Trang đăng nhập :
 ![alt text](/tour-travel/public/assets/images/dang-nhap.png)
 Trang chủ
 ![alt text](/tour-travel/public/assets/images/trangchu.png)

## Cài đặt & Chạy chương trình

## Clone repo 
    git clone https://github.com/tuepham634/tour-travel.git
    cd tour-travel

## Cài dependencies
    yarn install   # hoặc npm install

## Tạo file .env
    cp .env.example .env

## Chạy server backend (development)
    yarn start        #Server chạy mặc định trên localhost:5000
---

##  Công nghệ sử dụng
- **Node.js + Express** – Framework backend chính  
- **Mongoose (MongoDB)** – Quản lý cơ sở dữ liệu  
- **Pug** – Template engine hiển thị giao diện động  
- **bcryptjs** – Mã hóa mật khẩu người dùng  
- **jsonwebtoken (JWT)** – Xác thực người dùng bằng token  
- **express-session + express-flash** – Lưu session và hiển thị thông báo  
- **nodemailer** – Gửi email xác nhận, khôi phục mật khẩu  
- **cloudinary + multer-storage-cloudinary** – Lưu trữ ảnh trên Cloud  
- **moment** – Xử lý thời gian hiển thị  
- **axios** – Gửi yêu cầu HTTP  
- **ZaloPay / VNPay** – Tích hợp thanh toán trực tuyến  
- **dotenv** – Quản lý biến môi trường  
- **yarn** – Quản lý dependencies và scripts

---



| Tài khoản                                       | Mật khẩu      |
| ----------------------------------------------- | ------------- |
| **[phamtueksnb@gmail.com](phamtueksnb@gmail.com)** | **Tuepham634@** |

                                                                                                               

## Dự án này thể hiện kỹ năng của tôi trong việc:

Xây dựng ứng dụng web Node.js + MongoDB có xác thực và phân quyền người dùng

Thiết kế giao diện bằng Pug và hiển thị dữ liệu lên.

Tích hợp thanh toán điện tử (ZaloPay, VNPay)

Quản lý ảnh qua Cloudinary

Gửi mail tự động qua Nodemailer

Tổ chức mã nguồn rõ ràng theo mô hình MVC

Triển khai ứng dụng thực tế lên Render


