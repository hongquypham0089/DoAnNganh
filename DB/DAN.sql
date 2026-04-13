-- 1. Tạo Database
CREATE DATABASE QuanLyNhanSu;
GO
USE QuanLyNhanSu;
GO

-------------------------------------------------------
-- 2. NHÓM DANH MỤC (Các bảng định nghĩa)
-------------------------------------------------------

-- Bảng Phòng ban
CREATE TABLE PhongBan (
    MaPhong INT PRIMARY KEY IDENTITY(1,1),
    TenPhong NVARCHAR(100) NOT NULL
);

-- Bảng Vai trò người dùng (Admin/NhanVien)
CREATE TABLE VaiTro (
    MaVaiTro INT PRIMARY KEY IDENTITY(1,1),
    TenVaiTro NVARCHAR(50) NOT NULL, 
    MoTa NVARCHAR(200)
);

-- Bảng Danh mục Khóa học (Dành cho trang Đào tạo)
CREATE TABLE KhoaHoc (
    MaKhoaHoc INT PRIMARY KEY IDENTITY(1,1),
    TenKhoaHoc NVARCHAR(200),
    LoaiHinh NVARCHAR(50), -- Video, PDF, Infographic
    DoKho NVARCHAR(20), -- Cơ bản, Trung cấp, Nâng cao
    MoTa NVARCHAR(MAX),
    HinhAnhBia VARCHAR(255)
);

-------------------------------------------------------
-- 3. NHÓM NHÂN SỰ & BẢO MẬT
-------------------------------------------------------

-- Bảng Nhân viên (Chứa đầy đủ thông tin cá nhân, ngân hàng, thuế)
CREATE TABLE NhanVien (
    MaNV VARCHAR(20) PRIMARY KEY,
    HoTen NVARCHAR(100) NOT NULL,
    NgaySinh DATE,
    GioiTinh NVARCHAR(10),
    QueQuan NVARCHAR(200),
    DanToc NVARCHAR(50),
    TonGiao NVARCHAR(50),
    Email_CongTy VARCHAR(100),
    Email_CaNhan VARCHAR(100),
    SoDienThoai VARCHAR(15),
    DiaChi_ThuongTru NVARCHAR(255),
    MaPhong INT FOREIGN KEY REFERENCES PhongBan(MaPhong),
    ChucVu NVARCHAR(50),
    NgayVaoLam DATE,
    LoaiHopDong NVARCHAR(100),
    AnhDaiDien VARCHAR(255),
    
    -- Thông tin tài chính nhận lương
    MaSoThue VARCHAR(20),
    SoTaiKhoan VARCHAR(30),
    TenNganHang NVARCHAR(100),
    ChiNhanhNganHang NVARCHAR(100),
    ChuTaiKhoan NVARCHAR(100) -- Tên người thụ hưởng
);

-- Bảng Tài khoản (Dành cho đăng nhập hệ thống)
CREATE TABLE TaiKhoan (
    MaTK INT PRIMARY KEY IDENTITY(1,1),
    TenDangNhap VARCHAR(50) UNIQUE NOT NULL,
    MatKhau VARCHAR(255) NOT NULL, -- Nên lưu mật khẩu đã mã hóa
    MaNV VARCHAR(20) UNIQUE NOT NULL, -- Liên kết 1-1 với nhân viên
    MaVaiTro INT NOT NULL,
    TrangThai BIT DEFAULT 1, -- 1: Active, 0: Locked
    NgayTao DATETIME DEFAULT GETDATE(),
    NgayCapNhatCuoi DATETIME,
    CONSTRAINT FK_TaiKhoan_NhanVien FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV),
    CONSTRAINT FK_TaiKhoan_VaiTro FOREIGN KEY (MaVaiTro) REFERENCES VaiTro(MaVaiTro)
);

-------------------------------------------------------
-- 4. NHÓM NGHIỆP VỤ (Chấm công, Lương, Công việc)
-------------------------------------------------------

