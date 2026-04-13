// Variables
let isCheckedIn = false;
let checkInTime = null;
let cameraActive = true;

// Update time every second
function updateDateTime() {
    const now = new Date();
    
    // Format time
    const timeStr = now.toLocaleTimeString('vi-VN', { hour12: false });
    document.getElementById('currentTime').textContent = timeStr;
    
    // Format date
    const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
    const dateStr = now.toLocaleDateString('vi-VN', options);
    document.getElementById('currentDate').textContent = dateStr;
}

setInterval(updateDateTime, 1000);
updateDateTime();


// ==========================================
// KHỞI ĐỘNG WEBCAM KHI MỞ TRANG
// ==========================================
let video;
let canvas;
let stream = null;

async function startCamera() {
    video = document.getElementById('videoElement');
    canvas = document.getElementById('canvasElement');
    
    if (!video) {
        console.error("LỖI: Không tìm thấy thẻ video trên HTML!");
        return;
    }

    try {
        stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        document.getElementById('cameraStatus').innerHTML = '<span style="color:#27ae60">●</span> Đang hoạt động';
        console.log("Đã bật camera thành công!");
    } catch (err) {
        console.error("Lỗi Camera: ", err);
        alert("Không thể mở Camera! Vui lòng cấp quyền cho trình duyệt.");
        document.getElementById('cameraStatus').innerHTML = '<span style="color:red">●</span> Lỗi Camera';
    }
}

// Gọi hàm khởi động camera sau khi tải trang 0.5s
setTimeout(startCamera, 500);

// Handle Check-out (Đã sửa lỗi gọi API)
async function handleCheckOut() {
    if (!isCheckedIn) {
        alert('Bạn chưa check-in!');
        return;
    }

    const maNV = document.getElementById('currentMaNV').value;
    if (!maNV) {
        alert("Không tìm thấy thông tin Mã Nhân Viên!");
        return;
    }

    // Hiện loading
    document.getElementById('cameraLoading').classList.add('active');

    try {
        // GỌI API ĐỂ LƯU XUỐNG CSDL (Tùy bạn dùng Node.js hay Python, nhớ đổi đúng link)
        // Ở đây mình ví dụ gọi API Node.js (cùng host)
        const response = await fetch('/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ maNV: maNV })
        });

        const data = await response.json();
        document.getElementById('cameraLoading').classList.remove('active');

        if (data.success) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
            const diffHours = ((now - checkInTime) / (1000 * 60 * 60)).toFixed(1);

            // Cập nhật giao diện
            document.getElementById('todayCheckOut').textContent = timeStr;
            document.getElementById('todayTotalHours').textContent = diffHours + ' giờ';
            
            document.getElementById('checkoutBtn').disabled = true;
            document.getElementById('checkoutBtn').style.opacity = '0.5';

            // Hiện Modal thành công
            const modal = document.getElementById('successModal');
            document.getElementById('modalIcon').textContent = '👋';
            document.getElementById('modalTitle').textContent = 'Check-out thành công!';
            document.getElementById('modalMessage').textContent = 'Tổng thời gian: ' + diffHours + ' giờ';
            document.getElementById('modalTime').textContent = timeStr;
            
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('modalDate').textContent = now.toLocaleDateString('vi-VN', options);
            
            modal.classList.add('active');

            // Tải lại lịch sử chấm công ở bảng bên dưới
            loadHistory();
        } else {
            alert("❌ Check-out thất bại: " + data.message);
        }

    } catch (error) {
        document.getElementById('cameraLoading').classList.remove('active');
        console.error("Lỗi Check-out:", error);
        alert("Lỗi kết nối đến máy chủ khi Check-out!");
    }
}
// ==========================================
// 2. XỬ LÝ CHECK-IN (CHỤP ẢNH & GỬI LÊN PYTHON)
// ==========================================
async function handleCheckIn() {
    
    // Lấy mã NV đang đăng nhập
    const maNV = document.getElementById('currentMaNV').value;
    if (!maNV) {
        alert("Không tìm thấy thông tin Mã Nhân Viên, vui lòng đăng nhập lại!");
        return;
    }

    // Hiện loading
    document.getElementById('cameraLoading').classList.add('active');
    
    // 1. Chụp hình từ thẻ <video> vẽ sang <canvas>
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    canvas.getContext('2d').drawImage(video, 0, 0);
    
    // 2. Chuyển hình thành mã Base64 (chuỗi text)
    const imageBase64 = canvas.toDataURL('image/jpeg');

    try {
        // 3. Gửi sang API Python (Cổng 5000)
        const response = await fetch('http://localhost:5000/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ MaNV: maNV, image: imageBase64 })
        });

        const data = await response.json();
        document.getElementById('cameraLoading').classList.remove('active');

        // 4. Xử lý kết quả trả về từ Python
if (data.success) {
            const now = new Date();
            const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });

            // 👇👇👇 BỔ SUNG 2 DÒNG NÀY 👇👇👇
            isCheckedIn = true;
            checkInTime = now;
            // 👆👆👆 BỔ SUNG 2 DÒNG NÀY 👆👆👆

            // Cập nhật giao diện thành công
            document.getElementById('todayCheckIn').textContent = timeStr;
            document.getElementById('todayStatus').textContent = data.trang_thai || 'Đã check-in';
            document.getElementById('todayStatus').style.color = '#27ae60';
            document.getElementById('checkinBtn').disabled = true;
            document.getElementById('checkinBtn').style.opacity = '0.5';
            
            // Hiện Modal thành công
            const modal = document.getElementById('successModal');
            document.getElementById('modalMessage').textContent = data.message;
            document.getElementById('modalTime').textContent = timeStr;
            modal.classList.add('active');
        } else {
            alert("❌ Chấm công thất bại: " + data.message);
        }

    } catch (error) {
        document.getElementById('cameraLoading').classList.remove('active');
        console.error(error);
        alert("Lỗi: Không thể kết nối đến Server AI (Python) ở cổng 5000!");
    }
}
// Close modal
function closeModal() {
    document.getElementById('successModal').classList.remove('active');
}

