const express = require('express');
const router = express.Router();
const sql = require('mssql');
require('dotenv').config(); // Load biến môi trường

// Cấp lại bản đồ cấu hình DB cho riêng file này
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

router.post('/login', async (req, res) => {
    const { username, password } = req.body;
    
    try {
        // GỌI CHÍNH XÁC POOL KẾT NỐI VÀO ĐÂY
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        // Truy vấn bảng TaiKhoan, join với NhanVien và VaiTro để lấy thông tin
        request.input('user', sql.VarChar, username);
        request.input('pass', sql.VarChar, password);
        
        const query = `
            SELECT tk.MaNV, tk.TenDangNhap, nv.HoTen, vt.TenVaiTro 
            FROM TaiKhoan tk
            JOIN NhanVien nv ON tk.MaNV = nv.MaNV
            JOIN VaiTro vt ON tk.MaVaiTro = vt.MaVaiTro
            WHERE tk.TenDangNhap = @user AND tk.MatKhau = @pass AND tk.TrangThai = 1
        `;
        
        const result = await request.query(query);

        // Nếu tìm thấy user khớp tài khoản và mật khẩu
        if (result.recordset.length > 0) {
            const user = result.recordset[0];
            
            // Lưu thông tin vào session
            req.session.user = { 
                id: user.MaNV, 
                TenNhanVien: user.HoTen, 
                role: user.TenVaiTro 
            };
            
            return res.status(200).json({ 
                success: true, 
                message: 'Đăng nhập thành công', 
                role: user.TenVaiTro,
                hoTen: user.HoTen
            });
        } else {
            return res.status(401).json({ 
                success: false, 
                message: 'Sai tên đăng nhập hoặc mật khẩu!' 
            });
        }
    } catch (err) {
        console.error("Lỗi SQL khi đăng nhập:", err);
        return res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});


// ==========================================
// API TẠO TÀI KHOẢN (Nên cấu hình chỉ Admin mới gọi được)
// ==========================================
router.post('/create-account', async (req, res) => {
    const { maNV, username, password, role } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();

        // 1. Kiểm tra xem Mã nhân viên này có tồn tại trong bảng NhanVien không?
        const checkNV = await request.input('maNV_check', sql.VarChar, maNV)
            .query('SELECT HoTen FROM NhanVien WHERE MaNV = @maNV_check');
            
        if (checkNV.recordset.length === 0) {
            return res.status(400).json({ success: false, message: 'Mã nhân viên không tồn tại trong hệ thống!' });
        }

        // 2. Kiểm tra xem Tên đăng nhập hoặc Mã NV đã có tài khoản chưa?
        const checkTK = await request
            .input('username_check', sql.VarChar, username)
            .input('maNV_tk_check', sql.VarChar, maNV)
            .query('SELECT * FROM TaiKhoan WHERE TenDangNhap = @username_check OR MaNV = @maNV_tk_check');
            
        if (checkTK.recordset.length > 0) {
            return res.status(400).json({ success: false, message: 'Tên đăng nhập đã bị trùng hoặc Nhân viên này đã có tài khoản!' });
        }

        // 3. Tiến hành Insert vào bảng TaiKhoan
        await request
            .input('username', sql.VarChar, username)
            .input('password', sql.VarChar, password)
            .input('maNV', sql.VarChar, maNV)
            .input('role', sql.Int, role)
            .query(`
                INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaNV, MaVaiTro, TrangThai)
                VALUES (@username, @password, @maNV, @role, 1)
            `);

        res.status(200).json({ success: true, message: `Đã tạo tài khoản thành công cho nhân viên: ${checkNV.recordset[0].HoTen}` });

    } catch (err) {
        console.error("Lỗi tạo tài khoản:", err);
        res.status(500).json({ success: false, message: 'Lỗi server khi tạo tài khoản' });
    }
});

module.exports = router;