// login.js - Chia ra 2 trường hợp dựa trên username và tên
document.addEventListener('DOMContentLoaded', function() {
    const loginForm = document.getElementById('loginForm');
    
    loginForm.addEventListener('submit', function(e) {
        e.preventDefault();
        
        const username = document.getElementById('username').value.trim();
        const fullname = document.getElementById('fullname').value.trim();
        
        // Kiểm tra độ dài username (tối thiểu 3 ký tự)
        if (username.length < 3) {
            alert('Username phải từ 3 ký tự!');
            return;
        }
        
        // Lưu thông tin vào localStorage -- trường hợp tự reload trang -- nhưng cũng sẽ có trường hợp đăng nhập vào sau đó treo ở đó thì các lần tiếp theo sẽ vận còn user đó, ko biết có nên bắt đk này hay không?
        const currentUser = {
            username: username,
            fullname: fullname
        };
        localStorage.setItem('currentUser', JSON.stringify(currentUser));
        
        // Gửi thông tin kết nối lên backend
        sendConnectionInfo(currentUser);
        
        // Kiểm tra điều kiện chuyển hướng
        if (username === 'LanAnhT02' && fullname === 'Lan Anh') {
            // Chuyển hướng sang gui2 destop
            window.location.href = 'gui2.html';
        } else {
            // Chuyển hướng sang gui1 (mobile); vì sửa trên pc nên vẫn có giao diện cho pc nè hehehe
            window.location.href = 'gui1.html';
        }
    });
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
    .then(response => response.json())
    .then(data => {
        if (data.success) {
            console.log('✅ Đã gửi thông tin kết nối lên server');
        }
    })
    .catch(error => {
        console.error('Lỗi khi gửi thông tin kết nối:', error);
    });
}


function getBackendUrl() {
    
    if (window.location.hostname === 'localhost' || 
        window.location.hostname === '127.0.0.1' || 
        window.location.hostname === '0.0.0.0') {
        return 'http://localhost:3000';
    } 
   
    else {
        return 'https://gamedragndrop-backend.onrender.com';
    }
}