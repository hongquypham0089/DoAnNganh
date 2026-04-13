const express = require('express');
const router = express.Router();
const sql = require('mssql');

const multer = require('multer');
const path = require('path');
const fs = require('fs');

require('dotenv').config();

const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: { encrypt: false, trustServerCertificate: true }
};

// Hàm "màng lọc" an toàn: Chuyển chuỗi rỗng hoặc lỗi thành NULL cho SQL Server hiểu
const parseDate = (dateStr) => {
    if (!dateStr || dateStr.trim() === '' || dateStr === 'undefined' || dateStr === 'null') {
        return null;
    }
    return dateStr;
};

// API: CẬP NHẬT THÔNG TIN CÁ NHÂN
router.post('/update-profile', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const maNV = req.session.user.id;
    const { type, data } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        request.input('maNV', sql.VarChar, maNV);

        let query = '';

        // Tách luồng câu lệnh SQL dựa trên loại Form
        if (type === 'basic') {
            query = `UPDATE NhanVien SET HoTen = @HoTen, NgaySinh = @NgaySinh, GioiTinh = @GioiTinh, QueQuan = @QueQuan, DanToc = @DanToc, TonGiao = @TonGiao WHERE MaNV = @maNV`;
            request.input('HoTen', sql.NVarChar, data.HoTen);
            request.input('NgaySinh', sql.Date, parseDate(data.NgaySinh));
            request.input('GioiTinh', sql.NVarChar, data.GioiTinh);
            request.input('QueQuan', sql.NVarChar, data.QueQuan);
            request.input('DanToc', sql.NVarChar, data.DanToc);
            request.input('TonGiao', sql.NVarChar, data.TonGiao);
        } 
        else if (type === 'address') {
            query = `UPDATE NhanVien SET DiaChi_ThuongTru = @DiaChi, SoDienThoai = @SDT, Email_CaNhan = @Email WHERE MaNV = @maNV`;
            request.input('DiaChi', sql.NVarChar, data.DiaChi);
            request.input('SDT', sql.VarChar, data.SDT);
            request.input('Email', sql.VarChar, data.Email);
        } 
        else if (type === 'id') {
            query = `UPDATE NhanVien SET CCCD = @CCCD, NgayCapCCCD = @NgayCap, NoiCapCCCD = @NoiCap, NgayHetHanCCCD = @NgayHetHan WHERE MaNV = @maNV`;
            request.input('CCCD', sql.VarChar, data.CCCD);
            request.input('NgayCap', sql.Date, parseDate(data.NgayCap));
            request.input('NoiCap', sql.NVarChar, data.NoiCap);
            request.input('NgayHetHan', sql.Date, parseDate(data.NgayHetHan));
        }

        else if (type === 'bank') {
            query = `UPDATE NhanVien SET 
                        TenNganHang = @TenNganHang, 
                        ChiNhanhNganHang = @ChiNhanh, 
                        SoTaiKhoan = @SoTaiKhoan, 
                        ChuTaiKhoan = @ChuTaiKhoan, 
                        MaSoThue = @MaSoThue 
                     WHERE MaNV = @maNV`;
                     
            request.input('TenNganHang', sql.NVarChar, data.TenNganHang);
            request.input('ChiNhanh', sql.NVarChar, data.ChiNhanh);
            request.input('SoTaiKhoan', sql.VarChar, data.SoTaiKhoan);
            request.input('ChuTaiKhoan', sql.NVarChar, data.ChuTaiKhoan);
            request.input('MaSoThue', sql.VarChar, data.MaSoThue);
        }    

        if (query !== '') {
            await request.query(query);
            res.status(200).json({ success: true, message: 'Cập nhật thành công!' });
        } else {
            res.status(400).json({ success: false, message: 'Loại cập nhật không hợp lệ' });
        }

    } catch (err) {
        console.error("Lỗi cập nhật Profile:", err);
        res.status(500).json({ success: false, message: 'Lỗi Database (Có thể do sai định dạng ngày tháng)' });
    }
});

// ==========================================
// API: ĐỔI MẬT KHẨU
// ==========================================
router.post('/change-password', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const maNV = req.session.user.id;
    const { currentPassword, newPassword } = req.body;

    try {
        const pool = await sql.connect(dbConfig);
        
        // 1. Kiểm tra mật khẩu hiện tại trong bảng TaiKhoan
        const checkRequest = pool.request();
        checkRequest.input('maNV', sql.VarChar, maNV);
        const checkResult = await checkRequest.query(`SELECT MatKhau FROM TaiKhoan WHERE MaNV = @maNV`);

        if (checkResult.recordset.length === 0) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy tài khoản!' });
        }

        const dbPassword = checkResult.recordset[0].MatKhau;

        // Lưu ý: Đang so sánh mật khẩu dạng chữ thường dựa theo CSDL mẫu của bạn.
        if (dbPassword !== currentPassword) {
            return res.status(400).json({ success: false, message: 'Mật khẩu hiện tại không đúng!' });
        }

        // 2. Cập nhật mật khẩu mới
        const updateRequest = pool.request();
        updateRequest.input('maNV', sql.VarChar, maNV);
        updateRequest.input('newPassword', sql.VarChar, newPassword);
        
        await updateRequest.query(`UPDATE TaiKhoan SET MatKhau = @newPassword WHERE MaNV = @maNV`);

        res.status(200).json({ success: true, message: 'Đổi mật khẩu thành công!' });

    } catch (err) {
        console.error("Lỗi đổi mật khẩu:", err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ cơ sở dữ liệu' });
    }
});

// ==========================================
// CẤU HÌNH MULTER: NƠI LƯU VÀ TÊN FILE ẢNH
// ==========================================
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Lưu vào thư mục fe/uploads/avatars 
        const dir = path.join(__dirname, '../../fe/uploads/avatars'); 
        if (!fs.existsSync(dir)){
            fs.mkdirSync(dir, { recursive: true }); // Tự tạo thư mục nếu chưa có
        }
        cb(null, dir);
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, 'avatar-' + uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ==========================================
// API: TẢI LÊN ẢNH ĐẠI DIỆN
// ==========================================
router.post('/upload-avatar', upload.single('avatar'), async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    if (!req.file) {
        return res.status(400).json({ success: false, message: 'Chưa chọn file ảnh' });
    }

    const maNV = req.session.user.id;
    // Đường dẫn để FE có thể hiển thị ảnh (vì folder fe đã được public ở server.js)
    const avatarUrl = '/uploads/avatars/' + req.file.filename;

    try {
        const pool = await sql.connect(dbConfig);
        const request = pool.request();
        
        request.input('maNV', sql.VarChar, maNV);
        request.input('avatarUrl', sql.VarChar, avatarUrl);
        
        // Lưu đường dẫn ảnh vào CSDL
        await request.query(`UPDATE NhanVien SET AnhDaiDien = @avatarUrl WHERE MaNV = @maNV`);

        res.status(200).json({ 
            success: true, 
            message: 'Cập nhật ảnh thành công!',
            avatarUrl: avatarUrl
        });

    } catch (err) {
        console.error("Lỗi cập nhật Avatar:", err);
        res.status(500).json({ success: false, message: 'Lỗi Database khi lưu ảnh' });
    }
});

module.exports = router;