// Firebase Configuration
import { initializeApp } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-app.js";
import { getAuth } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-auth.js";
import { getFirestore } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";

const firebaseConfig = {
    apiKey: "AIzaSyDTd1htAFr-Q6PJoicKTClvLFNn3oTBykk",
    authDomain: "kirospirit-web.firebaseapp.com",
    projectId: "kirospirit-web",
    storageBucket: "kirospirit-web.firebasestorage.app",
    messagingSenderId: "504896278904",
    appId: "1:504896278904:web:46073ab7cce2b357d1b88d",
    measurementId: "G-K4DEHK0B6D"
};

export const appId = 'default-kirospirit-app';

// Initialize Firebase
export const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);

// Data Paths
export const PORTS = {
    CONTENT_DOC: `artifacts/${appId}/public/data/site_content/main`,
    ADMINS_DOC: `artifacts/${appId}/public/data/admins/users`,
    NEWS_COLLECTION: `artifacts/${appId}/public/data/news`,
    REVIEWS_COLLECTION: `artifacts/${appId}/public/data/reviews`,
    TREATMENTS_COLLECTION: `artifacts/${appId}/public/data/treatments`,
    STAFF_COLLECTION: `artifacts/${appId}/public/data/staff`
};

export const INITIAL_CONTENT = {
    hero_h1: "Velkommen til Kirospirit",
    hero_p: "Din krop er dit vigtigste redskab. Pas godt på den...",
    news_h2: "Opdateringer & Tilbud",
    reviews_h2: "Det siger vores klienter",
    news_layout_cols: "3",
    contact_recipient: "nicolaihlarsen@gmail.com",
    contact_email: "kontakt@kirospirit.dk",
    contact_phone: "+45 12 34 56 78",
    social_facebook: "#",
    social_instagram: "#",
    allowed_emails: ["nicolaihlarsen@gmail.com"]
};
