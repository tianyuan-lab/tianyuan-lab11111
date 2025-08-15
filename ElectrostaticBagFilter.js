/**
 * 电袋复合除尘器（ESP + 袋滤）- 简化工业外观 + 结构化内部示意
 * - 四个除尘室：每室按烟气流向 入口→电除尘区→袋除尘区→洁净气室
 * - 主要部件：壳体、灰斗、支撑钢结构、入口/出口烟道、顶部脉冲/提升阀示意
 */
class ElectrostaticBagFilter {
  /**
   * @param {Object} config
   * @param {string} config.name
   * @param {{x:number,y:number,z:number}} config.position
   * @param {{x:number,y:number,z:number}} config.rotation
   * @param {number} config.scale
   * @param {number} config.numChambers
   */
  constructor(config = {}) {
    this.config = {
      name: config.name || '电袋除尘器',
      position: config.position || { x: 0, y: 0, z: 0 },
      rotation: config.rotation || { x: 0, y: 0, z: 0 },
      scale: config.scale || 1.0,
      // 以米为单位（1:1），更贴合工程尺寸
      numChambers: 4,
      chamberWidth: 7.5,
      chamberDepth: 14,
      chamberHeight: 18,
      hopperHeight: 5,
      supportHeight: 6,
      // 深度倍率（沿Y/three.js的Z方向放大）；例如2→深度加倍
      depthScale: 2,
      shellThickness: 0.15,
      walkwayMargin: 1.2,
      ...config,
    };

    this.group = new THREE.Group();
    this.group.name = this.config.name;

    // 初始化视角状态
    this.isInteriorView = false;
    this.interiorGroup = null;
    this.exteriorGroup = null;

    // 内部参数（可尺寸化）：支持外部通过 config 覆盖
    this.params = {
      esp: {
        plateCount: typeof config.espPlateCount === 'number' ? config.espPlateCount : 8,
        wirePerGap: typeof config.espWirePerGap === 'number' ? config.espWirePerGap : 1,
        plateCorrugations: typeof config.espPlateCorrugations === 'number' ? config.espPlateCorrugations : 10,
        plateAmplitude: typeof config.espPlateAmplitude === 'number' ? config.espPlateAmplitude : 0.06,
        plateWidthX: typeof config.espPlateWidthX === 'number' ? config.espPlateWidthX : 0.42
      },
      bag: {
        rows: typeof config.bagRows === 'number' ? config.bagRows : 5,
        cols: typeof config.bagCols === 'number' ? config.bagCols : 8
      }
    };

    this.materials = this.#createMaterials();

    // 进气口本地坐标集合（用于连管）：按分室顺序存储四个尖端外侧法兰中心
    this.inletPortsLocal = [];

    this.#buildStructure();
    this.#createInteriorStructure();
    this.#applyTransform();
  }

  getGroup() { return this.group; }

