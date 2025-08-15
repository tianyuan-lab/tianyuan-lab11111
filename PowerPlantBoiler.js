/**
 * 火电厂锅炉模型类 - 增强版
 * 符合工业应用实际的火电厂锅炉设计
 * 支持三条独立烟道和精细化工业外观
 */
class PowerPlantBoiler {
    constructor(options = {}) {
        this.name = options.name || '火电厂锅炉';
        this.position = options.position || { x: 0, y: 0, z: 0 };
        this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
        this.scale = options.scale || 1.0;
        
        // 锅炉主体尺寸参数（基于实际火电厂规模）
        this.dimensions = {
            mainWidth: 24,        // 主炉体宽度
            mainHeight: 35,       // 主炉体高度
            mainDepth: 18,        // 主炉体深度
            supportHeight: 12,    // 支撑结构高度
            stackHeight: 45,      // 烟囱高度
            stackDiameter: 3.5,   // 烟囱直径
            platformLevels: 6     // 操作平台层数
        };
        
        this.isInteriorView = false;
        this.group = new THREE.Group();
        this.exteriorGroup = new THREE.Group();
        this.interiorGroup = new THREE.Group();
        this.stackMeshes = [];
        this.stackGhostGroup = new THREE.Group();
        this.stackGhostGroup.name = 'stackGhostGroup';
        this._stackGhostsBuilt = false;
        this.ureaNozzleGroup = new THREE.Group();
        this.ureaNozzleGroup.name = 'ureaNozzleGroup';
        this._ureaNozzlesBuilt = false;
        
        // 火焰和烟气效果相关
        this.flameGroup = new THREE.Group();
        this.flameGroup.name = 'flameEffects';
        this.smokeGroup = new THREE.Group();
        this.smokeGroup.name = 'smokeEffects';
        this._flameEffectsBuilt = false;
        
        // 连接端口
        this.ports = {};
        this._portsBuilt = false;
        
        this.materials = this.createMaterials();
        this.createPowerPlantBoilerStructure();
        this.setupPositioning();
        
        // 初始只显示外部结构
        this.group.add(this.exteriorGroup);
	        
	        // 创建外部标签
	        this.createLabels();
        
        console.log(`${this.name} 创建完成 - 工业级火电厂锅炉`);
    }
    
    /**
     * 创建工业级材质
     */
    createMaterials() {
        return {
            // 主体锅炉外壳 - 耐热钢材质
            mainBody: new THREE.MeshStandardMaterial({
                color: 0x708090,    // 石板灰色
                metalness: 0.8,
                roughness: 0.35
            }),
            
            // 保温层材质 - 工业保温材料
            insulation: new THREE.MeshStandardMaterial({
                color: 0xD3D3D3,    // 浅灰色保温层
                metalness: 0.1,
                roughness: 0.9
            }),
            
            // 钢结构支撑 - 结构钢
            steelStructure: new THREE.MeshStandardMaterial({
                color: 0x2F4F4F,    // 深石板灰
                metalness: 0.9,
                roughness: 0.25
            }),
            
            // 烟囱材质 - 不锈钢
            stack: new THREE.MeshStandardMaterial({
                color: 0xC0C0C0,    // 银色
                metalness: 0.9,
                roughness: 0.15
            }),
            
            // 平台和楼梯 - 工业格栅
            platform: new THREE.MeshStandardMaterial({
                color: 0x556B2F,    // 橄榄绿
                metalness: 0.6,
                roughness: 0.45
            }),
            
            // 管道系统 - 工业管道
            piping: new THREE.MeshStandardMaterial({
                color: 0x8B4513,    // 棕色管道
                metalness: 0.8,
                roughness: 0.3
            }),
            
            // 燃烧器材质 - 耐火材料
            burner: new THREE.MeshStandardMaterial({
                color: 0xFF6347,    // 番茄红
                metalness: 0.4,
                roughness: 0.6
            }),
            
            // 内部火焰效果
            interior: new THREE.MeshStandardMaterial({
                color: 0xFF4500,
                emissive: 0x442200,
                metalness: 0.1,
                roughness: 0.8,
                transparent: true,
                opacity: 0.8
            })
        };
    }

	    /**
	     * 创建锅炉外部标签（与工业综合楼标签实现逻辑一致）
	     * - 标签由外部主脚本创建并添加到锅炉组
	     * - 标签命名为 buildingLabel_ 前缀，便于视图切换时统一管理
	     */
	    createLabels() {
	        // 标签创建逻辑已移至主脚本中，保持与工业综合楼一致
	        console.log('锅炉标签创建逻辑已移至主脚本');
	    }
    
    /**
     * 创建火电厂锅炉主体结构
     */
    createPowerPlantBoilerStructure() {
        this.createMainBoilerBody();
        this.createSupportStructure();
        this.createThreeStacks();
        this.createPlatformSystem();
        this.createPipingAndEquipment();
        this.createBurnerSystem();
        this.createInteriorStructure();
        this.createConnectionPorts();
    }
    
    /**
     * 创建主锅炉体 - 矩形工业设计
     */
    createMainBoilerBody() {
        const { mainWidth, mainHeight, mainDepth, supportHeight } = this.dimensions;
        
        // 主锅炉体 - 矩形设计，更符合火电厂实际
        const mainBodyGeometry = new THREE.BoxGeometry(mainWidth, mainHeight, mainDepth);
        const mainBodyMesh = new THREE.Mesh(mainBodyGeometry, this.materials.mainBody);
        mainBodyMesh.position.set(0, supportHeight + mainHeight / 2, 0);
        mainBodyMesh.name = 'powerPlantBoilerBody';
        this.exteriorGroup.add(mainBodyMesh);
        
        // 保温层外壳
        const insulationGeometry = new THREE.BoxGeometry(
            mainWidth + 1.2, mainHeight + 1.2, mainDepth + 1.2
        );
        const insulationMesh = new THREE.Mesh(insulationGeometry, this.materials.insulation);
        insulationMesh.position.copy(mainBodyMesh.position);
        insulationMesh.name = 'insulationLayer';
        this.exteriorGroup.add(insulationMesh);
        
        // 顶部过热器区域
        const superheaterGeometry = new THREE.BoxGeometry(mainWidth - 2, 6, mainDepth - 2);
        const superheaterMesh = new THREE.Mesh(superheaterGeometry, this.materials.steelStructure);
        superheaterMesh.position.set(0, supportHeight + mainHeight + 3, 0);
        superheaterMesh.name = 'superheater';
        this.exteriorGroup.add(superheaterMesh);
        
        // 底部炉膛
        const furnaceGeometry = new THREE.BoxGeometry(mainWidth - 4, 8, mainDepth - 4);
        const furnaceMesh = new THREE.Mesh(furnaceGeometry, this.materials.burner);
        furnaceMesh.position.set(0, supportHeight + 4, 0);
        furnaceMesh.name = 'furnace';
        this.exteriorGroup.add(furnaceMesh);
    }
    
