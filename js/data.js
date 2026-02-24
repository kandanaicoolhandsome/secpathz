// ===== Vocabulary Data =====
const VOCABULARY = [
  {
    term: 'Phishing',
    short: 'การหลอกลวงผ่านอีเมลหรือข้อความเพื่อขโมยข้อมูล',
    full: 'Phishing คือเทคนิคการโจมตีทางไซเบอร์ที่ผู้โจมตีปลอมตัวเป็นองค์กรที่น่าเชื่อถือ (เช่น ธนาคาร, บริการอีเมล) เพื่อหลอกให้เหยื่อเปิดลิงก์หรือแนบไฟล์ที่เป็นมัลแวร์ หรือกรอกข้อมูลสำคัญ เช่น รหัสผ่าน, หมายเลขบัตรเครดิต'
  },
  {
    term: 'Malware',
    short: 'ซอฟต์แวร์ที่เป็นอันตรายต่อระบบ',
    full: 'Malware (Malicious Software) คือโปรแกรมที่ออกแบบมาเพื่อสร้างความเสียหาย เช่น Virus, Worm, Trojan, Ransomware, Spyware แต่ละประเภทมีพฤติกรรมต่างกัน เช่น Ransomware จะเข้ารหัสไฟล์แล้วเรียกค่าไถ่'
  },
  {
    term: 'SIEM',
    short: 'ระบบรวบรวมและวิเคราะห์เหตุการณ์ความปลอดภัย',
    full: 'SIEM (Security Information and Event Management) คือแพลตฟอร์มที่รวบรวม Log จากหลายแหล่ง (Firewall, IDS/IPS, Endpoint, Email) มา Correlate และวิเคราะห์เพื่อตรวจจับภัยคุกคามและตอบสนองต่อเหตุการณ์ความปลอดภัย'
  },
  {
    term: 'IOC',
    short: 'ตัวบ่งชี้การถูกบุกรุก',
    full: 'IOC (Indicator of Compromise) คือหลักฐานที่บ่งบอกว่าระบบอาจถูกบุกรุก เช่น IP Address ที่เป็น malicious, Hash ของไฟล์มัลแวร์, Domain ที่ใช้ใน C2 (Command and Control), Pattern ใน Log ที่ผิดปกติ'
  },
  {
    term: 'SOC',
    short: 'ศูนย์ปฏิบัติการความปลอดภัย',
    full: 'SOC (Security Operations Center) คือทีมที่รับผิดชอบการตรวจสอบและตอบสนองต่อเหตุการณ์ความปลอดภัย 24/7 งานหลักรวมถึง Monitoring Alerts, Incident Response, Threat Hunting, และการรายงาน'
  },
  {
    term: 'EDR',
    short: 'โซลูชันตรวจจับและตอบสนองระดับ Endpoint',
    full: 'EDR (Endpoint Detection and Response) คือซอฟต์แวร์ที่ติดตั้งบน Endpoint (PC, Server) เพื่อเก็บและวิเคราะห์กิจกรรม เช่น Process, Network, File เพื่อตรวจจับและตอบสนองต่อภัยคุกคามขั้นสูง (APT)'
  }
];