-- Bảng Chấm công (Xác thực khuôn mặt)
CREATE TABLE ChamCong (
    MaCC INT PRIMARY KEY IDENTITY(1,1),
    MaNV VARCHAR(20) FOREIGN KEY REFERENCES NhanVien(MaNV),
    NgayCC DATE DEFAULT GETDATE(),
    GioCheckIn TIME,
    GioCheckOut TIME,
    TrangThai NVARCHAR(50), -- Đúng giờ, Đi trễ, Tăng ca
    XacThucFaceID BIT DEFAULT 1
);

-- Bảng Lương (Tính toán thu nhập tháng)
CREATE TABLE BangLuong (
    MaLuong INT PRIMARY KEY IDENTITY(1,1),
    MaNV VARCHAR(20) FOREIGN KEY REFERENCES NhanVien(MaNV),
    Thang INT,
    Nam INT,
    LuongCoBan DECIMAL(18, 2),
    PhuCapXang DECIMAL(18, 2),
    PhuCapAnTrua DECIMAL(18, 2),
    ThuongChuyenCan DECIMAL(18, 2),
    ThuongKPI DECIMAL(18, 2),
    TienTangCa DECIMAL(18, 2),
    BaoHiem DECIMAL(18, 2),
    TamUng DECIMAL(18, 2),
    -- Cột tính toán tự động Thưc Nhận
    ThucNhan AS (LuongCoBan + PhuCapXang + PhuCapAnTrua + ThuongChuyenCan + ThuongKPI + TienTangCa - BaoHiem - TamUng)
);

-- Bảng Công việc (Sếp giao task)
CREATE TABLE CongViec (
    MaTask INT PRIMARY KEY IDENTITY(1,1),
    TieuDe NVARCHAR(250) NOT NULL,
    NoiDung NVARCHAR(MAX),
    MaNguoiGiao VARCHAR(20) NOT NULL, 
    MaNguoiNhan VARCHAR(20) NOT NULL, 
    NgayGiao DATETIME DEFAULT GETDATE(),
    HanChot DATETIME,
    TrangThai NVARCHAR(50) DEFAULT N'Chưa bắt đầu',
    MucDoUuTien NVARCHAR(20),
    CONSTRAINT FK_Task_NguoiGiao FOREIGN KEY (MaNguoiGiao) REFERENCES NhanVien(MaNV),
    CONSTRAINT FK_Task_NguoiNhan FOREIGN KEY (MaNguoiNhan) REFERENCES NhanVien(MaNV)
);

-- Bảng Thông báo (Hiển thị trên Trang chủ)
CREATE TABLE ThongBao (
    MaTB INT PRIMARY KEY IDENTITY(1,1),
    TieuDe NVARCHAR(250),
    NoiDung NVARCHAR(MAX),
    NgayDang DATETIME DEFAULT GETDATE(),
    LoaiTin NVARCHAR(50), -- Sinh nhật, Công việc, Chính sách
    MaTask INT NULL FOREIGN KEY REFERENCES CongViec(MaTask) -- Nếu là thông báo về Task
);

-- Bảng Tiến độ học tập (Liên kết Nhân viên - Khóa học)
CREATE TABLE TienDoDaoTao (
    MaNV VARCHAR(20) FOREIGN KEY REFERENCES NhanVien(MaNV),
    MaKhoaHoc INT FOREIGN KEY REFERENCES KhoaHoc(MaKhoaHoc),
    PhanTramHoanThanh INT DEFAULT 0,
    NgayBatDau DATE,
    TrangThai NVARCHAR(50), -- Đang học, Hoàn thành
    PRIMARY KEY (MaNV, MaKhoaHoc)
);
GO

-------------------------------------------------------
-- 5. DỮ LIỆU CẤU HÌNH BAN ĐẦU
-------------------------------------------------------
INSERT INTO VaiTro (TenVaiTro, MoTa) VALUES  
(N'Admin', N'Quản trị viên có quyền giao task, quản lý lương và nhân sự'),
(N'NhanVien', N'Nhân viên xem thông tin cá nhân và thực hiện task');

