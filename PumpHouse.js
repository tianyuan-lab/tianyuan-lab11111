/**
 * 泵房 - 浆液循环泵房建筑模型
 * 包含浆液循环泵、排浆泵及相关管道系统
 */
class PumpHouse {
    constructor(config = {}) {
        this.config = {
            name: config.name || '浆液循环泵房',
            position: config.position || { x: 0, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            scale: config.scale || 1.0,
            
            // 建筑尺寸配置
            buildingWidth: config.buildingWidth || 16,
            buildingHeight: config.buildingHeight || 8,
            buildingDepth: config.buildingDepth || 12,
            wallThickness: config.wallThickness || 0.3,
            
            // 泵配置
            circulationPumpCount: config.circulationPumpCount || 3,
            drainagePumpCount: config.drainagePumpCount || 2,
            
            ...config
        };

        this.group = new THREE.Group();
        this.group.name = this.config.name;
        
        // 内部设备组（可控制可见性）
        this.interiorGroup = new THREE.Group();
        this.interiorGroup.name = 'pumpHouseInterior';
        this.interiorGroup.visible = false; // 默认不可见
        
        // 外部管道组
        this.exteriorPipesGroup = new THREE.Group();
        this.exteriorPipesGroup.name = 'exteriorPipes';
        
        // 材质定义
        this.materials = {
            // 建筑外墙 - 工业混凝土
            wall: new THREE.MeshStandardMaterial({
                color: 0xB8B8B8,
                metalness: 0.1,
                roughness: 0.8,
                envMapIntensity: 0.3
            }),
            
            // 屋顶 - 彩钢板
            roof: new THREE.MeshStandardMaterial({
                color: 0x4A5568,
                metalness: 0.7,
                roughness: 0.3,
                envMapIntensity: 1.0
            }),
            
            // 地面 - 工业地坪
            floor: new THREE.MeshStandardMaterial({
                color: 0x9CA3AF,
                metalness: 0.2,
                roughness: 0.9,
                envMapIntensity: 0.4
            }),
            
            // 门窗 - 铝合金
            doorWindow: new THREE.MeshStandardMaterial({
                color: 0x374151,
                metalness: 0.8,
                roughness: 0.2,
                envMapIntensity: 1.2
            }),
            
            // 泵体 - 铸铁
            pumpBody: new THREE.MeshStandardMaterial({
                color: 0x1F2937,
                metalness: 0.6,
                roughness: 0.4,
                envMapIntensity: 0.8
            }),
            
            // 电机 - 绿色电机外壳
            motor: new THREE.MeshStandardMaterial({
                color: 0x059669,
                metalness: 0.7,
                roughness: 0.3,
                envMapIntensity: 1.0
            }),
            
            // 管道 - 不锈钢管道
            pipe: new THREE.MeshStandardMaterial({
                color: 0x6B7280,
                metalness: 0.8,
                roughness: 0.2,
                envMapIntensity: 1.2
            }),
            
            // 浆液管道 - 特殊耐腐蚀管道
            slurryPipe: new THREE.MeshStandardMaterial({
                color: 0x7C3AED,
                metalness: 0.6,
                roughness: 0.4,
                envMapIntensity: 1.0
            }),
            
            // 法兰 - 钢制法兰
            flange: new THREE.MeshStandardMaterial({
                color: 0x4B5563,
                metalness: 0.7,
                roughness: 0.5,
                envMapIntensity: 0.9
            }),
            
            // 基础 - 混凝土基础
            foundation: new THREE.MeshStandardMaterial({
                color: 0x9CA3AF,
                metalness: 0.1,
                roughness: 0.9,
                envMapIntensity: 0.3
            }),

            // 除盐水箱材料
            tankShell: new THREE.MeshStandardMaterial({
                color: 0xBFC5C9,
                metalness: 0.85,
                roughness: 0.35
            }),
            tankTop: new THREE.MeshStandardMaterial({
                color: 0xAEB4B8,
                metalness: 0.85,
                roughness: 0.4
            }),
            handrail: new THREE.MeshStandardMaterial({
                color: 0xF59E0B,
                metalness: 0.6,
                roughness: 0.45
            }),
            ladder: new THREE.MeshStandardMaterial({
                color: 0x6B7280,
                metalness: 0.7,
                roughness: 0.35
            }),
            pipeBare: new THREE.MeshStandardMaterial({
                color: 0x8E9BA6,
                metalness: 0.9,
                roughness: 0.25
            }),
            pipeInsulated: new THREE.MeshStandardMaterial({
                color: 0xD1D5DB,
                metalness: 0.1,
                roughness: 0.85
            }),
            hazard: new THREE.MeshStandardMaterial({
                color: 0xF59E0B,
                metalness: 0.4,
                roughness: 0.6
            })
        };

        // 存储泵的位置信息
        this.pumpPositions = {
            circulation: [],
            drainage: []
        };

        // 内部视图状态
        this.isInteriorView = false; // 默认外部视图

        this.initialize();
    }

    initialize() {
        try {
            // 创建建筑结构
            this.createBuildingStructure();
            
            // 创建内部设备
            this.createInteriorEquipment();
            
            // 创建外部管道连接
            this.createExteriorPipes();
            
            // 创建标签
            this.createLabel();
            
            // 创建内部设备标签（“水泵房”精简只保留除盐水箱，不创建内部设备标签）
            if (!(this.config?.name && this.config.name.includes('水泵房'))) {
                this.createInteriorLabels();
            }
            
            // 添加子组到主组
            this.group.add(this.interiorGroup);
            this.group.add(this.exteriorPipesGroup);
            
            // 应用位置、旋转和缩放
            this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
            this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);
            this.group.scale.setScalar(this.config.scale);
            
            console.log(`✅ ${this.config.name} 创建成功`);
            
        } catch (error) {
            console.error(`❌ ${this.config.name} 创建失败:`, error);
            throw error;
        }
    }

    /**
     * 创建建筑结构
     */
    createBuildingStructure() {
        const buildingGroup = new THREE.Group();
        buildingGroup.name = 'buildingStructure';
        
        const width = this.config.buildingWidth;
        const height = this.config.buildingHeight;
        const depth = this.config.buildingDepth;
        const wallThickness = this.config.wallThickness;
        
        // 地基
        const foundationGeometry = new THREE.BoxGeometry(width + 2, 0.5, depth + 2);
        const foundation = new THREE.Mesh(foundationGeometry, this.materials.foundation);
        foundation.position.set(0, 0.25, 0);
        foundation.castShadow = true;
        foundation.receiveShadow = true;
        buildingGroup.add(foundation);
        
        // 地面
        const floorGeometry = new THREE.BoxGeometry(width - wallThickness, 0.2, depth - wallThickness);
        const floor = new THREE.Mesh(floorGeometry, this.materials.floor);
        floor.position.set(0, 0.6, 0);
        floor.receiveShadow = true;
        buildingGroup.add(floor);
        
        // 墙体
        this.createWalls(buildingGroup, width, height, depth, wallThickness);
        
        // 屋顶
        this.createRoof(buildingGroup, width, height, depth);
        
        // 门窗
        this.createDoorsAndWindows(buildingGroup, width, height, depth, wallThickness);
        
        this.group.add(buildingGroup);
    }