  #createMaterials() {
    return {
      // 外壳与壁板（灰）
      shell: new THREE.MeshStandardMaterial({ color: 0xB0B5BB, metalness: 0.4, roughness: 0.55 }),
      panel: new THREE.MeshStandardMaterial({ color: 0x9EA5AC, metalness: 0.45, roughness: 0.6 }),
      // 一般钢件（深灰）
      frame: new THREE.MeshStandardMaterial({ color: 0x596068, metalness: 0.85, roughness: 0.3 }),
      // 旧蓝色支撑（已弃用）仍保留以兼容
      support: new THREE.MeshStandardMaterial({ color: 0x2E6BB2, metalness: 0.5, roughness: 0.55 }),
      // 新：立柱/斜撑（黄色）
      supportYellow: new THREE.MeshStandardMaterial({ color: 0xE0B400, metalness: 0.5, roughness: 0.55 }),
      basePlate: new THREE.MeshStandardMaterial({ color: 0x3E4248, metalness: 0.8, roughness: 0.25 }),
      // 烟道（金属灰）
      duct: new THREE.MeshStandardMaterial({ color: 0x9DA5AE, metalness: 0.75, roughness: 0.35 }),
      // 电除尘内部极板（蓝灰）
      esp: new THREE.MeshStandardMaterial({ color: 0x5A6B7C, metalness: 0.7, roughness: 0.35 }),
      bag: new THREE.MeshStandardMaterial({ color: 0xE8EDF2, metalness: 0.05, roughness: 0.9 }),
      hopper: new THREE.MeshStandardMaterial({ color: 0xAAB2BA, metalness: 0.5, roughness: 0.6 }),
      // 顶部踏台/屋面
      roof: new THREE.MeshStandardMaterial({ color: 0x5A646C, metalness: 0.75, roughness: 0.25 }),
      // 安全栏杆与平台（深绿）
      rail: new THREE.MeshStandardMaterial({ color: 0x1E6B4E, metalness: 0.5, roughness: 0.5 }),
      // 顶部红色防护盖
      topCover: new THREE.MeshStandardMaterial({ color: 0xC53030, metalness: 0.4, roughness: 0.6 }),
      // 螺栓
      bolt: new THREE.MeshStandardMaterial({ color: 0x4B4F55, metalness: 0.9, roughness: 0.2 }),
      // 顶部阀门金属银色
      metalSilver: new THREE.MeshStandardMaterial({ color: 0xBFC5C8, metalness: 0.85, roughness: 0.25 }),
      boltDark: new THREE.MeshStandardMaterial({ color: 0x3C4145, metalness: 0.9, roughness: 0.25 }),
      // 脉冲阀电磁线圈（黑）
      solenoidBlack: new THREE.MeshStandardMaterial({ color: 0x111111, metalness: 0.2, roughness: 0.6 })
    };
  }

  /** 创建HUD样式精灵标签（用于内部标注） */
  #createSpriteLabel(text, color = '#FFFFFF', width = 256, height = 64, fontPx = 22) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = width;
    canvas.height = height;

    // 背景
    ctx.fillStyle = 'rgba(0, 0, 0, 0.78)';
    const r = 10;
    ctx.beginPath();
    ctx.moveTo(r, 0);
    ctx.lineTo(width - r, 0);
    ctx.quadraticCurveTo(width, 0, width, r);
    ctx.lineTo(width, height - r);
    ctx.quadraticCurveTo(width, height, width - r, height);
    ctx.lineTo(r, height);
    ctx.quadraticCurveTo(0, height, 0, height - r);
    ctx.lineTo(0, r);
    ctx.quadraticCurveTo(0, 0, r, 0);
    ctx.closePath();
    ctx.fill();

    // 边框
    ctx.strokeStyle = color;
    ctx.lineWidth = 3;
    ctx.stroke();

    // 文本
    ctx.fillStyle = color;
    ctx.font = `Bold ${fontPx}px Microsoft YaHei, Arial`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(text), width / 2, height / 2);

    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.96, alphaTest: 0.01 });
    const spr = new THREE.Sprite(mat);
    spr.scale.set(width / 64, height / 64, 1);
    return spr;
  }

  /** 创建带轻微波纹起伏的极板近似（将板条分段并交替前后偏移） */
  #createCorrugatedPlate(width, height, depth, corrugations, amplitude, material) {
    const group = new THREE.Group();
    const segments = Math.max(2, corrugations * 2);
    const sliceW = width / segments;
    for (let i = 0; i < segments; i++) {
      const offsetZ = (i % 2 === 0 ? amplitude : -amplitude);
      const slice = new THREE.Mesh(new THREE.BoxGeometry(Math.max(0.01, sliceW * 0.98), height, Math.max(0.02, depth - 0.02)), material);
      slice.position.x = -width / 2 + sliceW / 2 + i * sliceW;
      slice.position.z = offsetZ;
      group.add(slice);
    }
    return group;
  }

  #buildStructure() {
    // 创建外部结构组
    this.exteriorGroup = new THREE.Group();
    this.exteriorGroup.name = 'exteriorStructure';
    this.exteriorGroup.visible = true;
    this.group.add(this.exteriorGroup);

    const n = this.config.numChambers;
    const W = this.config.chamberWidth;
    const D = this.config.chamberDepth * Math.max(1, Math.round(this.config.depthScale || 1));
    const H = this.config.chamberHeight;
    const hopperH = this.config.hopperHeight;
    const supportH = this.config.supportHeight;
    const totalWidth = n * W;
    const shellGroup = new THREE.Group();
    shellGroup.name = 'shellAndChambers';

    // 新：底部多灰斗 + 黄色支撑框架与斜撑
    this.#buildYellowSupportAndHoppers(n, W, D, supportH, hopperH, H);

    // 每个室：壳体+灰斗+内部件
    for (let i = 0; i < n; i++) {
      const chamber = new THREE.Group();
      chamber.name = `chamber_${i + 1}`;
      const cx = -totalWidth / 2 + i * W + W / 2;

      // 每室上部直立壳体（灰斗移至统一构建函数中）

      // 直立壳体（含电区+袋区）—主体箱体
      const bodyHeight = H;
      const body = new THREE.Mesh(new THREE.BoxGeometry(W, bodyHeight, D), this.materials.panel);
      body.position.set(cx, supportH + hopperH + bodyHeight / 2, 0);
      chamber.add(body);

      // 外部网格钢框（工业格栅外框）
      this.#addChamberGridFrame(chamber, cx, supportH + hopperH, bodyHeight, W, D);

      // 壁板加劲肋
      this.#addWallStiffeners(chamber, cx, supportH + hopperH, bodyHeight, W, D);

      // 螺栓阵列（示意）
      this.#addBoltPatternOnPanel(chamber, cx, supportH + hopperH, bodyHeight, W, D);
      // 侧壁斜面（近似外形）：前后两侧各加一对倾斜板，贴合第二张图外壳效果
      const slopeH = bodyHeight * 0.6;
      const slopeThickness = 0.25;
      const slopeZ = D / 2 - 0.1;
      const slopeGeom = new THREE.BoxGeometry(W - 0.8, slopeThickness, slopeH);
      const frontSlope = new THREE.Mesh(slopeGeom, this.materials.shell);
      frontSlope.rotation.x = Math.PI / 2.8; // 倾角
      frontSlope.position.set(cx, supportH + hopperH + slopeH * 0.35, slopeZ);
      const backSlope = frontSlope.clone();
      backSlope.rotation.x = -Math.PI / 2.8;
      backSlope.position.set(cx, supportH + hopperH + slopeH * 0.35, -slopeZ);
      chamber.add(frontSlope, backSlope);

      // 取消原平顶板，顶部由后续人字顶罩屋替代

      // 内部：按流向前半为ESP，后半为袋区（简化几何）
      const espZone = new THREE.Group();
      espZone.name = 'espZone';
      const bagZone = new THREE.Group();
      bagZone.name = 'bagZone';

      // 电除尘极板（若干竖直板）
      const plateCount = 6;
      for (let p = 0; p < plateCount; p++) {
        const plate = new THREE.Mesh(new THREE.BoxGeometry(0.08, bodyHeight - 1.0, D - 1.0), this.materials.esp);
        plate.position.set(
          cx - W / 4 + (p / (plateCount - 1)) * (W / 2),
          supportH + hopperH + bodyHeight / 2,
          0
        );
        espZone.add(plate);
      }

      // 滤袋阵列（简化为多根圆柱）
      const rows = 3, cols = 4;
      for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
          const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, bodyHeight - 1.2, 14), this.materials.bag);
          const bx = cx + W * 0.1 + c * (W * 0.18);
          const bz = -D / 2 + 1.2 + r * ((D - 2.4) / (rows - 1));
          bag.position.set(bx, supportH + hopperH + bodyHeight / 2, bz);
          bagZone.add(bag);
        }
      }

      shellGroup.add(espZone, bagZone);
      shellGroup.add(chamber);
    }

    this.exteriorGroup.add(shellGroup);

    // 左侧（-Y方向，即 three.js 的 -Z）四个圆锥扩散器进气口（与每个分室对齐）
    this.#addConicalInlets(n, W, D, supportH + hopperH, H);

    // 顶部走台与栏杆（深绿色）
    this.#addTopWalkwayAndRails(totalWidth, D, supportH + hopperH + H);

    // 顶部"人字顶"罩屋（每室覆盖3/4长度）及喷吹阀/总管
    this.#addGableRoofHousingsWithValves(n, W, D, supportH + hopperH, H);

    // 顶部均布的红色进出风口防护盖（保留）
    this.#addTopInletCovers(n, W, D, supportH + hopperH, H);

    // 顶部留白处：布置四台振打电机
    this.#addRappingMotors(n, W, D, supportH + hopperH, H);

    // 侧前维护平台与梯子（深绿栏杆）
    this.#addAccessPlatformsAndLadders(totalWidth, D, supportH + hopperH, H);

    // 前右角三跑楼梯塔
    this.#addStairTower(totalWidth, D, supportH + hopperH, H);

    // 脉冲阀+喷吹管+管板（每个分室）
    this.#addPulseSystems(n, W, D, supportH + hopperH, H);

    // 洁净气总管 + 分室切换门（离线阀/分室门）
    this.#addCleanGasHeaderAndDampers(n, W, D, supportH + hopperH, H);

    // ESP绝缘箱与高压引入（电区顶部）
    this.#addESPInsulatorBoxes(n, W, D, supportH + hopperH, H);

    // 设备外部标签（显示在正前上方）
    const topY = supportH + hopperH + H;
    const deviceLabel = this.#createSpriteLabel(this.config.name || '电袋除尘器', '#00D1FF', 320, 90, 26);
    deviceLabel.name = 'buildingLabel_电袋除尘器';
    deviceLabel.position.set(0, topY + 15, 0);
    deviceLabel.scale.multiplyScalar(2);
    this.exteriorGroup.add(deviceLabel);
  }

  /** 顶部“人字顶”罩屋 + 喷吹阀总管与阀门阵列 */
  #addGableRoofHousingsWithValves(n, W, D, baseY, bodyH) {
    const roofDeckY = baseY + bodyH; // 原顶标高
    const coverLen = W * 0.75; // 覆盖3/4长度
    const openLen = W - coverLen; // 后部留空
    const roofPitch = 22 * Math.PI / 180; // 约20~25°
    const sideH = Math.max(1.0, bodyH * 0.5); // 檐口最低距屋面≥0.5×墙高
    const ridgeToEave = W * 0.35; // 屋脊到檐口高度
    const ridgeH = sideH + ridgeToEave; // 屋脊总高度
    const eaveOverhang = W * 0.1; // 檐口外挑

    for (let i = 0; i < n; i++) {
      const bayCenterX = -n * W / 2 + i * W + W / 2;

      // 罩屋框体组
      const house = new THREE.Group();
      house.name = `gableHouse_${i + 1}`;

      // 侧墙（长边沿X），高度 sideH
      const wallThk = 0.08;
      const wallLen = coverLen;
      // 调整宽度为总顶宽的2/3，并保持后沿与机体后沿齐平
      const coverDepth = D * (2 / 3);
      const wallZ = coverDepth / 2 - 0.4; // 相对屋面中心的半幅位置
      const wall1 = new THREE.Mesh(new THREE.BoxGeometry(wallLen, sideH, wallThk), this.materials.panel);
      wall1.position.set(bayCenterX - (W - coverLen) / 2, roofDeckY + sideH / 2, wallZ);
      house.add(wall1);
      const wall2 = wall1.clone();
      wall2.position.z = -wallZ;
      house.add(wall2);

      // 山墙（两端封闭，含三角上段）
      const gableW = wallThk;
      const gableH = ridgeH; // 总高度到屋脊
      const gable1 = new THREE.Mesh(new THREE.BoxGeometry(gableW, gableH, coverDepth - 0.8), this.materials.panel);
      gable1.position.set(bayCenterX - W / 2 + gableW / 2 + openLen, roofDeckY + gableH / 2, 0);
      house.add(gable1);
      const gable2 = gable1.clone();
      gable2.position.x = bayCenterX + coverLen / 2;
      house.add(gable2);
      // 山墙加劲肋
      const stiff = new THREE.Mesh(new THREE.BoxGeometry(0.08, gableH, 0.08), this.materials.shell);
      [ - (coverDepth/2 - 0.6), 0, (coverDepth/2 - 0.6) ].forEach((z)=>{
        const s1 = stiff.clone(); s1.position.set(gable1.position.x, roofDeckY + gableH/2, z); house.add(s1);
        const s2 = stiff.clone(); s2.position.set(gable2.position.x, roofDeckY + gableH/2, z); house.add(s2);
      });

      // 人字屋面（两片波纹板）——两斜面在屋脊相交
      const roofPanelMat = this.materials.shell.clone();
      roofPanelMat.color.setHex(0xCBD2D6);
      roofPanelMat.metalness = 0.6;
      roofPanelMat.roughness = 0.35;
      const panelWidth = coverDepth - 0.6 + eaveOverhang * 2; // 增加两侧外挑
      const panelLen = coverLen;
      const corrugationN = 12;
      for (let side of [-1, 1]) {
        const panel = new THREE.Group();
        // 用多条窄板模拟波纹
        for (let c = 0; c < corrugationN; c++) {
          const strip = new THREE.Mesh(new THREE.BoxGeometry(panelLen, 0.04, panelWidth / corrugationN * 0.9), roofPanelMat);
          strip.position.set(bayCenterX - (W - coverLen) / 2, roofDeckY + sideH + (ridgeH - sideH) / 2, side * (coverDepth / 2 - 0.3 - (c + 0.5) * ( (panelWidth - eaveOverhang*2) / corrugationN)));
          strip.rotation.y = 0;
          strip.rotation.x = side * -roofPitch; // 两片对称
          panel.add(strip);
        }
        house.add(panel);
      }

      // 屋脊梁
      const ridge = new THREE.Mesh(new THREE.BoxGeometry(panelLen, 0.08, 0.12), this.materials.frame);
      ridge.position.set(bayCenterX - (W - coverLen) / 2, roofDeckY + ridgeH, 0);
      house.add(ridge);

      // 檐口外挑托架（若干）
      for (let s = 0; s <= 6; s++) {
        const t = s / 6;
        const x = (bayCenterX - (W - coverLen) / 2) - panelLen / 2 + t * panelLen;
        for (let side of [-1, 1]) {
          const bracket = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.2, eaveOverhang), this.materials.frame);
          bracket.position.set(x, roofDeckY + sideH + 0.1, side * (coverDepth / 2 - 0.35 - eaveOverhang / 2));
          house.add(bracket);
        }
      }

      // 调整到相反侧：使前沿与机体前沿齐平（仅后侧留空）
      house.position.z = D / 6; // 覆盖2/3，总中心前移 D/6
      // 记录屋脊式结构前后沿Z，用于振打电机定位
      this.gableFrontZ = house.position.z + coverDepth / 2;
      this.gableRearZ = house.position.z - coverDepth / 2;

      this.exteriorGroup.add(house);

      // 阀门与总管：随屋面前移，同步在相同深度范围 coverDepth 内布置
      this.#addPulseValveArray(bayCenterX - (W - coverLen) / 2, roofDeckY, coverDepth, coverLen, sideH);
    }
  }

  /** 生成一组脉冲喷吹阀及总管（两侧各一排） - 改为真实膜片脉冲阀并按要求布置 */
  #addPulseValveArray(centerX, topY, D, coverLen, sideH) {
    const depthSpan = D - 0.8;
    const valveCount = 10; // 单排10个
    const pitchZ = depthSpan / (valveCount + 1);
    const manifoldR = 0.06;
    const valveBodyDia = 0.25; // 1:1 直径
    for (let side of [-1, 1]) {
      const edgeX = centerX + (side > 0 ? coverLen / 2 : -coverLen / 2);
      // 并行总管
      const manifold = new THREE.Mesh(new THREE.CylinderGeometry(manifoldR, manifoldR, depthSpan * 0.96, 16), this.materials.duct);
      manifold.rotation.x = Math.PI / 2;
      manifold.position.set(edgeX, (topY - 5) + sideH * 0.75, 5); // 再前移2，合计前移8
      this.exteriorGroup.add(manifold);
      // 阀门阵列
      for (let k = 1; k <= valveCount; k++) {
        const z = -depthSpan / 2 + k * pitchZ;
        const valve = this.#createRealPulseValve(valveBodyDia);
        valve.scale.set(2, 2, 2); // 喷吹阀模型整体放大2倍（管道不动）
        valve.position.set(edgeX + (side > 0 ? 0.18 : -0.18), (topY - 5) + sideH * 0.82, z + 5);
        valve.rotation.y = side > 0 ? Math.PI / 2 : -Math.PI / 2; // 朝同一侧
        this.exteriorGroup.add(valve);
        // 短支管连接总管 → 阀体入口
        const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.24, 12), this.materials.duct);
        branch.rotation.z = Math.PI / 2;
        branch.position.set(edgeX + (side > 0 ? 0.09 : -0.09), (topY - 5) + sideH * 0.78, z + 5);
        this.exteriorGroup.add(branch);
      }
    }
  }

  /** 真实膜片脉冲阀（平顶圆壳+顶置电磁头+对向法兰+下垂排气筒） */
  #createRealPulseValve(bodyDia /*≈0.25m*/) {
    const g = new THREE.Group();
    const bodyH = 0.08; // 扁平圆壳高度
    const domeH = 0.025;
    const r = bodyDia / 2;

    // 阀体壳体：上下面盘+中间圆筒（略鼓）
    const body = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.98, r * 0.98, bodyH, 36), this.materials.metalSilver);
    g.add(body);
    const dome = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.6, r * 0.6, domeH, 24), this.materials.metalSilver);
    dome.position.y = bodyH / 2 + domeH / 2;
    g.add(dome);
    // 法兰边+螺栓
    const flange = new THREE.Mesh(new THREE.TorusGeometry(r * 0.95, r * 0.07, 10, 40), this.materials.metalSilver);
    flange.rotation.x = Math.PI / 2;
    flange.position.y = -bodyH / 2 + 0.01;
    g.add(flange);
    const boltN = 16;
    for (let i = 0; i < boltN; i++) {
      const ang = (i / boltN) * Math.PI * 2;
      const bx = Math.cos(ang) * r * 0.9;
      const bz = Math.sin(ang) * r * 0.9;
      const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 6), this.materials.boltDark);
      bolt.position.set(bx, -bodyH / 2, bz);
      bolt.rotation.x = Math.PI / 2;
      g.add(bolt);
    }

    // 对向进/出口短管（带法兰圈）
    for (let s of [-1, 1]) {
      const port = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.16, 16), this.materials.duct);
      port.rotation.z = Math.PI / 2;
      port.position.set(s * (r + 0.08), 0, 0);
      g.add(port);
      const pFlange = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.02, 20), this.materials.metalSilver);
      pFlange.rotation.z = Math.PI / 2;
      pFlange.position.set(s * (r + 0.16), 0, 0);
      g.add(pFlange);
    }

    // 顶部电磁头：底座+线圈+导管（总高加长0.20m）
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.11, 0.03, 0.09), this.materials.metalSilver);
    const extraSolenoidH = 0.20; // 顶部区加高
    base.position.set(0, bodyH / 2 + domeH + 0.015 + extraSolenoidH, 0);
    g.add(base);
    const coil = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.05, 18), this.materials.solenoidBlack);
    coil.position.set(0, base.position.y + 0.04, 0);
    g.add(coil);
    const conduit = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.18 + extraSolenoidH, 10), this.materials.frame);
    conduit.rotation.z = Math.PI / 2;
    conduit.position.set(r * 0.7, base.position.y + 0.01, 0);
    g.add(conduit);

    // 下垂排气筒（两根），上端带法兰圈
    const tubeLen = 0.4 + 0.80; // 排气筒加长0.80m
    for (let i = -1; i <= 1; i += 2) {
      const ring = new THREE.Mesh(new THREE.TorusGeometry(0.06, 0.01, 8, 20), this.materials.metalSilver);
      ring.rotation.x = Math.PI / 2;
      ring.position.set(i * 0.1, -bodyH / 2 - 0.01, 0);
      g.add(ring);
      const tube = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, tubeLen, 16), this.materials.duct);
      tube.position.set(i * 0.1, -bodyH / 2 - tubeLen / 2 - 0.02, 0);
      g.add(tube);
    }

    return g;
  }

  /** 新底部结构：黄色立柱/梁/斜撑 + 多灰斗（每室一个） */
  #buildYellowSupportAndHoppers(n, W, D, supportH, hopperH, bodyH) {
    const grid = new THREE.Group();
    grid.name = 'yellowSupportAndHoppers';
    const totalWidth = n * W;
    const baseY = 0; // 地面
    // 三列均布（左右各加一列），中心在 z=0，间距相等
    const rows = 3;
    const spanZ = D / rows; // 每列占用深度
    const topSizeMax = Math.min(W - 0.6, spanZ - 0.6) * 0.9;

    const columnGeom = new THREE.BoxGeometry(0.24, supportH, 0.24);
    const basePlateGeom = new THREE.BoxGeometry(0.5, 0.05, 0.5);
    const beamH = 0.2;

    for (let i = 0; i < n; i++) {
      const cx = -totalWidth / 2 + i * W + W / 2;
      for (let r = 0; r < rows; r++) {
        const zc = -D / 2 + (r + 0.5) * spanZ;
        const half = topSizeMax / 2;

        // 立柱 + 底板
        const corners = [
          [cx - half, zc - half], [cx + half, zc - half],
          [cx - half, zc + half], [cx + half, zc + half]
        ];
        corners.forEach(([x, z]) => {
          const col = new THREE.Mesh(columnGeom, this.materials.supportYellow);
          col.position.set(x, supportH / 2, z);
          grid.add(col);
          const base = new THREE.Mesh(basePlateGeom, this.materials.basePlate);
          base.position.set(x, baseY + 0.025, z);
          grid.add(base);
        });

        // 顶部梁矩形框 + 中腰联系杆
        const beamXGeom = new THREE.BoxGeometry(topSizeMax, beamH, 0.24);
        const beamZGeom = new THREE.BoxGeometry(0.24, beamH, topSizeMax);
        const t1 = new THREE.Mesh(beamXGeom, this.materials.supportYellow); t1.position.set(cx, supportH, zc - half); grid.add(t1);
        const t2 = t1.clone(); t2.position.z = zc + half; grid.add(t2);
        const t3 = new THREE.Mesh(beamZGeom, this.materials.supportYellow); t3.position.set(cx - half, supportH, zc); grid.add(t3);
        const t4 = t3.clone(); t4.position.x = cx + half; grid.add(t4);
        const midY = supportH * 0.5;
        const m1 = new THREE.Mesh(beamXGeom, this.materials.supportYellow); m1.position.set(cx, midY, zc - half); grid.add(m1);
        const m2 = m1.clone(); m2.position.z = zc + half; grid.add(m2);
        const m3 = new THREE.Mesh(beamZGeom, this.materials.supportYellow); m3.position.set(cx - half, midY, zc); grid.add(m3);
        const m4 = m3.clone(); m4.position.x = cx + half; grid.add(m4);

        // X型斜撑 两道
        const diagLen = Math.hypot(topSizeMax, supportH);
        const braceGeom = new THREE.BoxGeometry(0.12, 0.12, diagLen);
        const b1 = new THREE.Mesh(braceGeom, this.materials.supportYellow); b1.position.set(cx, supportH / 2, zc - half); b1.rotation.x = Math.PI / 2; b1.rotation.y = Math.atan2(topSizeMax, supportH); grid.add(b1);
        const b2 = b1.clone(); b2.rotation.y = -Math.atan2(topSizeMax, supportH); grid.add(b2);
        const b3 = b1.clone(); b3.position.z = zc + half; grid.add(b3);
        const b4 = b2.clone(); b4.position.z = zc + half; grid.add(b4);

        // 灰斗与上口框
        const hopperHeight = bodyH * 0.6;
        const rTop = (topSizeMax) / Math.SQRT2;
        const rBot = (topSizeMax * 0.2) / Math.SQRT2;
        const hopper = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, hopperHeight, 4, 1, true), this.materials.hopper);
        hopper.rotation.y = Math.PI / 4; hopper.position.set(cx, supportH + hopperHeight / 2, zc); grid.add(hopper);
        const rim = new THREE.Mesh(new THREE.BoxGeometry(topSizeMax, 0.15, topSizeMax), this.materials.panel); rim.position.set(cx, supportH + 0.08, zc); grid.add(rim);

        // 排料口与下方容器（按参考图片1:1还原）
        const spout = new THREE.Mesh(new THREE.BoxGeometry(topSizeMax * 0.18, topSizeMax * 0.18, 0.4), this.materials.frame); spout.position.set(cx, supportH + 0.05, zc); grid.add(spout);
        
        // 圆锥形底部容器（灰色，与图片匹配）
        const vesselTopRadius = 1.2;   // 圆筒半径
        const vesselBottomRadius = 0.45; // 圆锥底部半径
        const vesselHeight = 2.8;      // 总高度（近似）

        // 组合容器（上半球顶 + 圆筒 + 下圆锥）
        const tank = new THREE.Group();
        const shellMat = this.materials.hopper; // 灰蓝色

        // 一体成型：倒圆锥（下尖小、上大）与圆筒使用LatheGeometry旋转成型
        const coneH = 1.2; // 锥段高度
        const barrelH = Math.max(0.8, vesselHeight - coneH - 0.6); // 圆筒高度
        const profile = [];
        // 从底部开始（开口），半径为 vesselBottomRadius → 到锥段顶部半径 vesselTopRadius → 到圆筒顶部
        profile.push(new THREE.Vector2(vesselBottomRadius, 0));
        profile.push(new THREE.Vector2(vesselTopRadius, coneH));
        profile.push(new THREE.Vector2(vesselTopRadius, coneH + barrelH));
        const body = new THREE.Mesh(new THREE.LatheGeometry(profile, 48), shellMat);
        // 使底部位于 y=0 起点
        body.position.set(0, 0, 0);
        tank.add(body);

        // 上部半球顶
        const dome = new THREE.Mesh(new THREE.SphereGeometry(vesselTopRadius, 32, 20, 0, Math.PI * 2, 0, Math.PI / 2), shellMat);
        dome.position.set(0, coneH + barrelH, 0);
        tank.add(dome);

        // 两侧法兰管嘴
        const nozzleR = 0.22, nozzleL = 1.0;
        for (let s of [-1, 1]) {
          const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(nozzleR, nozzleR, nozzleL, 18), this.materials.duct);
          nozzle.rotation.z = Math.PI / 2;
          nozzle.position.set(s * vesselTopRadius, coneH + barrelH * 0.55, 0);
          tank.add(nozzle);
          const endFlange = new THREE.Mesh(new THREE.CylinderGeometry(nozzleR * 1.55, nozzleR * 1.55, 0.08, 20), this.materials.panel);
          endFlange.rotation.z = Math.PI / 2;
          endFlange.position.set(s * (vesselTopRadius + nozzleL / 2), coneH + barrelH * 0.55, 0);
          tank.add(endFlange);
        }

        // 底部法兰与出料短管+阀门
        const bottomFlange = new THREE.Mesh(new THREE.TorusGeometry(vesselBottomRadius + 0.05, 0.04, 10, 28), this.materials.panel);
        bottomFlange.rotation.x = Math.PI / 2;
        bottomFlange.position.set(0, 0.02, 0);
        tank.add(bottomFlange);
        const outletPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.55, 16), this.materials.frame);
        outletPipe.position.set(0, -0.25, 0);
        tank.add(outletPipe);
        const valveBody = new THREE.Mesh(new THREE.SphereGeometry(0.16, 18, 12), this.materials.metalSilver);
        valveBody.position.set(0, -0.5, 0);
        tank.add(valveBody);

        // 圆筒与圆锥过渡法兰圈
        // 一体成型，不再需要中间法兰

        // 将容器整体定位到原位置
        tank.position.set(cx, 0.2, zc);
        // 第一行（r===0）容器：高度与半径×1.5，其余两行：×2
        if (r === 0) {
          tank.scale.set(1.5, 1.5, 1.5);
        } else {
          tank.scale.set(1.2, 1.2, 1.2);
        }
       
        grid.add(tank);
      }
    }

    this.exteriorGroup.add(grid);
  }

  /** 顶部走台与栏杆 */
  #addTopWalkwayAndRails(totalWidth, depth, topY) {
    const platformThickness = 0.15;
    const walkway = new THREE.Mesh(new THREE.BoxGeometry(totalWidth + 1.2, platformThickness, depth + 1.2), this.materials.roof);
    walkway.position.set(0, topY + 0.25, 0);
    walkway.name = 'topWalkway';
    this.exteriorGroup.add(walkway);

    // 栏杆
    const railH = 1.0;
    const railOffsetX = (totalWidth + 1.2) / 2;
    const railOffsetZ = (depth + 1.2) / 2;
    const postMat = this.materials.rail; // 使用深绿色安全栏杆材质
    const addRailSide = (x1, z1, x2, z2) => {
      const segN = 10;
      for (let i = 0; i <= segN; i++) {
        const t = i / segN;
        const px = x1 + (x2 - x1) * t;
        const pz = z1 + (z2 - z1) * t;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, railH, 8), postMat);
        post.position.set(px, topY + 0.25 + railH / 2, pz);
        this.exteriorGroup.add(post);
      }
      const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, Math.hypot(x2 - x1, z2 - z1), 10), postMat);
      rail.position.set((x1 + x2) / 2, topY + 0.25 + railH, (z1 + z2) / 2);
      rail.rotation.y = Math.atan2(x2 - x1, z2 - z1);
      this.exteriorGroup.add(rail);
    };
    // 四边栏杆
    addRailSide(-railOffsetX, -railOffsetZ, railOffsetX, -railOffsetZ);
    addRailSide(railOffsetX, -railOffsetZ, railOffsetX, railOffsetZ);
    addRailSide(railOffsetX, railOffsetZ, -railOffsetX, railOffsetZ);
    addRailSide(-railOffsetX, railOffsetZ, -railOffsetX, -railOffsetZ);
  }

  /** 每室外部网格钢框（格栅效果） */
  #addChamberGridFrame(parent, cx, baseY, bodyH, W, D) {
    const gridGroup = new THREE.Group();
    gridGroup.name = `gridFrame_${cx.toFixed(2)}`;
    const barMat = this.materials.frame;
    const barThk = 0.08;
    const spacing = 1.2; // 网格间距
    const startY = baseY + 0.2;
    const endY = baseY + bodyH - 0.2;
    // 前后两侧水平+竖向条
    for (let zSide of [-1, 1]) {
      // 竖向
      for (let x = -W / 2 + 0.2; x <= W / 2 - 0.2; x += spacing) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(barThk, bodyH - 0.4, barThk), barMat);
        bar.position.set(cx + x, baseY + bodyH / 2, zSide * (D / 2 + barThk / 2));
        gridGroup.add(bar);
      }
      // 水平
      for (let y = startY; y <= endY; y += spacing) {
        const bar = new THREE.Mesh(new THREE.BoxGeometry(W - 0.4, barThk, barThk), barMat);
        bar.position.set(cx, y, zSide * (D / 2 + barThk / 2));
        gridGroup.add(bar);
      }
    }
    parent.add(gridGroup);
  }

  /** 墙板加强筋（竖向） */
  #addWallStiffeners(parent, cx, baseY, bodyH, W, D) {
    const ribGroup = new THREE.Group();
    ribGroup.name = `stiffeners_${cx.toFixed(2)}`;
    const ribMat = this.materials.shell;
    const ribW = 0.12, ribT = 0.06;
    const gap = 1.5;
    for (let dir of [-1, 1]) {
      for (let x = -W / 2 + gap; x <= W / 2 - gap; x += gap) {
        const rib = new THREE.Mesh(new THREE.BoxGeometry(ribW, bodyH - 0.8, ribT), ribMat);
        rib.position.set(cx + x, baseY + bodyH / 2, dir * (D / 2 - 0.05));
        ribGroup.add(rib);
      }
    }
    parent.add(ribGroup);
  }

  /** 壁板螺栓阵列（示意用） */
  #addBoltPatternOnPanel(parent, cx, baseY, bodyH, W, D) {
    const bolts = new THREE.Group();
    bolts.name = `bolts_${cx.toFixed(2)}`;
    const boltMat = this.materials.bolt;
    const r = 0.04;
    const pitchX = 1.5;
    const pitchY = 1.5;
    // 前后两侧边缘一圈螺栓
    for (let side of [-1, 1]) {
      for (let x = -W / 2 + 0.3; x <= W / 2 - 0.3; x += pitchX) {
        for (let y = baseY + 0.5; y <= baseY + bodyH - 0.5; y += pitchY) {
          const head = new THREE.Mesh(new THREE.CylinderGeometry(r, r, 0.04, 10), boltMat);
          head.rotation.x = Math.PI / 2;
          head.position.set(cx + x, y, side * (D / 2 + 0.02));
          bolts.add(head);
        }
      }
    }
    parent.add(bolts);
  }

  /** 顶部均布红色进出风口防护盖 */
  #addTopInletCovers(n, W, D, baseY, bodyH) {
    const topY = baseY + bodyH + 0.35;
    const rows = 2;
    const cols = n * 2; // 每室两个
    const coverW = 1.4, coverH = 0.25, coverD = 2.0;
    const marginX = (n * W - cols * coverW) / (cols + 1);
    const marginZ = (D - rows * coverD) / (rows + 1);
    let index = 0;
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        const cover = new THREE.Mesh(new THREE.BoxGeometry(coverW, coverH, coverD), this.materials.topCover);
        const x = -n * W / 2 + marginX * (c + 1) + coverW * (c + 0.5);
        const z = -D / 2 + marginZ * (r + 1) + coverD * (r + 0.5);
        cover.position.set(x, topY, z);
        cover.name = `topCover_${++index}`;
        this.exteriorGroup.add(cover);
      }
    }
  }

  /** 顶部留白区域：布置四台振打电机（工业级简化模型） */
  #addRappingMotors(n, W, D, baseY, bodyH) {
    const topDeckY = baseY + bodyH + 0.05; // 贴顶板略抬 5cm
    const totalWidth = n * W;
    const spanX = totalWidth * 0.7; // 沿X分布范围
    const rearZ = (typeof this.gableRearZ === 'number' ? this.gableRearZ : -D / 2) - 4.0; // 屋脊式结构后沿向后约4m

    const xs = [ -spanX / 2, -spanX / 6, spanX / 6, spanX / 2 ];
    xs.forEach((x, idx) => {
      const motor = this.#createRappingMotorModel();
      // 按要求：上移2个单位并整体放大2倍
      motor.scale.set(2, 2, 2);
      motor.position.set(x, topDeckY + 2, rearZ);
      motor.name = `rappingMotor_${idx + 1}`;
      this.exteriorGroup.add(motor);
    });
  }

  /** 振打电机模型（变频电机+联轴器+偏心锤+底座） */
  #createRappingMotorModel() {
    const g = new THREE.Group();
    const baseMat = this.materials.basePlate;
    const metal = this.materials.frame;
    const alu = this.materials.metalSilver;

    // 机座钢板
    const base = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.08, 0.7), baseMat);
    base.position.y = 0.04;
    g.add(base);

    // 减振垫
    const padGeom = new THREE.BoxGeometry(0.22, 0.06, 0.22);
    for (let sx of [-0.35, 0.35]) {
      for (let sz of [-0.2, 0.2]) {
        const pad = new THREE.Mesh(padGeom, metal);
        pad.position.set(sx, 0.11, sz);
        g.add(pad);
      }
    }

    // 电机机壳（IE3高效铝壳电机造型）
    const motorBody = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.22, 0.9, 24), alu);
    motorBody.rotation.z = Math.PI / 2;
    motorBody.position.set(-0.15, 0.28, 0);
    g.add(motorBody);
    // 机壳散热片（环向短肋）
    const finGeom = new THREE.BoxGeometry(0.02, 0.06, 0.14);
    const finCount = 12;
    for (let i = 0; i < finCount; i++) {
      const ang = (i / finCount) * Math.PI * 2;
      const fx = -0.15 + (Math.cos(ang) * 0.0); // 沿轴向均布，不改变x
      const fy = 0.28 + Math.sin(ang) * 0.20;
      const fz = Math.cos(ang) * 0.20;
      const fin = new THREE.Mesh(finGeom, alu);
      fin.position.set(fx, fy, fz);
      fin.rotation.x = 0;
      fin.rotation.y = 0;
      g.add(fin);
    }
    // 端盖
    const endcap = new THREE.Mesh(new THREE.CylinderGeometry(0.23, 0.23, 0.08, 24), alu);
    endcap.rotation.z = Math.PI / 2;
    endcap.position.set(-0.6, 0.28, 0);
    g.add(endcap);

    // 接线盒
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.2, 0.14, 0.18), metal);
    box.position.set(-0.1, 0.45, 0);
    g.add(box);
    // 接线盒小螺栓
    for (let sx of [-0.18, -0.02]) {
      for (let sz of [-0.08, 0.08]) {
        const screw = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.02, 6), this.materials.boltDark);
        screw.rotation.x = Math.PI / 2;
        screw.position.set(sx, 0.52, sz);
        g.add(screw);
      }
    }
    // 电缆导管
    const cable = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.35, 12), metal);
    cable.rotation.z = Math.PI / 2;
    cable.position.set(0.02, 0.45, 0.22);
    g.add(cable);

    // 联轴器罩+联接轴
    const coupling = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.18, 20), baseMat);
    coupling.rotation.z = Math.PI / 2;
    coupling.position.set(0.15, 0.28, 0);
    g.add(coupling);

    // 偏心锤壳体（振打器）
    const hammer = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.36, 20), metal);
    hammer.rotation.z = Math.PI / 2;
    hammer.position.set(0.45, 0.28, 0);
    g.add(hammer);
    // 偏心块（简化为两块偏置质量）
    const mass1 = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.06, 0.12), baseMat);
    mass1.position.set(0.45, 0.34, 0.08);
    g.add(mass1);
    const mass2 = mass1.clone();
    mass2.position.set(0.45, 0.22, -0.08);
    g.add(mass2);
    // 防护罩（半圆罩）
    const guard = new THREE.Mesh(new THREE.SphereGeometry(0.2, 24, 16, 0, Math.PI, Math.PI / 2, Math.PI / 2), baseMat);
    guard.rotation.y = Math.PI / 2;
    guard.position.set(0.63, 0.28, 0);
    g.add(guard);
    // 防护罩筋条
    for (let i = -2; i <= 2; i++) {
      const rib = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.2, 0.02), metal);
      rib.position.set(0.63, 0.28, i * 0.04);
      g.add(rib);
    }

    // 名牌
    const nameplate = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.02, 0.12), this.materials.panel);
    nameplate.position.set(-0.2, 0.2, 0.25);
    g.add(nameplate);
    // 地脚锚栓
    for (let sx of [-0.45, 0.45]) {
      for (let sz of [-0.28, 0.28]) {
        const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.12, 8), this.materials.boltDark);
        bolt.position.set(sx, 0.14, sz);
        g.add(bolt);
        const washer = new THREE.Mesh(new THREE.TorusGeometry(0.02, 0.005, 8, 16), this.materials.metalSilver);
        washer.rotation.x = Math.PI / 2;
        washer.position.set(sx, 0.18, sz);
        g.add(washer);
      }
    }

    return g;
  }

  /** 侧/前维护平台与梯子（带绿色栏杆） */
  #addAccessPlatformsAndLadders(totalWidth, depth, supportTopY, bodyH) {
    const baseY = supportTopY + 0.6; // 平台标高（靠近灰斗上缘）
    const platW = 2.2, platL = totalWidth + 2.0;
    // 前侧长平台
    const platform = new THREE.Mesh(new THREE.BoxGeometry(platL, 0.12, platW), this.materials.roof);
    platform.position.set(0, baseY, depth / 2 + platW / 2);
    platform.name = 'frontMaintenancePlatform';
    this.exteriorGroup.add(platform);
    // 前侧平台栏杆
    const railH = 1.1;
    const postStep = 2.0;
    for (let x = -platL / 2; x <= platL / 2; x += postStep) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, railH, 8), this.materials.rail);
      post.position.set(x, baseY + railH / 2, depth / 2 + platW + 0.05);
      this.exteriorGroup.add(post);
      if (x < platL / 2) {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, postStep, 8), this.materials.rail);
        rail.position.set(x + postStep / 2, baseY + railH - 0.1, depth / 2 + platW + 0.05);
        rail.rotation.z = Math.PI / 2;
        this.exteriorGroup.add(rail);
      }
    }
    // 侧向短平台（左侧）
    const sidePlat = new THREE.Mesh(new THREE.BoxGeometry(2.8, 0.12, 1.2), this.materials.roof);
    sidePlat.position.set(-totalWidth / 2 - 1.5, baseY + 1.2, 0);
    sidePlat.name = 'leftServicePlatform';
    this.exteriorGroup.add(sidePlat);
    // 后侧长平台（沿长边）
    const backPlatform = new THREE.Mesh(new THREE.BoxGeometry(platL, 0.12, platW), this.materials.roof);
    backPlatform.position.set(0, baseY + 0.6, -depth / 2 - platW / 2);
    backPlatform.name = 'rearMaintenancePlatform';
    this.exteriorGroup.add(backPlatform);
    // 后侧平台栏杆
    const postStepBack = 2.0;
    for (let x = -platL / 2; x <= platL / 2; x += postStepBack) {
      const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), this.materials.rail);
      post.position.set(x, baseY + 0.6 + 0.55, -depth / 2 - platW - 0.05);
      this.exteriorGroup.add(post);
      if (x < platL / 2) {
        const rail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, postStepBack, 8), this.materials.rail);
        rail.position.set(x + postStepBack / 2, baseY + 0.6 + 1.0, -depth / 2 - platW - 0.05);
        rail.rotation.z = Math.PI / 2;
        this.exteriorGroup.add(rail);
      }
    }
    // 小型检修爬梯（后左角，平台错层处）
    this.#addLadder(-totalWidth / 2 + 1.0, baseY, baseY + 0.6, -depth / 2 - platW + 0.2);
    // 立式梯子（正面靠右）
    this.#addLadder(totalWidth / 2 - 1.0, supportTopY, supportTopY + bodyH + 0.3, depth / 2 + platW - 0.5);
  }

  #addLadder(x, yStart, yEnd, z) {
    const railMat = this.materials.rail;
    const stepMat = this.materials.frame;
    const rail = new THREE.CylinderGeometry(0.04, 0.04, yEnd - yStart, 8);
    const left = new THREE.Mesh(rail, railMat);
    const right = new THREE.Mesh(rail, railMat);
    left.position.set(x - 0.25, (yStart + yEnd) / 2, z);
    right.position.set(x + 0.25, (yStart + yEnd) / 2, z);
    this.exteriorGroup.add(left, right);
    const stepCount = Math.floor((yEnd - yStart) / 0.3);
    for (let i = 0; i <= stepCount; i++) {
      const step = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.04, 0.06), stepMat);
      const y = yStart + i * ((yEnd - yStart) / stepCount);
      step.position.set(x, y, z);
      this.exteriorGroup.add(step);
    }
  }

  /** 左侧四个圆锥扩散器进气口（按每个分室对齐，圆→方顶端过渡） */
  #addConicalInlets(n, W, D, baseY, bodyH) {
    // 将“圆锥”改为四棱锥台（方形截面扩散器），匹配参考图的折面造型
    const baseSquare = bodyH * 0.35;     // 大端方形边长（≈0.35×H）
    const coneLen = D * 0.45;            // 长度（沿Z伸出）
    const smallBox = baseSquare * 0.25;  // 顶端方箱边长（≈0.25×大端）
    const wallZ = -D / 2; // 左侧（前述-"Y"=three.js -Z）
    for (let i = 0; i < n; i++) {
      const cx = -n * W / 2 + i * W + W / 2;
      const cy = baseY + bodyH * 0.5;
      const group = new THREE.Group();
      group.name = `conicalInlet_${i + 1}`;

      // 大端矩形法兰/套圈（矩形框内嵌方形开口视觉）
      const collarW = baseSquare * 1.2;
      const collarH = baseSquare * 1.2;
      const collar = new THREE.Mesh(new THREE.BoxGeometry(collarW, collarH, 0.12), this.materials.panel);
      collar.position.set(cx, cy, wallZ - 0.06);
      group.add(collar);
      // 螺栓行
      const bolts = new THREE.Group();
      const boltPitch = baseSquare * 0.18;
      for (let x = -collarW / 2 + 0.15; x <= collarW / 2 - 0.15; x += boltPitch) {
        for (let y = -collarH / 2 + 0.15; y <= collarH / 2 - 0.15; y += boltPitch) {
          if (Math.abs(x) > collarW / 2 - 0.2 && Math.abs(y) > collarH / 2 - 0.2) continue;
          const head = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.05, 10), this.materials.bolt);
          head.rotation.x = Math.PI / 2;
          head.position.set(cx + x, cy + y, wallZ - 0.12);
          bolts.add(head);
        }
      }
      group.add(bolts);

      // 四棱锥台扩散段（用四边多段圆柱近似）
      const rTop = (baseSquare) / Math.SQRT2;       // 方形外接圆半径
      const rBottom = (smallBox) / Math.SQRT2;
      const cone = new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBottom, coneLen, 4, 1, true), this.materials.duct);
      cone.rotation.x = Math.PI / 2; // 长度沿Z
      cone.rotation.y = Math.PI / 4; // 使折线与外观更接近“菱形见棱见角”
      cone.position.set(cx, cy, wallZ - coneLen / 2 - 0.12);
      group.add(cone);

      // 顶端方箱（把圆锥尖切去后接方箱，近似圆转方）
      const tipBox = new THREE.Mesh(new THREE.BoxGeometry(smallBox, smallBox, smallBox * 0.9), this.materials.duct);
      tipBox.position.set(cx, cy, wallZ - coneLen - smallBox * 0.45 - 0.12);
      group.add(tipBox);

      // 记录每个锥形进气口的“外侧法兰中心”（用于外部连管）——取方箱外侧端面的中心
      const portLocalZ = wallZ - coneLen - smallBox * 0.9 - 0.12; // 方箱中心再减去一半深度
      const portLocal = new THREE.Vector3(cx, cy, portLocalZ);
      this.inletPortsLocal[i] = portLocal;

      // 下方两根角钢斜撑
      for (let k = -1; k <= 1; k += 2) {
        const brace = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.1, coneLen * 0.6), this.materials.frame);
        brace.position.set(cx + k * (baseSquare * 0.4), baseY + 0.6, wallZ - coneLen * 0.3);
        brace.rotation.x = -Math.PI / 8;
        group.add(brace);
      }

      // 不再添加外覆栅格（按最新要求）

      this.exteriorGroup.add(group);
    }
  }

  /**
   * 获取指定锥形进气口（1-4）的世界坐标（外侧法兰中心）
   * @param {number} index 1~this.config.numChambers
   * @returns {THREE.Vector3|null}
   */
  getConicalInletPortWorldPosition(index = 1) {
    const i = Math.floor(index) - 1;
    if (!this.inletPortsLocal || !this.inletPortsLocal[i]) return null;
    const local = this.inletPortsLocal[i].clone();
    return local.applyMatrix4(this.group.matrixWorld.clone());
  }

  /**
   * 获取全部锥形进气口的世界坐标（按分室顺序返回数组）
   * @returns {THREE.Vector3[]}
   */
  getAllConicalInletPortsWorldPosition() {
    if (!this.inletPortsLocal) return [];
    return this.inletPortsLocal.map(v => v.clone().applyMatrix4(this.group.matrixWorld.clone()));
  }

  /** 前右角楼梯塔（三跑楼梯，带平台/栏杆/踢脚板与斜撑） */
  #addStairTower(totalWidth, depth, baseY, bodyH) {
    const tower = new THREE.Group();
    tower.name = 'stairTower';
    const towerX = totalWidth / 2 + 2.2; // 贴近前侧平台右端
    const towerZ = depth / 2 + 0.8;      // 前侧
    const flightRise = (baseY + bodyH) / 3; // 三跑等分到顶平台高度附近
    const flightLen = 4.5; // 水平投影
    const stairW = 1.2;
    const slope = Math.atan(flightRise / flightLen);
    const addFlight = (idx, startY, startZ) => {
      const beam = new THREE.Mesh(new THREE.BoxGeometry(stairW + 0.2, 0.15, flightLen), this.materials.frame);
      beam.position.set(towerX, startY + flightRise / 2, startZ - flightLen / 2);
      beam.rotation.x = -slope;
      tower.add(beam);
      const steps = Math.floor(flightLen / 0.3);
      for (let s = 0; s <= steps; s++) {
        const step = new THREE.Mesh(new THREE.BoxGeometry(stairW, 0.04, 0.28), this.materials.roof);
        step.position.set(towerX, startY + (flightRise / steps) * s, startZ - (flightLen / steps) * s);
        tower.add(step);
      }
      // 扶手（双道）
      const railTop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, flightLen, 8), this.materials.rail);
      railTop.position.set(towerX + stairW / 2 + 0.05, startY + flightRise - 0.05, startZ - flightLen / 2);
      railTop.rotation.x = -slope;
      railTop.rotation.z = Math.PI / 2;
      tower.add(railTop);
      const railMid = railTop.clone();
      railMid.position.y = startY + flightRise / 2;
      tower.add(railMid);
      // 立柱
      const postCount = Math.max(2, Math.floor(flightLen / 1.5));
      for (let p = 0; p <= postCount; p++) {
        const t = p / postCount;
        const px = towerX + stairW / 2 + 0.05;
        const py = startY + t * flightRise;
        const pz = startZ - t * flightLen;
        const post = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 1.1, 8), this.materials.rail);
        post.position.set(px, py + 0.55, pz);
        tower.add(post);
      }
    };
    // 第一跑：从地面上升
    addFlight(0, 0.2, towerZ);
    // 第一平台
    const land1 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.8), this.materials.roof);
    land1.position.set(towerX, flightRise + 0.06, towerZ - 4.5 - 0.9);
    tower.add(land1);
    // 斜撑
    const brace1 = new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.0, 1.6), this.materials.frame);
    brace1.position.set(towerX - 0.6, flightRise / 2, land1.position.z);
    brace1.rotation.x = -Math.PI / 8;
    tower.add(brace1);
    // 第二跑（转向，与第一跑相反方向）
    addFlight(1, flightRise + 0.12, towerZ - 4.5 - 1.8);
    // 第二平台
    const land2Y = 2 * flightRise + 0.18;
    const land2Z = towerZ - 2 * 4.5 - 1.8 - 0.9;
    const land2 = new THREE.Mesh(new THREE.BoxGeometry(1.8, 0.12, 1.8), this.materials.roof);
    land2.position.set(towerX, land2Y, land2Z);
    tower.add(land2);
    const brace2 = brace1.clone();
    brace2.position.set(towerX + 0.6, flightRise + land2Y / 2 - 0.6, land2Z);
    tower.add(brace2);
    // 第三跑到顶平台
    addFlight(2, land2Y + 0.12, land2Z - 1.8);
    // 顶平台与主平台连接的短走道
    const topY = baseY + bodyH + 0.3;
    const topBridge = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.12, 1.2), this.materials.roof);
    topBridge.position.set(totalWidth / 2 + 1.1, topY, depth / 2 + 0.6);
    tower.add(topBridge);
    // 顶平台栏杆
    const edgeRail = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.2, 8), this.materials.rail);
    edgeRail.position.set(totalWidth / 2 + 1.1, topY + 1.0, depth / 2 + 1.2);
    edgeRail.rotation.z = Math.PI / 2;
    tower.add(edgeRail);
    this.exteriorGroup.add(tower);
  }

  /** 脉冲系统（阀+喷吹管+管板） */
  #addPulseSystems(n, W, D, baseY, bodyH) {
    const topY = baseY + bodyH;
    for (let i = 0; i < n; i++) {
      const cx = -n * W / 2 + i * W + W / 2;

      // 管板（简化为顶板上的浅框）
      const tubesheet = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, 0.06, D * 0.9), this.materials.shell);
      tubesheet.position.set(cx, topY + 0.12, 0);
      tubesheet.name = `tubesheet_${i + 1}`;
      this.exteriorGroup.add(tubesheet);

      // 脉冲储气罐与电磁脉冲阀阵列
      const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, W * 0.8, 14), this.materials.frame);
      manifold.rotation.z = Math.PI / 2;
      manifold.position.set(cx, topY + 0.6, D / 2 + 0.4);
      this.exteriorGroup.add(manifold);

      const valveCount = 4;
      for (let v = 0; v < valveCount; v++) {
        const vx = cx - (W * 0.35) + (v * (W * 0.8) / (valveCount - 1));
        const valve = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.35, 12), this.materials.frame);
        valve.position.set(vx, topY + 0.9, D / 2 + 0.4);
        this.exteriorGroup.add(valve);
        // 喷吹管（穿过室内，朝向袋口）
        const blowPipe = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, D * 0.9, 10), this.materials.frame);
        blowPipe.position.set(vx, topY + 0.75, 0);
        blowPipe.rotation.z = Math.PI / 2;
        blowPipe.rotation.y = Math.PI / 2;
        this.exteriorGroup.add(blowPipe);
      }
    }
  }

  /** 洁净气总管 + 分室切换门/提升阀 */
  #addCleanGasHeaderAndDampers(n, W, D, baseY, bodyH) {
    const headerY = baseY + bodyH + 0.6;
    const header = new THREE.Mesh(new THREE.BoxGeometry(n * W + 4, 1.2, 1.2), this.materials.duct);
    header.position.set(0, headerY, D / 2 + 1.6);
    header.name = 'cleanGasHeader';
    this.exteriorGroup.add(header);

    for (let i = 0; i < n; i++) {
      const cx = -n * W / 2 + i * W + W / 2;
      // 接入短管
      const branch = new THREE.Mesh(new THREE.CylinderGeometry(0.4, 0.4, 1.6, 12), this.materials.duct);
      branch.rotation.x = Math.PI / 2;
      branch.position.set(cx, headerY - 0.6, D / 2 + 1.0);
      this.exteriorGroup.add(branch);

      // 分室切换门（滑动门体 + 执行器）
      const damper = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.2), this.materials.frame);
      damper.position.set(cx, headerY - 0.6, D / 2 + 0.5);
      damper.name = `compartmentDamper_${i + 1}`;
      this.exteriorGroup.add(damper);
      const actuator = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 10), this.materials.frame);
      actuator.position.set(cx + 0.7, headerY - 0.6, D / 2 + 0.5);
      actuator.rotation.z = Math.PI / 2;
      this.exteriorGroup.add(actuator);

      // 提升阀（模拟离线阀，设置于各室顶部洁净气侧）
      const liftValve = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.4, 0.8), this.materials.roof);
      liftValve.position.set(cx, baseY + bodyH + 0.35, D / 2 - 0.6);
      liftValve.name = `liftValve_${i + 1}`;
      this.exteriorGroup.add(liftValve);
      const liftAct = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.7, 8), this.materials.frame);
      liftAct.position.set(cx, baseY + bodyH + 0.7, D / 2 - 0.6);
      this.exteriorGroup.add(liftAct);
    }
  }

  /** 电除尘绝缘箱 */
  #addESPInsulatorBoxes(n, W, D, baseY, bodyH) {
    const insY = baseY + bodyH + 0.4;
    for (let i = 0; i < n; i++) {
      const cx = -n * W / 2 + i * W + W / 2 - W * 0.25; // 靠ESP半区
      const box = new THREE.Mesh(new THREE.BoxGeometry(0.8, 0.6, 0.8), this.materials.roof);
      box.position.set(cx, insY, 0);
      box.name = `espInsulator_${i + 1}`;
      this.exteriorGroup.add(box);
      // 高压套管
      const bushing = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.8, 10), this.materials.frame);
      bushing.position.set(cx, insY + 0.7, 0);
      this.exteriorGroup.add(bushing);
    }
  }

  /**
   * 创建全新的内部结构 - 参考空压机房实现
   */
  #createInteriorStructure() {
    this.interiorGroup = new THREE.Group();
    this.interiorGroup.name = 'interiorStructure';
    this.interiorGroup.visible = false;

    const n = this.config.numChambers;
    const W = this.config.chamberWidth;
    const D = this.config.chamberDepth * Math.max(1, Math.round(this.config.depthScale || 1));
    const H = this.config.chamberHeight;
    const totalWidth = n * W;

    // 内部材质微调（颜色/反光）
    const espPlateMat = this.materials.metalSilver.clone();
    espPlateMat.color.setHex(0xC8CFD4);
    espPlateMat.metalness = 0.8;
    espPlateMat.roughness = 0.3;

    const bagClothMat = this.materials.bag.clone();
    bagClothMat.color.setHex(0xEEE6C9);
    bagClothMat.metalness = 0.02;
    bagClothMat.roughness = 0.85;

    const partitionMat = this.materials.panel.clone();
    partitionMat.color.setHex(0x8A9198);
    partitionMat.opacity = 0.95;
    partitionMat.transparent = true;

    // 创建内部地面（略窄于外部轮廓）
    const floorGeometry = new THREE.PlaneGeometry(totalWidth, D);
    const floorMaterial = new THREE.MeshStandardMaterial({ color: 0x5C5C5C, roughness: 0.9, metalness: 0.05 });
    const floor = new THREE.Mesh(floorGeometry, floorMaterial);
    floor.rotation.x = -Math.PI / 2;
    floor.position.set(0, 0, 0);
    floor.receiveShadow = true;
    this.interiorGroup.add(floor);

    // 四室分隔板（完全分隔）
    for (let i = 1; i < n; i++) {
      const wallX = -totalWidth / 2 + i * W;
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.15, H, D + 0.2), partitionMat);
      wall.position.set(wallX, H / 2, 0);
      this.interiorGroup.add(wall);
    }
    // 两端侧板（强调边界）
    [['L', -totalWidth/2], ['R', totalWidth/2]].forEach(([_, x]) => {
      const wall = new THREE.Mesh(new THREE.BoxGeometry(0.15, H, D + 0.2), partitionMat);
      wall.position.set(x, H / 2, 0);
      this.interiorGroup.add(wall);
    });

    // 每个除尘室：前1/4 ESP，后3/4 袋区
    const espDepth = D * 0.25;
    const bagDepth = D - espDepth;
    const espZCenterOffset = -D / 2 + espDepth / 2;
    const bagZCenterOffset = -D / 2 + espDepth + bagDepth / 2;

    for (let chamberIndex = 0; chamberIndex < n; chamberIndex++) {
      const cx = -totalWidth / 2 + chamberIndex * W + W / 2;

      // 干电除尘区 - 结构
      const espGroup = new THREE.Group();
      espGroup.name = `interior_esp_${chamberIndex + 1}`;

      // 顶部悬挂梁（沿X布置）+ 绝缘子支架
      const beamY = H - 2.0;
      const beamCount = 3;
      for (let b = 0; b < beamCount; b++) {
        const bx = cx - W / 2 + (b + 0.5) * (W / beamCount);
        const beam = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.22, espDepth - 0.6), this.materials.frame);
        beam.position.set(bx, beamY, espZCenterOffset);
        espGroup.add(beam);
        // 绝缘子（白陶瓷叠层）
        const insCount = 2;
        for (let k = 0; k < insCount; k++) {
          const ins = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 12), this.materials.topCover);
          ins.position.set(bx, beamY - 0.25 - k * 0.25, espZCenterOffset - (espDepth / 2 - 0.3));
          espGroup.add(ins);
        }
      }
      // 高压汇流母排（沿X）
      const hvBar = new THREE.Mesh(new THREE.BoxGeometry(W * 0.9, 0.1, 0.08), this.materials.metalSilver);
      hvBar.position.set(cx, beamY + 0.25, espZCenterOffset - (espDepth / 2 - 0.25));
      espGroup.add(hvBar);

      // 极板阵列（竖直，尺寸化）+ 两板间高压电极线
      const plateCount = Math.max(4, this.params.esp.plateCount);
      const platePitch = (W - 1.2) / (plateCount - 1);
      for (let p = 0; p < plateCount; p++) {
        const px = cx - W / 2 + 0.6 + p * platePitch;
        const plate = this.#createCorrugatedPlate(this.params.esp.plateWidthX, H - 3.0, espDepth - 0.8, this.params.esp.plateCorrugations, this.params.esp.plateAmplitude, espPlateMat);
        plate.position.set(px, (H - 3.0) / 2 + 0.5, espZCenterOffset);
        espGroup.add(plate);

        // 顶部放电尖端阵列（仍保留视觉识别）
        for (let t = -2; t <= 2; t++) {
          const tip = new THREE.Mesh(new THREE.ConeGeometry(0.015, 0.035, 8), this.materials.boltDark);
          tip.position.set(px, beamY - 0.5, espZCenterOffset + t * 0.4);
          tip.rotation.x = Math.PI;
          espGroup.add(tip);
        }

        // 两板间高压电极线（可配置每间隙多少根）
        if (p < plateCount - 1) {
          const nextPx = cx - W / 2 + 0.6 + (p + 1) * platePitch;
          for (let w = 0; w < Math.max(1, this.params.esp.wirePerGap); w++) {
            const ex = px + ((w + 1) / (this.params.esp.wirePerGap + 1)) * (nextPx - px);
            const wire = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, H - 2.4, 10), this.materials.boltDark);
            wire.position.set(ex, (H - 2.4) / 2 + 0.5, espZCenterOffset);
            espGroup.add(wire);
            const weight = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 8), this.materials.boltDark);
            weight.position.set(ex, 0.6, espZCenterOffset);
            espGroup.add(weight);
          }
        }
      }

      // ESP底部灰斗（小型锥形）
      const espHopper = new THREE.Mesh(new THREE.CylinderGeometry((W * 0.5) / Math.SQRT2, (W * 0.12) / Math.SQRT2, 1.4, 4, 1, true), this.materials.hopper);
      espHopper.rotation.y = Math.PI / 4;
      espHopper.position.set(cx, 0.7, espZCenterOffset);
      // ESP灰斗空气锁（可视）
      const espAirlock = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.22, 16), this.materials.frame);
      espAirlock.position.set(cx, 0.1, espZCenterOffset);
      const espRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 6), this.materials.metalSilver);
      espRotor.position.set(cx, 0.02, espZCenterOffset);
      this.interiorGroup.add(espGroup);
      this.interiorGroup.add(espHopper);
      this.interiorGroup.add(espAirlock);
      this.interiorGroup.add(espRotor);

      // 干电除尘区标签（每室）
      const espLabel = this.#createSpriteLabel('干电除尘区', '#00D1FF', 224, 56, 20);
      espLabel.name = `label_esp_${chamberIndex + 1}`;
      espLabel.position.set(cx, beamY + 0.8 + 2, espZCenterOffset);
      espLabel.scale.multiplyScalar(2);
      this.interiorGroup.add(espLabel);

      // 干电区与袋区分隔框（留通道开口）
      const dividerZ = -D / 2 + espDepth;
      const frameThickness = 0.14;
      const openingWidth = W * 0.6;
      const sideWidth = (W - openingWidth) / 2;
      // 左右立柱
      const postL = new THREE.Mesh(new THREE.BoxGeometry(sideWidth, H - 1.0, frameThickness), partitionMat);
      postL.position.set(cx - (openingWidth / 2 + sideWidth / 2), (H - 1.0) / 2, dividerZ);
      const postR = postL.clone();
      postR.position.x = cx + (openingWidth / 2 + sideWidth / 2);
      // 顶梁
      const topBeam = new THREE.Mesh(new THREE.BoxGeometry(W, 0.3, frameThickness), partitionMat);
      topBeam.position.set(cx, H - 0.5, dividerZ);
      this.interiorGroup.add(postL, postR, topBeam);

      // 袋除尘区 - 结构
      const bagGroup = new THREE.Group();
      bagGroup.name = `interior_bag_${chamberIndex + 1}`;

      // 花板（打孔板）- 点阵由参数决定
      const plateY = H - 3.8;
      const tubesheet = new THREE.Mesh(new THREE.BoxGeometry(W - 0.6, 0.12, bagDepth - 0.6), this.materials.shell);
      tubesheet.position.set(cx, plateY, bagZCenterOffset);
      bagGroup.add(tubesheet);
      // 环形孔+Venturi（参数化 rows/cols）
      const holeRows = Math.max(3, this.params.bag.rows);
      const holeCols = Math.max(3, this.params.bag.cols);
      for (let r = 0; r < holeRows; r++) {
        for (let c = 0; c < holeCols; c++) {
          const hx = cx - (W - 0.6) / 2 + 0.6 + c * ((W - 1.8) / (holeCols - 1));
          const hz = (-D / 2 + espDepth + 0.6) + r * ((bagDepth - 1.2) / (holeRows - 1));
          const ring = new THREE.Mesh(new THREE.TorusGeometry(0.09, 0.01, 8, 16), this.materials.metalSilver);
          ring.rotation.x = Math.PI / 2;
          ring.position.set(hx, plateY + 0.02, hz);
          bagGroup.add(ring);
          // Venturi 短喉（锥台）
          const venturi = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.12, 0.18, 16), this.materials.metalSilver);
          venturi.position.set(hx, plateY - 0.15, hz);
          bagGroup.add(venturi);
        }
      }

      // 滤袋与笼骨
      const bagRows = Math.max(3, this.params.bag.rows), bagCols = Math.max(3, this.params.bag.cols);
      for (let r = 0; r < bagRows; r++) {
        for (let c = 0; c < bagCols; c++) {
          const bx = cx - (W - 0.6) / 2 + 0.6 + c * ((W - 1.8) / (bagCols - 1));
          const bz = (-D / 2 + espDepth + 0.6) + r * ((bagDepth - 1.2) / (bagRows - 1));
          const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, H - 5.2, 18), bagClothMat);
          bag.position.set(bx, (H - 5.2) / 2 + 0.6, bz);
          bagGroup.add(bag);
          // 笼骨环（6道）
          for (let i = 1; i <= 6; i++) {
            const y = 0.6 + i * ((H - 5.2) / 7);
            const hoop = new THREE.Mesh(new THREE.TorusGeometry(0.155, 0.007, 8, 18), this.materials.frame);
            hoop.rotation.x = Math.PI / 2;
            hoop.position.set(bx, y, bz);
            bagGroup.add(hoop);
          }
          // 内部笼骨（简化为3根细筋）
          for (let k = 0; k < 3; k++) {
            const rib = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, H - 5.4, 6), this.materials.frame);
            const angle = (k / 3) * Math.PI * 2;
            rib.position.set(bx + Math.cos(angle) * 0.12, (H - 5.4) / 2 + 0.6, bz + Math.sin(angle) * 0.12);
            bagGroup.add(rib);
          }
        }
      }

      // 顶部脉冲喷吹管与喷嘴
      const manifold = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, W * 0.85, 16), this.materials.duct);
      manifold.rotation.z = Math.PI / 2;
      manifold.position.set(cx, H - 2.2, bagZCenterOffset);
      bagGroup.add(manifold);
      for (let j = 0; j < bagCols; j++) {
        const px = cx - (W * 0.85) / 2 + j * ((W * 0.85) / (bagCols - 1));
        const nozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.14, 10), this.materials.metalSilver);
        nozzle.rotation.x = Math.PI / 2;
        nozzle.position.set(px, H - 2.28, bagZCenterOffset);
        bagGroup.add(nozzle);
      }

      // 袋区底部灰斗（独立）
      const bagHopper = new THREE.Mesh(new THREE.CylinderGeometry((W * 0.5) / Math.SQRT2, (W * 0.12) / Math.SQRT2, 1.4, 4, 1, true), this.materials.hopper);
      bagHopper.rotation.y = Math.PI / 4;
      bagHopper.position.set(cx, 0.7, bagZCenterOffset);
      // 袋区灰斗空气锁
      const bagAirlock = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.22, 16), this.materials.frame);
      bagAirlock.position.set(cx, 0.1, bagZCenterOffset);
      const bagRotor = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 6), this.materials.metalSilver);
      bagRotor.position.set(cx, 0.02, bagZCenterOffset);

      this.interiorGroup.add(bagGroup);
      this.interiorGroup.add(bagHopper);
      this.interiorGroup.add(bagAirlock);
      this.interiorGroup.add(bagRotor);

      // 袋除尘区标签（每室）
      const bagLabel = this.#createSpriteLabel('袋除尘区', '#FFD166', 224, 56, 20);
      bagLabel.name = `label_bag_${chamberIndex + 1}`;
      bagLabel.position.set(cx, plateY + 0.8 + 2, bagZCenterOffset);
      bagLabel.scale.multiplyScalar(2);
      this.interiorGroup.add(bagLabel);
    }

    // 内部视角提示：轻微区域强调（整体环境灯变暗可在外部控制）
    const softLight = new THREE.AmbientLight(0xffffff, 0.15);
    this.interiorGroup.add(softLight);

    this.group.add(this.interiorGroup);
  }

  #applyTransform() {
    this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
    this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);
    this.group.scale.setScalar(this.config.scale);
  }

  /**
   * 显示内部视角 - 参考空压机房实现
   * 隐藏外部结构，显示全新的内部结构
   */
  showInterior() {
    console.log('进入电袋除尘器内部视角');
    
    // 隐藏所有外部结构
    if (this.exteriorGroup) {
      this.exteriorGroup.visible = false;
    }
    
    // 显示内部结构
    if (this.interiorGroup) {
      this.interiorGroup.visible = true;
    }

    // 设置内部视角标志
    this.isInteriorView = true;
  }

  /**
   * 显示外部视角 - 参考空压机房实现
   * 显示外部结构，隐藏内部结构
   */
  showExterior() {
    console.log('退出电袋除尘器内部视角');
    
    // 显示外部结构
    if (this.exteriorGroup) {
      this.exteriorGroup.visible = true;
    }
    
    // 隐藏内部结构
    if (this.interiorGroup) {
      this.interiorGroup.visible = false;
    }

    // 设置外部视角标志
    this.isInteriorView = false;
  }
}

if (typeof window !== 'undefined') {
  window.ElectrostaticBagFilter = ElectrostaticBagFilter;
}