    /**
     * 创建支撑结构系统
     */
    createSupportStructure() {
        const { mainWidth, mainDepth, supportHeight } = this.dimensions;
        
        // 主支撑柱 - 12根柱子矩形分布
        const columnPositions = [
            // 前排4根
            { x: -mainWidth/2 - 2, z: mainDepth/2 + 2 },
            { x: -mainWidth/6, z: mainDepth/2 + 2 },
            { x: mainWidth/6, z: mainDepth/2 + 2 },
            { x: mainWidth/2 + 2, z: mainDepth/2 + 2 },
            // 中排4根
            { x: -mainWidth/2 - 2, z: 0 },
            { x: mainWidth/2 + 2, z: 0 },
            // 后排4根
            { x: -mainWidth/2 - 2, z: -mainDepth/2 - 2 },
            { x: -mainWidth/6, z: -mainDepth/2 - 2 },
            { x: mainWidth/6, z: -mainDepth/2 - 2 },
            { x: mainWidth/2 + 2, z: -mainDepth/2 - 2 }
        ];
        
        columnPositions.forEach((pos, i) => {
            const columnGeometry = new THREE.CylinderGeometry(0.6, 0.8, supportHeight, 12);
            const columnMesh = new THREE.Mesh(columnGeometry, this.materials.steelStructure);
            columnMesh.position.set(pos.x, supportHeight / 2, pos.z);
            columnMesh.name = `supportColumn_${i}`;
            this.exteriorGroup.add(columnMesh);
        });
        
        // 横向连接梁
        for (let level = 1; level <= 3; level++) {
            const beamHeight = (supportHeight / 3) * level;
            
            // 前后横梁
            [-mainDepth/2 - 2, mainDepth/2 + 2].forEach((z, zi) => {
                const beamGeometry = new THREE.BoxGeometry(mainWidth + 6, 0.4, 0.4);
                const beamMesh = new THREE.Mesh(beamGeometry, this.materials.steelStructure);
                beamMesh.position.set(0, beamHeight, z);
                beamMesh.name = `beam_horizontal_${level}_${zi}`;
                this.exteriorGroup.add(beamMesh);
            });
            
            // 左右纵梁
            [-mainWidth/2 - 2, mainWidth/2 + 2].forEach((x, xi) => {
                const beamGeometry = new THREE.BoxGeometry(0.4, 0.4, mainDepth + 6);
                const beamMesh = new THREE.Mesh(beamGeometry, this.materials.steelStructure);
                beamMesh.position.set(x, beamHeight, 0);
                beamMesh.name = `beam_longitudinal_${level}_${xi}`;
                this.exteriorGroup.add(beamMesh);
            });
        }
        
        // 基础平台
        const basePlatformGeometry = new THREE.BoxGeometry(mainWidth + 8, 1, mainDepth + 8);
        const basePlatformMesh = new THREE.Mesh(basePlatformGeometry, this.materials.platform);
        basePlatformMesh.position.set(0, 0.5, 0);
        basePlatformMesh.name = 'basePlatform';
        this.exteriorGroup.add(basePlatformMesh);
    }
    
    /**
     * 创建三条独立烟囱
     */
    createThreeStacks() {
        const { mainWidth, mainHeight, supportHeight, stackHeight, stackDiameter } = this.dimensions;
        const boilerTopY = supportHeight + mainHeight + 6;
        
        // 三条烟囱的X位置
        const stackPositions = [
            -mainWidth * 0.25,  // 左侧烟囱
            0,                  // 中央烟囱
            mainWidth * 0.25    // 右侧烟囱
        ];
        
        stackPositions.forEach((x, index) => {
            // 烟囱主体
            const stackGeometry = new THREE.CylinderGeometry(
                stackDiameter / 2, stackDiameter / 2, stackHeight, 32
            );
            const stackMesh = new THREE.Mesh(stackGeometry, this.materials.stack);
            stackMesh.position.set(x, boilerTopY + stackHeight / 2, 0);
            stackMesh.name = `powerPlantStack_${index + 1}`;
            this.exteriorGroup.add(stackMesh);
            this.stackMeshes.push(stackMesh);
            
            // 烟囱顶部防雨帽
            const capGeometry = new THREE.CylinderGeometry(
                stackDiameter / 2 + 0.3, stackDiameter / 2 + 0.5, 1, 16
            );
            const capMesh = new THREE.Mesh(capGeometry, this.materials.steelStructure);
            capMesh.position.set(x, boilerTopY + stackHeight + 0.5, 0);
            capMesh.name = `stackCap_${index + 1}`;
            this.exteriorGroup.add(capMesh);
            
            // 烟囱底部连接管道
            const connectionGeometry = new THREE.CylinderGeometry(
                stackDiameter / 2 - 0.2, stackDiameter / 2, 3, 16
            );
            const connectionMesh = new THREE.Mesh(connectionGeometry, this.materials.piping);
            connectionMesh.position.set(x, boilerTopY - 1.5, 0);
            connectionMesh.name = `stackConnection_${index + 1}`;
            this.exteriorGroup.add(connectionMesh);
            
            // 烟囱检修平台
            for (let level = 1; level <= 3; level++) {
                const platformY = boilerTopY + (stackHeight / 3) * level;
                const platformGeometry = new THREE.RingGeometry(
                    stackDiameter / 2 + 0.2, stackDiameter / 2 + 1.5, 16
                );
                const platformMesh = new THREE.Mesh(platformGeometry, this.materials.platform);
                platformMesh.position.set(x, platformY, 0);
                platformMesh.rotateX(-Math.PI / 2);
                platformMesh.name = `stackPlatform_${index + 1}_${level}`;
                this.exteriorGroup.add(platformMesh);
                
                // 平台护栏
                const railingGeometry = new THREE.TorusGeometry(stackDiameter / 2 + 1.5, 0.05, 8, 32);
                const railingMesh = new THREE.Mesh(railingGeometry, this.materials.steelStructure);
                railingMesh.position.set(x, platformY + 1, 0);
                railingMesh.name = `stackRailing_${index + 1}_${level}`;
                this.exteriorGroup.add(railingMesh);
            }
        });
    }

    /**
     * 在内部视角显示的烟囱半透明轮廓（仅创建一次）
     */
    _ensureStackGhosts(opacity = 0.25) {
        if (this._stackGhostsBuilt) return;
        const edgeMat = new THREE.LineBasicMaterial({ color: 0x666666 });
        this.stackMeshes.forEach((stackMesh, idx) => {
            // 复制几何，创建半透明“幽灵”烟囱
            const ghostMat = this.materials.stack.clone();
            ghostMat.transparent = true;
            ghostMat.opacity = opacity;
            ghostMat.depthWrite = false;
            const ghost = new THREE.Mesh(stackMesh.geometry.clone(), ghostMat);
            ghost.position.copy(stackMesh.position);
            ghost.rotation.copy(stackMesh.rotation);
            ghost.name = `stackGhost_${idx+1}`;
            this.stackGhostGroup.add(ghost);

            // 轮廓线，增强可见性
            try {
                const edges = new THREE.EdgesGeometry(stackMesh.geometry, 20);
                const edgeLines = new THREE.LineSegments(edges, edgeMat);
                edgeLines.position.copy(stackMesh.position);
                edgeLines.rotation.copy(stackMesh.rotation);
                edgeLines.name = `stackGhostEdges_${idx+1}`;
                this.stackGhostGroup.add(edgeLines);
            } catch (_) {}
        });

        this.interiorGroup.add(this.stackGhostGroup);
        this._stackGhostsBuilt = true;
        this.stackGhostGroup.visible = false;
    }
    
