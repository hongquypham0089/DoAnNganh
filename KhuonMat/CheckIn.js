// Variables
let isCheckedIn = false;
let checkInTime = null;
let cameraActive = false;
let videoStream = null;

// Khởi động Camera thật
async function startCamera() {
    const video = document.getElementById('video');
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true });
        video.srcObject = stream;
        videoStream = stream;
        cameraActive = true;
        
        // Cập nhật giao diện trạng thái camera
        document.getElementById('cameraStatus').className = 'camera-status';
        document.getElementById('cameraStatus').innerHTML = '<span>●</span> Đang hoạt động';
        
        // Ẩn placeholder nếu có
        const placeholder = document.getElementById('cameraPlaceholder');
        if (placeholder) placeholder.style.display = 'none';
        
    } catch (err) {
        console.error("Lỗi mở camera:", err);
        document.getElementById('cameraStatus').className = 'camera-status offline';
        document.getElementById('cameraStatus').innerHTML = '<span>●</span> Lỗi Camera';
        alert("Không thể truy cập camera. Vui lòng kiểm tra quyền truy cập!");
    }
}

// Bật camera ngay khi tải trang
window.addEventListener('load', startCamera);

// Hàm chụp ảnh từ Video
function captureImage() {
    const video = document.getElementById('video');
    const canvas = document.getElementById('canvas');
    if (!video || !canvas) return null;
    
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    // Trả về ảnh dạng Base64
    return canvas.toDataURL('image/jpeg'); 
}

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

// Handle Check-in (GỌI API THẬT)
async function handleCheckIn() {
    if (!cameraActive) {
        alert("Camera chưa sẵn sàng!");
        return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    // Show loading
    document.getElementById('cameraLoading').classList.add('active');
    
    // 1. Chụp ảnh
    const base64Image = captureImage();
    if (!base64Image) {
        document.getElementById('cameraLoading').classList.remove('active');
        alert("Lỗi chụp ảnh!");
        return;
    }

    // 2. Gửi ảnh lên Backend API (Thay đổi URL cho đúng với Server Python của bạn)
    try {
        const response = await fetch('http://localhost:5000/api/checkin', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });
        
        const result = await response.json();
        document.getElementById('cameraLoading').classList.remove('active');

        // 3. Xử lý kết quả trả về
        if (result.status === 'success') {
            // Update UI
            document.getElementById('todayCheckIn').textContent = timeStr;
            document.getElementById('todayStatus').textContent = 'Đã check-in';
            document.getElementById('todayStatus').style.color = '#27ae60';
            
            // Disable check-in button
            document.getElementById('checkinBtn').disabled = true;
            document.getElementById('checkinBtn').style.opacity = '0.5';
            
            isCheckedIn = true;
            checkInTime = now;
            
            // Show success modal
            const modal = document.getElementById('successModal');
            document.getElementById('modalIcon').textContent = '✅';
            document.getElementById('modalTitle').textContent = 'Check-in thành công!';
            // Hiển thị tên trả về từ Server nhận diện được
            document.getElementById('modalMessage').textContent = `Xin chào ${result.name}! Chúc bạn có một ngày làm việc hiệu quả.`;
            document.getElementById('modalTime').textContent = timeStr;
            
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('modalDate').textContent = now.toLocaleDateString('vi-VN', options);
            
            modal.classList.add('active');
        } else {
            alert("Nhận diện thất bại: " + (result.message || "Không tìm thấy khuôn mặt trong hệ thống"));
        }
        
    } catch (error) {
        console.error("Lỗi kết nối Server:", error);
        document.getElementById('cameraLoading').classList.remove('active');
        alert("Không thể kết nối đến máy chủ nhận diện (Backend đang tắt?)");
    }
}

// Handle Check-out (GỌI API THẬT)
async function handleCheckOut() {
    if (!isCheckedIn) {
        alert('Bạn chưa check-in!');
        return;
    }
    
    if (!cameraActive) {
        alert("Camera chưa sẵn sàng!");
        return;
    }

    const now = new Date();
    const timeStr = now.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
    
    // Show loading
    document.getElementById('cameraLoading').classList.add('active');
    
    // 1. Chụp ảnh để xác nhận check-out
    const base64Image = captureImage();

    // 2. Gửi ảnh lên Backend
    try {
        const response = await fetch('http://localhost:5000/api/checkout', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ image: base64Image })
        });
        
        const result = await response.json();
        document.getElementById('cameraLoading').classList.remove('active');

        if (result.status === 'success') {
            // Calculate total hours
            const diffHours = ((now - checkInTime) / (1000 * 60 * 60)).toFixed(1);
            
            // Update UI
            document.getElementById('todayCheckOut').textContent = timeStr;
            document.getElementById('todayTotalHours').textContent = diffHours + ' giờ';
            
            // Disable check-out button
            document.getElementById('checkoutBtn').disabled = true;
            document.getElementById('checkoutBtn').style.opacity = '0.5';
            
            // Show success modal
            const modal = document.getElementById('successModal');
            document.getElementById('modalIcon').textContent = '👋';
            document.getElementById('modalTitle').textContent = 'Check-out thành công!';
            document.getElementById('modalMessage').textContent = `Tạm biệt ${result.name}. Tổng thời gian làm việc: ${diffHours} giờ`;
            document.getElementById('modalTime').textContent = timeStr;
            
            const options = { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' };
            document.getElementById('modalDate').textContent = now.toLocaleDateString('vi-VN', options);
            
            modal.classList.add('active');
        } else {
            alert("Xác thực khuôn mặt thất bại: " + (result.message || "Lỗi không xác định"));
        }
    } catch (error) {
        console.error("Lỗi kết nối Server:", error);
        document.getElementById('cameraLoading').classList.remove('active');
        alert("Không thể kết nối đến máy chủ nhận diện!");
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
    alert('Chức năng này cần xử lý đổi camera trước/sau trên thiết bị di động!');
}

function testCamera() {
    if (cameraActive) {
        alert('✅ Camera đang hoạt động bình thường và sẵn sàng chụp ảnh.');
    } else {
        alert('❌ Camera chưa được kết nối!');
        startCamera();
    }
}

function resetCamera() {
    if(confirm('Khởi động lại kết nối camera?')) {
        document.getElementById('cameraStatus').className = 'camera-status offline';
        document.getElementById('cameraStatus').innerHTML = '<span>●</span> Đang kết nối lại...';
        cameraActive = false;
        
        // Tắt stream cũ
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }
        
        // Khởi động lại
        setTimeout(() => {
            startCamera();
        }, 1000);
    }
}

// View all history
function viewAllHistory() {
    alert('Đang mở trang lịch sử...');
}

// Handle logout
function handleLogout() {
    if(confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        // Tắt camera trước khi đăng xuất
        if (videoStream) {
            videoStream.getTracks().forEach(track => track.stop());
        }
        alert('Đã đăng xuất!');
    }
}