INSERT INTO PhongBan (TenPhong) VALUES (N'Bếp'), (N'Phục vụ'), (N'Kỹ thuật'), (N'Hành chính');
GO



USE QuanLyNhanSu;
GO

-------------------------------------------------------
-- 1. CHÈN PHÒNG BAN & VAI TRÒ (Nếu chưa chạy ở bước trước)
-------------------------------------------------------
-- (Bỏ qua nếu bạn đã chạy insert ở đoạn mã tổng hợp trước đó)

-------------------------------------------------------
-- 2. CHÈN DỮ LIỆU NHÂN VIÊN (Dựa trên thongtincanhan.jpg)
-------------------------------------------------------
INSERT INTO NhanVien (MaNV, HoTen, NgaySinh, GioiTinh, QueQuan, DanToc, TonGiao, Email_CongTy, Email_CaNhan, SoDienThoai, DiaChi_ThuongTru, MaPhong, ChucVu, NgayVaoLam, LoaiHopDong, AnhDaiDien, MaSoThue, SoTaiKhoan, TenNganHang, ChiNhanhNganHang, ChuTaiKhoan)
VALUES 
('22050089', N'Phạm Hồng Quý', '2003-07-18', N'Nam', N'Đồng Tháp', N'Kinh', N'Không', '22050089@student.bdu.edu.vn', '22050089@student.bdu.edu.vn', '0379 997 387', N'Thuận Giao, TP.HCM', 1, N'Bếp', '2024-06-01', N'Không xác định thời hạn', 'avatar_quy.jpg', '123456789-01', '1018 3456 789', 'Vietcombank', 'VCB - CN TP.HCM', N'PHAM HONG QUY'),
('22050001', N'Nguyễn Văn A', '1995-01-01', N'Nam', N'Hà Nội', N'Kinh', N'Không', 'vana@company.com', 'vana@gmail.com', '0901234567', N'Quận 1, TP.HCM', 1, N'Quản lý Bếp', '2020-01-01', N'Dài hạn', 'avatar_a.jpg', '987654321-01', '123456789', 'Techcombank', 'CN Sài Gòn', N'NGUYEN VAN A'),
('22050002', N'Trần Thị B', '1998-05-10', N'Nữ', N'Long An', N'Kinh', N'Phật giáo', 'thib@company.com', 'thib@gmail.com', '0907654321', N'Quận 7, TP.HCM', 2, N'Phục vụ', '2022-03-15', N'1 năm', 'avatar_b.jpg', '456789123-01', '987654321', 'Agribank', 'CN Miền Đông', N'TRAN THI B');

-------------------------------------------------------
-- 3. CHÈN TÀI KHOẢN ĐĂNG NHẬP
-------------------------------------------------------
INSERT INTO TaiKhoan (TenDangNhap, MatKhau, MaNV, MaVaiTro)
VALUES 
('hongquy', '123456', '22050089', 2), -- Nhân viên
('admin_a', 'admin123', '22050001', 1); -- Admin (Sếp)

-------------------------------------------------------
-- 4. CHÈN DỮ LIỆU CHẤM CÔNG (Dựa trên chamcong.jpg)
-------------------------------------------------------
INSERT INTO ChamCong (MaNV, NgayCC, GioCheckIn, GioCheckOut, TrangThai)
VALUES 
('22050089', '2026-03-14', '08:00:00', '17:30:00', N'Đúng giờ'),
('22050089', '2026-03-13', '08:15:00', '18:00:00', N'Đi trễ 15p'),
('22050089', '2026-03-12', '07:55:00', '18:30:00', N'Tăng ca'),
('22050089', '2026-03-11', '08:00:00', '17:30:00', N'Đúng giờ');

-------------------------------------------------------
-- 5. CHÈN DỮ LIỆU LƯƠNG (Dựa trên ThuNhap.jpg tháng 3/2026)
-------------------------------------------------------
INSERT INTO BangLuong (MaNV, Thang, Nam, LuongCoBan, PhuCapXang, PhuCapAnTrua, ThuongChuyenCan, ThuongKPI, TienTangCa, BaoHiem, TamUng)
VALUES 
('22050089', 3, 2026, 8000000, 500000, 1000000, 500000, 1000000, 2500000, 800000, 2000000),
('22050089', 2, 2026, 8000000, 500000, 1000000, 500000, 500000, 1500000, 800000, 0);

