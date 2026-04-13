// Handle logout (ĐÃ SỬA LẠI ĐỂ ĐĂNG XUẤT THẬT)
function handleLogout() {
    if(confirm('Bạn có chắc chắn muốn đăng xuất?')) {
        window.location.href = '/logout'; // Chuyển hướng về route /logout trên server để xóa session
    }
}

// Search training
function searchTraining() {
    alert('Đang tìm kiếm tài liệu...');
}

// View all categories
function viewAllCategories() {
    alert('Xem tất cả danh mục');
}

// Select category from grid
function selectCategory(category) {
    alert('Đã chọn danh mục: ' + category);
}

// Filter category in sidebar
function filterCategory(element, category) {
    document.querySelectorAll('.category-item').forEach(item => {
        item.classList.remove('active');
    });
    element.classList.add('active');
    alert('Lọc danh mục: ' + category);
}

// Sort documents
function sortDocuments(select) {
    alert('Sắp xếp: ' + select.value);
}

// View document
function viewDocument(id) {
    document.getElementById('documentModal').classList.add('active');
}

// Download document
function downloadDocument(id, event) {
    event.stopPropagation();
    alert('Đang tải tài liệu #' + id);
}

// Close modal
function closeModal() {
    document.getElementById('documentModal').classList.remove('active');
}

// View document full
function viewDocumentFull() {
    alert('Mở xem tài liệu');
}

// Download current document
function downloadCurrentDocument() {
    alert('Đang tải tài liệu...');
}

// Play video
function playVideo(id) {
    alert('Đang mở video #' + id);
}

// View all videos
function viewAllVideos() {
    alert('Xem tất cả video');
}

// Continue learning
function continueLearning(id) {
    alert('Tiếp tục khóa học #' + id);
}

// Start course
function startCourse(id) {
    alert('Bắt đầu khóa học #' + id);
}

// View all courses
function viewAllCourses() {
    alert('Xem tất cả khóa học');
}

// Click outside modal to close
window.onclick = function(event) {
    const modal = document.getElementById('documentModal');
    if (event.target === modal) {
        modal.classList.remove('active');
    }
}
