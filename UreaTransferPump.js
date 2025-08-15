/**
 * 尿素溶液输送泵（与循环泵区分：不锈钢银白+红色点缀，立式端吸离心泵造型）
 */
class UreaTransferPump {
  constructor(config = {}) {
    this.config = {
      name: config.name || '尿素溶液输送泵',
      position: config.position || { x: 0, y: 0, z: 0 },
      rotation: config.rotation || { x: 0, y: 0, z: 0 },
      scale: config.scale || 1.0,
      ...config
    };
    this.group = new THREE.Group();
    this.group.name = this.config.name;
    this.materials = this.#createMaterials();
    this.ports = {};
    this.#build();
    this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
    this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);
    this.group.scale.setScalar(this.config.scale);
  }

  getGroup() { return this.group; }
  getPortWorldPosition(name) { const o = this.ports?.[name]; if (!o) return null; const p=new THREE.Vector3(); o.getWorldPosition(p); return p; }

  #createMaterials() {
    return {
      base: new THREE.MeshStandardMaterial({ color: 0xB0B7BF, metalness: 0.4, roughness: 0.7 }),
      steel: new THREE.MeshStandardMaterial({ color: 0xE5E7EB, metalness: 0.9, roughness: 0.2 }),
      red: new THREE.MeshStandardMaterial({ color: 0xEF4444, metalness: 0.8, roughness: 0.3 }),
      pipe: new THREE.MeshStandardMaterial({ color: 0x9AA5B1, metalness: 0.9, roughness: 0.25 }),
      labelBg: new THREE.MeshStandardMaterial({ color: 0x0B0F14, metalness: 0.1, roughness: 0.6 }),
    };
  }

  #build() {
    const g = new THREE.Group();
    // 立式底座
    const pedestal = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 1.0, 0.6, 24), this.materials.base);
    pedestal.position.set(0, 0.3, 0); pedestal.castShadow = true; pedestal.receiveShadow = true; g.add(pedestal);
    // 泵体壳（立式圆柱）
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.9, 1.8, 32), this.materials.steel);
    body.position.set(0, 1.5, 0); g.add(body);
    // 顶部红色装饰环
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.85, 0.05, 8, 32), this.materials.red);
    ring.rotation.x = Math.PI / 2; ring.position.set(0, 2.4, 0); g.add(ring);
    // 侧向蜗壳
    const volute = new THREE.Mesh(new THREE.SphereGeometry(0.7, 32, 24), this.materials.steel);
    volute.position.set(0.9, 1.4, 0); g.add(volute);
    // 进水口（朝向+Z，接溶解罐底部）
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.26, 0.9, 20), this.materials.pipe);
    inlet.rotation.x = Math.PI / 2; inlet.position.set(0.2, 0.9, 0.95); inlet.name = `${this.config.name}_inlet_port`; g.add(inlet);
    // 出水口（向上）
    const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.8, 20), this.materials.pipe);
    outlet.position.set(1.5, 2.0, 0); outlet.name = `${this.config.name}_outlet_port`; g.add(outlet);
    const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.36, 0.24, 8, 20, Math.PI/2), this.materials.pipe);
    elbow.position.set(1.5, 1.6, 0); elbow.rotation.z = Math.PI; g.add(elbow);
    // 标签
    const label = this.#createLabelSprite(this.config.name, '#EF4444'); label.position.set(0, 3.4, 0); this.group.add(label);
    this.ports.inlet = inlet; this.ports.outlet = outlet; this.group.add(g);
  }

  #createLabelSprite(text, color = '#00AAFF') {
    const canvas = document.createElement('canvas'); const ctx = canvas.getContext('2d');
    canvas.width = 320; canvas.height = 100; ctx.font = 'Bold 36px Microsoft YaHei, Arial';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillStyle = 'rgba(0,0,0,0.8)'; this.#roundRect(ctx, 10, 10, 300, 80, 10); ctx.fill();
    ctx.strokeStyle = color; ctx.lineWidth = 3; this.#roundRect(ctx, 10, 10, 300, 80, 10); ctx.stroke();
    ctx.fillStyle = '#FFFFFF'; ctx.fillText(text, 160, 50);
    const tex = new THREE.CanvasTexture(canvas); const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95 });
    const sp = new THREE.Sprite(mat); sp.scale.set(12, 4, 1); return sp;
  }

  #roundRect(ctx,x,y,w,h,r){ctx.beginPath();ctx.moveTo(x+r,y);ctx.lineTo(x+w-r,y);ctx.quadraticCurveTo(x+w,y,x+w,y+r);ctx.lineTo(x+w,y+h-r);ctx.quadraticCurveTo(x+w,y+h,x+w-r,y+h);ctx.lineTo(x+r,y+h);ctx.quadraticCurveTo(x,y+h,x,y+h-r);ctx.lineTo(x,y+r);ctx.quadraticCurveTo(x,y,x+r,y);ctx.closePath();}
}