-------------------------------------------------------
-- 6. CHÈN DỮ LIỆU ĐÀO TẠO (Dựa trên daotao.jpg)
-------------------------------------------------------
INSERT INTO KhoaHoc (TenKhoaHoc, LoaiHinh, DoKho, MoTa)
VALUES 
(N'Quy trình chế biến món ăn chuyên nghiệp', N'Video', N'Trung cấp', N'Hướng dẫn chi tiết quy trình chế biến các món Âu Á'),
(N'100 công thức món Á cao cấp', N'Tài liệu PDF', N'Nâng cao', N'Tổng hợp các món ăn tinh hoa châu Á'),
(N'Kỹ năng phục vụ khách VIP', N'Video', N'Cơ bản', N'Cách giao tiếp và phục vụ tại bàn tiệc');

INSERT INTO TienDoDaoTao (MaNV, MaKhoaHoc, PhanTramHoanThanh, NgayBatDau, TrangThai)
VALUES 
('22050089', 1, 75, '2026-03-01', N'Đang học'),
('22050089', 2, 40, '2026-03-05', N'Đang học'),
('22050089', 3, 10, '2026-03-10', N'Đang học');

-------------------------------------------------------
-- 7. CHÈN CÔNG VIỆC & THÔNG BÁO (Dựa trên TrangChu.jpg)
-------------------------------------------------------
-- Sếp (22050001) giao việc cho Quý (22050089)
INSERT INTO CongViec (TieuDe, NoiDung, MaNguoiGiao, MaNguoiNhan, HanChot, MucDoUuTien)
VALUES 
(N'Chuẩn bị tiệc sinh nhật tháng 3', N'Chuẩn bị thực đơn và trang trí sảnh A cho tiệc tối thứ 6', '22050001', '22050089', '2026-03-25', N'Cao');

-- Tạo thông báo hiển thị trên bảng tin
INSERT INTO ThongBao (TieuDe, NoiDung, LoaiTin, MaTask)
VALUES 
(N'Chúc mừng sinh nhật tháng 3', N'Tiệc sinh nhật tập thể vào lúc 17h30 thứ 6 này', N'Sự kiện', NULL),
(N'Đánh giá hiệu suất Q1/2026', N'Vui lòng cập nhật mục tiêu cá nhân trước ngày 30/3', N'Thông báo', NULL),
(N'Công việc mới: Chuẩn bị tiệc', N'Bạn có task mới từ Quản lý Bếp', N'Công việc', 1);

GO

select * from TaiKhoan;



-- Cập nhật thêm cột Tổng Giờ Làm vào bảng Chấm Công
ALTER TABLE ChamCong 
ADD TongGioLam DECIMAL(5,2); -- Lưu số thập phân, ví dụ: 8.50


ALTER TABLE NhanVien
ADD 
    CCCD VARCHAR(20),
    NgayCapCCCD DATE,
    NoiCapCCCD NVARCHAR(200),
    NgayHetHanCCCD DATE;

-- Unique (bỏ qua NULL)
CREATE UNIQUE INDEX UQ_CCCD
ON NhanVien(CCCD)
WHERE CCCD IS NOT NULL;

-- Check độ dài
ALTER TABLE NhanVien
ADD CONSTRAINT CK_CCCD_Length 
CHECK (CCCD IS NULL OR LEN(CCCD) = 12);


USE QuanLyNhanSu;
GO

