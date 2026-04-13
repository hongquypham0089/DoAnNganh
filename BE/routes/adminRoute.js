const express = require('express');
const router = express.Router();
const sql = require('mssql');

// Cấu hình kết nối (Bắt buộc phải có trong mỗi file route nếu dùng kết nối riêng)
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

router.get('/employees', async (req, res) => {
    try {
        // PHẢI truyền dbConfig vào đây
        const pool = await sql.connect(dbConfig); 
        const result = await pool.request().query(`
            SELECT 
                nv.MaNV, 
                nv.HoTen, 
                nv.Email_CongTy, 
                pb.TenPhong, 
                nv.ChucVu, 
                nv.SoDienThoai, 
                nv.AnhDaiDien,
                tk.TrangThai
            FROM NhanVien nv
            LEFT JOIN PhongBan pb ON nv.MaPhong = pb.MaPhong
            LEFT JOIN TaiKhoan tk ON nv.MaNV = tk.MaNV
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error("Lỗi API quản trị:", err.message);
        res.status(500).json({ success: false, message: "Lỗi kết nối CSDL" });
    }
});

router.get('/dashboard-stats', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        // 1. Lấy tổng số nhân viên hiện có trong công ty
        const resultTongNV = await pool.request().query(`
            SELECT COUNT(*) AS TongNhanVien 
            FROM NhanVien
        `);
        const tongNhanVien = resultTongNV.recordset[0].TongNhanVien;

        // 2. Đếm số nhân viên đã chấm công hôm nay
        const resultDiLam = await pool.request().query(`
            SELECT COUNT(DISTINCT MaNV) AS DiLamHomNay 
            FROM ChamCong 
            WHERE CAST(NgayCC AS DATE) = CAST(GETDATE() AS DATE)
        `);
        const diLamHomNay = resultDiLam.recordset[0].DiLamHomNay;

        // 3. Đếm số nhân viên ĐI TRỄ hôm nay (THÊM ĐOẠN NÀY)
        // Dựa vào các biểu đồ trước của bạn, mình bắt các chữ 'Đi trễ' hoặc 'Đi muộn'
        const resultDiTre = await pool.request().query(`
            SELECT COUNT(DISTINCT MaNV) AS DiTreHomNay 
            FROM ChamCong 
            WHERE CAST(NgayCC AS DATE) = CAST(GETDATE() AS DATE)
              AND (TrangThai LIKE N'%Đi trễ%' OR TrangThai LIKE N'%Đi muộn%')
        `);
        const diTreHomNay = resultDiTre.recordset[0].DiTreHomNay || 0;

        // Trả về dữ liệu JSON (Nhớ bổ sung diTreHomNay vào đây)
        res.json({
            success: true,
            data: {
                tongNhanVien: tongNhanVien,
                diLamHomNay: diLamHomNay,
                diTreHomNay: diTreHomNay // Dữ liệu mới thêm
            }
        });
    } catch (err) {
        console.error("Lỗi khi lấy thống kê admin:", err);
        res.status(500).json({ success: false, message: 'Lỗi server khi tải thống kê.' });
    }
});

// API lấy danh sách nhân viên đang trực ca (đã check-in, chưa check-out)
router.get('/working-employees', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT 
                nv.MaNV, 
                nv.HoTen, 
                pb.TenPhong, 
                nv.ChucVu, 
                nv.Email_CongTy
            FROM ChamCong cc
            JOIN NhanVien nv ON cc.MaNV = nv.MaNV
            LEFT JOIN PhongBan pb ON nv.MaPhong = pb.MaPhong
            WHERE CAST(cc.NgayCC AS DATE) = CAST(GETDATE() AS DATE) -- Lọc trong ngày hôm nay
              AND cc.GioCheckIn IS NOT NULL -- Đã Check-in (Nếu cột giờ vào của bạn tên khác, ví dụ giocheckin, hãy đổi nốt chữ GioCheckIn nhé)
              AND cc.GioCheckOut IS NULL -- Chưa Check-out (Đã sửa theo tên cột của bạn)
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error("Lỗi lấy danh sách trực ca:", err.message);
        res.status(500).json({ success: false, message: "Lỗi kết nối CSDL" });
    }
});
// API Lấy dữ liệu cho biểu đồ trang chủ Admin
// Hàm hỗ trợ tạo câu lệnh SQL lọc thời gian động
function getDateCondition(filterType, columnName) {
    switch(filterType) {
        case 'this_week':
            // Từ Thứ 2 tuần này đến CN tuần này
            return `${columnName} >= DATEADD(wk, DATEDIFF(wk, 0, GETDATE()), 0) AND ${columnName} < DATEADD(wk, DATEDIFF(wk, 0, GETDATE()) + 1, 0)`;
        case 'last_week':
            // Từ Thứ 2 tuần trước đến CN tuần trước
            return `${columnName} >= DATEADD(wk, DATEDIFF(wk, 0, GETDATE()) - 1, 0) AND ${columnName} < DATEADD(wk, DATEDIFF(wk, 0, GETDATE()), 0)`;
        case 'this_month':
            // Trong tháng hiện tại
            return `MONTH(${columnName}) = MONTH(GETDATE()) AND YEAR(${columnName}) = YEAR(GETDATE())`;
        default:
            return `${columnName} >= DATEADD(wk, DATEDIFF(wk, 0, GETDATE()), 0) AND ${columnName} < DATEADD(wk, DATEDIFF(wk, 0, GETDATE()) + 1, 0)`;
    }
}

// API Lấy dữ liệu cho biểu đồ trang chủ Admin
router.get('/chart-data', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        // Nhận tham số lọc từ URL (nếu không có thì mặc định)
        const barFilter = req.query.barFilter || 'this_week';
        const pieFilter = req.query.pieFilter || 'this_month';

        const barCondition = getDateCondition(barFilter, 'NgayCC');
        const pieCondition = getDateCondition(pieFilter, 'NgayCC');
        
        // --- BIỂU ĐỒ 1: Thống kê số nhân viên đi làm ---
        const weekQuery = `
            SET DATEFIRST 1; 
            SELECT 
                DATEPART(dw, NgayCC) as DayOfWeek, 
                COUNT(DISTINCT MaNV) as SoNhanVien 
            FROM ChamCong 
            WHERE ${barCondition}
            GROUP BY DATEPART(dw, NgayCC)
        `;
        const weekResult = await pool.request().query(weekQuery);
        
        // Đưa dữ liệu vào mảng 7 ngày (T2 -> CN)
        let weeklyData = [0, 0, 0, 0, 0, 0, 0];
        weekResult.recordset.forEach(row => {
            weeklyData[row.DayOfWeek - 1] = row.SoNhanVien;
        });

        // --- BIỂU ĐỒ 2: Tỷ lệ đi muộn / đúng giờ ---
        // Thêm điều kiện LIKE 'Đi trễ' vì CSDL của bạn ghi là 'Đi trễ 15p'
        const pieQuery = `
            SELECT 
                SUM(CASE WHEN TrangThai LIKE N'%Đúng giờ%' THEN 1 ELSE 0 END) as DungGio,
                SUM(CASE WHEN TrangThai LIKE N'%Đi muộn%' OR TrangThai LIKE N'%Đi trễ%' THEN 1 ELSE 0 END) as DiMuon
            FROM ChamCong
            WHERE ${pieCondition}
        `;
        const pieResult = await pool.request().query(pieQuery);
        const dungGio = pieResult.recordset[0].DungGio || 0;
        const diMuon = pieResult.recordset[0].DiMuon || 0;

        res.json({
            success: true,
            data: {
                weeklyData: weeklyData,
                pieData: { dungGio, diMuon }
            }
        });

    } catch (err) {
        console.error("Lỗi lấy dữ liệu biểu đồ:", err);
        res.status(500).json({ success: false, message: 'Lỗi server khi tải dữ liệu biểu đồ.' });
    }
});
// Lấy danh sách tất cả phòng ban
router.get('/departments', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT MaPhong, TenPhong 
            FROM PhongBan
        `);
        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error("Lỗi lấy danh sách phòng ban:", err);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});
// 1. Xem chi tiết nhân viên
router.get('/employees/:id', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request()
            .input('MaNV', sql.VarChar, req.params.id)
            .query(`
                SELECT nv.*, pb.TenPhong, tk.TrangThai, tk.TenDangNhap 
                FROM NhanVien nv 
                LEFT JOIN PhongBan pb ON nv.MaPhong = pb.MaPhong 
                LEFT JOIN TaiKhoan tk ON nv.MaNV = tk.MaNV 
                WHERE nv.MaNV = @MaNV
            `);
        if(result.recordset.length > 0) {
            res.json({ success: true, data: result.recordset[0] });
        } else {
            res.json({ success: false, message: 'Không tìm thấy nhân viên' });
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 2. Cập nhật thông tin nhân viên
router.put('/employees/:id', async (req, res) => {
    try {
        const { HoTen, SoDienThoai, ChucVu } = req.body;
        const pool = await sql.connect(dbConfig);
        await pool.request()
            .input('MaNV', sql.VarChar, req.params.id)
            .input('HoTen', sql.NVarChar, HoTen)
            .input('SoDienThoai', sql.VarChar, SoDienThoai)
            .input('ChucVu', sql.NVarChar, ChucVu)
            .query(`
                UPDATE NhanVien 
                SET HoTen = @HoTen, SoDienThoai = @SoDienThoai, ChucVu = @ChucVu 
                WHERE MaNV = @MaNV
            `);
        res.json({ success: true, message: 'Cập nhật thành công!' });
    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});

// 3. Xóa nhân viên
router.delete('/employees/:id', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();
        try {
            const request = new sql.Request(transaction);
            request.input('MaNV', sql.VarChar, req.params.id);
            // Xóa tài khoản (khóa ngoại) trước, xóa nhân viên sau
            await request.query(`DELETE FROM TaiKhoan WHERE MaNV = @MaNV`);
            await request.query(`DELETE FROM NhanVien WHERE MaNV = @MaNV`);
            
            await transaction.commit();
            res.json({ success: true, message: 'Đã xóa nhân viên!' });
        } catch(err) {
            await transaction.rollback();
            throw err;
        }
    } catch(err) {
        console.error(err);
        res.status(500).json({ success: false, message: 'Không thể xóa vì nhân viên này đang dính dữ liệu chấm công/lương!' });
    }
}); 
// Lấy thống kê tổng quan cho trang Chấm Công
router.get('/attendance-summary', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        
        // 1. Lấy tổng số nhân viên đang làm việc (Trạng thái = 1)
        const empCountResult = await pool.request().query(`
            SELECT COUNT(*) as TongNV 
            FROM TaiKhoan 
            WHERE TrangThai = 1
        `);
        const tongNV = empCountResult.recordset[0].TongNV || 0;

        // 2. Thống kê chấm công trong ngày hôm nay
        const attResult = await pool.request().query(`
            SELECT 
                COUNT(MaCC) as DiLam,
                SUM(CASE WHEN TrangThai LIKE N'%Đúng giờ%' THEN 1 ELSE 0 END) as CheckInSom,
                SUM(CASE WHEN TrangThai LIKE N'%Đi muộn%' OR TrangThai LIKE N'%Đi trễ%' THEN 1 ELSE 0 END) as CheckInMuon
            FROM ChamCong
            WHERE CAST(NgayCC AS DATE) = CAST(GETDATE() AS DATE)
        `);

        const diLam = attResult.recordset[0].DiLam || 0;
        const checkInSom = attResult.recordset[0].CheckInSom || 0;
        const checkInMuon = attResult.recordset[0].CheckInMuon || 0;
        const nghi = tongNV - diLam; // Số người chưa chấm công hôm nay

        res.json({
            success: true,
            data: {
                diLam: diLam,
                nghi: nghi > 0 ? nghi : 0, // Tránh ra số âm nếu có lỗi data
                checkInSom: checkInSom,
                checkInMuon: checkInMuon
            }
        });
    } catch (err) {
        console.error("Lỗi lấy thống kê trang chấm công:", err);
        res.status(500).json({ success: false, message: 'Lỗi server' });
    }
});
// =========================================================
// API: YÊU CẦU CHẤM CÔNG (CHUẨN THEO CSDL DAN.SQL)
// =========================================================