    /**
     * 创建墙体
     */
    createWalls(parent, width, height, depth, wallThickness) {
        // 前墙
        const frontWallGeometry = new THREE.BoxGeometry(width, height, wallThickness);
        const frontWall = new THREE.Mesh(frontWallGeometry, this.materials.wall);
        frontWall.position.set(0, height / 2 + 0.5, depth / 2);
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        parent.add(frontWall);
        
        // 后墙
        const backWallGeometry = new THREE.BoxGeometry(width, height, wallThickness);
        const backWall = new THREE.Mesh(backWallGeometry, this.materials.wall);
        backWall.position.set(0, height / 2 + 0.5, -depth / 2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        parent.add(backWall);
        
        // 左墙
        const leftWallGeometry = new THREE.BoxGeometry(wallThickness, height, depth);
        const leftWall = new THREE.Mesh(leftWallGeometry, this.materials.wall);
        leftWall.position.set(-width / 2, height / 2 + 0.5, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        parent.add(leftWall);
        
        // 右墙
        const rightWallGeometry = new THREE.BoxGeometry(wallThickness, height, depth);
        const rightWall = new THREE.Mesh(rightWallGeometry, this.materials.wall);
        rightWall.position.set(width / 2, height / 2 + 0.5, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        parent.add(rightWall);
    }

    /**
     * 创建屋顶
     */
    createRoof(parent, width, height, depth) {
        // 主屋顶
        const roofGeometry = new THREE.BoxGeometry(width + 0.5, 0.3, depth + 0.5);
        const roof = new THREE.Mesh(roofGeometry, this.materials.roof);
        roof.position.set(0, height + 0.65, 0);
        roof.castShadow = true;
        roof.receiveShadow = true;
        parent.add(roof);
        
        // 屋顶边缘装饰
        const edgeHeight = 0.4;
        const edgeThickness = 0.1;
        
        // 前后边缘
        for (let side = 0; side < 2; side++) {
            const edgeGeometry = new THREE.BoxGeometry(width + 0.6, edgeHeight, edgeThickness);
            const edge = new THREE.Mesh(edgeGeometry, this.materials.roof);
            edge.position.set(0, height + 0.8 + edgeHeight / 2, (side === 0 ? 1 : -1) * (depth / 2 + 0.3));
            edge.castShadow = true;
            parent.add(edge);
        }
        
        // 左右边缘
        for (let side = 0; side < 2; side++) {
            const edgeGeometry = new THREE.BoxGeometry(edgeThickness, edgeHeight, depth + 0.6);
            const edge = new THREE.Mesh(edgeGeometry, this.materials.roof);
            edge.position.set((side === 0 ? 1 : -1) * (width / 2 + 0.3), height + 0.8 + edgeHeight / 2, 0);
            edge.castShadow = true;
            parent.add(edge);
        }
        
        // 屋顶通风口
        const ventGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.8, 12);
        const vent = new THREE.Mesh(ventGeometry, this.materials.doorWindow);
        vent.position.set(2, height + 1.2, 2);
        vent.castShadow = true;
        parent.add(vent);
    }

    /**
     * 创建门窗
     */
    createDoorsAndWindows(parent, width, height, depth, wallThickness) {
        // 主入口门
        const doorGeometry = new THREE.BoxGeometry(2.5, 3.5, wallThickness + 0.1);
        const door = new THREE.Mesh(doorGeometry, this.materials.doorWindow);
        door.position.set(-width / 4, 2.25, depth / 2 + wallThickness / 2);
        door.castShadow = true;
        parent.add(door);
        
        // 门把手
        const handleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8);
        const handle = new THREE.Mesh(handleGeometry, this.materials.doorWindow);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(-width / 4 + 0.8, 2.25, depth / 2 + wallThickness + 0.1);
        parent.add(handle);
        
        // 侧窗
        const windowGeometry = new THREE.BoxGeometry(3, 2, wallThickness + 0.05);
        const window1 = new THREE.Mesh(windowGeometry, this.materials.doorWindow);
        window1.position.set(width / 2 + wallThickness / 2, height / 2 + 1, 2);
        window1.castShadow = true;
        parent.add(window1);
        
        const window2 = new THREE.Mesh(windowGeometry, this.materials.doorWindow);
        window2.position.set(width / 2 + wallThickness / 2, height / 2 + 1, -2);
        window2.castShadow = true;
        parent.add(window2);
        
        // 窗框
        for (let i = 0; i < 2; i++) {
            const frameGeometry = new THREE.BoxGeometry(3.2, 2.2, 0.1);
            const frame = new THREE.Mesh(frameGeometry, this.materials.wall);
            frame.position.set(width / 2 + wallThickness / 2 + 0.05, height / 2 + 1, (i === 0 ? 2 : -2));
            parent.add(frame);
        }
    }

    /**
     * 创建内部设备
     */
    createInteriorEquipment() {
        // 若为“水泵房”，仅创建除盐水箱，其他内部模型全部省略
        if (this.config?.name && this.config.name.includes('水泵房')) {
            // 目标：水箱高度与水泵房等高，半径按高度同比例增大，并确保不碰墙
            const targetHeight = this.config.buildingHeight; // 与泵房等高
            const baseHeight = 6.0;       // 之前水箱高度
            const baseDiameter = 3.2;     // 之前水箱直径
            const scale = targetHeight / baseHeight;

            // 按比例放大直径
            const proposedRadius = (baseDiameter / 2) * scale; // 1.6 * scale
            // 计算室内可用半径，给出安全边距
            const margin = 1.0;
            const maxRadiusByWidth = this.config.buildingWidth / 2 - margin;
            const maxRadiusByDepth = this.config.buildingDepth / 2 - margin;
            const safeRadius = Math.max(0.8, Math.min(maxRadiusByWidth, maxRadiusByDepth));
            const finalRadius = Math.min(proposedRadius, safeRadius);
            const finalDiameter = finalRadius * 2;

            // 放在靠一侧，留出中部通道。保证不越界
            const maxX = this.config.buildingWidth / 2 - finalRadius - margin;
            const maxZ = this.config.buildingDepth / 2 - finalRadius - margin;
            const pos = {
                x: Math.min(5, maxX),
                y: 0,
                z: Math.max(-2, -maxZ)
            };

            this.createDemineralizedWaterTank({
                position: pos,
                height: targetHeight,
                diameter: finalDiameter
            });
            return;
        }

        // 其它泵房按原有完整内部设备创建
        this.createCirculationPumps();
        this.createDrainagePumps();
        this.createInteriorPipes();
        this.createAuxiliaryEquipment();
    }

    /**
     * 创建浆液循环泵
     */
    createCirculationPumps() {
        const pumpGroup = new THREE.Group();
        pumpGroup.name = 'circulationPumps';
        
        for (let i = 0; i < this.config.circulationPumpCount; i++) {
            const pumpPosition = {
                x: -6 + i * 4, // 横向排列，间距4米
                y: 1.5,
                z: 0 // 居中位置
            };
            
            const pump = this.createCirculationPump(i + 1, pumpPosition);
            pumpGroup.add(pump);
            
            // 存储泵位置信息（竖直泵布局，逆时针旋转90度后）
            this.pumpPositions.circulation.push({
                id: i + 1,
                position: pumpPosition,
                inletPosition: { x: pumpPosition.x, y: pumpPosition.y - 1.4, z: pumpPosition.z - 1.5 }, // 旋转后进水口位置
                outletPosition: { x: pumpPosition.x, y: pumpPosition.y + 1.4, z: pumpPosition.z + 3.7 } // 旋转后出水口位置
            });
        }
        
        this.interiorGroup.add(pumpGroup);
    }

    /**
     * 创建排浆泵 - 重新设计，避免与循环泵重叠
     */
    createDrainagePumps() {
        const pumpGroup = new THREE.Group();
        pumpGroup.name = 'drainagePumps';
        
        for (let i = 0; i < this.config.drainagePumpCount; i++) {
            const pumpPosition = {
                x: -3 + i * 6, // 横向排列，位置错开避免与循环泵重叠
                y: 1.5,
                z: 3.5 // 向后偏移，避免与循环泵重叠
            };
            
            const pump = this.createDrainagePump(i + 1, pumpPosition);
            pumpGroup.add(pump);
            
            // 存储泵位置信息 - 排浆泵的进出口设计
            this.pumpPositions.drainage.push({
                id: i + 1,
                position: pumpPosition,
                inletPosition: { x: pumpPosition.x - 2.3, y: pumpPosition.y - 0.1, z: pumpPosition.z }, // 浆液入口（对应实际进浆管道位置）
                outletPosition: { x: pumpPosition.x + 2.2, y: pumpPosition.y - 0.1, z: pumpPosition.z } // 排浆口（对应实际排浆管道位置）
            });
        }
        
        this.interiorGroup.add(pumpGroup);
    }

    /**
     * 创建工业级浆液循环泵 - 精细化建模
     */
    createCirculationPump(id, position) {
        const pumpGroup = new THREE.Group();
        pumpGroup.name = `circulationPump_${id}`;
        
        // 混凝土基础平台（更大更稳固）
        const baseGeometry = new THREE.BoxGeometry(4.5, 0.4, 3);
        const base = new THREE.Mesh(baseGeometry, this.materials.foundation);
        base.position.set(0, -0.7, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        pumpGroup.add(base);
        
        // 基础边沿加固
        const baseEdgeGeometry = new THREE.BoxGeometry(4.6, 0.1, 3.1);
        const baseEdge = new THREE.Mesh(baseEdgeGeometry, new THREE.MeshStandardMaterial({
            color: 0x8D8D8D,
            metalness: 0.2,
            roughness: 0.7
        }));
        baseEdge.position.set(0, -0.45, 0);
        baseEdge.castShadow = true;
        pumpGroup.add(baseEdge);
        
        // 主泵体外壳 - 改进的绿色设计
        const pumpCasingGeometry = new THREE.BoxGeometry(3.2, 2, 2);
        const pumpCasing = new THREE.Mesh(pumpCasingGeometry, new THREE.MeshStandardMaterial({
            color: 0x16A34A, // 深绿色
            metalness: 0.8,
            roughness: 0.2,
            envMapIntensity: 1.0
        }));
        pumpCasing.position.set(-0.4, 0, 0);
        pumpCasing.castShadow = true;
        pumpGroup.add(pumpCasing);
        
        // 泵体圆角边缘
        for (let i = 0; i < 4; i++) {
            const cornerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
            const corner = new THREE.Mesh(cornerGeometry, new THREE.MeshStandardMaterial({
                color: 0x15803D,
                metalness: 0.9,
                roughness: 0.1
            }));
            const angle = (i * Math.PI) / 2;
            corner.position.set(-0.4 + Math.cos(angle) * 1.5, 0, Math.sin(angle) * 0.9);
            corner.castShadow = true;
            pumpGroup.add(corner);
        }
        
        // 泵体顶部访问盖板
        const topCoverGeometry = new THREE.BoxGeometry(3.3, 0.2, 2.1);
        const topCover = new THREE.Mesh(topCoverGeometry, new THREE.MeshStandardMaterial({
            color: 0x059669,
            metalness: 0.9,
            roughness: 0.1
        }));
        topCover.position.set(-0.4, 1.1, 0);
        topCover.castShadow = true;
        pumpGroup.add(topCover);
        
        // 顶盖螺栓
        for (let i = 0; i < 12; i++) {
            const boltGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 6);
            const bolt = new THREE.Mesh(boltGeometry, this.materials.bolt);
            const angle = (i * 2 * Math.PI) / 12;
            bolt.position.set(-0.4 + Math.cos(angle) * 1.4, 1.18, Math.sin(angle) * 0.8);
            bolt.castShadow = true;
            pumpGroup.add(bolt);
        }
        
        // 进水蜗壳（精细化设计）
        const voluteGeometry = new THREE.CylinderGeometry(1.1, 1.1, 0.6, 20);
        const volute = new THREE.Mesh(voluteGeometry, new THREE.MeshStandardMaterial({
            color: 0x1F2937,
            metalness: 0.8,
            roughness: 0.3
        }));
        volute.position.set(0, -1.1, 0);
        volute.castShadow = true;
        pumpGroup.add(volute);
        
        // 蜗壳加强筋
        for (let i = 0; i < 8; i++) {
            const ribGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.2);
            const rib = new THREE.Mesh(ribGeometry, new THREE.MeshStandardMaterial({
                color: 0x374151,
                metalness: 0.9,
                roughness: 0.2
            }));
            const angle = (i * 2 * Math.PI) / 8;
            rib.position.set(Math.cos(angle) * 1.0, -1.1, Math.sin(angle) * 1.0);
            rib.rotation.y = angle;
            rib.castShadow = true;
            pumpGroup.add(rib);
        }
        
        // 进水法兰（精细化）
        const inletFlangeGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.15, 20);
        const inletFlange = new THREE.Mesh(inletFlangeGeometry, this.materials.flange);
        inletFlange.position.set(0, -1.5, 0);
        inletFlange.castShadow = true;
        pumpGroup.add(inletFlange);
        
