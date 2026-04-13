
// Open modal
function openModal(modalId) {
    document.getElementById(modalId).classList.add('active');
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// ============================================
// XỬ LÝ NÚT: XEM CHI TIẾT
// ============================================
async function viewEmployee(id) {
    try {
        const response = await fetch(`/api/admin/employees/${id}`);
        const result = await response.json();
        
        if(result.success) {
            const emp = result.data;
            const content = `
                <p><strong>📌 Mã NV:</strong> ${emp.MaNV}</p>
                <p><strong>👤 Họ và Tên:</strong> ${emp.HoTen}</p>
                <p><strong>📧 Email:</strong> ${emp.Email_CongTy || 'Chưa cập nhật'}</p>
                <p><strong>📞 SĐT:</strong> ${emp.SoDienThoai || 'Chưa cập nhật'}</p>
                <p><strong>🏢 Phòng ban:</strong> ${emp.TenPhong || 'Chưa phân bổ'}</p>
                <p><strong>💼 Chức vụ:</strong> ${emp.ChucVu || 'Chưa cập nhật'}</p>
                <p><strong>🟢 Trạng thái:</strong> ${emp.TrangThai || 'Chưa cấp tài khoản'}</p>
            `;
            document.getElementById('viewEmployeeContent').innerHTML = content;
            openModal('viewEmployeeModal');
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch(e) {
        console.error(e);
        alert("Lỗi kết nối máy chủ");
    }
}

// ============================================
// XỬ LÝ NÚT: SỬA THÔNG TIN
// ============================================
async function editEmployee(id) {
    try {
        const response = await fetch(`/api/admin/employees/${id}`);
        const result = await response.json();
        
        if(result.success) {
            const emp = result.data;
            // Đổ dữ liệu vào Form
            document.getElementById('editMaNV').value = emp.MaNV;
            document.getElementById('editHoTen').value = emp.HoTen;
            document.getElementById('editSDT').value = emp.SoDienThoai || '';
            document.getElementById('editChucVu').value = emp.ChucVu || '';
            
            // Mở bảng
            openModal('editEmployeeModal');
        }
    } catch(e) {
        console.error(e);
        alert("Lỗi kết nối máy chủ");
    }
}

// Hàm lưu dữ liệu khi nhấn "Lưu Thay Đổi" ở bảng Sửa
async function submitEditEmployee() {
    const id = document.getElementById('editMaNV').value;
    const data = {
        HoTen: document.getElementById('editHoTen').value,
        SoDienThoai: document.getElementById('editSDT').value,
        ChucVu: document.getElementById('editChucVu').value
    };
    
    try {
        const res = await fetch(`/api/admin/employees/${id}`, {
            method: 'PUT',
            headers: {'Content-Type': 'application/json'},
            body: JSON.stringify(data)
        });
        const result = await res.json();
        
        if(result.success) {
            alert("✅ Cập nhật thành công!");
            closeModal('editEmployeeModal');
            loadWorkingEmployees(); // Tải lại bảng ngay lập tức
        } else {
            alert("❌ Lỗi: " + result.message);
        }
    } catch(e) {
        alert("Lỗi kết nối máy chủ!");
    }
}

// ============================================
// XỬ LÝ NÚT: XÓA NHÂN VIÊN
// ============================================
async function deleteEmployee(id) {
    // Chỉ hiện thông báo hỏi chắc chắn chưa (Không hiện modal rườm rà)
    const isConfirmed = confirm(`⚠️ CẢNH BÁO!\nBạn có chắc chắn muốn xóa nhân viên mang mã [${id}] không?\nHành động này sẽ xóa luôn tài khoản đăng nhập của họ!`);
    
    if(isConfirmed) {
        try {
            const res = await fetch(`/api/admin/employees/${id}`, { 
                method: 'DELETE' 
            });
            const result = await res.json();
            
            if(result.success) {
                alert("✅ Đã xóa nhân viên thành công!");
                loadWorkingEmployees(); // Tải lại bảng ngay lập tức
            } else {
                alert("❌ Lỗi xóa: " + result.message);
            }
        } catch(e) {
            alert("❌ Lỗi: Không thể xóa vì nhân viên này đã chấm công hoặc có dữ liệu nhận lương trong hệ thống!");
        }
    }
}
// Hàm tải dữ liệu thống kê cho tab Chấm Công
async function loadAttendanceSummary() {
    try {
        const response = await fetch('/api/admin/attendance-summary');
        const result = await response.json();
        
        if (result.success) {
            // Đổ số liệu vào giao diện
            document.getElementById('att-dilam').innerText = result.data.diLam;
            document.getElementById('att-nghi').innerText = result.data.nghi;
            document.getElementById('att-som').innerText = result.data.checkInSom;
            document.getElementById('att-muon').innerText = result.data.checkInMuon;
        }
    } catch (error) {
        console.error("Lỗi khi tải tóm tắt chấm công:", error);
    }
}
// Add employee
function addEmployee() {
    alert('Thêm nhân viên thành công!');
    closeModal('addEmployeeModal');
}

// View attendance photo
function viewAttendancePhoto(id) {
    alert('Xem ảnh chấm công của nhân viên: ' + id);
}

// Export attendance
function exportAttendance() {
    alert('Đang xuất báo cáo chấm công...');
}

// Download report
function downloadReport(type) {
    alert('Đang tải báo cáo: ' + type);
}

// Process salary
function processSalary() {
    alert('Đang tính lương cho nhân viên...');
}

// View salary detail
function viewSalaryDetail(id) {
    alert('Xem chi tiết lương nhân viên: ' + id);
}

// Print salary
function printSalary(id) {
    alert('In bảng lương nhân viên: ' + id);
}

// Edit announcement
function editAnnouncement(id) {
    alert('Sửa thông báo: ' + id);
}

// Delete announcement
function deleteAnnouncement(id) {
    if(confirm('Xóa thông báo này?')) {
        alert('Đã xóa thông báo');
    }
}

// Post announcement
function postAnnouncement() {
    alert('Đăng thông báo thành công!');
    closeModal('addAnnouncementModal');
}

// Change month
function changeMonth(direction) {
    alert('Chuyển ' + direction + ' tháng');
}

// Save settings
function saveSettings() {
    alert('Lưu cài đặt thành công!');
}

// Click outside modal to close
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}
// Hàm chuyển đổi các trang trong giao diện Admin
window.changeAdminPage = function(pageId, element) {
    try {
        // 1. Ẩn tất cả các phần nội dung (pages)
        document.querySelectorAll('.dashboard-content').forEach(page => {
            page.classList.remove('active');
        });
        
        // 2. Hiển thị trang được chọn
        const targetPage = document.getElementById(pageId + '-page');
        if (targetPage) {
            targetPage.classList.add('active');
        } else {
            console.warn('Không tìm thấy trang có ID: ' + pageId + '-page');
            return; // Dừng lại nếu không tìm thấy trang
        }
        
        // 3. Xóa class 'active' ở tất cả các thẻ menu
        document.querySelectorAll('.menu-item').forEach(item => {
            item.classList.remove('active');
        });
        
        // 4. Thêm class 'active' cho menu đang được click
        if (element) {
            element.classList.add('active');
        }

        // 5. Tự động load dữ liệu khi vào các trang cụ thể (Ví dụ: trang nhân viên)
        if (pageId === 'employees') {
            // Kiểm tra xem hàm loadEmployees đã tồn tại chưa rồi mới gọi
            if (typeof loadEmployees === 'function') {
                loadEmployees();
            } else {
                console.warn('Chưa định nghĩa hàm loadEmployees()');
            }
        }
    } catch (error) {
        console.error("Lỗi khi chuyển trang:", error);
    }
};
// Hàm gọi API lấy danh sách nhân viên và vẽ ra bảng
async function loadWorkingEmployees() {
    const tbody = document.getElementById('employee-table-body');
    const countInfo = document.getElementById('employee-count-info');
    
    try {
        // Gọi API từ Backend
        const response = await fetch('/api/admin/employees');
        const result = await response.json();

        if (result.success) {
            const employees = result.data;
            
            // Nếu công ty chưa có nhân viên nào
            if (employees.length === 0) {
                tbody.innerHTML = '<tr><td colspan="9" style="text-align: center; padding: 20px;">Không có dữ liệu nhân viên</td></tr>';
                countInfo.innerText = "Tổng số: 0 nhân viên";
                return;
            }

            // Có dữ liệu thì tiến hành tạo các thẻ <tr> để gắn vào bảng
            let html = '';
            employees.forEach(emp => {
                // Xử lý trạng thái
                const isWorking = emp.TrangThai === 1 || emp.TrangThai === true || emp.TrangThai === '1';
                const statusText = isWorking ? 'Đang làm' : 'Đã nghỉ';
                const statusColor = isWorking ? 'green' : 'red'; 
                
                // Xử lý ảnh đại diện (nếu không có thì dùng ảnh mặc định)
                const avatar = emp.AnhDaiDien ? emp.AnhDaiDien : 'https://via.placeholder.com/40';

                html += `
                    <tr>
                        <td><strong>${emp.MaNV}</strong></td>
                        <td><img src="${avatar}" alt="Avatar" width="40" height="40" style="border-radius: 50%; object-fit: cover;"></td>
                        <td>${emp.HoTen}</td>
                        <td>${emp.Email_CongTy}</td>
                        <td>${emp.TenPhong || 'Chưa xếp phòng'}</td>
                        <td>${emp.ChucVu || 'Chưa có'}</td>
                        <td>${emp.SoDienThoai || 'Trống'}</td>
                        <td><span style="color: ${statusColor}; font-weight: bold;">${statusText}</span></td>
                        <td>
                            <button class="action-btn view-btn" onclick="viewEmployee('${emp.MaNV}')" title="Xem chi tiết">👁️</button>
                            <button class="action-btn edit-btn" onclick="editEmployee('${emp.MaNV}')" title="Sửa">✏️</button>
                            <button class="action-btn delete-btn" onclick="deleteEmployee('${emp.MaNV}')" title="Xóa">🗑️</button>
                        </td>
                    </tr>
                `;
            });

            // Gắn toàn bộ HTML vừa tạo vào thân bảng
            tbody.innerHTML = html;
            
            // Cập nhật dòng chữ hiển thị tổng số lượng
            countInfo.innerText = `Tổng số: ${employees.length} nhân viên`;

        } else {
            tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red;">Lỗi: ${result.message}</td></tr>`;
        }
    } catch (error) {
        console.error("Lỗi khi tải danh sách nhân viên:", error);
        tbody.innerHTML = `<tr><td colspan="9" style="text-align: center; color: red;">Không thể kết nối đến server để tải dữ liệu!</td></tr>`;
    }
}
// Hàm vẽ và load biểu đồ
async function loadCharts() {
    try {
        // Lấy giá trị đang được chọn trong dropdown (nếu không tìm thấy thì gán mặc định)
        const barFilter = document.getElementById('barChartFilter')?.value || 'this_week';
        const pieFilter = document.getElementById('pieChartFilter')?.value || 'this_month';

        // Gọi API có truyền tham số theo bộ lọc
        const response = await fetch(`/api/admin/chart-data?barFilter=${barFilter}&pieFilter=${pieFilter}`);
        const result = await response.json();

        if (result.success) {
            // === XỬ LÝ BIỂU ĐỒ CỘT ===
            const weeklyData = result.data.weeklyData;
            const days = ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'];
            const container = document.getElementById('bar-chart-container');
            
            const maxVal = Math.max(...weeklyData);
            const heightMultiplier = maxVal > 0 ? 200 / maxVal : 0;
            
            let htmlBars = '';
            weeklyData.forEach((count, index) => {
                const height = count * heightMultiplier; 
                htmlBars += `
                    <div style="flex: 1; text-align: center; display: flex; flex-direction: column; justify-content: flex-end;">
                        <div style="margin-bottom: 5px; font-weight: bold; color: #8e44ad;">${count > 0 ? count : ''}</div>
                        <div style="height: ${height > 0 ? height : 2}px; background: linear-gradient(180deg, #8e44ad, #9b59b6); border-radius: 5px 5px 0 0; transition: height 0.8s ease-out;"></div>
                        <div style="margin-top: 10px; font-size: 13px;">${days[index]}</div>
                    </div>
                `;
            });
            container.innerHTML = htmlBars;

            // === XỬ LÝ BIỂU ĐỒ TRÒN ===
            const { dungGio, diMuon } = result.data.pieData;
            const total = dungGio + diMuon;
            
            if (total > 0) {
                const dungGioPercent = Math.round((dungGio / total) * 100);
                const diMuonPercent = 100 - dungGioPercent;
                const dungGioDeg = (dungGio / total) * 360;
                
                document.getElementById('pie-chart-ui').style.background = `conic-gradient(#27ae60 0deg ${dungGioDeg}deg, #e74c3c ${dungGioDeg}deg 360deg)`;
                document.getElementById('text-dunggio').innerHTML = `<span style="color: #27ae60;">●</span> Đúng giờ: ${dungGioPercent}%`;
                document.getElementById('text-dimuon').innerHTML = `<span style="color: #e74c3c;">●</span> Đi muộn: ${diMuonPercent}%`;
                document.getElementById('text-tong-luot').innerText = `Dựa trên tổng ${total} lượt chấm công`;
            } else {
                // Nếu khoảng thời gian đó không có dữ liệu
                document.getElementById('pie-chart-ui').style.background = `#e0e0e0`;
                document.getElementById('text-dunggio').innerHTML = `<span style="color: #27ae60;">●</span> Đúng giờ: 0%`;
                document.getElementById('text-dimuon').innerHTML = `<span style="color: #e74c3c;">●</span> Đi muộn: 0%`;
                document.getElementById('text-tong-luot').innerText = "Không có dữ liệu trong thời gian này.";
            }
        }
    } catch (error) {
        console.error("Lỗi khi load dữ liệu biểu đồ:", error);
    }
}
// // Gọi hàm này khi trang Dashboard được load
// document.addEventListener("DOMContentLoaded", function() {
//     loadWorkingEmployees();
    
//     // (Tùy chọn) Cứ mỗi 5 phút tự động cập nhật lại danh sách một lần
//     setInterval(loadWorkingEmployees, 300000); 
// });

//     document.addEventListener("DOMContentLoaded", function() {
//         // Hàm gọi API lấy dữ liệu thống kê
//         async function loadAdminStats() {
//             try {
//                 const response = await fetch('/api/admin/dashboard-stats');
//                 const result = await response.json();

//                 if (result.success) {
//                     // Cập nhật con số lên giao diện
//                     document.getElementById('tongNhanVien').innerText = result.data.tongNhanVien;
//                     document.getElementById('diLamHomNay').innerText = result.data.diLamHomNay;
//                     document.getElementById('diTreHomNay').innerText = result.data.diTreHomNay;
//                 } else {
//                     console.error("Lỗi từ server:", result.message);
//                 }
//             } catch (error) {
//                 console.error("Lỗi khi gọi API thống kê:", error);
//             }
//         }

//         // Gọi hàm ngay khi trang vừa tải xong
//         loadAdminStats();
//     });

async function submitFullEmployee() {
    // 1. Lấy dữ liệu từ các ô nhập liệu
    const data = {
        maNV: document.getElementById('add-maNV').value.trim(),
        hoTen: document.getElementById('add-hoTen').value.trim(),
        email: document.getElementById('add-email').value.trim(),
        sdt: document.getElementById('add-sdt').value.trim(),
        phongBan: document.getElementById('add-phongBan').value,
        chucVu: document.getElementById('add-chucVu').value.trim(),
        username: document.getElementById('add-username').value.trim(),
        password: document.getElementById('add-password').value,
    };

    // 2. Kiểm tra dữ liệu sơ bộ
    if (!data.maNV || !data.hoTen || !data.username || !data.password) {
        alert("Vui lòng nhập đầy đủ các thông tin bắt buộc (Mã NV, Họ tên, Username, Password)!");
        return;
    }

    const msgBox = document.getElementById('add-message');
    msgBox.style.color = "blue";
    msgBox.innerText = "Đang xử lý...";

    try {
        // 3. Gửi yêu cầu đến API (Bạn cần viết API này ở Backend để lưu vào 2 bảng NhanVien và TaiKhoan)
        const response = await fetch('/api/admin/add-full-employee', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });

        const result = await response.json();

        if (result.success) {
            msgBox.style.color = "green";
            msgBox.innerText = "✅ Thành công! Đã thêm nhân viên và tạo tài khoản.";
            
            // Reload lại danh sách sau 1.5 giây
            setTimeout(() => {
                closeModal('addEmployeeModal');
                location.reload(); 
            }, 1500);
        } else {
            msgBox.style.color = "red";
            msgBox.innerText = "❌ Lỗi: " + result.message;
        }
    } catch (error) {
        console.error("Lỗi:", error);
        msgBox.style.color = "red";
        msgBox.innerText = "❌ Lỗi kết nối máy chủ!";
    }
}

// Chuyển hàm loadAdminStats ra ngoài để code thoáng hơn
async function loadAdminStats() {
    try {
        const response = await fetch('/api/admin/dashboard-stats');
        const result = await response.json();

        if (result.success) {
            document.getElementById('tongNhanVien').innerText = result.data.tongNhanVien;
            document.getElementById('diLamHomNay').innerText = result.data.diLamHomNay;
            document.getElementById('diTreHomNay').innerText = result.data.diTreHomNay;
        } else {
            console.error("Lỗi từ server:", result.message);
        }
    } catch (error) {
        console.error("Lỗi khi gọi API thống kê:", error);
    }
}
// Hàm 1: Gọi API để lấy phòng ban đổ vào thẻ select
async function loadDepartments() {
    try {
        const response = await fetch('/api/admin/departments');
        const result = await response.json();
        
        if (result.success) {
            const select = document.getElementById('filter-department');
            // Xóa rỗng và giữ lại option Tất cả
            select.innerHTML = '<option value="">Tất cả phòng ban</option>'; 
            
            // Lặp qua dữ liệu CSDL và in ra
            result.data.forEach(dept => {
                // Dùng TenPhong làm value để dễ dàng so sánh với text trong bảng
                select.innerHTML += `<option value="${dept.TenPhong}">${dept.TenPhong}</option>`;
            });
        }
    } catch (error) {
        console.error("Lỗi tải danh sách phòng ban:", error);
    }
}

// Hàm 2: Lọc nhanh trực tiếp trên giao diện (Không cần gọi lại API)
function quickFilter() {
    // Lấy giá trị đang gõ và giá trị phòng đang chọn (chuyển hết về chữ thường để dễ so sánh)
    const searchText = document.getElementById('employee-search').value.toLowerCase();
    const deptFilter = document.getElementById('filter-department').value.toLowerCase();
    
    // Quét toàn bộ các dòng (tr) trong thân bảng (tbody). 
    // *Lưu ý: Thay 'table tbody tr' bằng ID hoặc Class thực tế của bảng nhân viên nếu cần
    const rows = document.querySelectorAll('table tbody tr'); 
    
    rows.forEach(row => {
        // Lấy toàn bộ chữ của dòng đó
        const rowText = row.innerText.toLowerCase();
        
        // Kiểm tra xem dòng này có chứa từ khóa tìm kiếm KHÔNG
        const matchesSearch = rowText.includes(searchText);
        
        // Kiểm tra xem dòng này có chứa tên phòng ban được chọn KHÔNG (Nếu chọn "Tất cả" thì luôn đúng)
        const matchesDept = deptFilter === "" || rowText.includes(deptFilter);
        
        // Nếu thỏa mãn CẢ 2 điều kiện thì hiện dòng lên, nếu không thì ẩn đi
        if (matchesSearch && matchesDept) {
            row.style.display = ''; 
        } else {
            row.style.display = 'none'; 
        }
    });
}

// Tải danh sách yêu cầu chấm công khi trang vừa mở
document.addEventListener("DOMContentLoaded", function() {
    loadAttendanceRequests();
});

// // Hàm lấy dữ liệu yêu cầu chấm công
// async function loadAttendanceRequests() {
//     const tbody = document.getElementById('attendanceRequestsTableBody');
//     tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px;">Đang tải dữ liệu...</td></tr>';

//     try {
//         // Thực tế: Lấy dữ liệu từ Backend
//         // const response = await fetch('/api/admin/attendance-requests');
//         // const result = await response.json();
        
//         // MOCK DATA: Dữ liệu mẫu tạm thời để hiển thị khi chưa có API
//         const mockRequests = [
//             { id: 1, maNV: 'NV001', hoTen: 'Nguyễn Văn A', ngay: '12/04/2026', gio: '08:00', lyDo: 'Quên chấm công đầu giờ' },
//             { id: 2, maNV: 'NV005', hoTen: 'Trần Thị B', ngay: '12/04/2026', gio: '17:35', lyDo: 'Đi công tác về thẳng nhà' },
//             { id: 3, maNV: 'NV012', hoTen: 'Lê Văn C', ngay: '11/04/2026', gio: '08:15', lyDo: 'Lỗi ứng dụng không nhận diện' }
//         ];

//         tbody.innerHTML = ''; // Xóa chữ "Đang tải..."

//         if (mockRequests.length === 0) {
//             tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: #27ae60;">🎉 Không có yêu cầu nào đang chờ duyệt.</td></tr>';
//             return;
//         }

//         mockRequests.forEach(req => {
//             const tr = document.createElement('tr');
//             tr.innerHTML = `
//                 <td style="padding: 12px; border-bottom: 1px solid #eee;"><strong>#${req.id}</strong></td>
//                 <td style="padding: 12px; border-bottom: 1px solid #eee;">${req.maNV}</td>
//                 <td style="padding: 12px; border-bottom: 1px solid #eee;">${req.hoTen}</td>
//                 <td style="padding: 12px; border-bottom: 1px solid #eee;">${req.ngay}</td>
//                 <td style="padding: 12px; border-bottom: 1px solid #eee; color: #e67e22; font-weight: bold;">${req.gio}</td>
//                 <td style="padding: 12px; border-bottom: 1px solid #eee;">${req.lyDo}</td>
//                 <td style="padding: 12px; border-bottom: 1px solid #eee; text-align: center;">
//                     <button onclick="approveRequest(${req.id})" style="background: #27ae60; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; margin-right: 5px; font-weight: bold;">✔ Duyệt</button>
//                     <button onclick="rejectRequest(${req.id})" style="background: #e74c3c; color: white; border: none; padding: 6px 12px; border-radius: 4px; cursor: pointer; font-weight: bold;">✖ Từ chối</button>
//                 </td>
//             `;
//             tbody.appendChild(tr);
//         });
//     } catch (error) {
//         console.error("Lỗi:", error);
//         tbody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 20px; color: red;">❌ Lỗi kết nối máy chủ!</td></tr>';
//     }
// }

// Xử lý nút Duyệt
// admin_chamcong.js
async function approveRequest(id) {
    if (!confirm("Bạn có chắc chắn muốn duyệt yêu cầu này?")) return;

    try {
        const response = await fetch(`/api/admin/attendance-requests/${id}/approve`, {
            method: 'POST' // Phải là POST khớp với route
        });
        const result = await response.json();
        if (result.success) {
            alert(result.message);
            loadAttendanceRequests(); // Reload lại bảng
        } else {
            alert("Lỗi: " + result.message);
        }
    } catch (error) {
        alert("Không thể kết nối đến server.");
    }
}

// Xử lý nút Từ chối
async function rejectRequest(id) {
    if(confirm('Bạn có chắc chắn muốn TỪ CHỐI và xóa yêu cầu này?')) {
        try {
            // Thay thế bằng API của bạn:
            // const response = await fetch(`/api/admin/attendance-requests/${id}/reject`, { method: 'POST' });
            // const result = await response.json();
            
            alert(`🗑️ Đã từ chối và xóa bỏ yêu cầu #${id}.`);
            
            // Tải lại danh sách sau khi xóa
            loadAttendanceRequests(); 
        } catch (error) {
            alert('❌ Có lỗi xảy ra khi xóa yêu cầu.');
        }
    }
}// =========================================================
// XỬ LÝ GIAO DIỆN: YÊU CẦU CHẤM CÔNG
// =========================================================

// Hàm lấy dữ liệu yêu cầu chấm công từ API
async function loadAttendanceRequests() {
    const tableBody = document.getElementById('attendanceRequestsTableBody');
    try {
        const response = await fetch('/api/admin/attendance-requests');
        const result = await response.json();

        if (result.success) {
            tableBody.innerHTML = '';
            result.data.forEach(req => {
                const row = document.createElement('tr');
                row.style.borderBottom = '1px solid #eee';
                
                // Xử lý ảnh minh chứng
                // Xử lý ảnh minh chứng
                let imgHtml = '';
                if (req.AnhMinhChung) {
                    // Giả sử ảnh của bạn là định dạng .png hoặc .jpg, bạn cần kiểm tra xem 
                    // biến req.AnhMinhChung đã bao gồm đuôi file chưa. 
                    // Ở đây tôi sửa đường dẫn từ /uploads/ thành /minh_chung/
                    const imagePath = `/minh_chung/${req.AnhMinhChung}`;
                    
                    imgHtml = `
                        <img src="${imagePath}" 
                            style="width:50px; height:50px; object-fit:cover; border-radius:4px; cursor:pointer; border: 1px solid #ddd;" 
                            onclick="showFullImage('${imagePath}')" 
                            onerror="this.onerror=null; this.src='https://placehold.co/50x50?text=No+Image';">`;
                } else {
                    imgHtml = '<span style="color:#999; font-style:italic;">Không có</span>';
                }

                row.innerHTML = `
                    <td style="padding: 12px;"><span class="badge ${req.LoaiYeuCau === 'Check-in' ? 'bg-info' : 'bg-warning'}">${req.LoaiYeuCau}</span></td>
                    <td style="padding: 12px;">${req.MaNV}</td>
                    <td style="padding: 12px;">${req.HoTen}</td>
                    <td style="padding: 12px;">${new Date(req.ThoiGianGui).toLocaleDateString('vi-VN')}</td>
                    <td style="padding: 12px;">${new Date(req.ThoiGianGui).toLocaleTimeString('vi-VN', {hour: '2-digit', minute:'2-digit'})}</td>
                    <td style="padding: 12px; text-align:center;">${imgHtml}</td>
                    <td style="padding: 12px;">${req.LyDo || ''}</td>
                    <td style="padding: 12px; text-align: center;">
                        <button onclick="approveRequest(${req.MaYeuCau})" style="color: #27ae60; background:none; border:none; cursor:pointer; font-weight:bold;">Duyệt</button> |
                        <button onclick="rejectRequest(${req.MaYeuCau})" style="color: #e74c3c; background:none; border:none; cursor:pointer; font-weight:bold;">Từ chối</button>
                    </td>
                `;
                tableBody.appendChild(row);
            });
        }
    } catch (error) {
        tableBody.innerHTML = '<tr><td colspan="8" style="text-align:center;">Lỗi tải dữ liệu</td></tr>';
    }
}

// Hàm phóng to ảnh
function showFullImage(src) {
    const modal = document.getElementById('imageModal');
    const modalImg = document.getElementById('modalImg');
    modal.style.display = "flex";
    modalImg.src = src;
}

// Xử lý nút Duyệt
async function approveRequest(id) {
    if(confirm('Bạn có chắc chắn muốn DUYỆT yêu cầu này?\nHệ thống sẽ tự động ghi nhận chấm công cho nhân viên.')) {
        try {
            const response = await fetch(`/api/admin/attendance-requests/${id}/approve`, { 
                method: 'POST' 
            });
            const result = await response.json();
            
            if (result.success) {
                alert(`✅ ${result.message}`);
                loadAttendanceRequests(); // Tải lại danh sách yêu cầu
                
                // Cập nhật lại số liệu thống kê chấm công phía trên nếu có
                if (typeof loadAttendanceSummary === 'function') {
                    loadAttendanceSummary();
                }
            } else {
                alert(`❌ Lỗi: ${result.message}`);
            }
        } catch (error) {
            console.error("Lỗi duyệt yêu cầu:", error);
            alert('❌ Có lỗi kết nối đến máy chủ khi duyệt yêu cầu.');
        }
    }
}

// Xử lý nút Từ chối
async function rejectRequest(id) {
    if(confirm('Bạn có chắc chắn muốn TỪ CHỐI yêu cầu này?')) {
        try {
            const response = await fetch(`/api/admin/attendance-requests/${id}/reject`, { 
                method: 'POST' 
            });
            const result = await response.json();
            
            if (result.success) {
                alert(`🗑️ ${result.message}`);
                loadAttendanceRequests(); // Tải lại danh sách
            } else {
                alert(`❌ Lỗi: ${result.message}`);
            }
        } catch (error) {
            console.error("Lỗi từ chối yêu cầu:", error);
            alert('❌ Có lỗi kết nối đến máy chủ khi xóa yêu cầu.');
        }
    }
}
async function loadTodayAttendance() {
    const tbody = document.getElementById("attendanceTableBody");
    
    try {
        const response = await fetch('/api/admin/attendance-today'); // Đường dẫn API đã tạo ở bước trước
        const result = await response.json();

        if (result.success && result.data.length > 0) {
            let html = '';
            result.data.forEach(row => {
                // Định dạng giờ hiển thị
                const formatTime = (timeStr) => {
                    if (!timeStr) return '--:--';
                    const date = new Date(timeStr);
                    return date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
                };

                // Xác định class CSS cho trạng thái
                let statusClass = 'status-active'; // Mặc định là xanh (Đúng giờ)
                if (row.TrangThai.toLowerCase().includes('trễ') || row.TrangThai.toLowerCase().includes('muộn')) {
                    statusClass = 'status-pending'; // Màu vàng/cam
                } else if (row.TrangThai.toLowerCase().includes('nghỉ')) {
                    statusClass = 'status-inactive'; // Màu đỏ
                }

                html += `
                    <tr>
                        <td><strong>${row.MaNV}</strong></td>
                        <td>${row.HoTen}</td>
                        <td>${row.TenPhong || 'N/A'}</td>
                        <td>${formatTime(row.GioCheckIn)}</td>
                        <td>${formatTime(row.GioCheckOut)}</td>
                        <td>${row.TongGio || 0}h</td>
                        <td><span class="status-badge ${statusClass}">${row.TrangThai}</span></td>
                        <td>
                            <button class="action-btn" onclick="viewAttendancePhoto('${row.MaNV}')">
                                📷
                            </button>
                        </td>
                    </tr>
                `;
            });
            tbody.innerHTML = html;
        } else {
            tbody.innerHTML = '<tr><td colspan="8" style="text-align: center;">Hôm nay chưa có dữ liệu chấm công.</td></tr>';
        }
    } catch (error) {
        console.error("Lỗi khi tải bảng chấm công:", error);
        tbody.innerHTML = '<tr><td colspan="8" style="text-align: center; color: red;">Lỗi kết nối máy chủ.</td></tr>';
    }
}
function toggleTaskMenu(btn) {
    const menu = btn.nextElementSibling;
    menu.style.display = menu.style.display === 'block' ? 'none' : 'block';
}

// CRUD demo
function createTask() {
    alert("Tạo task (gọi API sau)");
    closeModal('addTaskModal');
}

function viewTask() {
    alert("Xem task");
}

function editTask() {
    alert("Sửa task");
}

function deleteTask() {
    alert("Xóa task");
}

function doneTask() {
    alert("Hoàn thành task");
}

// CHAT
function sendMessage() {
    const input = document.getElementById("chatInput");
    const chatBox = document.getElementById("chatBox");

    if (!input.value.trim()) return;

    const msg = document.createElement("div");
    msg.className = "chat-msg admin";
    msg.innerText = input.value;

    chatBox.appendChild(msg);
    input.value = "";
    chatBox.scrollTop = chatBox.scrollHeight;
}
// Gọi hàm khi trang tải xong
document.addEventListener("DOMContentLoaded", () => {
    loadTodayAttendance();
    // (Tùy chọn) Tự động cập nhật mỗi 2 phút
    setInterval(loadTodayAttendance, 120000);
});

// Gọi hàm khi trang tải xong
document.addEventListener("DOMContentLoaded", loadTodayAttendance);
document.addEventListener("DOMContentLoaded", function() {
    // 1. Tải danh sách nhân viên ngay khi vào trang
    loadWorkingEmployees();
    
    // 2. Cứ mỗi 5 phút tự động cập nhật lại danh sách một lần
    setInterval(loadWorkingEmployees, 300000); 

    // 3. Tải các thông số thống kê Admin
    loadAdminStats();

    // (Tuỳ chọn) Nếu trang đầu tiên là Dashboard, bạn có thể gọi luôn hàm load biểu đồ
    if (typeof loadCharts === 'function') {
        loadCharts();
    }
    loadWorkingEmployees();
    setInterval(loadWorkingEmployees, 300000); 
    loadAdminStats();
    
    // BỔ SUNG CODE MỚI VÀO ĐÂY:
    
    // Gọi hàm load phòng ban ngay khi mở trang
    loadDepartments();
    loadAttendanceSummary();
    // Lắng nghe sự kiện: hễ gõ phím hoặc đổi phòng ban là tự động lọc ngay
    document.getElementById('employee-search').addEventListener('input', quickFilter);
    document.getElementById('filter-department').addEventListener('change', quickFilter);
});