-------------------------------------------------------
-- BẢNG YÊU CẦU CHẤM CÔNG THỦ CÔNG (DỰ PHÒNG)
-------------------------------------------------------
CREATE TABLE YeuCauChamCong (
    MaYeuCau INT PRIMARY KEY IDENTITY(1,1),
    MaNV VARCHAR(20) NOT NULL,
    LoaiYeuCau NVARCHAR(50) NOT NULL,              -- 'Check-in' hoặc 'Check-out'
    LyDo NVARCHAR(MAX) NOT NULL,                   -- Lý do nhân viên nhập (VD: Camera lỗi)
    AnhMinhChung VARCHAR(255) NOT NULL,            -- Đường dẫn lưu file ảnh tải lên
    ThoiGianGui DATETIME DEFAULT GETDATE(),        -- Thời gian nhân viên bấm nút gửi
    TrangThai NVARCHAR(50) DEFAULT N'Chờ duyệt',   -- 'Chờ duyệt', 'Đã duyệt', 'Từ chối'
    
    -- Các trường dành cho Admin khi xử lý
    NguoiDuyet VARCHAR(20) NULL,                   -- Mã NV của Quản lý đã duyệt
    ThoiGianDuyet DATETIME NULL,                   -- Lúc quản lý bấm duyệt
    GhiChuAdmin NVARCHAR(MAX) NULL,                -- Lời nhắn của quản lý (nếu từ chối)

    -- Khóa ngoại liên kết với bảng NhanVien
    CONSTRAINT FK_YeuCau_NhanVien FOREIGN KEY (MaNV) REFERENCES NhanVien(MaNV),
    CONSTRAINT FK_YeuCau_NguoiDuyet FOREIGN KEY (NguoiDuyet) REFERENCES NhanVien(MaNV)
);
GO

-- Thêm một vài dữ liệu mẫu để sau này bạn test trang của Admin dễ hơn
INSERT INTO YeuCauChamCong (MaNV, LoaiYeuCau, LyDo, AnhMinhChung, TrangThai)
VALUES 
('22050089', 'Check-in', N'Hệ thống không nhận diện được do phòng tối', '/uploads/proofs/sample1.jpg', N'Chờ duyệt'),
('22050089', 'Check-out', N'Camera báo lỗi không mở được', '/uploads/proofs/sample2.jpg', N'Chờ duyệt');
GO


USE QuanLyNhanSu;
GO

-------------------------------------------------------
-- 1. TẠO BẢNG DANH MỤC KHÓA HỌC
-------------------------------------------------------
CREATE TABLE DanhMucKhoaHoc (
    MaDanhMuc INT PRIMARY KEY IDENTITY(1,1),
    TenDanhMuc NVARCHAR(100) NOT NULL,
    Slug VARCHAR(50) NOT NULL, -- Dùng để lọc từ Frontend (VD: 'che-bien', 'cong-thuc')
    Icon NVARCHAR(50),
    MoTa NVARCHAR(255)
);
GO

-- Chèn 4 danh mục khớp với giao diện daotao.ejs của bạn
INSERT INTO DanhMucKhoaHoc (TenDanhMuc, Slug, Icon, MoTa) VALUES 
(N'Quy trình chế biến', 'che-bien', N'🍳', N'Quy trình chuẩn trong chế biến món ăn'),
(N'Công thức món ăn', 'cong-thuc', N'📝', N'100+ công thức món ăn đặc sắc'),
(N'Kỹ năng phục vụ', 'phuc-vu', N'🤵', N'Kỹ năng phục vụ chuyên nghiệp'),
(N'Vệ sinh an toàn', 've-sinh', N'🧹', N'An toàn thực phẩm & vệ sinh');
GO

-------------------------------------------------------
-- 2. CẬP NHẬT BẢNG KHÓA HỌC VÀ TẠO RÀNG BUỘC
-------------------------------------------------------
-- Thêm các cột còn thiếu
ALTER TABLE KhoaHoc ADD MaDanhMuc INT;
ALTER TABLE KhoaHoc ADD LuotXem INT DEFAULT 0; -- Hiển thị lượt xem
ALTER TABLE KhoaHoc ADD DuongDanFile VARCHAR(255); -- Lưu link video/pdf
ALTER TABLE KhoaHoc ADD NgayDang DATETIME DEFAULT GETDATE();
GO

