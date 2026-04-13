
// Xử lý đăng xuất
function handleLogout() {
    if(confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        alert('Đã đăng xuất!');
        // Thực tế sẽ chuyển hướng về trang đăng nhập
    }
}

// Xử lý chọn danh mục đào tạo
function selectCategory(element, category) {
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');

    const contentArea = document.getElementById('training-content-area');
    
    // Nội dung thay đổi theo category
    if(category === 'process') {
        contentArea.innerHTML = `
            <h3 style="color: #8e44ad; margin-bottom: 20px;">Quy trình chế biến thức ăn</h3>
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                <h4 style="color: #8e44ad;">1. Tiếp nhận nguyên liệu</h4>
                <p style="margin-top: 10px;">- Kiểm tra chất lượng nguyên liệu đầu vào</p>
                <p>- Bảo quản nguyên liệu đúng nhiệt độ</p>
                <p>- Phân loại nguyên liệu theo từng khu vực</p>
            </div>
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                <h4 style="color: #8e44ad;">2. Sơ chế</h4>
                <p style="margin-top: 10px;">- Rửa sạch nguyên liệu</p>
                <p>- Cắt thái theo đúng kích thước quy định</p>
                <p>- Bảo quản nguyên liệu đã sơ chế</p>
            </div>
        `;
    } else if(category === 'recipes') {
        contentArea.innerHTML = `
            <h3 style="color: #8e44ad; margin-bottom: 20px;">Công thức món ăn</h3>
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                <h4 style="color: #8e44ad;">Phở bò</h4>
                <p><strong>Nguyên liệu:</strong> Bò, bánh phở, hành, gừng, gia vị</p>
                <p><strong>Cách làm:</strong> Ninh xương, phi thơm hành gừng, nấu nước dùng...</p>
            </div>
            <div style="margin-bottom: 20px; padding: 15px; background-color: #f8f9fa; border-radius: 8px;">
                <h4 style="color: #8e44ad;">Bún chả</h4>
                <p><strong>Nguyên liệu:</strong> Thịt ba chỉ, bún, rau sống, nước mắm</p>
                <p><strong>Cách làm:</strong> Tẩm ướp thịt, nướng vàng, pha nước chấm...</p>
            </div>
        `;
    }
}


// ==========================================
// TẢI TỔNG GIỜ LÀM VÀ NGÀY CÔNG CỦA THÁNG
// ==========================================
async function loadMonthTotalHours() {
    try {
        const response = await fetch('/api/current-month-hours');
        const result = await response.json();

        if (result.success) {
            const thang = result.data.Thang;
            const tongGio = result.data.TongGioTrongThang;
            const soNgay = result.data.SoNgayCong; // LẤY THÊM SỐ NGÀY CÔNG TỪ SERVER
            
            // Tìm các thẻ HTML để đổ dữ liệu vào
            const monthLabel = document.getElementById('currentMonthLabel');
            const hoursDisplay = document.getElementById('monthTotalHours');
            const daysDisplay = document.getElementById('monthTotalDays'); // TÌM THẺ NGÀY CÔNG
            
            if (monthLabel) monthLabel.textContent = thang;
            if (hoursDisplay) hoursDisplay.textContent = `${tongGio} giờ`;
            
            // ĐỔ DỮ LIỆU SỐ NGÀY CÔNG RA MÀN HÌNH
            if (daysDisplay) daysDisplay.textContent = `${soNgay} ngày`; 
        }
    } catch (error) {
        console.error("Lỗi tải tổng giờ/ngày tháng:", error);
        const hoursDisplay = document.getElementById('monthTotalHours');
        const daysDisplay = document.getElementById('monthTotalDays');
        
        if (hoursDisplay) hoursDisplay.textContent = "Lỗi tải DL";
        if (daysDisplay) daysDisplay.textContent = "Lỗi tải DL";
    }
}

// ==========================================
// KHỞI CHẠY CÁC HÀM KHI MỞ TRANG
// ==========================================
document.addEventListener("DOMContentLoaded", function() {
    // Chỉ bật camera nếu đang ở trang có chứa khung camera
    if (document.getElementById('videoElement')) {
        startCamera();
    }
    
    // Chỉ tải bảng lịch sử nếu đang ở trang có bảng lịch sử
    if (document.getElementById('historyTableBody')) {
        loadHistory(); 
    }
    
    // Tải tổng giờ làm (áp dụng cho trang có thẻ monthTotalHours)
    loadMonthTotalHours(); 
});