# Seat selection and featured catalogue update

Implemented locally in November 2026.

- CSS 3D seat shapes, perspective/angle control, zoom/reset, and a selection-preserving 2D toggle.
- Large, bright screen for movies; stage for concerts. Keyboard-labelled seat buttons, unavailable states, six-seat limit, per-seat prices and booking review.
- Guest users can inspect seating. Booking still requires signing in.
- The existing simulated checkout is explicitly labelled demo; raw card inputs and the unsupported frontend tax surcharge were removed. No payment provider was added.
- Six original local SVG demo posters and database-backed listings: Ramayana, Avengers: Doomsday, Dune 3, Anirudh Ravichander Live, Sai Abhyankkar Live, and A. R. Rahman Live.
- Each new listing has 48 seats. Dates, venues and prices are illustrative, not official announcements.

## Catalogue setup

From the project root, run `python backend/seed_featured_catalogue.py` against the configured local MySQL database. The script uses a transaction and advisory lock, skips previously seeded listings, and leaves existing booking inventory unchanged. Do not use the older reset scripts to add this catalogue.

The six listings have already been added to the local database. A second run verified that no duplicates were created.

## Verification

- Frontend production build passed. Existing large-bundle warning remains.
- Browser inspected at desktop and 390px mobile widths.
- Verified screen/stage visibility, regular/VIP seat selection, displayed totals and the 2D/3D switch.
- No actual booking/payment was submitted during browser verification.

## Scope remaining

The 3D view now uses Three.js/WebGL with orbit controls and eye-level selected-seat previews. The 2D map remains available. Layout is illustrative. The existing backend authentication, server-authoritative seat holds, payment integration, cancellation security, and deployment hardening still need separate work before public launch. Current selection does not reserve seats; the existing booking transaction is the final availability check.


## Full 3D auditorium upgrade

- Lazy-loaded Three.js scene with rounded seat models, tiered floor, centre aisle lights, purple room lighting, walls, ceiling panels and speakers.
- Drag to orbit the overview, scroll/pinch to zoom, or use rotate buttons.
- Select a seat, then choose it under "View from your selected seat". The camera moves to that seat's eye position and points at the screen. Drag to look around without moving out of the seat; "Face screen" restores the sightline.
- "Full seating view" returns to the overview without clearing tickets. "Enlarge theatre" opens a larger preview; Escape closes it.
- The screen displays the event's existing poster and title. If an external poster cannot load, the title remains visible.
- Seat geometry and camera positions share the same layout. The current room is illustrative, not a survey of a real theatre.
- WebGL failure offers the existing keyboard-accessible 2D seat map. Graphics resources are disposed on unmount.
- Production build and coordinate checks passed (seat count, aisle symmetry, tiered eye positions).
- Browser verification completed: direct 3D picking selected F7 and updated the total; F4 eye-level view showed the poster/title; rotation and Face screen worked; enlarged desktop and 390px mobile previews were inspected. Screenshot: seat-view-preview.png.