        // 法兰螺栓孔
        for (let i = 0; i < 8; i++) {
            const boltHoleGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.2, 8);
            const boltHole = new THREE.Mesh(boltHoleGeometry, new THREE.MeshStandardMaterial({
                color: 0x111827,
                metalness: 0.9,
                roughness: 0.1
            }));
            const angle = (i * 2 * Math.PI) / 8;
            boltHole.position.set(Math.cos(angle) * 1.0, -1.5, Math.sin(angle) * 1.0);
            boltHole.castShadow = true;
            pumpGroup.add(boltHole);
        }
        
        // 进水管道（加强版）
        const inletPipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 2.5, 16);
        const inletPipe = new THREE.Mesh(inletPipeGeometry, this.materials.slurryPipe);
        inletPipe.rotation.z = Math.PI / 2;
        inletPipe.position.set(-1.75, -1.5, 0);
        inletPipe.castShadow = true;
        pumpGroup.add(inletPipe);
        
        // 出水接口（从泵体侧面水平引出）
        const outletNozzleGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.6, 12);
        const outletNozzle = new THREE.Mesh(outletNozzleGeometry, this.materials.slurryPipe);
        outletNozzle.rotation.z = Math.PI / 2;
        outletNozzle.position.set(1.8, -0.1, 0);
        outletNozzle.castShadow = true;
        pumpGroup.add(outletNozzle);
        
        // 出水管道（水平段）
        const outletPipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 12);
        const outletPipe = new THREE.Mesh(outletPipeGeometry, this.materials.slurryPipe);
        outletPipe.rotation.z = Math.PI / 2;
        outletPipe.position.set(3, -0.1, 0);
        outletPipe.castShadow = true;
        pumpGroup.add(outletPipe);
        
        // 出水弯头（向上转）
        const elbowGeometry = new THREE.TorusGeometry(0.4, 0.3, 8, 16, Math.PI / 2);
        const elbow = new THREE.Mesh(elbowGeometry, this.materials.slurryPipe);
        elbow.rotation.z = -Math.PI / 2;
        elbow.position.set(3.7, -0.1, 0);
        elbow.castShadow = true;
        pumpGroup.add(elbow);
        
        // 出水立管（向上）
        const outletRiserGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 12);
        const outletRiser = new THREE.Mesh(outletRiserGeometry, this.materials.slurryPipe);
        outletRiser.position.set(3.7, 1.4, 0);
        outletRiser.castShadow = true;
        pumpGroup.add(outletRiser);
        
        // 驱动电机（精细化蓝色电机）
        const motorGeometry = new THREE.CylinderGeometry(0.75, 0.75, 2.4, 20);
        const motor = new THREE.Mesh(motorGeometry, new THREE.MeshStandardMaterial({
            color: 0x1E40AF, // 蓝色电机
            metalness: 0.8,
            roughness: 0.2,
            envMapIntensity: 1.0
        }));
        motor.position.set(0, 2.6, 0);
        motor.castShadow = true;
        pumpGroup.add(motor);
        
        // 电机冷却散热片
        for (let i = 0; i < 12; i++) {
            const finGeometry = new THREE.BoxGeometry(1.2, 0.08, 0.15);
            const fin = new THREE.Mesh(finGeometry, new THREE.MeshStandardMaterial({
                color: 0x1E3A8A,
                metalness: 0.9,
                roughness: 0.1
            }));
            fin.position.set(0, 2.6 + (i - 6) * 0.18, 0.8);
            fin.castShadow = true;
            pumpGroup.add(fin);
        }
        
        // 电机铭牌
        const nameplateGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.02);
        const nameplate = new THREE.Mesh(nameplateGeometry, new THREE.MeshStandardMaterial({
            color: 0xFEF3C7,
            metalness: 0.1,
            roughness: 0.8
        }));
        nameplate.position.set(0, 2.6, 0.78);
        nameplate.castShadow = true;
        pumpGroup.add(nameplate);
        
        // 电机端盖（顶部和底部）
        const motorTopCapGeometry = new THREE.CylinderGeometry(0.85, 0.85, 0.2, 20);
        const motorTopCap = new THREE.Mesh(motorTopCapGeometry, this.materials.flange);
        motorTopCap.position.set(0, 3.9, 0);
        motorTopCap.castShadow = true;
        pumpGroup.add(motorTopCap);
        
        const motorBottomCapGeometry = new THREE.CylinderGeometry(0.85, 0.85, 0.2, 20);
        const motorBottomCap = new THREE.Mesh(motorBottomCapGeometry, this.materials.flange);
        motorBottomCap.position.set(0, 1.3, 0);
        motorBottomCap.castShadow = true;
        pumpGroup.add(motorBottomCap);
        
        // 精密联轴器
        const couplingGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.6, 16);
        const coupling = new THREE.Mesh(couplingGeometry, new THREE.MeshStandardMaterial({
            color: 0x6B7280,
            metalness: 0.9,
            roughness: 0.1
        }));
        coupling.position.set(0, 1.15, 0);
        coupling.castShadow = true;
        pumpGroup.add(coupling);
        
        // 联轴器保护罩
        const couplingGuardGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 12, 1, true);
        const couplingGuard = new THREE.Mesh(couplingGuardGeometry, new THREE.MeshStandardMaterial({
            color: 0xFB923C,
            metalness: 0.3,
            roughness: 0.7,
            transparent: true,
            opacity: 0.8
        }));
        couplingGuard.position.set(0, 1.15, 0);
        couplingGuard.castShadow = true;
        pumpGroup.add(couplingGuard);
        
        // 振动传感器
        const sensorGeometry = new THREE.BoxGeometry(0.15, 0.15, 0.1);
        const sensor = new THREE.Mesh(sensorGeometry, new THREE.MeshStandardMaterial({
            color: 0x7C2D12,
            metalness: 0.8,
            roughness: 0.3
        }));
        sensor.position.set(0.9, 0.5, 0.7);
        sensor.castShadow = true;
        pumpGroup.add(sensor);
        
        // 温度传感器
        const tempSensorGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.3, 8);
        const tempSensor = new THREE.Mesh(tempSensorGeometry, new THREE.MeshStandardMaterial({
            color: 0x059669,
            metalness: 0.8,
            roughness: 0.2
        }));
        tempSensor.position.set(-0.8, 0.3, 0.6);
        tempSensor.rotation.z = Math.PI / 4;
        tempSensor.castShadow = true;
        pumpGroup.add(tempSensor);
        
        // 压力表
        const pressureGaugeGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        const pressureGauge = new THREE.Mesh(pressureGaugeGeometry, new THREE.MeshStandardMaterial({
            color: 0x1F2937,
            metalness: 0.9,
            roughness: 0.1
        }));
        pressureGauge.position.set(1.2, 0.8, 0);
        pressureGauge.rotation.z = Math.PI / 2;
        pressureGauge.castShadow = true;
        pumpGroup.add(pressureGauge);
        
        // 控制电缆管道
        const cableConduitGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
        const cableConduit = new THREE.Mesh(cableConduitGeometry, new THREE.MeshStandardMaterial({
            color: 0x4B5563,
            metalness: 0.7,
            roughness: 0.4
        }));
        cableConduit.position.set(-0.6, 3.2, 0);
        cableConduit.castShadow = true;
        pumpGroup.add(cableConduit);
        
        // 控制柜（侧面）
        const controlBoxGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
        const controlBox = new THREE.Mesh(controlBoxGeometry, this.materials.doorWindow);
        controlBox.position.set(-0.5, 0.1, 1.5);
        controlBox.castShadow = true;
        pumpGroup.add(controlBox);
        
        // 仪表显示屏
        const displayGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.03);
        const display = new THREE.Mesh(displayGeometry, this.materials.display);
        display.position.set(-0.5, 0.4, 1.72);
        pumpGroup.add(display);
        
        // 警示标识牌
        const warningGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.02);
        const warningMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF6B00, // 橙色警示
            metalness: 0.1,
            roughness: 0.8
        });
        const warning = new THREE.Mesh(warningGeometry, warningMaterial);
        warning.position.set(-0.5, -0.6, 1.02);
        pumpGroup.add(warning);
        
        // 支撑腿已移除 - 简化内部视角
        
        // 设置位置和旋转（逆时针旋转90度）
        pumpGroup.position.set(position.x, position.y, position.z);
        pumpGroup.rotation.y = Math.PI / 2; // 逆时针旋转90度
        return pumpGroup;
    }

    /**
     * 创建精细化排浆泵 - 专业废浆处理设备
     */
    createDrainagePump(id, position) {
        const pumpGroup = new THREE.Group();
        pumpGroup.name = `drainagePump_${id}`;
        
        // 加强型混凝土基础平台
        const baseGeometry = new THREE.BoxGeometry(3.5, 0.4, 2.5);
        const base = new THREE.Mesh(baseGeometry, this.materials.foundation);
        base.position.set(0, -0.65, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        pumpGroup.add(base);
        
        // 基础钢筋网格纹理
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 2; j++) {
                const rebarGeometry = new THREE.CylinderGeometry(0.02, 0.02, 2.4, 6);
                const rebar = new THREE.Mesh(rebarGeometry, new THREE.MeshStandardMaterial({
                    color: 0x8B5A2B,
                    metalness: 0.9,
                    roughness: 0.2
                }));
                rebar.position.set(-1.2 + i * 1.2, -0.45, -0.8 + j * 1.6);
                rebar.rotation.z = Math.PI / 2;
                pumpGroup.add(rebar);
            }
        }
        
        // 主泵体（现代化橙色设计）
        const pumpCasingGeometry = new THREE.BoxGeometry(2.8, 1.6, 1.8);
        const pumpCasing = new THREE.Mesh(pumpCasingGeometry, new THREE.MeshStandardMaterial({
            color: 0xEA580C, // 橙色，表示排浆泵
            metalness: 0.8,
            roughness: 0.2,
            envMapIntensity: 1.0
        }));
        pumpCasing.position.set(0, 0, 0);
        pumpCasing.castShadow = true;
        pumpGroup.add(pumpCasing);
        
        // 泵体加强筋
        for (let i = 0; i < 4; i++) {
            const ribGeometry = new THREE.BoxGeometry(0.15, 1.8, 0.1);
            const rib = new THREE.Mesh(ribGeometry, new THREE.MeshStandardMaterial({
                color: 0xC2410C,
                metalness: 0.9,
                roughness: 0.1
            }));
            rib.position.set(-1.2 + i * 0.8, 0, 0.95);
            rib.castShadow = true;
            pumpGroup.add(rib);
        }
        
        // 维修访问窗口
        const accessWindowGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.05);
        const accessWindow = new THREE.Mesh(accessWindowGeometry, new THREE.MeshStandardMaterial({
            color: 0x1F2937,
            metalness: 0.7,
            roughness: 0.3,
            transparent: true,
            opacity: 0.8
        }));
        accessWindow.position.set(0, 0.3, 0.92);
        accessWindow.castShadow = true;
        pumpGroup.add(accessWindow);
        
        // 精密进浆法兰（左侧）
        const inletFlangeGeometry = new THREE.CylinderGeometry(0.45, 0.45, 0.2, 20);
        const inletFlange = new THREE.Mesh(inletFlangeGeometry, this.materials.flange);
        inletFlange.position.set(-1.6, 0, 0);
        inletFlange.rotation.z = Math.PI / 2;
        inletFlange.castShadow = true;
        pumpGroup.add(inletFlange);
        
        // 法兰密封圈
        const sealGeometry = new THREE.TorusGeometry(0.38, 0.03, 8, 16);
        const seal = new THREE.Mesh(sealGeometry, new THREE.MeshStandardMaterial({
            color: 0x1F2937,
            metalness: 0.1,
            roughness: 0.9
        }));
        seal.position.set(-1.7, 0, 0);
        seal.rotation.y = Math.PI / 2;
        pumpGroup.add(seal);
        
        // 进浆管道（加强版）
        const inletPipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.4, 16);
        const inletPipe = new THREE.Mesh(inletPipeGeometry, this.materials.slurryPipe);
        inletPipe.position.set(-2.5, 0, 0);
        inletPipe.rotation.z = Math.PI / 2;
        inletPipe.castShadow = true;
        pumpGroup.add(inletPipe);
        
        // 进浆管道保温层
        const insulationGeometry = new THREE.CylinderGeometry(0.45, 0.45, 1.2, 12);
        const insulation = new THREE.Mesh(insulationGeometry, new THREE.MeshStandardMaterial({
            color: 0x6B7280,
            metalness: 0.1,
            roughness: 0.9
        }));
        insulation.position.set(-2.4, 0, 0);
        insulation.rotation.z = Math.PI / 2;
        pumpGroup.add(insulation);
        
        // 排浆法兰（右侧，精细化）
        const outletFlangeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 20);
        const outletFlange = new THREE.Mesh(outletFlangeGeometry, this.materials.flange);
        outletFlange.position.set(1.6, 0, 0);
        outletFlange.rotation.z = Math.PI / 2;
        outletFlange.castShadow = true;
        pumpGroup.add(outletFlange);
        
        // 排浆管道（耐腐蚀红色）
        const outletPipeGeometry = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16);
        const outletPipe = new THREE.Mesh(outletPipeGeometry, new THREE.MeshStandardMaterial({
            color: 0x991B1B, // 深红色，表示废浆管道
            metalness: 0.8,
            roughness: 0.2
        }));
        outletPipe.position.set(2.4, 0, 0);
        outletPipe.rotation.z = Math.PI / 2;
        outletPipe.castShadow = true;
        pumpGroup.add(outletPipe);
        
        // 高效驱动电机（红色系）
        const motorGeometry = new THREE.CylinderGeometry(0.5, 0.5, 1.6, 20);
        const motor = new THREE.Mesh(motorGeometry, new THREE.MeshStandardMaterial({
            color: 0xDC2626, // 红色电机
            metalness: 0.8,
            roughness: 0.2,
            envMapIntensity: 1.0
        }));
        motor.position.set(0, 1.5, 0);
        motor.castShadow = true;
        pumpGroup.add(motor);
        
        // 电机散热风扇罩
        const fanCoverGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 12, 1, true);
        const fanCover = new THREE.Mesh(fanCoverGeometry, new THREE.MeshStandardMaterial({
            color: 0x374151,
            metalness: 0.8,
            roughness: 0.3
        }));
        fanCover.position.set(0, 2.3, 0);
        fanCover.castShadow = true;
        pumpGroup.add(fanCover);
        
        // 风扇叶片
        for (let i = 0; i < 6; i++) {
            const bladeGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.08);
            const blade = new THREE.Mesh(bladeGeometry, new THREE.MeshStandardMaterial({
                color: 0x1F2937,
                metalness: 0.9,
                roughness: 0.1
            }));
            const angle = (i * 2 * Math.PI) / 6;
            blade.position.set(Math.cos(angle) * 0.2, 2.3, Math.sin(angle) * 0.2);
            blade.rotation.y = angle + Math.PI / 2;
            pumpGroup.add(blade);
        }
        
        // 电机冷却散热片（更精细）
        for (let i = 0; i < 10; i++) {
            const finGeometry = new THREE.BoxGeometry(0.9, 0.06, 0.12);
            const fin = new THREE.Mesh(finGeometry, new THREE.MeshStandardMaterial({
                color: 0xB91C1C,
                metalness: 0.9,
                roughness: 0.1
            }));
            fin.position.set(0, 1.5 + (i - 5) * 0.14, 0.52);
            fin.castShadow = true;
            pumpGroup.add(fin);
        }
        
        // 防爆电机接线盒
        const junctionBoxGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.2);
        const junctionBox = new THREE.Mesh(junctionBoxGeometry, new THREE.MeshStandardMaterial({
            color: 0x1F2937,
            metalness: 0.8,
            roughness: 0.3
        }));
        junctionBox.position.set(0.3, 1.8, 0.4);
        junctionBox.castShadow = true;
        pumpGroup.add(junctionBox);
        
        // 精密联轴器
        const couplingGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.5, 16);
        const coupling = new THREE.Mesh(couplingGeometry, new THREE.MeshStandardMaterial({
            color: 0x6B7280,
            metalness: 0.9,
            roughness: 0.1
        }));
        coupling.position.set(0, 0.85, 0);
        coupling.castShadow = true;
        pumpGroup.add(coupling);
        
        // 联轴器保护罩
        const guardGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.7, 8, 1, true);
        const guard = new THREE.Mesh(guardGeometry, new THREE.MeshStandardMaterial({
            color: 0xFB923C,
            metalness: 0.3,
            roughness: 0.7,
            transparent: true,
            opacity: 0.7
        }));
        guard.position.set(0, 0.85, 0);
        guard.castShadow = true;
        pumpGroup.add(guard);
        
        // 智能控制阀门（带电动执行器）
        const valveBodyGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.4, 12);
        const valveBody = new THREE.Mesh(valveBodyGeometry, new THREE.MeshStandardMaterial({
            color: 0x059669,
            metalness: 0.8,
            roughness: 0.3
        }));
        valveBody.position.set(-1.9, 0.5, 0);
        valveBody.rotation.z = Math.PI / 2;
        valveBody.castShadow = true;
        pumpGroup.add(valveBody);
        
        // 电动执行器
        const actuatorGeometry = new THREE.BoxGeometry(0.25, 0.25, 0.3);
        const actuator = new THREE.Mesh(actuatorGeometry, new THREE.MeshStandardMaterial({
            color: 0x1E40AF,
            metalness: 0.8,
            roughness: 0.2
        }));
        actuator.position.set(-1.9, 0.8, 0);
        actuator.castShadow = true;
        pumpGroup.add(actuator);
        
        // 流量计
        const flowMeterGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
        const flowMeter = new THREE.Mesh(flowMeterGeometry, new THREE.MeshStandardMaterial({
            color: 0x7C2D12,
            metalness: 0.8,
            roughness: 0.3
        }));
        flowMeter.position.set(-2.8, 0.3, 0);
        flowMeter.rotation.z = Math.PI / 2;
        flowMeter.castShadow = true;
        pumpGroup.add(flowMeter);
        
        // 排浆泵标识牌（精美设计）
        const labelGeometry = new THREE.BoxGeometry(1.0, 0.4, 0.05);
        const label = new THREE.Mesh(labelGeometry, new THREE.MeshStandardMaterial({
            color: 0xFEF3C7,
            metalness: 0.1,
            roughness: 0.8
        }));
        label.position.set(0, 0.9, 0.95);
        label.castShadow = true;
        pumpGroup.add(label);
        
        // 标识牌边框
        const labelFrameGeometry = new THREE.BoxGeometry(1.05, 0.45, 0.02);
        const labelFrame = new THREE.Mesh(labelFrameGeometry, new THREE.MeshStandardMaterial({
            color: 0x374151,
            metalness: 0.9,
            roughness: 0.2
        }));
        labelFrame.position.set(0, 0.9, 0.97);
        labelFrame.castShadow = true;
        pumpGroup.add(labelFrame);
        
        pumpGroup.position.set(position.x, position.y, position.z);
        return pumpGroup;
    }

    /**
     * 创建单个泵（旧版本，保留兼容性）
     */
    createPump(type, id, position) {
        const pumpGroup = new THREE.Group();
        pumpGroup.name = `${type}Pump_${id}`;
        
        // 泵基础已移除 - 简化内部视角
        
        // 泵体
        const pumpBodyGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16);
        const pumpBody = new THREE.Mesh(pumpBodyGeometry, this.materials.pumpBody);
        pumpBody.position.set(0, -0.3, 0);
        pumpBody.castShadow = true;
        pumpGroup.add(pumpBody);
        
        // 电机
        const motorGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.8, 16);
        const motor = new THREE.Mesh(motorGeometry, this.materials.motor);
        motor.position.set(0, 0.6, 0);
        motor.castShadow = true;
        pumpGroup.add(motor);
        
        // 进口法兰
        const inletFlangeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 16);
        const inletFlange = new THREE.Mesh(inletFlangeGeometry, this.materials.flange);
        inletFlange.rotation.z = Math.PI / 2;
        inletFlange.position.set(-1, -0.3, 0);
        inletFlange.castShadow = true;
        pumpGroup.add(inletFlange);
        
        // 出口法兰
        const outletFlangeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
        const outletFlange = new THREE.Mesh(outletFlangeGeometry, this.materials.flange);
        outletFlange.rotation.z = Math.PI / 2;
        outletFlange.position.set(1, -0.3, 0);
        outletFlange.castShadow = true;
        pumpGroup.add(outletFlange);
        
        // 冷却风扇罩
        const fanCoverGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 12);
        const fanCover = new THREE.Mesh(fanCoverGeometry, this.materials.doorWindow);
        fanCover.position.set(0, 1.4, 0);
        pumpGroup.add(fanCover);
        
        // 控制箱
        const controlBoxGeometry = new THREE.BoxGeometry(0.4, 0.6, 0.3);
        const controlBox = new THREE.Mesh(controlBoxGeometry, this.materials.doorWindow);
        controlBox.position.set(1.2, 0.3, 0.5);
        controlBox.castShadow = true;
        pumpGroup.add(controlBox);
        
        // 铭牌
        const nameplateGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.02);
        const nameplate = new THREE.Mesh(nameplateGeometry, this.materials.doorWindow);
        nameplate.position.set(0.8, 0, 0);
        pumpGroup.add(nameplate);
        
        pumpGroup.position.set(position.x, position.y, position.z);
        return pumpGroup;
    }

    /**
     * 创建内部管道系统 - 适应横向排列
     */
    createInteriorPipes() {
        const pipeGroup = new THREE.Group();
        pipeGroup.name = 'interiorPipes';
        
        // 进水主管 - 横向穿过整个泵房
        const inletMainGeometry = new THREE.CylinderGeometry(0.4, 0.4, 16, 16);
        const inletMain = new THREE.Mesh(inletMainGeometry, this.materials.slurryPipe);
        inletMain.rotation.z = Math.PI / 2;
        inletMain.position.set(0, 0.8, -2); // 低位进水主管
        inletMain.castShadow = true;
        pipeGroup.add(inletMain);
        
        // 出水主管 - 高位收集所有泵的出口 - 已移除
        /*const outletMainGeometry = new THREE.CylinderGeometry(0.35, 0.35, 16, 16);
        const outletMain = new THREE.Mesh(outletMainGeometry, this.materials.slurryPipe);
        outletMain.rotation.z = Math.PI / 2;
        outletMain.position.set(0, 4.5, 2); // 高位出水主管
        outletMain.castShadow = true;
        pipeGroup.add(outletMain);*/
        
        // 循环泵进水支管（3台循环泵）
        for (let i = 0; i < 3; i++) {
            const x = -6 + i * 4;
            
            // 进水支管（从主管到各循环泵）
            const inletBranchGeometry = new THREE.CylinderGeometry(0.2, 0.2, 2.5, 12);
            const inletBranch = new THREE.Mesh(inletBranchGeometry, this.materials.slurryPipe);
            inletBranch.position.set(x, 1.8, -1);
            inletBranch.castShadow = true;
            pipeGroup.add(inletBranch);
        }
        
        // 排浆泵进浆支管（2台排浆泵）- 不同位置和颜色
        for (let i = 0; i < 2; i++) {
            const x = -3 + i * 6; // 对应排浆泵位置
            
            // 排浆泵进浆支管（红色，表示废浆处理）
            const drainageInletGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2.0, 12);
            const drainageInlet = new THREE.Mesh(drainageInletGeometry, new THREE.MeshStandardMaterial({
                color: 0x991B1B, // 深红色，表示废浆管道
                metalness: 0.7,
                roughness: 0.3
            }));
            drainageInlet.position.set(x, 1.5, 1.5); // 不同z位置避免重叠
            drainageInlet.castShadow = true;
            pipeGroup.add(drainageInlet);
            
            // 出水支管（从各泵到主管） - 已移除（主管已删除）
            /*if (i < 3) { // 只有循环泵有出水支管
                const outletBranchGeometry = new THREE.CylinderGeometry(0.18, 0.18, 2, 12);
                const outletBranch = new THREE.Mesh(outletBranchGeometry, this.materials.slurryPipe);
                outletBranch.position.set(x, 3.5, 1.5);
                outletBranch.castShadow = true;
                pipeGroup.add(outletBranch);
            }*/
        }
        
        // 管道支架已移除 - 简化内部视角
        
        // 创建从进水支管到外部连接点的管道
        this.createExternalConnectionPipes(pipeGroup);
        
        this.interiorGroup.add(pipeGroup);
    }

    /**
     * 创建从进水支管到外部连接点的管道
     */
    createExternalConnectionPipes(pipeGroup) {
        console.log('创建外部连接管道...');
        
        // 为三台循环泵创建从进水支管到外部连接点的管道
        for (let i = 0; i < 3; i++) {
            const x = -6 + i * 4;
            
            // 进水支管位置（内部）
            const inletPos = { x: x, y: 1.8, z: -1 };
            // 外部连接点位置（对应main.js中的startPoint）
            const externalPos = { x: x, y: 2.5, z: -3 };
            
            // 创建连接管道组
            const connectionGroup = new THREE.Group();
            connectionGroup.name = `externalConnection${i + 1}`;
            
            // 创建连接管道
            this.createInternalToExternalPipe(connectionGroup, inletPos, externalPos, i + 1);
            
            pipeGroup.add(connectionGroup);
        }
        
        console.log('✓ 外部连接管道创建完成');
    }
    
    /**
     * 创建单个内部到外部的连接管道
     */
    createInternalToExternalPipe(parentGroup, inletPos, externalPos, pumpIndex) {
        const pipeMaterial = this.materials.slurryPipe;
        const pipeRadius = 0.15;
        
        // 第一段：从进水支管顶部向上延伸（紫色圆柱的头部）
        const segment1Height = externalPos.y - inletPos.y;
        const segment1Geometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, segment1Height, 12);
        const segment1Mesh = new THREE.Mesh(segment1Geometry, pipeMaterial);
        segment1Mesh.position.set(inletPos.x, inletPos.y + segment1Height/2, inletPos.z);
        segment1Mesh.castShadow = true;
        parentGroup.add(segment1Mesh);
        
        // 第二段：水平向外（穿过泵房墙壁到外部）
        const segment2Length = Math.abs(externalPos.z - inletPos.z);
        const segment2Geometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, segment2Length, 12);
        const segment2Mesh = new THREE.Mesh(segment2Geometry, pipeMaterial);
        segment2Mesh.position.set(externalPos.x, externalPos.y, inletPos.z + segment2Length/2);
        segment2Mesh.rotation.x = Math.PI / 2;
        segment2Mesh.castShadow = true;
        parentGroup.add(segment2Mesh);
        
        // 第三段：短连接段（连接到外部管道起点）
        const bridgeLength = 0.3; // 短连接段长度
        const bridgeGeometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, bridgeLength, 12);
        const bridgeMesh = new THREE.Mesh(bridgeGeometry, pipeMaterial);
        bridgeMesh.position.set(externalPos.x, externalPos.y, externalPos.z - bridgeLength/2);
        bridgeMesh.rotation.x = Math.PI / 2;
        bridgeMesh.castShadow = true;
        parentGroup.add(bridgeMesh);
        
        // 弯头连接1：垂直到水平
        const elbow1Geometry = new THREE.TorusGeometry(pipeRadius * 1.2, pipeRadius * 0.7, 6, 12, Math.PI / 2);
        const elbow1Mesh = new THREE.Mesh(elbow1Geometry, pipeMaterial);
        elbow1Mesh.position.set(inletPos.x, externalPos.y, inletPos.z);
        elbow1Mesh.rotation.x = Math.PI / 2;
        elbow1Mesh.castShadow = true;
        parentGroup.add(elbow1Mesh);
        
        // 弯头连接2：水平段之间的连接
        const elbow2Geometry = new THREE.TorusGeometry(pipeRadius * 1.2, pipeRadius * 0.7, 6, 12, Math.PI / 2);
        const elbow2Mesh = new THREE.Mesh(elbow2Geometry, pipeMaterial);
        elbow2Mesh.position.set(externalPos.x, externalPos.y, externalPos.z - bridgeLength);
        elbow2Mesh.rotation.y = Math.PI / 2;
        elbow2Mesh.castShadow = true;
        parentGroup.add(elbow2Mesh);
        
        // 连接法兰（在连接点）
        const flangeGeometry = new THREE.CylinderGeometry(pipeRadius * 1.5, pipeRadius * 1.5, 0.1, 16);
        const flangeMaterial = new THREE.MeshStandardMaterial({
            color: 0xB0B0B0,
            metalness: 0.9,
            roughness: 0.2
        });
        const flangeMesh = new THREE.Mesh(flangeGeometry, flangeMaterial);
        flangeMesh.position.set(externalPos.x, externalPos.y, externalPos.z);
        flangeMesh.rotation.x = Math.PI / 2;
        flangeMesh.castShadow = true;
        parentGroup.add(flangeMesh);
        
        console.log(`✓ 循环泵${pumpIndex}完整连接管道创建完成`);
    }

    /**
     * 创建辅助设备 - 适应横向布局
     */
    createAuxiliaryEquipment() {
        const auxGroup = new THREE.Group();
        auxGroup.name = 'auxiliaryEquipment';
        
        
        
        // 仪表控制柜（左侧）
       
        
        // 变频器柜（右侧）
        
        
       
        
        
        
        // 起吊设备轨道和电缆桥架已移除 - 简化内部视角
        
        this.interiorGroup.add(auxGroup);
    }

    /**
     * 创建外部管道连接
     */
    createExteriorPipes() {
        // 这个方法将在主场景中调用，用于创建到一级塔的管道连接
        // 暂时留空，由外部调用时实现
    }

    /**
     * 创建标签
     */
    createLabel() {
        const labelGroup = new THREE.Group();
        labelGroup.name = 'pumpHouseLabel';
        
        // 使用配置中的名称，如果没有则使用默认名称
        const labelText = this.config.name || '一级塔泵房';
        const labelSprite = this.createLabelSprite(labelText, '#00AAFF');
        labelSprite.position.set(0, this.config.buildingHeight + 3, 0);
        labelGroup.add(labelSprite);
        
        this.group.add(labelGroup);
    }

    /**
     * 创建除盐水箱（依据实物图片的1:1外观还原，位于水泵房内部）
     * 可通过配置调节尺寸与位置：{ position: {x,y,z}, height, diameter }
     */
    createDemineralizedWaterTank(options = {}) {
        const cfg = {
            position: options.position || { x: 6, y: 0, z: -3 },
            height: options.height || 4.0,
            diameter: options.diameter || 3.2
        };

        const tankGroup = new THREE.Group();
        tankGroup.name = 'demineralizedWaterTank';

        const floorY = 0.6;
        const shellHeight = cfg.height - 0.4;
        const shellRadius = cfg.diameter / 2;

        // 立式圆筒壳体
        const shellGeom = new THREE.CylinderGeometry(shellRadius, shellRadius, shellHeight, 48);
        const shell = new THREE.Mesh(shellGeom, this.materials.tankShell);
        shell.position.set(0, floorY + shellHeight / 2, 0);
        shell.castShadow = true; shell.receiveShadow = true;
        tankGroup.add(shell);

        // 顶盖
        const topGeom = new THREE.CylinderGeometry(shellRadius * 1.01, shellRadius * 1.01, 0.16, 48);
        const top = new THREE.Mesh(topGeom, this.materials.tankTop);
        top.position.set(0, shell.position.y + shellHeight / 2 + 0.08, 0);
        top.castShadow = true; top.receiveShadow = true;
        tankGroup.add(top);

        // 人孔盖
        const manholeGeom = new THREE.CylinderGeometry(0.45, 0.45, 0.14, 24);
        const manhole = new THREE.Mesh(manholeGeom, this.materials.tankTop);
        manhole.position.set(0.2, top.position.y + 0.17, -0.4);
        manhole.castShadow = true;
        tankGroup.add(manhole);

        // 环形平台与护栏
        const platformGeom = new THREE.TorusGeometry(shellRadius + 0.2, 0.07, 8, 48);
        const platform = new THREE.Mesh(platformGeom, this.materials.ladder);
        platform.rotation.x = Math.PI / 2;
        platform.position.set(0, top.position.y + 0.2, 0);
        tankGroup.add(platform);

        const railHeight = 1.0;
        const railGeom = new THREE.TorusGeometry(shellRadius + 0.2, 0.05, 8, 48);
        const rail1 = new THREE.Mesh(railGeom, this.materials.handrail);
        const rail2 = new THREE.Mesh(railGeom, this.materials.handrail);
        rail1.rotation.x = Math.PI / 2; rail2.rotation.x = Math.PI / 2;
        rail1.position.set(0, platform.position.y + 0.4, 0);
        rail2.position.set(0, platform.position.y + 0.8, 0);
        tankGroup.add(rail1, rail2);

        // 带护笼的直爬梯（贴近水箱侧壁）
        const ladderGroup = new THREE.Group();
        ladderGroup.name = 'ladderCage';
        const rungCount = 14;
        const rungGeom = new THREE.BoxGeometry(0.36, 0.04, 0.04);
        for (let i = 0; i < rungCount; i++) {
            const rung = new THREE.Mesh(rungGeom, this.materials.ladder);
            rung.position.set(shellRadius + 0.1, floorY + 0.5 + i * ((railHeight + shellHeight) / rungCount), 0);
            ladderGroup.add(rung);
        }
        // 侧导轨
        const sideGeom = new THREE.BoxGeometry(0.06, railHeight + shellHeight, 0.06);
        const sideL = new THREE.Mesh(sideGeom, this.materials.ladder);
        const sideR = new THREE.Mesh(sideGeom, this.materials.ladder);
        sideL.position.set(shellRadius + 0.28, floorY + (railHeight + shellHeight) / 2, 0.2);
        sideR.position.set(shellRadius + 0.28, floorY + (railHeight + shellHeight) / 2, -0.2);
        ladderGroup.add(sideL, sideR);
        // 护笼环
        for (let i = 0; i < 6; i++) {
            const hoopGeom = new THREE.TorusGeometry(0.6, 0.03, 6, 24);
            const hoop = new THREE.Mesh(hoopGeom, this.materials.ladder);
            hoop.rotation.y = Math.PI / 2;
            hoop.position.set(shellRadius + 0.28, floorY + 0.8 + i * 0.6, 0);
            ladderGroup.add(hoop);
        }
        tankGroup.add(ladderGroup);

        // 进出水管与保温（示意）
        const nozzleRad = 0.12;
        const inlet = new THREE.Mesh(new THREE.CylinderGeometry(nozzleRad, nozzleRad, 0.6, 16), this.materials.pipeBare);
        inlet.rotation.z = Math.PI / 2;
        inlet.position.set(-shellRadius - 0.3, floorY + 0.6, 0.2);
        tankGroup.add(inlet);

        const outlet = new THREE.Mesh(new THREE.CylinderGeometry(nozzleRad, nozzleRad, 0.7, 16), this.materials.pipeBare);
        outlet.rotation.z = Math.PI / 2;
        outlet.position.set(-shellRadius - 0.35, floorY + 0.25, -0.25);
        tankGroup.add(outlet);

        const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, shellHeight, 16), this.materials.pipeInsulated);
        riser.position.set(-shellRadius - 0.6, floorY + shellHeight / 2, 0);
        tankGroup.add(riser);

        // 底部防撞警示墩
        const curbGeom = new THREE.CylinderGeometry(shellRadius + 0.15, shellRadius + 0.15, 0.12, 36, 1, true);
        const curb = new THREE.Mesh(curbGeom, this.materials.hazard);
        curb.position.set(0, 0.12 / 2, 0);
        tankGroup.add(curb);

        // 主标签“除盐水箱”
        const title = this.createLabelSprite('除盐水箱', '#FF3344');
        title.scale.set(6, 2, 1);
        title.position.set(0, floorY + 1.6, shellRadius + 0.26);
        tankGroup.add(title);

        // 安全提示牌（简化）
        const notice = this.createPumpLabel('安全操作规程', '#00BFFF');
        notice.scale.set(4.5, 1.2, 1);
        notice.position.set(0.8, floorY + 1.5, shellRadius + 0.25);
        tankGroup.add(notice);

        // 应用位姿并加入内部组
        tankGroup.position.set(cfg.position.x, cfg.position.y, cfg.position.z);
        this.interiorGroup.add(tankGroup);
        console.log('除盐水箱模型创建完成');
    }

    /**
     * 创建标签精灵
     */
    createLabelSprite(text, color = '#FFFFFF') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 100;
        
        context.font = 'Bold 36px Microsoft YaHei, Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.fill();
        
        context.strokeStyle = color;
        context.lineWidth = 3;
        this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.stroke();
        
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95,
            alphaTest: 0.01
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(12, 4, 1);
        sprite.name = `label_${text}`;
        
        return sprite;
    }

    /**
     * 绘制圆角矩形
     */
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

    /**
     * 进入内部视图 - 显示内部设备
     */
    showInterior() {
        console.log('进入泵房内部视图');
        
        // 隐藏外部建筑结构（保留地基）
        this.group.children.forEach(child => {
            if (child.name === 'buildingStructure') {
                child.children.forEach(buildingPart => {
                    // 只保留地基和地面，隐藏墙体和屋顶
                    if (buildingPart.material && 
                        !buildingPart.position.y < 1) { // 地基和地面的y位置较低
                        buildingPart.visible = false;
                    }
                });
            }
        });
        
        // 显示内部设备
        this.interiorGroup.visible = true;
        
        // 更新状态
        this.isInteriorView = true;
        
        // 更新UI状态指示
        const currentViewElement = document.getElementById('current-view');
        if (currentViewElement) {
            currentViewElement.textContent = '当前视图：泵房内部';
        }
    }

    /**
     * 退出内部视图 - 显示外部建筑
     */
    showExterior() {
        console.log('退出泵房内部视图');
        
        // 显示外部建筑结构
        this.group.children.forEach(child => {
            if (child.name === 'buildingStructure') {
                child.children.forEach(buildingPart => {
                    buildingPart.visible = true;
                });
            }
        });
        
        // 隐藏内部设备
        this.interiorGroup.visible = false;
        
        // 更新状态
        this.isInteriorView = false;
        
        // 更新UI状态指示
        const currentViewElement = document.getElementById('current-view');
        if (currentViewElement) {
            currentViewElement.textContent = '当前视图：外部总览';
        }
    }

    /**
     * 切换内部/外部视图
     */
    toggleInteriorView() {
        if (this.isInteriorView) {
            this.showExterior();
        } else {
            this.showInterior();
        }
        return this.isInteriorView;
    }

    /**
     * 获取泵连接点信息
     */
    getPumpConnectionPoints() {
        return {
            circulation: this.pumpPositions.circulation,
            drainage: this.pumpPositions.drainage
        };
    }

    /**
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.config.name,
            type: '浆液循环泵房',
            position: this.config.position,
            dimensions: {
                width: this.config.buildingWidth,
                height: this.config.buildingHeight,
                depth: this.config.buildingDepth
            },
            equipment: {
                circulationPumps: this.config.circulationPumpCount,
                drainagePumps: this.config.drainagePumpCount
            },
            interiorVisible: this.isInteriorView,
            components: [
                '建筑结构',
                '浆液循环泵',
                '排浆泵',
                '管道系统',
                '电气设备'
            ]
        };
    }

    /**
     * 创建内部设备标签
     */
    createInteriorLabels() {
        const labelGroup = new THREE.Group();
        labelGroup.name = 'interiorLabels';
        
        // 为浆液循环泵添加标签
        for (let i = 0; i < this.config.circulationPumpCount; i++) {
            const pumpPos = this.pumpPositions.circulation[i].position;
            const pumpId = i + 1;
            
            const pumpLabel = this.createPumpLabel(`浆液循环泵 ${pumpId}`, '#00FF88');
            pumpLabel.position.set(
                pumpPos.x,
                pumpPos.y + 4, // 在泵上方4米处
                pumpPos.z + 2  // 向前偏移2米
            );
            labelGroup.add(pumpLabel);
        }
        
        // 为排浆泵添加标签
        for (let i = 0; i < this.config.drainagePumpCount; i++) {
            const pumpPos = this.pumpPositions.drainage[i].position;
            const pumpId = i + 1;
            
            const pumpLabel = this.createPumpLabel(`排浆泵 ${pumpId}`, '#FF6600');
            pumpLabel.position.set(
                pumpPos.x,
                pumpPos.y + 4, // 在泵上方4米处
                pumpPos.z + 2  // 向前偏移2米
            );
            labelGroup.add(pumpLabel);
        }
        
        // 将标签组添加到内部组
        this.interiorGroup.add(labelGroup);
        console.log('泵房内部设备标签创建完成');
    }

    /**
     * 创建泵标签
     */
    createPumpLabel(text, color = '#FFFFFF') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;
        
        // 设置字体和样式
        context.font = 'Bold 24px Microsoft YaHei, Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 绘制背景
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.roundRect(context, 8, 8, canvas.width - 16, canvas.height - 16, 8);
        context.fill();
        
        // 绘制边框
        context.strokeStyle = color;
        context.lineWidth = 1.5;
        this.roundRect(context, 8, 8, canvas.width - 16, canvas.height - 16, 8);
        context.stroke();
        
        // 绘制文字
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // 创建纹理和材质
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        
        // 创建精灵标签
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4, 1, 1);
        sprite.name = `pumpLabel_${text.replace(/\s+/g, '_')}`;
        
        return sprite;
    }
}