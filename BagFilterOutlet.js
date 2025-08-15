class BagFilterOutlet {
  constructor(params = {}) {
    const defaults = {
      name: '电袋除尘器出气口',
      // 1:1 几何尺寸（单位：米）
      rectWidth: 3.6,     // 与实物相近的矩形截面宽
      rectHeight: 2.4,    // 与实物相近的矩形截面高
      bodyLength: 5.2,    // 矩形壳体长度
      coneLength: 3.0,    // 矩形→圆形过渡段长度
      outletDiameter: 2.6,// 圆端直径（匹配引风机入口）
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

  // 将矩形端对齐到电袋前端中心，朝向引风机入口中心
  alignTo(filterFrontCenter, fanInletCenter) {
    // 放置矩形端面原点
    this.group.position.copy(filterFrontCenter);
    const dir = new THREE.Vector3().subVectors(fanInletCenter, filterFrontCenter).normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0,0,1), dir);
    this.group.setRotationFromQuaternion(quat);
  }

  #createMaterials() {
    return {
      corrugatedGrey: new THREE.MeshStandardMaterial({ color: 0xCCD2D7, roughness: 0.7, metalness: 0.25 }),
      seam: new THREE.MeshStandardMaterial({ color: 0xB7BDC2, roughness: 0.65, metalness: 0.25 }),
      rust: new THREE.MeshStandardMaterial({ color: 0x8B5E34, roughness: 0.95, metalness: 0.05 }),
      flange: new THREE.MeshStandardMaterial({ color: 0xA3A7AA, roughness: 0.5, metalness: 0.8 }),
      foam: new THREE.MeshStandardMaterial({ color: 0xB68B4A, roughness: 0.95, metalness: 0.05 }),
      dark: new THREE.MeshStandardMaterial({ color: 0x404040, roughness: 0.5, metalness: 0.6 }),
      junctionGrey: new THREE.MeshStandardMaterial({ color: 0x9AA0A6, roughness: 0.6, metalness: 0.3 })
    };
  }

  #build() {
    const { rectWidth: RW, rectHeight: RH, bodyLength: BL, coneLength: CL, outletDiameter: OD } = this.config;
    const root = new THREE.Group();
    root.name = 'bagFilterOutlet';

    // 1) 矩形壳体（沿 +Z 方向）
    const body = new THREE.Group(); body.name = 'rectBody';
    const bodyShell = new THREE.Mesh(new THREE.BoxGeometry(RW, RH, BL), this.materials.corrugatedGrey);
    bodyShell.position.set(0, 0, BL/2);
    body.add(bodyShell);

    // 竖向压型板“波纹”
    const ribCount = Math.max(10, Math.floor(RW / 0.15));
    for (let i=0; i<ribCount; i++) {
      const x = -RW/2 + (i+0.5) * (RW / ribCount);
      const ribL = new THREE.Mesh(new THREE.BoxGeometry(0.025, RH * 0.96, BL * 0.98), this.materials.seam);
      ribL.position.set(x, 0, BL/2);
      body.add(ribL);
    }

    // 顶部拼缝 + 密封胶团（参考实物图）
    const seam = new THREE.Mesh(new THREE.BoxGeometry(RW*0.98, 0.02, BL*0.98), this.materials.seam);
    seam.position.set(0, RH/2 + 0.011, BL/2);
    body.add(seam);
    for (let i=0;i<14;i++) {
      const bead = new THREE.Mesh(new THREE.SphereGeometry(0.05 + Math.random()*0.03, 10, 8), this.materials.foam);
      bead.position.set(-RW/2 + (i+0.5)*(RW/14), RH/2 + 0.06 + Math.random()*0.04, Math.random()*BL*0.9 + BL*0.05);
      body.add(bead);
    }

    // 锈蚀流痕（多条）
    const streakN = 28;
    for (let i=0;i<streakN;i++) {
      const x = -RW/2 + Math.random()*RW;
      const h = RH*(0.25 + Math.random()*0.6);
      const z = Math.random()*BL;
      const strip = new THREE.Mesh(new THREE.BoxGeometry(0.02, h, 0.01), this.materials.rust);
      strip.position.set(x, RH/2 - h/2 - 0.03, z + 0.02);
      body.add(strip);
    }
    root.add(body);

    // 2) 矩形→圆形斜锥过渡段
    const steps = 14;
    const cone = new THREE.Group(); cone.name = 'rectToRoundCone';
    for (let i=0; i<steps; i++) {
      const t0 = i/steps, t1=(i+1)/steps;
      const w0 = THREE.MathUtils.lerp(RW, OD, t0);
      const h0 = THREE.MathUtils.lerp(RH, OD, t0);
      const w1 = THREE.MathUtils.lerp(RW, OD, t1);
      const h1 = THREE.MathUtils.lerp(RH, OD, t1);
      const z0 = BL + t0*CL;
      const z1 = BL + t1*CL;
      const seg = new THREE.Mesh(new THREE.CylinderGeometry((w0+h0)/4,(w1+h1)/4, z1-z0, 32,1,true), this.materials.corrugatedGrey);
      seg.rotation.x = Math.PI/2;
      seg.position.set(0, 0, (z0+z1)/2);
      cone.add(seg);
    }
    // 过渡段拼缝
    for (let i=0;i<18;i++) {
      const ang = (i/18) * Math.PI*2;
      const r = (OD/2) * 0.92;
      const seamBar = new THREE.Mesh(new THREE.BoxGeometry(0.01, 0.02, 0.35), this.materials.seam);
      seamBar.position.set(Math.cos(ang)*r*0.05, 0.02, BL + CL*0.5 + Math.sin(ang)*r*0.05);
      cone.add(seamBar);
    }
    root.add(cone);

    // 3) 圆端法兰（与风机入口连接）
    const flangeThk = 0.02;
    const outerR = OD/2 + 0.08;
    const ring = new THREE.Mesh(new THREE.CylinderGeometry(outerR, outerR, flangeThk, 44), this.materials.flange);
    ring.rotation.x = Math.PI/2; ring.position.set(0, 0, BL + CL + flangeThk/2);
    root.add(ring);
    // 螺栓
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.012,0.012,0.02,10), this.materials.dark);
    const boltN = 20;
    for (let i=0;i<boltN;i++) {
      const ang = (i/boltN)*Math.PI*2;
      const bx = Math.cos(ang)*outerR*0.9;
      const by = Math.sin(ang)*outerR*0.9;
      const b = bolt.clone(); b.rotation.x = Math.PI/2; b.position.set(bx, by, BL + CL + flangeThk/2 + 0.006); root.add(b);
    }

    // 4) 侧面检修/接线盒（参考图片中部偏下的小箱体）
    const jbox = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, 0.25), this.materials.junctionGrey);
    jbox.position.set(-RW*0.25, -RH*0.15, BL*0.48);
    root.add(jbox);

    // 5) 底部垫木/支撑块（近似）
    for (let i=0;i<4;i++) {
      const x = -RW/2 + (i+0.5)*(RW/4);
      const block = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.22, 0.8), this.materials.dark);
      block.position.set(x, -RH/2 - 0.11, BL*0.25 + (i%2)*0.6);
      root.add(block);
    }

    // 原点：让矩形端面位于 z=0 平面，轴向沿 +Z
    this.group.add(root);
  }
}

if (typeof window !== 'undefined') {
  window.BagFilterOutlet = BagFilterOutlet;
}


