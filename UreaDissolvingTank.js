/**
 * 尿素溶液溶解罐（与储罐风格接近，但增加搅拌与观察细节）
 */
class UreaDissolvingTank {
  constructor(config = {}) {
    this.config = {
      name: config.name || '尿素溶液溶解罐',
      position: config.position || { x: 0, y: 0, z: 0 },
      rotation: config.rotation || { x: 0, y: 0, z: 0 },
      height: config.height || 22,
      diameter: config.diameter || 9,
      floorY: 0.0,
      ...config,
    };

    this.group = new THREE.Group();
    this.group.name = this.config.name;
    this.materials = this.#createMaterials();
    this.ports = {};

    this.#build();

    this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
    this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);
  }

  getGroup() { return this.group; }

  getPortWorldPosition(name) {
    const obj = this.ports?.[name];
    if (!obj) return null;
    const p = new THREE.Vector3();
    obj.getWorldPosition(p);
    return p;
  }

  #createMaterials() {
    return {
      shell: new THREE.MeshStandardMaterial({ color: 0xCFD5DA, metalness: 0.7, roughness: 0.4 }),
      top: new THREE.MeshStandardMaterial({ color: 0xB9C1C8, metalness: 0.75, roughness: 0.4 }),
      foundation: new THREE.MeshStandardMaterial({ color: 0x9CA3AF, metalness: 0.1, roughness: 0.9 }),
      frame: new THREE.MeshStandardMaterial({ color: 0x6B7280, metalness: 0.8, roughness: 0.35 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x5EC7F7, transparent: true, opacity: 0.35, metalness: 0.1, roughness: 0.1 }),
      pipe: new THREE.MeshStandardMaterial({ color: 0x8E9BA6, metalness: 0.9, roughness: 0.25 }),
      flange: new THREE.MeshStandardMaterial({ color: 0x4B5563, metalness: 0.85, roughness: 0.3 }),
      labelBg: new THREE.MeshStandardMaterial({ color: 0x0B0F14, metalness: 0.1, roughness: 0.6 }),
      agitator: new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.35 }),
    };
  }

  #build() {
    const g = new THREE.Group();
    const H = this.config.height; const D = this.config.diameter; const R = D / 2; const y0 = this.config.floorY;

    // 地基
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.3, R + 0.3, 0.28, 48), this.materials.foundation);
    pad.position.set(0, 0.14, 0); pad.receiveShadow = true; g.add(pad);

    // 壳体
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H - 0.6, 64), this.materials.shell);
    shell.position.set(0, y0 + (H - 0.6) / 2, 0); shell.castShadow = true; shell.receiveShadow = true; g.add(shell);

    // 顶盖（略拱）
    const top = new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), this.materials.top);
    top.scale.set(1, 0.25, 1); top.position.set(0, y0 + (H - 0.6) + 0.16, 0); g.add(top);

    // 外置视镜液位管
    const sight = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, H - 1.2, 16), this.materials.glass);
    sight.position.set(-R - 0.5, y0 + (H - 1.2) / 2, 0.15); g.add(sight);

    // 顶部搅拌机轴与电机（示意）
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.6, 20), this.materials.agitator);
    motor.position.set(0.4, top.position.y + 0.25, -0.3); g.add(motor);
    const shaft = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, H - 1.2, 16), this.materials.agitator);
    shaft.position.set(0, y0 + (H - 1.2) / 2, 0); g.add(shaft);

    // 底部侧向法兰接口（用于连泵）
    const bottomNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 16), this.materials.pipe);
    bottomNozzle.rotation.z = Math.PI / 2; bottomNozzle.position.set(R + 0.5, y0 + 0.6, 0);
    g.add(bottomNozzle);
    const bottomFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 18), this.materials.flange);
    bottomFlange.rotation.z = Math.PI / 2; bottomFlange.position.set(R + 0.92, y0 + 0.6, 0); bottomFlange.name = 'bottom';
    g.add(bottomFlange);
    this.ports.bottom = bottomFlange;

    // 标签
    const label = this.#createLabelSprite(this.config.name, '#10B981');
    label.position.set(0, y0 + H + 2.0, 0); this.group.add(label);

    this.group.add(g);
  }

  #createLabelSprite(text, color = '#00AAFF') {
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
    canvas.width = 320; canvas.height = 100; ctx.font = 'Bold 38px Microsoft YaHei, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; this.#roundRect(ctx, 10, 10, 300, 80, 10); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 3; this.#roundRect(ctx, 10, 10, 300, 80, 10); ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.fillText(text, 160, 50);
    const tex = new THREE.CanvasTexture(canvas); const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95 });
    const sp = new THREE.Sprite(mat); sp.scale.set(15, 4, 1); return sp;
  }

  #roundRect(ctx, x, y, w, h, r) { ctx.beginPath(); ctx.moveTo(x + r, y); ctx.lineTo(x + w - r, y); ctx.quadraticCurveTo(x + w, y, x + w, y + r); ctx.lineTo(x + w, y + h - r); ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h); ctx.lineTo(x + r, y + h); ctx.quadraticCurveTo(x, y + h, x, y + h - r); ctx.lineTo(x, y + r); ctx.quadraticCurveTo(x, y, x + r, y); ctx.closePath(); }
}


