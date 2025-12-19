import { signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { doc, getDoc, setDoc, updateDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { auth, db, PORTS, INITIAL_CONTENT } from './config.js';
import { updateAdminListUI } from './ui.js';

export let isAdmin = false;
export let currentUser = null;
export let allowedAdmins = [];

export function setCurrentUser(user) {
    currentUser = user;
}

export function setIsAdmin(status) {
    isAdmin = status;
}

export function setAllowedAdmins(admins) {
    allowedAdmins = admins;
}

export async function authenticateAdmin() {
    const email = document.getElementById('login-email').value.trim();
    const password = document.getElementById('login-password').value.trim();
    const status = document.getElementById('login-status-message');

    if (!email || !password) { status.textContent = "Udfyld felter"; return; }
    status.textContent = "Logger ind...";

    try {
        await signInWithEmailAndPassword(auth, email, password);
        window.closeLoginModal();
        // Show Admin Page on login
        window.showPage('admin');
    } catch (e) {
        if ((e.code === 'auth/user-not-found' || e.code === 'auth/invalid-credential') && email.toLowerCase() === INITIAL_CONTENT.allowed_emails[0]) {
            try {
                await createUserWithEmailAndPassword(auth, email, password);
                const snap = await getDoc(doc(db, PORTS.ADMINS_DOC));
                if (!snap.exists()) await setDoc(doc(db, PORTS.ADMINS_DOC), { allowed_emails: INITIAL_CONTENT.allowed_emails });
                window.closeLoginModal();
                window.showPage('admin');
            } catch (createErr) { status.textContent = "Fejl: " + createErr.message; }
        } else {
            status.textContent = "Fejl: " + e.message;
        }
    }
};

export async function setupAdminAuthListener() {
    if (!db) return;
    try {
        const snap = await getDoc(doc(db, PORTS.ADMINS_DOC));
        if (snap.exists()) allowedAdmins = snap.data().allowed_emails || [];
        else allowedAdmins = INITIAL_CONTENT.allowed_emails;
    } catch (e) { console.warn("Admin fetch error", e); }

    if (currentUser && allowedAdmins.includes(currentUser.email.toLowerCase())) {
        isAdmin = true;
        // Vis Admin Link i desktop menu
        document.getElementById('admin-nav-link').classList.remove('hidden');
        document.getElementById('mobile-admin-link').classList.remove('hidden');
        document.getElementById('admin-email').textContent = currentUser.email;
        document.getElementById('admin-auth-button').innerHTML = '<i data-lucide="log-out" class="w-5 h-5"></i>';

        // Initialiser edit listeners
        // Note: handleEditClick needs to be imported or handled in app.js
        // We will dispatch a custom event or let app.js handle the attaching of listeners
        document.dispatchEvent(new CustomEvent('adminStatusChanged', { detail: { isAdmin: true } }));
        updateAdminListUI(allowedAdmins);
    } else {
        isAdmin = false;
        document.getElementById('admin-nav-link').classList.add('hidden');
        document.getElementById('mobile-admin-link').classList.add('hidden');
        document.getElementById('admin-auth-button').innerHTML = '<i data-lucide="shield" class="w-5 h-5"></i>';
        // Hvis man er på admin siden og logger ud, gå til hjem
        if (document.getElementById('admin').classList.contains('active')) window.showPage('hjem');
    }
    if (window.lucide) window.lucide.createIcons();
}

export async function addAdmin() {
    const email = document.getElementById('new-admin-email').value.trim();
    if (email) {
        await updateDoc(doc(db, PORTS.ADMINS_DOC), { allowed_emails: [...allowedAdmins, email] });
        document.getElementById('new-admin-email').value = '';
        setupAdminAuthListener();
    }
}

export async function removeAdmin(email) {
    if (confirm("Fjern?")) {
        await updateDoc(doc(db, PORTS.ADMINS_DOC), { allowed_emails: allowedAdmins.filter(e => e !== email) });
        setupAdminAuthListener();
    }
}

export function handleAdminAuth() {
    if (isAdmin) {
        signOut(auth).then(() => {
            window.showPage('hjem'); // Gå til forside ved logout
            window.location.reload();
        });
    } else {
        document.getElementById('login-modal').classList.remove('hidden');
        document.getElementById('login-status-message').textContent = '';
    }
}
