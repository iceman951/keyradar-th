# GitHub Copilot Instructions

## หลักการทั่วไป

- ใช้ Conventional Commits สำหรับ commit message ทุกครั้ง
- เขียน commit message ให้กระชับ ชัดเจน และมีประโยชน์

## กฎการสร้าง Commit Message

เมื่อถูกขอให้ generate commit message หรือสร้าง commit ให้ใช้รูปแบบดังนี้:

```
<type>: <ข้อความสั้น ๆ>
```

### ประเภทที่แนะนำ (Type)

- **feat**: เพิ่มฟีเจอร์ใหม่
- **fix**: แก้ bug หรือปัญหา
- **enhance**: ปรับปรุง/เสริมความสามารถของโค้ดที่มีอยู่ (ไม่ใช่ bug fix หรือ feature ใหม่)
- **chore**: งาน routine, maintenance, refactoring, update dependencies, formatting
- **docs**: เปลี่ยนแปลงเอกสาร (README, comments, etc.)
- **style**: ปรับ formatting, whitespace, semicolon
- **refactor**: Refactor โค้ดโดยไม่เปลี่ยนพฤติกรรม
- **perf**: ปรับปรุง performance
- **test**: เพิ่มหรือแก้ test
- **build**: เปลี่ยนแปลงระบบ build หรือ CI/CD
- **ci**: เปลี่ยนแปลง configuration ของ CI/CD

### ตัวอย่าง Commit Message

- `feat: add user authentication module`
- `fix: resolve login timeout issue`
- `enhance: improve dashboard loading speed`
- `chore: update dependencies and cleanup`
- `docs: update installation guide`
- `refactor: simplify user service logic`

### แนวทางการเขียนที่ดี

- ใช้ present tense (add, fix, improve)
- ตัวแรกของข้อความหลัง `:` ใช้ตัวพิมพ์เล็ก
- ไม่ต้องใส่จุด (.) ท้ายประโยค
- ถ้ามี scope สามารถใส่ได้ เช่น `feat(auth): add OAuth support`
- ถ้า commit เกี่ยวข้องกับ ticket ให้ใส่ท้าย เช่น `(closes #123)`

Copilot ควรปฏิบัติตามกฎนี้โดยอัตโนมัติเมื่อเกี่ยวข้องกับการ commit