// ===== Incident Scenarios =====
const INCIDENTS = [
  {
    id: 'INC-001',
    time: '00:47',
    scenario: 'Alert: Multiple failed login attempts (50+) จาก IP เดียวกัน ภายใน 5 นาที มาที่ User Account ของพนักงานฝ่าย HR',
    correct: 'escalate',
    explanation: 'พฤติกรรม Brute Force ชัดเจน — มีความเสี่ยงสูงที่ Account กำลังถูกโจมตี ควรเปิดเคสและแจ้งให้ User เปลี่ยนรหัสผ่านทันที'
  },
  {
    id: 'INC-002',
    time: '03:22',
    scenario: 'Alert: Port scan จาก IP ภายในเครือข่าย (Internal) ไปยัง Server หลายเครื่อง — Source เป็น IP ของเครื่องพิมพ์ในห้องประชุม',
    correct: 'ignore',
    explanation: 'IP ของเครื่องพิมพ์มักถูกใช้ร่วมกับอุปกรณ์อื่นหรือมี Firmware ที่ทำ Port scan โดยไม่ตั้งใจ — ถ้าไม่มี Alert อื่นที่เกี่ยวข้อง อาจเป็น False Positive ได้'
  },
  {
    id: 'INC-003',
    time: '14:15',
    scenario: 'Alert: User ดาวน์โหลดไฟล์ .exe จาก External URL ที่ไม่เคยเห็นมาก่อน และ Execute ทันที — User อยู่ในแผนก IT',
    correct: 'escalate',
    explanation: 'การดาวน์โหลดและ Execute ไฟล์จากแหล่งที่ไม่รู้จักมีความเสี่ยงสูง อาจเป็น Malware หรือ Phishing — แม้จะเป็น IT ก็ควรตรวจสอบ'
  },
  {
    id: 'INC-004',
    time: '09:00',
    scenario: 'Alert: Outbound connection ไปยัง IP ที่อยู่ใน Threat Intelligence Feed — แต่เป็น User ที่ทำงาน Remote จากต่างประเทศ (VPN) และ IP ปลายทางเป็น Office ของบริษัทในประเทศนั้น',
    correct: 'ignore',
    explanation: 'อาจเป็น Legitimate business connection — ควรตรวจสอบก่อนว่า IP ปลายทางเป็นขององค์กรที่รู้จักหรือไม่ ถ้าใช่และเป็นพฤติกรรมปกติของ User นั้น อาจเพิกเฉยได้'
  },
  {
    id: 'INC-005',
    time: '23:59',
    scenario: 'Alert: Ransomware signature detected — ไฟล์ถูกเข้ารหัสบนเครื่อง Workstation 1 เครื่อง และมี ransom note ปรากฏ',
    correct: 'escalate',
    explanation: 'Ransomware เป็นเหตุการณ์ร้ายแรง — ต้องเปิดเคสทันที, แยกเครื่องออกจากเครือข่าย, แจ้ง IR Team และเริ่มกระบวนการกู้คืน'
  }
];