// 1. API Lấy danh sách yêu cầu chấm công đang chờ duyệt
router.get('/attendance-requests', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT 
                y.MaYeuCau, 
                y.MaNV, 
                n.HoTen, 
                y.LoaiYeuCau, 
                y.LyDo, 
                y.AnhMinhChung, -- Quan trọng: Lấy cột ảnh
                y.ThoiGianGui, 
                y.TrangThai
            FROM YeuCauChamCong y
            JOIN NhanVien n ON y.MaNV = n.MaNV
            WHERE y.TrangThai = N'Chờ duyệt'
            ORDER BY y.ThoiGianGui DESC
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        res.status(500).json({ success: false, message: err.message });
    }
});

// ==========================================
// 2. API DUYỆT YÊU CẦU CHẤM CÔNG
router.post('/attendance-requests/:id/approve', async (req, res) => {
    const maYeuCau = req.params.id;
    const nguoiDuyet = req.session.user ? req.session.user.id : 'ADMIN';

    try {
        const pool = await sql.connect(dbConfig);
        const transaction = new sql.Transaction(pool);
        await transaction.begin();

        try {
            const request = new sql.Request(transaction);
            
            // 1. Lấy thông tin yêu cầu (giữ nguyên)
            const requestData = await request
                .input('MaYeuCau', sql.Int, maYeuCau)
                .query(`SELECT MaNV, LoaiYeuCau, ThoiGianGui FROM YeuCauChamCong WHERE MaYeuCau = @MaYeuCau`);

            if (requestData.recordset.length === 0) {
                throw new Error('Không tìm thấy yêu cầu.');
            }

            const { MaNV, LoaiYeuCau, ThoiGianGui } = requestData.recordset[0];
            
            request.input('MaNV', sql.VarChar, MaNV);
            request.input('NgayCC', sql.Date, ThoiGianGui);
            request.input('GioCC', sql.Time, ThoiGianGui);
            request.input('TrangThaiMoi', sql.NVarChar, 'Đã bổ sung');

            // 2. Logic xử lý bảng ChamCong
            if (LoaiYeuCau === 'Check-in') {
                // Check-in: Chỉ chèn giờ vào, chưa có giờ ra nên TongGioLam mặc định là NULL hoặc 0
                await request.query(`
                    INSERT INTO ChamCong (MaNV, NgayCC, GioCheckIn, TrangThai)
                    VALUES (@MaNV, @NgayCC, @GioCC, @TrangThaiMoi)
                `);
            } else {
                // Check-out: Cập nhật giờ ra VÀ tính toán TongGioLam
                // Dùng DATEDIFF(SECOND, ...) để tính số giây rồi chia 3600 để ra giờ (số thập phân)
                await request.query(`
                    UPDATE ChamCong 
                    SET 
                        GioCheckOut = @GioCC, 
                        TrangThai = @TrangThaiMoi,
                        TongGioLam = CAST(DATEDIFF(MINUTE, GioCheckIn, @GioCC) / 60.0 AS DECIMAL(10,2))
                    WHERE MaNV = @MaNV 
                      AND NgayCC = @NgayCC 
                      AND GioCheckOut IS NULL
                `);
                
                // Trường hợp đặc biệt: Nếu nhân viên yêu cầu Check-out nhưng chưa có dòng Check-in nào
                if (request.rowsAffected[0] === 0) {
                    await request.query(`
                        INSERT INTO ChamCong (MaNV, NgayCC, GioCheckOut, TrangThai, TongGioLam)
                        VALUES (@MaNV, @NgayCC, @GioCC, @TrangThaiMoi, 0)
                    `);
                }
            }

            // 3. Cập nhật trạng thái yêu cầu (giữ nguyên)
            await request
                .input('AdminID', sql.VarChar, nguoiDuyet)
                .query(`
                    UPDATE YeuCauChamCong 
                    SET TrangThai = N'Đã duyệt', 
                        NguoiDuyet = @AdminID, 
                        ThoiGianDuyet = GETDATE() 
                    WHERE MaYeuCau = @MaYeuCau
                `);

            await transaction.commit();
            res.json({ success: true, message: 'Phê duyệt thành công và đã tính công.' });

        } catch (err) {
            await transaction.rollback();
            throw err;
        }
    } catch (err) {
        console.error("Lỗi duyệt yêu cầu:", err.message);
        res.status(500).json({ success: false, message: 'Lỗi: ' + err.message });
    }
});

