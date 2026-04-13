require('dotenv').config(); // Load biến môi trường từ file .env
const express = require('express');
const sql = require('mssql');
const path = require('path');

const app = express();
const session = require('express-session');

// ==========================================
// 1. CẤU HÌNH EJS VÀ THƯ MỤC FRONTEND
// ==========================================
app.set('view engine', 'ejs');
// Chỉ đường cho Node.js biết thư mục fe nằm ở ngoài
app.set('views', path.join(__dirname, '../fe')); 
// Cho phép web load CSS, JS, Hình ảnh từ thư mục fe
app.use(express.static(path.join(__dirname, '../fe')));
app.use(express.json());
app.use(session({
    secret: 'he-thong-cham-cong-secret',
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Đặt true nếu chạy HTTPS
}));

// ==========================================
// 2. CẤU HÌNH KẾT NỐI SQL SERVER
// ==========================================
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false, // Dùng cho localhost
        trustServerCertificate: true // Bỏ qua lỗi chứng chỉ
    }
};

// ==========================================
// 3. MIDDLEWARE KIỂM TRA ĐĂNG NHẬP
// ==========================================
const checkAuth = (req, res, next) => {
    // Nếu trong session có chứa thông tin user -> Đã đăng nhập
    if (req.session && req.session.user) {
        res.locals.user = req.session.user; // DÒNG QUAN TRỌNG NHẤT: Tự động truyền user cho mọi trang
        next(); // Cho phép đi tiếp vào trang bên trong
    } else {
        // Chưa đăng nhập -> Chuyển hướng ép về lại trang đăng nhập (route "/")
        res.redirect('/'); 
    }
};

// ==========================================
// 4. CÁC ĐƯỜNG DẪN (ROUTES) CỦA WEB
// ==========================================

// Trang đăng nhập (KHÔNG gắn bảo vệ, ai cũng vào được)
app.get("/", (req, res) => {
    // Nếu user đã đăng nhập rồi mà lỡ bấm vào route "/", đẩy họ thẳng vào trang chủ luôn
    if (req.session.user) {
        return res.redirect('/trangchu');
    }
    res.render("dangnhap"); 
});

// CÁC TRANG BÊN DƯỚI ĐỀU PHẢI QUA "checkAuth" (PHẢI ĐĂNG NHẬP)

// Trang chủ
// Thay thế route /trangchu hiện tại bằng đoạn này
app.get("/trangchu", checkAuth, async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        const maNV = req.session.user.id; // Lấy mã NV đang đăng nhập

        request.input('maNV', sql.VarChar, maNV);

        // 1. Lấy thông báo mới nhất (3 thông báo gần nhất)
        const tbResult = await request.query(`
            SELECT TOP 3 * FROM ThongBao 
            ORDER BY NgayDang DESC
        `);

        // 2. Lấy Công việc (Task) của nhân viên này chưa hoàn thành
        const cvResult = await request.query(`
            SELECT * FROM CongViec 
            WHERE MaNguoiNhan = @maNV AND TrangThai != N'Hoàn thành' 
            ORDER BY HanChot ASC
        `);

        // 3. Kiểm tra xem hôm nay nhân viên đã chấm công chưa
        const ccResult = await request.query(`
            SELECT * FROM ChamCong 
            WHERE MaNV = @maNV AND CAST(NgayCC AS DATE) = CAST(GETDATE() AS DATE)
        `);

        // 4. Truyền toàn bộ dữ liệu ra màn hình EJS
        res.render("Home_chamcong", { 
            user: req.session.user,
            thongBaoList: tbResult.recordset,
            congViecList: cvResult.recordset,
            chamCongToday: ccResult.recordset[0] || null // Lấy dòng đầu tiên nếu có
        });

    } catch (err) {
        console.error("Lỗi khi tải trang chủ:", err);
        res.status(500).send("Lỗi máy chủ khi tải trang chủ!");
    }
});

// Điều khoản
app.get("/dieukhoan", checkAuth, (req, res) => {
    res.render("dieukhoan"); 
});

// Trang hướng dẫn sử dụng
app.get("/huongdansudung", checkAuth, (req, res) => {
    res.render("huongdansudung"); 
});

// Trang Thu nhập
app.get("/ThuNhap", checkAuth, (req, res) => {
    res.render("ThuNhapj"); 
});

// Trang Đào tạo
app.get("/daotao", checkAuth, (req, res) => {
    res.render("daotao"); 
});

