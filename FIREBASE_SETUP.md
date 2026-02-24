# วิธีตั้งค่า Firebase สำหรับ Battle Mode

Battle Mode ใช้ Firebase Realtime Database เพื่อให้ผู้เล่นสองคนเชื่อมต่อและแข่งกันแบบ Real-time ได้

## ขั้นตอนการตั้งค่า

### 1. สร้างโปรเจกต์ Firebase

1. ไปที่ [Firebase Console](https://console.firebase.google.com/)
2. คลิก **Add project** หรือเลือกโปรเจกต์ที่มีอยู่
3. ตั้งชื่อโปรเจกต์แล้วคลิก Continue

### 2. เพิ่ม Web App

1. ไปที่ **Project Settings** (ไอคอนเฟือง)
2. ในส่วน **Your apps** คลิก **</>** (Web)
3. ตั้งชื่อ App แล้วคลิก **Register app**
4. คัดลอก object `firebaseConfig` ที่ได้

### 3. ตั้งค่า Realtime Database

1. ไปที่ **Build** > **Realtime Database**
2. คลิก **Create Database**
3. เลือก location: **asia-southeast1** (Singapore) — ใกล้ไทยที่สุด
4. เลือก **Start in test mode** (สำหรับพัฒนา)

### 4. ตั้งค่า Security Rules

ใน Realtime Database > Rules ใช้:

```json
{
  "rules": {
    "rooms": {
      ".read": true,
      ".write": true
    }
  }
}
```

หมายเหตุ: สำหรับ production ควรจำกัดการอ่าน/เขียนให้ปลอดภัยขึ้น

### 5. แก้ไขไฟล์ Config

เปิด `js/firebase-config.js` และแทนที่ค่าด้วย config จาก Firebase Console:

```javascript
const firebaseConfig = {
  apiKey: "AIza...",
  authDomain: "your-project.firebaseapp.com",
  databaseURL: "https://your-project-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "your-project",
  storageBucket: "your-project.appspot.com",
  messagingSenderId: "123456789",
  appId: "1:123456789:web:abc123"
};
```

**สำคัญ:** `databaseURL` ต้องตรงกับ region ที่สร้าง (asia-southeast1)

### 6. Deploy

สามารถ deploy ได้หลายวิธี:

- **GitHub Pages**: Push ขึ้น GitHub แล้วเปิด GitHub Pages
- **Netlify**: ลากโฟลเดอร์ไปที่ netlify.com/drop
- **Firebase Hosting**: `firebase init hosting` แล้ว `firebase deploy`

## การใช้งาน Battle Mode

1. **ผู้เล่น 1 (Host)**: เลือกหัวข้อ (ISC2 CC / Security+ / Vocabulary) → ใส่ชื่อ → สร้าง Room → ได้ Room Code
2. **ผู้เล่น 2 (Guest)**: ใส่ชื่อ → ใส่ Room Code → เข้าร่วม
3. **ทั้งคู่**: กด "พร้อม"
4. **Host**: กด "เริ่มเกม"
5. แข่งกันตอบคำถาม — ตอบเร็วและถูก = ทำความเสียหายมาก, ตอบผิด = เสียเลือดตัวเองมาก
