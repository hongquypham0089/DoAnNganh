// Handle logout
function handleLogout() {
    if(confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        alert('Đã đăng xuất!');
    }
}



// Switch guide category
function switchGuide(guideId, element) {
    // Update active category
    document.querySelectorAll('.category-card').forEach(card => {
        card.classList.remove('active');
    });
    element.classList.add('active');

    // Hide all guide sections
    document.querySelectorAll('.guide-section').forEach(section => {
        section.classList.remove('active');
    });

    // Show selected guide
    document.getElementById('guide-' + guideId).classList.add('active');

    // Update sidebar index
    updateGuideIndex(guideId);
}

// Update sidebar index based on selected guide
function updateGuideIndex(guideId) {
    const guideIndex = document.getElementById('guideIndex');
    let content = '';

    if(guideId === 'cham-cong') {
        content = `
            <li><a href="#" class="active" onclick="scrollToGuide(1, this)">1. Đăng nhập hệ thống</a></li>
            <li><a href="#" onclick="scrollToGuide(2, this)">2. Vào trang chấm công</a></li>
            <li><a href="#" onclick="scrollToGuide(3, this)">3. Kiểm tra camera</a></li>
            <li><a href="#" onclick="scrollToGuide(4, this)">4. Thực hiện check-in</a></li>
            <li><a href="#" onclick="scrollToGuide(5, this)">5. Xác nhận kết quả</a></li>
            <li><a href="#" onclick="scrollToGuide(6, this)">6. Check-out cuối ngày</a></li>
        `;
    } else if(guideId === 'luong') {
        content = `
            <li><a href="#" class="active">1. Truy cập trang Thu nhập</a></li>
            <li><a href="#">2. Chọn tháng muốn xem</a></li>
            <li><a href="#">3. Xem tổng quan thu nhập</a></li>
            <li><a href="#">4. Xem chi tiết các khoản</a></li>
            <li><a href="#">5. Xem lịch sử thu nhập</a></li>
        `;
    } else if(guideId === 'nghi-phep') {
        content = `
            <li><a href="#" class="active">1. Vào trang chủ</a></li>
            <li><a href="#">2. Điền form đăng ký</a></li>
            <li><a href="#">3. Đính kèm giấy tờ</a></li>
            <li><a href="#">4. Gửi đơn cho quản lý</a></li>
            <li><a href="#">5. Theo dõi trạng thái</a></li>
        `;
    } else if(guideId === 'thong-tin') {
        content = `
            <li><a href="#" class="active">1. Truy cập trang cá nhân</a></li>
            <li><a href="#">2. Cập nhật ảnh đại diện</a></li>
            <li><a href="#">3. Cập nhật thông tin</a></li>
            <li><a href="#">4. Cập nhật ngân hàng</a></li>
            <li><a href="#">5. Đổi mật khẩu</a></li>
        `;
    } else {
        content = `
            <li><a href="#" class="active">📱 Sử dụng điện thoại</a></li>
            <li><a href="#">🔔 Nhận thông báo</a></li>
            <li><a href="#">📊 Xem báo cáo</a></li>
        `;
    }

    guideIndex.innerHTML = content;
}

// Scroll to specific step (simplified)
function scrollToGuide(step, element) {
    document.querySelectorAll('.guide-index a').forEach(link => {
        link.classList.remove('active');
    });
    element.classList.add('active');
}

// Toggle FAQ
function toggleFAQ(item) {
    const answer = item.querySelector('.faq-answer');
    const icon = item.querySelector('.faq-question span:last-child');
    
    if(answer.classList.contains('show')) {
        answer.classList.remove('show');
        icon.textContent = '▼';
    } else {
        answer.classList.add('show');
        icon.textContent = '▲';
    }
}

// Play video
function playVideo(videoId) {
}

// // Support functions
// function callSupport() {
//     alert('Đang gọi 1900 1234');
// }

// function chatSupport() {
//     alert('Đang mở chat hỗ trợ');
// }

// function emailSupport() {
//     alert('Gửi email đến support@company.com');
// }

// Initialize first guide
updateGuideIndex('cham-cong');