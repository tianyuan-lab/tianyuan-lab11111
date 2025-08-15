/**
 * 工艺水箱（外形与除盐水箱一致，泵样式复用除盐/稀释泵样式）
 */
class ProcessWaterTank {
  constructor(config = {}) {
    this.config = {
      name: config.name || '工艺水箱',
      position: config.position || { x: 0, y: 0, z: 0 },
      rotation: config.rotation || { x: 0, y: 0, z: 0 },
      height: config.height || 20,
      diameter: config.diameter || 10,
      floorY: 0.6,
      ...config,
    };

    this.group = new THREE.Group();
    this.group.name = this.config.name;
    this.materials = this.#createMaterials();
    this.refs = {};
    this.ports = {};
    this.pumpPorts = {}; // { key: { inlet, outlet } }

    this.#buildTank();
    this.#createPumpsAndConnections();

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

  #createMaterials() {
    return {
      shell: new THREE.MeshStandardMaterial({ color: 0xBFC5C9, metalness: 0.85, roughness: 0.35 }),
      top: new THREE.MeshStandardMaterial({ color: 0xAEB4B8, metalness: 0.85, roughness: 0.4 }),
      foundation: new THREE.MeshStandardMaterial({ color: 0x9CA3AF, metalness: 0.1, roughness: 0.9 }),
      handrail: new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.6, roughness: 0.45 }),
      ladder: new THREE.MeshStandardMaterial({ color: 0x6B7280, metalness: 0.7, roughness: 0.35 }),
      pipe: new THREE.MeshStandardMaterial({ color: 0x8E9BA6, metalness: 0.9, roughness: 0.25 }),
      insulated: new THREE.MeshStandardMaterial({ color: 0xD1D5DB, metalness: 0.1, roughness: 0.85 }),
      flange: new THREE.MeshStandardMaterial({ color: 0x4B5563, metalness: 0.85, roughness: 0.3 }),
      bolt: new THREE.MeshStandardMaterial({ color: 0x333333, metalness: 0.9, roughness: 0.2 }),
      hazard: new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.4, roughness: 0.6 }),
      glass: new THREE.MeshStandardMaterial({ color: 0x5EC7F7, transparent: true, opacity: 0.35, metalness: 0.1, roughness: 0.1 }),
      labelBg: new THREE.MeshStandardMaterial({ color: 0x0B0F14, metalness: 0.1, roughness: 0.6 }),
      valve: new THREE.MeshStandardMaterial({ color: 0x1E40AF, metalness: 0.8, roughness: 0.25 }),
    };
  }

  #buildTank() {
    const g = new THREE.Group();
    const H = this.config.height;
    const D = this.config.diameter;
    const R = D / 2;
    const y0 = this.config.floorY;

    // 基础环与地基
    const baseGeom = new THREE.CylinderGeometry(R + 0.4, R + 0.4, 0.4, 48);
    const base = new THREE.Mesh(baseGeom, this.materials.foundation);
    base.position.set(0, 0.2, 0);
    base.receiveShadow = true;
    g.add(base);

    // 壳体
    const shellGeom = new THREE.CylinderGeometry(R, R, H - 0.8, 64);
    const shell = new THREE.Mesh(shellGeom, this.materials.shell);
    shell.position.set(0, y0 + (H - 0.8) / 2, 0);
    shell.castShadow = true; shell.receiveShadow = true;
    g.add(shell);

    // 顶盖（浅拱顶）
    const cap = new THREE.Mesh(new THREE.SphereGeometry(R * 1.02, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2), this.materials.top);
    cap.scale.set(1, 0.35, 1);
    cap.position.set(0, y0 + (H - 0.8) + 0.2, 0);
    cap.castShadow = true; cap.receiveShadow = true;
    g.add(cap);

    // 环向加强筋
    const ringCount = 4;
    for (let i = 0; i < ringCount; i++) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(R + 0.08, 0.05, 8, 64), this.materials.shell);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, y0 + 0.8 + i * ((H - 1.6) / (ringCount - 1)), 0);
      g.add(ring);
    }

    // 顶部人孔与螺栓圈
    const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.16, 24), this.materials.top);
    manhole.position.set(0.3, cap.position.y + 0.3, -0.5);
    g.add(manhole);
    for (let i = 0; i < 12; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8), this.materials.bolt);
      const a = (i / 12) * Math.PI * 2;
      b.position.set(manhole.position.x + Math.cos(a) * 0.45, manhole.position.y + 0.12, manhole.position.z + Math.sin(a) * 0.45);
      g.add(b);
    }

    // 通气口
    const vent = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 12), this.materials.pipe);
    vent.position.set(-0.8, cap.position.y + 0.25, 0.6);
    g.add(vent);
    const ventCap = new THREE.Mesh(new THREE.SphereGeometry(0.18, 16, 12), this.materials.pipe);
    ventCap.position.set(vent.position.x, vent.position.y + 0.45, vent.position.z);
    g.add(ventCap);

    // 顶部环形平台与栏杆
    const platform = new THREE.Mesh(new THREE.TorusGeometry(R + 0.25, 0.07, 8, 48), this.materials.ladder);
    platform.rotation.x = Math.PI / 2;
    platform.position.set(0, cap.position.y + 0.2, 0);
    g.add(platform);
    const rail1 = new THREE.Mesh(new THREE.TorusGeometry(R + 0.25, 0.05, 8, 48), this.materials.handrail);
    const rail2 = rail1.clone();
    rail1.rotation.x = rail2.rotation.x = Math.PI / 2;
    rail1.position.set(0, platform.position.y + 0.5, 0);
    rail2.position.set(0, platform.position.y + 0.95, 0);
    g.add(rail1, rail2);

    // 爬梯与护笼
    const ladderGroup = new THREE.Group();
    const totalLadderH = H - 0.6;
    const rungN = Math.max(12, Math.floor(totalLadderH / 0.35));
    const rungGeom = new THREE.BoxGeometry(0.36, 0.04, 0.04);
    for (let i = 0; i < rungN; i++) {
      const rung = new THREE.Mesh(rungGeom, this.materials.ladder);
      rung.position.set(R + 0.1, y0 + 0.4 + (i + 0.5) * (totalLadderH / rungN), 0);
      ladderGroup.add(rung);
    }
    const sideGeom = new THREE.BoxGeometry(0.06, totalLadderH, 0.06);
    const sideL = new THREE.Mesh(sideGeom, this.materials.ladder);
    const sideR = new THREE.Mesh(sideGeom, this.materials.ladder);
    sideL.position.set(R + 0.28, y0 + totalLadderH / 2, 0.2);
    sideR.position.set(R + 0.28, y0 + totalLadderH / 2, -0.2);
    ladderGroup.add(sideL, sideR);
    for (let i = 0; i < 8; i++) {
      const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.65, 0.03, 6, 24), this.materials.ladder);
      hoop.rotation.y = Math.PI / 2;
      hoop.position.set(R + 0.28, y0 + 0.8 + i * (totalLadderH / 8), 0);
      ladderGroup.add(hoop);
    }
    g.add(ladderGroup);

    // 液位计与刻度牌
    const sightTube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, H - 1.2, 16), this.materials.glass);
    sightTube.position.set(-R - 0.6, y0 + (H - 1.2) / 2, -0.2);
    g.add(sightTube);
    const scalePlate = new THREE.Mesh(new THREE.BoxGeometry(0.14, H - 1.3, 0.02), this.materials.labelBg);
    scalePlate.position.set(-R - 0.8, y0 + (H - 1.3) / 2, -0.2);
    g.add(scalePlate);

    // 进出水法兰
    const nozzleR = 0.16;
    const bottomNozzle = new THREE.Mesh(new THREE.CylinderGeometry(nozzleR, nozzleR, 0.8, 16), this.materials.pipe);
    bottomNozzle.rotation.z = Math.PI / 2;
    bottomNozzle.position.set(-R - 0.45, y0 + 0.4, 0.35);
    g.add(bottomNozzle);
    const bottomFlange = new THREE.Mesh(new THREE.CylinderGeometry(nozzleR * 1.4, nozzleR * 1.4, 0.12, 20), this.materials.flange);
    bottomFlange.rotation.z = Math.PI / 2;
    bottomFlange.position.set(-R - 0.85, y0 + 0.4, 0.35);
    bottomFlange.name = 'tank_bottom_port';
    g.add(bottomFlange);
    this.refs.bottomPort = bottomFlange;
    this.ports.bottom = bottomFlange;

    // 中部侧口
    const midNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16), this.materials.pipe);
    midNozzle.rotation.z = Math.PI / 2;
    midNozzle.position.set(-R - 0.4, y0 + H * 0.45, -0.35);
    g.add(midNozzle);

    // 保温立管（示意）
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, H - 1.0, 16), this.materials.insulated);
    riser.position.set(-R - 0.9, y0 + (H - 1.0) / 2, 0);
    g.add(riser);

    // 防撞环与锚栓
    const curb = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.2, R + 0.2, 0.1, 48, 1, true), this.materials.hazard);
    curb.position.set(0, 0.05, 0);
    g.add(curb);
    const boltN = 16;
    for (let i = 0; i < boltN; i++) {
      const ab = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8), this.materials.bolt);
      const a = (i / boltN) * Math.PI * 2;
      ab.position.set(Math.cos(a) * (R + 0.15), 0.25, Math.sin(a) * (R + 0.15));
      g.add(ab);
    }

    // 正面标签牌背景（与除盐一致的外观底板）
    const labelBg = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.02), this.materials.labelBg);
    labelBg.position.set(0.0, y0 + 1.8, R + 0.26);
    g.add(labelBg);

    this.group.add(g);
    this.createLabelsAndSigns();
  }

  getPortWorldPosition(name) {
    const obj = this.ports?.[name];
    if (!obj) return null;
    const p = new THREE.Vector3();
    obj.getWorldPosition(p);
    return p;
  }

  getPumpPortWorldPosition(key, port) {
    const obj = this.pumpPorts?.[key]?.[port];
    if (!obj) return null;
    const p = new THREE.Vector3();
    obj.getWorldPosition(p);
    return p;
  }

  #createPumpsAndConnections() {
    const R = this.config.diameter / 2;
    const baseY = this.config.floorY;
    const zPos = -(R + 3.2);
    const xs = [-6, -2, 2, 6];

    // 两台工艺水泵（左侧两台）
    const pumpA = this.#createProcessPump('工艺水泵A', { x: xs[0], y: baseY, z: zPos });
    const pumpB = this.#createProcessPump('工艺水泵B', { x: xs[1], y: baseY, z: zPos });
    this.group.add(pumpA.group, pumpB.group);

    // 两台除雾冲洗水泵（右侧两台）
    const pumpC = this.#createMistWashPump('除雾冲洗水泵1', { x: xs[2], y: baseY, z: zPos });
    const pumpD = this.#createMistWashPump('除雾冲洗水泵2', { x: xs[3], y: baseY, z: zPos });
    this.group.add(pumpC.group, pumpD.group);

    // 将四台泵进水口与水箱底部连接
    const tankBottom = this.getPortWorldPosition('bottom');
    const pumps = [
      { key: 'procA', inlet: this.getPumpPortWorldPosition('procA', 'inlet') },
      { key: 'procB', inlet: this.getPumpPortWorldPosition('procB', 'inlet') },
      { key: 'mist1', inlet: this.getPumpPortWorldPosition('mist1', 'inlet') },
      { key: 'mist2', inlet: this.getPumpPortWorldPosition('mist2', 'inlet') },
    ];

    pumps.forEach(p => {
      if (!tankBottom || !p.inlet) return;
      try {
        const pipe = new PipeConnection({
          name: `${this.config.name}→${p.key}进水口`,
          startPoint: tankBottom,
          endPoint: p.inlet,
          pipeRadius: 0.14,
          pipeColor: 0x8E9BA6,
          showFlow: true,
          flowDirection: 'forward',
          pathStrategy: 'straight',
        });
        if (typeof window !== 'undefined' && window.scene) {
          window.scene.add(pipe.group);
        } else {
          this.group.add(pipe.group);
        }
      } catch (e) {}
    });
  }

  // 复用除盐水泵的样式（蓝色电机）
  #createProcessPump(label, pos) {
    const group = new THREE.Group();
    group.name = label;

    const base = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.44, 2.0), new THREE.MeshStandardMaterial({ color: 0xFBBF24, metalness: 0.3, roughness: 0.7 }));
    base.position.set(0, 0.22, 0);
    base.castShadow = true; base.receiveShadow = true;
    group.add(base);

    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.64, 1.9, 32), new THREE.MeshStandardMaterial({ color: 0x1E3A8A, metalness: 0.85, roughness: 0.2 }));
    motor.rotation.z = Math.PI / 2;
    motor.position.set(-0.6, 1.2, 0);
    motor.castShadow = true; group.add(motor);

    const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.8, 0.8, 1.2, 32), new THREE.MeshStandardMaterial({ color: 0xE5E7EB, metalness: 0.9, roughness: 0.15 }));
    volute.position.set(0.9, 1.1, 0); volute.castShadow = true; group.add(volute);

    // 进水口（左）
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.8, 20), this.materials.pipe);
    inlet.rotation.z = Math.PI / 2;
    inlet.position.set(-1.9, 0.9, 0);
    inlet.name = `${label}_inlet_port`; group.add(inlet);

    // 出水口（上）与标签
    const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.8, 20), this.materials.pipe);
    outlet.position.set(1.5, 1.8, 0);
    outlet.name = `${label}_outlet_port`; group.add(outlet);
    const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.4, 0.28, 8, 20, Math.PI / 2), this.materials.pipe);
    elbow.position.set(1.5, 1.4, 0); elbow.rotation.z = Math.PI; group.add(elbow);
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.32, 0.04), new THREE.MeshStandardMaterial({ color: 0x3B82F6 }));
    tag.position.set(1.5, 2.5, 0); tag.name = `${label}_outlet_tag`; group.add(tag);

    // 端口记录
    this.pumpPorts['proc' + (label.endsWith('A') ? 'A' : 'B')] = { inlet, outlet };

    group.position.set(pos.x, pos.y, pos.z);
    group.rotation.y = Math.PI / 2;
    return { group };
  }

  // 复用稀释水泵的样式（绿色电机）
  #createMistWashPump(label, pos) {
    const group = new THREE.Group();
    group.name = label;

    const base = new THREE.Mesh(new THREE.BoxGeometry(3.0, 0.5, 2.2), new THREE.MeshStandardMaterial({ color: 0x9CA3AF, metalness: 0.4, roughness: 0.7 }));
    base.position.set(0, 0.25, 0);
    base.castShadow = true; base.receiveShadow = true;
    group.add(base);

    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 2.0, 32), new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.8, roughness: 0.25 }));
    motor.rotation.z = Math.PI / 2;
    motor.position.set(-0.7, 1.2, 0);
    motor.castShadow = true; group.add(motor);

    const volute = new THREE.Mesh(new THREE.SphereGeometry(0.84, 32, 24), new THREE.MeshStandardMaterial({ color: 0xF3F4F6, metalness: 0.9, roughness: 0.1 }));
    volute.position.set(1.0, 1.16, 0); volute.castShadow = true; group.add(volute);

    // 进水口（左）
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 20), new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.8, roughness: 0.2 }));
    inlet.rotation.z = Math.PI / 2;
    inlet.position.set(-2.0, 0.9, 0);
    inlet.name = `${label}_inlet_port`; group.add(inlet);

    // 出水口（上）与标签
    const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.28, 0.28, 0.9, 20), new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.8, roughness: 0.2 }));
    outlet.position.set(1.6, 1.9, 0);
    outlet.name = `${label}_outlet_port`; group.add(outlet);
    const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.44, 0.28, 8, 20, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.8, roughness: 0.2 }));
    elbow.position.set(1.6, 1.5, 0); elbow.rotation.z = Math.PI; group.add(elbow);
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.56, 0.36, 0.04), new THREE.MeshStandardMaterial({ color: 0x10B981 }));
    tag.position.set(1.6, 2.7, 0); tag.name = `${label}_outlet_tag`; group.add(tag);

    // 端口记录
    this.pumpPorts[label.endsWith('1') ? 'mist1' : 'mist2'] = { inlet, outlet };

    group.position.set(pos.x, pos.y, pos.z);
    group.rotation.y = Math.PI / 2;
    return { group };
  }

  // 标签与信息牌（与除盐水箱一致风格，文本替换）
  createLabelsAndSigns() {
    const labelGroup = new THREE.Group();
    labelGroup.name = 'labelsAndSigns';

    const radius = this.config.diameter / 2;
    const height = this.config.height;

    const mainLabel = this.createTankLabel('工艺水箱', '#228B22');
    mainLabel.position.set(0, height + 7, 0);
    labelGroup.add(mainLabel);

    const capacitySign = this.createInformationSign(
      '容量: 500m³\n材质: 不锈钢',
      { x: radius + 0.2, y: height * 0.7, z: 0 }
    );
    labelGroup.add(capacitySign);

    const numberSign = this.createInformationSign(
      'T-004\n工艺水箱',
      { x: -radius - 0.2, y: height * 0.5, z: 0 }
    );
    labelGroup.add(numberSign);

    // 泵标签（与现有风格一致）
    const pumpLabelConfigs = [
      { text: '工艺水泵1', color: '#FF6B35', pos: { x: -6, y: 6, z: -(radius + 3.2 + 5) } },
      { text: '工艺水泵2', color: '#FF6B35', pos: { x: -2, y: 6, z: -(radius + 3.2 + 5) } },
      { text: '除雾冲洗水泵1', color: '#00AA55', pos: { x: 2, y: 6, z: -(radius + 3.2 + 5) } },
      { text: '除雾冲洗水泵2', color: '#00AA55', pos: { x: 6, y: 6, z: -(radius + 3.2 + 5) } },
    ];
    pumpLabelConfigs.forEach(cfg => {
      const sp = this.createPumpLabelSprite(cfg.text, cfg.color);
      sp.position.set(cfg.pos.x, cfg.pos.y, cfg.pos.z);
      this.group.add(sp);
    });

    this.group.add(labelGroup);
  }

  createTankLabel(text, color = '#FFFFFF') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 320; canvas.height = 100;
    context.font = 'Bold 40px Microsoft YaHei, Arial';
    context.fillStyle = color; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
    context.fill();
    context.strokeStyle = color; context.lineWidth = 3;
    this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
    context.stroke();
    context.fillStyle = color; context.fillText(text, canvas.width / 2, canvas.height / 2);
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.95 });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(15, 4, 1); sprite.material.sizeAttenuation = true;
    return sprite;
  }

  createPumpLabelSprite(text, color = '#FFFFFF') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 320; canvas.height = 100;
    context.font = 'Bold 36px Microsoft YaHei, Arial';
    context.fillStyle = color; context.textAlign = 'center'; context.textBaseline = 'middle';
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
    context.fill();
    context.strokeStyle = color; context.lineWidth = 3;
    this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
    context.stroke();
    const lines = text.split('\n');
    // 固定高对比度文本颜色（白色）以避免与边框色冲突
    context.fillStyle = '#FFFFFF';
    if (lines.length === 1) {
      context.fillText(text, canvas.width / 2, canvas.height / 2);
    } else {
      const lineHeight = 30; const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
      lines.forEach((line, i) => context.fillText(line, canvas.width / 2, startY + i * lineHeight));
    }
    const texture = new THREE.CanvasTexture(canvas); texture.needsUpdate = true;
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.95, alphaTest: 0.01 });
    const sprite = new THREE.Sprite(material); sprite.scale.set(12, 4, 1);
    sprite.name = `label_${text.replace('\n', '_')}`;
    return sprite;
  }

  createInformationSign(text, position) {
    const signGeometry = new THREE.PlaneGeometry(2, 1.5);
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256; canvas.height = 192;
    context.fillStyle = '#FFFFFF'; context.fillRect(0, 0, canvas.width, canvas.height);
    context.strokeStyle = '#000000'; context.lineWidth = 4; context.strokeRect(0, 0, canvas.width, canvas.height);
    context.fillStyle = '#000000'; context.font = 'Bold 24px Arial'; context.textAlign = 'center';
    const lines = text.split('\n');
    lines.forEach((line, i) => context.fillText(line, canvas.width / 2, 60 + i * 40));
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.MeshBasicMaterial({ map: texture, transparent: true, side: THREE.DoubleSide });
    const sign = new THREE.Mesh(signGeometry, material);
    sign.position.set(position.x, position.y, position.z);
    sign.lookAt(0, position.y, 0);
    return sign;
  }

  roundRect(ctx, x, y, width, height, radius) {
    ctx.beginPath();
    ctx.moveTo(x + radius, y);
    ctx.lineTo(x + width - radius, y);
    ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
    ctx.lineTo(x + width, y + height - radius);
    ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
    ctx.lineTo(x + radius, y + height);
    ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
    ctx.lineTo(x, y + radius);
    ctx.quadraticCurveTo(x, y, x + radius, y);
    ctx.closePath();
  }
}


