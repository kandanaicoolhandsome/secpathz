# SecPathz - A Cybersecurity Knowledge Framework

เว็บแพลตฟอร์มฝึกทักษะ SOC Analyst — ปูพื้นฐานจากทฤษฎีสู่การปฏิบัติจริง

## วิธีใช้งาน

1. เปิดไฟล์ `index.html` ในเบราว์เซอร์ (ดับเบิลคลิกหรือเปิดผ่าน browser)
2. หรือใช้ Live Server ใน VS Code เพื่อรัน local server

## โมดูลที่มี

| โมดูล | รายละเอียด |
|-------|------------|
| **General Vocabulary** | คลิกการ์ดเพื่อดูคำอธิบายศัพท์เทคนิค (Phishing, Malware, SIEM, IOC, SOC, EDR) |
| **SIEM Operations** | Dashboard จำลอง + Query Editor สำหรับฝึกเขียน Query |
| **Incident Scenarios** | 5 สถานการณ์จำลอง — ตัดสินใจเปิดเคสหรือเพิกเฉย พร้อมเฉลย |
| **Certification Prep** | 5 ข้อสอบแนว ISC2 CC / Security+ พร้อมเฉลยภาษาไทย |
| **Gamification** | Leaderboard (บันทึกคะแนนใน LocalStorage) + Battle Mode (สร้าง Room Code) |

## โครงสร้างไฟล์

```
├── index.html      # หน้าหลัก
├── css/
│   └── styles.css  # สไตล์
├── js/
│   ├── data.js     # ข้อมูล (คำศัพท์, สถานการณ์, ข้อสอบ)
│   └── app.js      # Logic หลัก
└── README.md
```

## หมายเหตุ

- Battle Mode ในเวอร์ชันนี้เป็น UI จำลอง — การประลอง Real-time ต้องใช้ Backend (WebSocket) เพิ่มเติม
- Leaderboard เก็บใน LocalStorage ของเบราว์เซอร์
