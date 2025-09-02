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
    const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
    const resultsContainer = document.getElementById('resultsContainer');

    let playersPanelVisible = true;
    let isAnyResultFullscreen = false;
    let resultsUpdateInterval;

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
    startResultsUpdateInterval();

    function startResultsUpdateInterval() {
        if (resultsUpdateInterval) {
            clearInterval(resultsUpdateInterval);
        }
        resultsUpdateInterval = setInterval(loadResults, 2000);
    }

    function stopResultsUpdateInterval() {
        if (resultsUpdateInterval) {
            clearInterval(resultsUpdateInterval);
            resultsUpdateInterval = null;
        }
    }

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
            startGameBtn.disabled = false;
        });
    }

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
            endGameBtn.disabled = false;
        });
    }

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

    function loadResults() {
        if (isAnyResultFullscreen) {
            console.log("Có kết quả đang fullscreen, tạm dừng cập nhật.");
            return;
        }

        const backendUrl = getBackendUrl();
        const resultsUrl = `${backendUrl}/api/results`;
        const playersUrl = `${backendUrl}/api/players/connected`;

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

    function displayResults(results) {
        if (isAnyResultFullscreen) {
             console.log("Bỏ qua displayResults do có kết quả đang fullscreen.");
            return;
        }

        const noResultsMessage = document.getElementById('noResultsMessage');
        const resultsContent = document.getElementById('resultsContent');
        const playerCount = document.getElementById('playerCount');
        const resultsGrid = document.getElementById('resultsGrid');

        playerCount.textContent = results.length;

        if (results.length > 0) {
            noResultsMessage.classList.add('hidden');
            resultsContent.classList.remove('hidden');

            results.sort((a, b) => new Date(b.submittedAt) - new Date(a.submittedAt));

            const displayResults = results.slice(0, 20);

            resultsGrid.innerHTML = '';

            displayResults.forEach((result, index) => {
                const resultElement = document.createElement('div');
                // Thêm class 'clickable-result' và 'cursor-pointer' để tạo hiệu ứng
                resultElement.className = 'result-item p-2 rounded-lg bg-gray-700 border border-gray-600 relative clickable-result cursor-pointer';

                const headerHtml = `
                    <div class="flex justify-between items-start mb-1 flex-shrink-0">
                        <span class="font-medium text-white text-xs truncate">${result.user.fullname}</span>
                        <span class="text-xs text-gray-400 whitespace-nowrap">${new Date(result.submittedAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</span>
                    </div>
                `;

                const visualizationHtml = createVisualizationHtml(result.items);

                // Không cần nút phóng to riêng nữa
                // const expandBtnHtml = `<button class="expand-result-btn absolute top-1 right-1 text-gray-400 hover:text-white text-xs" title="Phóng to kết quả">⛶</button>`;

                resultElement.innerHTML = `
                    ${headerHtml}
                    <div class="result-content">
                        ${visualizationHtml}
                    </div>
                `;

                resultsGrid.appendChild(resultElement);

                // Gắn sự kiện click cho toàn bộ ô kết quả - ĐÃ CẬP NHẬT
                resultElement.addEventListener('click', function (event) {
                    // Kiểm tra xem click có phải trên nút "Quay lại" không
                    if (event.target.classList.contains('fullscreen-back-btn')) {
                        return;
                    }

                    // --- Thêm hiệu ứng thu phóng khi click ---
                    const originalTransition = this.style.transition; // Lưu transition gốc
                    this.style.transition = 'transform 0.2s ease'; // Đặt transition cho transform
                    this.style.transform = 'scale(0.95)'; // Thu nhỏ nhẹ khi click

                    // Sau một thời gian ngắn, mới thực hiện fullscreen và reset transform
                    setTimeout(() => {
                        this.style.transition = originalTransition; // Khôi phục transition gốc
                        this.style.transform = ''; // Reset transform
                        toggleResultFullscreen(resultElement); // Gọi hàm fullscreen
                    }, 150); // Thời gian ngắn để hiệu ứng hiện rõ
                    // ---
                });
            });

            const emptySlots = 20 - displayResults.length;
            for (let i = 0; i < emptySlots; i++) {
                const emptySlot = document.createElement('div');
                emptySlot.className = 'result-item p-2 rounded-lg bg-gray-800 border border-gray-700 flex items-center justify-center relative';
                emptySlot.innerHTML = `
                    <span class="text-gray-600 text-xs">Trống</span>
                `;
                resultsGrid.appendChild(emptySlot);
            }

        } else {
            noResultsMessage.classList.remove('hidden');
            resultsContent.classList.add('hidden');
        }
    }

    function createVisualizationHtml(itemsData) {
        const frenchItems = itemsData.french || [];
        const vietnamItems = itemsData.vietnam || [];
        const unassignedItems = itemsData.unassigned || [];

        function createItemsHtml(items, sectionClass) {
            if (!items.length) return '';
            return items.map(item => {
                const itemId = item.id || item;
                const itemText = item.text || item;
                const shortLabel = itemId.replace('item', '');
                const colors = {
                    'item1': 'bg-blue-500', 'item2': 'bg-green-500', 'item3': 'bg-red-500',
                    'item4': 'bg-yellow-500', 'item5': 'bg-purple-500', 'item6': 'bg-pink-500',
                    'item7': 'bg-indigo-500', 'item8': 'bg-teal-500', 'item9': 'bg-orange-500',
                    'item10': 'bg-cyan-500', 'item11': 'bg-lime-500', 'item12': 'bg-rose-500', 'item13': 'bg-amber-500'
                };
                const colorClass = colors[itemId] || 'bg-gray-500';
                return `<span class="viz-item ${colorClass}" title="${itemText}">${shortLabel}</span>`;
            }).join('');
        }

        const frenchItemsHtml = createItemsHtml(frenchItems, 'french');
        const vietnamItemsHtml = createItemsHtml(vietnamItems, 'vietnam');
        const unassignedItemsHtml = createItemsHtml(unassignedItems, 'unassigned');

        return `
            <div class="visualization-container">
                <div class="viz-section french">
                    ${frenchItemsHtml}
                </div>
                <div class="viz-section vietnam">
                    ${vietnamItemsHtml}
                </div>
                <div class="viz-section unassigned">
                    ${unassignedItemsHtml}
                </div>
            </div>
        `;
    }

    function toggleResultFullscreen(resultElement) {
        const isFullscreen = resultElement.classList.contains('is-fullscreen');

        if (isFullscreen) {
            resultElement.classList.remove('is-fullscreen');
            const backButton = resultElement.querySelector('.fullscreen-back-btn');
            if (backButton) {
                backButton.remove();
            }
            isAnyResultFullscreen = false;
            startResultsUpdateInterval();

        } else {
            isAnyResultFullscreen = true;
            stopResultsUpdateInterval();
            resultElement.classList.add('is-fullscreen');

            const backButton = document.createElement('button');
            backButton.className = 'fullscreen-back-btn';
            backButton.textContent = '⬅️ Quay lại danh sách kết quả';
            backButton.title = 'Quay lại danh sách kết quả';

            backButton.style.cssText = `
                position: absolute;
                bottom: 20px;
                left: 50%;
                transform: translateX(-50%);
                background-color: rgba(239, 68, 68, 0.8);
                color: white;
                border: none;
                border-radius: 4px;
                padding: 8px 16px;
                cursor: pointer;
                font-size: 1rem;
                z-index: 10002;
            `;
            resultElement.appendChild(backButton);

            backButton.addEventListener('click', function () {
                toggleResultFullscreen(resultElement);
            });
        }
    }

    function toggleResultsFullscreen(containerElement) {
        const body = document.body;

        if (screenfull.isEnabled) {
            if (screenfull.isFullscreen && screenfull.element === containerElement) {
                screenfull.exit();
            } else {
                screenfull.request(containerElement);
            }
        } else {
            if (containerElement.classList.contains('is-fullscreen')) {
                containerElement.classList.remove('is-fullscreen');
                body.classList.remove('results-fullscreen-active');
            } else {
                body.classList.add('results-fullscreen-active');
                containerElement.classList.add('is-fullscreen');
            }
        }
    }

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

    function getBackendUrl() {
        if (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '0.0.0.0') {
            return 'http://localhost:3000';
        } else {
            // Chú ý: Có khoảng trắng thừa trong URL này trong mã gốc của bạn
            return 'https://gamedragndrop-backend.onrender.com';
        }
    }

    loadResults();

    window.addEventListener('beforeunload', function () {
        clearInterval(statusUpdateInterval);
        stopResultsUpdateInterval();
    });
});