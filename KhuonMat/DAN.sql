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

USE QuanLyNhanSu;
GO

-- 1. Tạo bảng Danh mục để phân loại (Chế biến, Công thức, Kỹ năng...)
CREATE TABLE DanhMucKhoaHoc (
    MaDanhMuc INT PRIMARY KEY IDENTITY(1,1),
    TenDanhMuc NVARCHAR(100) NOT NULL,
    Icon NVARCHAR(50), -- Lưu icon như '🍳', '📝'
    MoTa NVARCHAR(255)
);

-- 2. Cập nhật bảng KhoaHoc (Thêm đường dẫn file và liên kết danh mục)
-- Lưu ý: Nếu bạn đã có dữ liệu trong bảng KhoaHoc, hãy cẩn thận khi chạy lệnh DROP/CREATE này.
-- Ở đây tôi sẽ dùng lệnh ALTER để thêm cột cho an toàn:

ALTER TABLE KhoaHoc ADD MaDanhMuc INT; -- Liên kết tới bảng danh mục
ALTER TABLE KhoaHoc ADD DuongDanFile VARCHAR(255); -- Đường dẫn tới file Video/PDF trên server
ALTER TABLE KhoaHoc ADD NgayDang DATETIME DEFAULT GETDATE();
USE QuanLyNhanSu;
GO

-- Sửa lại lệnh thêm khóa ngoại cho đúng cú pháp
ALTER TABLE KhoaHoc 
ADD CONSTRAINT FK_KhoaHoc_DanhMuc FOREIGN KEY (MaDanhMuc) REFERENCES DanhMucKhoaHoc(MaDanhMuc);
GO

-- Chèn dữ liệu mẫu cho danh mục
INSERT INTO DanhMucKhoaHoc (TenDanhMuc, Icon, MoTa)
VALUES 
(N'Quy trình chế biến', N'🍳', N'Quy trình chuẩn trong chế biến món ăn'),
(N'Công thức món ăn', N'📝', N'100+ công thức món ăn đặc sắc'),
(N'Kỹ năng phục vụ', N'🤵', N'Tiêu chuẩn phục vụ khách hàng 5 sao');
GO
