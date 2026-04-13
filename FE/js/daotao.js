// ==========================================
// 1. CÁC HÀM TẢI DỮ LIỆU TỪ SERVER (API)
// ==========================================

// Tải danh sách danh mục
async function loadCategories() {
    try {
        const response = await fetch('/api/training/categories');
        const result = await response.json();

        if (result.success) {
            const categories = result.data;
            const totalItems = categories.reduce((sum, cat) => sum + cat.SoLuong, 0);

            const sidebarList = document.getElementById('sidebarCategoryList');
            const mainGrid = document.querySelector('.categories-grid');

            // HTML cho Sidebar
            let sidebarHtml = `
                <li class="category-item active" onclick="filterCategory(this, 'all')">
                    <span>📋</span> Tất cả
                    <span class="count">${totalItems}</span>
                </li>
            `;

            // HTML cho Grid thẻ to ở giữa
            let gridHtml = '';

            categories.forEach(cat => {
                sidebarHtml += `
                    <li class="category-item" onclick="filterCategory(this, '${cat.Slug}')">
                        <span>${cat.Icon || '📁'}</span> ${cat.TenDanhMuc}
                        <span class="count">${cat.SoLuong}</span>
                    </li>
                `;

                gridHtml += `
                    <div class="category-card" onclick="selectCategory('${cat.Slug}')">
                        <div class="category-icon">${cat.Icon || '📁'}</div>
                        <h3>${cat.TenDanhMuc}</h3>
                        <p>${cat.MoTa || ''}</p>
                        <div class="document-count">${cat.SoLuong} tài liệu</div>
                    </div>
                `;
            });

            if (sidebarList) sidebarList.innerHTML = sidebarHtml;
            if (mainGrid) mainGrid.innerHTML = gridHtml;
        }
    } catch (error) {
        console.error("Lỗi fetch danh mục:", error);
    }
}

// Tải danh sách tài liệu / video theo danh mục
async function loadTrainingData(category = 'all') {
    try {
        const response = await fetch(`/api/training/items?category=${category}`);
        const result = await response.json();

        if (result.success) {
            renderContent(result.data);
        }
    } catch (error) {
        console.error("Lỗi fetch dữ liệu:", error);
    }
}

// Hiển thị dữ liệu lên giao diện (Render)
function renderContent(items) {
    const docGrid = document.querySelector('.documents-grid');
    const videoGrid = document.querySelector('.video-grid');

    const documents = items.filter(item => item.LoaiHinh !== 'Video');
    const videos = items.filter(item => item.LoaiHinh === 'Video');

    // 1. Hiển thị Tài liệu
    if (documents.length > 0) {
        docGrid.innerHTML = documents.map(doc => `
            <div class="document-card" onclick="viewDocument(${doc.MaKhoaHoc})">
                <div class="document-icon">${doc.LoaiHinh === 'PDF' ? '📄' : '📝'}</div>
                <div class="document-info">
                    <h4>${doc.TenKhoaHoc}</h4>
                    <p>${doc.MoTa || ''}</p>
                    <div class="document-meta">
                        <span>📅 ${new Date(doc.NgayDang).toLocaleDateString('vi-VN')}</span>
                        <span>👁️ ${doc.LuotXem || 0} lượt xem</span>
                    </div>
                </div>
                <button class="download-btn" onclick="downloadDocument(${doc.MaKhoaHoc}, event)">📥</button>
            </div>
        `).join('');
    } else {
        docGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #7f8c8d;">Chưa có tài liệu nào trong mục này.</p>';
    }

    // 2. Hiển thị Video
    if (videos.length > 0) {
        videoGrid.innerHTML = videos.map(v => `
            <div class="video-card" onclick="playVideo(${v.MaKhoaHoc})">
                <div class="video-thumbnail">▶️</div>
                <div class="video-info">
                    <h4>${v.TenKhoaHoc}</h4>
                    <p>${v.MoTa || ''}</p>
                    <div class="video-views">👁️ ${v.LuotXem || 0} lượt xem</div>
                </div>
            </div>
        `).join('');
    } else {
        videoGrid.innerHTML = '<p style="grid-column: 1/-1; text-align: center; padding: 20px; color: #7f8c8d;">Chưa có video hướng dẫn nào.</p>';
    }
}


// ==========================================
// 2. CÁC HÀM XỬ LÝ SỰ KIỆN CLICK (LỌC DANH MỤC)
// ==========================================

// Lọc khi nhấn ở Sidebar bên trái
function filterCategory(element, category) {
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
    
    loadTrainingData(category);
}

// Lọc khi nhấn ở Card to giữa trang
function selectCategory(category) {
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
        if(item.getAttribute('onclick').includes(`'${category}'`)) {
            item.classList.add('active');
        }
    });

    loadTrainingData(category);
}


// ==========================================
// 3. CÁC HÀM UI / TIỆN ÍCH KHÁC (ĐANG LÀM MẪU)
// ==========================================

function handleLogout() {
    if(confirm('Bạn có chắc chắn muốn đăng xuất?')) alert('Đã đăng xuất!');
}

function searchTraining() { alert('Đang tìm kiếm tài liệu...'); }
function viewAllCategories() { alert('Xem tất cả danh mục'); }
function sortDocuments(select) { alert('Sắp xếp: ' + select.value); }
function viewDocument(id) { document.getElementById('documentModal').classList.add('active'); }
function downloadDocument(id, event) { event.stopPropagation(); alert('Đang tải tài liệu #' + id); }
function closeModal() { document.getElementById('documentModal').classList.remove('active'); }
function viewDocumentFull() { alert('Mở xem tài liệu'); }
function downloadCurrentDocument() { alert('Đang tải tài liệu...'); }
function playVideo(id) { alert('Đang mở video #' + id); }
function viewAllVideos() { alert('Xem tất cả video'); }
function continueLearning(id) { alert('Tiếp tục khóa học #' + id); }
function startCourse(id) { alert('Bắt đầu khóa học #' + id); }
function viewAllCourses() { alert('Xem tất cả khóa học'); }

// Click bên ngoài để đóng modal
window.onclick = function(event) {
    const modal = document.getElementById('documentModal');
    if (event.target === modal) {
        modal.classList.remove('active');
    }
}


// ==========================================
// 4. KHỞI CHẠY KHI MỞ TRANG
// ==========================================
document.addEventListener('DOMContentLoaded', () => {
    loadCategories();       // Vẽ danh mục
    loadTrainingData('all');// Tải toàn bộ tài liệu
});