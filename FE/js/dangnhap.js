// Toggle password visibility
function togglePassword() {
    const passwordInput = document.getElementById('password');
    const toggleBtn = document.querySelector('.toggle-password');
    
    if(passwordInput.type === 'password') {
        passwordInput.type = 'text';
        toggleBtn.textContent = '🙈';
    } else {
        passwordInput.type = 'password';
        toggleBtn.textContent = '👁️';
    }
}

// Show error message
function showError(message) {
    const errorDiv = document.getElementById('errorMessage');
    const errorText = document.getElementById('errorText');
    errorText.textContent = message;
    errorDiv.classList.add('show');
    
    // Auto hide after 3 seconds
    setTimeout(() => {
        errorDiv.classList.remove('show');
    }, 3000);
}

// Clear error message
function clearError() {
    document.getElementById('errorMessage').classList.remove('show');
}

// Validate inputs
function validateInputs() {
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    
    if(!username) {
        showError('Vui lòng nhập mã nhân viên hoặc email');
        document.getElementById('username').focus();
        return false;
    }
    
    if(!password) {
        showError('Vui lòng nhập mật khẩu');
        document.getElementById('password').focus();
        return false;
    }
    
    return true;
}

// Handle login
async function handleLogin() {
    clearError();
    if(!validateInputs()) return;
    
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const rememberMe = document.getElementById('rememberMe').checked;
    
    const loginBtn = document.getElementById('loginBtn');
    loginBtn.classList.add('loading');
    loginBtn.textContent = 'Đang xử lý...'; 
    
    try {
        // GỌI XUỐNG BACKEND (authroute.js)
        const response = await fetch('/api/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();

        loginBtn.classList.remove('loading');
        loginBtn.textContent = 'Đăng nhập';

        if (data.success) {
            if(rememberMe) localStorage.setItem('rememberedUser', username);
            else localStorage.removeItem('rememberedUser');
            
            const successModal = document.getElementById('successModal');
            successModal.classList.add('active');
            
            // Đã cập nhật: Phân luồng Admin và Nhân viên
            setTimeout(() => {
                if (data.role === 'Admin') {
                    window.location.href = '/admin'; // Admin về trang quản trị
                } else {
                    window.location.href = '/trangchu'; // Nhân viên về trang chủ
                }
            }, 1500);
        } else {
            showError(data.message);
        }



    } catch (error) {
        loginBtn.classList.remove('loading');
        loginBtn.textContent = 'Đăng nhập';
        showError('Lỗi kết nối máy chủ!');
    }
}

// Forgot password
function forgotPassword() {
    document.getElementById('forgotModal').classList.add('active');
}

// Close modal
function closeModal() {
    document.getElementById('forgotModal').classList.remove('active');
    document.getElementById('successModal').classList.remove('active');
}

// Load remembered user
function loadRememberedUser() {
    const rememberedUser = localStorage.getItem('rememberedUser');
    if(rememberedUser) {
        document.getElementById('username').value = rememberedUser;
        document.getElementById('rememberMe').checked = true;
        document.getElementById('password').focus();
    }
}

// Enter key to submit
document.addEventListener('keypress', function(event) {
    if(event.key === 'Enter') {
        const loginBtn = document.getElementById('loginBtn');
        if(loginBtn && !loginBtn.classList.contains('loading')) {
            handleLogin();
        }
    }
});

// Clear error when typing
document.getElementById('username').addEventListener('input', clearError);
document.getElementById('password').addEventListener('input', clearError);

// Load remembered user on page load
loadRememberedUser();

// Focus on username input on load
if(!document.getElementById('username').value) {
    document.getElementById('username').focus();
}

// Click outside modal to close
window.onclick = function(event) {
    const forgotModal = document.getElementById('forgotModal');
    const successModal = document.getElementById('successModal');
    if(event.target === forgotModal) {
        forgotModal.classList.remove('active');
    }
    if(event.target === successModal) {
        successModal.classList.remove('active');
    }
}