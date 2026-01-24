
import { initialRestaurants } from '../src/data/restaurants.js';

const areas = {};

initialRestaurants.forEach(r => {
    const addr = r.address || "";
    
    // Common Kulai Areas
    const keywords = [
        "Indahpura", "Bandar Putra", "Kulai Besar", "Saleng", "Senai", "Kelapa Sawit", 
        "Taman Manis", "Taman Timur", "Taman Mas", "Taman Putri", "Taman Tropika",
        "Taman Sri Kulai", "Taman Bersatu", "Taman Kota", "Taman Selatan",
        "Taman Pancasila", "Taman Muhibbah", "Taman Mewah", "Taman Anggerik",
        "Taman Gemilang", "Taman Scientex", "Taman Lagenda", "Taman Aman",
        "Taman Kulai"
    ];

    let found = false;
    for (const k of keywords) {
        if (addr.includes(k)) {
            areas[k] = (areas[k] || 0) + 1;
            found = true;
        }
    }
});

console.log("Area Counts:");
const sortedAreas = Object.entries(areas).sort((a,b) => b[1] - a[1]);
sortedAreas.forEach(([k,v]) => console.log(`${k}: ${v}`));