// ===== Vocabulary Quiz (from VOCABULARY) =====
const VOCAB_QUESTIONS = [
  { term: 'Phishing', q: 'คำว่า Phishing หมายถึงอะไร?', options: ['การหลอกลวงผ่านอีเมลหรือข้อความเพื่อขโมยข้อมูล', 'ซอฟต์แวร์ที่เป็นอันตรายต่อระบบ', 'ระบบรวบรวมและวิเคราะห์เหตุการณ์ความปลอดภัย', 'ตัวบ่งชี้การถูกบุกรุก'], correct: 0, explanation: 'Phishing คือการหลอกลวงเพื่อขโมยข้อมูลสำคัญ' },
  { term: 'Malware', q: 'คำว่า Malware หมายถึงอะไร?', options: ['ซอฟต์แวร์ที่เป็นอันตรายต่อระบบ', 'การหลอกลวงผ่านอีเมล', 'ศูนย์ปฏิบัติการความปลอดภัย', 'โซลูชันระดับ Endpoint'], correct: 0 },
  { term: 'SIEM', q: 'SIEM มีหน้าที่หลักคืออะไร?', options: ['รวบรวมและวิเคราะห์ Log จากหลายแหล่ง', 'ป้องกันไวรัส', 'ทำลายมัลแวร์', 'กู้คืนข้อมูล'], correct: 0 },
  { term: 'IOC', q: 'IOC ย่อมาจากอะไร?', options: ['Indicator of Compromise', 'Information of Cyber', 'Input Output Control', 'Internal Operator Center'], correct: 0 },
  { term: 'SOC', q: 'SOC คืออะไร?', options: ['ศูนย์ปฏิบัติการความปลอดภัย', 'โปรแกรมป้องกันไวรัส', 'ระบบฐานข้อมูล', 'ทีมงานฝ่ายบุคคล'], correct: 0 },
  { term: 'EDR', q: 'EDR ติดตั้งไว้ที่ใด?', options: ['Endpoint (PC, Server)', 'Firewall', 'Cloud Gateway', 'User Profile'], correct: 0 },
  { term: 'Ransomware', q: 'Ransomware มีพฤติกรรมหลักอย่างไร?', options: ['เข้ารหัสไฟล์แล้วเรียกค่าไถ่', 'แอบขโมยรหัสผ่าน', 'ทำลายฮาร์ดดิสก์', 'แอบขุดบิทคอยน์'], correct: 0 },
  { term: '2FA', q: '2FA คืออะไร?', options: ['การยืนยันตัวตนสองขั้นตอน', 'การเข้ารหัสข้อมูลสองรอบ', 'การสำรองข้อมูลสองที่', 'การใช้รหัสผ่านสองอัน'], correct: 0 },
  { term: 'Firewall', q: 'Firewall ทำหน้าที่อะไร?', options: ['กรองทราฟฟิกเครือข่าย', 'เพิ่มความเร็วอินเทอร์เน็ต', 'ทำความสะอาดเครื่อง', 'เก็บข้อมูลไฟล์'], correct: 0 },
  { term: 'VPN', q: 'VPN มีไว้เพื่ออะไร?', options: ['สร้างอุโมงค์การเชื่อมต่อที่ปลอดภัย', 'โหลดไฟล์เร็วขึ้น', 'ป้องกันหน้าจอ', 'สแกนไวรัส'], correct: 0 },
  { term: 'Zero Day', q: 'Zero Day Exploit คืออะไร?', options: ['การโจมตีช่องโหว่ที่ยังไม่มีแพตช์แก้', 'การโจมตีในวันหยุด', 'การโจมตีที่ไม่มีดาเมจ', 'การโจมตีผ่านอีเมล'], correct: 0 },
  { term: 'Encryption', q: 'Encryption คือการทำอะไร?', options: ['การเข้ารหัสข้อมูลให้เป็นความลับ', 'การบีบอัดไฟล์', 'การส่งไฟล์ผ่านเน็ต', 'การเปลี่ยนชื่อไฟล์'], correct: 0 },
  { term: 'DDoS', q: 'DDoS คือการโจมตีแบบใด?', options: ['ส่งทราฟฟิกจำนวนมหาศาลเพื่อทำให้ระบบล่ม', 'การเดารหัสผ่าน', 'การขโมยบัตรเครดิต', 'การส่งสแปมเมล์'], correct: 0 },
  { term: 'Brute Force', q: 'Brute Force คืออะไร?', options: ['การสุ่มรหัสผ่านไปเรื่อยๆ จนกว่าจะถูก', 'การใช้ความรุนแรงกับเครื่อง', 'การเจาะกำแพงเพลิง', 'การดักฟังข้อมูล'], correct: 0 },
  { term: 'SQL Injection', q: 'SQL Injection โจมตีที่ใด?', options: ['ฐานข้อมูลผ่านช่องกรอกข้อมูล', 'ไฟล์รูปภาพ', 'สายแลน', 'หน้าจอ'], correct: 0 },
  { term: 'Trojan', q: 'Trojan Horse มีลักษณะอย่างไร?', options: ['แฝงตัวมากับโปรแกรมที่ดูปลอดภัย', 'วิ่งเร็วเหมือนม้า', 'ทำลายไฟล์ทันที', 'แอบขโมยจอ'], correct: 0 },
  { term: 'Spyware', q: 'Spyware มีหน้าที่อะไร?', options: ['แอบเก็บข้อมูลผู้ใช้', 'ช่วยสแกนไฟล์', 'เพิ่มประสิทธิภาพเครื่อง', 'บล็อกโฆษณา'], correct: 0 },
  { term: 'Patch', q: 'การลง Patch คือการทำอะไร?', options: ['การอัปเดตเพื่ออุดช่องโหว่', 'การเปลี่ยนธีมเครื่อง', 'การเพิ่มความจุแรม', 'การลบไฟล์ทิ้ง'], correct: 0 },
  { term: 'Audit', q: 'การทำ IT Audit คืออะไร?', options: ['การตรวจสอบระบบตามมาตรฐาน', 'การซ่อมคอมพิวเตอร์', 'การซื้ออุปกรณ์ใหม่', 'การจ้างพนักงาน'], correct: 0 },
  { term: 'Compliance', q: 'Compliance หมายถึงอะไร?', options: ['การปฏิบัติตามกฎระเบียบหรือมาตรฐาน', 'การแข่งขันทางธุรกิจ', 'การรวมบริษัท', 'การเลิกจ้าง'], correct: 0 }
];

