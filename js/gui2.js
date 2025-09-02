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
    const gameInterfacePanel = document.getElementById('gameInterfacePanel'); // Thêm
    const fullscreenToggleBtn = document.getElementById('fullscreenToggleBtn');
    const resultsContainer = document.getElementById('resultsContainer');
    const showResultsBtn = document.getElementById('showResultsBtn'); // Thêm

    // Biến để theo dõi trạng thái ẩn/hiện của playersPanel
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
    
    // Thêm sự kiện cho nút Show đáp án
    if (showResultsBtn) {
        showResultsBtn.addEventListener('click', showResultsPanel);
    }

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
                // --- Hiệu ứng chuyển panel với transition ---
                switchPanelWithTransition(resultsPanel, gameInterfacePanel);
                // ----------------------------------
                // --- Hiển thị nút Show đáp án khi game bắt đầu ---
                if (showResultsBtn) {
                    showResultsBtn.classList.remove('hidden');
                }
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
                // --- Hiệu ứng chuyển panel với transition ---
                switchPanelWithTransition(gameInterfacePanel, resultsPanel);
                // ---------------------------------
                // --- Ẩn nút Show đáp án khi game kết thúc ---
                if (showResultsBtn) {
                    showResultsBtn.classList.add('hidden');
                }
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
        // Xác định panel kết quả nào đang hiển thị
        const isGameInterfaceVisible = !gameInterfacePanel.classList.contains('hidden');
        const isResultsPanelVisible = !resultsPanel.classList.contains('hidden');
        const targetPanel = isGameInterfaceVisible ? gameInterfacePanel : (isResultsPanelVisible ? resultsPanel : null);

        if (playersPanelVisible) {
            // --- Ẩn playersPanel bằng cách thêm class ---
            playersPanel.classList.add('hidden-panel');
            
            // Mở rộng panel kết quả để lấp đầy không gian
            if (targetPanel) {
                targetPanel.classList.add('w-full');
            }
            
            togglePlayersBtn.innerHTML = '👥 Hiện Người chơi';
        } else {
            // --- Hiện playersPanel bằng cách xóa class ---
            playersPanel.classList.remove('hidden-panel');
            
            // Thu hẹp panel kết quả về kích thước ban đầu
            if (targetPanel) {
                targetPanel.classList.remove('w-full');
            }
            
            togglePlayersBtn.innerHTML = '👥 Ẩn Người chơi';
        }
        playersPanelVisible = !playersPanelVisible;
    }


    // --- Thêm/cập nhật hàm mới để hiển thị panel kết quả với hiệu ứng ---
    function showResultsPanel(event) {
        // --- Hiệu ứng cho nút "Show đáp án" ---
        const button = event ? event.currentTarget : showResultsBtn; // Lấy nút được click
        if (button) {
            const originalTransition = button.style.transition;
            button.style.transition = 'transform 0.2s ease'; // Thêm transition nếu chưa có
            button.style.transform = 'scale(0.95)'; // Thu nhỏ nút

            // Sau một thời gian ngắn, mới thực hiện chuyển panel và reset nút
            setTimeout(() => {
                button.style.transition = originalTransition; // Khôi phục transition gốc
                button.style.transform = ''; // Reset transform

                // --- Hiệu ứng chuyển panel với transition ---
                switchPanelWithTransition(gameInterfacePanel, resultsPanel);
                // ---------------------------------
            }, 150); // Thời gian nên <= transition time
        } else {
            // Nếu không có event, thực hiện ngay
            switchPanelWithTransition(gameInterfacePanel, resultsPanel);
        }
    }
    // ----------------------------------------------
    // ----------------------------------------------

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
                        // --- Hiển thị nút Show đáp án nếu game đang chạy ---
                        if (showResultsBtn) {
                            showResultsBtn.classList.remove('hidden');
                        }
                    } else {
                        statusElement.innerHTML = `
                            <div class="text-yellow-400 font-medium flex justify-center items-center">
                                <span class="mr-2">⏸️</span> Game chưa bắt đầu
                            </div>
                            <div class="text-gray-300 text-sm mt-1 text-center">Hãy nhấn "Bắt đầu Game" để bắt đầu</div>
                        `;
                        startGameBtn.disabled = false;
                        endGameBtn.disabled = true;
                        // --- Đảm bảo hiển thị đúng panel khi game chưa bắt đầu ---
                        // Chỉ ẩn gameInterfacePanel và hiện lại resultsPanel nếu cần
                        if (!gameInterfacePanel.classList.contains('hidden')) {
                            gameInterfacePanel.classList.add('hidden');
                            resultsPanel.classList.remove('hidden');
                        }
                        // --- Ẩn nút Show đáp án khi game chưa bắt đầu ---
                        if (showResultsBtn) {
                            showResultsBtn.classList.add('hidden');
                        }
                        // playersPanel không bị thay đổi ở đây
                        // --------------------------------------------------------
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

                // --- Gắn sự kiện click để hiệu ứng thu nhỏ ---
                resultElement.addEventListener('click', function (event) {
                    // --- Hiệu ứng thu nhỏ khi click (giữ nguyên) ---
                    const originalTransition = this.style.transition;
                    this.style.transition = 'transform 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)';
                    this.style.transform = 'scale(0.92)';

                    // Sau một thời gian ngắn, mới reset transform
                    setTimeout(() => {
                        this.style.transition = originalTransition;
                        this.style.transform = '';
                        // Không làm gì thêm, chỉ hiệu ứng
                    }, 300); // Thời gian chờ nên >= thời gian transition (0.3s = 300ms)
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

        // --- Thêm hàm tiện ích để chuyển panel với hiệu ứng ---
    function switchPanelWithTransition(panelToHide, panelToShow) {
        if (!panelToHide || !panelToShow) return;

        // Đảm bảo panelToShow được thêm class panel-transition nếu chưa có
        panelToShow.classList.add('panel-transition');

        // 1. Đánh dấu panel ẩn sẽ bắt đầu thoát
        panelToHide.classList.add('panel-exiting');

        // 2. Sau một thời gian ngắn (phải <= thời gian transition CSS), ẩn panelToHide và chuẩn bị panelToShow
        setTimeout(() => {
            panelToHide.classList.add('hidden');
            panelToHide.classList.remove('panel-exiting'); // Reset class thoát

            // 3. Chuẩn bị panelToShow để vào (ẩn và đặt vị trí ban đầu)
            panelToShow.classList.remove('hidden');
            panelToShow.classList.add('panel-entering'); // Thêm class bắt đầu vào

            // 4. Kích hoạt reflow để trình duyệt nhận class panel-entering
            // Reflow: https://stackoverflow.com/a/24195559
            void panelToShow.offsetWidth; // Trick force reflow

            // 5. Sau một frame rất ngắn, thêm class panel-entered để kích hoạt hiệu ứng
            requestAnimationFrame(() => {
                panelToShow.classList.remove('panel-entering');
                panelToShow.classList.add('panel-entered');
            });
        }, 300); // 300ms = thời gian transition trong CSS

        // 6. Sau khi hiệu ứng hoàn tất, dọn dẹp class
        setTimeout(() => {
            panelToShow.classList.remove('panel-entered', 'panel-transition');
            // Không loại bỏ panel-transition khỏi panelToShow vì có thể dùng lại
        }, 600); // 600ms = 2 * thời gian transition
    }
    // ----------------------------------------------
    

    loadResults();

    window.addEventListener('beforeunload', function () {
        clearInterval(statusUpdateInterval);
        stopResultsUpdateInterval();
    });
});