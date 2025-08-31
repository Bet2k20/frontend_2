// gui1.js - cập nhật phần kiểm tra trạng thái game
document.addEventListener('DOMContentLoaded', function() {
    // Hiển thị thông tin người dùng
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('userInfo').textContent = 
            `Xin chào ${currentUser.fullname} (${currentUser.username})`;
    }

    // Kiểm tra trạng thái game trước khi cho chơi
    checkGameStatus();

    // Logic kéo thả (giữ nguyên)
    const draggables = document.querySelectorAll('.draggable');
    const dropZone = document.getElementById('dropZone');
    const dropArea = document.getElementById('dropArea');
    const submitBtn = document.getElementById('submitBtn');

    let draggedItems = [];

    // Thêm event listeners cho các phần tử có thể kéo
    draggables.forEach(draggable => {
        draggable.addEventListener('dragstart', function(e) {
            e.dataTransfer.setData('text/plain', this.dataset.item);
            this.classList.add('opacity-50');
        });

        draggable.addEventListener('dragend', function() {
            this.classList.remove('opacity-50');
        });
    });

    // Cho phép thả
    dropZone.addEventListener('dragover', function(e) {
        e.preventDefault();
        this.classList.add('bg-blue-900');
    });

    dropZone.addEventListener('dragleave', function() {
        this.classList.remove('bg-blue-900');
    });

    // Xử lý thả
    dropZone.addEventListener('drop', function(e) {
        e.preventDefault();
        this.classList.remove('bg-blue-900');
        
        const itemId = e.dataTransfer.getData('text/plain');
        const itemElement = document.querySelector(`[data-item="${itemId}"]`);
        
        if (itemElement && !document.querySelector(`#dropArea [data-item="${itemId}"]`)) {
            const clonedItem = itemElement.cloneNode(true);
            clonedItem.classList.remove('draggable');
            clonedItem.classList.add('m-2');
            clonedItem.setAttribute('style', 'position: relative;');
            
            // Thêm vị trí ngẫu nhiên để tạo hiệu ứng thả
            const rect = dropArea.getBoundingClientRect();
            const x = Math.random() * (rect.width - 100);
            const y = Math.random() * (rect.height - 50);
            clonedItem.style.left = x + 'px';
            clonedItem.style.top = y + 'px';
            
            dropArea.appendChild(clonedItem);
            
            // Lưu thông tin vị trí
            draggedItems.push({
                id: itemId,
                x: x,
                y: y
            });
        }
    });

    // Xử lý submit - cập nhật để kiểm tra trạng thái game
    submitBtn.addEventListener('click', function() {
        // Kiểm tra lại trạng thái game
        checkGameStatusBeforeSubmit();
    });

    // Hàm kiểm tra trạng thái game
    function checkGameStatus() {
        const backendUrl = getBackendUrl();
        const statusUrl = `${backendUrl}/api/game/status`;
        
        fetch(statusUrl)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.session.isActive) {
                    // Game đang active, cho phép chơi
                    enableGameInterface();
                } else {
                    // Game chưa bắt đầu hoặc đã kết thúc
                    disableGameInterface('🎮 Game chưa bắt đầu hoặc đã kết thúc!');
                }
            })
            .catch(error => {
                console.error('Lỗi khi kiểm tra trạng thái game:', error);
                disableGameInterface('⚠️ Không thể kết nối đến server!');
            });
    }

    // Hàm kiểm tra trước khi submit
    function checkGameStatusBeforeSubmit() {
        const backendUrl = getBackendUrl();
        const statusUrl = `${backendUrl}/api/game/status`;
        
        fetch(statusUrl)
            .then(response => response.json())
            .then(data => {
                if (data.success && data.session.isActive) {
                    // Game còn active, cho phép submit
                    if (draggedItems.length > 0) {
                        const gameData = {
                            user: currentUser,
                            items: draggedItems,
                            timestamp: new Date().toISOString()
                        };
                        sendToBackend(gameData);
                    } else {
                        alert('Vui lòng kéo ít nhất 1 đối tượng vào khu vực thả!');
                    }
                } else {
                    alert('🎮 Game đã kết thúc!');
                    disableGameInterface('🎮 Game đã kết thúc!');
                }
            })
            .catch(error => {
                console.error('Lỗi khi kiểm tra trạng thái game:', error);
                alert('⚠️ Không thể kết nối đến server!');
            });
    }

    // Hàm bật giao diện game
    function enableGameInterface() {
        const dropZone = document.getElementById('dropZone');
        const submitBtn = document.getElementById('submitBtn');
        
        if (dropZone) dropZone.classList.remove('opacity-50', 'pointer-events-none');
        if (submitBtn) submitBtn.disabled = false;
        if (submitBtn) submitBtn.classList.remove('opacity-50');
    }

    // Hàm tắt giao diện game
    function disableGameInterface(message) {
        const dropZone = document.getElementById('dropZone');
        const submitBtn = document.getElementById('submitBtn');
        const userInfo = document.getElementById('userInfo');
        
        if (dropZone) dropZone.classList.add('opacity-50', 'pointer-events-none');
        if (submitBtn) submitBtn.disabled = true;
        if (submitBtn) submitBtn.classList.add('opacity-50');
        if (userInfo) userInfo.innerHTML += `<br><span class="text-red-400">${message}</span>`;
    }

    // Hàm gửi dữ liệu lên backend
    function sendToBackend(gameData) {
        const backendUrl = getBackendUrl();
        const resultsUrl = `${backendUrl}/api/results`;
        
        fetch(resultsUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify(gameData)
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                alert('✅ Đã gửi kết quả thành công!');
                // Reset drag items
                draggedItems = [];
                dropArea.innerHTML = '';
            } else {
                alert(`❌ ${data.message}`);
            }
        })
        .catch(error => {
            console.error('Lỗi khi gửi dữ liệu:', error);
            alert('⚠️ Không thể kết nối server!');
        });
    }

    // Hàm xác định URL backend dựa trên môi trường
    function getBackendUrl() {
        // Nếu đang chạy local (localhost)
        if (window.location.hostname === 'localhost' || 
            window.location.hostname === '127.0.0.1' || 
            window.location.hostname === '0.0.0.0') {
            return 'http://localhost:3000';
        } 
        // Nếu đang chạy trên web (production)
        else {
            return 'https://gamedragndrop-backend.onrender.com';
        }
    }
});