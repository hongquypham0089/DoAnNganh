// Handle logout
function handleLogout() {
    if(confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        alert('Đã đăng xuất!');
    }
}

// Switch tabs
function switchTab(tabId) {
    // Update tab buttons
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });
    event.target.closest('.tab-btn').classList.add('active');

    // Hide all tab panes
    document.querySelectorAll('.tab-pane').forEach(pane => {
        pane.classList.remove('active');
    });

    // Show selected tab
    document.getElementById('tab-' + tabId).classList.add('active');
}

// Change avatar
function changeAvatar() {
    alert('Chọn ảnh đại diện mới');
}

// Copy text
function copyText(text) {
    navigator.clipboard.writeText(text);
    alert('Đã copy: ' + text);
}

// Toggle password visibility
function togglePassword(inputId) {
    const input = document.getElementById(inputId);
    if(input.type === 'password') {
        input.type = 'text';
    } else {
        input.type = 'password';
    }
}

// Check password strength
function checkPasswordStrength() {
    const password = document.getElementById('new-password').value;
    const strengthFill = document.getElementById('strength-fill');
    const strengthText = document.getElementById('strength-text');
    
    let strength = 0;
    
    if(password.length >= 8) strength += 25;
    if(password.match(/[a-z]+/)) strength += 25;
    if(password.match(/[A-Z]+/)) strength += 25;
    if(password.match(/[0-9]+/) || password.match(/[$@#&!]+/)) strength += 25;
    
    strengthFill.style.width = strength + '%';
    
    if(strength <= 25) {
        strengthFill.style.background = '#e74c3c';
        strengthText.textContent = 'Mật khẩu yếu';
    } else if(strength <= 50) {
        strengthFill.style.background = '#f39c12';
        strengthText.textContent = 'Mật khẩu trung bình';
    } else if(strength <= 75) {
        strengthFill.style.background = '#3498db';
        strengthText.textContent = 'Mật khẩu khá';
    } else {
        strengthFill.style.background = '#27ae60';
        strengthText.textContent = 'Mật khẩu mạnh';
    }
}

// ==========================================
// XỬ LÝ ĐỔI MẬT KHẨU
// ==========================================
async function changePassword() {
    const currentPassword = document.getElementById('current-password').value;
    const newPassword = document.getElementById('new-password').value;
    const confirmPassword = document.getElementById('confirm-password').value;

    // 1. Kiểm tra nhập liệu cơ bản
    if (!currentPassword || !newPassword || !confirmPassword) {
        alert('Vui lòng nhập đầy đủ thông tin!');
        return;
    }

    if (newPassword !== confirmPassword) {
        alert('Mật khẩu mới và Xác nhận mật khẩu không khớp!');
        return;
    }

    if (newPassword.length < 6) {
        alert('Mật khẩu mới phải có ít nhất 6 ký tự!');
        return;
    }

    // 2. Gửi dữ liệu lên API
    try {
        // Có thể đổi style nút thành "Đang xử lý..." để tăng trải nghiệm người dùng
        const btn = document.querySelector('.save-password-btn');
        const originalText = btn.textContent;
        btn.textContent = 'Đang xử lý...';
        btn.disabled = true;

        const response = await fetch('/api/change-password', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                currentPassword: currentPassword, 
                newPassword: newPassword 
            })
        });

        const result = await response.json();

        // Trả lại trạng thái nút
        btn.textContent = originalText;
        btn.disabled = false;

        // 3. Xử lý kết quả trả về
        if (result.success) {
            alert('Đổi mật khẩu thành công! Bạn vui lòng đăng nhập lại.');
            
            // Xóa trắng form
            document.getElementById('current-password').value = '';
            document.getElementById('new-password').value = '';
            document.getElementById('confirm-password').value = '';
            
            // Ép người dùng đăng xuất để đăng nhập bằng MK mới
            window.location.href = '/logout'; 
        } else {
            alert('Lỗi: ' + result.message);
        }

    } catch (err) {
        console.error(err);
        alert('Lỗi kết nối đến máy chủ!');
    }
}

// Setup 2FA
function setup2FA() {
    alert('Tính năng xác thực 2 lớp sẽ được kích hoạt');
}


