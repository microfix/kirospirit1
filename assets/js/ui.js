// UI Rendering Functions

export function updateAdminListUI(allowedAdmins) {
    const list = document.getElementById('admin-list');
    list.innerHTML = '';
    allowedAdmins.forEach(email => {
        list.innerHTML += `<li class="flex justify-between p-2 border-b"><span>${email}</span><button onclick="window.removeAdmin('${email}')" class="text-red-500"><i data-lucide="user-x" class="w-4 h-4"></i></button></li>`;
    });
    if (window.lucide) window.lucide.createIcons();
}

export function renderNewsItems(items, cols) {
    const container = document.getElementById('news-display');
    if (!container) return;
    container.className = `grid gap-8 grid-cols-1 md:grid-cols-2 lg:grid-cols-${cols}`;
    container.innerHTML = '';
    if (items.length === 0) { container.innerHTML = '<p class="text-gray-500 italic text-center col-span-full">Ingen nyheder.</p>'; return; }

    items.forEach(item => {
        let mediaHtml = '';
        if (item.media_url && item.media_url.trim().startsWith('<iframe')) {
            const wMatch = item.media_url.match(/width="(\d+)"/);
            const hMatch = item.media_url.match(/height="(\d+)"/);
            let ratio = 56.25;
            if (wMatch && hMatch && parseInt(wMatch[1]) > 0) ratio = (parseInt(hMatch[1]) / parseInt(wMatch[1])) * 100;
            let cleanFrame = item.media_url.replace(/width="\d+"/, '').replace(/height="\d+"/, '');
            mediaHtml = `<div class="aspect-ratio-box" style="padding-bottom: ${ratio}%;">${cleanFrame}</div>`;
        } else if (item.media_url) {
            mediaHtml = `<a href="${item.media_url}" target="_blank" class="block mt-4 text-kirospirit underline">Se Link</a>`;
        }
        const date = item.timestamp ? new Date(item.timestamp).toLocaleDateString() : '';
        const card = document.createElement('div');
        card.className = "bg-white rounded-xl shadow-md p-6 border-t-4 border-secondary-color flex flex-col";
        card.innerHTML = `<h4 class="text-xl font-bold mb-2">${item.title}</h4><span class="text-xs text-gray-400 mb-4">${date}</span><p class="text-gray-600 flex-grow whitespace-pre-wrap">${item.body}</p>${mediaHtml}`;
        container.appendChild(card);
    });
}

export function renderNewsList(items) {
    const list = document.getElementById('news-list');
    if (!list) return;
    list.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = "flex justify-between p-2 bg-gray-50 rounded border";
        li.innerHTML = `<span>${item.title}</span><button class="text-kirospirit"><i data-lucide="edit" class="w-4 h-4"></i></button>`;
        li.querySelector('button').onclick = () => window.openNewsModal(item);
        list.appendChild(li);
    });
    if (window.lucide) window.lucide.createIcons();
}

export function renderReviews(items) {
    const container = document.getElementById('reviews-slider-container');
    if (!container) return;
    container.innerHTML = '';

    if (items.length === 0) {
        container.innerHTML = '<p class="text-white opacity-70">Ingen anmeldelser endnu.</p>';
        return;
    }

    let currentIndex = 0;
    let timeoutId = null;

    const showReview = () => {
        const item = items[currentIndex];
        let stars = '';
        for (let i = 0; i < 6; i++) stars += `<i data-lucide="star" class="w-6 h-6 ${i < item.stars ? 'text-yellow-400 fill-current' : 'text-gray-400'}"></i>`;

        // Create Element
        const div = document.createElement('div');
        div.className = "absolute inset-0 flex flex-col items-center justify-center transition-all duration-500 review-slide-enter";
        div.innerHTML = `
            <div class="flex space-x-1 mb-4">${stars}</div>
            <p class="text-xl md:text-2xl italic font-medium text-white mb-6 px-4">"${item.text}"</p>
            <p class="font-bold text-secondary-color text-lg uppercase tracking-wide">- ${item.name}</p>
         `;

        container.innerHTML = ''; // Clear previous
        container.appendChild(div);
        if (window.lucide) window.lucide.createIcons();

        // Duration logic
        const duration = (item.duration || 5) * 1000;

        // Schedule next
        // Start exit animation slightly before the full duration ends for smooth transition
        const exitTime = Math.max(0, duration - 1000);

        setTimeout(() => {
            div.classList.remove('review-slide-enter');
            div.classList.add('review-slide-exit');
        }, exitTime);

        timeoutId = setTimeout(() => {
            currentIndex = (currentIndex + 1) % items.length;
            showReview();
        }, duration);
    };

    showReview();

    // Return a cleanup function instead of interval ID
    return () => {
        if (timeoutId) clearTimeout(timeoutId);
    };
}

