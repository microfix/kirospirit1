import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { app, auth, db, PORTS, INITIAL_CONTENT } from './config.js';
import * as Auth from './auth.js';
import * as DB from './db.js';
import * as UI from './ui.js?v=fixed6';

// Global Stater (can be kept here or moved to respective modules)
let currentNewsId = null;
let currentReviewId = null;
let currentTreatmentId = null;
let currentStaffId = null;
let contactInfo = {};

// Review Slider Interval
let reviewInterval = null;

// Initialize
function init() {
    onAuthStateChanged(auth, (user) => {
        Auth.setCurrentUser(user);
        setupContentListeners();
        Auth.setupAdminAuthListener();
    });

    // Attach Global Functions to Window for HTML onclick attributes
    attachWindowFunctions();

    // Initial Page Load
    window.showPage(window.location.hash.substring(1) || 'hjem');
}

async function setupContentListeners() {
    if (!db) return;
    const docRef = doc(db, PORTS.CONTENT_DOC);
    let data = INITIAL_CONTENT;
    try {
        const snap = await getDoc(docRef);
        if (snap.exists()) data = snap.data();
        else await setDoc(docRef, INITIAL_CONTENT).catch(e => {
            console.warn("Write error", e);
            document.getElementById('hero_p').innerText = "Write Error: " + e.message;
        });
    } catch (e) {
        console.warn("Fetch error", e);
        document.getElementById('hero_h1').innerText = "Fejl ved hentning af data";
        document.getElementById('hero_p').innerText = e.message;
    }
    contactInfo = data;

    // Populate DOM
    const setTxt = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    setTxt('hero_h1', data.hero_h1); setTxt('hero_p', data.hero_p); setTxt('news_h2', data.news_h2); setTxt('reviews_h2', data.reviews_h2);

    const setHref = (id, link) => { const el = document.getElementById(id); if (el) el.href = link; };
    setTxt('contact_phone_link', data.contact_phone); setHref('contact_phone_link', `tel:${data.contact_phone?.replace(/\s/g, "")}`);
    setTxt('contact_email_link', data.contact_email); setHref('contact_email_link', `mailto:${data.contact_email}`);
    setHref('social_facebook_link', data.social_facebook); setHref('social_instagram_link', data.social_instagram);

    if (Auth.isAdmin) {
        const setVal = (id, val) => { const el = document.getElementById('edit-' + id); if (el) el.textContent = val; };
        for (const key in data) setVal(key, data[key]);
        const layout = document.getElementById('layout-control'); if (layout) layout.value = data.news_layout_cols || "3";
    }

    // Fetch Collections
    await DB.fetchCollection(PORTS.NEWS_COLLECTION, (items) => {
        UI.renderNewsItems(items, data.news_layout_cols || "3");
        UI.renderNewsList(items);
    });

    await DB.fetchCollection(PORTS.REVIEWS_COLLECTION, (items) => {
        if (reviewInterval) reviewInterval(); // Call cleanup function
        reviewInterval = UI.renderReviews(items);
        UI.renderReviewList(items);
    });

    await DB.fetchCollection(PORTS.TREATMENTS_COLLECTION, (items) => {
        UI.renderTreatments(items);
        UI.renderTreatmentList(items);
    });

    await DB.fetchCollection(PORTS.STAFF_COLLECTION, (items) => {
        UI.renderStaff(items);
        UI.renderStaffList(items);
    });
}

