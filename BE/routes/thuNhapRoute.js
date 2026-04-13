const express = require('express');
const router = express.Router();
const sql = require('mssql');
require('dotenv').config();

// Cấu hình Database
const dbConfig = {
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    server: process.env.DB_SERVER,
    database: process.env.DB_NAME,
    options: {
        encrypt: false,
        trustServerCertificate: true
    }
};

// ==========================================
// API 1: THỐNG KÊ SỐ NGÀY ĐI TRỄ, ĐÚNG GIỜ TRONG THÁNG
// ==========================================
router.get('/thunhap/stats', async (req, res) => {
    // Kiểm tra đăng nhập
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const maNV = req.session.user.id;
    const thang = req.query.month;
    const nam = req.query.year;

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .input('thang', sql.Int, thang)
            .input('nam', sql.Int, nam)
            .query(`
                SELECT 
                    COUNT(MaCC) AS TongNgay,
                    SUM(CASE WHEN TrangThai LIKE N'%Đúng giờ%' THEN 1 ELSE 0 END) AS DungGio,
                    SUM(CASE WHEN TrangThai LIKE N'%Đi trễ%' THEN 1 ELSE 0 END) AS DiTre,
                    SUM(CASE WHEN TrangThai LIKE N'%Tăng ca%' THEN 1 ELSE 0 END) AS TangCa
                FROM ChamCong
                WHERE MaNV = @maNV AND MONTH(NgayCC) = @thang AND YEAR(NgayCC) = @nam
            `);

        res.json({ success: true, data: result.recordset[0] });
    } catch (err) {
        console.error("Lỗi lấy thống kê chấm công:", err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// Bạn có thể viết thêm API lấy bảng lương thật ở đây sau này
// router.get('/thunhap/salary', async (req, res) => { ... });

module.exports = router;