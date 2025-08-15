class RectToRoundDuct {
  constructor(params = {}) {
    const defaults = {
      name: 'EBF→IDFan 出口风管',
      // 尺寸（单位：米，1:1）
      rectWidth: 3.6,
      rectHeight: 2.4,
      totalLength: 6.0,
      coneRatio: 0.6, // 圆锥过渡长度占比
      outletDiameter: 2.4,
      position: { x: 0, y: 0, z: 0 },
      rotation: { x: 0, y: 0, z: 0 }
    };
    this.config = Object.assign({}, defaults, params);
    this.group = new THREE.Group();
    this.group.name = this.config.name;
    this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
    this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);

    this.materials = this.#createMaterials();
    this.#build();
  }

  getGroup() { return this.group; }

  // 将矩形端对齐到某个矩形面（中心、法向+Z），并朝向目标圆心
  alignTo(filterFrontCenter, fanInletCenter) {
    // 放置矩形端中心到 filterFrontCenter
    this.group.position.copy(filterFrontCenter);
    // 朝向：指向风机入口中心（圆端）
    const dir = new THREE.Vector3().subVectors(fanInletCenter, filterFrontCenter).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), dir);
    this.group.setRotationFromQuaternion(quat);
    // 将圆端与风机中心做轴向对齐（长度匹配由调用方保证）
  }

  #createMaterials() {
    const corrugatedGrey = new THREE.MeshStandardMaterial({ color: 0xD7DBDE, roughness: 0.7, metalness: 0.2 });
    const seam = new THREE.MeshStandardMaterial({ color: 0xC6CCD0, roughness: 0.65, metalness: 0.25 });
    const rust = new THREE.MeshStandardMaterial({ color: 0x8B5E34, roughness: 0.95, metalness: 0.05 });
    const flange = new THREE.MeshStandardMaterial({ color: 0xA3A7AA, roughness: 0.5, metalness: 0.8 });
    const foam = new THREE.MeshStandardMaterial({ color: 0xB68B4A, roughness: 0.9, metalness: 0.05 });
    const junctionGrey = new THREE.MeshStandardMaterial({ color: 0x9AA0A6, roughness: 0.6, metalness: 0.3 });
    const dark = new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.5, metalness: 0.6 });
    const wood = new THREE.MeshStandardMaterial({ color: 0x8B6D4D, roughness: 0.9, metalness: 0.05 });
    return { corrugatedGrey, seam, rust, flange, foam, junctionGrey, dark, wood };
  }

  #build() {
    const { rectWidth: RW, rectHeight: RH, totalLength: L, coneRatio, outletDiameter: OD } = this.config;
    const rectLen = L * (1 - coneRatio);
    const coneLen = L * coneRatio;

    const duct = new THREE.Group();
    duct.name = 'rectToRoundDuct';

    // 1) 矩形段（沿+Z方向）
    const rectShell = new THREE.Mesh(new THREE.BoxGeometry(RW, RH, rectLen), this.materials.corrugatedGrey);
    rectShell.position.set(0, 0, rectLen / 2);
    duct.add(rectShell);

    // 角钢加固（四角L形，用两条窄板代替）
    const leg = 0.06;
    const edgeX = RW / 2, edgeY = RH / 2;
    const l1 = new THREE.Mesh(new THREE.BoxGeometry(RW, leg, leg), this.materials.seam);
    const l2 = new THREE.Mesh(new THREE.BoxGeometry(leg, RH, leg), this.materials.seam);
    // 前后四边缘（矩形段）
    [[ edgeY, 0], [-edgeY, 0]].forEach(([y,z0])=>{
      const top = l1.clone(); top.position.set(0, y, z0 + leg/2); duct.add(top);
      const bot = l1.clone(); bot.position.set(0, -y, z0 + leg/2); duct.add(bot);
      const Lx = l2.clone(); Lx.position.set( edgeX, 0, z0 + leg/2); duct.add(Lx);
      const Rx = l2.clone(); Rx.position.set(-edgeX, 0, z0 + leg/2); duct.add(Rx);
    });

    // 竖向压型板“波纹”（在矩形两侧面上）
    const ribN = Math.max(8, Math.floor(RW / 0.15));
    for (let s of [-1, 1]) { // 左右两侧面
      for (let i = 0; i < ribN; i++) {
        const x = -RW / 2 + (i + 0.5) * (RW / ribN);
        const rib = new THREE.Mesh(new THREE.BoxGeometry(0.025, RH * 0.92, rectLen * 0.98), this.materials.seam);
        rib.position.set(x, 0, rectLen / 2);
        rib.position.x += s * 0.001; // 轻微错位
        duct.add(rib);
      }
    }

    // 顶部非规则密封胶条（近似：若干胶团）
    for (let i = 0; i < 10; i++) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.035 + Math.random()*0.02, 12, 10), this.materials.foam);
      bead.position.set(-RW/2 + (i+0.5)*(RW/10), RH/2 + 0.02, rectLen*0.3 + (Math.random()-0.5)*0.2);
      duct.add(bead);
      // 局部锈蚀斑
      const stain = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.35 + Math.random()*0.3, 0.01), this.materials.rust);
      stain.position.set(bead.position.x, RH/2 - 0.2, rectLen*0.3);
      duct.add(stain);
    }

    // 竖向锈蚀流痕（薄片几何）
    const streakN = 12;
    for (let i=0;i<streakN;i++){
      const x = -RW/2 + (i+0.5)*(RW/streakN);
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, RH*(0.3+Math.random()*0.6), 0.005), this.materials.rust);
      strip.position.set(x, RH/2 - strip.geometry.parameters.height/2 - 0.05, rectLen*0.15);
      duct.add(strip);
    }

    // 2) 矩形→圆形过渡锥（用多段圆环插值近似）
    const steps = 12;
    const cone = new THREE.Group(); cone.name='cone';
    for (let i=0;i<steps;i++){
      const t0 = i/steps, t1 = (i+1)/steps;
      const w0 = THREE.MathUtils.lerp(RW, OD, t0);
      const h0 = THREE.MathUtils.lerp(RH, OD, t0);
      const w1 = THREE.MathUtils.lerp(RW, OD, t1);
      const h1 = THREE.MathUtils.lerp(RH, OD, t1);
      const z0 = rectLen + t0*coneLen;
      const z1 = rectLen + t1*coneLen;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry((w0+h0)/4,(w1+h1)/4, z1-z0, 28,1,true), this.materials.corrugatedGrey);
      seg.rotation.x = Math.PI/2; // 长度沿Z
      seg.position.set(0, 0, (z0+z1)/2);
      cone.add(seg);
      // 竖向拼缝+铆钉
      const seamN = 12;
      for(let k=0;k<seamN;k++){
        const ang = (k/seamN)*Math.PI*2;
        const sx = Math.cos(ang)*((w0+h0)/4);
        const sz = Math.sin(ang)*((w0+h0)/4);
        const seam = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.35), this.materials.seam);
        seam.position.set(sx*0.02, 0, (z0+z1)/2 + sz*0.02);
        cone.add(seam);
      }
    }
    duct.add(cone);

    // 3) 圆形法兰（与风机入口匹配）
    const flangeThk = 0.02;
    const outerR = OD/2 + 0.06;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(outerR, outerR, flangeThk, 40), this.materials.flange);
    ring.rotation.x = Math.PI/2; ring.position.set(0, 0, rectLen + coneLen + flangeThk/2);
    duct.add(ring);
    // 螺栓分布
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.02,10), this.materials.dark);
    const boltN = 16;
    for (let i=0;i<boltN;i++){
      const ang = (i/boltN)*Math.PI*2;
      const bx = Math.cos(ang)*outerR*0.92;
      const by = Math.sin(ang)*outerR*0.92;
      const b = bolt.clone(); b.rotation.x = Math.PI/2; b.position.set(bx, by, rectLen + coneLen + flangeThk/2 + 0.005); duct.add(b);
    }

    // 4) 支撑：下垫木/短型钢
    const blockCount = 4;
    for (let i=0;i<blockCount;i++){
      const bx = -RW/2 + (i+0.5)*(RW/blockCount);
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.18, 0.5), this.materials.wood);
      block.position.set(bx, -RH/2 - 0.09, rectLen*0.4);
      duct.add(block);
    }

    // 5) 锥段上的接线盒及导管
    const jbox = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.24, 0.10), this.materials.junctionGrey);
    jbox.position.set(-RW*0.15, RH*0.05, rectLen + coneLen*0.35);
    duct.add(jbox);
    const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.03,0.03,0.6,12), this.materials.junctionGrey);
    conduit.rotation.x = Math.PI/2; conduit.position.set(jbox.position.x, jbox.position.y, jbox.position.z + 0.5);
    duct.add(conduit);

    // 原点定义：让矩形端面位于z=0平面，管轴沿+Z
    // 因此调用方可将 group 放在过滤器前端平面处
    this.group.add(duct);
  }
}

if (typeof window !== 'undefined') {
  window.RectToRoundDuct = RectToRoundDuct;
}


