# Happy Birthday, Putri Nazwa 🎂

Kejutan ulang tahun berbentuk web (Next.js): splash → teks matrix → starfield → **photobook yang bisa dibalik** → hati penuh foto.

## Menjalankan

```bash
npm install
npm run dev
```

Buka http://localhost:3000.

## Mengganti isi photobook

Halaman photobook ada di `public/photobook/01.webp` … `18.webp` (+ `cover-inset.webp` untuk foto di sampul) (rasio 4:5, hasil render dari PDF).
Untuk memakai PDF lain, render ulang setiap halaman PDF ke folder itu dengan nama yang sama,
lalu sesuaikan jumlah halaman di `components/BookScene.js` (`PHOTO_COUNT`).
