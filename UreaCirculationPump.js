/**
 * 尿素溶液循环泵（工业精细外观）
 * - 提供入水口(inlet)与出水口(outlet)
 */
class UreaCirculationPump {
  constructor(config = {}) {
    this.config = {
      name: config.name || '尿素溶液循环泵',
      position: config.position || { x: 0, y: 0, z: 0 },
      rotation: config.rotation || { x: 0, y: 0, z: 0 },
      scale: config.scale || 1.0,
      ...config,
    };

    this.group = new THREE.Group();
    this.group.name = this.config.name;
    this.materials = this.#createMaterials();
    this.ports = {}; // { inlet, outlet }

    this.#build();

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
    this.group.scale.setScalar(this.config.scale);
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
      base: new THREE.MeshStandardMaterial({ color: 0x9CA3AF, metalness: 0.3, roughness: 0.75 }),
      accent: new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.7, roughness: 0.4 }),
      motor: new THREE.MeshStandardMaterial({ color: 0x1E40AF, metalness: 0.85, roughness: 0.2 }),
      volute: new THREE.MeshStandardMaterial({ color: 0xE5E7EB, metalness: 0.9, roughness: 0.15 }),
      guard: new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.4, roughness: 0.6, transparent: true, opacity: 0.7 }),
      pipe: new THREE.MeshStandardMaterial({ color: 0x8E9BA6, metalness: 0.9, roughness: 0.25 }),
      labelBg: new THREE.MeshStandardMaterial({ color: 0x0B0F14, metalness: 0.1, roughness: 0.6 }),
    };
  }

  #build() {
    const g = new THREE.Group();

    // 重型基座
    const base = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.5, 2.4), this.materials.base);
    base.position.set(0, 0.25, 0);
    base.castShadow = true; base.receiveShadow = true;
    g.add(base);

    // 防震垫
    for (let i = 0; i < 4; i++) {
      const x = (i % 2) * 2.6 - 1.3; const z = Math.floor(i / 2) * 1.8 - 0.9;
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.08, 12), this.materials.accent);
      pad.position.set(x, 0.04, z); g.add(pad);
    }

    // 电机
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.75, 0.75, 2.2, 32), this.materials.motor);
    motor.rotation.z = Math.PI / 2; motor.position.set(-0.7, 1.2, 0); motor.castShadow = true; g.add(motor);

    // 联轴器护罩
    const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.5, 0.5, 0.7, 20, 1, true), this.materials.guard);
    guard.rotation.z = Math.PI / 2; guard.position.set(0.1, 1.2, 0); g.add(guard);

    // 泵头（蜗壳）
    const volute = new THREE.Mesh(new THREE.SphereGeometry(0.95, 32, 24), this.materials.volute);
    volute.position.set(1.1, 1.25, 0); volute.castShadow = true; g.add(volute);

    // 进水口（朝向背面+Z，便于与储罐相连）
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 1.0, 20), this.materials.pipe);
    inlet.rotation.x = Math.PI / 2; // 指向+Z方向
    inlet.position.set(0.0, 0.95, 1.1);
    inlet.name = `${this.config.name}_inlet_port`;
    g.add(inlet);

    // 出水口（向上）
    const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 20), this.materials.pipe);
    outlet.position.set(1.6, 1.9, 0);
    outlet.name = `${this.config.name}_outlet_port`;
    g.add(outlet);
    const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.28, 8, 20, Math.PI / 2), this.materials.pipe);
    elbow.position.set(1.6, 1.5, 0); elbow.rotation.z = Math.PI; g.add(elbow);

    // 标签（精灵文字）
    const labelSprite = this.#createLabelSprite(this.config.name, '#00AAFF');
    labelSprite.position.set(0, 3.2, 0);
    this.group.add(labelSprite);

    this.ports.inlet = inlet;
    this.ports.outlet = outlet;

    this.group.add(g);
  }

  #createLabelSprite(text, color = '#00AAFF') {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 320; canvas.height = 100;
    ctx.font = 'Bold 36px Microsoft YaHei, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    // 背景
    ctx.fillStyle = 'rgba(0,0,0,0.8)';
    this.#roundRect(ctx, 10, 10, 300, 80, 10); ctx.fill();
    // 边框
    ctx.strokeStyle = color; ctx.lineWidth = 3; this.#roundRect(ctx, 10, 10, 300, 80, 10); ctx.stroke();
    // 文本高对比度
    ctx.fillStyle = '#FFFFFF';
    ctx.fillText(text, 160, 50);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.95 });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(12, 4, 1);
    sprite.name = `label_${text}`;
    return sprite;
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


