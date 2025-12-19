import { collection, query, orderBy, getDocs, doc, deleteDoc, updateDoc, setDoc } from "https://www.gstatic.com/firebasejs/11.6.1/firebase-firestore.js";
import { db } from './config.js';

export async function fetchCollection(path, callback) {
    const q = query(collection(db, path), orderBy("timestamp", "desc"));
    try {
        const snap = await getDocs(q);
        let items = [];
        snap.forEach(doc => items.push({ id: doc.id, ...doc.data() }));
        callback(items);
    } catch (e) {
        console.warn("Fetch collection error", e);
        // Retry logic or default empty
        callback([]);
    }
}

export async function genericSaveItem(collectionPath, id, data, callback) {
    try {
        if (id) await updateDoc(doc(db, collectionPath, id), data);
        else await setDoc(doc(db, collectionPath, crypto.randomUUID()), data);
        if (callback) callback();
    } catch (e) { alert(e.message); }
}

export async function genericDeleteItem(collectionPath, id, callback) {
    if (confirm("Slet?")) {
        await deleteDoc(doc(db, collectionPath, id));
        if (callback) callback();
    }
}