function attachWindowFunctions() {
    // Auth
    window.handleAdminAuth = Auth.handleAdminAuth;
    window.authenticateAdmin = Auth.authenticateAdmin;
    window.addAdmin = Auth.addAdmin;
    window.removeAdmin = Auth.removeAdmin; // Ensure logic handles string input from HTML
    window.closeLoginModal = () => document.getElementById('login-modal').classList.add('hidden');

    // Navigation
    window.showPage = (pageId) => {
        document.querySelectorAll('.page-section').forEach(el => el.classList.remove('active'));
        document.getElementById(pageId)?.classList.add('active');
        window.scrollTo(0, 0);
    };
    window.toggleMenu = () => {
        const menu = document.getElementById('mobile-menu');
        menu.classList.toggle('hidden');
    };
    document.getElementById('menu-button').onclick = window.toggleMenu;

    // Contact Form
    window.handleFormSubmit = (e) => { e.preventDefault(); alert("Tak! (Dette er en demo)."); };

    // News
    window.openNewsModal = (item) => {
        currentNewsId = item ? item.id : null;
        document.getElementById('news-title').value = item ? item.title : '';
        document.getElementById('news-body').value = item ? item.body : '';
        document.getElementById('news-media-url').value = item ? (item.media_url || '') : '';
        document.getElementById('news-delete-button').classList.toggle('hidden', !item);
        document.getElementById('news-modal').classList.remove('hidden');
    };
    window.closeNewsModal = () => document.getElementById('news-modal').classList.add('hidden');
    window.saveNewsItem = async () => {
        const title = document.getElementById('news-title').value;
        const body = document.getElementById('news-body').value;
        const media = document.getElementById('news-media-url').value;
        const data = { title, body, media_url: media, timestamp: new Date().toISOString() };
        await DB.genericSaveItem(PORTS.NEWS_COLLECTION, currentNewsId, data, () => {
            window.closeNewsModal(); setupContentListeners();
        });
    };
    window.deleteNewsItem = async () => {
        await DB.genericDeleteItem(PORTS.NEWS_COLLECTION, currentNewsId, () => {
            window.closeNewsModal(); setupContentListeners();
        });
    };
    window.updateNewsLayout = async (cols) => {
        if (!Auth.isAdmin) return;
        try { await updateDoc(doc(db, PORTS.CONTENT_DOC), { news_layout_cols: cols }); setupContentListeners(); } catch (e) { }
    };

    // Helper for star rating UI
    const updateStarRatingUI = (container, value) => {
        container.dataset.value = value;
        const stars = container.querySelectorAll('i');
        stars.forEach((star, idx) => {
            if (idx < value) {
                star.classList.add('active');
            } else {
                star.classList.remove('active');
            }
        });
    };

    // Reviews
    window.openReviewModal = (item) => {
        currentReviewId = item ? item.id : null;
        document.getElementById('review-name').value = item ? item.name : '';

        const starContainer = document.getElementById('star-rating-container');
        const starValue = item ? item.stars : 5;
        updateStarRatingUI(starContainer, starValue);

        // Add listeners to stars if not already added
        if (!starContainer.dataset.listenersAdded) {
            const stars = starContainer.querySelectorAll('i');
            stars.forEach((star, idx) => {
                const val = idx + 1;
                star.onclick = () => updateStarRatingUI(starContainer, val);
                star.onmouseover = () => {
                    stars.forEach((s, sIdx) => {
                        if (sIdx < val) s.classList.add('hover');
                        else s.classList.remove('hover');
                    });
                };
                star.onmouseout = () => {
                    stars.forEach(s => s.classList.remove('hover'));
                };
            });
            starContainer.dataset.listenersAdded = "true";
        }

        document.getElementById('review-duration').value = item ? (item.duration || 5) : '5';
        document.getElementById('review-text').value = item ? item.text : '';

        const deleteBtn = document.getElementById('review-delete-button');
        if (item) {
            deleteBtn.classList.remove('hidden');
            deleteBtn.textContent = 'Slet Anmeldelse';
            deleteBtn.classList.remove('bg-red-700');
            deleteBtn.classList.add('bg-red-500');
            deleteBtn.onclick = () => window.confirmDeleteReview();
        } else {
            deleteBtn.classList.add('hidden');
        }

        const modal = document.getElementById('review-modal');
        if (modal) {
            modal.classList.remove('hidden');
        }
    };
    window.closeReviewModal = () => document.getElementById('review-modal').classList.add('hidden');
    window.saveReviewItem = async () => {
        const name = document.getElementById('review-name').value;
        const stars = document.getElementById('star-rating-container').dataset.value;
        const duration = document.getElementById('review-duration').value;
        const text = document.getElementById('review-text').value;
        const data = {
            name,
            stars: parseInt(stars),
            duration: parseInt(duration) || 5,
            text,
            timestamp: new Date().toISOString()
        };
        await DB.genericSaveItem(PORTS.REVIEWS_COLLECTION, currentReviewId, data, () => {
            window.closeReviewModal(); setupContentListeners();
        });
    };
    window.confirmDeleteReview = () => {
        const btn = document.getElementById('review-delete-button');
        if (btn.textContent === 'Er du sikker?') {
            window.deleteReviewItem();
        } else {
            btn.textContent = 'Er du sikker?';
            btn.classList.remove('bg-red-500');
            btn.classList.add('bg-red-700');
        }
    };
    window.deleteReviewItem = async () => {
        await DB.genericDeleteItem(PORTS.REVIEWS_COLLECTION, currentReviewId, () => {
            window.closeReviewModal(); setupContentListeners();
        });
    };

    // Treatments
    window.filterIcons = UI.filterIcons;
    window.openTreatmentModal = (item) => {
        currentTreatmentId = item ? item.id : null;
        document.getElementById('treat-title').value = item ? item.title : '';
        document.getElementById('treat-desc').value = item ? item.desc : '';
        document.getElementById('treat-color').value = item ? item.color : '#0d9488';
        document.getElementById('treat-icon').value = item ? item.icon : 'activity';
        document.getElementById('selected-icon-name').textContent = item ? item.icon : 'activity';
        document.getElementById('treatment-modal').classList.remove('hidden');
        document.getElementById('treat-delete-button').classList.toggle('hidden', !item);
        window.filterIcons();
    };
    window.closeTreatmentModal = () => document.getElementById('treatment-modal').classList.add('hidden');
    window.saveTreatmentItem = async () => {
        const title = document.getElementById('treat-title').value;
        const desc = document.getElementById('treat-desc').value;
        const color = document.getElementById('treat-color').value;
        const icon = document.getElementById('treat-icon').value;
        const data = { title, desc, color, icon, timestamp: new Date().toISOString() };
        await DB.genericSaveItem(PORTS.TREATMENTS_COLLECTION, currentTreatmentId, data, () => {
            window.closeTreatmentModal(); setupContentListeners();
        });
    };
    window.deleteTreatmentItem = async () => {
        await DB.genericDeleteItem(PORTS.TREATMENTS_COLLECTION, currentTreatmentId, () => {
            window.closeTreatmentModal(); setupContentListeners();
        });
    };

    // Staff
    window.openStaffModal = (item) => {
        currentStaffId = item ? item.id : null;
        document.getElementById('staff-name').value = item ? item.name : '';
        document.getElementById('staff-title').value = item ? item.title : '';
        document.getElementById('staff-image').value = item ? item.image_url : '';
        document.getElementById('staff-quote').value = item ? item.quote : '';
        document.getElementById('staff-desc').value = item ? item.desc : '';
        document.getElementById('staff-delete-button').classList.toggle('hidden', !item);
        document.getElementById('staff-modal').classList.remove('hidden');
    };
    window.closeStaffModal = () => document.getElementById('staff-modal').classList.add('hidden');
    window.saveStaffItem = async () => {
        const name = document.getElementById('staff-name').value;
        const title = document.getElementById('staff-title').value;
        const image_url = document.getElementById('staff-image').value;
        const quote = document.getElementById('staff-quote').value;
        const desc = document.getElementById('staff-desc').value;
        const data = { name, title, image_url, quote, desc, timestamp: new Date().toISOString() };
        await DB.genericSaveItem(PORTS.STAFF_COLLECTION, currentStaffId, data, () => {
            window.closeStaffModal(); setupContentListeners();
        });
    };
    window.deleteStaffItem = async () => {
        await DB.genericDeleteItem(PORTS.STAFF_COLLECTION, currentStaffId, () => {
            window.closeStaffModal(); setupContentListeners();
        });
    };

    // Content Editing
    let currentEditKey = null;
    document.querySelectorAll('.admin-edit').forEach(el => el.addEventListener('click', (e) => {
        currentEditKey = e.currentTarget.getAttribute('data-key');
        document.getElementById('modal-content-input').value = e.currentTarget.textContent;
        document.getElementById('edit-modal').classList.remove('hidden');
    }));
    window.closeModal = () => document.getElementById('edit-modal').classList.add('hidden');
    window.saveContentUpdate = async () => {
        if (!currentEditKey) return;
        try {
            await updateDoc(doc(db, PORTS.CONTENT_DOC), { [currentEditKey]: document.getElementById('modal-content-input').value });
            document.getElementById('edit-modal').classList.add('hidden');
            setupContentListeners();
        } catch (e) { alert("Fejl"); }
    };

    // Listen for admin changes
    document.addEventListener('adminStatusChanged', (e) => {
        if (e.detail.isAdmin) {
            document.querySelectorAll('.admin-edit').forEach(el => el.style.cursor = 'pointer');
        }
    });

}

// Run Init
init();
