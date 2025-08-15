class InducedDraftFan {
  constructor(config = {}) {
    const defaults = {
      name: '引风机',
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 },
      size: { width: 4.2, height: 2.6, depth: 2.2 }, // 近似外罩尺寸（米）
      casingColor: 0x66A8DA, // 天空蓝（半哑光）
    };
    this.config = Object.assign({}, defaults, config);

    this.group = new THREE.Group();
    this.group.name = this.config.name || 'InducedDraftFan';
    this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
    this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);

    this.materials = this.#createMaterials();
    this.#buildFan();
  }

  getGroup() { return this.group; }

  #createMaterials() {
    return {
      casing: new THREE.MeshStandardMaterial({ color: this.config.casingColor, roughness: 0.55, metalness: 0.15 }),
      seam: new THREE.MeshStandardMaterial({ color: 0x5C90BD, roughness: 0.6, metalness: 0.2 }),
      steelDark: new THREE.MeshStandardMaterial({ color: 0x45484D, roughness: 0.4, metalness: 0.6 }),
      steelBase: new THREE.MeshStandardMaterial({ color: 0x2E6EA3, roughness: 0.5, metalness: 0.5 }),
      concrete: new THREE.MeshStandardMaterial({ color: 0xC7C7C7, roughness: 0.9, metalness: 0.05 }),
      white: new THREE.MeshStandardMaterial({ color: 0xF2F4F6, roughness: 0.4, metalness: 0.3 }),
      black: new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.6, metalness: 0.2 })
    };
  }

  #buildFan() {
    const { width: W, height: H, depth: D } = this.config.size;

    const g = new THREE.Group();
    g.name = 'IDFan';

    // 1) 混凝土基础
    const plinth = new THREE.Mesh(new THREE.BoxGeometry(W + 1.2, 0.4, D + 1.0), this.materials.concrete);
    plinth.position.set(0, 0.2, 0);
    plinth.receiveShadow = true;
    g.add(plinth);

    // 2) 钢制滑撬底座（两根纵梁+横向联接）
    const skid = new THREE.Group(); skid.name = 'skid';
    const beamY = 0.5;
    const longBeam = new THREE.Mesh(new THREE.BoxGeometry(W, 0.18, 0.18), this.materials.steelBase);
    const long1 = longBeam.clone(); long1.position.set(0, beamY, -D * 0.35); skid.add(long1);
    const long2 = longBeam.clone(); long2.position.set(0, beamY,  D * 0.35); skid.add(long2);
    for (let i = -2; i <= 2; i++) {
      const cross = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.14, D * 0.7), this.materials.steelBase);
      cross.position.set((i / 2) * (W * 0.7), beamY, 0);
      skid.add(cross);
    }
    // 地脚锚栓
    const anchor = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.16, 10), this.materials.steelDark);
    const plate = new THREE.Mesh(new THREE.BoxGeometry(0.16, 0.02, 0.16), this.materials.steelDark);
    const anchors = [
      [-W/2+0.3, 0.3, -D/2+0.3], [ W/2-0.3, 0.3, -D/2+0.3],
      [-W/2+0.3, 0.3,  D/2-0.3], [ W/2-0.3, 0.3,  D/2-0.3]
    ];
    anchors.forEach(([x,y,z])=>{ const a = anchor.clone(); a.position.set(x,y,z); skid.add(a); const p = plate.clone(); p.position.set(x,0.41,z); skid.add(p); });
    g.add(skid);

    // 3) 大型矩形声学/气流外罩
    const casing = new THREE.Mesh(new THREE.BoxGeometry(W, H, D), this.materials.casing);
    casing.position.set(0, H/2 + beamY, 0);
    casing.castShadow = true; casing.receiveShadow = true;
    g.add(casing);

    // 边角拼缝（板缝）
    const seamThk = 0.02;
    const addSeam = (x1,y1,z1,x2,y2,z2)=>{
      const len = Math.hypot(x2-x1, z2-z1) || Math.abs(y2-y1);
      const isH = Math.abs(y2-y1) < 1e-6;
      const seam = new THREE.Mesh(new THREE.BoxGeometry(isH ? len : seamThk, isH ? seamThk : Math.abs(y2-y1), seamThk), this.materials.seam);
      seam.position.set((x1+x2)/2, (y1+y2)/2, (z1+z2)/2);
      g.add(seam);
    };
    // 四周边缘（仅示意几条主要缝）
    const cx=0, cy=H/2+beamY, cz=0;
    // 前面板水平缝
    addSeam(-W/2, cy+H*0.15, D/2+seamThk/2,  W/2, cy+H*0.15, D/2+seamThk/2);
    addSeam(-W/2, cy-H*0.10, D/2+seamThk/2,  W/2, cy-H*0.10, D/2+seamThk/2);

    // 4) 正面——大门（右偏）+ 小面板（左）
    // 大门
    const door = new THREE.Mesh(new THREE.BoxGeometry(W*0.42, H*0.52, 0.06), this.materials.white);
    door.position.set(W*0.15, cy, D/2 + 0.06/2 + 0.02);
    g.add(door);
    // 门铰链（右侧四个）
    for (let i=0;i<4;i++){
      const hinge = new THREE.Mesh(new THREE.CylinderGeometry(0.025,0.025,0.14,12), this.materials.steelDark);
      hinge.rotation.z = Math.PI/2;
      hinge.position.set(W*0.36, cy + (i-1.5)* (H*0.16), D/2 + 0.06);
      g.add(hinge);
    }
    // 门周边螺栓（8-12个）
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.02,8), this.materials.steelDark);
    const boltPts = 12;
    for (let i=0;i<boltPts;i++){
      const t = i/boltPts * Math.PI*2;
      const rx = W*0.17*Math.cos(t), ry = H*0.24*Math.sin(t);
      const b = bolt.clone(); b.position.set(W*0.15 + rx, cy + ry, D/2 + 0.08); g.add(b);
    }
    // 大门下方服务踏步（小平台）
    const step = new THREE.Mesh(new THREE.BoxGeometry(W*0.25, 0.08, 0.25), this.materials.steelBase);
    step.position.set(W*0.15, 0.55 + 0.04, D/2 + 0.1);
    g.add(step);

    // 小面板（左侧，齐平）
    const panel = new THREE.Mesh(new THREE.BoxGeometry(W*0.20, H*0.30, 0.02), this.materials.white);
    panel.position.set(-W*0.18, cy + H*0.05, D/2 + 0.01);
    g.add(panel);
    // 小面板搭扣
    const latch = new THREE.Mesh(new THREE.BoxGeometry(0.04,0.015,0.015), this.materials.steelDark);
    latch.position.set(-W*0.10, cy + H*0.05, D/2 + 0.02);
    g.add(latch);

    // 名牌“引风机”
    const nameplate = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.10, 0.01), this.materials.white);
    nameplate.position.set(W*0.15, cy + H*0.36, D/2 + 0.015);
    g.add(nameplate);
    // 简易文字（黑色条纹代替，避免纹理）
    for (let i=0;i<3;i++){
      const stripe = new THREE.Mesh(new THREE.BoxGeometry(0.28 - i*0.02, 0.008, 0.002), this.materials.black);
      stripe.position.set(W*0.15, cy + H*0.36 + (i-1)*0.03, D/2 + 0.017);
      g.add(stripe);
    }

    // 5) 顶部装置：吊耳、检修盖、穿线短套
    for (let i = -1; i <= 1; i+=2) {
      const lug = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.015, 10, 18), this.materials.steelDark);
      lug.position.set(W*0.20*i, cy + H/2 + 0.02, -D*0.15);
      lug.rotation.x = Math.PI/2;
      g.add(lug);
    }
    const insp = new THREE.Mesh(new THREE.CylinderGeometry(0.10,0.10,0.02,16), this.materials.white);
    insp.position.set(-W*0.05, cy + H/2 + 0.02, D*0.05);
    g.add(insp);
    const sleeve = new THREE.Mesh(new THREE.CylinderGeometry(0.05,0.05,0.18,16), this.materials.steelDark);
    sleeve.position.set(W*0.05, cy + H/2 + 0.12, D*0.05);
    g.add(sleeve);

    // 6) 前后圆形短接管（前：进风；后：出风）
    const stubDia = Math.min(H*0.65, D*0.9);
    const stubLen = stubDia * 0.2;
    const collarThk = 0.02;
    // 前（进风，朝 +Z）
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(stubDia/2, stubDia/2, stubLen, 28), this.materials.white);
    inlet.rotation.x = Math.PI/2;
    inlet.position.set(0, cy, D/2 + stubLen/2 - 0.02);
    g.add(inlet);
    const inFlange = new THREE.Mesh(new THREE.CylinderGeometry(stubDia/2 + collarThk, stubDia/2 + collarThk, 0.02, 28), this.materials.steelDark);
    inFlange.name = 'fanInletFlange';
    inFlange.rotation.x = Math.PI/2; inFlange.position.set(0, cy, D/2); g.add(inFlange);
    // 后（出风，朝 -Z）
    const outlet = inlet.clone(); outlet.position.set(0, cy, -D/2 - stubLen/2 + 0.02); g.add(outlet);
    const outFlange = inFlange.clone(); outFlange.name = 'fanOutletFlange'; outFlange.position.set(0, cy, -D/2); g.add(outFlange);

    // 7) 后壁竖向浅加强筋
    for (let i= -1; i<=1; i++){
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.06, H*0.7, 0.03), this.materials.seam);
      rib.position.set(i * W * 0.2, cy, -D/2 - 0.015);
      g.add(rib);
    }

    // 8) 添加设备标签（精灵）
    const label = this.createSpriteLabel(this.config.name || '引风机', '#00D1FF', 360, 110, 40);
    label.name = 'idFanLabel';
    label.position.set(0, cy + H/2 + 0.8, D/2 + 0.2);
    label.scale.multiplyScalar(1.6);
    g.add(label);

    // 保存关键尺寸用于外部对接
    this.dim = { W, H, D, beamY, stubDia };
    this.group.add(g);
  }


}

