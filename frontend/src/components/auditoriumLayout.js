// Shared coordinates keep seat picking and seated eye positions consistent.
export function auditoriumLayout(seats) {
  const rows = [...new Set(seats.map(s => s.row_label))].sort((a,b) => a.localeCompare(b, undefined, {numeric:true}));
  const count = Math.max(8, ...rows.map(row => seats.filter(s => s.row_label === row).length));
  const width = count * 1.12 + 4;
  const positioned = rows.flatMap((row, r) => {
    const group = seats.filter(s => s.row_label === row).sort((a,b) => a.seat_number-b.seat_number);
    return group.map((seat,i) => ({...seat, x:(i-(group.length-1)/2)*1.12+(i < Math.ceil(group.length/2) ? -.5 : .5), y:r*.32, z:5+r*1.65}));
  });
  return {rows, seats:positioned, width, depth:Math.max(16, 8+rows.length*1.65), screenWidth:width-3, screenY:4.4};
}
export function eyePosition(seat) { return {x:seat.x, y:seat.y+1.22, z:seat.z-.12}; }