export function renderReviewList(items) {
    const list = document.getElementById('admin-reviews-list');
    if (!list) return;
    list.innerHTML = '';
    items.forEach(item => {
        const li = document.createElement('li');
        li.className = "flex justify-between p-2 bg-gray-50 rounded border";
        li.innerHTML = `<span>${item.name} (${item.stars} stjerner)</span><button class="text-kirospirit"><i data-lucide="edit" class="w-4 h-4"></i></button>`;
        li.querySelector('button').onclick = () => window.openReviewModal(item);
        list.appendChild(li);
    });
    if (window.lucide) window.lucide.createIcons();
}

export function renderTreatments(items) {
    const homeContainer = document.getElementById('treatments-home-list');
    const fullContainer = document.getElementById('treatments-full-list');
    if (!homeContainer || !fullContainer) return;

    const createCard = (item) => `
        <div class="bg-white rounded-2xl shadow-md p-8 hover:shadow-xl transition duration-300 flex flex-col h-full border-t-4" style="border-color: ${item.color || '#0d9488'}">
            <div class="flex items-center mb-6">
                <div class="bg-bg-color p-3 rounded-full mr-4">
                    <i data-lucide="${item.icon || 'activity'}" class="w-8 h-8" style="color: ${item.color || '#0d9488'}"></i>
                </div>
                <h3 class="text-xl font-bold text-gray-900">${item.title}</h3>
            </div>
            <p class="text-gray-600 flex-grow">${item.desc}</p>
        </div>`;

    homeContainer.innerHTML = items.slice(0, 3).map(createCard).join('') || '<p class="col-span-3 text-center text-gray-400">Ingen behandlinger oprettet endnu.</p>';
    fullContainer.innerHTML = items.map(createCard).join('') || '<p class="col-span-3 text-center text-gray-400">Ingen behandlinger fundet.</p>';
    if (window.lucide) window.lucide.createIcons();
}

export function renderTreatmentList(items) {
    const list = document.getElementById('admin-treatments-list');
    if (!list) return;
    list.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = "flex justify-between items-center p-3 bg-gray-50 rounded border";
        div.innerHTML = `
             <div class="flex items-center"><i data-lucide="${item.icon}" class="w-5 h-5 mr-2" style="color:${item.color}"></i> <span class="font-medium">${item.title}</span></div>
             <button class="text-kirospirit hover:text-black"><i data-lucide="edit" class="w-4 h-4"></i></button>
         `;
        div.querySelector('button').onclick = () => window.openTreatmentModal(item);
        list.appendChild(div);
    });
    if (window.lucide) window.lucide.createIcons();
}

export function renderStaff(items) {
    const container = document.getElementById('staff-container');
    if (!container) return;
    container.innerHTML = '';
    if (items.length === 0) {
        container.innerHTML = '<p class="text-center text-gray-500 italic">Ingen medarbejdere oprettet endnu. Gå til Admin Panelet for at tilføje.</p>';
    }

    items.forEach((item, index) => {
        const isEven = index % 2 === 0;
        const div = document.createElement('div');
        div.className = "grid grid-cols-1 lg:grid-cols-3 gap-12 items-center";
        div.innerHTML = `
            <div class="lg:col-span-1 flex justify-center lg:justify-${isEven ? 'start' : 'end'} ${!isEven ? 'lg:order-last' : ''}">
                <img src="${item.image_url || 'https://via.placeholder.com/400x400?text=Ingen+Billede'}"
                    alt="${item.name}"
                    class="rounded-3xl shadow-2xl w-full max-w-sm lg:max-w-none transform hover:scale-[1.02] transition duration-500 ease-in-out">
            </div>
            <div class="lg:col-span-2 space-y-6 text-lg text-gray-700">
                <h3 class="text-3xl font-bold text-gray-900">${item.name}</h3>
                ${item.quote ? `<p class="font-semibold text-kirospirit border-l-4 border-secondary-color pl-4 italic">"${item.quote}"</p>` : ''}
                <p class="whitespace-pre-wrap">${item.desc}</p>
                <div class="pt-4 flex flex-wrap gap-4">
                    <span class="inline-flex items-center rounded-full bg-bg-color px-3 py-1 text-sm font-medium text-kirospirit ring-1 ring-inset ring-kirospirit/20">
                    <i data-lucide="user" class="w-4 h-4 mr-2"></i> ${item.title}</span>
                </div>
            </div>
         `;
        container.appendChild(div);
    });
    if (window.lucide) window.lucide.createIcons();
}

