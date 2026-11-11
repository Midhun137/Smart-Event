import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { auditoriumLayout, eyePosition } from './auditoriumLayout';

export default function Auditorium3D({ seats, selected, onToggle, event, disabled, onFallback }) {
  const host = useRef(null), runtime = useRef(null), latest = useRef({onToggle, disabled});
  latest.current = {onToggle, disabled};
  const [expanded, setExpanded] = useState(false);
  useEffect(() => {
    if (!expanded) return;
    const previous = document.body.style.overflow; document.body.style.overflow = 'hidden';
    const escape = e => { if (e.key === 'Escape') setExpanded(false); };
    window.addEventListener('keydown', escape);
    return () => { document.body.style.overflow = previous; window.removeEventListener('keydown', escape); };
  }, [expanded]);
  const [viewSeat, setViewSeat] = useState(''), [failure, setFailure] = useState(''), [hover, setHover] = useState('');
  const selectedSeats = seats.filter(s => selected.includes(s.event_seat_id));
  const activeSeat = selected.includes(Number(viewSeat)) ? viewSeat : '';

  useEffect(() => {
    const container = host.current;
    let renderer;
    try { renderer = new THREE.WebGLRenderer({antialias:true, alpha:false}); }
    catch { setFailure('3D graphics are unavailable on this device. You can still choose seats in the 2D map.'); return; }
    let disposed = false;
    const layout = auditoriumLayout(seats), scene = new THREE.Scene();
    scene.background = new THREE.Color('#090913');
    const camera = new THREE.PerspectiveCamera(50,1,.05,200);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio,2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    container.appendChild(renderer.domElement);
    renderer.domElement.setAttribute('aria-label','Interactive 3D auditorium. Drag to rotate; select seats with the 2D map for keyboard access.');
    const controls = new OrbitControls(camera,renderer.domElement);
    controls.enableDamping = false; controls.enablePan = false;
    controls.minPolarAngle=.18; controls.maxPolarAngle=1.38;
    controls.minDistance=8; controls.maxDistance=55;
    const render = () => { if (!disposed) renderer.render(scene,camera); };
    controls.addEventListener('change',render);
    scene.add(new THREE.HemisphereLight(0xc8c8ff,0x292035,2.3));
    const light = new THREE.DirectionalLight(0xf1deff,3); light.position.set(0,10,5);scene.add(light);
    const purple = new THREE.PointLight(0xa36bff,85,35);purple.position.set(0,6,layout.depth/2);scene.add(purple);
    const materials = [], geometries = [], textures = [];
    const material = (color,emissive=false) => { const m = emissive ? new THREE.MeshBasicMaterial({color}) : new THREE.MeshStandardMaterial({color,roughness:.65,metalness:.15}); materials.push(m);return m; };
    const floorMat = material('#161320'), wallMat = material('#282036'), edgeMat = material('#a38bff',true), armMat = material('#211b31');
    const box = (w,h,d,x,y,z,mat,parent=scene) => { const g=parent.userData.isSeat ? new RoundedBoxGeometry(w,h,d,3,Math.min(.08,w/4,h/4,d/4)) : new THREE.BoxGeometry(w,h,d);geometries.push(g);const m=new THREE.Mesh(g,mat);m.position.set(x,y,z);parent.add(m);return m; };
    box(layout.width,.2,layout.depth,0,-.2,layout.depth/2,floorMat);
    const shell = new THREE.Group();scene.add(shell);
    box(.22,8,layout.depth,-layout.width/2,3.8,layout.depth/2,wallMat,shell);
    box(.22,8,layout.depth,layout.width/2,3.8,layout.depth/2,wallMat,shell);
    box(layout.width,.22,layout.depth,0,7.8,layout.depth/2,wallMat,shell);
    box(layout.width,8,.2,0,3.8,-.5,wallMat);
    for(let z=2;z<layout.depth;z+=3) {
      for(const side of [-1,1]) {
        box(.05,4,.1,side*(layout.width/2-.15),3.7,z,edgeMat,shell);
        box(.5,.65,.4,side*(layout.width/2-.4),5.5,z,armMat,shell);
        box(.2,.03,.2,side*layout.width*.26,7.65,z,edgeMat,shell);
      }
      box(2,.12,1.2,0,7.6,z,armMat,shell);
    }
    const screenCanvas=document.createElement('canvas');screenCanvas.width=1600;screenCanvas.height=900;
    const ctx=screenCanvas.getContext('2d');const screenTexture=new THREE.CanvasTexture(screenCanvas);screenTexture.colorSpace=THREE.SRGBColorSpace;textures.push(screenTexture);
    const paintScreen = image => {
      ctx.fillStyle='#17182e';ctx.fillRect(0,0,1600,900);
      const gradient=ctx.createLinearGradient(0,0,1600,900);gradient.addColorStop(0,'#47416e');gradient.addColorStop(1,'#101828');ctx.fillStyle=gradient;ctx.fillRect(0,0,1600,900);
      if(image){const h=740,w=h*image.width/image.height;ctx.drawImage(image,80,80,Math.min(w,650),h);}
      ctx.fillStyle='#c5b2ff';ctx.font='24px sans-serif';ctx.fillText(/concert/i.test(event.category_name)?'SMARTEVENT • LIVE ON STAGE':'SMARTEVENT • NOW SHOWING',image?750:150,240);
      ctx.fillStyle='#ffffff';ctx.font='bold 68px sans-serif';
      const words=event.title.split(' ');let line='',y=360;const x=image?750:150,max=image?770:1300;
      words.forEach(word=>{if(ctx.measureText(line+word).width>max&&line){ctx.fillText(line.trim(),x,y);line='';y+=85;}line+=word+' ';});ctx.fillText(line.trim(),x,y);
      ctx.font='26px sans-serif';ctx.fillStyle='#d0c9e3';ctx.fillText('YOUR SEAT. YOUR EXPERIENCE.',x,700);
      ctx.font='20px sans-serif';ctx.fillStyle='#aaa4bc';ctx.fillText('Illustrative auditorium preview',x,750);
      screenTexture.needsUpdate=true;render();
    };
    paintScreen(null);
    const poster=new Image();poster.crossOrigin='anonymous';poster.onload=()=>{if(!disposed)paintScreen(poster);};poster.onerror=()=>{};if(event.banner_url)poster.src=event.banner_url;
    const screenHeight=layout.screenWidth*9/16;
    box(layout.screenWidth+.35,screenHeight+.35,.22,0,layout.screenY,0,material('#777085'));
    const screenMaterial=new THREE.MeshBasicMaterial({map:screenTexture});materials.push(screenMaterial);
    const screenGeo=new THREE.PlaneGeometry(layout.screenWidth,screenHeight);geometries.push(screenGeo);
    const screen=new THREE.Mesh(screenGeo,screenMaterial);screen.position.set(0,layout.screenY,.13);scene.add(screen);
    const seatGroups = new Map(), hitTargets=[];
    layout.rows.forEach((row,r)=>{
      box(layout.width-.5,.2+r*.32,1.65,0,(r*.32)/2-.08,5+r*1.65,floorMat);
      for(const side of [-1,1])box(.05,.025,1.4,side*.45,r*.32+.035,5+r*1.65,edgeMat);
    });
    layout.seats.forEach(seat=>{
      const group=new THREE.Group();group.userData.isSeat=true;group.position.set(seat.x,seat.y,seat.z);scene.add(group);
      const upholstery=material('#514261');
      box(.78,.72,.18,0,.86,.32,upholstery,group);
      box(.78,.18,.65,0,.45,-.03,upholstery,group);
      box(.12,.32,.7,-.46,.51,0,armMat,group);box(.12,.32,.7,.46,.51,0,armMat,group);
      box(.15,.35,.15,-.27,.18,.1,armMat,group);box(.15,.35,.15,.27,.18,.1,armMat,group);
      const labelCanvas=document.createElement('canvas');labelCanvas.width=128;labelCanvas.height=64;const lc=labelCanvas.getContext('2d');lc.fillStyle='#e8e0ff';lc.font='bold 28px sans-serif';lc.textAlign='center';lc.fillText(`${seat.row_label}${seat.seat_number}`,64,42);
      const tex=new THREE.CanvasTexture(labelCanvas);textures.push(tex);const lm=new THREE.MeshBasicMaterial({map:tex,transparent:true,side:THREE.DoubleSide});materials.push(lm);
      const lg=new THREE.PlaneGeometry(.55,.25);geometries.push(lg);const label=new THREE.Mesh(lg,lm);label.position.set(0,1,.416);group.add(label);
      group.traverse(obj=>{if(obj.isMesh){obj.userData.seat=seat;hitTargets.push(obj);}});
      seatGroups.set(seat.event_seat_id,{group,upholstery,seat});
    });
    let mode='', yaw=0,pitch=0,eye=null,down=null;
    const look = () => { const direction=new THREE.Vector3(Math.sin(yaw)*Math.cos(pitch),Math.sin(pitch),-Math.cos(yaw)*Math.cos(pitch));camera.lookAt(camera.position.clone().add(direction));render(); };
    const faceScreen=()=>{const dx=-eye.x,dy=layout.screenY-eye.y,dz=-eye.z; yaw=Math.atan2(dx,-dz);pitch=Math.atan2(dy,Math.hypot(dx,dz));look();};
    const overview=()=>{
      mode='';shell.visible=false;seatGroups.forEach(({group})=>group.visible=true);controls.enabled=true;camera.fov=50;camera.updateProjectionMatrix();
      const distance=Math.max(layout.depth*.85,layout.width/Math.max(camera.aspect,.4)*1.1);
      controls.target.set(0,1.5,layout.depth*.42);camera.position.set(layout.width*.45,distance*.65,layout.depth*.42+distance);controls.update();render();
    };
    const preview=id=>{const item=seatGroups.get(Number(id));if(!item){overview();return;}mode=String(id);controls.enabled=false;shell.visible=true;seatGroups.forEach(({group})=>group.visible=true);item.group.visible=false;eye=eyePosition(item.seat);camera.position.set(eye.x,eye.y,eye.z);camera.fov=65;camera.updateProjectionMatrix();faceScreen();};
    const raycaster=new THREE.Raycaster();const mouse=new THREE.Vector2();
    const hit=e=>{const rect=renderer.domElement.getBoundingClientRect();mouse.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);raycaster.setFromCamera(mouse,camera);return raycaster.intersectObjects(hitTargets,false)[0]?.object.userData.seat;};
    const pointerDown=e=>{down={x:e.clientX,y:e.clientY,lastX:e.clientX,lastY:e.clientY,moved:false};if(mode)renderer.domElement.setPointerCapture(e.pointerId);};
    const pointerMove=e=>{
      if(down){if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>5)down.moved=true;if(mode){yaw-=(e.clientX-down.lastX)*.004;pitch=THREE.MathUtils.clamp(pitch+(e.clientY-down.lastY)*.003,-.65,1);look();}down.lastX=e.clientX;down.lastY=e.clientY;}
      if(!mode){const seat=hit(e);setHover(seat?`${seat.row_label}${seat.seat_number} · ${seat.section} · ₹${seat.price} · ${seat.status.toLowerCase()}`:'');renderer.domElement.style.cursor=seat?.status==='AVAILABLE'?'pointer':'grab';}
    };
    const pointerUp=e=>{if(down&&!down.moved&&!mode&&!latest.current.disabled){const seat=hit(e);if(seat?.status==='AVAILABLE')latest.current.onToggle(seat);}down=null;};
    const cancel=()=>{down=null;};
    renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointermove',pointerMove);renderer.domElement.addEventListener('pointerup',pointerUp);renderer.domElement.addEventListener('pointercancel',cancel);
    const lost=e=>{e.preventDefault();setFailure('The 3D graphics connection was lost. Please use the 2D map or reload.');};renderer.domElement.addEventListener('webglcontextlost',lost);
    const resize=()=>{const {width,height}=container.getBoundingClientRect();if(!width||!height)return;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height);if(!mode)overview();else render();};
    const observer=new ResizeObserver(resize);observer.observe(container);
    runtime.current={preview,overview,render,seatGroups,rotate:delta=>{if(mode){yaw+=delta;look();}else {const offset=camera.position.clone().sub(controls.target);offset.applyAxisAngle(new THREE.Vector3(0,1,0),delta);camera.position.copy(controls.target).add(offset);controls.update();}},face:()=>{if(mode)faceScreen();else overview();}};
    resize();
    return ()=>{disposed=true;runtime.current=null;observer.disconnect();controls.dispose();poster.onload=null;poster.onerror=null;renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointermove',pointerMove);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('pointercancel',cancel);renderer.domElement.removeEventListener('webglcontextlost',lost);geometries.forEach(g=>g.dispose());materials.forEach(m=>m.dispose());textures.forEach(t=>t.dispose());renderer.dispose();renderer.domElement.remove();};
  },[seats,event]);
  useEffect(()=>{
    runtime.current?.seatGroups.forEach(({seat,upholstery})=>{upholstery.color.set(seat.status!=='AVAILABLE'?'#242633':selected.includes(seat.event_seat_id)?'#aa70ff':seat.section==='VIP'?'#b18a4b':'#66527f');upholstery.emissive.set(selected.includes(seat.event_seat_id)?'#38155f':'#000000');});
    runtime.current?.render();
  },[selected,seats,event]);
  useEffect(()=>{if(activeSeat)runtime.current?.preview(activeSeat);else runtime.current?.overview();},[activeSeat,seats,event]);
  return <div className={`theatre3d ${expanded ? 'theatre3d-expanded' : ''}`}>
    <div className="theatre3d-top"><button className="theatre3d-expand" onClick={()=>setExpanded(v=>!v)}>{expanded ? '✕ Close large view' : '⛶ Enlarge theatre'}</button><span>{activeSeat ? `SEATED VIEW · ${selectedSeats.find(s=>String(s.event_seat_id)===activeSeat)?.row_label}${selectedSeats.find(s=>String(s.event_seat_id)===activeSeat)?.seat_number}` : 'EXPLORE THE AUDITORIUM'}</span><span>{/concert/i.test(event.category_name)?'STAGE':'SCREEN'} at the front</span></div>
    {failure ? <div className="seat-empty" role="alert">{failure}<button className="seat-edit" onClick={onFallback}>Use 2D map</button></div> : <div ref={host} className="theatre3d-canvas" />}
    <p className="theatre3d-hint" role="status">{activeSeat?'Drag to look around from your seat. Face screen restores your sightline.':hover||'Drag to rotate · Scroll or pinch to zoom · Click a seat to select'}</p>
    <div className="theatre3d-actions"><button onClick={()=>runtime.current?.rotate(-.2)} aria-label="Rotate camera left">↶ Rotate left</button><button onClick={()=>runtime.current?.rotate(.2)} aria-label="Rotate camera right">Rotate right ↷</button><button onClick={()=>runtime.current?.face()}>Face screen</button><button onClick={()=>{setViewSeat('');runtime.current?.overview();}}>Full seating view</button></div>
    <div className="theatre3d-preview"><label htmlFor="preview-seat">View from your selected seat</label><select id="preview-seat" value={activeSeat} onChange={e=>setViewSeat(e.target.value)} disabled={!selectedSeats.length}><option value="">{selectedSeats.length?'Choose a seat to step inside':'Select a seat first'}</option>{selectedSeats.map(s=><option key={s.event_seat_id} value={s.event_seat_id}>Row {s.row_label} · Seat {s.seat_number} · {s.section}</option>)}</select></div>
    <p className="seat-map-note">Approximate sightline in an illustrative auditorium, not a measured view of this venue.</p>
  </div>;
}
