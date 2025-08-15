/**
 * 除盐水箱（独立模型）
 * 工业级细化：圆筒壳体、顶盖/人孔、环向加强筋、进出水法兰/阀件、液位计、通气口、底座与锚栓、护笼直爬梯、顶部环形平台与栏杆
 */
class DemineralizedWaterTank {
  constructor(config = {}) {
    this.config = {
      name: config.name || '除盐水箱',
      position: config.position || { x: 0, y: 0, z: 0 },
      rotation: config.rotation || { x: 0, y: 0, z: 0 },
      height: config.height || 30, // 与水泵房等高的默认高度（可覆盖）
      diameter: config.diameter || 10, // 直径默认 10m（可覆盖）
      floorY: 0.6, // 与场景地面对齐的小抬高
      ...config,
    };

    this.group = new THREE.Group();
    this.group.name = this.config.name;
    this.materials = this.#createMaterials();
    this.refs = {};
    this.ports = {};
    this.pumpPorts = {}; // { pumpKey: { inlet: Object3D, outlet: Object3D } }
    this.#buildTank();
    this.#createPumpsAndConnections();
    // 与工艺水箱一致风格：创建主标签与泵标签
    this.createLabelsAndSigns();

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

  getGroup() {
    return this.group;
  }

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
      labelStroke: new THREE.MeshStandardMaterial({ color: 0xFF3344, metalness: 0.2, roughness: 0.5 }),
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
    cap.scale.set(1, 0.35, 1); // 压扁形成浅拱
    cap.position.set(0, y0 + (H - 0.8) + 0.2, 0);
    cap.castShadow = true; cap.receiveShadow = true;
    g.add(cap);

    // 环向加强筋（3~4道）
    const ringCount = 4;
    for (let i = 0; i < ringCount; i++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(R + 0.08, 0.05, 8, 64),
        this.materials.shell
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(0, y0 + 0.8 + i * ((H - 1.6) / (ringCount - 1)), 0);
      g.add(ring);
    }

    // 顶部人孔（带螺栓圈）
    const manhole = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.16, 24), this.materials.top);
    manhole.position.set(0.3, cap.position.y + 0.3, -0.5);
    g.add(manhole);
    // 螺栓圈
    for (let i = 0; i < 12; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.08, 8), this.materials.bolt);
      const a = (i / 12) * Math.PI * 2;
      b.position.set(manhole.position.x + Math.cos(a) * 0.45, manhole.position.y + 0.12, manhole.position.z + Math.sin(a) * 0.45);
      g.add(b);
    }

    // 通气口/呼吸阀
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

    // 护笼直爬梯（贴壁）
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

    // 液位计（外置视镜管+刻度）
    const sightTube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, H - 1.2, 16), this.materials.glass);
    sightTube.position.set(-R - 0.6, y0 + (H - 1.2) / 2, -0.2);
    g.add(sightTube);
    // 刻度牌
    const scalePlate = new THREE.Mesh(new THREE.BoxGeometry(0.14, H - 1.3, 0.02), this.materials.labelBg);
    scalePlate.position.set(-R - 0.8, y0 + (H - 1.3) / 2, -0.2);
    g.add(scalePlate);

    // 进出水法兰与阀件
    const nozzleR = 0.16;
    const bottomNozzle = new THREE.Mesh(new THREE.CylinderGeometry(nozzleR, nozzleR, 0.8, 16), this.materials.pipe);
    bottomNozzle.rotation.z = Math.PI / 2;
    bottomNozzle.position.set(-R - 0.45, y0 + 0.4, 0.35);
    g.add(bottomNozzle);
    const bottomFlange = new THREE.Mesh(new THREE.CylinderGeometry(nozzleR * 1.4, nozzleR * 1.4, 0.12, 20), this.materials.flange);
    bottomFlange.rotation.z = Math.PI / 2;
    bottomFlange.position.set(-R - 0.85, y0 + 0.4, 0.35);
    g.add(bottomFlange);
    const valve = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.35, 0.4), this.materials.valve);
    valve.position.set(-R - 1.2, y0 + 0.45, 0.35);
    g.add(valve);

    // 底部接口端口引用
    bottomFlange.name = 'tank_bottom_port';
    this.refs.bottomPort = bottomFlange;
    this.ports.bottom = bottomFlange;

    // 中部侧向喷淋/回流口
    const midNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.7, 16), this.materials.pipe);
    midNozzle.rotation.z = Math.PI / 2;
    midNozzle.position.set(-R - 0.4, y0 + H * 0.45, -0.35);
    g.add(midNozzle);

    // 保温立管（示意）
    const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, H - 1.0, 16), this.materials.insulated);
    riser.position.set(-R - 0.9, y0 + (H - 1.0) / 2, 0);
    g.add(riser);

    // 底部防撞警示环与锚栓
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

    // 正面标签牌
    const labelBg = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.5, 0.02), this.materials.labelBg);
    labelBg.position.set(0.0, y0 + 1.8, R + 0.26);
    g.add(labelBg);

    this.group.add(g);
  }

  // 获取水箱端口世界坐标
  getPortWorldPosition(name) {
    const obj = this.ports?.[name];
    if (!obj) return null;
    const p = new THREE.Vector3();
    obj.getWorldPosition(p);
    return p;
  }

  // 获取泵端口世界坐标
  getPumpPortWorldPosition(pumpKey, portName) {
    const obj = this.pumpPorts?.[pumpKey]?.[portName];
    if (!obj) return null;
    const p = new THREE.Vector3();
    obj.getWorldPosition(p);
    return p;
  }

  #createPumpsAndConnections() {
    const R = this.config.diameter / 2;
    const baseY = this.config.floorY; // 地坪
    // 位置改为水箱的“Y轴负方向”（此处按场景惯例采用 -Z 方向，保持高度不变）
    const zPos = -(R + 3.2);

    // 横向单列排列，间距4个单位：x = -6, -2, 2, 6
    const xs = [-6, -2, 2, 6];

    // 两台除盐水泵（A/B）- 放在左侧两位
    const pumpA = this.#createDeminPump('除盐水泵A', { x: xs[0], y: baseY, z: zPos });
    const pumpB = this.#createDeminPump('除盐水泵B', { x: xs[1], y: baseY, z: zPos });
    this.group.add(pumpA.group, pumpB.group);

    // 两台稀释水泵（1/2）- 放在右侧两位
    const pumpC = this.#createDilutionPump('稀释水泵1', { x: xs[2], y: baseY, z: zPos });
    const pumpD = this.#createDilutionPump('稀释水泵2', { x: xs[3], y: baseY, z: zPos });
    this.group.add(pumpC.group, pumpD.group);

    // 将四台泵的进水口与水箱底部端口连接
    const tankBottom = this.getPortWorldPosition('bottom');
    const pumps = [
      { key: 'pumpA', inlet: this.getPumpPortWorldPosition('pumpA', 'inlet') },
      { key: 'pumpB', inlet: this.getPumpPortWorldPosition('pumpB', 'inlet') },
      { key: 'pumpC', inlet: this.getPumpPortWorldPosition('pumpC', 'inlet') },
      { key: 'pumpD', inlet: this.getPumpPortWorldPosition('pumpD', 'inlet') },
    ];

    pumps.forEach((p, idx) => {
      if (!tankBottom || !p.inlet) return;
      try {
        const pipe = new PipeConnection({
          name: `除盐水箱→${p.key}进水口`,
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

  // 精美除盐水泵（蓝色电机、黄色基座、不锈钢管路与法兰）
  #createDeminPump(label, pos) {
    const group = new THREE.Group();
    group.name = label;

    // 加强型基座（黄色警示色，带加强筋）
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.22, 1.0), new THREE.MeshStandardMaterial({ color: 0xFBBF24, metalness: 0.3, roughness: 0.7 }));
    base.position.set(0, 0.11, 0);
    base.castShadow = true; base.receiveShadow = true;
    group.add(base);

    // 基座加强筋
    for (let i = 0; i < 3; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(1.3, 0.08, 0.06), new THREE.MeshStandardMaterial({ color: 0xF59E0B, metalness: 0.4, roughness: 0.6 }));
      rib.position.set(0, 0.26, -0.4 + i * 0.4);
      group.add(rib);
    }

    // 高级电机（深蓝色，带散热翅片）
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.32, 0.95, 32), new THREE.MeshStandardMaterial({ color: 0x1E3A8A, metalness: 0.85, roughness: 0.2 }));
    motor.rotation.z = Math.PI / 2;
    motor.position.set(-0.3, 0.6, 0);
    motor.castShadow = true; 
    group.add(motor);

    // 电机散热翅片
    for (let i = 0; i < 16; i++) {
      const angle = (i / 16) * Math.PI * 2;
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.8, 0.06), new THREE.MeshStandardMaterial({ color: 0x1E40AF, metalness: 0.8, roughness: 0.3 }));
      fin.position.set(-0.3 + Math.cos(angle) * 0.35, 0.6, Math.sin(angle) * 0.35);
      group.add(fin);
    }

    // 电机端盖（带铭牌）
    const endCap = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.08, 32), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.9, roughness: 0.1 }));
    endCap.rotation.z = Math.PI / 2;
    endCap.position.set(-0.78, 0.6, 0);
    group.add(endCap);

    // 电机铭牌
    const nameplate = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.15, 0.01), new THREE.MeshStandardMaterial({ color: 0xF3F4F6, metalness: 0.1, roughness: 0.8 }));
    nameplate.position.set(-0.82, 0.6, 0);
    nameplate.rotation.z = Math.PI / 2;
    group.add(nameplate);

    // 精密泵头/蜗壳（不锈钢材质）
    const volute = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 0.6, 32), new THREE.MeshStandardMaterial({ color: 0xE5E7EB, metalness: 0.9, roughness: 0.15 }));
    volute.position.set(0.45, 0.55, 0);
    volute.castShadow = true;
    group.add(volute);

    // 蜗壳扩展部分（螺旋形状）
    const voluteExt = new THREE.Mesh(new THREE.TorusGeometry(0.25, 0.15, 8, 24, Math.PI), new THREE.MeshStandardMaterial({ color: 0xD1D5DB, metalness: 0.85, roughness: 0.2 }));
    voluteExt.position.set(0.45, 0.55, 0);
    voluteExt.rotation.x = Math.PI / 2;
    group.add(voluteExt);

    // 高级联轴器护罩（透明橙色，带通风孔）
    const guard = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.3, 16, 1, true), new THREE.MeshStandardMaterial({ color: 0xFB923C, metalness: 0.4, roughness: 0.6, transparent: true, opacity: 0.75 }));
    guard.rotation.z = Math.PI / 2;
    guard.position.set(0.08, 0.55, 0);
    group.add(guard);

    // 联轴器内部（可见部分）
    const coupling = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.25, 12), new THREE.MeshStandardMaterial({ color: 0x6B7280, metalness: 0.9, roughness: 0.2 }));
    coupling.rotation.z = Math.PI / 2;
    coupling.position.set(0.08, 0.55, 0);
    group.add(coupling);

    // 不锈钢进水口（左侧，带法兰）
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.4, 20), this.materials.pipe);
    inlet.rotation.z = Math.PI / 2;
    inlet.position.set(-0.95, 0.45, 0);
    inlet.name = `${label}_inlet_port`;
    inlet.castShadow = true;
    group.add(inlet);

    // 进水法兰
    const inletFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.08, 20), new THREE.MeshStandardMaterial({ color: 0x9CA3AF, metalness: 0.9, roughness: 0.2 }));
    inletFlange.rotation.z = Math.PI / 2;
    inletFlange.position.set(-1.2, 0.45, 0);
    group.add(inletFlange);

    // 进水法兰螺栓
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8), this.materials.bolt);
      bolt.position.set(-1.2, 0.45 + Math.cos(angle) * 0.18, Math.sin(angle) * 0.18);
      bolt.rotation.z = Math.PI / 2;
      group.add(bolt);
    }

    // 不锈钢出水口（上方，带弯头）
    const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.4, 20), this.materials.pipe);
    outlet.position.set(0.75, 0.9, 0);
    outlet.name = `${label}_outlet_port`;
    outlet.castShadow = true;
    group.add(outlet);

    // 出水弯头
    const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.14, 8, 20, Math.PI / 2), this.materials.pipe);
    elbow.position.set(0.75, 0.7, 0);
    elbow.rotation.z = Math.PI;
    group.add(elbow);

    // 出水口标签牌（蓝色）
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.16, 0.02), new THREE.MeshStandardMaterial({ color: 0x3B82F6, metalness: 0.2, roughness: 0.7 }));
    tag.position.set(0.75, 1.25, 0);
    tag.name = `${label}_outlet_tag`;
    group.add(tag);

    // 精美管道支撑框架
    const frame = new THREE.Group();
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 12), this.materials.pipe);
    post.position.set(0, 1.3, 0);
    frame.add(post);
    
    const crossBeam1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.5, 12), this.materials.pipe);
    crossBeam1.rotation.z = Math.PI / 2;
    crossBeam1.position.set(0, 2.0, 0);
    frame.add(crossBeam1);
    
    const crossBeam2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.0, 12), this.materials.pipe);
    crossBeam2.rotation.x = Math.PI / 2;
    crossBeam2.position.set(0, 2.0, 0);
    frame.add(crossBeam2);

    // 设备标识牌（白色背景）
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.35, 0.02), new THREE.MeshStandardMaterial({ color: 0xF9FAFB, metalness: 0.1, roughness: 0.9 }));
    sign.position.set(0, 1.85, 0.1);
    frame.add(sign);

    // 标识牌边框
    const signFrame = new THREE.Mesh(new THREE.BoxGeometry(0.72, 0.37, 0.01), new THREE.MeshStandardMaterial({ color: 0x1F2937, metalness: 0.8, roughness: 0.3 }));
    signFrame.position.set(0, 1.85, 0.09);
    frame.add(signFrame);

    group.add(frame);

    // 控制面板（小型）
    const controlPanel = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.3, 0.08), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.6, roughness: 0.4 }));
    controlPanel.position.set(0.6, 1.2, 0.4);
    group.add(controlPanel);

    // 控制按钮
    const button1 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8), new THREE.MeshStandardMaterial({ color: 0x10B981 }));
    button1.position.set(0.6, 1.3, 0.45);
    group.add(button1);

    const button2 = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8), new THREE.MeshStandardMaterial({ color: 0xEF4444 }));
    button2.position.set(0.6, 1.1, 0.45);
    group.add(button2);

    // 端口存储
    const key = label.includes('A') ? 'pumpA' : 'pumpB';
    this.pumpPorts[key] = {
      inlet,
      outlet,
    };

    group.position.set(pos.x, pos.y, pos.z);
    group.rotation.y = Math.PI / 2; // 旋转90°
    return { group };
  }

  // 精美稀释水泵（绿色电机、灰色基座、铜质管路与法兰）
  #createDilutionPump(label, pos) {
    const group = new THREE.Group();
    group.name = label;

    // 重型基座（灰色，带防震垫）
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.5, 0.25, 1.1), new THREE.MeshStandardMaterial({ color: 0x9CA3AF, metalness: 0.4, roughness: 0.7 }));
    base.position.set(0, 0.125, 0);
    base.castShadow = true; base.receiveShadow = true;
    group.add(base);

    // 防震垫
    for (let i = 0; i < 4; i++) {
      const x = (i % 2) * 1.2 - 0.6;
      const z = Math.floor(i / 2) * 0.8 - 0.4;
      const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 12), new THREE.MeshStandardMaterial({ color: 0x1F2937, metalness: 0.1, roughness: 0.9 }));
      pad.position.set(x, 0.02, z);
      group.add(pad);
    }

    // 基座加强板
    const reinforcement = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.06, 0.1), new THREE.MeshStandardMaterial({ color: 0x6B7280, metalness: 0.6, roughness: 0.5 }));
    reinforcement.position.set(0, 0.28, 0);
    group.add(reinforcement);

    // 高效电机（绿色环保色，带冷却风扇）
    const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 1.0, 32), new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.8, roughness: 0.25 }));
    motor.rotation.z = Math.PI / 2;
    motor.position.set(-0.35, 0.6, 0);
    motor.castShadow = true;
    group.add(motor);

    // 电机冷却风扇罩
    const fanCover = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.38, 0.1, 32, 1, true), new THREE.MeshStandardMaterial({ color: 0x047857, metalness: 0.7, roughness: 0.3 }));
    fanCover.rotation.z = Math.PI / 2;
    fanCover.position.set(-0.85, 0.6, 0);
    group.add(fanCover);

    // 风扇叶片（可见）
    for (let i = 0; i < 6; i++) {
      const angle = (i / 6) * Math.PI * 2;
      const blade = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.04, 0.02), new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.8, roughness: 0.2 }));
      blade.position.set(-0.85, 0.6 + Math.cos(angle) * 0.15, Math.sin(angle) * 0.15);
      blade.rotation.z = angle + Math.PI / 4;
      group.add(blade);
    }

    // 电机接线盒
    const junctionBox = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.12, 0.08), new THREE.MeshStandardMaterial({ color: 0x1F2937, metalness: 0.6, roughness: 0.4 }));
    junctionBox.position.set(-0.35, 0.85, 0.25);
    group.add(junctionBox);

    // 高级泵头/蜗壳（球形设计，不锈钢材质）
    const volute = new THREE.Mesh(new THREE.SphereGeometry(0.42, 32, 24), new THREE.MeshStandardMaterial({ color: 0xF3F4F6, metalness: 0.9, roughness: 0.1 }));
    volute.position.set(0.5, 0.58, 0);
    volute.castShadow = true;
    group.add(volute);

    // 蜗壳分割线（工艺细节）
    const splitLine = new THREE.Mesh(new THREE.TorusGeometry(0.42, 0.01, 8, 32), new THREE.MeshStandardMaterial({ color: 0xD1D5DB, metalness: 0.8, roughness: 0.3 }));
    splitLine.position.set(0.5, 0.58, 0);
    splitLine.rotation.x = Math.PI / 2;
    group.add(splitLine);

    // 精密联轴器（可见设计）
    const coupling = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.2, 16), new THREE.MeshStandardMaterial({ color: 0x6B7280, metalness: 0.9, roughness: 0.15 }));
    coupling.rotation.z = Math.PI / 2;
    coupling.position.set(0.08, 0.58, 0);
    group.add(coupling);

    // 联轴器弹性元件
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const element = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.08, 0.02), new THREE.MeshStandardMaterial({ color: 0xFB923C, metalness: 0.2, roughness: 0.8 }));
      element.position.set(0.08, 0.58 + Math.cos(angle) * 0.08, Math.sin(angle) * 0.08);
      group.add(element);
    }

    // 铜质进水口（左侧，带减震接头）
    const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.45, 20), new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.8, roughness: 0.2 }));
    inlet.rotation.z = Math.PI / 2;
    inlet.position.set(-1.0, 0.45, 0);
    inlet.name = `${label}_inlet_port`;
    inlet.castShadow = true;
    group.add(inlet);

    // 减震接头
    const flexJoint = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.04, 8, 16), new THREE.MeshStandardMaterial({ color: 0x1F2937, metalness: 0.3, roughness: 0.8 }));
    flexJoint.position.set(-1.25, 0.45, 0);
    flexJoint.rotation.y = Math.PI / 2;
    group.add(flexJoint);

    // 进水法兰（铜质）
    const inletFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.24, 0.24, 0.1, 20), new THREE.MeshStandardMaterial({ color: 0xB45309, metalness: 0.85, roughness: 0.25 }));
    inletFlange.rotation.z = Math.PI / 2;
    inletFlange.position.set(-1.35, 0.45, 0);
    group.add(inletFlange);

    // 进水法兰螺栓（黄铜）
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.15, 8), new THREE.MeshStandardMaterial({ color: 0xFBBF24, metalness: 0.9, roughness: 0.1 }));
      bolt.position.set(-1.35, 0.45 + Math.cos(angle) * 0.2, Math.sin(angle) * 0.2);
      bolt.rotation.z = Math.PI / 2;
      group.add(bolt);
    }

    // 铜质出水口（上方，带压力表接口）
    const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.45, 20), new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.8, roughness: 0.2 }));
    outlet.position.set(0.8, 0.95, 0);
    outlet.name = `${label}_outlet_port`;
    outlet.castShadow = true;
    group.add(outlet);

    // 压力表接口
    const pressurePort = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.15, 12), new THREE.MeshStandardMaterial({ color: 0xB45309, metalness: 0.8, roughness: 0.3 }));
    pressurePort.rotation.z = Math.PI / 2;
    pressurePort.position.set(0.65, 0.95, 0);
    group.add(pressurePort);

    // 压力表
    const gauge = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.04, 16), new THREE.MeshStandardMaterial({ color: 0xF9FAFB, metalness: 0.1, roughness: 0.9 }));
    gauge.rotation.z = Math.PI / 2;
    gauge.position.set(0.5, 0.95, 0);
    group.add(gauge);

    // 压力表表盘
    const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.01, 16), new THREE.MeshStandardMaterial({ color: 0x1F2937, metalness: 0.8, roughness: 0.2 }));
    dial.rotation.z = Math.PI / 2;
    dial.position.set(0.48, 0.95, 0);
    group.add(dial);

    // 出水弯头（铜质）
    const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.22, 0.14, 8, 20, Math.PI / 2), new THREE.MeshStandardMaterial({ color: 0xD97706, metalness: 0.8, roughness: 0.2 }));
    elbow.position.set(0.8, 0.75, 0);
    elbow.rotation.z = Math.PI;
    group.add(elbow);

    // 出水口标签牌（绿色）
    const tag = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.18, 0.02), new THREE.MeshStandardMaterial({ color: 0x10B981, metalness: 0.2, roughness: 0.7 }));
    tag.position.set(0.8, 1.35, 0);
    tag.name = `${label}_outlet_tag`;
    group.add(tag);

    // 高级管道支撑框架（三角桁架设计）
    const frame = new THREE.Group();
    const mainPost = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 1.8, 12), new THREE.MeshStandardMaterial({ color: 0x6B7280, metalness: 0.8, roughness: 0.3 }));
    mainPost.position.set(0, 1.4, 0);
    frame.add(mainPost);

    // 三角支撑
    const support1 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0x6B7280, metalness: 0.8, roughness: 0.3 }));
    support1.rotation.z = Math.PI / 6;
    support1.position.set(-0.3, 1.8, 0);
    frame.add(support1);

    const support2 = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 1.2, 12), new THREE.MeshStandardMaterial({ color: 0x6B7280, metalness: 0.8, roughness: 0.3 }));
    support2.rotation.z = -Math.PI / 6;
    support2.position.set(0.3, 1.8, 0);
    frame.add(support2);

    // 横梁
    const crossBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.6, 12), new THREE.MeshStandardMaterial({ color: 0x6B7280, metalness: 0.8, roughness: 0.3 }));
    crossBeam.rotation.z = Math.PI / 2;
    crossBeam.position.set(0, 2.2, 0);
    frame.add(crossBeam);

    // 设备标识牌（绿色主题）
    const sign = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.4, 0.02), new THREE.MeshStandardMaterial({ color: 0xF0FDF4, metalness: 0.1, roughness: 0.9 }));
    sign.position.set(0, 2.0, 0.12);
    frame.add(sign);

    // 标识牌边框（绿色）
    const signFrame = new THREE.Mesh(new THREE.BoxGeometry(0.82, 0.42, 0.01), new THREE.MeshStandardMaterial({ color: 0x059669, metalness: 0.6, roughness: 0.4 }));
    signFrame.position.set(0, 2.0, 0.11);
    frame.add(signFrame);

    group.add(frame);

    // 变频控制器
    const vfd = new THREE.Mesh(new THREE.BoxGeometry(0.25, 0.35, 0.12), new THREE.MeshStandardMaterial({ color: 0x1F2937, metalness: 0.6, roughness: 0.4 }));
    vfd.position.set(0.7, 1.3, 0.45);
    group.add(vfd);

    // 控制器显示屏
    const display = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.08, 0.01), new THREE.MeshStandardMaterial({ color: 0x059669, emissive: 0x022c22, emissiveIntensity: 0.3 }));
    display.position.set(0.7, 1.4, 0.52);
    group.add(display);

    // 控制按钮组
    const buttons = [
      { color: 0x10B981, pos: [0.65, 1.2, 0.52] },
      { color: 0xEF4444, pos: [0.75, 1.2, 0.52] },
      { color: 0xF59E0B, pos: [0.7, 1.1, 0.52] }
    ];

    buttons.forEach(btn => {
      const button = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8), new THREE.MeshStandardMaterial({ color: btn.color }));
      button.position.set(...btn.pos);
      group.add(button);
    });

    // 端口存储
    const key = label.includes('1') ? 'pumpC' : 'pumpD';
    this.pumpPorts[key] = { inlet, outlet };

    group.position.set(pos.x, pos.y, pos.z);
    group.rotation.y = Math.PI / 2; // 旋转90°
    return { group };
  }

  // 标签与信息牌（参考工艺水箱标签实现）
  createLabelsAndSigns() {
    const labelGroup = new THREE.Group();
    labelGroup.name = 'labelsAndSigns';

    const radius = this.config.diameter / 2;
    const height = this.config.height;

    // 主标签：除盐水箱（采用本文件中 labelStroke 颜色）
    const tankLabelColor = '#FF3344';
    const mainLabel = this.createTankLabel('除盐水箱', tankLabelColor);
    mainLabel.position.set(0, height + 7, 0);
    labelGroup.add(mainLabel);

    // 泵标签：与泵外观配色呼应
    const pumpLabelConfigs = [
      { text: '除盐水泵A', color: '#3B82F6', pos: { x: -6, y: 6, z: -(radius + 3.2 + 5) } },
      { text: '除盐水泵B', color: '#3B82F6', pos: { x: -2, y: 6, z: -(radius + 3.2 + 5) } },
      { text: '稀释水泵1', color: '#10B981', pos: { x: 2, y: 6, z: -(radius + 3.2 + 5) } },
      { text: '稀释水泵2', color: '#10B981', pos: { x: 6, y: 6, z: -(radius + 3.2 + 5) } },
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


