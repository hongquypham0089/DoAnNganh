const express = require('express');
const router = express.Router();
const sql = require('mssql');
require('dotenv').config();

// Cấu hình Database (Giống hệt bên server.js)
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
// API: LẤY LỊCH SỬ CHẤM CÔNG 7 NGÀY GẦN NHẤT
// Đường dẫn thực tế sẽ là: /api/attendance-history
// ==========================================
router.get('/attendance-history', async (req, res) => {
    // 1. Kiểm tra xem user đã đăng nhập chưa
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const maNV = req.session.user.id; // Lấy mã NV từ session

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .query(`
                SELECT TOP 7 
                    NgayCC, 
                    GioCheckIn, 
                    GioCheckOut, 
                    TrangThai, 
                    TongGioLam,
                    XacThucFaceID
                FROM ChamCong
                WHERE MaNV = @maNV
                ORDER BY NgayCC DESC
            `);

        res.status(200).json({ success: true, data: result.recordset });
    } catch (err) {
        console.error("Lỗi lấy lịch sử chấm công:", err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ' });
    }
});

// ==========================================
// API: XỬ LÝ CHECK-OUT
// ==========================================
router.post('/checkout', async (req, res) => {
    const { maNV } = req.body;

    if (!maNV) {
        return res.status(400).json({ success: false, message: 'Thiếu mã nhân viên' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        
        // SỬA LỖI TRÀN SỐ (OVERFLOW) TẠI ĐÂY:
        // Ép kiểu GETDATE() về TIME để DATEDIFF chỉ tính khoảng cách giữa 2 mốc giờ
        const result = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .query(`
                UPDATE ChamCong 
                SET 
                    GioCheckOut = CAST(GETDATE() AS TIME),
                    TongGioLam = CAST(DATEDIFF(MINUTE, GioCheckIn, CAST(GETDATE() AS TIME)) / 60.0 AS DECIMAL(5,2))
                WHERE MaNV = @maNV 
                  AND NgayCC = CAST(GETDATE() AS DATE)
                  AND GioCheckOut IS NULL
            `);

        if (result.rowsAffected[0] > 0) {
            res.status(200).json({ success: true, message: 'Check-out thành công' });
        } else {
            res.status(400).json({ success: false, message: 'Không tìm thấy lượt check-in hôm nay hoặc đã check-out rồi' });
        }
        
    } catch (err) {
        console.error("Lỗi khi update checkout:", err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ cơ sở dữ liệu' });
    }
});
// ==========================================
// API: TÍNH TỔNG GIỜ LÀM VÀ NGÀY CÔNG CỦA THÁNG MỚI NHẤT
// ==========================================
router.get('/current-month-hours', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const maNV = req.session.user.id; 

    try {
        const pool = await sql.connect(dbConfig);
        
        // Đếm thêm "SoNgayCong" bằng COUNT(DISTINCT NgayCC)
        const query = `
            DECLARE @LatestDate DATE = (SELECT MAX(NgayCC) FROM ChamCong WHERE MaNV = @maNV);
            
            SELECT 
                MONTH(@LatestDate) AS Thang,
                YEAR(@LatestDate) AS Nam,
                ISNULL(SUM(TongGioLam), 0) AS TongGioTrongThang,
                COUNT(DISTINCT NgayCC) AS SoNgayCong
            FROM ChamCong
            WHERE MaNV = @maNV 
              AND MONTH(NgayCC) = MONTH(@LatestDate)
              AND YEAR(NgayCC) = YEAR(@LatestDate);
        `;

        const result = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .query(query);

        if (result.recordset.length > 0 && result.recordset[0].Thang != null) {
            res.status(200).json({ 
                success: true, 
                data: result.recordset[0] 
            });
        } else {
            const currentDate = new Date();
            res.status(200).json({ 
                success: true, 
                data: { 
                    Thang: currentDate.getMonth() + 1, 
                    Nam: currentDate.getFullYear(), 
                    TongGioTrongThang: 0,
                    SoNgayCong: 0 // Trả về 0 ngày nếu chưa từng đi làm
                } 
            });
        }

    } catch (err) {
        console.error("Lỗi tính tổng giờ/ngày tháng:", err);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi tính giờ' });
    }
});

// ==========================================
// API: KIỂM TRA TRẠNG THÁI CHẤM CÔNG TRONG NGÀY
// ==========================================
router.get('/check-status', async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const maNV = req.session.user.id; 

    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('maNV', sql.VarChar, maNV)
            .query(`
                SELECT GioCheckIn, GioCheckOut 
                FROM ChamCong 
                WHERE MaNV = @maNV AND NgayCC = CAST(GETDATE() AS DATE)
            `);

        if (result.recordset.length > 0) {
            const record = result.recordset[0];
            if (record.GioCheckOut) {
                // Đã check-out xong trong ngày
                res.json({ success: true, status: 'completed' });
            } else {
                // Đã check-in nhưng chưa check-out
                res.json({ success: true, status: 'checked_in', checkInTime: record.GioCheckIn });
            }
        } else {
            // Chưa có record nào trong hôm nay -> Cần check-in
            res.json({ success: true, status: 'none' });
        }
    } catch (err) {
        console.error("Lỗi lấy trạng thái chấm công:", err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});
const multer = require('multer');
const path = require('path');

// Cấu hình lưu trữ chi tiết để giữ lại đuôi file (.png, .jpg)
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'minh_chung/'); // Thư mục lưu file
    },
    filename: function (req, file, cb) {
        // Tạo tên file duy nhất: Thời gian hiện tại + tên gốc của file
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({ storage: storage });

// ==========================================
// API: GỬI YÊU CẦU CHẤM CÔNG THỦ CÔNG
// ==========================================
router.post('/send-request', upload.single('evidence'), async (req, res) => {
    if (!req.session || !req.session.user) {
        return res.status(401).json({ success: false, message: 'Chưa đăng nhập' });
    }

    const maNV = req.session.user.id;
    const { loaiYeuCau, lyDo } = req.body;
    
    // req.file.filename bây giờ sẽ có đuôi file (ví dụ: 1712345678.png)
    const minhChung = req.file ? req.file.filename : null; 

    if (!minhChung) {
        return res.status(400).json({ success: false, message: 'Vui lòng tải lên ảnh minh chứng' });
    }

    try {
        const pool = await sql.connect(dbConfig);
        
        await pool.request()
            .input('MaNV', sql.VarChar, maNV)
            .input('LoaiYeuCau', sql.NVarChar, loaiYeuCau)
            .input('LyDo', sql.NVarChar, lyDo)
            .input('AnhMinhChung', sql.VarChar, minhChung)
            .query(`
                INSERT INTO YeuCauChamCong (MaNV, LoaiYeuCau, LyDo, AnhMinhChung, ThoiGianGui, TrangThai)
                VALUES (@MaNV, @LoaiYeuCau, @LyDo, @AnhMinhChung, GETDATE(), N'Chờ duyệt')
            `);

        res.json({ 
            success: true, 
            message: 'Yêu cầu của bạn đã được gửi thành công!' 
        });

    } catch (err) {
        console.error("Lỗi gửi yêu cầu:", err.message);
        res.status(500).json({ success: false, message: 'Lỗi hệ thống khi lưu yêu cầu.' });
    }
});
// Xuất router ra để server.js có thể gọi được
module.exports = router;