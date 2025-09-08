// login.js - Chia ra 2 trường hợp dựa trên username và tên - Lan Anh vs userrname LanAnhT02 là admin
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm'); // Form desktop
    const mobileLoginForm = document.getElementById('mobileLoginForm'); // Form mobile

    // Hàm xử lý đăng nhập chung
    function handleLogin(e) {
        e.preventDefault();

        // Xác định input fields dựa trên form nào được submit
        let username, fullname;
        if (e.target === loginForm) {
            // Nếu là form desktop
            username = document.getElementById('username').value.trim();
            fullname = document.getElementById('fullname').value.trim();
        } else if (e.target === mobileLoginForm) {
            // Nếu là form mobile
            username = document.getElementById('mobileUsername').value.trim();
            fullname = document.getElementById('mobileFullname').value.trim();
        } else {
            
            console.error("Submitted form is neither loginForm nor mobileLoginForm");
            return;
        }

        // Kiểm tra độ dài username (tối thiểu 3 ký tự)
        if (username.length < 3) {
            alert('Username phải từ 3 ký tự!');
            return;
        }

        // Lưu thông tin vào localStorage
        const currentUser = {
            username: username,
            fullname: fullname
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Gửi thông tin kết nối lên backend
        sendConnectionInfo(currentUser);

        // Kiểm tra điều kiện chuyển hướng
        if (username === 'LanAnhT02' && fullname === 'Lan Anh') {
            // Chuyển hướng sang gui2 desktop
            window.location.href = 'gui2.html';
        } else {
            // Chuyển hướng sang gui1 (mobile)
            window.location.href = 'gui1.html';
        }
    }

    
    if (loginForm) {
        loginForm.addEventListener('submit', handleLogin);
    }
    if (mobileLoginForm) {
        mobileLoginForm.addEventListener('submit', handleLogin);
    }
});

// Hàm gửi thông tin kết nối lên backend
function sendConnectionInfo(user) {
    const backendUrl = getBackendUrl();
    const connectUrl = `${backendUrl}/api/player/connect`;

    fetch(connectUrl, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ user: user })
    })
    .then(response => {
        // Kiểm tra response.ok trước khi parse JSON
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
    })
    .then(data => {
        if (data.success) {
            console.log('✅ Đã gửi thông tin kết nối lên server');
        } else {
            console.warn('⚠️ Server response not successful:', data.message || 'Unknown reason');
        }
    })
    .catch(error => {
        console.error('❌ Lỗi khi gửi thông tin kết nối:', error);
    });
}

function getBackendUrl() {
    if (window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname === '0.0.0.0') {
        return 'http://localhost:3000';
    } else {
        
        return 'https://backend-3-229k.onrender.com';
        
    }
}