if (typeof window !== 'undefined') {
  window.InducedDraftFan = InducedDraftFan;
}

// 获取入口法兰中心与直径（世界坐标）
InducedDraftFan.prototype.getInletInfo = function() {
  if (!this.dim) return null;
  const { H, beamY, stubDia, D } = this.dim;
  const cy = H/2 + beamY;
  const flange = this.group.getObjectByName('fanInletFlange');
  const fallback = new THREE.Vector3(0, cy, D/2);
  const local = flange ? flange.position.clone() : fallback;
  const world = local.clone();
  this.group.localToWorld(world);
  const s = this.group.getWorldScale(new THREE.Vector3());
  const dia = stubDia * ((s.x + s.y + s.z) / 3);
  return { center: world, diameter: dia };
}

// 获取出口法兰中心与直径（世界坐标）
InducedDraftFan.prototype.getOutletInfo = function() {
  if (!this.dim) return null;
  const { H, beamY, stubDia, D } = this.dim;
  const cy = H/2 + beamY;
  const local = new THREE.Vector3(0, cy, -D/2);
  const world = local.clone();
  this.group.localToWorld(world);
  const s = this.group.getWorldScale(new THREE.Vector3());
  const dia = stubDia * ((s.x + s.y + s.z) / 3);
  return { center: world, diameter: dia };
}

