class AirCompressorRoom {
    constructor(config = {}) {
        const defaults = {
            name: '空压机房',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            size: { width: 16, height: 8, depth: 10 },
            color: 0x9aa7b2,
            edgeColor: 0x2e3b4e
        };
        this.config = Object.assign({}, defaults, config);

        this.group = new THREE.Group();
        this.group.name = this.config.name;
        this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
        this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);

        this.components = {};
        this.isInteriorView = false;
        this.interiorGroup = null;

        this.buildExteriorShell();
        this.createInteriorPlaceholder();
        this.createInteriorCompressors();
    }

    getGroup() {
        return this.group;
    }
    
    /**
     * 获取压缩空气储罐出口端口的世界坐标位置
     */
    getAirTankOutletWorldPosition() {
        const airTank = this.components.externalTank;
        if (!airTank) {
            console.warn('压缩空气储罐未找到');
            return null;
        }
        
        // 查找储罐的出口端口
        let outletPort = null;
        airTank.traverse((child) => {
            if (child.name === 'airTank_outlet_port') {
                outletPort = child;
            }
        });
        
        if (!outletPort) {
            console.warn('压缩空气储罐出口端口未找到');
            return null;
        }
        
        // 获取世界坐标位置
        const worldPosition = new THREE.Vector3();
        outletPort.getWorldPosition(worldPosition);
        return worldPosition;
    }

    buildExteriorShell() {
        const { width, height, depth } = this.config.size;

        const shellGroup = new THREE.Group();
        shellGroup.name = 'air_compressor_room_shell';

        // 基础外墙盒体（略微透明，工业灰）
        const wallMaterial = new THREE.MeshPhongMaterial({ color: this.config.color, transparent: true, opacity: 0.98 });
        const wallGeometry = new THREE.BoxGeometry(width, height, depth);
        const walls = new THREE.Mesh(wallGeometry, wallMaterial);
        walls.castShadow = true;
        walls.receiveShadow = true;
        walls.position.set(0, height / 2, 0);
        shellGroup.add(walls);

        // 屋顶（浅色金属板）
        const roofMaterial = new THREE.MeshPhongMaterial({ color: 0xbfc6cc });
        const roofGeometry = new THREE.BoxGeometry(width + 0.8, 0.5, depth + 0.8);
        const roof = new THREE.Mesh(roofGeometry, roofMaterial);
        roof.position.set(0, height + 0.2, 0);
        roof.castShadow = true;
        roof.receiveShadow = true;
        shellGroup.add(roof);

        // 门（位于前立面中心偏左）
        const doorMaterial = new THREE.MeshPhongMaterial({ color: 0x6b7b8c });
        const doorGeometry = new THREE.BoxGeometry(2, 3.2, 0.2);
        const door = new THREE.Mesh(doorGeometry, doorMaterial);
        door.position.set(-width / 3.5, 1.8, depth / 2 + 0.11);
        door.castShadow = true;
        shellGroup.add(door);

        // 前窗（强化工业风格的条窗）
        const windowMaterial = new THREE.MeshPhongMaterial({ color: 0x88aacc, transparent: true, opacity: 0.5 });
        const stripWindowGeometry = new THREE.BoxGeometry(width / 2.2, 0.5, 0.12);
        const frontWindow = new THREE.Mesh(stripWindowGeometry, windowMaterial);
        frontWindow.position.set(width / 6, height * 0.68, depth / 2 + 0.08);
        shellGroup.add(frontWindow);

        // 屋顶通风器（圆柱+盖帽）
        const ventMaterial = new THREE.MeshPhongMaterial({ color: 0x8d999f });
        const ventBaseGeo = new THREE.CylinderGeometry(0.5, 0.5, 0.6, 24);
        const ventBase = new THREE.Mesh(ventBaseGeo, ventMaterial);
        ventBase.position.set(-width / 4, height + 0.6, -depth / 6);
        shellGroup.add(ventBase);
        const ventCapGeo = new THREE.CylinderGeometry(0.7, 0.7, 0.2, 24);
        const ventCap = new THREE.Mesh(ventCapGeo, ventMaterial);
        ventCap.position.set(-width / 4, height + 1.0, -depth / 6);
        shellGroup.add(ventCap);

        // 边框线条，增强建筑感
        const edges = new THREE.EdgesGeometry(wallGeometry);
        const edgeLines = new THREE.LineSegments(
            edges,
            new THREE.LineBasicMaterial({ color: this.config.edgeColor })
        );
        edgeLines.position.copy(walls.position);
        shellGroup.add(edgeLines);

        this.components.exteriorShell = shellGroup;
        this.group.add(shellGroup);

        // 在空压机房右侧7个单位处创建压缩空气储罐（外部视角）
        const airTank = this.createAirReceiverTankModel('压缩空气储罐');
        airTank.position.set(width / 2 + 4, 0, 0);
        this.group.add(airTank);
        this.components.externalTank = airTank;

        // 储罐标签（参考一级脱硫塔标签实现逻辑）
        this.createTowerStyleLabel(airTank, '压缩空气储罐', { x: 3, y: 10, z: 4 }, '#00AAFF');
    }

    createInteriorPlaceholder() {
        // 仅创建一个空的内部组，不放置任何模型，满足后续扩展
        this.interiorGroup = new THREE.Group();
        this.interiorGroup.name = 'air_compressor_room_interior';
        this.interiorGroup.visible = false;
        this.group.add(this.interiorGroup);
    }

    /**
     * 创建三台空压机并排布：
     * - 两列布局，列方向为 X 轴
     * - 第一列：空压机A（上/靠后），空压机B（下/靠前）
     * - 第二列：空压机C（与A同一行），第二行预留空位
     * 行方向为 Z 轴，行距约 5 个单位
     */
    createInteriorCompressors() {
        if (!this.interiorGroup) return;

        const roomSize = this.config.size;
        const marginX = 2.0;
        const marginZ = 2.0;

        // 依据机房大小设定压缩机尺寸（不要太小）
        const compressorSize = {
            width: Math.min(6.5, Math.max(5.0, roomSize.width * 0.28)),   // X 方向
            height: Math.min(5.0, Math.max(4.0, roomSize.height * 0.45)), // Y 方向
            depth: Math.min(4.0, Math.max(3.2, roomSize.depth * 0.18))    // Z 方向
        };

        const columnOffsetX = roomSize.width / 4; // 两列大致分布在±1/4处
        const rowSpacingZ = 10.0;                 // 行距增加5（由5→10）
        const baseY = 0;                          // 落地

        const col1X = -columnOffsetX + marginX * 0.2;
        const col2X = +columnOffsetX - marginX * 0.2;
        const row1Z = -rowSpacingZ / 2; // 上/靠后
        const row2Z = rowSpacingZ / 2;  // 下/靠前

        // 创建三台空压机
        const compA = this.createCompressorModel('空压机A', compressorSize);
        compA.position.set(col1X, baseY, row1Z);
        this.interiorGroup.add(compA);

        const compB = this.createCompressorModel('空压机B', compressorSize);
        compB.position.set(col1X, baseY, row2Z);
        this.interiorGroup.add(compB);

        const compC = this.createCompressorModel('空压机C', compressorSize);
        compC.position.set(col2X, baseY, row1Z);
        this.interiorGroup.add(compC);

        // 在预留位创建同等尺寸的干燥机（与空压机大小相同，但造型不同）
        const dryer = this.createDryerModel('干燥机', compressorSize);
        dryer.position.set(col2X, baseY, row2Z);
        this.interiorGroup.add(dryer);

        // 设备标签（参考工业综合楼内石膏旋流器的标签实现逻辑）
        this.createEquipmentLabel(compA, '空压机A', '#00D1FF');
        this.createEquipmentLabel(compB, '空压机B', '#00D1FF');
        this.createEquipmentLabel(compC, '空压机C', '#00D1FF');
        this.createEquipmentLabel(dryer, '干燥机', '#FFD166');

        // 工业管道连接：三台空压机底部 → 干燥机底部
        const pipeY = 0.25; // 靠近地面的管道高度
        const radius = 0.07;
        this.createStraightPipe(
            new THREE.Vector3(compA.position.x, pipeY, compA.position.z),
            new THREE.Vector3(dryer.position.x, pipeY, dryer.position.z),
            radius,
            0x95A5B8,
            '空压机A→干燥机'
        );
        this.createStraightPipe(
            new THREE.Vector3(compB.position.x, pipeY, compB.position.z),
            new THREE.Vector3(dryer.position.x, pipeY, dryer.position.z),
            radius,
            0x95A5B8,
            '空压机B→干燥机'
        );
        this.createStraightPipe(
            new THREE.Vector3(compC.position.x, pipeY, compC.position.z),
            new THREE.Vector3(dryer.position.x, pipeY, dryer.position.z),
            radius,
            0x95A5B8,
            '空压机C→干燥机'
        );

        // 干燥机 → 外部压缩空气储罐 底部管道连接
        const tankObj = this.components.externalTank || this.group.children.find(obj => obj && obj.name === '压缩空气储罐');
        if (tankObj) {
            // 将世界坐标转换到机房局部坐标，保持在同一坐标系创建圆柱
            const toLocal = (v) => v.clone().applyMatrix4(new THREE.Matrix4().copy(this.group.matrixWorld).invert());
            const tankWorld = new THREE.Vector3();
            tankObj.getWorldPosition(tankWorld);
            const tankLocal = toLocal(new THREE.Vector3(tankWorld.x, pipeY, tankWorld.z));
            const dryerLocal = new THREE.Vector3(dryer.position.x, pipeY, dryer.position.z);
            const externalPipe = this.createStraightPipe(dryerLocal, tankLocal, radius, 0x95A5B8, '干燥机→空气储罐');
            // 标记为外部连管，以便视角切换时显隐
            if (!this.components.externalPipes) this.components.externalPipes = [];
            this.components.externalPipes.push(externalPipe);
        }


    }

    /**
     * 创建一台现代化工业螺杆空压机模型
     * 参考阿特拉斯·科普柯、英格索兰等主流品牌设计
     */
    createCompressorModel(name, size) {
        const group = new THREE.Group();
        group.name = name;

        const { width, height, depth } = size;

        // 1. 加强型混凝土基座（带减震垫）
        const baseGeo = new THREE.BoxGeometry(width + 0.8, 0.4, depth + 0.8);
        const baseMat = new THREE.MeshStandardMaterial({ 
            color: 0x3a3a3a, 
            roughness: 0.8, 
            metalness: 0.1 
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, 0.2, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 减震垫（橡胶材质）
        const dampingPads = [];
        const padPositions = [
            [-width/3, 0.41, -depth/3], [width/3, 0.41, -depth/3],
            [-width/3, 0.41, depth/3], [width/3, 0.41, depth/3]
        ];
        padPositions.forEach(pos => {
            const padGeo = new THREE.CylinderGeometry(0.15, 0.15, 0.08, 16);
            const padMat = new THREE.MeshStandardMaterial({ 
                color: 0x1a1a1a, 
                roughness: 0.9 
            });
            const pad = new THREE.Mesh(padGeo, padMat);
            pad.position.set(...pos);
            group.add(pad);
        });

        // 2. 主机体外壳（分段式设计）
        // 下半部分 - 压缩机主体
        const lowerBodyGeo = new THREE.BoxGeometry(width, height * 0.6, depth);
        const lowerBodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x2E5984, 
            roughness: 0.3, 
            metalness: 0.7 
        });
        const lowerBody = new THREE.Mesh(lowerBodyGeo, lowerBodyMat);
        lowerBody.position.set(0, height * 0.3 + 0.45, 0);
        lowerBody.castShadow = true;
        lowerBody.receiveShadow = true;
        group.add(lowerBody);

        // 上半部分 - 电机舱
        const upperBodyGeo = new THREE.BoxGeometry(width * 0.8, height * 0.4, depth * 0.9);
        const upperBodyMat = new THREE.MeshStandardMaterial({ 
            color: 0x1E3A52, 
            roughness: 0.2, 
            metalness: 0.8 
        });
        const upperBody = new THREE.Mesh(upperBodyGeo, upperBodyMat);
        upperBody.position.set(0, height * 0.8 + 0.45, 0);
        upperBody.castShadow = true;
        group.add(upperBody);

        // 3. 电机外壳（圆柱形）
        const motorGeo = new THREE.CylinderGeometry(width * 0.25, width * 0.25, height * 0.35, 32);
        const motorMat = new THREE.MeshStandardMaterial({ 
            color: 0x4A4A4A, 
            roughness: 0.4, 
            metalness: 0.6 
        });
        const motor = new THREE.Mesh(motorGeo, motorMat);
        motor.position.set(width * 0.2, height * 0.8 + 0.45, -depth * 0.2);
        motor.rotation.z = Math.PI / 2;
        motor.castShadow = true;
        group.add(motor);

        // 电机散热翅片
        for (let i = 0; i < 8; i++) {
            const finGeo = new THREE.BoxGeometry(width * 0.52, 0.02, 0.08);
            const finMat = new THREE.MeshStandardMaterial({ 
                color: 0x3A3A3A, 
                roughness: 0.6 
            });
            const fin = new THREE.Mesh(finGeo, finMat);
            fin.position.set(width * 0.2, height * 0.8 + 0.45, -depth * 0.2 + (i - 4) * 0.06);
            group.add(fin);
        }

        // 4. 冷却器组件（侧面）
        const coolerGeo = new THREE.BoxGeometry(0.15, height * 0.5, depth * 0.8);
        const coolerMat = new THREE.MeshStandardMaterial({ 
            color: 0x6B7280, 
            roughness: 0.5, 
            metalness: 0.4 
        });
        const cooler = new THREE.Mesh(coolerGeo, coolerMat);
        cooler.position.set(width * 0.45, height * 0.5 + 0.45, 0);
        cooler.castShadow = true;
        group.add(cooler);

        // 冷却器散热片
        for (let i = 0; i < 12; i++) {
            const plateGeo = new THREE.BoxGeometry(0.02, height * 0.45, 0.08);
            const plateMat = new THREE.MeshStandardMaterial({ 
                color: 0x8B8B8B, 
                roughness: 0.7 
            });
            const plate = new THREE.Mesh(plateGeo, plateMat);
            plate.position.set(width * 0.52, height * 0.5 + 0.45, (i - 6) * 0.1);
            group.add(plate);
        }

        // 5. 控制面板（现代化设计）
        const panelGeo = new THREE.BoxGeometry(width * 0.4, height * 0.6, 0.08);
        const panelMat = new THREE.MeshStandardMaterial({ 
            color: 0x2D3748, 
            roughness: 0.2, 
            metalness: 0.8 
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(-width * 0.3, height * 0.5 + 0.45, depth / 2 + 0.04);
        panel.castShadow = true;
        group.add(panel);

        // 触摸屏显示器
        const screenGeo = new THREE.BoxGeometry(width * 0.25, height * 0.2, 0.02);
        const screenMat = new THREE.MeshStandardMaterial({ 
            color: 0x000000, 
            emissive: 0x1E40AF, 
            emissiveIntensity: 0.3 
        });
        const screen = new THREE.Mesh(screenGeo, screenMat);
        screen.position.set(-width * 0.3, height * 0.65 + 0.45, depth / 2 + 0.09);
        group.add(screen);

        // 控制按钮组
        const buttonColors = [0x10B981, 0xEF4444, 0xF59E0B, 0x6366F1];
        const buttonPositions = [
            [-width * 0.35, height * 0.35 + 0.45], [-width * 0.25, height * 0.35 + 0.45],
            [-width * 0.35, height * 0.25 + 0.45], [-width * 0.25, height * 0.25 + 0.45]
        ];
        buttonPositions.forEach((pos, i) => {
            const buttonGeo = new THREE.CylinderGeometry(0.025, 0.025, 0.02, 16);
            const buttonMat = new THREE.MeshStandardMaterial({ 
                color: buttonColors[i], 
                emissive: buttonColors[i], 
                emissiveIntensity: 0.2 
            });
            const button = new THREE.Mesh(buttonGeo, buttonMat);
            button.position.set(pos[0], pos[1], depth / 2 + 0.1);
            button.rotation.x = Math.PI / 2;
            group.add(button);
        });

        // 6. 进气过滤器
        const filterGeo = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 24);
        const filterMat = new THREE.MeshStandardMaterial({ 
            color: 0xF3F4F6, 
            roughness: 0.4 
        });
        const filter = new THREE.Mesh(filterGeo, filterMat);
        filter.position.set(-width * 0.3, height + 0.75, -depth * 0.3);
        filter.castShadow = true;
        group.add(filter);

        // 过滤器盖
        const filterCapGeo = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 24);
        const filterCapMat = new THREE.MeshStandardMaterial({ 
            color: 0xD1D5DB, 
            roughness: 0.3, 
            metalness: 0.5 
        });
        const filterCap = new THREE.Mesh(filterCapGeo, filterCapMat);
        filterCap.position.set(-width * 0.3, height + 1.1, -depth * 0.3);
        group.add(filterCap);

        // 7. 储气罐（立式）
        const tankGeo = new THREE.CylinderGeometry(width * 0.2, width * 0.2, height * 0.8, 32);
        const tankMat = new THREE.MeshStandardMaterial({ 
            color: 0x374151, 
            roughness: 0.3, 
            metalness: 0.7 
        });
        const tank = new THREE.Mesh(tankGeo, tankMat);
        tank.position.set(width * 0.35, height * 0.4 + 0.85, depth * 0.3);
        tank.castShadow = true;
        group.add(tank);

        // 储气罐顶部封头
        const tankTopGeo = new THREE.SphereGeometry(width * 0.2, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const tankTop = new THREE.Mesh(tankTopGeo, tankMat);
        tankTop.position.set(width * 0.35, height * 0.8 + 0.85, depth * 0.3);
        group.add(tankTop);

        // 储气罐底部封头
        const tankBottomGeo = new THREE.SphereGeometry(width * 0.2, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const tankBottom = new THREE.Mesh(tankBottomGeo, tankMat);
        tankBottom.position.set(width * 0.35, 0.85, depth * 0.3);
        group.add(tankBottom);

        // 8. 管道系统
        // 主出气管
        const mainPipeGeo = new THREE.CylinderGeometry(0.08, 0.08, width * 0.6, 16);
        const pipeMat = new THREE.MeshStandardMaterial({ 
            color: 0x6B7280, 
            roughness: 0.4, 
            metalness: 0.6 
        });
        const mainPipe = new THREE.Mesh(mainPipeGeo, pipeMat);
        mainPipe.position.set(0, height + 0.6, depth * 0.4);
        mainPipe.rotation.z = Math.PI / 2;
        mainPipe.castShadow = true;
        group.add(mainPipe);

        // 连接弯头
        const elbowGeo = new THREE.TorusGeometry(0.12, 0.08, 8, 16, Math.PI / 2);
        const elbow1 = new THREE.Mesh(elbowGeo, pipeMat);
        elbow1.position.set(width * 0.25, height + 0.6, depth * 0.4);
        elbow1.rotation.y = Math.PI / 2;
        group.add(elbow1);

        const elbow2 = new THREE.Mesh(elbowGeo, pipeMat);
        elbow2.position.set(-width * 0.25, height + 0.6, depth * 0.4);
        elbow2.rotation.y = -Math.PI / 2;
        group.add(elbow2);

        // 9. 安全阀和压力表
        const safetyValveGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 16);
        const valveMat = new THREE.MeshStandardMaterial({ 
            color: 0xDC2626, 
            roughness: 0.3, 
            metalness: 0.7 
        });
        const safetyValve = new THREE.Mesh(safetyValveGeo, valveMat);
        safetyValve.position.set(width * 0.35, height * 0.9 + 0.85, depth * 0.3);
        group.add(safetyValve);

        // 压力表
        const gaugeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.03, 16);
        const gaugeMat = new THREE.MeshStandardMaterial({ 
            color: 0xF8F9FA, 
            roughness: 0.2 
        });
        const gauge = new THREE.Mesh(gaugeGeo, gaugeMat);
        gauge.position.set(-width * 0.2, height * 0.7 + 0.45, depth / 2 + 0.1);
        gauge.rotation.x = Math.PI / 2;
        group.add(gauge);

        // 压力表表盘
        const dialGeo = new THREE.CylinderGeometry(0.05, 0.05, 0.005, 16);
        const dialMat = new THREE.MeshStandardMaterial({ 
            color: 0x000000 
        });
        const dial = new THREE.Mesh(dialGeo, dialMat);
        dial.position.set(-width * 0.2, height * 0.7 + 0.45, depth / 2 + 0.125);
        dial.rotation.x = Math.PI / 2;
        group.add(dial);

        // 10. 品牌标识牌
        const logoGeo = new THREE.BoxGeometry(width * 0.3, 0.15, 0.01);
        const logoMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF, 
            roughness: 0.1 
        });
        const logo = new THREE.Mesh(logoGeo, logoMat);
        logo.position.set(0, height * 0.85 + 0.45, depth / 2 + 0.005);
        group.add(logo);

        // 11. 维护门把手
        const handleGeo = new THREE.BoxGeometry(0.15, 0.03, 0.03);
        const handleMat = new THREE.MeshStandardMaterial({ 
            color: 0x9CA3AF, 
            roughness: 0.3, 
            metalness: 0.8 
        });
        const handle = new THREE.Mesh(handleGeo, handleMat);
        handle.position.set(width * 0.15, height * 0.3 + 0.45, depth / 2 + 0.02);
        group.add(handle);

        // 12. 排水阀
        const drainValveGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.08, 16);
        const drainValve = new THREE.Mesh(drainValveGeo, valveMat);
        drainValve.position.set(width * 0.35, 0.5, depth * 0.3);
        group.add(drainValve);

        // 13. 电缆接线盒
        const junctionBoxGeo = new THREE.BoxGeometry(0.2, 0.15, 0.1);
        const junctionBoxMat = new THREE.MeshStandardMaterial({ 
            color: 0x4B5563, 
            roughness: 0.4 
        });
        const junctionBox = new THREE.Mesh(junctionBoxGeo, junctionBoxMat);
        junctionBox.position.set(-width * 0.4, height * 0.8 + 0.45, -depth * 0.3);
        junctionBox.castShadow = true;
        group.add(junctionBox);

        // 14. 设备铭牌
        const nameplateGeo = new THREE.BoxGeometry(0.25, 0.12, 0.005);
        const nameplateMat = new THREE.MeshStandardMaterial({ 
            color: 0xE5E7EB, 
            roughness: 0.2 
        });
        const nameplate = new THREE.Mesh(nameplateGeo, nameplateMat);
        nameplate.position.set(-width * 0.35, height * 0.2 + 0.45, depth / 2 + 0.003);
        group.add(nameplate);

        return group;
    }

    /**
     * 创建蓝色立式压缩空气储罐（1:1还原图片）
     * - 结构：圆柱壳体 + 上下椭球封头 + 4条支腿 + 圆形混凝土基础
     * - 细节：左侧底部进气短节与竖向立管、顶部小接口、侧面蓝底铭牌、喷漆标识条
     */
    createAirReceiverTankModel(name = '压缩空气储罐') {
        const group = new THREE.Group();
        group.name = name;

        // 尺寸估算（与现场照片比例一致）
        const diameter = 2.4; // 罐体直径
        const radius = diameter / 2;
        const shellHeight = 5.2; // 圆柱段高度
        const headHeight = radius * 0.9; // 每个封头近似高度（椭球缩放）

        // 0) 圆形混凝土基础（黄色，略磨损效果可后续用纹理增强）
        const foundationH = 0.35;
        const foundationGeo = new THREE.CylinderGeometry(radius * 1.05, radius * 1.05, foundationH, 48);
        const foundationMat = new THREE.MeshStandardMaterial({ color: 0xE0B74E, roughness: 0.9, metalness: 0.02 });
        const foundation = new THREE.Mesh(foundationGeo, foundationMat);
        foundation.position.set(0, foundationH / 2, 0);
        foundation.receiveShadow = true;
        group.add(foundation);

        // 1) 支腿 + 垫块
        const legH = 0.9;
        const legGeo = new THREE.BoxGeometry(0.18, legH, 0.12);
        const legMat = new THREE.MeshStandardMaterial({ color: 0x1E63B6, roughness: 0.6, metalness: 0.2 });
        const padGeo = new THREE.CylinderGeometry(0.16, 0.16, 0.12, 16);
        const padMat = new THREE.MeshStandardMaterial({ color: 0xEDEDED, roughness: 0.85 });
        const legOffset = radius * 0.7;
        const baseTopY = foundationH; // 基础顶标高
        const legCenterY = baseTopY + legH / 2;
        [
            [ legOffset, legCenterY, 0],
            [-legOffset, legCenterY, 0],
            [0,            legCenterY,  legOffset],
            [0,            legCenterY, -legOffset]
        ].forEach(p => {
            const leg = new THREE.Mesh(legGeo, legMat);
            leg.position.set(p[0], p[1], p[2]);
            group.add(leg);
            const pad = new THREE.Mesh(padGeo, padMat);
            pad.position.set(p[0], foundationH / 2 + 0.06, p[2]);
            group.add(pad);
        });

        // 2) 罐体圆柱段（蓝色）
        const blueMat = new THREE.MeshStandardMaterial({ color: 0x1F5FBF, roughness: 0.45, metalness: 0.15 });
        const shellGeo = new THREE.CylinderGeometry(radius, radius, shellHeight, 48);
        const shell = new THREE.Mesh(shellGeo, blueMat);
        const shellCenterY = baseTopY + legH + shellHeight / 2;
        shell.position.set(0, shellCenterY, 0);
        shell.castShadow = true;
        shell.receiveShadow = true;
        group.add(shell);

        // 3) 上下椭球封头（用半球体并在Y方向缩放近似）
        const hemiGeo = new THREE.SphereGeometry(radius, 48, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const topHead = new THREE.Mesh(hemiGeo, blueMat);
        topHead.scale.set(1, headHeight / radius, 1);
        topHead.position.set(0, shellCenterY + shellHeight / 2, 0);
        group.add(topHead);

        const bottomHead = new THREE.Mesh(hemiGeo, blueMat);
        bottomHead.scale.set(1, headHeight / radius, 1);
        bottomHead.rotation.x = Math.PI;
        bottomHead.position.set(0, shellCenterY - shellHeight / 2, 0);
        group.add(bottomHead);

        // 4) 左侧底部进气短节 + 90°弯头 + 竖向立管（复刻照片左侧管路）
        const nozzleR = 0.12;
        const pipeMat = new THREE.MeshStandardMaterial({ color: 0x254E7B, metalness: 0.7, roughness: 0.35 });
        // 水平短节（从罐体穿出）
        const short1 = new THREE.Mesh(new THREE.CylinderGeometry(nozzleR, nozzleR, 0.45, 24), pipeMat);
        short1.rotation.z = Math.PI / 2;
        short1.position.set(-radius * 0.98, shellCenterY - shellHeight * 0.22, 0);
        group.add(short1);
        // 90°弯头（圆环扇形近似）
        const elbowGeo = new THREE.TorusGeometry(nozzleR, nozzleR * 0.6, 12, 32, Math.PI / 2);
        const elbow1 = new THREE.Mesh(elbowGeo, pipeMat);
        elbow1.rotation.set(0, Math.PI / 2, Math.PI / 2);
        elbow1.position.set(short1.position.x - 0.225, short1.position.y, 0);
        group.add(elbow1);
        // 竖向立管
        const riser = new THREE.Mesh(new THREE.CylinderGeometry(nozzleR, nozzleR, shellHeight * 0.75, 24), pipeMat);
        riser.position.set(elbow1.position.x, shellCenterY + 0.2, 0);
        group.add(riser);

        // 5) 右侧喷漆标识条（模拟红字竖排位置）
        const stripeGeo = new THREE.BoxGeometry(0.04, shellHeight * 0.7, 0.02);
        const stripeMat = new THREE.MeshStandardMaterial({ color: 0x183C7A, emissive: 0x183C7A, emissiveIntensity: 0.05 });
        const stripe = new THREE.Mesh(stripeGeo, stripeMat);
        stripe.position.set(radius * 0.95, shellCenterY + 0.1, 0.65);
        group.add(stripe);

        // 6) 侧面蓝底白字铭牌（文字可换为“压缩空气储罐”）
        const plateGeo = new THREE.PlaneGeometry(0.6, 0.28);
        const plateCanvas = document.createElement('canvas');
        plateCanvas.width = 256; plateCanvas.height = 128;
        const pctx = plateCanvas.getContext('2d');
        pctx.fillStyle = '#1E4BB8';
        pctx.fillRect(0, 0, 256, 128);
        pctx.fillStyle = '#FFFFFF';
        pctx.font = 'bold 38px Microsoft YaHei';
        pctx.textAlign = 'center'; pctx.textBaseline = 'middle';
        pctx.fillText('压缩空气储罐', 128, 70);
        const plateTex = new THREE.CanvasTexture(plateCanvas);
        const plateMat = new THREE.MeshBasicMaterial({ map: plateTex, transparent: true });
        const plate = new THREE.Mesh(plateGeo, plateMat);
        plate.position.set(0.0, shellCenterY + 0.2, radius + 0.011);
        group.add(plate);

        // 7) 顶部小接口（安全阀/压力表位）
        const topNozzle = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.25, 16), pipeMat);
        topNozzle.position.set(radius * 0.2, shellCenterY + shellHeight / 2 + headHeight * 0.9, -radius * 0.2);
        // 作为储气罐的对外连接端口（供外部连管检索）
        topNozzle.name = 'airTank_outlet_port';
        group.add(topNozzle);

        // 统一阴影设置
        group.traverse(obj => { if (obj.isMesh) { obj.castShadow = true; obj.receiveShadow = true; } });

        return group;
    }

    /**
     * 创建箱体式冷干机模型（参考图片实物1:1还原）
     * 采用白色主体外壳 + 前置控制面板 + 管道接口设计
     */
    createDryerModel(name, size) {
        const group = new THREE.Group();
        group.name = name;

        const { width, height, depth } = size;

        // 1. 混凝土基座（减震用）
        const baseGeo = new THREE.BoxGeometry(width + 0.4, 0.2, depth + 0.4);
        const baseMat = new THREE.MeshStandardMaterial({ 
            color: 0x404040, 
            roughness: 0.9, 
            metalness: 0.05 
        });
        const base = new THREE.Mesh(baseGeo, baseMat);
        base.position.set(0, 0.1, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        // 2. 主体外壳（白色箱体）
        const mainBodyGeo = new THREE.BoxGeometry(width, height * 0.9, depth);
        const mainBodyMat = new THREE.MeshStandardMaterial({ 
            color: 0xF5F5F5, 
            roughness: 0.2, 
            metalness: 0.1 
        });
        const mainBody = new THREE.Mesh(mainBodyGeo, mainBodyMat);
        mainBody.position.set(0, height * 0.45 + 0.2, 0);
        mainBody.castShadow = true;
        mainBody.receiveShadow = true;
        group.add(mainBody);

        // 3. 顶部设备罩（深灰色）
        const topCoverGeo = new THREE.BoxGeometry(width + 0.1, height * 0.1, depth + 0.1);
        const topCoverMat = new THREE.MeshStandardMaterial({ 
            color: 0x606060, 
            roughness: 0.4, 
            metalness: 0.3 
        });
        const topCover = new THREE.Mesh(topCoverGeo, topCoverMat);
        topCover.position.set(0, height * 0.95 + 0.15, 0);
        topCover.castShadow = true;
        group.add(topCover);

        // 4. 前面板控制箱（与图片完全一致）
        const panelGeo = new THREE.BoxGeometry(width * 0.7, height * 0.6, 0.1);
        const panelMat = new THREE.MeshStandardMaterial({ 
            color: 0xF8F8F8, 
            roughness: 0.15, 
            metalness: 0.05 
        });
        const panel = new THREE.Mesh(panelGeo, panelMat);
        panel.position.set(0, height * 0.5 + 0.2, depth / 2 + 0.05);
        panel.castShadow = true;
        group.add(panel);

        // 5. 控制面板边框（深灰色金属框）
        const frameBorderGeo = new THREE.BoxGeometry(width * 0.72, height * 0.62, 0.05);
        const frameBorderMat = new THREE.MeshStandardMaterial({ 
            color: 0x4A4A4A, 
            roughness: 0.3, 
            metalness: 0.7 
        });
        const frameBorder = new THREE.Mesh(frameBorderGeo, frameBorderMat);
        frameBorder.position.set(0, height * 0.5 + 0.2, depth / 2 + 0.025);
        group.add(frameBorder);

        // 6. 左侧控制区域（甲醛净化标识区）
        const leftControlGeo = new THREE.BoxGeometry(width * 0.25, height * 0.45, 0.02);
        const leftControlMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF, 
            roughness: 0.1 
        });
        const leftControl = new THREE.Mesh(leftControlGeo, leftControlMat);
        leftControl.position.set(-width * 0.2, height * 0.45 + 0.2, depth / 2 + 0.11);
        group.add(leftControl);

        // 7. 中间显示屏区域（蓝色标识牌）
        const displayGeo = new THREE.BoxGeometry(width * 0.2, height * 0.08, 0.01);
        const displayMat = new THREE.MeshStandardMaterial({ 
            color: 0x1E40AF, 
            emissive: 0x1E40AF, 
            emissiveIntensity: 0.3 
        });
        const display = new THREE.Mesh(displayGeo, displayMat);
        display.position.set(0, height * 0.65 + 0.2, depth / 2 + 0.115);
        group.add(display);

        // 8. 右侧控制面板区域
        const rightControlGeo = new THREE.BoxGeometry(width * 0.25, height * 0.45, 0.02);
        const rightControl = new THREE.Mesh(rightControlGeo, leftControlMat);
        rightControl.position.set(width * 0.2, height * 0.45 + 0.2, depth / 2 + 0.11);
        group.add(rightControl);

        // 9. 指示灯组（圆形指示灯）
        const indicatorColors = [0x10B981, 0xF59E0B, 0xEF4444, 0x3B82F6];
        const indicatorPositions = [
            [-width * 0.15, height * 0.75 + 0.2], [-width * 0.05, height * 0.75 + 0.2],
            [width * 0.05, height * 0.75 + 0.2], [width * 0.15, height * 0.75 + 0.2]
        ];
        indicatorPositions.forEach((pos, i) => {
            const indicatorGeo = new THREE.CylinderGeometry(0.015, 0.015, 0.01, 16);
            const indicatorMat = new THREE.MeshStandardMaterial({ 
                color: indicatorColors[i], 
                emissive: indicatorColors[i], 
                emissiveIntensity: 0.4 
            });
            const indicator = new THREE.Mesh(indicatorGeo, indicatorMat);
            indicator.position.set(pos[0], pos[1], depth / 2 + 0.12);
            indicator.rotation.x = Math.PI / 2;
            group.add(indicator);
        });

        // 10. 控制按钮（方形按钮组）
        const buttonGeo = new THREE.BoxGeometry(0.04, 0.04, 0.01);
        const buttonPositions = [
            [-width * 0.25, height * 0.35 + 0.2], [-width * 0.15, height * 0.35 + 0.2],
            [width * 0.15, height * 0.35 + 0.2], [width * 0.25, height * 0.35 + 0.2]
        ];
        const buttonColors = [0x10B981, 0xEF4444, 0xF59E0B, 0x6366F1];
        buttonPositions.forEach((pos, i) => {
            const buttonMat = new THREE.MeshStandardMaterial({ 
                color: buttonColors[i], 
                emissive: buttonColors[i], 
                emissiveIntensity: 0.2 
            });
            const button = new THREE.Mesh(buttonGeo, buttonMat);
            button.position.set(pos[0], pos[1], depth / 2 + 0.12);
            group.add(button);
        });

        // 11. 顶部进气管道接口
        const inletPipeGeo = new THREE.CylinderGeometry(0.06, 0.06, 0.4, 16);
        const pipeMat = new THREE.MeshStandardMaterial({ 
            color: 0x708090, 
            roughness: 0.4, 
            metalness: 0.6 
        });
        const inletPipe = new THREE.Mesh(inletPipeGeo, pipeMat);
        inletPipe.position.set(-width * 0.25, height + 0.4, -depth * 0.3);
        inletPipe.castShadow = true;
        group.add(inletPipe);

        // 12. 顶部出气管道接口
        const outletPipe = new THREE.Mesh(inletPipeGeo, pipeMat);
        outletPipe.position.set(width * 0.25, height + 0.4, -depth * 0.3);
        outletPipe.castShadow = true;
        outletPipe.name = 'airTank_outlet_port';
        group.add(outletPipe);

        // 13. 侧面排水管道
        const drainPipeGeo = new THREE.CylinderGeometry(0.03, 0.03, 0.2, 16);
        const drainPipe = new THREE.Mesh(drainPipeGeo, pipeMat);
        drainPipe.position.set(width * 0.4, 0.35, depth * 0.3);
        drainPipe.rotation.z = Math.PI / 2;
        group.add(drainPipe);

        // 14. 排水阀
        const drainValveGeo = new THREE.SphereGeometry(0.04, 8, 8);
        const drainValveMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B5A00, 
            roughness: 0.3, 
            metalness: 0.8 
        });
        const drainValve = new THREE.Mesh(drainValveGeo, drainValveMat);
        drainValve.position.set(width * 0.5, 0.35, depth * 0.3);
        group.add(drainValve);

        // 15. 内部制冷系统（侧面散热器）
        const coolerGeo = new THREE.BoxGeometry(0.08, height * 0.6, depth * 0.7);
        const coolerMat = new THREE.MeshStandardMaterial({ 
            color: 0x8B8B8B, 
            roughness: 0.6, 
            metalness: 0.4 
        });
        const cooler = new THREE.Mesh(coolerGeo, coolerMat);
        cooler.position.set(-width * 0.46, height * 0.5 + 0.2, 0);
        cooler.castShadow = true;
        group.add(cooler);

        // 散热翅片
        for (let i = 0; i < 10; i++) {
            const finGeo = new THREE.BoxGeometry(0.02, height * 0.55, 0.06);
            const finMat = new THREE.MeshStandardMaterial({ 
                color: 0xA0A0A0, 
                roughness: 0.7 
            });
            const fin = new THREE.Mesh(finGeo, finMat);
            fin.position.set(-width * 0.52, height * 0.5 + 0.2, (i - 5) * 0.08);
            group.add(fin);
        }

        // 16. 压缩机组件（内部，部分可见）
        const compressorGeo = new THREE.CylinderGeometry(0.12, 0.12, height * 0.3, 16);
        const compressorMat = new THREE.MeshStandardMaterial({ 
            color: 0x4A4A4A, 
            roughness: 0.5, 
            metalness: 0.7 
        });
        const compressor = new THREE.Mesh(compressorGeo, compressorMat);
        compressor.position.set(width * 0.2, height * 0.4 + 0.2, -depth * 0.2);
        compressor.rotation.z = Math.PI / 2;
        compressor.castShadow = true;
        group.add(compressor);

        // 17. 设备铭牌（白色标识牌）
        const nameplateGeo = new THREE.BoxGeometry(width * 0.3, 0.08, 0.005);
        const nameplateMat = new THREE.MeshStandardMaterial({ 
            color: 0xFFFFFF, 
            roughness: 0.1 
        });
        const nameplate = new THREE.Mesh(nameplateGeo, nameplateMat);
        nameplate.position.set(0, height * 0.15 + 0.2, depth / 2 + 0.003);
        group.add(nameplate);

        // 18. 添加蓝色标识牌文字纹理
        const blueSignCanvas = document.createElement('canvas');
        blueSignCanvas.width = 128;
        blueSignCanvas.height = 32;
        const blueSignCtx = blueSignCanvas.getContext('2d');
        blueSignCtx.fillStyle = '#1E40AF';
        blueSignCtx.fillRect(0, 0, 128, 32);
        blueSignCtx.fillStyle = '#FFFFFF';
        blueSignCtx.font = 'bold 14px Arial';
        blueSignCtx.textAlign = 'center';
        blueSignCtx.fillText('干燥机', 64, 20);
        
        const blueSignTexture = new THREE.CanvasTexture(blueSignCanvas);
        const blueSignMat = new THREE.MeshStandardMaterial({ 
            map: blueSignTexture,
            transparent: true
        });
        display.material = blueSignMat;

        // 19. 添加品牌标识纹理
        const brandCanvas = document.createElement('canvas');
        brandCanvas.width = 192;
        brandCanvas.height = 48;
        const brandCtx = brandCanvas.getContext('2d');
        brandCtx.fillStyle = '#FFFFFF';
        brandCtx.fillRect(0, 0, 192, 48);
        brandCtx.fillStyle = '#333333';
        brandCtx.font = 'bold 12px Arial';
        brandCtx.textAlign = 'center';
        brandCtx.fillText('冷干机', 96, 20);
        brandCtx.font = '10px Arial';
        brandCtx.fillText('Model: CDM-Series', 96, 35);
        
        const brandTexture = new THREE.CanvasTexture(brandCanvas);
        const brandMat = new THREE.MeshStandardMaterial({ 
            map: brandTexture,
            transparent: true
        });
        nameplate.material = brandMat;

         // 20. 设备脚轮（4个万向轮）
        const wheelPositions = [
            [-width * 0.4, 0.05, -depth * 0.4], [width * 0.4, 0.05, -depth * 0.4],
            [-width * 0.4, 0.05, depth * 0.4], [width * 0.4, 0.05, depth * 0.4]
        ];
        wheelPositions.forEach(pos => {
            const wheelGeo = new THREE.CylinderGeometry(0.04, 0.04, 0.03, 16);
            const wheelMat = new THREE.MeshStandardMaterial({ 
                color: 0x2A2A2A, 
                roughness: 0.8 
            });
            const wheel = new THREE.Mesh(wheelGeo, wheelMat);
            wheel.position.set(...pos);
            wheel.rotation.z = Math.PI / 2;
            group.add(wheel);
        });

        return group;
    }

    createEquipmentLabel(object3D, text, color = '#FFFFFF') {
        if (!object3D) return;
        const bbox = new THREE.Box3().setFromObject(object3D);
        const center = new THREE.Vector3();
        bbox.getCenter(center);
        const height = bbox.max.y - bbox.min.y;
        const label = this.createSpriteLabel(text, color, 256, 64, 22);
        label.name = `label_${text}`;
        label.position.set(center.x, bbox.max.y + Math.max(0.4, height * 0.08), center.z);
        object3D.add(label);
    }

    createSpriteLabel(text, color = '#FFFFFF', width = 256, height = 64, fontPx = 20) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;

        context.font = `Bold ${fontPx}px Microsoft YaHei, Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillStyle = 'rgba(0, 0, 0, 0.78)';
        this._roundRect(context, 8, 8, width - 16, height - 16, 10);
        context.fill();

        context.strokeStyle = color;
        context.lineWidth = 2;
        this._roundRect(context, 8, 8, width - 16, height - 16, 10);
        context.stroke();

        context.fillStyle = color;
        context.fillText(String(text), width / 2, height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.96, alphaTest: 0.01 });
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(width / 64, height / 64, 1);
        return sprite;
    }

    // 参考 DesulfurizationTower.createTowerLabel 的塔式标签风格
    createTowerStyleLabel(targetGroup, labelText, position, color = '#FFFFFF') {
        if (!targetGroup) return null;
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 100;
        ctx.font = 'Bold 40px Microsoft YaHei, Arial';
        ctx.fillStyle = color;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this._roundRect(ctx, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        ctx.fill();
        // 边框
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        this._roundRect(ctx, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        ctx.stroke();
        // 文本
        ctx.fillStyle = color;
        ctx.fillText(labelText, canvas.width / 2, canvas.height / 2);
        // 贴图
        const tex = new THREE.CanvasTexture(canvas);
        tex.needsUpdate = true;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95, alphaTest: 0.01 });
        const spr = new THREE.Sprite(mat);
        spr.scale.set(15, 4, 1);
        spr.position.set(position.x, position.y, position.z);
        spr.name = `towerLabel_${labelText}`;
        targetGroup.add(spr);
        return spr;
    }

    _roundRect(ctx, x, y, w, h, r) {
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

    /**
     * 在机房内部组坐标系下，创建两点之间的直线圆柱管
     */
    createStraightPipe(start, end, radius = 0.06, color = 0x95A5B8, name = '工业管道') {
        const dir = end.clone().sub(start);
        const length = dir.length();
        if (length < 1e-6) return null;
        const mid = start.clone().add(end).multiplyScalar(0.5);
        const geom = new THREE.CylinderGeometry(radius, radius, length, 20);
        const mat = new THREE.MeshStandardMaterial({ color, metalness: 0.85, roughness: 0.25 });
        const pipe = new THREE.Mesh(geom, mat);
        pipe.name = name;
        // 使圆柱由Y轴对齐到目标方向
        const up = new THREE.Vector3(0, 1, 0);
        const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
        pipe.quaternion.copy(quat);
        pipe.position.copy(mid);
        pipe.castShadow = true;
        pipe.receiveShadow = true;
        this.interiorGroup.add(pipe);
        if (!this.components.pipes) this.components.pipes = [];
        this.components.pipes.push(pipe);
        return pipe;
    }

    showInterior() {
        // 隐藏外壳，显示（空的）内部组
        if (this.components.exteriorShell) this.components.exteriorShell.visible = false;

        if (this.interiorGroup) this.interiorGroup.visible = true;
        // 隐藏外部储罐与外部连管
        if (this.components.externalTank) this.components.externalTank.visible = false;
        // 外部连管应从内部“穿墙可见”，因此不隐藏

        // 隐藏自身的标签（由外部添加，带有 name 前缀）
        this.group.children.forEach(child => {
            if (child.name && (child.name.includes('buildingLabel_') || child.name.includes('roomLabel_'))) {
                child.visible = false;
            }
        });

        this.isInteriorView = true;
    }

    showExterior() {
        // 显示外壳，隐藏内部组
        if (this.components.exteriorShell) this.components.exteriorShell.visible = true;
        if (this.interiorGroup) this.interiorGroup.visible = false;
        // 显示外部储罐与外部连管
        if (this.components.externalTank) this.components.externalTank.visible = true;
        if (this.components.externalPipes) {
            this.components.externalPipes.forEach(p => p.visible = true);
        }

        // 重新显示标签
        this.group.children.forEach(child => {
            if (child.name && (child.name.includes('buildingLabel_') || child.name.includes('roomLabel_'))) {
                child.visible = true;
            }
        });

        this.isInteriorView = false;
    }
}

// 暴露到全局
window.AirCompressorRoom = AirCompressorRoom;