// ===== Certification Questions =====
const CERT_QUESTIONS_ISC2_CC = [
  { q: 'ข้อใดคือความหมายของ CIA Triad?', options: ['Confidentiality, Integrity, Availability', 'Control, Integrity, Access', 'Cloud, Information, Asset', 'Cyber, Incident, Action'], correct: 0 },
  { q: 'MFA ย่อมาจากอะไร?', options: ['Multi-Factor Authentication', 'Main File Access', 'Mobile Fast Alert', 'Member Fire Authority'], correct: 0 },
  { q: 'P in PII stands for?', options: ['Personally', 'Public', 'Protected', 'Private'], correct: 0 },
  { q: 'Zero Trust มีคอนเซปต์ว่าอย่างไร?', options: ['Never trust, always verify', 'Trust but verify', 'Always trust internal', 'No security needed'], correct: 0 },
  { q: 'Social Engineering ใช้อะไรเป็นเครื่องมือหลัก?', options: ['จิตวิทยาการหลอกลวงมนุษย์', 'โปรแกรมเจาะรหัส', 'สายแลน', 'เครื่องแม่ข่าย'], correct: 0 },
  { q: 'Least Privilege หมายถึงอะไร?', options: ['ให้สิทธิ์เท่าที่จำเป็นต้องใช้', 'ให้สิทธิ์เข้าถึงทุกอย่าง', 'ไม่ให้สิทธิ์ใครเลย', 'ให้สิทธิ์เฉพาะผู้บริหาร'], correct: 0 },
  { q: 'BCP ย่อมาจากอะไร?', options: ['Business Continuity Plan', 'Basic Cyber Protection', 'Backup Control Power', 'Board Center Program'], correct: 0 },
  { q: 'Incident Response ขั้นตอนแรกคืออะไร?', options: ['Preparation', 'Detection', 'Eradication', 'Recovery'], correct: 0 },
  { q: 'Physical Security คือการป้องกันสิ่งใด?', options: ['อาคารและอุปกรณ์ทางกายภาพ', 'ไฟล์ในเครื่อง', 'ระบบเครือข่าย', 'รหัสผ่าน'], correct: 0 },
  { q: 'Asymmetric Encryption ใช้คีย์กี่ตัว?', options: ['2 ตัว (Public/Private)', '1 ตัว', '3 ตัว', 'ไม่ใช้คีย์'], correct: 0 },
  { q: 'OSI Model มีกี่เลเยอร์?', options: ['7 เลเยอร์', '5 เลเยอร์', '10 เลเยอร์', '4 เลเยอร์'], correct: 0 },
  { q: 'เลเยอร์ 3 ใน OSI คืออะไร?', options: ['Network', 'Transport', 'Data Link', 'Physical'], correct: 0 },
  { q: 'Protocol ที่ใช้สำหรับส่งหน้าเว็บอย่างปลอดภัยคือ?', options: ['HTTPS', 'FTP', 'Telnet', 'SMTP'], correct: 0 },
  { q: 'Port พื้นฐานของ HTTP คือ?', options: ['80', '443', '21', '22'], correct: 0 },
  { q: 'Port พื้นฐานของ HTTPS คือ?', options: ['443', '80', '25', '53'], correct: 0 },
  { q: 'DNS ทำหน้าที่อะไร?', options: ['เปลี่ยนชื่อโดเมนเป็น IP', 'กรองไวรัส', 'จัดเก็บไฟล์', 'ส่งอีเมล'], correct: 0 },
  { q: 'MAC Address มีความยาวกี่ Bit?', options: ['48-bit', '32-bit', '128-bit', '64-bit'], correct: 0 },
  { q: 'IPv4 มีความยาวกี่ Bit?', options: ['32-bit', '128-bit', '48-bit', '16-bit'], correct: 0 },
  { q: 'IPv6 มีความยาวกี่ Bit?', options: ['128-bit', '32-bit', '64-bit', '48-bit'], correct: 0 },
  { q: 'IDS ย่อมาจากอะไร?', options: ['Intrusion Detection System', 'Internal Data Security', 'Internet Design Standard', 'Incident Defense Solution'], correct: 0 }
];