// 创建HUD风格的精灵标签
InducedDraftFan.prototype.createSpriteLabel = function(text, color = '#FFFFFF', width = 256, height = 64, fontPx = 22) {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  canvas.width = width; canvas.height = height;
  // 背景
  ctx.fillStyle = 'rgba(0,0,0,0.78)';
  const r = 10; ctx.beginPath();
  ctx.moveTo(r,0); ctx.lineTo(width-r,0); ctx.quadraticCurveTo(width,0,width,r);
  ctx.lineTo(width,height-r); ctx.quadraticCurveTo(width,height,width-r,height);
  ctx.lineTo(r,height); ctx.quadraticCurveTo(0,height,0,height-r);
  ctx.lineTo(0,r); ctx.quadraticCurveTo(0,0,r,0); ctx.closePath(); ctx.fill();
  // 边框
  ctx.strokeStyle = color; ctx.lineWidth = 3; ctx.stroke();
  // 文本
  ctx.fillStyle = color; ctx.font = `Bold ${fontPx}px Microsoft YaHei, Arial`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  ctx.fillText(String(text), width/2, height/2);
  const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true;
  const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.96, alphaTest: 0.01 });
  const spr = new THREE.Sprite(mat); spr.scale.set(width/64, height/64, 1); return spr;
}