// Trang thông tin cá nhân user 
app.get("/user", checkAuth, async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const maNV = req.session.user.id; // Lấy mã nhân viên đang đăng nhập

        // Lấy toàn bộ thông tin nhân viên + Tên phòng ban
        const query = `
            SELECT nv.*, pb.TenPhong 
            FROM NhanVien nv
            LEFT JOIN PhongBan pb ON nv.MaPhong = pb.MaPhong
            WHERE nv.MaNV = @maNV
        `;
        
        const result = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .query(query);

        if (result.recordset.length > 0) {
            const userInfo = result.recordset[0];
            // Truyền userInfo ra file EJS
            res.render("user_chamcong", { 
                user: req.session.user, 
                userInfo: userInfo 
            });
        } else {
            res.redirect("/trangchu");
        }
    } catch (err) {
        console.error("Lỗi lấy thông tin user:", err);
        res.status(500).send("Lỗi máy chủ!");
    }
});

// Trang Admin (Chỉ Admin mới được vào)
app.get("/admin", checkAuth, (req, res) => {
    // Kiểm tra lớp bảo mật thứ 2: Session này có đúng là Admin không?
    if (req.session.user.role === 'Admin') {
        res.render("admin_chamcong", { user: req.session.user }); 
    } else {
        // Cố tình gõ link /admin mà là nhân viên thì đuổi về trang chủ
        res.redirect("/trangchu"); 
    }
});

// Trang tạo tài khoản (Chỉ Admin mới được mở)
app.get("/taotaikhoan", checkAuth, (req, res) => {
    if (req.session.user.role === 'Admin') {
        res.render("taotaikhoan"); 
    } else {
        res.redirect("/trangchu"); 
    }
});

// Trang Chấm công
app.get("/checkin", checkAuth, (req, res) => {
    res.render("checkin", { user: req.session.user }); 
});

// Để người dùng có thể Đăng Xuất
app.get("/logout", (req, res) => {
    req.session.destroy(); // Xóa session
    res.redirect("/"); // Đẩy về trang đăng nhập
});


// ==========================================
// 5. CÁC API CỦA HỆ THỐNG
// ==========================================

// API Test xem kết nối SQL Server có thành công không
app.get('/test-db', async (req, res) => {
    try {
        let pool = await sql.connect(dbConfig);
        let result = await pool.request().query('SELECT * FROM PhongBan');
        res.json({
            status: "Thành công!",
            message: "Đã kết nối được với SQL Server 🚀",
            data: result.recordset
        });
    } catch (err) {
        console.error("Lỗi kết nối DB:", err);
        res.status(500).json({ status: "Lỗi!", error: err.message });
    }
});

// API Thêm hồ sơ nhân viên mới
app.post('/api/add-employee', async (req, res) => {
    const { maNV, hoTen, maPhong, chucVu } = req.body;
    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // Kiểm tra xem Mã nhân viên đã tồn tại chưa
        const checkExist = await request
            .input('maNV_check', sql.VarChar, maNV)
            .query('SELECT MaNV FROM NhanVien WHERE MaNV = @maNV_check');

        if (checkExist.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Mã nhân viên này đã tồn tại trong hệ thống!' });
        }
 
        // Thực hiện Insert vào bảng NhanVien
        await request
            .input('maNV', sql.VarChar, maNV)
            .input('hoTen', sql.NVarChar, hoTen)
            .input('maPhong', sql.Int, maPhong)
            .input('chucVu', sql.NVarChar, chucVu)
            .query(`
                INSERT INTO NhanVien (MaNV, HoTen, MaPhong, ChucVu, NgayVaoLam)
                VALUES (@maNV, @hoTen, @maPhong, @chucVu, GETDATE())
            `);

        res.status(200).json({ success: true, message: 'Đã lưu hồ sơ nhân viên thành công! Vui lòng tạo tài khoản.' });

    } catch (err) {
        console.error("Lỗi thêm nhân viên:", err);
        res.status(500).json({ success: false, message: 'Lỗi server khi lưu hồ sơ nhân viên' });
    }
});

// ------------------------------------------
// NHÚNG CÁC ROUTER API TỪ FILE BÊN NGOÀI
// ------------------------------------------
const authRoutes = require('./routes/authRoute');
const attendanceRoutes = require('./routes/attendanceRoute'); 
const user_profile = require('./routes/user_profile'); 
const trainingRoutes = require('./routes/trainingRoute');
const thuNhapRoutes = require('./routes/thuNhapRoute'); 
const adminRoutes = require('./routes/adminRoute');

// Khai báo cho app biết đường dẫn
app.use('/api', authRoutes); 
app.use('/api', attendanceRoutes); 
app.use('/api', user_profile); 
app.use('/api', trainingRoutes);
app.use('/api', thuNhapRoutes); 
app.use('/api/admin', adminRoutes); // 2. Khai báo đường dẫn gốc cho admin
app.use('/minh_chung', express.static('minh_chung'));
// ==========================================
// 6. CHẠY SERVER
// ==========================================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`=========================================`);
    console.log(`🚀 Server Node.js đang chạy tại cổng ${PORT}`);
    console.log(`👉 Trang Chủ: http://localhost:${PORT}/`);
    console.log(`=========================================`);
});