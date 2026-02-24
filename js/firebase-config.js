/**
 * Firebase Configuration สำหรับ Battle Mode
 *
 * วิธีตั้งค่า:
 * 1. ไปที่ https://console.firebase.google.com/
 * 2. สร้างโปรเจกต์ใหม่ (หรือใช้ที่มีอยู่)
 * 3. ไปที่ Project Settings > General > Your apps > Add app > Web
 * 4. คัดลอก firebaseConfig มาวางแทนค่าด้านล่าง
 * 5. ไปที่ Build > Realtime Database > Create Database
 *    - เลือก location: asia-southeast1 (Singapore)
 *    - เริ่มต้นในโหมด Test
 * 6. ไปที่ Rules และตั้งค่า:
 *
 *    {
 *      "rules": {
 *        "rooms": {
 *          ".read": true,
 *          ".write": true
 *        }
 *      }
 *    }
 */
const firebaseConfig = {
  apiKey: "AIzaSyDvBPDeXbhgpD2Bzd1MXgeESwn4Noj_3nc",
  authDomain: "secpathz.firebaseapp.com",
  databaseURL: "https://secpathz-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "secpathz",
  storageBucket: "secpathz.firebasestorage.app",
  messagingSenderId: "962931450783",
  appId: "1:962931450783:web:07f761b6c3af93a95113aa",
  measurementId: "G-68NFBPTZBQ"
};

if (typeof firebase !== 'undefined' && firebaseConfig.apiKey) {
  try {
    firebase.initializeApp(firebaseConfig);
  } catch (e) {
    console.warn('Firebase init error:', e);
  }
}