// Click outside modal to close
window.onclick = function(event) {
    const modal = document.getElementById('successModal');
    if (event.target === modal) {
        modal.classList.remove('active');
    }
}

// Camera functions
function toggleCamera() {
    alert('Đang chuyển đổi camera...');
}

function testCamera() {
    document.getElementById('cameraLoading').classList.add('active');
    setTimeout(() => {
        document.getElementById('cameraLoading').classList.remove('active');
        alert('✅ Camera hoạt động tốt');
    }, 1500);
}

function resetCamera() {
    if(confirm('Đặt lại camera?')) {
        document.getElementById('cameraStatus').className = 'camera-status offline';
        document.getElementById('cameraStatus').innerHTML = '<span>●</span> Đang kết nối lại...';
        
        setTimeout(() => {
            document.getElementById('cameraStatus').className = 'camera-status';
            document.getElementById('cameraStatus').innerHTML = '<span>●</span> Đang hoạt động';
        }, 2000);
    }
}

// View all history
function viewAllHistory() {
    alert('Xem tất cả lịch sử chấm công');
}

// Handle logout
function handleLogout() {
    if(confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        alert('Đã đăng xuất!');
    }
}
// Hàm tạm thời để mở hộp thoại nhập lý do chấm công thủ công
function openBackupModal(type) {
    const loaiChamCong = type === 'CheckIn' ? 'Check-in' : 'Check-out';
    const lyDo = prompt(`Nhập lý do bạn muốn ${loaiChamCong} thủ công (VD: Camera lỗi, Quên đem kính...):`);
    
    if (lyDo) {
        alert(`Bạn đã gửi yêu cầu ${loaiChamCong} với lý do: "${lyDo}".\n\n(Phần gửi dữ liệu về Server sẽ làm sau!)`);
    }
}
// TẢI LỊCH SỬ CHẤM CÔNG TỪ DATABASE
// ==========================================
async function loadHistory() {
    try {
        const response = await fetch('/api/attendance-history');
        const result = await response.json();

        if (result.success) {
            const tbody = document.getElementById('historyTableBody');
            tbody.innerHTML = ''; // Xóa dòng "Đang tải dữ liệu..."

            if (result.data.length === 0) {
                tbody.innerHTML = '<tr><td colspan="6" style="text-align: center;">Chưa có dữ liệu chấm công</td></tr>';
                return;
            }

            // Duyệt qua từng dòng dữ liệu từ CSDL
            result.data.forEach(row => {
                // Xử lý format Ngày
                const dateObj = new Date(row.NgayCC);
                const dateStr = dateObj.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });

                // Xử lý format Giờ (SQL Server trả về thời gian chuẩn UTC, cần cẩn thận)
                const formatTime = (timeData) => {
                    if (!timeData) return '--:--';
                    const t = new Date(timeData);
                    // Dùng getUTCHours() để tránh bị lệch múi giờ do SQL Server trả về
                    return t.getUTCHours().toString().padStart(2, '0') + ':' + t.getUTCMinutes().toString().padStart(2, '0');
                };

                const checkinTime = formatTime(row.GioCheckIn);
                const checkoutTime = formatTime(row.GioCheckOut);
                
                // Xử lý tổng giờ
                const totalHours = row.TongGioLam ? `${row.TongGioLam}h` : '-';

                // Xử lý màu sắc của huy hiệu trạng thái (Badge)
                let statusClass = 'status-absent';
                if (row.TrangThai === 'Đúng giờ') statusClass = 'status-present';
                else if (row.TrangThai === 'Tăng ca') statusClass = 'status-overtime';
                else if (row.TrangThai && row.TrangThai.includes('Đi trễ')) statusClass = 'status-late';

                const statusStr = row.TrangThai ? row.TrangThai : 'Chưa rõ';
                const faceIDStr = row.XacThucFaceID ? `📸 ${checkinTime}` : '-';

                // Tạo thẻ <tr> và nhét vào bảng
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${dateStr}</td>
                    <td>${checkinTime}</td>
                    <td>${checkoutTime}</td>
                    <td>${totalHours}</td>
                    <td><span class="status-badge ${statusClass}">${statusStr}</span></td>
                    <td>${faceIDStr}</td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error("Lỗi khi tải lịch sử:", error);
    }
}
// ==========================================
// CHỨC NĂNG CHAT VỚI QUẢN LÝ
// ==========================================

// 1. Hàm để ẩn nút ban đầu và hiện form chi tiết (Lựa chọn và tải file)
function showManualRequestForm() {
    // Ẩn khu vực chỉ có 1 nút ban đầu
    const initialArea = document.getElementById('backup-initial-area');
    initialArea.style.display = 'none';

    // Hiện khu vực form chi tiết
    const formArea = document.getElementById('backup-form-area');
    formArea.style.display = 'block';

    // Cuộn thanh scroll xuống cuối để người dùng thấy form mới hiện
    const attendanceWrapper = document.querySelector('.attendance-wrapper');
    if (attendanceWrapper) attendanceWrapper.scrollTop = attendanceWrapper.scrollHeight;
}

// 2. Hàm để cập nhật nhãn tên file khi người dùng chọn một ảnh
function updateFileLabel(input) {
    const fileLabel = document.getElementById('fileLabel');
    
    if (input.files && input.files.length > 0) {
        // Lấy tên file
        const fileName = input.files[0].name;
        // Cập nhật nhãn với icon và tên file
        fileLabel.innerHTML = `<span><i class="fas fa-image"></i> ${fileName}</span>`;
        // Thay đổi style nhãn để báo đã có file
        fileLabel.style.borderColor = '#aaa';
    } else {
        // Reset về nhãn mặc định nếu không có file
        fileLabel.innerHTML = `<span><i class="fas fa-cloud-upload-alt"></i> Tải ảnh lên</span>`;
        fileLabel.style.borderColor = '#ccc';
    }
}

// 3. Hàm tạm thời để xử lý khi nhân viên bấm nút Check-in/Check-out thủ công
function requestManual(type) {
    const loaiChamCong = type === 'CheckIn' ? 'Check-in' : 'Check-out';
    const proofInput = document.getElementById('attendanceProof');
    
    // Kiểm tra đã có file ảnh chưa
    if (!proofInput.files || proofInput.files.length === 0) {
        alert("Vui lòng tải lên ảnh minh chứng trước khi gửi yêu cầu!");
        return;
    }

    const lyDo = prompt(`Nhập lý do bạn muốn ${loaiChamCong} thủ công (VD: Camera lỗi, Quên đem kính...):`);
    
    if (lyDo) {
        alert(`Bạn đã gửi yêu cầu ${loaiChamCong} thủ công với ảnh minh chứng.\n\n(Phần gửi dữ liệu về Server sẽ làm sau!)`);
    }
}
async function requestManual(type) {
    const loaiChamCong = type === 'CheckIn' ? 'Check-in' : 'Check-out';
    const proofInput = document.getElementById('attendanceProof');
    
    // 1. Kiểm tra ảnh minh chứng
    if (!proofInput.files || proofInput.files.length === 0) {
        alert("Vui lòng tải lên ảnh minh chứng trước khi gửi yêu cầu!");
        return;
    }

    // 2. Lấy lý do từ người dùng
    const lyDo = prompt(`Nhập lý do bạn muốn ${loaiChamCong} thủ công (VD: Camera lỗi, Quên đem kính...):`);
    
    if (!lyDo || lyDo.trim() === "") {
        alert("Bạn phải nhập lý do để gửi yêu cầu.");
        return;
    }

    // 3. Chuẩn bị dữ liệu gửi đi (FormData vì có gửi kèm file ảnh)
    const formData = new FormData();
    formData.append('loaiYeuCau', loaiChamCong);
    formData.append('lyDo', lyDo);
    formData.append('evidence', proofInput.files[0]);

    try {
        // Hiển thị trạng thái đang xử lý (nếu cần)
        console.log("Đang gửi yêu cầu...");
        
        const response = await fetch('/api/send-request', {
            method: 'POST',
            body: formData
            // Lưu ý: Không đặt Content-Type khi dùng FormData, trình duyệt sẽ tự xử lý
        });

        const result = await response.json();

        if (result.success) {
            alert(`✅ Thành công: ${result.message}`);
            // Reset form sau khi gửi thành công
            proofInput.value = "";
            document.getElementById('fileLabel').innerHTML = `<span><i class="fas fa-cloud-upload-alt"></i> Tải ảnh lên</span>`;
        } else {
            alert(`❌ Thất bại: ${result.message}`);
        }
    } catch (error) {
        console.error("Lỗi kết nối API:", error);
        alert("❌ Đã xảy ra lỗi kết nối. Vui lòng thử lại sau.");
    }
}
// TỰ ĐỘNG BẬT CAMERA VÀ TẢI LỊCH SỬ KHI MỞ TRANG
document.addEventListener("DOMContentLoaded", function() {
    startCamera();
    loadHistory(); 
});