// Hàm hỗ trợ format ngày từ SQL sang dạng YYYY-MM-DD để hiển thị trên input type="date"
function formatDateForInput(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toISOString().split('T')[0];
}

// 1. MỞ MODAL VÀ TẠO FORM ĐỘNG
function openEditModal(type) {
    const modal = document.getElementById('editModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalForm = document.getElementById('modalForm');
    
    let formHtml = '';

    if (type === 'basic') {
        modalTitle.textContent = "Chỉnh sửa thông tin cơ bản";
        formHtml = `
            <div class="form-group"><label>Họ và tên</label><input type="text" id="edit_HoTen" value="${currentUserInfo.HoTen || ''}"></div>
            <div class="form-group"><label>Ngày sinh</label><input type="date" id="edit_NgaySinh" value="${formatDateForInput(currentUserInfo.NgaySinh)}"></div>
            <div class="form-group"><label>Giới tính</label>
                <select id="edit_GioiTinh" style="width: 100%; padding: 10px; border: 1px solid #ddd; border-radius: 8px;">
                    <option value="Nam" ${currentUserInfo.GioiTinh === 'Nam' ? 'selected' : ''}>Nam</option>
                    <option value="Nữ" ${currentUserInfo.GioiTinh === 'Nữ' ? 'selected' : ''}>Nữ</option>
                </select>
            </div>
            <div class="form-group"><label>Nơi sinh (Quê quán)</label><input type="text" id="edit_QueQuan" value="${currentUserInfo.QueQuan || ''}"></div>
            <div class="form-group"><label>Dân tộc</label><input type="text" id="edit_DanToc" value="${currentUserInfo.DanToc || ''}"></div>
            <div class="form-group"><label>Tôn giáo</label><input type="text" id="edit_TonGiao" value="${currentUserInfo.TonGiao || ''}"></div>
        `;
    } 
    else if (type === 'address') {
        modalTitle.textContent = "Chỉnh sửa địa chỉ liên hệ";
        formHtml = `
            <div class="form-group"><label>Địa chỉ thường trú</label><input type="text" id="edit_DiaChi" value="${currentUserInfo.DiaChi_ThuongTru || ''}"></div>
            <div class="form-group"><label>Số điện thoại</label><input type="text" id="edit_SDT" value="${currentUserInfo.SoDienThoai || ''}"></div>
            <div class="form-group"><label>Email cá nhân</label><input type="email" id="edit_Email" value="${currentUserInfo.Email_CaNhan || ''}"></div>
        `;
    }
    else if (type === 'id') {
        modalTitle.textContent = "Chỉnh sửa CMND/CCCD";
        formHtml = `
            <div class="form-group"><label>Số CCCD</label><input type="text" id="edit_CCCD" value="${currentUserInfo.CCCD || ''}"></div>
            <div class="form-group"><label>Ngày cấp</label><input type="date" id="edit_NgayCap" value="${formatDateForInput(currentUserInfo.NgayCapCCCD)}"></div>
            <div class="form-group"><label>Nơi cấp</label><input type="text" id="edit_NoiCap" value="${currentUserInfo.NoiCapCCCD || ''}"></div>
            <div class="form-group"><label>Ngày hết hạn</label><input type="date" id="edit_NgayHetHan" value="${formatDateForInput(currentUserInfo.NgayHetHanCCCD)}"></div>
        `;
    }

    else if (type === 'bank') {
        modalTitle.textContent = "Chỉnh sửa thông tin nhận lương";
        formHtml = `
            <div class="form-group"><label>Tên ngân hàng</label><input type="text" id="edit_TenNganHang" value="${currentUserInfo.TenNganHang || ''}"></div>
            <div class="form-group"><label>Chi nhánh</label><input type="text" id="edit_ChiNhanh" value="${currentUserInfo.ChiNhanhNganHang || ''}"></div>
            <div class="form-group"><label>Số tài khoản</label><input type="text" id="edit_SoTaiKhoan" value="${currentUserInfo.SoTaiKhoan || ''}"></div>
            <div class="form-group"><label>Tên người thụ hưởng</label><input type="text" id="edit_ChuTaiKhoan" value="${currentUserInfo.ChuTaiKhoan || ''}"></div>
            <div class="form-group"><label>Mã số thuế</label><input type="text" id="edit_MaSoThue" value="${currentUserInfo.MaSoThue || ''}"></div>
        `;
    }
    
    formHtml += `<button class="save-btn" style="width:100%; padding:12px; background:#8e44ad; color:white; border:none; border-radius:8px; cursor:pointer;" onclick="saveProfileData('${type}')">Lưu thay đổi</button>`;
    modalForm.innerHTML = formHtml;
    
    modal.classList.add('active');
}

function closeModal() {
    document.getElementById('editModal').classList.remove('active');
}

// 2. LƯU DỮ LIỆU LÊN SERVER
async function saveProfileData(type) {
    let data = {};

    if (type === 'basic') {
        data = {
            HoTen: document.getElementById('edit_HoTen').value,
            NgaySinh: document.getElementById('edit_NgaySinh').value,
            GioiTinh: document.getElementById('edit_GioiTinh').value,
            QueQuan: document.getElementById('edit_QueQuan').value,
            DanToc: document.getElementById('edit_DanToc').value,
            TonGiao: document.getElementById('edit_TonGiao').value,
        };
    } else if (type === 'address') {
        data = {
            DiaChi: document.getElementById('edit_DiaChi').value,
            SDT: document.getElementById('edit_SDT').value,
            Email: document.getElementById('edit_Email').value,
        };
    } else if (type === 'id') {
        data = {
            CCCD: document.getElementById('edit_CCCD').value,
            NgayCap: document.getElementById('edit_NgayCap').value,
            NoiCap: document.getElementById('edit_NoiCap').value,
            NgayHetHan: document.getElementById('edit_NgayHetHan').value,
        };
    }

    else if (type === 'bank') {
        data = {
            TenNganHang: document.getElementById('edit_TenNganHang').value,
            ChiNhanh: document.getElementById('edit_ChiNhanh').value,
            SoTaiKhoan: document.getElementById('edit_SoTaiKhoan').value,
            ChuTaiKhoan: document.getElementById('edit_ChuTaiKhoan').value,
            MaSoThue: document.getElementById('edit_MaSoThue').value,
        };
    }
    try {
        const response = await fetch('/api/update-profile', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ type: type, data: data })
        });
        
        const result = await response.json();
        
        if (result.success) {
            alert('Cập nhật thông tin thành công!');
            closeModal();
            window.location.reload(); // Làm mới trang để hiện dữ liệu mới
        } else {
            alert('Lỗi: ' + result.message);
        }
    } catch (err) {
        console.error(err);
        alert('Lỗi kết nối đến máy chủ!');
    }
}


