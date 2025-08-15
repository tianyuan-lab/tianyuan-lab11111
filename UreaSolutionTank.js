/**
 * 尿素溶液储存罐（基于实物外观：立式圆筒、竖向波纹板外覆、顶部平台、外置立柱框架）
 */
class UreaSolutionTank {
  constructor(config = {}) {
    this.config = {
      name: config.name || '尿素溶液储罐',
      position: config.position || { x: 0, y: 0, z: 0 },
      rotation: config.rotation || { x: 0, y: 0, z: 0 },
      height: config.height || 24,
      diameter: config.diameter || 10,
      floorY: 0.0,
      ...config,
    };

    this.group = new THREE.Group();
    this.group.name = this.config.name;
    this.materials = this.#createMaterials();
    this.ports = {};

    this.#buildTank();

    this.group.position.set(
      this.config.position.x,
      this.config.position.y,
      this.config.position.z
    );
    this.group.rotation.set(
      this.config.rotation.x,
      this.config.rotation.y,
      this.config.rotation.z
    );
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
      shell: new THREE.MeshStandardMaterial({ color: 0xD6DBDF, metalness: 0.65, roughness: 0.45 }),
      rib: new THREE.MeshStandardMaterial({ color: 0xC0C6CC, metalness: 0.7, roughness: 0.4 }),
      foundation: new THREE.MeshStandardMaterial({ color: 0x9CA3AF, metalness: 0.1, roughness: 0.9 }),
      top: new THREE.MeshStandardMaterial({ color: 0xB8BEC4, metalness: 0.7, roughness: 0.4 }),
      frame: new THREE.MeshStandardMaterial({ color: 0x8B9299, metalness: 0.8, roughness: 0.35 }),
      pipe: new THREE.MeshStandardMaterial({ color: 0x8E9BA6, metalness: 0.9, roughness: 0.25 }),
      flange: new THREE.MeshStandardMaterial({ color: 0x4B5563, metalness: 0.85, roughness: 0.3 }),
      labelBg: new THREE.MeshStandardMaterial({ color: 0x0B0F14, metalness: 0.1, roughness: 0.6 }),
    };
  }

  #buildTank() {
    const g = new THREE.Group();
    const H = this.config.height;
    const D = this.config.diameter;
    const R = D / 2;
    const y0 = this.config.floorY;

    // 地基与基础环
    const pad = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.35, R + 0.35, 0.3, 48), this.materials.foundation);
    pad.position.set(0, 0.15, 0);
    pad.receiveShadow = true;
    g.add(pad);

    // 圆柱壳体（略高，留出顶部封头）
    const shell = new THREE.Mesh(new THREE.CylinderGeometry(R, R, H - 0.6, 64), this.materials.shell);
    shell.position.set(0, y0 + (H - 0.6) / 2, 0);
    shell.castShadow = true; shell.receiveShadow = true;
    g.add(shell);

    // 顶盖（平顶略圆角）
    const top = new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), this.materials.top);
    top.scale.set(1, 0.22, 1);
    top.position.set(0, y0 + (H - 0.6) + 0.15, 0);
    g.add(top);

    // 竖向波纹板外覆（用窄条板模拟）
    const ribCount = 40;
    for (let i = 0; i < ribCount; i++) {
      const a = (i / ribCount) * Math.PI * 2;
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.12, H - 0.6, 0.3), this.materials.rib);
      rib.position.set(Math.cos(a) * (R + 0.12), y0 + (H - 0.6) / 2, Math.sin(a) * (R + 0.12));
      rib.lookAt(0, rib.position.y, 0);
      g.add(rib);
    }

    // 外置立柱框架（前后各一）
    const pole1 = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, H, 16), this.materials.frame);
    pole1.position.set(R + 0.8, y0 + H / 2, 0);
    const pole2 = pole1.clone(); pole2.position.set(-(R + 0.8), y0 + H / 2, 0);
    g.add(pole1, pole2);
    // 顶部横梁
    const beam = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, R * 2 + 1.6, 12), this.materials.frame);
    beam.rotation.z = Math.PI / 2; beam.position.set(0, y0 + H - 0.2, 0);
    g.add(beam);

    // 底部侧向法兰作为连接口（用于底部连管）
    const bottomNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.9, 16), this.materials.pipe);
    bottomNozzle.rotation.z = Math.PI / 2;
    bottomNozzle.position.set(R + 0.5, y0 + 0.6, 0);
    g.add(bottomNozzle);
    const bottomFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.12, 18), this.materials.flange);
    bottomFlange.rotation.z = Math.PI / 2;
    bottomFlange.position.set(R + 0.92, y0 + 0.6, 0);
    bottomFlange.name = 'bottom_port';
    g.add(bottomFlange);
    this.ports.bottom = bottomFlange;

    // 正面小型识别牌
    const labelBg = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.5, 0.04), this.materials.labelBg);
    labelBg.position.set(0, y0 + 2.0, R + 0.28);
    g.add(labelBg);

    // 主标签（顶部上方）
    const mainLabel = this.#createSpriteLabel(this.config.name, '#00AAFF');
    mainLabel.position.set(0, y0 + H + 2.5, 0);
    this.group.add(mainLabel);

    this.group.add(g);
  }

  #createSpriteLabel(text, color = '#00AAFF') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 320; canvas.height = 100;
    ctx.font = 'Bold 40px Microsoft YaHei, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.#roundRect(ctx, 10, 10, 300, 80, 10); ctx.fill();
    // 边框
    ctx.strokeStyle = color; ctx.lineWidth = 3; this.#roundRect(ctx, 10, 10, 300, 80, 10); ctx.stroke();
    // 文本
    ctx.fillStyle = '#FFFFFF'; ctx.fillText(text, 160, 50);
    const tex = new THREE.CanvasTexture(canvas);
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95 });
    const sp = new THREE.Sprite(mat); sp.scale.set(15, 4, 1);
    return sp;
  }

  #roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
  }
}


