/**
 * 真空皮带机（真空带式过滤机）模型
 * 目标：高保真工业外观（1:1近似），包含机架、皮带、滚筒、真空箱、喷淋管、驱动单元、护罩、导料斗、集液系统等
 */
class VacuumBeltFilter {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.components = new Map();

        this.config = {
            name: config.name || '真空皮带机',
            // 总体尺寸（米）
            length: config.length || 18,   // 主机长度
            width: config.width || 4.2,    // 主机总宽（含护栏）
            height: config.height || 3.8,  // 顶部到地脚
            // 关键子部件尺寸
            beltWidth: config.beltWidth || 2.2,
            beltThickness: 0.06,
            frameHeight: 1.6,
            legSpan: 3.0,                 // 立柱间距
            rollerDiameter: 0.6,
            headRollerDiameter: 0.9,
            tailRollerDiameter: 0.8,
            vacuumBoxHeight: 0.9,
            sprayHeaderCount: 2,
            position: config.position || { x: 0, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            ...config
        };

        this.initialize();
    }

    getGroup() { return this.group; }

    initialize() {
        this.createMaterials();
        this.createBeltTextures();
        this.createMainFrame();
        this.createBeltAndRollers();
        this.createVacuumBoxes();
        this.createSprayHeaders();
        this.createDriveAndTensionUnits();
        this.createFeedAndDischarge();
        this.createFiltrateSystem();
        this.createGuardRails();
        this.createLabels();

        // 放置
        this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
        this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);
        this.group.name = this.config.name;
        // 端口集合（用于与外部设备连管）
        this.portMap = {
            vacuum: () => {
                // 取真空总管中点
                const header = this.group.getObjectByName('真空总管');
                if (!header) return null;
                const p = new THREE.Vector3(0, 0, 0);
                return header.localToWorld(p.clone());
            },
            sprayFeed: () => {
                // 取第一根喷淋管附近的进水点
                const spray = this.group.getObjectByName('VBF_SprayHeaders');
                if (!spray) return null;
                const first = spray.children.find(c => c.name && c.name.includes('清洗喷淋管_1')) || spray.children[0];
                if (!first) return null;
                const p = new THREE.Vector3(0, 0, 0);
                return first.localToWorld(p.clone());
            }
        };
    }

    createMaterials() {
        this.materials = {
            // 工业蓝机架
            frameBlue: new THREE.MeshStandardMaterial({ color: 0x1D4ED8, metalness: 0.85, roughness: 0.35 }),
            steel: new THREE.MeshStandardMaterial({ color: 0x7B8794, metalness: 0.85, roughness: 0.35 }),
            frame: new THREE.MeshStandardMaterial({ color: 0x2C3E50, metalness: 0.8, roughness: 0.4 }),
            // 占位，实际在 createBeltAndRollers 中用自定义贴图材质覆盖
            belt: new THREE.MeshStandardMaterial({ color: 0xF2B200, emissive: 0x3A2A00, emissiveIntensity: 0.05, metalness: 0.1, roughness: 0.9 }),
            roller: new THREE.MeshStandardMaterial({ color: 0xC0C7CF, metalness: 0.9, roughness: 0.2 }),
            motor: new THREE.MeshStandardMaterial({ color: 0x2F80ED, metalness: 0.6, roughness: 0.5 }),
            gearbox: new THREE.MeshStandardMaterial({ color: 0x6C757D, metalness: 0.7, roughness: 0.35 }),
            guard: new THREE.MeshStandardMaterial({ color: 0x2D3748, metalness: 0.6, roughness: 0.5 }),
            pipe: new THREE.MeshStandardMaterial({ color: 0x9AA5B1, metalness: 0.85, roughness: 0.25 }),
            rail: new THREE.MeshStandardMaterial({ color: 0x4A5568, metalness: 0.7, roughness: 0.45 }),
            glass: new THREE.MeshStandardMaterial({ color: 0xA0AEC0, transparent: true, opacity: 0.25, roughness: 0.2, metalness: 0.1 }),
            cover: new THREE.MeshStandardMaterial({ color: 0xA67C52, metalness: 0.5, roughness: 0.6 }),
            labelBack: new THREE.MeshStandardMaterial({ color: 0x0B0F14, roughness: 0.6, metalness: 0.1 })
        };
    }

    /**
     * 生成滤带的贴图/粗糙度/凹凸纹理（CanvasTexture，无需外部资源）
     */
    createBeltTextures() {
        const makeTexture = (w, h, painter) => {
            const canvas = document.createElement('canvas');
            canvas.width = w; canvas.height = h;
            const ctx = canvas.getContext('2d');
            painter(ctx, w, h);
            const tex = new THREE.CanvasTexture(canvas);
            tex.wrapS = THREE.RepeatWrapping;
            tex.wrapT = THREE.RepeatWrapping;
            tex.needsUpdate = true;
            return tex;
        };

        // 基色纹理：明黄色基底 + 纵向细筋 + 随机污渍条纹
        const albedo = makeTexture(2048, 256, (ctx, w, h) => {
            // 基色
            ctx.fillStyle = '#F2B200';
            ctx.fillRect(0, 0, w, h);

            // 纵向筋条（沿长度方向）
            for (let x = 0; x < w; x += 14) {
                const alpha = 0.08 + Math.random() * 0.05;
                ctx.fillStyle = `rgba(0,0,0,${alpha})`;
                ctx.fillRect(x, 0, 2, h);
            }
            // 沿宽度方向的印痕（轻微横向波纹）
            for (let y = 0; y < h; y += 24) {
                const alpha = 0.03 + Math.random() * 0.04;
                ctx.fillStyle = `rgba(255,255,255,${alpha})`;
                ctx.fillRect(0, y, w, 1);
            }
            // 污渍/磨痕（透明深色刷痕）
            for (let i = 0; i < 80; i++) {
                const x = Math.random() * w; const y = Math.random() * h;
                const lw = 60 + Math.random() * 140; const lh = 6 + Math.random() * 14;
                ctx.fillStyle = 'rgba(70,45,10,0.07)';
                ctx.fillRect(x, y, lw, lh);
            }
        });

        // 粗糙度贴图（灰度）：越白越粗糙
        const rough = makeTexture(1024, 128, (ctx, w, h) => {
            ctx.fillStyle = '#DADADA';
            ctx.fillRect(0, 0, w, h);
            for (let x = 0; x < w; x += 12) {
                const g = 160 + Math.floor(Math.random() * 40);
                ctx.fillStyle = `rgb(${g},${g},${g})`;
                ctx.fillRect(x, 0, 3, h);
            }
            for (let i = 0; i < 200; i++) {
                const x = Math.random() * w; const y = Math.random() * h;
                const r = 1 + Math.random() * 2; const c = 140 + Math.random() * 60;
                ctx.fillStyle = `rgb(${c},${c},${c})`;
                ctx.fillRect(x, y, r, r);
            }
        });

        // 凹凸贴图（高度）
        const bump = makeTexture(1024, 128, (ctx, w, h) => {
            ctx.fillStyle = '#888888';
            ctx.fillRect(0, 0, w, h);
            for (let x = 0; x < w; x += 14) {
                ctx.fillStyle = '#A0A0A0';
                ctx.fillRect(x, 0, 2, h);
            }
        });

        this.textures = { beltAlbedo: albedo, beltRoughness: rough, beltBump: bump };
    }

    createMainFrame() {
        const frameGroup = new THREE.Group();

        const { length, width, frameHeight } = this.config;
        // 主梁
        const beamGeometry = new THREE.BoxGeometry(length, 0.25, 0.3);
        const leftBeam = new THREE.Mesh(beamGeometry, this.materials.frameBlue);
        const rightBeam = new THREE.Mesh(beamGeometry, this.materials.frameBlue);
        leftBeam.position.set(0, frameHeight, -width / 2 + 0.5);
        rightBeam.position.set(0, frameHeight, width / 2 - 0.5);
        frameGroup.add(leftBeam, rightBeam);

        // 横梁（每隔 legSpan）
        const span = this.config.legSpan;
        const crossGeometry = new THREE.BoxGeometry(0.3, 0.25, width - 1.0);
        for (let x = -length / 2 + span; x <= length / 2 - span; x += span) {
            const cross = new THREE.Mesh(crossGeometry, this.materials.frameBlue);
            cross.position.set(x, frameHeight, 0);
            frameGroup.add(cross);
        }

        // 支腿
        const legGeometry = new THREE.BoxGeometry(0.25, frameHeight, 0.25);
        for (let x = -length / 2; x <= length / 2; x += span) {
            const zLeft = -width / 2 + 0.5; const zRight = width / 2 - 0.5;
            const legL = new THREE.Mesh(legGeometry, this.materials.frameBlue);
            const legR = new THREE.Mesh(legGeometry, this.materials.frameBlue);
            legL.position.set(x, frameHeight / 2, zLeft);
            legR.position.set(x, frameHeight / 2, zRight);
            frameGroup.add(legL, legR);
        }

        // 地脚和垫块
        const footGeometry = new THREE.BoxGeometry(0.6, 0.2, 0.6);
        frameGroup.traverse((child) => {
            if (child.geometry === legGeometry) {
                // no-op: placeholder (避免复杂遍历判断)
            }
        });
        // 简化：在每个支腿位置添加基座
        for (let x = -length / 2; x <= length / 2; x += span) {
            const baseL = new THREE.Mesh(footGeometry, this.materials.guard);
            const baseR = new THREE.Mesh(footGeometry, this.materials.guard);
            baseL.position.set(x, 0.1, -width / 2 + 0.5);
            baseR.position.set(x, 0.1, width / 2 - 0.5);
            frameGroup.add(baseL, baseR);
        }

        frameGroup.name = 'VBF_Frame';
        // 侧面三角支撑
        const braceGeom = new THREE.BoxGeometry(0.25, 0.6, 1.0);
        for (let x = -length / 2; x <= length / 2; x += span) {
            const brL = new THREE.Mesh(braceGeom, this.materials.frameBlue);
            brL.position.set(x, frameHeight * 0.75, -width / 2 + 0.9);
            const brR = brL.clone(); brR.position.z = width / 2 - 0.9;
            frameGroup.add(brL, brR);
        }

        this.components.set('frame', frameGroup);
        this.group.add(frameGroup);
    }

    createBeltAndRollers() {
        const beltGroup = new THREE.Group();
        const { length, beltWidth, beltThickness, frameHeight } = this.config;

        // 皮带（扁平化，带纹理）
        const beltGeometry = new THREE.BoxGeometry(length, beltThickness, beltWidth);
        const beltMat = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            map: this.textures?.beltAlbedo,
            roughnessMap: this.textures?.beltRoughness,
            bumpMap: this.textures?.beltBump,
            bumpScale: 0.008,
            metalness: 0.08,
            roughness: 0.92
        });
        // 让贴图沿长度方向重复，增强细节
        if (this.textures) {
            const repeatX = Math.max(1, Math.floor(length / 2));
            this.textures.beltAlbedo.repeat.set(repeatX, 1);
            this.textures.beltRoughness.repeat.set(repeatX, 1);
            this.textures.beltBump.repeat.set(repeatX, 1);
        }
        const belt = new THREE.Mesh(beltGeometry, beltMat);
        belt.position.set(0, frameHeight + 0.4, 0);
        belt.castShadow = true; belt.receiveShadow = true;
        belt.name = '皮带';
        beltGroup.add(belt);

        // 皮带表面细密筋条（提升真实感，参照图片纹理）
        const ribGeom = new THREE.BoxGeometry(0.12, 0.01, beltWidth);
        for (let x = -length / 2 + 0.6; x <= length / 2 - 0.6; x += 0.6) {
            const rib = new THREE.Mesh(ribGeom, beltMat);
            rib.position.set(x, frameHeight + 0.405, 0);
            beltGroup.add(rib);
        }

        // 边部挡边（灰色小立板）
        const edgeGeom = new THREE.BoxGeometry(length, 0.08, 0.05);
        const edgeL = new THREE.Mesh(edgeGeom, this.materials.steel);
        const edgeR = new THREE.Mesh(edgeGeom, this.materials.steel);
        edgeL.position.set(0, frameHeight + 0.45, -beltWidth / 2);
        edgeR.position.set(0, frameHeight + 0.45, beltWidth / 2);
        beltGroup.add(edgeL, edgeR);

        // 头/尾滚筒
        const headDia = this.config.headRollerDiameter;
        const tailDia = this.config.tailRollerDiameter;
        const rollerLen = beltWidth + 0.6;
        const head = new THREE.Mesh(new THREE.CylinderGeometry(headDia / 2, headDia / 2, rollerLen, 24), this.materials.roller);
        const tail = new THREE.Mesh(new THREE.CylinderGeometry(tailDia / 2, tailDia / 2, rollerLen, 24), this.materials.roller);
        head.rotation.z = Math.PI / 2; tail.rotation.z = Math.PI / 2;
        head.position.set(length / 2 - 0.8, frameHeight + 0.4, 0);
        tail.position.set(-length / 2 + 0.8, frameHeight + 0.4, 0);
        head.name = '头部滚筒'; tail.name = '尾部滚筒';
        beltGroup.add(head, tail);

        // 托辊阵列（上托辊）
        const carrierGeometry = new THREE.CylinderGeometry(this.config.rollerDiameter / 2, this.config.rollerDiameter / 2, beltWidth, 16);
        for (let x = -length / 2 + 1.6; x <= length / 2 - 1.6; x += 1.6) {
            const r = new THREE.Mesh(carrierGeometry, this.materials.roller);
            r.rotation.z = Math.PI / 2;
            r.position.set(x, frameHeight + 0.35, 0);
            beltGroup.add(r);
        }

        // 下托辊（回程）
        for (let x = -length / 2 + 2.0; x <= length / 2 - 2.0; x += 2.0) {
            const r = new THREE.Mesh(carrierGeometry, this.materials.roller);
            r.rotation.z = Math.PI / 2;
            r.position.set(x, frameHeight + 0.2, 0);
            beltGroup.add(r);
        }

        beltGroup.name = 'VBF_BeltAndRollers';
        this.components.set('belt', beltGroup);
        this.group.add(beltGroup);
    }

    createVacuumBoxes() {
        const { length, beltWidth, frameHeight, vacuumBoxHeight } = this.config;
        const vacGroup = new THREE.Group();

        // 真空箱（分段）
        const segLen = length / 3.2;
        const vacGeom = new THREE.BoxGeometry(segLen, vacuumBoxHeight, beltWidth + 0.5);
        for (let i = -1; i <= 1; i++) {
            const box = new THREE.Mesh(vacGeom, this.materials.steel);
            box.position.set(i * segLen * 1.05, frameHeight + 0.05, 0);
            box.name = `真空箱_${i + 2}`;
            vacGroup.add(box);
        }

        // 真空连接管与接口
        const header = new THREE.Mesh(new THREE.CylinderGeometry(0.25, 0.25, length * 0.7, 16), this.materials.pipe);
        header.rotation.z = Math.PI / 2;
        header.position.set(0, frameHeight + vacuumBoxHeight + 0.2, -beltWidth / 2 - 0.6);
        header.name = '真空总管';
        vacGroup.add(header);

        // 与每段真空箱的短管
        for (let i = -1; i <= 1; i++) {
            const p = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 0.6, 12), this.materials.pipe);
            p.position.set(i * segLen * 1.05, frameHeight + vacuumBoxHeight + 0.2, -beltWidth / 2 - 0.3);
            p.rotation.x = Math.PI / 2;
            vacGroup.add(p);
        }

        // 上方挡泥帘（参考图片的棕色挡帘）
        const curtainCount = 10;
        for (let i = 0; i < curtainCount; i++) {
            const plate = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.35, beltWidth + 0.2), this.materials.cover);
            plate.position.set(-length / 2 + 2.2 + i * 0.55, frameHeight + 1.45, 0);
            plate.rotation.x = Math.PI / 18;
            plate.name = `挡泥帘_${i + 1}`;
            vacGroup.add(plate);
        }

        vacGroup.name = 'VBF_VacuumBoxes';
        this.components.set('vacuum', vacGroup);
        this.group.add(vacGroup);
    }

    getPortWorldPosition(name) {
        const fn = this.portMap?.[name];
        return typeof fn === 'function' ? fn() : null;
    }

    createSprayHeaders() {
        const { length, beltWidth, frameHeight, sprayHeaderCount } = this.config;
        const sprayGroup = new THREE.Group();
        const gap = length / (sprayHeaderCount + 1);
        for (let i = 1; i <= sprayHeaderCount; i++) {
            const x = -length / 2 + i * gap;
            const header = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, beltWidth + 0.8, 16), this.materials.pipe);
            header.rotation.z = Math.PI / 2;
            header.position.set(x, frameHeight + 0.9, 0);
            header.name = `清洗喷淋管_${i}`;
            sprayGroup.add(header);

            // 喷嘴
            for (let j = -4; j <= 4; j++) {
                const nozzle = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 8), this.materials.pipe);
                nozzle.rotation.x = -Math.PI / 2;
                nozzle.position.set(x, frameHeight + 0.86, j * (beltWidth / 9));
                sprayGroup.add(nozzle);
            }

            // 支撑吊杆
            const hanger = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.04, 0.9, 8), this.materials.steel);
            hanger.position.set(x, frameHeight + 1.35, beltWidth / 2 + 0.2);
            hanger.rotation.x = Math.PI / 2;
            sprayGroup.add(hanger);
        }
        sprayGroup.name = 'VBF_SprayHeaders';
        this.components.set('spray', sprayGroup);
        this.group.add(sprayGroup);
    }

    createDriveAndTensionUnits() {
        const { length, beltWidth, frameHeight } = this.config;
        const driveGroup = new THREE.Group();

        // 驱动电机与减速机（位于头部）
        const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.9, 16), this.materials.motor);
        motor.rotation.z = Math.PI / 2;
        motor.position.set(length / 2 - 1.4, frameHeight + 0.8, -beltWidth / 2 - 0.9);
        const gearbox = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.6, 0.6), this.materials.gearbox);
        gearbox.position.set(length / 2 - 1.9, frameHeight + 0.8, -beltWidth / 2 - 0.9);
        driveGroup.add(motor, gearbox);

        // 张紧机构（尾部）
        const tension = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.6, 0.8), this.materials.frameBlue);
        tension.position.set(-length / 2 + 1.6, frameHeight + 0.7, beltWidth / 2 + 0.8);
        driveGroup.add(tension);

        // 压辊（顶部灰黑色胶辊）
        const pressRoll = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, beltWidth + 0.5, 20), this.materials.roller);
        pressRoll.rotation.z = Math.PI / 2;
        pressRoll.material = new THREE.MeshStandardMaterial({ color: 0x444444, metalness: 0.2, roughness: 0.9 });
        pressRoll.position.set(length / 2 - 2.2, frameHeight + 0.85, 0);
        pressRoll.name = '压辊';
        driveGroup.add(pressRoll);

        driveGroup.name = 'VBF_DriveAndTension';
        this.components.set('drive', driveGroup);
        this.group.add(driveGroup);
    }

    createFeedAndDischarge() {
        const { length, beltWidth, frameHeight } = this.config;
        const ioGroup = new THREE.Group();

        // 进料斗（尾部上方）
        const feed = new THREE.Mesh(new THREE.BoxGeometry(1.8, 1.0, 1.4), this.materials.guard);
        feed.position.set(-length / 2 + 2.2, frameHeight + 1.6, 0);
        feed.name = '进料斗';
        ioGroup.add(feed);

        // 出料刮板+卸料罩（头部）
        const scraper = new THREE.Mesh(new THREE.BoxGeometry(0.3, 0.4, beltWidth + 0.4), this.materials.steel);
        scraper.position.set(length / 2 - 0.6, frameHeight + 0.65, 0);
        scraper.name = '卸料刮板';
        ioGroup.add(scraper);
        const hood = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.0, beltWidth + 0.8), this.materials.guard);
        hood.position.set(length / 2 - 0.6, frameHeight + 1.2, 0);
        hood.name = '卸料罩';
        ioGroup.add(hood);

        // 刮刀支架与调节杆（参考图片的滑槽横梁）
        const bar = new THREE.Mesh(new THREE.BoxGeometry(length * 0.9, 0.12, 0.12), this.materials.steel);
        bar.position.set(0, frameHeight + 1.35, beltWidth / 2 + 0.35);
        bar.name = '刮刀调节横梁';
        ioGroup.add(bar);

        ioGroup.name = 'VBF_IO';
        this.components.set('io', ioGroup);
        this.group.add(ioGroup);
    }

    createFiltrateSystem() {
        const { length, beltWidth, frameHeight } = this.config;
        const filGroup = new THREE.Group();

        // 集液槽（位于皮带下方）
        const trough = new THREE.Mesh(new THREE.BoxGeometry(length * 0.9, 0.5, beltWidth + 0.6), this.materials.guard);
        trough.position.set(0, frameHeight - 0.2, 0);
        trough.name = '集液槽';
        filGroup.add(trough);

        // 排液管
        const drain = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, length * 0.8, 16), this.materials.pipe);
        drain.rotation.z = Math.PI / 2;
        drain.position.set(0, frameHeight - 0.45, beltWidth / 2 + 0.9);
        drain.name = '滤液排出管';
        filGroup.add(drain);

        // 观察窗（透明玻璃）
        const windowPlate = new THREE.Mesh(new THREE.BoxGeometry(1.2, 0.5, 0.02), this.materials.glass);
        windowPlate.position.set(0, frameHeight + 0.9, -beltWidth / 2 - 0.95);
        windowPlate.name = '观察窗';
        filGroup.add(windowPlate);

        // 卸料端下方泥浆池（仅视觉模拟）
        const mud = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.6, beltWidth + 1.6), new THREE.MeshStandardMaterial({ color: 0x7A5B41, metalness: 0.1, roughness: 0.95 }));
        mud.position.set(length / 2 + 1.8, frameHeight - 0.3, 0);
        mud.name = '泥浆池';
        filGroup.add(mud);

        filGroup.name = 'VBF_FiltrateSystem';
        this.components.set('filtrate', filGroup);
        this.group.add(filGroup);
    }

    createGuardRails() {
        const { length, width, frameHeight } = this.config;
        const railGroup = new THREE.Group();

        // 护栏（两侧）
        const postGeom = new THREE.CylinderGeometry(0.05, 0.05, 1.0, 8);
        const barGeom = new THREE.BoxGeometry(length - 0.8, 0.05, 0.05);
        const barTop = new THREE.Mesh(barGeom, this.materials.rail);
        const barMid = new THREE.Mesh(barGeom, this.materials.rail);
        barTop.position.set(0, frameHeight + 1.1, -width / 2 + 0.15);
        barMid.position.set(0, frameHeight + 0.8, -width / 2 + 0.15);
        railGroup.add(barTop, barMid);
        const barTopR = barTop.clone(); barTopR.position.z = width / 2 - 0.15;
        const barMidR = barMid.clone(); barMidR.position.z = width / 2 - 0.15;
        railGroup.add(barTopR, barMidR);

        for (let x = -length / 2 + 0.4; x <= length / 2 - 0.4; x += 1.6) {
            const pL = new THREE.Mesh(postGeom, this.materials.rail);
            const pR = new THREE.Mesh(postGeom, this.materials.rail);
            pL.position.set(x, frameHeight + 0.55, -width / 2 + 0.15);
            pR.position.set(x, frameHeight + 0.55, width / 2 - 0.15);
            railGroup.add(pL, pR);
        }

        railGroup.name = 'VBF_GuardRails';
        this.components.set('rails', railGroup);
        this.group.add(railGroup);
    }

    createLabels() {
        const labelGroup = new THREE.Group();
        const addLabel = (text, pos) => {
            const sprite = this.createSpriteLabel(text);
            sprite.position.set(pos.x, pos.y, pos.z);
            labelGroup.add(sprite);
        };
        const { frameHeight, width } = this.config;
        // 仅保留“真空皮带机”主标签，使用对比色
        const label = this.createSpriteLabel('真空皮带机', '#FFD54F');
        label.position.set(0, frameHeight + 2.6, width / 2 + 0.2);
        // 与真空泵标签一致风格
        label.scale.set(3.98, 1.2, 1);
        label.material.opacity = 0.98;
        label.name = 'label_真空皮带机';
        labelGroup.add(label);

        labelGroup.name = 'VBF_Labels';
        this.components.set('labels', labelGroup);
        this.group.add(labelGroup);
    }

    createSpriteLabel(text, color = '#00BCD4') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256; canvas.height = 64;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        this.#roundRect(ctx, 6, 6, 244, 52, 8); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2; this.#roundRect(ctx, 6, 6, 244, 52, 8); ctx.stroke();
        ctx.fillStyle = color; ctx.font = 'bold 22px Microsoft YaHei, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);
        const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95 });
        const spr = new THREE.Sprite(mat); spr.scale.set(4, 1.1, 1);
        spr.name = `label_${text}`;
        return spr;
    }

    #roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }
}