// ==========================================
// TẢI LÊN ẢNH ĐẠI DIỆN
// ==========================================
async function uploadAvatar(input) {
    if (input.files && input.files[0]) {
        const file = input.files[0];
        const formData = new FormData();
        formData.append('avatar', file); // 'avatar' là tên trường gửi lên server

        try {
            // Đổi icon thành đồng hồ cát để báo đang tải
            const btn = document.querySelector('.change-avatar-btn');
            btn.innerHTML = '⏳';

            const response = await fetch('/api/upload-avatar', {
                method: 'POST',
                body: formData // Gửi file dạng FormData (Không dùng JSON.stringify)
            });

            const result = await response.json();

            if (result.success) {
                // Cập nhật ngay ảnh mới lên giao diện mà không cần load lại trang
                const avatarContainer = document.getElementById('avatarPreviewContainer');
                avatarContainer.innerHTML = `<img src="${result.avatarUrl}" style="width: 100%; height: 100%; border-radius: 50%; object-fit: cover;">`;
            } else {
                alert('Lỗi: ' + result.message);
            }
        } catch (err) {
            console.error(err);
            alert('Lỗi kết nối máy chủ khi tải ảnh!');
        } finally {
            // Trả lại icon máy ảnh
            document.querySelector('.change-avatar-btn').innerHTML = '📷';
            input.value = ''; // Reset input để có thể chọn lại ảnh cũ nếu muốn
        }
    }
}

// Upload document
function uploadDocument() {
    alert('Chọn file để tải lên');
}

// Download document
function downloadDocument(type) {
    alert('Đang tải file: ' + type);
}

// Click outside modal to close
window.onclick = function(event) {
    const modal = document.getElementById('editModal');
    if (event.target === modal) {
        modal.classList.remove('active');
    }
}