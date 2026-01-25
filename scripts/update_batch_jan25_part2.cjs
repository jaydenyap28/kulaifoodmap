const fs = require('fs');
const path = require('path');

const restaurantsPath = path.join(__dirname, '../src/data/restaurants.js');
let fileContent = fs.readFileSync(restaurantsPath, 'utf8');

// Extract the array part
const startIndex = fileContent.indexOf('[');
const endIndex = fileContent.lastIndexOf(']');
const arrayContent = fileContent.substring(startIndex, endIndex + 1);

let restaurants;
try {
    // Use Function to parse to allow for loose JSON if needed, but strict JSON.parse is safer if format is good.
    // Given the file is JS, we use eval/Function.
    restaurants = eval(arrayContent);
} catch (e) {
    console.error("Error parsing restaurants data:", e);
    process.exit(1);
}

const updates = [
   { 
     "id": 7, 
     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRu8Prx5DvjkYD88X5E-ObNOQrXhafAT5zT2w&s" 
   }, 
   { 
     "id": 12, 
     "name": "永泉兴传统海南咖啡店", 
     "image": "https://scontent.fmkz1-2.fna.fbcdn.net/v/t39.30808-6/237482257_1241570576319493_1119263468831903382_n.jpg?_nc_cat=107&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=xt8q0PtNL20Q7kNvwG0jgVM&_nc_oc=AdnFxPbU9Ob896S7xTlCfUTHkRpZWu-p21FUgvpuwXOXVd9xelFsHJJhGatKxRGHE44&_nc_zt=23&_nc_ht=scontent.fmkz1-2.fna&_nc_gid=oQWLGX8FgtCGNxwouuq29w&oh=00_AfoojL7saSPbj6l6t3qxXRt0k88Ur2R5zAAr_eONpmpywQ&oe=697BD58B" 
   }, 
   { 
     "id": 13, 
     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcTS4IT7xvF0wJvbCe_ChlCt8E7nKEEDeQFB-g&s" 
   }, 
   { 
     "id": 16, 
     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSKaL11_-yxI6mKX8Vzb-YcoPJN9I3CSGB-Vg&s" 
   }, 
   { 
     "id": 21, 
     "image": "https://scontent.fmkz1-2.fna.fbcdn.net/v/t39.30808-6/306158499_539125361502108_3747463199871027682_n.jpg?_nc_cat=110&ccb=1-7&_nc_sid=6ee11a&_nc_ohc=wJN-NeqfT0AQ7kNvwFt1b0-&_nc_oc=AdkIE8IS1Af4g5HHMYeGjFnu89B7_BYpthLNncjMAv5fQrm2k2jR1fr45CjndE_Si88&_nc_zt=23&_nc_ht=scontent.fmkz1-2.fna&_nc_gid=kMJLwZpy0hF-_DxKIxtkOQ&oh=00_AfqHG0VWN7fHli6eVLHbdkSJW7pb_Zzv6-KkpmcyPuo6VQ&oe=697BD84F" 
   }, 
   { 
     "id": 29, 
     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRlQMTbsoQp3oUwzFdqaPm01LSenOFuX2lLdg&s" 
   }, 
   { 
     "id": 33, 
     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcQCHD9uVr8KYu4po51Mz7YEvZGIIEkCMUSeUg&s" 
   }, 
   { 
     "id": 35, 
     "opening_hours": "Monday: 7am - 12:30am\nTuesday: 7am - 12:30am\nWednesday: 7am - 12:30am\nThursday: 7am - 12:30am\nFriday: 7am - 12:30am\nSaturday: 7am - 12:30am\nSunday: 7am - 12:30am", 
     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS4LJ1WH9dHQu3dpiBZsb7C2ZePFJV90LQd8w&s" 
   }, 
   { 
     "id": 43, 
     "name_en": "", 
     "opening_hours": "Monday: 10am - 10pm\nTuesday: 10am - 10pm\nWednesday: Closed\nThursday: 10am - 10pm\nFriday: 10am - 10pm\nSaturday: 10am - 10pm\nSunday: 10am - 10pm" 
   }, 
   { 
     "id": 57, 
     "name": "千代寿司", 
     "opening_hours": "Monday: 11:30am - 10pm\nTuesday: 11:30am - 10pm\nWednesday: 11:30am - 10pm\nThursday: 11:30am - 10pm\nFriday: 11:30am - 10pm\nSaturday: 11:30am - 10pm\nSunday: 11:30am - 10pm" 
   }, 
   { 
     "id": 61, 
     "name_en": "Four Beans", 
     "image": "https://i.ibb.co/ksWC2zc8/four-beans.jpg" 
   }, 
   { 
     "id": 65, 
     "name": "Vivo Pizza ", 
     "name_en": "", 
     "opening_hours": "Monday: 10am - 10pm\nTuesday: 10am - 10pm\nWednesday: 10am - 10pm\nThursday: 10am - 10pm\nFriday: 10am - 10pm\nSaturday: 10am - 10pm\nSunday: 10am - 10pm", 
     "image": "https://i.ibb.co/zhY8g3Cf/Vivo-Pizza.jpg" 
   }, 
   { 
     "id": 66, 
     "name": "小心烫·小火锅", 
     "opening_hours": "Monday: 12pm - 10pm\nTuesday: 12pm - 10pm\nWednesday: 12pm - 10pm\nThursday: 12pm - 10pm\nFriday: 12pm - 10pm\nSaturday: 12pm - 10pm\nSunday: 12pm - 10pm" 
   }, 
   { 
     "id": 67, 
     "name": "大众美食中心", 
     "opening_hours": "Monday: 6am - 4pm\nTuesday: 6am - 4pm\nWednesday: 6am - 4pm\nThursday: 6am - 4pm\nFriday: 6am - 4pm\nSaturday: 6am - 4pm\nSunday: 6am - 4pm" 
   }, 
   { 
     "id": 68, 
     "name_en": "", 
     "opening_hours": "Monday: 11am - 12am\nTuesday: 11am - 12am\nWednesday: 11am - 12am\nThursday: 11am - 12am\nFriday: 11am - 12am\nSaturday: 11am - 12am\nSunday: 11am - 12am" 
   }, 
   { 
     "id": 69, 
     "name": "桥底茶室", 
     "opening_hours": "Monday: 7am - 4:30pm\nTuesday: 7am - 4:30pm\nWednesday: 7am - 4:30pm\nThursday: 7am - 4:30pm\nFriday: 7am - 4:30pm\nSaturday: 7am - 4:30pm\nSunday: 7am - 4:30pm" 
   }, 
   { 
     "id": 75, 
     "opening_hours": "Monday: 5pm - 1am\nTuesday: 5pm - 1am\nWednesday: 5pm - 1am\nThursday: 5pm - 1am\nFriday: 5pm - 1am\nSaturday: 5pm - 1am\nSunday: 5pm - 1am", 
     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSbD1tkAE1LF70FntiSYgZoGpaEYPNosne3_Q&s" 
   }, 
   { 
     "id": 77, 
     "name_en": "Nanyang Old Street", 
     "opening_hours": "Monday: 8am - 10pm\nTuesday: 8am - 10pm\nWednesday: 8am - 10pm\nThursday: 8am - 10pm\nFriday: 8am - 10pm\nSaturday: 8am - 10pm\nSunday: 8am - 10pm" 
   }, 
   { 
     "id": 78, 
     "name_en": "", 
     "opening_hours": "Monday: 7am - 6pm\nTuesday: 7am - 6pm\nWednesday: 7am - 6pm\nThursday: 7am - 6pm\nFriday: 7am - 6pm\nSaturday: 7am - 6pm\nSunday: 7am - 6pm" 
   }, 
   { 
     "id": 81, 
     "name": "甜秘•糖", 
     "opening_hours": "Monday: 11:30am - 9:30pm\nTuesday: 11:30am - 9:30pm\nWednesday: 11:30am - 9:30pm\nThursday: 11:30am - 9:30pm\nFriday: 11:30am - 9:30pm\nSaturday: 11:30am - 9:30pm\nSunday: 11:30am - 9:30pm" 
   }, 
   { 
     "id": 84, 
     "name_en": "", 
     "opening_hours": "Monday: 10am - 10pm\nTuesday: 10am - 10pm\nWednesday: 10am - 10pm\nThursday: Closed\nFriday: 10am - 10pm\nSaturday: 10am - 10pm\nSunday: 10am - 10pm", 
     "categories": [ 
       "健康餐" 
     ] 
   }, 
   { 
     "id": 85, 
     "name_en": "", 
     "opening_hours": "Monday: 10am - 9:30pm\nTuesday: 10am - 9:30pm\nWednesday: 10am - 9:30pm\nThursday: 10am - 9:30pm\nFriday: 10am - 9:30pm\nSaturday: 10am - 9:30pm\nSunday: 10am - 9:30pm", 
     "area": "Indahpura", 
     "categories": [ 
       "西餐", 
       "Cafe" 
     ] 
   }, 
   { 
     "id": 86, 
     "name": "Kopiloco", 
     "name_en": "", 
     "opening_hours": "Monday: 7:30am - 5:30pm\nTuesday: 7:30am - 5:30pm\nWednesday: 7:30am - 5:30pm\nThursday: 7:30am - 5:30pm\nFriday: 7:30am - 5:30pm\nSaturday: 7:30am - 5:30pm\nSunday: 7:30am - 5:30pm" 
   }, 
   { 
     "id": 88, 
     "name": "猫城茶餐厅", 
     "opening_hours": "Monday: 8am - 7pm\nTuesday: 8am - 7pm\nWednesday: 8am - 7pm\nThursday: 8am - 7pm\nFriday: 8am - 7pm\nSaturday: 8am - 7pm\nSunday: 8am - 7pm", 
     "image": "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcRNZRNCjciIKncODXygtUCAATIh26XV-rVg8A&s" 
   }, 
   { 
     "id": 89, 
     "name_en": "", 
     "opening_hours": "Monday: 3pm - 1am\nTuesday: 3pm - 1am\nWednesday: 3pm - 1am\nThursday: 3pm - 1am\nFriday: 3pm - 1am\nSaturday: 3pm - 1am\nSunday: 3pm - 1am", 
     "categories": [ 
       "酒吧", 
       "西餐" 
     ] 
   }, 
   { 
     "id": 90, 
     "name_en": "", 
     "opening_hours": "Monday: 3pm - 12:30am\nTuesday: 3pm - 12:30am\nWednesday: 3pm - 12:30am\nThursday: 3pm - 12:30am\nFriday: 3pm - 12:30am\nSaturday: 3pm - 12:30am\nSunday: 3pm - 12:30am" 
   }, 
   { 
     "id": 91, 
     "name": "港湾茶餐厅", 
     "name_en": "Restoran Q HOUSE", 
     "opening_hours": "Monday: 11am - 11pm\nTuesday: 11am - 11pm\nWednesday: 11am - 11pm\nThursday: 11am - 11pm\nFriday: 11am - 11pm\nSaturday: 11am - 11pm\nSunday: 11am - 11pm", 
     "categories": [ 
       "Cafe" 
     ] 
   }, 
   { 
     "id": 92, 
     "name_en": "", 
     "opening_hours": "Monday: 10am - 10pm\nTuesday: 10am - 10pm\nWednesday: Closed\nThursday: 10am - 10pm\nFriday: 10am - 10pm\nSaturday: 10am - 10pm\nSunday: 10am - 10pm", 
     "categories": [ 
       "酒吧" 
     ] 
   }, 
   { 
     "id": 96, 
     "opening_hours": "Monday: 7am - 5am\nTuesday: 7am - 5am\nWednesday: 7am - 5am\nThursday: 7am - 5am\nFriday: 7am - 5am\nSaturday: 7am - 5am\nSunday: 7am - 5am", 
     "categories": [ 
       "Cafe" 
     ] 
   }, 
   { 
     "id": 99, 
     "name_en": "", 
     "opening_hours": "Monday: 10am - 10pm\nTuesday: Closed\nWednesday: 10am - 10pm\nThursday: 10am - 10pm\nFriday: 10am - 10pm\nSaturday: 10am - 10pm\nSunday: 10am - 10pm", 
     "image": "https://www.shipba.biz/wp-content/uploads/2024/06/Khunya-Thai-Kitchen-M-Sdn-Bhd-Logo.jpg" 
   }, 
   { 
     "id": 100, 
     "opening_hours": "Monday: 10am - 10pm\nTuesday: 10am - 10pm\nWednesday: 10am - 10pm\nThursday: Closed\nFriday: 10am - 10pm\nSaturday: 10am - 10pm\nSunday: 10am - 10pm"
   }
];

let updatedCount = 0;
updates.forEach(update => {
    const restaurant = restaurants.find(r => r.id === update.id);
    if (restaurant) {
        Object.keys(update).forEach(key => {
            if (key !== 'id') {
                restaurant[key] = update[key];
            }
        });
        updatedCount++;
    } else {
        console.warn(`Restaurant with ID ${update.id} not found.`);
    }
});

console.log(`Updated ${updatedCount} restaurants.`);

const newContent = `export const initialRestaurants = ${JSON.stringify(restaurants, null, 2)};`;

fs.writeFileSync(restaurantsPath, newContent, 'utf8');
