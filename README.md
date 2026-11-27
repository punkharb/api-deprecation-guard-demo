# API Deprecation Guard — oasdiff demo (G13)

Demo สั้นๆ ให้อาจารย์ดูว่า **oasdiff คืออะไร ทำอะไรได้ ทำอะไรไม่ได้** และ **ส่วนที่กลุ่มจะเติม** คืออะไร

## Setup (ครั้งเดียว)

```powershell
go install github.com/oasdiff/oasdiff@latest   # ได้ oasdiff v1.40.0 ที่ ~/go/bin
```
ต้องมี Node.js 22.18+ (รัน TypeScript ได้ตรงๆ ไม่ต้องติดตั้งอะไรเพิ่ม)

## รัน demo

```powershell
cd demo
npm run demo      # 3 scenarios, กด Enter ทีละอัน
npm test          # unit test ของตัววิเคราะห์ผลกระทบ (5 tests)
```

## ไฟล์

| ไฟล์ | คืออะไร |
|---|---|
| `specs/base.yaml` | Shop API v1 — `GET /users/{id}` คืน `id, name, phone, email`, และ `GET /orders` |
| `specs/1-remove.yaml` | ลบ `phone` และลบ `/orders` ทิ้งเลย **ไม่ deprecate ก่อน** |
| `specs/2-deprecate.yaml` | ยังไม่ลบ แค่ mark `/orders` เป็น `deprecated: true` + `x-sunset: 2027-06-01` |
| `specs/3-rename.yaml` | เปลี่ยนชื่อ `phone` → `phoneNumber` |
| `impact/usage.json` | ข้อมูลจำลองว่าแอปไหนอ่าน field ไหน (ของจริงจะมาจาก SDK + SQLite) |
| `impact/analyze.ts` | **ส่วนของกลุ่ม**: join ผล oasdiff กับ usage → บอกว่าแอปไหนพัง |

แอปจำลอง: **A** อ่าน `name` · **B** อ่าน `name, phone` · **C** อ่าน `id` · **D** เรียก `/orders` อ่าน `total`

## ผลที่ได้จริง (oasdiff v1.40.0)

| Scenario | `oasdiff breaking -o ERR` | oasdiff บอกว่า | ส่วนของเราบอกว่า |
|---|---|---|---|
| 1. ลบไม่ deprecate | **exit 1 → PR fail** | `api-path-removed-without-deprecation` (error) + ลบ `phone` เป็นแค่ **info** | **B พัง** (phone), **D พัง** (/orders) · A, C ไม่ต้องแจ้ง |
| 2. deprecate + sunset | exit 0 → PR ผ่าน | `endpoint-deprecated-with-sunset` (info) | **D** ได้ notice ให้ย้ายก่อน 2027-06-01 · A, B, C ไม่ต้องแจ้ง |
| 3. rename | exit 0 → **PR ผ่าน** | ลบ `phone` + เพิ่ม `phoneNumber` (info ทั้งคู่) | **B พัง** · A, C, D ไม่ต้องแจ้ง |

## Talk track (~5 นาที)

1. **oasdiff คืออะไร** — CLI เปรียบเทียบ OpenAPI spec สองเวอร์ชัน แยกประเภทการเปลี่ยนแปลงเป็น error / warning / info มีกฎหลายร้อยข้อ (`oasdiff checks changelog` แสดง 784 รายการใน v1.40.0) ใช้ใน CI ได้ (`-o ERR` คืน exit code 1 ให้ PR fail) และออก JSON ได้ให้โปรแกรมอื่นอ่านต่อ
2. **สิ่งที่มันทำได้ดี** (Scenario 1 vs 2) — จับได้ว่าลบ endpoint โดยไม่ deprecate ก่อน และรู้จัก deprecated + sunset date → นี่คือเหตุผลที่กลุ่มใช้ oasdiff เป็นฐาน ไม่เขียนใหม่
3. **สิ่งที่มันไม่รู้** (Scenario 1 และ 3) — การลบ field `phone` ใน response ถูกนับเป็นแค่ **info** เพราะในมุมของ spec field นั้น optional → PR ผ่าน **แต่แอป B ที่อ่าน `phone` พังจริง** oasdiff ไม่มีทางรู้ เพราะมันไม่รู้ว่าใครใช้ API อยู่
4. **ส่วนที่กลุ่มเติม** — เอา JSON ของ oasdiff มา join กับข้อมูล field-usage → บอกได้ว่า *แอปไหน* พัง แจ้งเฉพาะทีมนั้น ทีมอื่นไม่โดน noise แล้วติดตามว่าทีมย้ายเสร็จก่อน sunset หรือยัง
5. **ของจริงต่อจาก demo นี้** — `usage.json` จะถูกแทนด้วย SDK (JavaScript Proxy จับว่าแอปอ่าน field ไหน) + SQLite, ผลส่งเป็น PR comment ผ่าน GitHub Actions และ notice ไป Slack/LINE พร้อม Deprecation (RFC 9745) / Sunset (RFC 8594) header

## ข้อจำกัดที่พบจาก demo (ใส่ในรายงานได้)

- ขอบเขตตัววิเคราะห์ตอนนี้: ลบ endpoint, ลบ field, field ที่ oasdiff ให้เป็น error (เช่นเปลี่ยน type), และ deprecated endpoint · field ซ้อน (`items/total`) เทียบแค่ชื่อท้ายสุด ถ้ามีชื่อซ้ำคนละระดับอาจแจ้งเกิน

- oasdiff ใส่ชื่อ field ไว้แค่ใน `text` (เช่น ``removed the optional property `phone` ...``) ไม่มีเป็น field แยกใน JSON → ตอนนี้ใช้ regex ดึง ถ้า oasdiff เปลี่ยนข้อความจะพัง ทางแก้ระยะยาว: ใช้ `oasdiff diff -f json` ที่เป็นโครงสร้าง
- rename ถูกมองเป็นลบ + เพิ่ม ตรงกับความเสี่ยงที่เขียนไว้ใน technical profile (อาจใช้ LLM ช่วยเดาว่าเป็น rename และเสนอ replacement — ตอบ comment อาจารย์เรื่องงาน LLM ได้)
- oasdiff license: Apache-2.0 (ตรวจจากไฟล์ LICENSE ของ v1.40.0 แล้ว) ใช้ในโปรเจกต์ได้
