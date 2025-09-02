// gui2.js - giao diện quản lý cho LanAnhT02
document.addEventListener('DOMContentLoaded', function () {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('userInfo').textContent =
            `Xin chào ${currentUser.fullname} (${currentUser.username}) - Quản trị viên`;
    }

    const startGameBtn = document.getElementById('startGameBtn');
    const endGameBtn = document.getElementById('endGameBtn');
    const togglePlayersBtn = document.getElementById('togglePlayersBtn');
    const gameStatus = document.getElementById('gameStatus');
    const playersPanel = document.getElementById('playersPanel');
    const resultsPanel = document.getElementById('resultsPanel');
    // Element cho nút fullscreen chung
    const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
    // Element cho container kết quả để fullscreen
    const resultsContainer = document.getElementById('resultsContainer');

    let playersPanelVisible = true;

    // Gắn sự kiện cho nút fullscreen chung
    if (fullscreenToggleBtn && resultsContainer) {
        fullscreenToggleBtn.addEventListener('click', function () {
            toggleResultsFullscreen(resultsContainer);
        });
    }

    startGameBtn.addEventListener('click', startGame);
    endGameBtn.addEventListener('click', endGame);
    togglePlayersBtn.addEventListener('click', togglePlayersPanel);

    checkGameStatus();
    const statusUpdateInterval = setInterval(checkGameStatus, 3000);
    const resultsUpdateInterval = setInterval(loadResults, 2000);

    // Hàm bắt đầu game
    function startGame() {
        const backendUrl = getBackendUrl();
        const startUrl = `${backendUrl}/api/game/start`;

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
                checkGameStatus();
            } else {
                showNotification(`❌ ${data.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Lỗi khi bắt đầu game:', error);
            showNotification(`⚠️ ${error.message || 'Không thể kết nối server!'}`, 'error');
        })
        .finally(() => {
            // startGameBtn sẽ được enable/disable bởi checkGameStatus
        });
    }

    // Hàm kết thúc game
    function endGame() {
        if (!confirm('Bạn có chắc chắn muốn kết thúc game?')) {
            return;
        }

        const backendUrl = getBackendUrl();
        const endUrl = `${backendUrl}/api/game/end`;

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
                checkGameStatus();
            } else {
                showNotification(`❌ ${data.message}`, 'error');
            }
        })
        .catch(error => {
            console.error('Lỗi khi kết thúc game:', error);
            showNotification(`⚠️ ${error.message || 'Không thể kết nối server!'}`, 'error');
        })
        .finally(() => {
            // endGameBtn sẽ được enable/disable bởi checkGameStatus
        });
    }

    // Hàm ẩn/hiện panel người chơi
    function togglePlayersPanel() {
        if (playersPanelVisible) {
            playersPanel.style.width = '0';
            playersPanel.style.minWidth = '0';
            playersPanel.style.padding = '0';
            playersPanel.style.border = 'none';
            resultsPanel.classList.add('w-full');
            togglePlayersBtn.innerHTML = '👥 Hiện Người chơi';
        } else {
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
                startGameBtn.disabled = true;
                endGameBtn.disabled = true;
            });
    }

    // Hàm load kết quả và cập nhật người chơi
    function loadResults() {
        const backendUrl = getBackendUrl();
        const resultsUrl = `${backendUrl}/api/results`;
        const playersUrl = `${backendUrl}/api/players/connected`;

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
            })
            .catch(error => {
                console.error('Lỗi khi load kết quả:', error);
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

    // Hàm hiển thị kết quả trong grid 5x4 cố định
    function displayResults(results) {
        const noResultsMessage = document.getElementById('noResultsMessage');
        const resultsContent = document.getElementById('resultsContent');
        const playerCount = document.getElementById('playerCount');
        const resultsGrid = document.getElementById('resultsGrid');

        playerCount.textContent = results.length;

        if (results.length > 0) {
            noResultsMessage.classList.add('hidden');
            resultsContent.classList.remove('hidden');

            // Sắp xếp theo thời gian gửi (mới nhất trước)
            results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

            // Giới hạn số lượng kết quả hiển thị (tối đa 20)
            const displayResults = results.slice(0, 20);

            resultsGrid.innerHTML = ''; // Xóa nội dung cũ

            displayResults.forEach((result, index) => {
                const resultElement = document.createElement('div');
                resultElement.className = 'result-item p-2 rounded-lg bg-gray-700 border border-gray-600';

                let frenchItemsHtml = '';
                let vietnamItemsHtml = '';
                let unassignedItemsHtml = '';

                // Xử lý dữ liệu items
                if (result.items && typeof result.items === 'object') {
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
                            frenchItemsHtml += `<span class="inline-block ${colorClass} text-white text-xs px-1 py-0.5 rounded mr-1 mb-1">${itemText}</span>`;
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
                            vietnamItemsHtml += `<span class="inline-block ${colorClass} text-white text-xs px-1 py-0.5 rounded mr-1 mb-1">${itemText}</span>`;
                        });
                    }
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
                            unassignedItemsHtml += `<span class="inline-block ${colorClass} text-white text-xs px-1 py-0.5 rounded mr-1 mb-1">${itemText}</span>`;
                        });
                    }
                }

                // Tạo HTML cho từng phần
                let itemsSection = '';
                if (frenchItemsHtml) {
                    itemsSection += `
                        <div class="mt-1">
                            <div class="text-xs font-semibold text-red-300 mb-0.5">Pháp:</div>
                            <div>${frenchItemsHtml}</div>
                        </div>`;
                }
                if (vietnamItemsHtml) {
                    itemsSection += `
                        <div class="mt-1">
                            <div class="text-xs font-semibold text-green-300 mb-0.5">Việt Nam:</div>
                            <div>${vietnamItemsHtml}</div>
                        </div>`;
                }
                if (unassignedItemsHtml) {
                    itemsSection += `
                        <div class="mt-1">
                            <div class="text-xs font-semibold text-gray-300 mb-0.5">Chưa phân loại:</div>
                            <div>${unassignedItemsHtml}</div>
                        </div>`;
                }

                if (!itemsSection) {
                    itemsSection = '<div class="text-gray-400 text-xs mt-1">Không có sự kiện</div>';
                }

                // Tạo tiêu đề cho ô kết quả
                const headerHtml = `
                    <div class="flex justify-between items-start mb-1 flex-shrink-0">
                        <span class="font-medium text-white text-xs truncate">${result.user.fullname}</span>
                        <span class="text-xs text-gray-400 whitespace-nowrap">${new Date(result.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                `;

                resultElement.innerHTML = `
                    ${headerHtml}
                    <div class="result-content">
                        ${itemsSection}
                    </div>
                `;

                resultsGrid.appendChild(resultElement);
            });

            // Nếu số kết quả ít hơn 20, thêm các ô trống để giữ cấu trúc grid
            const emptySlots = 20 - displayResults.length;
            for (let i = 0; i < emptySlots; i++) {
                const emptySlot = document.createElement('div');
                emptySlot.className = 'result-item p-2 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center';
                emptySlot.innerHTML = `<span class="text-gray-600 text-xs">Trống</span>`;
                resultsGrid.appendChild(emptySlot);
            }

        } else {
            noResultsMessage.classList.remove('hidden');
            resultsContent.classList.add('hidden');
        }
    }

    // Hàm toggle fullscreen cho phần container kết quả
    function toggleResultsFullscreen(containerElement) {
        const body = document.body;

        if (screenfull.isEnabled) {
            // Sử dụng thư viện screenfull nếu có
            if (screenfull.isFullscreen && screenfull.element === containerElement) {
                screenfull.exit();
            } else {
                screenfull.request(containerElement);
            }
        } else {
            // Fallback nếu trình duyệt không hỗ trợ screenfull
            if (containerElement.classList.contains('is-fullscreen')) {
                // Thoát fullscreen
                containerElement.classList.remove('is-fullscreen');
                body.classList.remove('results-fullscreen-active');
            } else {
                // Vào fullscreen
                body.classList.add('results-fullscreen-active');
                containerElement.classList.add('is-fullscreen');
            }
        }
    }

    // Hàm hiển thị thông báo
    function showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `fixed top-4 right-4 p-4 rounded-lg shadow-lg z-50 max-w-md ${
            type === 'success' ? 'bg-green-600' :
            type === 'error' ? 'bg-red-600' : 'bg-blue-600'
        } text-white`;
        notification.textContent = message;

        document.body.appendChild(notification);

        setTimeout(() => {
            if (notification.parentNode) {
                notification.parentNode.removeChild(notification);
            }
        }, 3000);
    }

    // Hàm xác định URL backend dựa trên môi trường
    function getBackendUrl() {
        if (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '0.0.0.0') {
            return 'http://localhost:3000';
        } else {
            return 'https://gamedragndrop-backend.onrender.com'; // Thay bằng URL thật của bạn
        }
    }

    // Gọi loadResults ban đầu
    loadResults();

    // Dọn dẹp intervals khi người dùng rời khỏi trang
    window.addEventListener('beforeunload', function () {
        clearInterval(statusUpdateInterval);
        clearInterval(resultsUpdateInterval);
    });
});