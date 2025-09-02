document.addEventListener('DOMContentLoaded', function () {
    const currentUser = JSON.parse(localStorage.getItem('currentUser'));
    if (currentUser) {
        document.getElementById('userInfo').innerHTML =
            `<span class="font-medium">Xin chào ${currentUser.fullname}</span> <span class="text-gray-400">(${currentUser.username})</span>`;
    }

    checkGameStatus();
    const statusCheckInterval = setInterval(checkGameStatus, 1000);

    const draggablesContainer = document.getElementById('draggablesContainer');
    const dropZone1 = document.getElementById('dropZone1');
    const dropZone2 = document.getElementById('dropZone2');
    const submitBtn = document.getElementById('submitBtn');
    const gameStatusInfo = document.getElementById('gameStatusInfo');

    let draggedElement = null;
    let draggedElementOriginalParent = null;
    let initialX, initialY, currentX, currentY;
    let offsetX, offsetY;

    let draggedItems = {
        french: [],
        vietnam: [],
        unassigned: []
    };

    function getItemsInDropZone(dropZone) {
        return Array.from(dropZone.querySelectorAll('.draggable:not(.placeholder)'));
    }

    function updateDraggedItemsState() {
        draggedItems.french = getItemsInDropZone(dropZone1).map(el => ({
            id: el.dataset.item,
            text: el.textContent.trim()
        }));
        draggedItems.vietnam = getItemsInDropZone(dropZone2).map(el => ({
            id: el.dataset.item,
            text: el.textContent.trim()
        }));
        draggedItems.unassigned = Array.from(draggablesContainer.children)
            .filter(el => el.classList.contains('draggable') && !el.classList.contains('placeholder'))
            .map(el => ({
                id: el.dataset.item,
                text: el.textContent.trim()
            }));
    }

    function dragStart(e) {
        if (!isGameActive) return;

        draggedElement = this;
        draggedElementOriginalParent = draggedElement.parentNode;

        draggedElement.classList.add('dragging');

        const rect = draggedElement.getBoundingClientRect();
        if (e.type === 'mousedown') {
            initialX = e.clientX;
            initialY = e.clientY;
        } else if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX;
            initialY = e.touches[0].clientY;
        }
        offsetX = initialX - rect.left;
        offsetY = initialY - rect.top;

        e.preventDefault();
    }

    function drag(e) {
        if (!draggedElement) return;

        if (e.type === 'mousemove') {
            currentX = e.clientX;
            currentY = e.clientY;
        } else if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
            e.preventDefault();
        }

        const containerRect = draggablesContainer.getBoundingClientRect();
        let newX = currentX - containerRect.left - offsetX;
        let newY = currentY - containerRect.top - offsetY;

        draggedElement.style.left = `${newX}px`;
        draggedElement.style.top = `${newY}px`;
        draggedElement.classList.add('moving');
    }

    function dragEnd(e) {
        if (!draggedElement) return;

        draggedElement.classList.remove('dragging', 'moving');
        draggedElement.style.left = '';
        draggedElement.style.top = '';
        draggedElement.style.position = '';

        let dropTarget = null;
        if (e.type === 'mouseup') {
            dropTarget = document.elementFromPoint(e.clientX, e.clientY);
        } else if (e.type === 'touchend') {
            const touch = e.changedTouches[0];
            dropTarget = document.elementFromPoint(touch.clientX, touch.clientY);
        }

        let targetDropZone = null;
        if (dropTarget) {
            targetDropZone = dropTarget.closest('.drop-zone');
        }

        if (targetDropZone) {
            if (targetDropZone !== draggedElementOriginalParent) {
                if (draggedElementOriginalParent.classList.contains('drop-zone')) {
                    draggedElementOriginalParent.removeChild(draggedElement);
                }
                const placeholder = targetDropZone.querySelector('.placeholder');
                if (placeholder) {
                    targetDropZone.removeChild(placeholder);
                }
                targetDropZone.appendChild(draggedElement);
            }
        } else {
            if (!draggedElementOriginalParent.classList.contains('drop-zone')) {
            } else {
                draggablesContainer.appendChild(draggedElement);
            }
        }

        updateDraggedItemsState();
        draggedElement = null;
        draggedElementOriginalParent = null;
    }

    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        draggable.addEventListener('mousedown', dragStart);
        draggable.addEventListener('touchstart', dragStart, { passive: false });
    });

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);

    function handleDragOverZones(e) {
        if (!draggedElement) return;
        const x = e.type === 'mousemove' ? e.clientX : e.touches[0].clientX;
        const y = e.type === 'mousemove' ? e.clientY : e.touches[0].clientY;
        const elementUnderCursor = document.elementFromPoint(x, y);

        dropZone1.classList.remove('active');
        dropZone2.classList.remove('active');

        const targetZone = elementUnderCursor?.closest('.drop-zone');
        if (targetZone) {
            targetZone.classList.add('active');
        }
    }

    document.addEventListener('mousemove', handleDragOverZones);
    document.addEventListener('touchmove', handleDragOverZones);

    function clearDragOverZones() {
        dropZone1.classList.remove('active');
        dropZone2.classList.remove('active');
    }

    document.addEventListener('mouseup', clearDragOverZones);
    document.addEventListener('touchend', clearDragOverZones);

    let isGameActive = false;

    submitBtn.addEventListener('click', function () {
        if (!isGameActive) {
            alert('🎮 Game chưa bắt đầu hoặc đã kết thúc!');
            return;
        }
        checkGameStatusBeforeSubmit();
    });

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
                if (data.success && data.session.isActive) {
                    isGameActive = true;
                    enableGameInterface();
                    if (gameStatusInfo) {
                        gameStatusInfo.textContent = '🎮 Game đang hoạt động';
                        gameStatusInfo.className = 'text-center md:text-right text-sm text-green-400';
                    }
                } else {
                    isGameActive = false;
                    disableGameInterface('🎮 Game chưa bắt đầu hoặc đã kết thúc!');
                    if (gameStatusInfo) {
                        gameStatusInfo.textContent = '⏸️ Game chưa bắt đầu hoặc đã kết thúc';
                        gameStatusInfo.className = 'text-center md:text-right text-sm text-yellow-400';
                    }
                }
            })
            .catch(error => {
                console.error('Lỗi khi kiểm tra trạng thái game:', error);
                isGameActive = false;
                if (gameStatusInfo) {
                    gameStatusInfo.textContent = '⚠️ Lỗi kết nối server';
                    gameStatusInfo.className = 'text-center md:text-right text-sm text-red-400';
                }
            });
    }

    function checkGameStatusBeforeSubmit() {
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
                if (data.success && data.session.isActive) {
                    updateDraggedItemsState();
                    const totalDroppedOrAssigned = draggedItems.french.length + draggedItems.vietnam.length + draggedItems.unassigned.length;
                    if (totalDroppedOrAssigned > 0) {
                        const gameData = {
                            user: currentUser,
                            items: {
                                french: draggedItems.french,
                                vietnam: draggedItems.vietnam,
                                unassigned: draggedItems.unassigned
                            },
                            timestamp: new Date().toISOString()
                        };
                        sendToBackend(gameData);
                    } else {
                        alert('Không có sự kiện nào để gửi!');
                    }
                } else {
                    alert('🎮 Game đã kết thúc!');
                    isGameActive = false;
                    disableGameInterface('🎮 Game đã kết thúc!');
                    if (gameStatusInfo) {
                        gameStatusInfo.textContent = '🏁 Game đã kết thúc';
                        gameStatusInfo.className = 'text-center md:text-right text-sm text-red-400';
                    }
                }
            })
            .catch(error => {
                console.error('Lỗi khi kiểm tra trạng thái game trước submit:', error);
                alert('⚠️ Không thể kết nối đến server!');
            });
    }

    function enableGameInterface() {
        const dropZones = document.querySelectorAll('.drop-zone');
        const submitBtn = document.getElementById('submitBtn');

        dropZones.forEach(zone => {
            zone.classList.remove('opacity-50', 'pointer-events-none');
        });
        if (submitBtn) submitBtn.disabled = false;
    }

    function disableGameInterface(message) {
        const dropZones = document.querySelectorAll('.drop-zone');
        const submitBtn = document.getElementById('submitBtn');
        const userInfo = document.getElementById('userInfo');

        dropZones.forEach(zone => {
            zone.classList.add('opacity-50', 'pointer-events-none');
        });
        if (submitBtn) submitBtn.disabled = true;

        if (userInfo && message) {
            const currentHTML = userInfo.innerHTML;
            const cleanHTML = currentHTML.replace(/<br><span class="text-red-400 text-sm">.*?<\/span>/g, '');
            userInfo.innerHTML = cleanHTML;
            userInfo.innerHTML += `<br><span class="text-red-400 text-sm">${message}</span>`;
        }
    }

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
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! status: ${response.status}`);
                }
                return response.json();
            })
            .then(data => {
                if (data.success) {
                    alert('✅ Đã gửi kết quả thành công!');
                    const allItems = [...getItemsInDropZone(dropZone1), ...getItemsInDropZone(dropZone2)];
                    allItems.forEach(item => draggablesContainer.appendChild(item));
                    
                    if (dropZone1.children.length === 0) {
                         const p = document.createElement('p');
                         p.className = 'placeholder text-gray-400 text-center italic';
                         p.textContent = 'Kéo sự kiện vào đây';
                         dropZone1.appendChild(p);
                    }
                    if (dropZone2.children.length === 0) {
                         const p = document.createElement('p');
                         p.className = 'placeholder text-gray-400 text-center italic';
                         p.textContent = 'Kéo sự kiện vào đây';
                         dropZone2.appendChild(p);
                    }

                    draggedItems = { french: [], vietnam: [], unassigned: [] };
                } else {
                    alert(`❌ ${data.message}`);
                }
            })
            .catch(error => {
                console.error('Lỗi khi gửi dữ liệu:', error);
                alert('⚠️ Không thể kết nối server!');
            });
    }

    function getBackendUrl() {
        if (window.location.hostname === 'localhost' ||
            window.location.hostname === '127.0.0.1' ||
            window.location.hostname === '0.0.0.0') {
            return 'http://localhost:3000';
        } else {
            return 'https://gamedragndrop-backend.onrender.com';
        }
    }

    window.addEventListener('beforeunload', function () {
        clearInterval(statusCheckInterval);
    });
});