// ==========================================
// 3. API TỪ CHỐI YÊU CẦU CHẤM CÔNG
// ==========================================
router.post('/attendance-requests/:id/reject', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const nguoiDuyet = req.session.user ? req.session.user.id : 'ADMIN';

        await pool.request()
            .input('MaYeuCau', sql.Int, req.params.id)
            .input('AdminID', sql.VarChar, nguoiDuyet)
            .query(`
                UPDATE YeuCauChamCong 
                SET TrangThai = N'Từ chối', 
                    NguoiDuyet = @AdminID,
                    ThoiGianDuyet = GETDATE() 
                WHERE MaYeuCau = @MaYeuCau
            `);

        res.json({ success: true, message: 'Đã từ chối yêu cầu.' });
    } catch (err) {
        console.error("Lỗi từ chối yêu cầu:", err);
        res.status(500).json({ success: false, message: 'Lỗi server.' });
    }
});
// API lấy danh sách chấm công chi tiết hôm nay
router.get('/attendance-today', async (req, res) => {
    try {
        const pool = await sql.connect(dbConfig);
        const result = await pool.request().query(`
            SELECT 
                nv.MaNV, 
                nv.HoTen, 
                pb.TenPhong, 
                cc.GioCheckIn, 
                cc.GioCheckOut,
                cc.TrangThai,
                -- Tính tổng giờ làm (nếu đã checkout)
                CASE 
                    WHEN cc.GioCheckIn IS NOT NULL AND cc.GioCheckOut IS NOT NULL 
                    THEN CAST(DATEDIFF(MINUTE, cc.GioCheckIn, cc.GioCheckOut) / 60.0 AS DECIMAL(10,1))
                    ELSE 0 
                END AS TongGio
            FROM ChamCong cc
            JOIN NhanVien nv ON cc.MaNV = nv.MaNV
            LEFT JOIN PhongBan pb ON nv.MaPhong = pb.MaPhong
            WHERE CAST(cc.NgayCC AS DATE) = CAST(GETDATE() AS DATE)
            ORDER BY cc.GioCheckIn DESC
        `);

        res.json({
            success: true,
            data: result.recordset
        });
    } catch (err) {
        console.error("Lỗi lấy bảng chấm công:", err.message);
        res.status(500).json({ success: false, message: "Lỗi kết nối CSDL" });
    }
});
module.exports = router;