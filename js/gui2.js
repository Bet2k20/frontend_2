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
    
    // Tự động cập nhật trạng thái game mỗi 3 giây
    const statusUpdateInterval = setInterval(checkGameStatus, 3000);
    
    // Tự động cập nhật kết quả và người chơi mỗi 2 giây
    const resultsUpdateInterval = setInterval(loadResults, 2000);

    // Hàm bắt đầu game
    function startGame() {
        const backendUrl = getBackendUrl();
        const startUrl = `${backendUrl}/api/game/start`;
        
        // Disable buttons tạm thời để tránh double click
        startGameBtn.disabled = true;
        endGameBtn.disabled = true;
        
        fetch(startUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: currentUser })
        })
        .then(response => {
             if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Lỗi không xác định'); });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showNotification('🎮 Game đã bắt đầu!', 'success');
                checkGameStatus(); // Cập nhật ngay lập tức trạng thái UI
                loadResults(); // Cập nhật ngay lập tức kết quả
            } else {
                showNotification(`❌ ${data.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Lỗi khi bắt đầu game:', error);
            showNotification(`⚠️ ${error.message || 'Không thể kết nối server!'}`, 'error');
        })
        .finally(() => {
             // Re-enable buttons
            startGameBtn.disabled = false;
            // endGameBtn sẽ được enable/disable bởi checkGameStatus
        });
    }

    // Hàm kết thúc game
    function endGame() {
        if (!confirm('Bạn có chắc chắn muốn kết thúc game?')) {
            return;
        }
        
        const backendUrl = getBackendUrl();
        const endUrl = `${backendUrl}/api/game/end`;
        
        // Disable buttons tạm thời
        startGameBtn.disabled = true;
        endGameBtn.disabled = true;
        
        fetch(endUrl, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ user: currentUser })
        })
        .then(response => {
             if (!response.ok) {
                return response.json().then(err => { throw new Error(err.message || 'Lỗi không xác định'); });
            }
            return response.json();
        })
        .then(data => {
            if (data.success) {
                showNotification('🏁 Game đã kết thúc!', 'success');
                checkGameStatus(); // Cập nhật ngay lập tức trạng thái UI
                loadResults(); // Cập nhật ngay lập tức kết quả
            } else {
                showNotification(`❌ ${data.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Lỗi khi kết thúc game:', error);
            showNotification(`⚠️ ${error.message || 'Không thể kết nối server!'}`, 'error');
        })
        .finally(() => {
             // Re-enable buttons
            endGameBtn.disabled = false;
            // startGameBtn sẽ được enable/disable bởi checkGameStatus
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
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    const session = data.session;
                    const statusElement = document.getElementById('gameStatus');
                    
                    if (session.isActive) {
                        statusElement.innerHTML = `
                            <div class="text-green-400 font-medium flex justify-center items-center">
                                <span class="mr-2">🎮</span> Game đang hoạt động
                            </div>
                            <div class="text-gray-300 text-sm mt-1 text-center">Bắt đầu: ${new Date(session.startTime).toLocaleString('vi-VN')}</div>
                        `;
                        startGameBtn.disabled = true;
                        endGameBtn.disabled = false;
                    } else {
                        statusElement.innerHTML = `
                            <div class="text-yellow-400 font-medium flex justify-center items-center">
                                <span class="mr-2">⏸️</span> Game chưa bắt đầu
                            </div>
                            <div class="text-gray-300 text-sm mt-1 text-center">Hãy nhấn "Bắt đầu Game" để bắt đầu</div>
                        `;
                        startGameBtn.disabled = false;
                        endGameBtn.disabled = true;
                    }
                }
            })
            .catch(error => {
                console.error('Lỗi khi kiểm tra trạng thái game:', error);
                document.getElementById('gameStatus').innerHTML = 
                    '<div class="text-red-400 flex justify-center items-center"><span class="mr-2">⚠️</span> Không thể kết nối server!</div>';
                // Disable buttons nếu không kết nối được
                startGameBtn.disabled = true;
                endGameBtn.disabled = true;
            });
    }

    // Hàm load kết quả và cập nhật người chơi
    function loadResults() {
        const backendUrl = getBackendUrl();
        const resultsUrl = `${backendUrl}/api/results`;
        const playersUrl = `${backendUrl}/api/players/connected`;
        
        let resultsLoaded = false;
        let playersLoaded = false;

        // Load kết quả game
        fetch(resultsUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    displayResults(data.results);
                }
                resultsLoaded = true;
            })
            .catch(error => {
                console.error('Lỗi khi load kết quả:', error);
                resultsLoaded = true; // Đánh dấu là đã thử load, tránh chờ mãi
            });

        // Load danh sách người chơi
        fetch(playersUrl)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    updateConnectedPlayersDisplay(data.players);
                }
                playersLoaded = true;
            })
            .catch(error => {
                console.error('Lỗi khi load danh sách người chơi:', error);
                playersLoaded = true; // Đánh dấu là đã thử load, tránh chờ mãi
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
            
            // Sắp xếp người chơi theo tên (tùy chọn)
            players.sort((a, b) => a.fullname.localeCompare(b.fullname));
            
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
            
            results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));
            
            const displayResults = results.slice(0, 100);
            
            resultsList.innerHTML = '';
            displayResults.forEach((result, index) => {
                const resultElement = document.createElement('div');
                resultElement.className = 'result-item p-3 rounded-lg bg-gray-700 border border-gray-600';

                let frenchItemsHtml = '';
                let vietnamItemsHtml = '';
                let unassignedItemsHtml = ''; // Biến mới cho unassigned
                
                // Xử lý dữ liệu items (mới có unassigned)
                if (result.items && typeof result.items === 'object') {
                    // Dữ liệu mới: object {french: [...], vietnam: [...], unassigned: [...]}
                    if (result.items.french && Array.isArray(result.items.french)) {
                        result.items.french.forEach(item => {
                            const itemId = item.id || item;
                            const itemText = item.text || item;
                            const colors = {
                                'item1': 'bg-blue-500', 'item2': 'bg-green-500', 'item3': 'bg-red-500',
                                'item4': 'bg-yellow-500', 'item5': 'bg-purple-500', 'item6': 'bg-pink-500',
                                'item7': 'bg-indigo-500', 'item8': 'bg-teal-500', 'item9': 'bg-orange-500',
                                'item10': 'bg-cyan-500', 'item11': 'bg-lime-500', 'item12': 'bg-rose-500', 'item13': 'bg-amber-500'
                            };
                            const colorClass = colors[itemId] || 'bg-gray-500';
                            frenchItemsHtml += `<span class="inline-block ${colorClass} text-white text-xs px-2 py-1 rounded mr-1 mb-1">${itemText}</span>`;
                        });
                    }
                    if (result.items.vietnam && Array.isArray(result.items.vietnam)) {
                        result.items.vietnam.forEach(item => {
                            const itemId = item.id || item;
                            const itemText = item.text || item;
                            const colors = {
                                'item1': 'bg-blue-500', 'item2': 'bg-green-500', 'item3': 'bg-red-500',
                                'item4': 'bg-yellow-500', 'item5': 'bg-purple-500', 'item6': 'bg-pink-500',
                                'item7': 'bg-indigo-500', 'item8': 'bg-teal-500', 'item9': 'bg-orange-500',
                                'item10': 'bg-cyan-500', 'item11': 'bg-lime-500', 'item12': 'bg-rose-500', 'item13': 'bg-amber-500'
                            };
                            const colorClass = colors[itemId] || 'bg-gray-500';
                            vietnamItemsHtml += `<span class="inline-block ${colorClass} text-white text-xs px-2 py-1 rounded mr-1 mb-1">${itemText}</span>`;
                        });
                    }
                    // Xử lý unassigned items
                    if (result.items.unassigned && Array.isArray(result.items.unassigned)) {
                        result.items.unassigned.forEach(item => {
                            const itemId = item.id || item;
                            const itemText = item.text || item;
                            const colors = {
                                'item1': 'bg-blue-500', 'item2': 'bg-green-500', 'item3': 'bg-red-500',
                                'item4': 'bg-yellow-500', 'item5': 'bg-purple-500', 'item6': 'bg-pink-500',
                                'item7': 'bg-indigo-500', 'item8': 'bg-teal-500', 'item9': 'bg-orange-500',
                                'item10': 'bg-cyan-500', 'item11': 'bg-lime-500', 'item12': 'bg-rose-500', 'item13': 'bg-amber-500'
                            };
                            const colorClass = colors[itemId] || 'bg-gray-500';
                            unassignedItemsHtml += `<span class="inline-block ${colorClass} text-white text-xs px-2 py-1 rounded mr-1 mb-1">${itemText}</span>`;
                        });
                    }
                }

                // Tạo HTML cho từng phần
                let itemsSection = '';
                if (frenchItemsHtml) {
                    itemsSection += `
                        <div class="mt-2">
                            <div class="text-xs font-semibold text-red-300 mb-1">Pháp:</div>
                            <div>${frenchItemsHtml}</div>
                        </div>`;
                }
                if (vietnamItemsHtml) {
                    itemsSection += `
                        <div class="mt-2">
                            <div class="text-xs font-semibold text-green-300 mb-1">Việt Nam:</div>
                            <div>${vietnamItemsHtml}</div>
                        </div>`;
                }
                // Thêm phần hiển thị unassigned
                if (unassignedItemsHtml) {
                    itemsSection += `
                        <div class="mt-2">
                            <div class="text-xs font-semibold text-gray-300 mb-1">Chưa phân loại:</div>
                            <div>${unassignedItemsHtml}</div>
                        </div>`;
                }
                
                if (!itemsSection) {
                    itemsSection = '<div class="text-gray-400 text-sm mt-2">Không có sự kiện được phân loại</div>';
                }

                resultElement.innerHTML = `
                    <div class="flex justify-between items-start mb-2">
                        <span class="font-medium text-white text-sm truncate">${result.user.fullname}</span>
                        <span class="text-xs text-gray-400 whitespace-nowrap">${new Date(result.submittedAt).toLocaleTimeString('vi-VN')}</span>
                    </div>
                    ${itemsSection}
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
            return 'https://gamedragndrop-backend.onrender.com'; // Thay bằng URL thật của bạn
        }
    }

    // Gọi loadResults ban đầu
    loadResults();

    // Dọn dẹp intervals khi người dùng rời khỏi trang
    window.addEventListener('beforeunload', function() {
        clearInterval(statusUpdateInterval);
        clearInterval(resultsUpdateInterval);
    });
});