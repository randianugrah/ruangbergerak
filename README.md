# VOLUME — Scroll-driven 3D (GSAP + ScrollTrigger) — by randpill

Website satu halaman dengan animasi 3D yang sepenuhnya dikendalikan posisi scroll.
Tanpa WebGL, tanpa build step, tanpa framework: hanya CSS 3D transform + GSAP ScrollTrigger.

## Jalankan

```bash
cd gsap-3d-scroll
python3 -m http.server 8788     # atau: npx serve .
# buka http://localhost:8788
```

Buka langsung lewat `file://` juga jalan karena library di-vendor lokal (`vendor/`),
tapi server lokal lebih disarankan.

## Struktur

```
gsap-3d-scroll/
├── index.html          # markup tiap section
├── css/style.css       # semua transform 3D, perspective, theme
├── js/main.js          # Lenis + 12 blok ScrollTrigger (ada komentar per blok)
└── vendor/             # gsap 3.13, ScrollTrigger, lenis 1.1 (offline)
```

## Yang terjadi di tiap section

| Section | Teknik GSAP | Efek 3D |
|---|---|---|
| Hero | timeline intro + scrub | lantai grid `rotateX 70°→86°`, 3 panel melayang dengan kedalaman `z` berbeda, judul terdorong `z -520` |
| Manifest | `data-split` per kata | kata berputar `rotationX -90°→0` sambil maju dari `z -160` |
| Kubus | `pin` + `scrub`, end `+=220%` | kubus 6 sisi berputar penuh di 2 sumbu, zoom `z -260→180` |
| Lapisan | `pin`, 5 elemen bertahap | kamera menembus 5 bidang dari `z -1400` ke `z 600` |
| Galeri | `pin` + x-translate | scroll vertikal jadi horizontal; kartu miring sesuai jarak ke tengah layar (`quickTo`) |
| Cincin | `pin` + `rotationY -720°` | 8 panel di silinder: `rotateY(i·45°)` + `transform-origin z = -radius` |

## Catatan teknis

- **Smooth scroll** pakai Lenis, disinkronkan ke `gsap.ticker` dan `ScrollTrigger.update`
  supaya scrub tidak tersendat.
- **Ukuran kubus responsif**: `translateZ` tiap sisi memakai variabel `--half` yang
  di-update `ResizeObserver` (setengah lebar aktual kubus).
- **Radius cincin** dihitung `w / 2 / tan(π / n)` agar panel tidak saling menembus.
- **Performa**: tilt kartu hanya dihitung saat section galeri berada di viewport
  (`ScrollTrigger.onToggle` → flag `live`).
- **Aksesibilitas**: `prefers-reduced-motion: reduce` mematikan Lenis, membunuh semua
  ScrollTrigger, dan menampilkan konten pada state akhir.
- Panjang scroll galeri `invalidateOnRefresh: true` → ikut menyesuaikan saat resize.
