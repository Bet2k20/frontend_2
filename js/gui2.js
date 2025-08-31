// gui2.js - giao diện quản lý cho LanAnhT02
document.addEventListener('DOMContentLoaded', function() {
    // Hiển thị thông tin người dùng
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('userInfo').textContent = 
            `Xin chào ${currentUser.fullname} (${currentUser.username}) - Quản trị viên`;
    }

    // Các elements
    const startGameBtn = document.getElementById('startGameBtn');
    const endGameBtn = document.getElementById('endGameBtn');
    const togglePlayersBtn = document.getElementById('togglePlayersBtn');
    const gameStatus = document.getElementById('gameStatus');
    const playersPanel = document.getElementById('playersPanel');
    const resultsPanel = document.getElementById('resultsPanel');

    // Trạng thái panel người chơi
    let playersPanelVisible = true;

    // Event listeners
    startGameBtn.addEventListener('click', startGame);
    endGameBtn.addEventListener('click', endGame);
    togglePlayersBtn.addEventListener('click', togglePlayersPanel);

    // Kiểm tra trạng thái game ban đầu
    checkGameStatus();
    
    // Tự động cập nhật trạng thái mỗi 3 giây
    setInterval(checkGameStatus, 3000);
    setInterval(loadResults, 3000); // Cập nhật kết quả thường xuyên

    // Hàm bắt đầu game
    function startGame() {
        const backendUrl = getBackendUrl();
        const startUrl = `${backendUrl}/api/game/start`;
        
        fetch(startUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: currentUser })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('🎮 Game đã bắt đầu!', 'success');
                checkGameStatus();
                loadResults();
                
                // Tự động ẩn panel người chơi khi bắt đầu game
                if (playersPanelVisible) {
                    togglePlayersPanel();
                }
            } else {
                showNotification(`❌ ${data.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Lỗi khi bắt đầu game:', error);
            showNotification('⚠️ Không thể kết nối server!', 'error');
        });
    }

    // Hàm kết thúc game
    function endGame() {
        if (!confirm('Bạn có chắc chắn muốn kết thúc game?')) {
            return;
        }
        
        const backendUrl = getBackendUrl();
        const endUrl = `${backendUrl}/api/game/end`;
        
        fetch(endUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: currentUser })
        })
        .then(response => response.json())
        .then(data => {
            if (data.success) {
                showNotification('🏁 Game đã kết thúc!', 'success');
                checkGameStatus();
                loadResults();
            } else {
                showNotification(`❌ ${data.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Lỗi khi kết thúc game:', error);
            showNotification('⚠️ Không thể kết nối server!', 'error');
        });
    }

    // Hàm ẩn/hiện panel người chơi
    function togglePlayersPanel() {
        if (playersPanelVisible) {
            // Ẩn panel người chơi
            playersPanel.style.width = '0';
            playersPanel.style.minWidth = '0';
            playersPanel.style.padding = '0';
            playersPanel.style.border = 'none';
            resultsPanel.classList.add('w-full');
            togglePlayersBtn.innerHTML = '👥 Hiện Người chơi';
        } else {
            // Hiện panel người chơi
            playersPanel.style.width = '';
            playersPanel.style.minWidth = '';
            playersPanel.style.padding = '';
            playersPanel.style.borderLeft = '1px solid #374151';
            resultsPanel.classList.remove('w-full');
            togglePlayersBtn.innerHTML = '👥 Ẩn Người chơi';
        }
        playersPanelVisible = !playersPanelVisible;
    }

    // Hàm kiểm tra trạng thái game
    function checkGameStatus() {
        const backendUrl = getBackendUrl();
        const statusUrl = `${backendUrl}/api/game/status`;
        
        fetch(statusUrl)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    const session = data.session;
                    const statusElement = document.getElementById('gameStatus');
                    
                    if (session.isActive) {
                        statusElement.innerHTML = `
                            <div class="text-green-400 font-medium">🎮 Game đang hoạt động</div>
                            <div class="text-gray-300 text-sm mt-1">Bắt đầu: ${new Date(session.startTime).toLocaleString('vi-VN')}</div>
                        `;
                        startGameBtn.disabled = true;
                        endGameBtn.disabled = false;
                    } else {
                        statusElement.innerHTML = `
                            <div class="text-yellow-400 font-medium">⏸️ Game chưa bắt đầu</div>
                            <div class="text-gray-300 text-sm mt-1">Hãy nhấn "Bắt đầu Game" để bắt đầu</div>
                        `;
                        startGameBtn.disabled = false;
                        endGameBtn.disabled = true;
                    }
                }
            })
            .catch(error => {
                console.error('Lỗi khi kiểm tra trạng thái game:', error);
                document.getElementById('gameStatus').innerHTML = 
                    '<div class="text-red-400">⚠️ Không thể kết nối server!</div>';
            });
    }

    // Hàm load kết quả và cập nhật người chơi
    function loadResults() {
        const backendUrl = getBackendUrl();
        const resultsUrl = `${backendUrl}/api/results`;
        const playersUrl = `${backendUrl}/api/players/connected`;
        
        // Load kết quả
        fetch(resultsUrl)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    displayResults(data.results);
                }
            })
            .catch(error => {
                console.error('Lỗi khi load kết quả:', error);
            });
        
        // Load danh sách người chơi
        fetch(playersUrl)
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    updateConnectedPlayersDisplay(data.players);
                }
            })
            .catch(error => {
                console.error('Lỗi khi load danh sách người chơi:', error);
            });
    }

    // Hàm cập nhật hiển thị người chơi
    function updateConnectedPlayersDisplay(players) {
        const playersList = document.getElementById('playersList');
        const noPlayersMessage = document.getElementById('noPlayersMessage');
        const connectedCount = document.getElementById('connectedCount');

        connectedCount.textContent = players.length;

        if (players.length > 0) {
            noPlayersMessage.classList.add('hidden');
            playersList.classList.remove('hidden');
            
            playersList.innerHTML = '';
            players.forEach(player => {
                const playerElement = document.createElement('div');
                playerElement.className = 'p-2 bg-gray-700 rounded-lg border border-gray-600';
                playerElement.innerHTML = `
                    <div class="font-medium text-sm truncate">${player.fullname}</div>
                    <div class="text-xs text-gray-400 truncate">(${player.username})</div>
                `;
                playersList.appendChild(playerElement);
            });
        } else {
            noPlayersMessage.classList.remove('hidden');
            playersList.classList.add('hidden');
        }
    }

    // Hàm hiển thị kết quả
    function displayResults(results) {
        const noResultsMessage = document.getElementById('noResultsMessage');
        const resultsContent = document.getElementById('resultsContent');
        const playerCount = document.getElementById('playerCount');
        const resultsList = document.getElementById('resultsList');

        playerCount.textContent = results.length;

        if (results.length > 0) {
            noResultsMessage.classList.add('hidden');
            resultsContent.classList.remove('hidden');
            
            // Sắp xếp theo thời gian gửi (mới nhất trước)
            results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            
            // Hiển thị danh sách (giới hạn 50 kết quả để tránh lag)
            const displayResults = results.slice(0, 50);
            
            resultsList.innerHTML = '';
            displayResults.forEach((result, index) => {
                const resultElement = document.createElement('div');
                resultElement.className = 'p-3 rounded-lg bg-gray-700 border border-gray-600';
                
                let itemsHtml = '';
                result.items.forEach(item => {
                    const colors = {
                        'item1': 'bg-blue-500',
                        'item2': 'bg-green-500',
                        'item3': 'bg-red-500',
                        'item4': 'bg-yellow-500',
                        'item5': 'bg-purple-500',
                        'item6': 'bg-pink-500'
                    };
                    const colorClass = colors[item.id] || 'bg-gray-500';
                    
                    itemsHtml += `
                        <span class="inline-block ${colorClass} text-white text-xs px-2 py-1 rounded mr-1 mb-1">
                            ${item.id}
                        </span>
                    `;
                });
                
                resultElement.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-medium text-white text-sm truncate">${result.user.fullname}</span>
                        <span class="text-xs text-gray-400 whitespace-nowrap">${new Date(result.submittedAt).toLocaleTimeString('vi-VN')}</span>
                    </div>
                    <div class="mt-1">
                        ${itemsHtml}
                    </div>
                `;
                
                resultsList.appendChild(resultElement);
            });
        } else {
            noResultsMessage.classList.remove('hidden');
            resultsContent.classList.add('hidden');
        }
    }

    // Hàm hiển thị thông báo
    function showNotification(message, type = 'info') {
        // Tạo element thông báo
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md ${
            type === 'success' ? 'bg-green-600' : 
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white`;
        notification.textContent = message;
        
        // Thêm vào body
        document.body.appendChild(notification);
        
        // Tự động xóa sau 3 giây
        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
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

    // Gọi loadResults ban đầu
    loadResults();
});