export function renderStaffList(items) {
    const list = document.getElementById('admin-staff-list');
    if (!list) return;
    list.innerHTML = '';
    items.forEach(item => {
        const div = document.createElement('div');
        div.className = "flex justify-between items-center p-3 bg-gray-50 rounded border";
        div.innerHTML = `
            <div class="flex items-center gap-3">
                <img src="${item.image_url}" class="w-10 h-10 rounded-full object-cover bg-gray-200">
                <div><p class="font-bold text-sm">${item.name}</p><p class="text-xs text-gray-500">${item.title}</p></div>
            </div>
            <button class="text-kirospirit hover:text-black"><i data-lucide="edit" class="w-4 h-4"></i></button>
         `;
        div.querySelector('button').onclick = () => window.openStaffModal(item);
        list.appendChild(div);
    });
    if (window.lucide) window.lucide.createIcons();
}

// Icon Helper
const commonIcons = ['activity', 'heart', 'user', 'users', 'smile', 'frown', 'meh', 'thumbs-up', 'star', 'sun', 'moon', 'cloud', 'droplet', 'feather', 'eye', 'ear', 'anchor', 'award', 'bell', 'book', 'calendar', 'camera', 'check', 'clock', 'coffee', 'compass', 'cpu', 'credit-card', 'database', 'disc', 'dollar-sign', 'download', 'edit', 'file', 'flag', 'folder', 'gift', 'globe', 'grid', 'hash', 'headphones', 'home', 'image', 'inbox', 'info', 'key', 'layers', 'layout', 'life-buoy', 'link', 'list', 'lock', 'mail', 'map', 'map-pin', 'maximize', 'menu', 'message-circle', 'message-square', 'mic', 'minimize', 'monitor', 'moon', 'more-horizontal', 'more-vertical', 'move', 'music', 'navigation', 'package', 'paperclip', 'pause', 'phone', 'pie-chart', 'play', 'plus', 'power', 'printer', 'radio', 'refresh-cw', 'save', 'scissors', 'search', 'send', 'settings', 'share', 'shield', 'shopping-bag', 'shopping-cart', 'shuffle', 'sidebar', 'skip-back', 'skip-forward', 'slash', 'sliders', 'smartphone', 'speaker', 'square', 'star', 'stop-circle', 'sun', 'sunrise', 'sunset', 'tablet', 'tag', 'target', 'terminal', 'thermometer', 'thumbs-down', 'thumbs-up', 'toggle-left', 'toggle-right', 'tool', 'trash', 'trash-2', 'trending-down', 'trending-up', 'triangle', 'truck', 'tv', 'twitter', 'type', 'umbrella', 'underline', 'unlock', 'upload', 'user', 'user-check', 'user-minus', 'user-plus', 'user-x', 'users', 'video', 'video-off', 'voicemail', 'volume', 'volume-1', 'volume-2', 'volume-x', 'watch', 'wifi', 'wifi-off', 'wind', 'x', 'x-circle', 'x-octagon', 'x-square', 'youtube', 'zap', 'zap-off', 'zoom-in', 'zoom-out'];

export function filterIcons() {
    const search = document.getElementById('icon-search').value.toLowerCase();
    const grid = document.getElementById('icon-grid');
    grid.innerHTML = '';
    const filtered = commonIcons.filter(i => i.includes(search));
    filtered.forEach(iconName => {
        const div = document.createElement('div');
        div.className = "icon-option";
        div.innerHTML = `<i data-lucide="${iconName}"></i><span>${iconName}</span>`;
        div.onclick = () => {
            document.getElementById('treat-icon').value = iconName;
            document.getElementById('selected-icon-name').textContent = iconName;
            document.querySelectorAll('.icon-option').forEach(el => el.classList.remove('selected'));
            div.classList.add('selected');
        }
        grid.appendChild(div);
    });
    if (window.lucide) window.lucide.createIcons();
}
