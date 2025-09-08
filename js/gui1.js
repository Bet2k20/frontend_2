// js/gui1.js 

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
    // --- Biến lưu trữ kích thước ban đầu của items đó tránh trường hợp nhảy loạn xạ kích thước ---
    let originalStyles = {};

    let draggedItems = {
        french: [],
        vietnam: [],
        unassigned: []
    };

    // --- Hàm ex ---
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
            .filter(el => el.classList.contains('draggable')) 
            .map(el => ({
                id: el.dataset.item,
                text: el.textContent.trim()
            }));
    }

    function managePlaceholder(dropZone) {
        const items = getItemsInDropZone(dropZone);
        const placeholder = dropZone.querySelector('.placeholder');

        if (items.length === 0 && !placeholder) {
            const p = document.createElement('p');
            p.className = 'placeholder text-gray-400 text-center italic';
            p.textContent = 'Kéo sự kiện vào đây';
            dropZone.appendChild(p);
        } else if (items.length > 0 && placeholder) {
            placeholder.remove();
        }
    }

    function dragStart(e) {
        if (!isGameActive) return;

        draggedElement = this;
        draggedElementOriginalParent = draggedElement.parentNode;
        draggedElement.classList.add('dragging');

        const rect = draggedElement.getBoundingClientRect();

        // Giữ kích thước nguyên khi kéo tránh trường hợp nó bị thay đổi - khá quan trọng nếu ai sửa thì cẩn thận chỗ này
        draggedElement.style.width = `${rect.width}px`;
        draggedElement.style.height = `${rect.height}px`;

        // Đặt vị trí ban đầu vs fixed 
        draggedElement.style.position = 'fixed';
        draggedElement.style.left = `${rect.left}px`;
        draggedElement.style.top = `${rect.top}px`;
        draggedElement.style.zIndex = '10000';

        if (e.type === 'mousedown') {
            initialX = e.clientX;
            initialY = e.clientY;
        } else if (e.type === 'touchstart') {
            initialX = e.touches[0].clientX;
            initialY = e.touches[0].clientY;
        }

        // offset so với viewport 
        offsetX = initialX - rect.left;
        offsetY = initialY - rect.top;

        // Ngăn chọn text / cuộn trang
        e.preventDefault();
        document.body.style.userSelect = 'none';

        // bật class moving để áp dụng pointer-events:none (CSS)
        draggedElement.classList.add('moving');
    }

    function drag(e) {
        if (!draggedElement) return;

        if (e.type === 'mousemove') {
            currentX = e.clientX;
            currentY = e.clientY;
        } else if (e.type === 'touchmove') {
            currentX = e.touches[0].clientX;
            currentY = e.touches[0].clientY;
            e.preventDefault(); // ngăn cuộn trên mobile
        }

        // Tính toạ độ mới so với viewport 
        const newLeft = currentX - offsetX;
        const newTop = currentY - offsetY;

        draggedElement.style.left = `${newLeft}px`;
        draggedElement.style.top = `${newTop}px`;
    }

    function dragEnd(e) {
        if (!draggedElement) return;

        // Lấy toạ độ thả
        let releaseX, releaseY;
        if (e.type === 'mouseup') {
            releaseX = e.clientX;
            releaseY = e.clientY;
        } else if (e.type === 'touchend') {
            const touch = e.changedTouches[0];
            releaseX = touch.clientX;
            releaseY = touch.clientY;
        } else {
            const r = draggedElement.getBoundingClientRect();
            releaseX = r.left + r.width / 2;
            releaseY = r.top + r.height / 2;
        }

        
        const prevPointer = draggedElement.style.pointerEvents;
        draggedElement.style.pointerEvents = 'none';
        const dropTarget = document.elementFromPoint(releaseX, releaseY);
        // Khôi phục pointer-events
        draggedElement.style.pointerEvents = prevPointer;

        const targetDropZone = dropTarget ? dropTarget.closest('.drop-zone') : null;

        if (targetDropZone) {
            if (targetDropZone !== draggedElementOriginalParent) {
                // Nếu kéo từ drop-zone khác ==> xóa placeholder cũ
                if (draggedElementOriginalParent && draggedElementOriginalParent.classList.contains('drop-zone')) {
                    try { draggedElementOriginalParent.removeChild(draggedElement); } catch (err) {}
                    managePlaceholder(draggedElementOriginalParent);
                }
                const placeholder = targetDropZone.querySelector('.placeholder');
                if (placeholder) placeholder.remove();

                // Reset inline trước khi append để nó nhận layout mới
                draggedElement.style.position = '';
                draggedElement.style.left = '';
                draggedElement.style.top = '';
                draggedElement.style.zIndex = '';
                draggedElement.style.width = '';
                draggedElement.style.height = '';

                targetDropZone.appendChild(draggedElement);
            } else {
                
                draggedElement.style.position = '';
                draggedElement.style.left = '';
                draggedElement.style.top = '';
                draggedElement.style.zIndex = '';
                draggedElement.style.width = '';
                draggedElement.style.height = '';
            }
        } else {
            // Thả ngoài drop-zone -> trả về container chính
            if (draggedElementOriginalParent && draggedElementOriginalParent.classList.contains('drop-zone')) {
                draggablesContainer.appendChild(draggedElement);
                managePlaceholder(draggedElementOriginalParent);
            }
            draggedElement.style.position = '';
            draggedElement.style.left = '';
            draggedElement.style.top = '';
            draggedElement.style.zIndex = '';
            draggedElement.style.width = '';
            draggedElement.style.height = '';
        }

        // Reset trạng thái kéo
        document.body.style.userSelect = '';
        draggedElement.classList.remove('dragging', 'moving');

        updateDraggedItemsState();
        managePlaceholder(dropZone1);
        managePlaceholder(dropZone2);

        draggedElement = null;
        draggedElementOriginalParent = null;
    }

    // --- Listeners cho kéo thả ---
    const draggables = document.querySelectorAll('.draggable');
    draggables.forEach(draggable => {
        draggable.addEventListener('mousedown', dragStart);
        draggable.addEventListener('touchstart', dragStart, { passive: false });
    });

    document.addEventListener('mousemove', drag);
    document.addEventListener('touchmove', drag, { passive: false });
    document.addEventListener('mouseup', dragEnd);
    document.addEventListener('touchend', dragEnd);

    // --- Hiệu ứng highlight drop-zone ---
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

    function clearDragOverZones() {
        dropZone1.classList.remove('active');
        dropZone2.classList.remove('active');
    }

    document.addEventListener('mousemove', handleDragOverZones);
    document.addEventListener('touchmove', handleDragOverZones);
    document.addEventListener('mouseup', clearDragOverZones);
    document.addEventListener('touchend', clearDragOverZones);

    // --- Logic Game ---
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
            .then(response => response.json())
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
            .then(response => response.json()) // Nên kiểm tra response.ok nhưng lười code quá
            .then(data => {
                if (data.success && data.session.isActive) {
                    updateDraggedItemsState();
                    const totalItems = draggedItems.french.length + draggedItems.vietnam.length + draggedItems.unassigned.length;
                    const totalDroppedOrAssigned = draggedItems.french.length + draggedItems.vietnam.length;

                    if (totalItems > 0 && totalDroppedOrAssigned > 0) {
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
                    } else if (totalItems === 0) {
                        alert('Không có sự kiện nào để gửi!');
                    } else {
                        alert('Vui lòng kéo ít nhất một sự kiện vào một cột trước khi gửi!');
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
                alert('⚠️ Không thể kết nối đến server! kiểm tra lại backend ');
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
            .then(response => response.json()) // tương tự như trên thì nên kiểm tra response.oke ....
            .then(data => {
                if (data.success) {
                    alert('✅ Đã gửi kết quả thành công!');
                    const allItems = [...getItemsInDropZone(dropZone1), ...getItemsInDropZone(dropZone2)];
                    allItems.forEach(item => draggablesContainer.appendChild(item));

                    managePlaceholder(dropZone1);
                    managePlaceholder(dropZone2);

                    draggedItems = { french: [], vietnam: [], unassigned: [] };
                    updateDraggedItemsState(); // Cập nhật lại trạng thái sau khi reset
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
            
            return 'https://backend-2-goy4.onrender.com/';
        }
    }

    // --- Khởi tạo ---
    managePlaceholder(dropZone1);
    managePlaceholder(dropZone2);

    window.addEventListener('beforeunload', function () {
        clearInterval(statusCheckInterval);
    });
});