-- Tạo ràng buộc khóa ngoại (Liên kết Khóa học -> Danh mục)
ALTER TABLE KhoaHoc 
ADD CONSTRAINT FK_KhoaHoc_DanhMuc FOREIGN KEY (MaDanhMuc) REFERENCES DanhMucKhoaHoc(MaDanhMuc);
GO

-------------------------------------------------------
-- 3. CẬP NHẬT DỮ LIỆU CŨ CHO KHỚP VỚI DANH MỤC
-------------------------------------------------------
-- Gán 3 khóa học bạn đã insert trước đó vào các danh mục tương ứng
UPDATE KhoaHoc SET MaDanhMuc = 1, LuotXem = 1200, DuongDanFile = '/uploads/training/video1.mp4' WHERE MaKhoaHoc = 1; -- Thuộc Chế biến
UPDATE KhoaHoc SET MaDanhMuc = 2, LuotXem = 3400, DuongDanFile = '/uploads/training/doc1.pdf' WHERE MaKhoaHoc = 2; -- Thuộc Công thức
UPDATE KhoaHoc SET MaDanhMuc = 3, LuotXem = 890, DuongDanFile = '/uploads/training/video2.mp4' WHERE MaKhoaHoc = 3; -- Thuộc Phục vụ
GO




USE QuanLyNhanSu;
GO

-------------------------------------------------------
-- 1. BỔ SUNG CỘT CHO BẢNG DanhMucKhoaHoc (Nếu chưa có)
-------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'Slug' AND Object_ID = Object_ID(N'DanhMucKhoaHoc'))
BEGIN
    ALTER TABLE DanhMucKhoaHoc ADD Slug VARCHAR(50);
END
GO

-- Cập nhật dữ liệu Slug cho các danh mục đã tồn tại
UPDATE DanhMucKhoaHoc SET Slug = 'che-bien' WHERE TenDanhMuc LIKE N'%chế biến%';
UPDATE DanhMucKhoaHoc SET Slug = 'cong-thuc' WHERE TenDanhMuc LIKE N'%công thức%';
UPDATE DanhMucKhoaHoc SET Slug = 'phuc-vu' WHERE TenDanhMuc LIKE N'%phục vụ%';
UPDATE DanhMucKhoaHoc SET Slug = 've-sinh' WHERE TenDanhMuc LIKE N'%vệ sinh%';
GO

-------------------------------------------------------
-- 2. BỔ SUNG CỘT CHO BẢNG KhoaHoc (Nếu chưa có)
-------------------------------------------------------
IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'LuotXem' AND Object_ID = Object_ID(N'KhoaHoc'))
BEGIN
    ALTER TABLE KhoaHoc ADD LuotXem INT DEFAULT 0;
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'DuongDanFile' AND Object_ID = Object_ID(N'KhoaHoc'))
BEGIN
    ALTER TABLE KhoaHoc ADD DuongDanFile VARCHAR(255);
END
GO

IF NOT EXISTS (SELECT * FROM sys.columns WHERE Name = N'NgayDang' AND Object_ID = Object_ID(N'KhoaHoc'))
BEGIN
    ALTER TABLE KhoaHoc ADD NgayDang DATETIME DEFAULT GETDATE();
END
GO

-------------------------------------------------------
-- 3. CẬP NHẬT DỮ LIỆU CŨ CHO KHỚP VỚI DANH MỤC
-------------------------------------------------------
-- Cập nhật Lượt xem và đường dẫn file cho 3 khóa học mẫu của bạn
UPDATE KhoaHoc SET MaDanhMuc = 1, LuotXem = 1200, DuongDanFile = '/uploads/training/video1.mp4' WHERE MaKhoaHoc = 1;
UPDATE KhoaHoc SET MaDanhMuc = 2, LuotXem = 3400, DuongDanFile = '/uploads/training/doc1.pdf' WHERE MaKhoaHoc = 2;
UPDATE KhoaHoc SET MaDanhMuc = 3, LuotXem = 890, DuongDanFile = '/uploads/training/video2.mp4' WHERE MaKhoaHoc = 3;
GO