const CERT_QUESTIONS_SECURITY_PLUS = [
  { q: 'DDoS โจมตีเลเยอร์ใดใน OSI บ่อยที่สุด?', options: ['Layer 3, 4, และ 7', 'Layer 1 และ 2', 'Layer 5 เท่านั้น', 'Layer 6 เท่านั้น'], correct: 0 },
  { q: 'Salt ในการเก็บรหัสผ่านช่วยป้องกันสิ่งใด?', options: ['Rainbow Table Attack', 'SQL Injection', 'Phishing', 'DDoS'], correct: 0 },
  { q: 'Diffie-Hellman ใช้สำหรับอะไร?', options: ['Key Exchange', 'File Transfer', 'Network Routing', 'Email Encryption'], correct: 0 },
  { q: 'Penetration Testing แบบ Black Box คือ?', options: ['ผู้ทดสอบไม่มีข้อมูลภายในเลย', 'ผู้ทดสอบรู้ผังเครือข่ายทั้งหมด', 'ผู้ทดสอบเป็นพนักงานไอที', 'การทดสอบเครื่องคอมพิวเตอร์สีดำ'], correct: 0 },
  { q: 'Vulnerability Scanner ทำหน้าที่อะไร?', options: ['ค้นหาคำตอบและจุดอ่อนในระบบ', 'แก้ไขโค้ดให้โดยอัตโนมัติ', 'ป้องกันการเข้าถึงเว็บไซต์', 'ลบมัลแวร์ออก'], correct: 0 },
  { q: 'CSIRT ย่อมาจากอะไร?', options: ['Computer Security Incident Response Team', 'Core System Information Recovery Tool', 'Cyber Scan Incident Report Task', 'Central Security Internal Review Team'], correct: 0 },
  { q: 'Air Gap คืออะไร?', options: ['การแยกเครือข่ายออกจากอินเทอร์เน็ตทางกายภาพ', 'การใช้พัดลมระบายอากาศ', 'ช่องว่างระหว่างสายแลน', 'การใช้คลื่นวิทยุ'], correct: 0 },
  { q: 'Steganography คืออะไร?', options: ['การซ่อนข้อมูลไว้ในไฟล์อื่น เช่น รูปภาพ', 'การเขียนโค้ดมัลแวร์', 'การดักรับข้อมูลกลางทาง', 'การเปลี่ยนชื่อไฟล์'], correct: 0 },
  { q: 'Honey Pot คืออะไร?', options: ['ระบบล่อเป้าเพื่อศึกษาพฤติกรรมผู้โจมตี', 'เซิร์ฟเวอร์สำรองข้อมูล', 'ระบบป้องกันน้ำผึ้ง', 'ชื่อมัลแวร์ประเภทหนึ่ง'], correct: 0 },
  { q: 'Cross-Site Scripting (XSS) คือการฉีดสิ่งใดเข้าหน้าเว็บ?', options: ['Script (เช่น JavaScript)', 'SQL Command', 'Email Address', 'Image File'], correct: 0 },
  { q: 'SIEM รวบรวมข้อมูลประเภทใดเป็นหลัก?', options: ['Log Files', 'Word Documents', 'User Photos', 'MP3 Files'], correct: 0 },
  { q: 'Symmetric Encryption ข้อเสียหลักคืออะไร?', options: ['การจัดการและแจกจ่าย Key อย่างปลอดภัย', 'ความเร็วช้า', 'ความปลอดภัยต่ำกว่ามาก', 'ใช้เนื้อที่เก็บข้อมูลเยอะ'], correct: 0 },
  { q: 'MD5 และ SHA-1 คืออัลกอริทึมประเภทใด?', options: ['Hashing', 'Encryption', 'Compression', 'Routing'], correct: 0 },
  { q: 'Rainbow Table คืออะไร?', options: ['ตารางเก็บค่า Hash ที่คำนวณไว้ล่วงหน้า', 'ผังเมืองไซเบอร์', 'ตารางสอนวิชาไอที', 'สัญลักษณ์บริษัท'], correct: 0 },
  { q: 'MITM ย่อมาจากอะไร?', options: ['Man-in-the-Middle', 'Main-Internal-Task-Manager', 'Member-Identity-Trace-Method', 'Module-Integration-Test-Mode'], correct: 0 },
  { q: 'Replay Attack คือการโจมตีแบบใด?', options: ['ดักจับข้อมูลแล้วส่งซ้ำเพื่อสวมสิทธิ์', 'การโจมตีเครื่องเล่นแผ่นเสียง', 'การย้อนเวลาไปเจาะระบบ', 'การปิดระบบซ้ำๆ'], correct: 0 },
  { q: 'Pharming แตกต่างจาก Phishing อย่างไร?', options: ['หลอกที่ระดับ DNS/Technical เพื่อส่งไปยังเว็บปลอม', 'ใช้โทรศัพท์โทรหา', 'ใช้คนไปหาที่บ้าน', 'ใช้ของรางวัลล่อ'], correct: 0 },
  { q: 'BYOD ย่อมาจากอะไร?', options: ['Bring Your Own Device', 'Buy Your Old Disk', 'Back Your Online Data', 'Binary Year Output Design'], correct: 0 },
  { q: 'RTO ย่อมาจากอะไร?', options: ['Recovery Time Objective', 'Real Time Operation', 'Remote Task Option', 'Read Total Online'], correct: 0 },
  { q: 'Data Loss Prevention (DLP) มีหน้าที่อะไร?', options: ['ป้องกันข้อมูลสำคัญรั่วไหลออกนอกองค์กร', 'กู้ข้อมูลที่ถูกลบ', 'ลบข้อมูลขยะ', 'ความสวยงามของฐานข้อมูล'], correct: 0 }
];

