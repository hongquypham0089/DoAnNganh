const express = require('express');
const router = express.Router();
const sql = require('mssql');

// API lấy danh sách tài liệu và video (có lọc theo danh mục nếu cần)
router.get('/training/items', async (req, res) => {
    try {
        const category = req.query.category; // Nhận slug như 'che-bien', 'cong-thuc'
        let query = `
            SELECT k.*, d.TenDanhMuc 
            FROM KhoaHoc k
            LEFT JOIN DanhMucKhoaHoc d ON k.MaDanhMuc = d.MaDanhMuc
        `;

        const request = new sql.Request();
        
        if (category && category !== 'all') {
            // Lọc trực tiếp bằng cột Slug cho chính xác tuyệt đối
            query += ` WHERE d.Slug = @category`;
            request.input('category', sql.VarChar, category);
        }

        const result = await request.query(query);
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error("Lỗi lấy dữ liệu đào tạo:", err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});
// ==========================================
// API: LẤY DANH SÁCH DANH MỤC & SỐ LƯỢNG BÀI HỌC
// ==========================================
router.get('/training/categories', async (req, res) => {
    try {
        const query = `
            SELECT 
                d.MaDanhMuc, 
                d.TenDanhMuc, 
                d.Slug, 
                d.Icon, 
                d.MoTa,
                COUNT(k.MaKhoaHoc) AS SoLuong
            FROM DanhMucKhoaHoc d
            LEFT JOIN KhoaHoc k ON d.MaDanhMuc = k.MaDanhMuc
            GROUP BY d.MaDanhMuc, d.TenDanhMuc, d.Slug, d.Icon, d.MoTa
            ORDER BY d.MaDanhMuc ASC
        `;
        
        const pool = await sql.connect(); // Dùng connection pool hiện tại
        const result = await pool.request().query(query);
        
        res.json({ success: true, data: result.recordset });
    } catch (err) {
        console.error("Lỗi lấy danh mục:", err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});
module.exports = router;