    /**
     * 创建多层操作平台系统
     */
    createPlatformSystem() {
        const { mainWidth, mainDepth, mainHeight, supportHeight, platformLevels } = this.dimensions;
        
        for (let level = 1; level <= platformLevels; level++) {
            const platformY = supportHeight + (mainHeight / platformLevels) * level;
            
            // 主操作平台
            const platformGeometry = new THREE.BoxGeometry(mainWidth + 6, 0.3, mainDepth + 6);
            const platformMesh = new THREE.Mesh(platformGeometry, this.materials.platform);
            platformMesh.position.set(0, platformY, 0);
            platformMesh.name = `operatingPlatform_${level}`;
            this.exteriorGroup.add(platformMesh);
            
            // 四周护栏
            const railingHeight = 1.2;
            const railingPositions = [
                { x: 0, z: mainDepth/2 + 3.15, w: mainWidth + 6, d: 0.1 },     // 前
                { x: 0, z: -mainDepth/2 - 3.15, w: mainWidth + 6, d: 0.1 },    // 后
                { x: mainWidth/2 + 3.15, z: 0, w: 0.1, d: mainDepth + 6 },     // 右
                { x: -mainWidth/2 - 3.15, z: 0, w: 0.1, d: mainDepth + 6 }     // 左
            ];
            
            railingPositions.forEach((pos, ri) => {
                const railingGeometry = new THREE.BoxGeometry(pos.w, railingHeight, pos.d);
                const railingMesh = new THREE.Mesh(railingGeometry, this.materials.steelStructure);
                railingMesh.position.set(pos.x, platformY + railingHeight/2, pos.z);
                railingMesh.name = `platformRailing_${level}_${ri}`;
                this.exteriorGroup.add(railingMesh);
            });
        }
        
        // 外部楼梯
        this.createExternalStaircase();
    }
    
    /**
     * 创建外部楼梯系统
     */
    createExternalStaircase() {
        const { mainWidth, mainHeight, mainDepth, supportHeight } = this.dimensions;
        const stairWidth = 2;
        const stepHeight = 0.2;
        const stepCount = Math.floor((supportHeight + mainHeight) / stepHeight);
        
        for (let i = 0; i < stepCount; i++) {
            const stepY = i * stepHeight;
            const stepGeometry = new THREE.BoxGeometry(stairWidth, stepHeight, 0.8);
            const stepMesh = new THREE.Mesh(stepGeometry, this.materials.platform);
            stepMesh.position.set(mainWidth/2 + 4, stepY, mainDepth/2 + 2);
            stepMesh.name = `stairStep_${i}`;
            this.exteriorGroup.add(stepMesh);
        }
        
        // 楼梯扶手
        const handrailGeometry = new THREE.BoxGeometry(0.1, supportHeight + mainHeight, 0.1);
        const handrailMesh = new THREE.Mesh(handrailGeometry, this.materials.steelStructure);
        handrailMesh.position.set(mainWidth/2 + 5, (supportHeight + mainHeight)/2, mainDepth/2 + 2);
        handrailMesh.name = 'stairHandrail';
        this.exteriorGroup.add(handrailMesh);
    }
    
    /**
     * 集成烟囱内部视角切换功能 - 与锅炉本体统一
     */
    showStackInterior(stackIndex = null) {
        // 由于烟囱已集成到锅炉本体，统一使用锅炉内部视角
        this.showInterior();
        console.log(`PowerPlantBoiler 烟囱${stackIndex ? stackIndex : '全部'}已切换到内部视角`);
    }
    
    showStackExterior(stackIndex = null) {
        // 由于烟囱已集成到锅炉本体，统一使用锅炉外部视角
        this.showExterior();
        console.log(`PowerPlantBoiler 烟囱${stackIndex ? stackIndex : '全部'}已切换到外部视角`);
    }
    
    /**
     * 获取烟囱信息 - 支持传统API兼容
     */
    getStackInfo(stackIndex = null) {
        const { stackHeight, stackDiameter } = this.dimensions;
        const stackCount = 3;
        
        if (stackIndex !== null && stackIndex >= 0 && stackIndex < stackCount) {
            const stackPositions = [-this.dimensions.mainWidth * 0.25, 0, this.dimensions.mainWidth * 0.25];
            return {
                index: stackIndex,
                position: {
                    x: this.position.x + stackPositions[stackIndex],
                    y: this.position.y + this.dimensions.supportHeight + this.dimensions.mainHeight + 6 + stackHeight / 2,
                    z: this.position.z
                },
                height: stackHeight,
                diameter: stackDiameter,
                name: `powerPlantStack_${stackIndex + 1}`
            };
        }
        
        return {
            stackCount: stackCount,
            totalHeight: stackHeight,
            diameter: stackDiameter,
            integrated: true,
            boilerPosition: this.position
        };
    }
    
    /**
     * 创建管道和设备系统
     */
    createPipingAndEquipment() {
        const { mainWidth, mainDepth, supportHeight } = this.dimensions;
        
        // 主蒸汽管道
        const steamPipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, mainWidth, 16);
        const steamPipeMesh = new THREE.Mesh(steamPipeGeometry, this.materials.piping);
        steamPipeMesh.rotation.z = Math.PI / 2;
        steamPipeMesh.position.set(0, supportHeight + 25, mainDepth/2 + 4);
        steamPipeMesh.name = 'mainSteamPipe';
        this.exteriorGroup.add(steamPipeMesh);
        
