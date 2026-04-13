// Month selector
let currentMonth = 2; // 0 = January, 2 = March
const monthNames = ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 
                    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'];

function changeMonth(direction) {
    currentMonth += direction;
    
    // Giới hạn tháng từ 0 - 11
    if (currentMonth < 0) {
        currentMonth = 0;
        return;
    }
    if (currentMonth > 11) {
        currentMonth = 11;
        return;
    }
    
    const year = 2026; // Có thể lấy động bằng new Date().getFullYear()
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]}, ${year}`;
    
    // Kích hoạt load lại dữ liệu từ API
    loadAttendanceStats(currentMonth, year);
}

// Chạy ngay khi vừa load trang
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('currentMonth').textContent = `${monthNames[currentMonth]}, 2026`;
    loadAttendanceStats(currentMonth, 2026);
});

// Handle logout
function handleLogout() {
    if(confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        alert('Đã đăng xuất!');
    }
}

// Print salary
function printSalary() {
    alert('Đang chuẩn bị in bảng lương...');
}

// Download payslip
function downloadPayslip(month) {
    alert(`Đang tải bảng lương tháng ${month}`);
}

// History tabs
document.querySelectorAll('.history-tab').forEach(tab => {
    tab.addEventListener('click', function() {
        document.querySelectorAll('.history-tab').forEach(t => t.classList.remove('active'));
        this.classList.add('active');
        alert(`Hiển thị lịch sử: ${this.textContent}`);
    });
});
// Hàm tải thống kê chuyên cần từ API
async function loadAttendanceStats(month, year) {
    try {
        // Cập nhật text hiển thị tháng trên giao diện
        const titleElement = document.getElementById('statMonthTitle');
        if (titleElement) titleElement.textContent = `${month + 1}/${year}`;

        // Gọi API: month + 1 vì JS (0-11) còn SQL/API cần (1-12)
        const response = await fetch(`/api/thunhap/stats?month=${month + 1}&year=${year}`);
        const result = await response.json();

        if (result.success && result.data) {
            const stats = result.data;
            // Gán dữ liệu vào các thẻ HTML thông qua ID
            document.getElementById('statTotalDays').textContent = stats.TongNgay || 0;
            document.getElementById('statOnTime').textContent   = stats.DungGio || 0;
            document.getElementById('statLate').textContent     = stats.DiTre || 0;
            document.getElementById('statOvertime').textContent = stats.TangCa || 0;
        } else {
            resetStatsToZero();
        }
    } catch (error) {
        console.error("Lỗi khi tải thống kê:", error);
        resetStatsToZero();
    }
}

// Hàm reset khi không có dữ liệu hoặc lỗi
function resetStatsToZero() {
    ['statTotalDays', 'statOnTime', 'statLate', 'statOvertime'].forEach(id => {
        const el = document.getElementById(id);
        if (el) el.textContent = 0;
    });
}