        // 给水管道
        const feedwaterPipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, mainWidth, 16);
        const feedwaterPipeMesh = new THREE.Mesh(feedwaterPipeGeometry, this.materials.piping);
        feedwaterPipeMesh.rotation.z = Math.PI / 2;
        feedwaterPipeMesh.position.set(0, supportHeight + 5, -mainDepth/2 - 4);
        feedwaterPipeMesh.name = 'feedwaterPipe';
        this.exteriorGroup.add(feedwaterPipeMesh);
        
        // 空气预热器
        const airPreheaterGeometry = new THREE.BoxGeometry(6, 8, 4);
        const airPreheaterMesh = new THREE.Mesh(airPreheaterGeometry, this.materials.steelStructure);
        airPreheaterMesh.position.set(mainWidth/2 + 8, supportHeight + 10, 0);
        airPreheaterMesh.name = 'airPreheater';
        this.exteriorGroup.add(airPreheaterMesh);
        
        // 省煤器
        const economiserGeometry = new THREE.BoxGeometry(4, 6, 8);
        const economiserMesh = new THREE.Mesh(economiserGeometry, this.materials.steelStructure);
        economiserMesh.position.set(-mainWidth/2 - 6, supportHeight + 8, 0);
        economiserMesh.name = 'economiser';
        this.exteriorGroup.add(economiserMesh);
    }
    
    /**
     * 创建燃烧器系统
     */
    createBurnerSystem() {
        const { mainWidth, mainDepth, supportHeight } = this.dimensions;
        
        // 前墙燃烧器
        for (let i = 0; i < 6; i++) {
            const burnerX = -mainWidth/2 + (mainWidth/5) * (i % 3) + mainWidth/10;
            const burnerY = supportHeight + 8 + Math.floor(i/3) * 6;
            
            const burnerGeometry = new THREE.CylinderGeometry(0.5, 0.3, 2, 12);
            const burnerMesh = new THREE.Mesh(burnerGeometry, this.materials.burner);
            burnerMesh.rotation.x = Math.PI / 2;
            burnerMesh.position.set(burnerX, burnerY, mainDepth/2 + 1);
            burnerMesh.name = `frontBurner_${i}`;
            this.exteriorGroup.add(burnerMesh);
        }
        
        // 侧墙燃烧器
        for (let i = 0; i < 4; i++) {
            const burnerZ = -mainDepth/3 + (mainDepth/3) * (i % 2);
            const burnerY = supportHeight + 10 + Math.floor(i/2) * 8;
            
            const burnerGeometry = new THREE.CylinderGeometry(0.5, 0.3, 2, 12);
            const burnerMesh = new THREE.Mesh(burnerGeometry, this.materials.burner);
            burnerMesh.rotation.z = Math.PI / 2;
            burnerMesh.position.set(mainWidth/2 + 1, burnerY, burnerZ);
            burnerMesh.name = `sideBurner_${i}`;
            this.exteriorGroup.add(burnerMesh);
        }
    }
    
    /**
     * 创建内部结构
     */
    createInteriorStructure() {
        const { mainWidth, mainHeight, mainDepth, supportHeight } = this.dimensions;
        
        // 内部水管壁
        for (let i = 0; i < 20; i++) {
            const tubeGeometry = new THREE.CylinderGeometry(0.1, 0.1, mainHeight - 8, 8);
            const tubeMesh = new THREE.Mesh(tubeGeometry, this.materials.piping);
            const angle = (i / 20) * Math.PI * 2;
            tubeMesh.position.set(
                Math.cos(angle) * (mainWidth/2 - 2),
                supportHeight + mainHeight/2,
                Math.sin(angle) * (mainDepth/2 - 2)
            );
            tubeMesh.name = `waterTube_${i}`;
            this.interiorGroup.add(tubeMesh);
        }
        
        // 创建火焰和烟气效果
        this._createFlameAndSmokeEffects();
    }
    
    /**
     * 设置定位
     */
    setupPositioning() {
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.group.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        this.group.scale.setScalar(this.scale);
        this.group.name = this.name;
        this.group.userData = { 
            type: 'powerPlantBoiler', 
            name: this.name, 
            clickable: true,
            hasThreeStacks: true
        };
    }
    
    /**
     * 显示内部视角
     */
    showInterior() {
        this.group.remove(this.exteriorGroup);
        this.group.add(this.interiorGroup);
        // 构建并显示烟囱半透明轮廓
        try {
            if (!this._stackGhostsBuilt) {
                this.stackGhostGroup.clear();
                const ghostMat = new THREE.MeshStandardMaterial({ color: 0xC0C0C0, transparent: true, opacity: 0.25, metalness: 0.2, roughness: 0.8, depthWrite: false });
                this.stackMeshes.forEach((stack, i) => {
                    if (!stack.geometry) return;
                    const ghost = new THREE.Mesh(stack.geometry.clone(), ghostMat);
                    ghost.position.copy(stack.position);
                    ghost.rotation.copy(stack.rotation);
                    ghost.scale.copy(stack.scale);
                    ghost.name = `stackGhost_${i+1}`;
                    this.stackGhostGroup.add(ghost);
                });
                this._stackGhostsBuilt = true;
            }
            if (!this.interiorGroup.children.includes(this.stackGhostGroup)) {
                this.interiorGroup.add(this.stackGhostGroup);
            }
            this.stackGhostGroup.visible = true;
        } catch (_) {}

        // 创建并显示尿素溶液喷淋头
        try {
            if (!this._ureaNozzlesBuilt) {
                this.ureaNozzleGroup.clear();
                const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x9BB4D8, metalness: 0.8, roughness: 0.25 });
                const bodyMat = new THREE.MeshStandardMaterial({ color: 0xD9E2EF, metalness: 0.6, roughness: 0.35 });
                const clampMat = new THREE.MeshStandardMaterial({ color: 0x6C7A89, metalness: 0.9, roughness: 0.25 });
                const swirlMat = new THREE.MeshStandardMaterial({ color: 0xA7C7E7, metalness: 0.3, roughness: 0.7, transparent: true, opacity: 0.35, depthWrite: false });

                const makeNozzle = () => {
                    const g = new THREE.Group();
                    // 1) 喷嘴主体（316L不锈钢六角体 + 圆柱）
                    const hex = new THREE.Mesh(new THREE.CylinderGeometry(0.27, 0.27, 0.36, 6), nozzleMat);
                    hex.rotation.y = Math.PI / 6;
                    g.add(hex);
                    const cyl = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.54, 24), bodyMat);
                    cyl.position.y = -0.45;
                    g.add(cyl);
                    // 2) 卡箍/接头
                    const clamp = new THREE.Mesh(new THREE.TorusGeometry(0.18, 0.045, 10, 24), clampMat);
                    clamp.rotation.x = Math.PI / 2;
                    clamp.position.y = -0.18;
                    g.add(clamp);
                    // 3) 旋涡雾化锥（锥形透明体，表示喷雾范围）
                    const spray = new THREE.Mesh(new THREE.ConeGeometry(0.84, 1.5, 24), swirlMat);
                    spray.position.y = -1.35;
                    g.add(spray);
                    return g;
                };

                // 每个烟囱左右两侧各三个喷头
                const offsetsX = [-0.65, 0.65];
                const levels = [-0.6, 0, 0.6];
                this.stackMeshes.forEach((stack) => {
                    const base = stack.position.clone();
                    const radius = this.dimensions.stackDiameter / 2;
                    const topY = base.y + stack.geometry.parameters.height / 2;
                    const midY = base.y;
                    // 沿高度中段布置
                    const nozzleY = [midY - 2.0, midY, midY + 2.0];
                    offsetsX.forEach((sx, sideIdx) => {
                        levels.forEach((lv, i) => {
                            const n = makeNozzle();
                            n.position.set(base.x + sx * radius * 0.9, nozzleY[i], base.z + lv * radius * 0.15);
                            // 朝向烟囱中心
                            n.lookAt(new THREE.Vector3(base.x, nozzleY[i], base.z));
                            this.ureaNozzleGroup.add(n);
                        });
                    });
                });

                // 添加一个固定尺寸的标签
                try {
                    // 创建固定尺寸的标签
                    const canvas = document.createElement('canvas');
                    const context = canvas.getContext('2d');
                    canvas.width = 256;
                    canvas.height = 64;
                    
                    // 绘制标签背景
                    context.fillStyle = 'rgba(144, 202, 249, 0.8)';
                    context.fillRect(0, 0, canvas.width, canvas.height);
                    
                    // 绘制文字
                    context.fillStyle = '#000000';
                    context.font = 'bold 30px Arial';
                    context.textAlign = 'center';
                    context.fillText('尿素溶液喷淋头', canvas.width / 2, canvas.height / 2 + 6);
                    
                    const texture = new THREE.CanvasTexture(canvas);
                    const spriteMaterial = new THREE.SpriteMaterial({ map: texture });
                    const label = new THREE.Sprite(spriteMaterial);
                    label.scale.set(12, 3, 1); // 放大3倍 (4*3=12, 1*3=3)
                    
                    // 放在第一根烟囱侧边稍高处
                    const firstStack = this.stackMeshes[0];
                    if (firstStack) {
                        const p = firstStack.position;
                        label.position.set(p.x - this.dimensions.stackDiameter, p.y + 2.5, p.z);
                    } else {
                        label.position.set(0, 2.5, 0);
                    }
                    label.name = 'ureaSprayerLabel';
                    this.ureaSprayerLabel = label;
                    this.ureaNozzleGroup.add(label);
                } catch(_) {}

                this.interiorGroup.add(this.ureaNozzleGroup);
                this._ureaNozzlesBuilt = true;
            }
            this.ureaNozzleGroup.visible = true;
        } catch(_) {}
        
        // 显示火焰和烟气效果
        try { 
            if (this.flameGroup) this.flameGroup.visible = true; 
            if (this.smokeGroup) this.smokeGroup.visible = true;
        } catch(_) {}
        
        // 隐藏外部尿素连管（若由主脚本创建并挂载到此引用）
        try {
            if (this.ureaExternalPipeGroup) this.ureaExternalPipeGroup.visible = false;
        } catch(_) {}
        
        // 隐藏外部稀释水管道（若由主脚本创建并挂载到此引用）
        try {
            if (this.dilutionWaterPipeGroup) this.dilutionWaterPipeGroup.visible = false;
        } catch(_) {}
        
        // 隐藏外部压缩空气管道（若由主脚本创建并挂载到此引用）
        try {
            if (this.compressedAirPipeGroup) this.compressedAirPipeGroup.visible = false;
        } catch(_) {}
        // 隐藏烟囱延申段
        try {
            if (this.stackExtensionGroup) this.stackExtensionGroup.visible = false;
        } catch(_) {}
        
        // 隐藏锅炉标签（与工业综合楼逻辑一致）
        this.group.children.forEach(child => {
            if (child.name && child.name.includes('buildingLabel_')) {
                child.visible = false;
            }
        });
        
        this.isInteriorView = true;
        console.log(`${this.name} 切换到内部视角`);
    }
    
    /**
     * 显示外部视角
     */
    showExterior() {
        this.group.remove(this.interiorGroup);
        this.group.add(this.exteriorGroup);
        // 隐藏烟囱轮廓
        try { if (this.stackGhostGroup) this.stackGhostGroup.visible = false; } catch(_) {}
        try { if (this.ureaNozzleGroup) this.ureaNozzleGroup.visible = false; } catch(_) {}
        // 隐藏火焰和烟气效果
        try { 
            if (this.flameGroup) this.flameGroup.visible = false; 
            if (this.smokeGroup) this.smokeGroup.visible = false;
        } catch(_) {}
        
        // 显示外部尿素连管
        try {
            if (this.ureaExternalPipeGroup) this.ureaExternalPipeGroup.visible = true;
        } catch(_) {}
        
        // 显示外部稀释水管道
        try {
            if (this.dilutionWaterPipeGroup) this.dilutionWaterPipeGroup.visible = true;
        } catch(_) {}
        
        // 显示外部压缩空气管道
        try {
            if (this.compressedAirPipeGroup) this.compressedAirPipeGroup.visible = true;
        } catch(_) {}
        // 显示烟囱延申段
        try {
            if (this.stackExtensionGroup) this.stackExtensionGroup.visible = true;
        } catch(_) {}
        
        // 显示锅炉标签（与工业综合楼逻辑一致）
        this.group.children.forEach(child => {
            if (child.name && child.name.includes('buildingLabel_')) {
                child.visible = true;
            }
        });
        
        this.isInteriorView = false;
        console.log(`${this.name} 切换到外部视角`);
    }
    
    /**
     * 获取组对象
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.name,
            type: '火电厂锅炉',
            dimensions: this.dimensions,
            stackCount: 3,
            position: this.position,
            rotation: this.rotation,
            scale: this.scale,
            isInteriorView: this.isInteriorView,
            features: [
                '三条独立烟囱',
                '多层操作平台',
                '完整管道系统',
                '多点燃烧器',
                '工业级支撑结构',
                '检修楼梯和护栏'
            ]
        };
    }
    
    /**
     * 清理资源
     */
    dispose() {
        this.group.traverse((child) => {
            if (child.geometry) child.geometry.dispose();
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(mat => mat.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        console.log(`${this.name} 资源已清理`);
    }
    
    /**
     * 创建火焰和烟气效果
     */
    _createFlameAndSmokeEffects() {
        const { mainWidth, mainHeight, mainDepth, supportHeight } = this.dimensions;
        
        if (this._flameEffectsBuilt) return;
        
        // 清空现有效果
        this.flameGroup.clear();
        this.smokeGroup.clear();
        
        // 创建多层火焰效果
        this._createMainFlames();
        this._createFlameParticles();
        this._createSmokeFlow();
        this._createHeatDistortion();
        
        // 添加到内部群组
        this.interiorGroup.add(this.flameGroup);
        this.interiorGroup.add(this.smokeGroup);
        
        this._flameEffectsBuilt = true;
        console.log('锅炉火焰和烟气效果已创建');
    }
    
    /**
     * 创建主火焰
     */
    _createMainFlames() {
        const { mainWidth, mainHeight, mainDepth, supportHeight } = this.dimensions;
        
        // 主燃烧区域 - 底部大火焰
        const mainFlameGeometry = new THREE.ConeGeometry(mainWidth/3, mainHeight/2, 8, 4);
        const mainFlameMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF4500,  // 橙红色
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        for (let i = 0; i < 3; i++) {
            const mainFlame = new THREE.Mesh(mainFlameGeometry, mainFlameMaterial);
            mainFlame.position.set(
                (i - 1) * (mainWidth/4),
                supportHeight + mainHeight/4,
                0
            );
            mainFlame.rotation.x = Math.PI;
            this.flameGroup.add(mainFlame);
        }
        
        // 次级火焰 - 中层黄色火焰
        const secondaryFlameGeometry = new THREE.ConeGeometry(mainWidth/4, mainHeight/3, 6, 3);
        const secondaryFlameMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFD700,  // 金黄色
            transparent: true,
            opacity: 0.7,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        for (let i = 0; i < 5; i++) {
            const secondaryFlame = new THREE.Mesh(secondaryFlameGeometry, secondaryFlameMaterial);
            const angle = (i / 5) * Math.PI * 2;
            secondaryFlame.position.set(
                Math.cos(angle) * (mainWidth/6),
                supportHeight + mainHeight/2.5,
                Math.sin(angle) * (mainDepth/6)
            );
            secondaryFlame.rotation.x = Math.PI;
            this.flameGroup.add(secondaryFlame);
        }
        
        // 火焰核心 - 高温白色核心
        const coreFlameGeometry = new THREE.ConeGeometry(mainWidth/6, mainHeight/4, 6, 2);
        const coreFlameMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,  // 白色高温核心
            transparent: true,
            opacity: 0.9,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const coreFlame = new THREE.Mesh(coreFlameGeometry, coreFlameMaterial);
        coreFlame.position.set(0, supportHeight + mainHeight/3, 0);
        coreFlame.rotation.x = Math.PI;
        this.flameGroup.add(coreFlame);
    }
    
    /**
     * 创建火焰粒子效果
     */
    _createFlameParticles() {
        const { mainWidth, mainHeight, mainDepth, supportHeight } = this.dimensions;
        
        // 创建粒子系统 - 模拟火花和燃烧颗粒
        const particleCount = 50;
        const particleGeometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const colors = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            
            // 随机分布在燃烧区域
            positions[i3] = (Math.random() - 0.5) * mainWidth * 0.8;
            positions[i3 + 1] = supportHeight + Math.random() * mainHeight * 0.7;
            positions[i3 + 2] = (Math.random() - 0.5) * mainDepth * 0.8;
            
            // 渐变颜色 - 从红到黄到白
            const heat = Math.random();
            if (heat < 0.3) {
                colors[i3] = 1.0;     // R
                colors[i3 + 1] = 0.2; // G
                colors[i3 + 2] = 0.0; // B
            } else if (heat < 0.7) {
                colors[i3] = 1.0;     // R
                colors[i3 + 1] = 0.8; // G
                colors[i3 + 2] = 0.0; // B
            } else {
                colors[i3] = 1.0;     // R
                colors[i3 + 1] = 1.0; // G
                colors[i3 + 2] = 0.8; // B
            }
        }
        
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        particleGeometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            size: 0.3,
            vertexColors: true,
            transparent: true,
            opacity: 0.8,
            blending: THREE.AdditiveBlending,
            depthWrite: false
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.name = 'flameParticles';
        this.flameGroup.add(particles);
    }
    
    /**
     * 创建烟气流动效果
     */
    _createSmokeFlow() {
        const { mainWidth, mainHeight, mainDepth, supportHeight, stackHeight } = this.dimensions;
        
        // 烟气在每个烟囱中的流动
        this.stackMeshes.forEach((stack, index) => {
            const stackPos = stack.position;
            
            // 烟气柱 - 从燃烧室到烟囱
            for (let layer = 0; layer < 8; layer++) {
                const smokeGeometry = new THREE.CylinderGeometry(
                    1.5 - layer * 0.1,  // 顶部半径逐渐减小
                    2.0 - layer * 0.05, // 底部半径逐渐减小
                    stackHeight / 8,
                    8
                );
                
                const smokeMaterial = new THREE.MeshBasicMaterial({
                    color: new THREE.Color().setHSL(0, 0, 0.3 + layer * 0.05), // 渐变灰色
                    transparent: true,
                    opacity: 0.4 - layer * 0.03,
                    blending: THREE.NormalBlending,
                    depthWrite: false
                });
                
                const smoke = new THREE.Mesh(smokeGeometry, smokeMaterial);
                smoke.position.set(
                    stackPos.x,
                    supportHeight + mainHeight + (layer * stackHeight / 8),
                    stackPos.z
                );
                smoke.name = `smokeLayer_${index}_${layer}`;
                this.smokeGroup.add(smoke);
            }
            
            // 烟囱顶部烟气扩散效果
            const topSmokeGeometry = new THREE.ConeGeometry(4, 6, 8);
            const topSmokeMaterial = new THREE.MeshBasicMaterial({
                color: 0x808080,
                transparent: true,
                opacity: 0.2,
                blending: THREE.NormalBlending,
                depthWrite: false
            });
            
            const topSmoke = new THREE.Mesh(topSmokeGeometry, topSmokeMaterial);
            topSmoke.position.set(
                stackPos.x,
                supportHeight + mainHeight + stackHeight + 3,
                stackPos.z
            );
            topSmoke.name = `topSmoke_${index}`;
            this.smokeGroup.add(topSmoke);
        });
    }
    
    /**
     * 创建热扭曲效果
     */
    _createHeatDistortion() {
        const { mainWidth, mainHeight, mainDepth, supportHeight } = this.dimensions;
        
        // 热空气上升效果 - 使用半透明几何体模拟
        const heatGeometry = new THREE.CylinderGeometry(mainWidth/2, mainWidth/3, mainHeight, 6, 4);
        const heatMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.05,
            blending: THREE.AdditiveBlending,
            depthWrite: false,
            side: THREE.DoubleSide
        });
        
        const heatDistortion = new THREE.Mesh(heatGeometry, heatMaterial);
        heatDistortion.position.set(0, supportHeight + mainHeight/2, 0);
        heatDistortion.name = 'heatDistortion';
        this.flameGroup.add(heatDistortion);
    }
    
    /**
     * 更新火焰动画效果
     */
    updateFlameAnimation() {
        if (!this._flameEffectsBuilt || !this.isInteriorView) return;
        
        const time = Date.now() * 0.005;
        
        // 火焰摇摆动画
        this.flameGroup.children.forEach((flame, index) => {
            if (flame.type === 'Mesh' && flame.name !== 'heatDistortion') {
                flame.rotation.y = Math.sin(time + index) * 0.1;
                flame.scale.y = 1 + Math.sin(time * 2 + index) * 0.1;
            }
        });
        
        // 烟气流动动画
        this.smokeGroup.children.forEach((smoke, index) => {
            if (smoke.type === 'Mesh') {
                smoke.rotation.y += 0.01 + index * 0.001;
                smoke.material.opacity = 0.2 + Math.sin(time + index) * 0.1;
            }
        });
        
        // 粒子动画
        const particles = this.flameGroup.getObjectByName('flameParticles');
        if (particles) {
            const positions = particles.geometry.attributes.position.array;
            for (let i = 0; i < positions.length; i += 3) {
                positions[i + 1] += Math.random() * 0.1; // Y轴上升
                if (positions[i + 1] > this.dimensions.supportHeight + this.dimensions.mainHeight) {
                    positions[i + 1] = this.dimensions.supportHeight; // 重置到底部
                }
            }
            particles.geometry.attributes.position.needsUpdate = true;
        }
    }
    
    /**
     * 创建尿素溶液输入连接端口 - 连接到内部喷淋头系统
     */
    createConnectionPorts() {
        if (this._portsBuilt) return;
        
        const { mainWidth, mainDepth, supportHeight, mainHeight } = this.dimensions;
        
        // 创建尿素溶液主管道入口 - 位于锅炉侧面，连接到内部分配系统
        const portRadius = 0.5;
        const portLength = 2.0;
        const portY = supportHeight + mainHeight * 0.6; // 锅炉高度的60%处，便于分配到各层喷淋头
        const portZ = mainDepth / 2 + portLength / 2; // 前侧面外伸
        
        // 主尿素溶液入口 - 位于锅炉前侧面中央
        const mainPortX = 0; // 居中位置
        const mainPortGeometry = new THREE.CylinderGeometry(portRadius, portRadius, portLength, 16);
        const mainPortMesh = new THREE.Mesh(mainPortGeometry, this.materials.piping);
        mainPortMesh.rotation.x = Math.PI / 2; // 水平朝前
        mainPortMesh.position.set(mainPortX, portY, portZ);
        mainPortMesh.name = 'ureaMainInletPort';
        this.exteriorGroup.add(mainPortMesh);
        
        // 添加主入口法兰
        const flangeGeometry = new THREE.CylinderGeometry(portRadius * 1.4, portRadius * 1.4, 0.25, 16);
        const flangeMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A4A4A,
            metalness: 0.9,
            roughness: 0.3
        });
        
        const mainFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
        mainFlange.rotation.x = Math.PI / 2;
        mainFlange.position.set(mainPortX, portY, portZ + portLength / 2 + 0.125);
        this.exteriorGroup.add(mainFlange);
        
        // 创建内部分配管道系统 - 连接到各个喷淋头
        this._createInternalDistributionSystem();
        
        // 存储端口位置信息（世界坐标系）
        this.ports.ureaMainInlet = {
            position: new THREE.Vector3(mainPortX, portY, portZ + portLength / 2),
            mesh: mainPortMesh
        };

        // 增加烟气外接口（用于与 SCR 反应器连通）- 位于锅炉后侧面中央，朝向 -Z
        try {
            const fluePortRadius = 0.6;
            const fluePortLength = 2.4;
            const fluePortY = supportHeight + mainHeight * 0.55;
            const fluePortZ = -mainDepth / 2 - fluePortLength / 2; // 后侧外伸
            const fluePortX = 0; // 居中

            const fluePortGeom = new THREE.CylinderGeometry(fluePortRadius, fluePortRadius, fluePortLength, 20);
            const fluePortMesh = new THREE.Mesh(fluePortGeom, this.materials.piping);
            fluePortMesh.rotation.x = -Math.PI / 2; // 水平朝向 -Z
            fluePortMesh.position.set(fluePortX, fluePortY, fluePortZ);
            fluePortMesh.name = 'flueGasOutletPort';
            this.exteriorGroup.add(fluePortMesh);

            // 法兰
            const flueFlangeGeom = new THREE.CylinderGeometry(fluePortRadius * 1.25, fluePortRadius * 1.25, 0.28, 20);
            const flueFlange = new THREE.Mesh(flueFlangeGeom, new THREE.MeshStandardMaterial({ color: 0x6D6D6D, metalness: 0.9, roughness: 0.25 }));
            flueFlange.rotation.x = -Math.PI / 2;
            flueFlange.position.set(fluePortX, fluePortY, fluePortZ - fluePortLength / 2 - 0.14);
            this.exteriorGroup.add(flueFlange);

            this.ports.flueGasOutlet = {
                position: new THREE.Vector3(fluePortX, fluePortY, fluePortZ - fluePortLength / 2),
                mesh: fluePortMesh
            };
        } catch(_) {}
        
        this._portsBuilt = true;
        console.log('锅炉尿素溶液主入口及内部分配系统已创建');
    }
    
    /**
     * 创建内部尿素分配管道系统
     */
    _createInternalDistributionSystem() {
        const { mainWidth, mainDepth, supportHeight, mainHeight, stackHeight } = this.dimensions;
        
        // 创建内部分配管道组
        const distributionGroup = new THREE.Group();
        distributionGroup.name = 'ureaDistributionSystem';
        
        // 主分配管道材质
        const distributionMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A90E2, // 蓝色尿素管道
            metalness: 0.8,
            roughness: 0.3
        });
        
        // 主分配管 - 从外部入口到锅炉内部
        const mainDistributionRadius = 0.3;
        const mainDistY = supportHeight + mainHeight * 0.6;
        
        // 水平主管 - 横跨锅炉宽度
        const horizontalMainGeometry = new THREE.CylinderGeometry(mainDistributionRadius, mainDistributionRadius, mainWidth * 0.8, 16);
        const horizontalMain = new THREE.Mesh(horizontalMainGeometry, distributionMaterial);
        horizontalMain.rotation.z = Math.PI / 2;
        horizontalMain.position.set(0, mainDistY, mainDepth / 2 - 1);
        horizontalMain.name = 'ureaHorizontalMain';
        distributionGroup.add(horizontalMain);
        
        // 为每个烟囱创建分配支管
        const stackPositions = [-mainWidth/3, 0, mainWidth/3]; // 三个烟囱的X位置
        
        stackPositions.forEach((stackX, index) => {
            // 垂直分配管 - 从主管到各层喷淋头
            const verticalDistGeometry = new THREE.CylinderGeometry(0.2, 0.2, stackHeight * 0.8, 12);
            const verticalDist = new THREE.Mesh(verticalDistGeometry, distributionMaterial);
            verticalDist.position.set(stackX, supportHeight + mainHeight + stackHeight * 0.4, mainDepth / 2 - 1);
            verticalDist.name = `ureaVerticalDist_${index + 1}`;
            distributionGroup.add(verticalDist);
            
            // 连接主管到垂直分配管的弯头
            const elbowGeometry = new THREE.TorusGeometry(0.25, 0.15, 8, 16, Math.PI / 2);
            const elbow = new THREE.Mesh(elbowGeometry, distributionMaterial);
            elbow.position.set(stackX, mainDistY + 0.25, mainDepth / 2 - 1);
            elbow.rotation.x = Math.PI / 2;
            distributionGroup.add(elbow);
            
            // 水平连接管 - 从主管到弯头
            if (stackX !== 0) { // 中间烟囱不需要水平连接
                const connectionLength = Math.abs(stackX);
                const connectionGeometry = new THREE.CylinderGeometry(0.15, 0.15, connectionLength, 12);
                const connection = new THREE.Mesh(connectionGeometry, distributionMaterial);
                connection.rotation.z = Math.PI / 2;
                connection.position.set(stackX / 2, mainDistY, mainDepth / 2 - 1);
                distributionGroup.add(connection);
            }
            
            // 为每层喷淋头创建分支管道
            const sprayerLevels = 3; // 每个烟囱3层喷淋头
            for (let level = 0; level < sprayerLevels; level++) {
                const levelY = supportHeight + mainHeight + (level + 1) * (stackHeight / (sprayerLevels + 1));
                
                // 左右两侧的分支管道
                [-1, 1].forEach(side => {
                    const branchGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.5, 8);
                    const branch = new THREE.Mesh(branchGeometry, distributionMaterial);
                    branch.rotation.z = Math.PI / 2;
                    branch.position.set(stackX + side * 0.75, levelY, mainDepth / 2 - 1);
                    branch.name = `ureaBranch_${index + 1}_${level + 1}_${side > 0 ? 'R' : 'L'}`;
                    distributionGroup.add(branch);
                    
                    // T型接头
                    const teeGeometry = new THREE.SphereGeometry(0.12, 8, 6);
                    const tee = new THREE.Mesh(teeGeometry, distributionMaterial);
                    tee.position.set(stackX, levelY, mainDepth / 2 - 1);
                    distributionGroup.add(tee);
                });
            }
        });
        
        // 将分配系统添加到外部组（这样在外部视角也能看到部分管道）
        this.exteriorGroup.add(distributionGroup);
        
        console.log('尿素溶液内部分配管道系统已创建');
    }
    
    /**
     * 获取端口的世界坐标位置
     */
    getPortWorldPosition(portName) {
        if (!this.ports[portName]) {
            console.warn(`端口 ${portName} 不存在`);
            return null;
        }
        // 端口位置是以锅炉本地坐标存储的，将其转换为世界坐标
        const localPos = this.ports[portName].position.clone();
        const worldPos = localPos.applyMatrix4(this.group.matrixWorld);
        return worldPos;
    }
    
    /**
     * 获取指定烟囱底部连接段的位置（世界坐标）
     * stackIndex: 0|1|2 分别对应 左/中/右 三根烟囱
     */
    getStackPortWorldPosition(stackIndex = 1) {
        const idx = Math.max(0, Math.min(2, stackIndex));
        // 优先取 createThreeStacks 中创建的底部连接段对象
        const name = `stackConnection_${idx + 1}`;
        try {
            const obj = this.exteriorGroup.getObjectByName(name);
            if (obj) {
                const p = new THREE.Vector3();
                obj.getWorldPosition(p);
                return p;
            }
        } catch (_) {}
        // 兜底：根据烟囱Mesh估算底部位置
        const stack = this.stackMeshes[idx];
        if (stack) {
            const base = stack.position.clone();
            const world = base.applyMatrix4(this.group.matrixWorld);
            return world;
        }
        return null;
    }

    /**
     * 将三根烟囱直接“延申”到目标点（通常为 SCR 入口），使用与烟囱相同材质/直径
     * options.offsetStrategy: 'parallel' 按Z方向错开; 自定义函数 (idx)=>THREE.Vector3 偏移
     */
    extendStacksTo(targetWorldPoint, options = {}) {
        if (!targetWorldPoint || !this.stackMeshes || this.stackMeshes.length === 0) return;
        if (!this.stackExtensionGroup) {
            this.stackExtensionGroup = new THREE.Group();
            this.stackExtensionGroup.name = 'stackExtensionGroup';
            this.exteriorGroup.add(this.stackExtensionGroup);
        } else {
            this.stackExtensionGroup.clear();
        }

        const invBoiler = new THREE.Matrix4().copy(this.group.matrixWorld).invert();
        const endWorld = new THREE.Vector3(targetWorldPoint.x, targetWorldPoint.y, targetWorldPoint.z);
        const endLocalToBoiler = endWorld.clone().applyMatrix4(invBoiler);

        const stackRadius = this.dimensions.stackDiameter / 2;
        const makeOffset = (idx) => {
            const strategy = options.offsetStrategy || 'parallel';
            if (typeof strategy === 'function') return strategy(idx) || new THREE.Vector3();
            if (strategy === 'parallel') {
                // 在锅炉局部坐标中，按 Z 方向做轻微错开，避免三段重合
                const dz = (idx - 1) * (stackRadius * 0.9);
                return new THREE.Vector3(0, 0, dz);
            }
            return new THREE.Vector3();
        };

        this.stackMeshes.forEach((stack, idx) => {
            if (!stack.geometry || !stack.geometry.parameters) return;
            const h = stack.geometry.parameters.height || this.dimensions.stackHeight;
            // 计算烟囱顶部点的世界坐标
            const topLocal = new THREE.Vector3(0, h / 2, 0);
            const topWorld = topLocal.clone().applyMatrix4(stack.matrixWorld);

            // 目标点（世界）带错开
            const offsetLocal = makeOffset(idx);
            const endLocal = endLocalToBoiler.clone().add(offsetLocal);
            const endWorldShifted = endLocal.clone().applyMatrix4(this.group.matrixWorld);

            // 在锅炉局部创建一段圆柱，连接 topWorld ↔ endWorldShifted
            const startLocalToBoiler = topWorld.clone().applyMatrix4(invBoiler);
            const start = startLocalToBoiler;
            const end = endLocal;
            const dir = new THREE.Vector3().subVectors(end, start);
            const length = dir.length();
            if (length < 0.1) return;
            const mid = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);

            const geom = new THREE.CylinderGeometry(stackRadius, stackRadius, length, 24);
            const mat = this.materials.stack;
            const seg = new THREE.Mesh(geom, mat);
            seg.name = `stackExtension_${idx + 1}`;
            // 对齐 Y→dir
            const up = new THREE.Vector3(0, 1, 0);
            const quat = new THREE.Quaternion().setFromUnitVectors(up, dir.clone().normalize());
            seg.quaternion.copy(quat);
            seg.position.copy(mid);
            seg.castShadow = true; seg.receiveShadow = true;
            this.stackExtensionGroup.add(seg);
        });
    }
    
    /**
     * 获取一个喷淋头或标签的世界坐标（用于对接管道时的兜底）
     * type: 'label' | 'nozzle'
     * index: 当为 'nozzle' 时可选索引；为 'label' 时忽略
     */
    getUreaSprayerWorldPosition(type = 'label', index = 0) {
        if (type === 'label' && this.ureaSprayerLabel) {
            const world = new THREE.Vector3();
            this.ureaSprayerLabel.getWorldPosition(world);
            return world;
        }
        // 从喷淋头组中取一个喷头
        if (this.ureaNozzleGroup && this.ureaNozzleGroup.children.length > 0) {
            // children 里包含喷头和标签，过滤出喷头（Group 或 Mesh 组合的，名称未固定）
            const candidates = this.ureaNozzleGroup.children.filter(c => c !== this.ureaSprayerLabel);
            const target = candidates[Math.min(index, candidates.length - 1)];
            if (target) {
                const world = new THREE.Vector3();
                target.getWorldPosition(world);
                return world;
            }
        }
        return null;
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = PowerPlantBoiler;
}

// 全局注册
if (typeof window !== 'undefined') {
    window.PowerPlantBoiler = PowerPlantBoiler;
}