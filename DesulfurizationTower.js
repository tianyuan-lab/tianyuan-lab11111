/**
 * 3D脱硫塔工艺流程图 - 脱硫塔类
 * 精细化建模，包含外部结构和内部设施
 */
class DesulfurizationTower {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.interiorGroup = new THREE.Group();
        this.isInteriorView = false;
        this.animationMixers = [];
        this.config = null;
        this.processFlow = null;
        this.components = new Map(); // 存储组件引用
        this.wireframeMode = false;
        this.initializationPromise = null;
        this.isInitialized = false;
        
        // 塔配置参数
        this.towerConfig = {
            name: config.name || '脱硫塔',
            height: config.height || 30,
            upperRadius: config.upperRadius || 8,
            middleRadius: config.middleRadius || 8,
            lowerRadius: config.lowerRadius || 12,
            position: config.position || { x: 0, y: 0, z: 0 },
            hasTrays: config.hasTrays !== undefined ? config.hasTrays : true,
            hasWetESP: config.hasWetESP || false,
            ...config
        };
        
        // 初始化NaN验证器
        this.validator = window.nanValidator || new NaNValidator();
        
        // 材质定义
        this.materials = {
            steel: new THREE.MeshPhongMaterial({ 
                color: 0x404040, // 深灰色
                shininess: 120,  // 增加金属光泽
                transparent: false, // 不透明，更真实
                opacity: 1.0,
                specular: 0x444444 // 添加镜面反射
            }),
            glass: new THREE.MeshPhongMaterial({ 
                color: 0x87CEEB, 
                transparent: true, 
                opacity: 0.3,
                side: THREE.DoubleSide
            }),
            pipe: new THREE.MeshPhongMaterial({ 
                color: 0xB0B0B0, // 管道也调整为浅灰色
                shininess: 100,
                specular: 0x333333
            }),
            spray: new THREE.MeshPhongMaterial({ 
                color: 0x00FF7F, 
                transparent: true, 
                opacity: 0.7 
            }),
            demister: new THREE.MeshPhongMaterial({ 
                color: 0xFFD700, 
                wireframe: false 
            }),
            liquid: new THREE.MeshPhongMaterial({ 
                color: 0x1E90FF, 
                transparent: true, 
                opacity: 0.6 
            }),
            water: new THREE.MeshPhongMaterial({
                color: 0x00008B,  // 深蓝色
                transparent: true,
                opacity: 0.6,     // 半透明
                shininess: 30,    // 低高光
                side: THREE.DoubleSide
            })
        };
        
        this.initializationPromise = this.initialize();
    }

    async initialize() {
        try {
            await this.loadConfiguration();
            this.createTowerStructure();
            this.createInteriorComponents();
            this.setupAnimations();
            this.isInitialized = true;
            console.log('脱硫塔初始化完成');
        } catch (error) {
            console.error('脱硫塔初始化失败:', error);
            throw error;
        }
    }

    async waitForInitialization() {
        if (this.isInitialized) {
            return;
        }
        return this.initializationPromise;
    }

    async loadConfiguration() {
        try {
            // 加载配置文件
            const configResponse = await fetch('./config/tower-config.json');
            this.config = await configResponse.json();
            
            // 加载工艺流程数据
            const processResponse = await fetch('./data/process-flow.json');
            this.processFlow = await processResponse.json();
            
            console.log('配置文件加载成功');
        } catch (error) {
            console.warn('配置文件加载失败，使用默认配置:', error);
            this.config = this.getDefaultConfig();
            this.processFlow = this.getDefaultProcessFlow();
        }
    }

    getDefaultConfig() {
        return {
            towerConfig: {
                specifications: {
                    height: 30,
                    diameter: 16,
                    material: "316L不锈钢"
                },
                components: {
                    sprayLayers: {
                        count: 3,
                        positions: [16, 20, 24]  // 三层等间距：底层16m，中层20m，顶层24m，间距4m，都在托盘(14.5m)上方
                    },
                    demisters: {
                        count: 2,
                        positions: [28, 25]
                    }
                }
            }
        };
    }

    getDefaultProcessFlow() {
        return {
            processFlow: {
                steps: []
            }
        };
    }
    
    /**
     * 创建脱硫塔外部结构 - 圆柱形设计，底层加宽，平滑连接
     */
    createTowerStructure() {
        // 使用配置参数
        const totalHeight = this.towerConfig.height;
        const upperHeight = totalHeight * 0.4;   // 上段高度（40%）
        const middleHeight = totalHeight * 0.33; // 中段高度（33%）  
        const lowerHeight = totalHeight * 0.27;  // 下段高度（27%）
        
        const upperRadius = this.towerConfig.upperRadius;
        const middleRadius = this.towerConfig.middleRadius;
        const lowerRadius = this.towerConfig.lowerRadius;
        
        // 上段塔体 - 标准圆柱
        const upperGeometry = new THREE.CylinderGeometry(upperRadius, upperRadius, upperHeight, 32);
        const upperMesh = new THREE.Mesh(upperGeometry, this.materials.steel);
        upperMesh.position.y = totalHeight - upperHeight/2; // 顶部位置
        upperMesh.name = 'upperTower';
        this.group.add(upperMesh);
        
        // 中段塔体 - 标准圆柱
        const middleGeometry = new THREE.CylinderGeometry(middleRadius, middleRadius, middleHeight, 32);
        const middleMesh = new THREE.Mesh(middleGeometry, this.materials.steel);
        middleMesh.position.y = totalHeight - upperHeight - middleHeight/2;
        middleMesh.name = 'middleTower';
        this.group.add(middleMesh);
        
        // 下段塔体 - 恢复完整圆柱结构
        const lowerGeometry = new THREE.CylinderGeometry(lowerRadius, lowerRadius, lowerHeight, 32);
        const lowerMesh = new THREE.Mesh(lowerGeometry, this.materials.steel);
        lowerMesh.position.y = lowerHeight/2;
        lowerMesh.name = 'lowerTower';
        this.group.add(lowerMesh);
        
        // 平滑连接段 - 倒过来：宽的一侧连接塔底，窄的一侧连接中段
        const transitionHeight = 2;
        const transitionGeometry = new THREE.CylinderGeometry(middleRadius, lowerRadius, transitionHeight, 32);
        const transitionMesh = new THREE.Mesh(transitionGeometry, this.materials.steel);
        transitionMesh.position.y = lowerHeight + transitionHeight/2;
        transitionMesh.name = 'transitionSection';
        this.group.add(transitionMesh);
        
        // 塔顶平台结构
        const topPlatformGeometry = new THREE.CylinderGeometry(upperRadius + 1, upperRadius + 1, 1.5, 32);
        const topPlatformMesh = new THREE.Mesh(topPlatformGeometry, this.materials.steel);
        topPlatformMesh.position.y = totalHeight + 1;
        this.group.add(topPlatformMesh);
        
        // 塔顶设备
        this.createTopEquipment();
        
        // 创建管道系统
        // this.createInletPipe();  // 已删除进气管道
        // this.createOutletPipe(); // 已删除出气管道
        // this.createZShapedOutletPipe(); // Z形出气管道 - 已删除
        this.createDrainPipe();
        this.createSideAgitators(); // 添加四个侧搅拌器
        
        // 外部平台和梯子
        this.createExternalPlatforms();
        
        // 外部标识和仪表
        this.createExternalInstruments();
        
        // 添加外部支撑结构
        this.createExternalSupports();
        
        // 增强塔体外观美化（适用于一级塔和二级塔）
        this.enhanceTowerAppearance();
        
        // 应用塔的位置
        this.group.position.set(
            this.towerConfig.position.x,
            this.towerConfig.position.y,
            this.towerConfig.position.z
        );
        
        console.log(`[${this.towerConfig.name}] 塔体结构创建完成 - 高度: ${this.towerConfig.height}m`);
    }
    
    /**
     * 创建塔顶设备
     */
    createTopEquipment() {
        // 顶部小型设备
        const equipmentGeometry = new THREE.BoxGeometry(2, 1, 2);
        const equipmentMesh = new THREE.Mesh(equipmentGeometry, this.materials.steel);
        equipmentMesh.position.set(3, 32, 3);
        this.group.add(equipmentMesh);
        
        // 顶部管道
        const topPipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 3, 16);
        const topPipeMesh = new THREE.Mesh(topPipeGeometry, this.materials.pipe);
        topPipeMesh.position.set(-2, 33, -2);
        this.group.add(topPipeMesh);
        
        // 顶部护栏
        const topRailGeometry = new THREE.TorusGeometry(9.5, 0.1, 8, 32);
        const topRailMesh = new THREE.Mesh(topRailGeometry, this.materials.steel);
        topRailMesh.position.y = 32.5;
        topRailMesh.rotation.x = -Math.PI / 2;
        this.group.add(topRailMesh);
    }
    


    /**
     * 创建外部支撑结构
     */
    createExternalSupports() {
        // 删除所有外部支撑结构，保持塔体简洁
        // 不添加任何支撑柱或斜撑
    }
    
    /**
     * 创建进气管道
     */
    createInletPipe() {
        // 主管道 - 连接到加宽的下段
        const pipeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 15, 16);
        const pipeMesh = new THREE.Mesh(pipeGeometry, this.materials.pipe);
        pipeMesh.rotation.z = Math.PI / 2;
        pipeMesh.position.set(-20, 4, 0); // 连接到下段中部
        this.group.add(pipeMesh);
        
        // 管道弯头
        const elbowGeometry = new THREE.TorusGeometry(3, 1.5, 8, 16, Math.PI / 2);
        const elbowMesh = new THREE.Mesh(elbowGeometry, this.materials.pipe);
        elbowMesh.position.set(-12.5, 4, 0);
        elbowMesh.rotation.y = Math.PI / 2;
        this.group.add(elbowMesh);
        
        // 连接到塔体的管道
        const connectGeometry = new THREE.CylinderGeometry(1.5, 1.5, 4, 16);
        const connectMesh = new THREE.Mesh(connectGeometry, this.materials.pipe);
        connectMesh.position.set(-12.5, 6.5, 0);
        this.group.add(connectMesh);
    }
    
    /**
     * 创建出气管道
     */
    createOutletPipe() {
        // 出气管道 - 连接到上段
        const pipeGeometry = new THREE.CylinderGeometry(1.2, 1.2, 18, 16);
        const pipeMesh = new THREE.Mesh(pipeGeometry, this.materials.pipe);
        pipeMesh.rotation.z = Math.PI / 2;
        pipeMesh.position.set(18, 26, 0); // 连接到上段
        this.group.add(pipeMesh);
        
        // 出口弯头
        const elbowGeometry = new THREE.TorusGeometry(2.5, 1.2, 8, 16, Math.PI / 2);
        const elbowMesh = new THREE.Mesh(elbowGeometry, this.materials.pipe);
        elbowMesh.position.set(9, 26, 0);
        elbowMesh.rotation.y = -Math.PI / 2;
        this.group.add(elbowMesh);
    }
    
    /**
     * 创建排液管道
     */
    createDrainPipe() {
        // 排液管道 - 从塔底直接排出（无底座）
        const drainGeometry = new THREE.CylinderGeometry(0.8, 0.8, 6, 16);
        const drainMesh = new THREE.Mesh(drainGeometry, this.materials.pipe);
        drainMesh.position.set(0, -1, 10); // 从地面以下开始
        this.group.add(drainMesh);
        
        // 排液弯头
        const drainElbowGeometry = new THREE.TorusGeometry(1.5, 0.8, 8, 16, Math.PI / 2);
        const drainElbowMesh = new THREE.Mesh(drainElbowGeometry, this.materials.pipe);
        drainElbowMesh.position.set(0, 2, 10);
        drainElbowMesh.rotation.x = Math.PI / 2;
        this.group.add(drainElbowMesh);
    }
    
    /**
     * 创建四个侧搅拌器
     */
    createSideAgitators() {
        console.log('开始创建侧搅拌器系统...');
        
        // 搅拌器安装高度（脱硫塔最底层）
        const agitatorHeight = 3; // 调整到最底层：3米高度
        const towerRadius = 8; // 塔体半径
        const agitatorOffset = 8; // 搅拌器距离塔体外壁的距离，大幅外移避免法兰穿模
        const agitatorDistance = towerRadius + agitatorOffset; // 总距离：16米
        
        console.log(`搅拌器位置参数:`);
        console.log(`- 安装高度: ${agitatorHeight}m (脱硫塔最底层)`);
        console.log(`- 塔体半径: ${towerRadius}m`);
        console.log(`- 外移距离: ${agitatorOffset}m (避免穿模)`);
        console.log(`- 总距离: ${agitatorDistance}m`);
        
        // 四个搅拌器的位置配置 - 放置在塔体外部最底层
        const agitatorPositions = [
            { name: 'agitator_east', position: [agitatorDistance, agitatorHeight, 0], rotation: [0, 0, 0], direction: 'X+' },
            { name: 'agitator_west', position: [-agitatorDistance, agitatorHeight, 0], rotation: [0, Math.PI, 0], direction: 'X-' },
            { name: 'agitator_north', position: [0, agitatorHeight, agitatorDistance], rotation: [0, -Math.PI/2, 0], direction: 'Z+' },
            { name: 'agitator_south', position: [0, agitatorHeight, -agitatorDistance], rotation: [0, Math.PI/2, 0], direction: 'Z-' }
        ];
        
        agitatorPositions.forEach((config, index) => {
            console.log(`创建${config.direction}方向搅拌器: ${config.name} - 位置: (${config.position[0]}, ${config.position[1]}, ${config.position[2]})`);
            this.createSingleAgitator(config);
        });
        
        console.log('四个侧搅拌器创建完成 - 已放置在脱硫塔外部最底层');
    }
    
    /**
     * 创建单个工业级侧搅拌器
     */
    createSingleAgitator(config) {
        const agitatorGroup = new THREE.Group();
        agitatorGroup.name = config.name;
        
        // === 升级版真实工业搅拌器设计 ===
        
        // 高级工业材质系统
        const industrialBlueMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0x1B4F8C,  // 更深的工业蓝色
            metalness: 0.2,
            roughness: 0.3,
            clearcoat: 0.5,
            clearcoatRoughness: 0.2,
            envMapIntensity: 0.8
        });
        
        const weatheredMetalMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0x6B7280,  // 风化金属
            metalness: 0.7,
            roughness: 0.4,
            envMapIntensity: 0.6
        });

        const stainlessSteelMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0xE5E7EB,  // 高光不锈钢
            metalness: 0.9,
            roughness: 0.1,
            envMapIntensity: 1.0
        });

        const glassMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xFFFFFF,
            metalness: 0.0,
            roughness: 0.0,
            transmission: 0.9,  // 透明度
            thickness: 0.5,     // 厚度感
            transparent: true,
            opacity: 0.2
        });

        // === 主体外壳系统 ===
        const housingWidth = 5.5;   // 增大外壳以更逼真
        const housingHeight = 3.5;  // 增加高度
        const housingDepth = 3.0;   // 增加深度
        
        // 主外壳 - 带倒角的真实感设计
        const housingGroup = new THREE.Group();
        
        // 主体外壳
        const housingGeometry = new THREE.BoxGeometry(housingWidth, housingHeight, housingDepth);
        // 在边缘创建圆角效果
        const edges = new THREE.EdgesGeometry(housingGeometry);
        const edgeMaterial = new THREE.LineBasicMaterial({ color: 0x2563EB });
        const edgeLines = new THREE.LineSegments(edges, edgeMaterial);
        
        const housingMesh = new THREE.Mesh(housingGeometry, industrialBlueMaterial);
        housingMesh.castShadow = true;
        housingMesh.receiveShadow = true;
        housingGroup.add(housingMesh);
        housingGroup.add(edgeLines);

        // === 侧面观察窗 - 关键特征！ ===
        const windowWidth = 2.5;
        const windowHeight = 2.0;
        const windowDepth = 0.2;
        
        // 观察窗框架
        const windowFrameGroup = new THREE.Group();
        
        // 窗框
        const frameGeometry = new THREE.BoxGeometry(windowWidth + 0.2, windowHeight + 0.2, windowDepth);
        const frameMesh = new THREE.Mesh(frameGeometry, weatheredMetalMaterial);
        frameMesh.position.set(0, 0, housingDepth/2 + windowDepth/2);
        windowFrameGroup.add(frameMesh);
        
        // 透明玻璃窗
        const windowGeometry = new THREE.BoxGeometry(windowWidth, windowHeight, 0.05);
        const windowMesh = new THREE.Mesh(windowGeometry, glassMaterial);
        windowMesh.position.set(0, 0, housingDepth/2 + windowDepth + 0.025);
        windowFrameGroup.add(windowMesh);
        
        // 窗户保护网格
        for (let i = 0; i < 5; i++) {
            const lineGeometry = new THREE.BoxGeometry(windowWidth, 0.02, 0.02);
            const lineMesh = new THREE.Mesh(lineGeometry, weatheredMetalMaterial);
            lineMesh.position.set(0, -windowHeight/2 + i * (windowHeight/4), housingDepth/2 + windowDepth + 0.05);
            windowFrameGroup.add(lineMesh);
        }
        
        for (let i = 0; i < 4; i++) {
            const lineGeometry = new THREE.BoxGeometry(0.02, windowHeight, 0.02);
            const lineMesh = new THREE.Mesh(lineGeometry, weatheredMetalMaterial);
            lineMesh.position.set(-windowWidth/2 + i * (windowWidth/3), 0, housingDepth/2 + windowDepth + 0.05);
            windowFrameGroup.add(lineMesh);
        }
        
        housingGroup.add(windowFrameGroup);

        // === 工业级加强筋 ===
        // 垂直加强筋
        for (let i = 0; i < 4; i++) {
            const ribGeometry = new THREE.BoxGeometry(0.1, housingHeight + 0.2, 0.1);
            const ribMesh = new THREE.Mesh(ribGeometry, weatheredMetalMaterial);
            const angle = (i / 4) * Math.PI * 2;
            const ribRadius = Math.min(housingWidth, housingDepth) * 0.45;
            ribMesh.position.set(
                Math.cos(angle) * ribRadius, 
                0, 
                Math.sin(angle) * ribRadius
            );
            housingGroup.add(ribMesh);
        }
        
        // 水平加强环
        for (let i = 0; i < 3; i++) {
            const ringGeometry = new THREE.TorusGeometry(housingWidth * 0.5, 0.05, 8, 32);
            const ringMesh = new THREE.Mesh(ringGeometry, weatheredMetalMaterial);
            ringMesh.position.y = -housingHeight/2 + i * (housingHeight/2);
            ringMesh.rotation.x = Math.PI / 2;
            housingGroup.add(ringMesh);
        }
        
        agitatorGroup.add(housingGroup);

        // === 高级内部机械系统 ===
        const mechanicalGroup = new THREE.Group();
        
        // 主传动轴 - 更大更强壮
        const mainShaftGeometry = new THREE.CylinderGeometry(0.25, 0.25, housingWidth + 2, 16);
        const mainShaftMesh = new THREE.Mesh(mainShaftGeometry, stainlessSteelMaterial);
        mainShaftMesh.rotation.z = Math.PI / 2;
        mechanicalGroup.add(mainShaftMesh);
        
        // 多级搅拌叶片 - 螺旋桨式
        for (let level = 0; level < 3; level++) {
            const levelX = -housingWidth/3 + level * (housingWidth/3);
            
            // 每级3个叶片
            for (let blade = 0; blade < 3; blade++) {
                const bladeAngle = (blade / 3) * Math.PI * 2 + level * 0.5; // 每级有角度偏移
                
                // 叶片主体 - 扭曲设计
                const bladeGeometry = new THREE.BoxGeometry(0.15, 2.2, 0.4);
                const bladeMesh = new THREE.Mesh(bladeGeometry, stainlessSteelMaterial);
                bladeMesh.position.set(
                    levelX,
                    Math.cos(bladeAngle) * 1.0,
                    Math.sin(bladeAngle) * 1.0
                );
                bladeMesh.rotation.x = bladeAngle;
                bladeMesh.rotation.z = Math.PI / 6; // 倾斜角度
                mechanicalGroup.add(bladeMesh);
                
                // 叶片加强肋
                const ribGeometry = new THREE.BoxGeometry(0.05, 2.2, 0.1);
                const ribMesh = new THREE.Mesh(ribGeometry, weatheredMetalMaterial);
                ribMesh.position.copy(bladeMesh.position);
                ribMesh.rotation.copy(bladeMesh.rotation);
                ribMesh.position.z += 0.15;
                mechanicalGroup.add(ribMesh);
            }
        }
        
        agitatorGroup.add(mechanicalGroup);

        // === 专业支撑系统 ===
        const supportSystem = new THREE.Group();
        
        // 主支撑架 - H型钢结构
        const supportBeamGeometry = new THREE.BoxGeometry(0.2, 0.4, housingDepth + 2);
        const mainSupportBeam = new THREE.Mesh(supportBeamGeometry, weatheredMetalMaterial);
        mainSupportBeam.position.y = -housingHeight/2 - 1;
        supportSystem.add(mainSupportBeam);
        
        // 四个支撑腿 - 更粗壮
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const legDistance = housingWidth * 0.7;
            
            // 主支撑腿
            const legGeometry = new THREE.CylinderGeometry(0.2, 0.25, 4, 12);
            const legMesh = new THREE.Mesh(legGeometry, weatheredMetalMaterial);
            legMesh.position.set(
                Math.cos(angle) * legDistance,
                -housingHeight/2 - 2,
                Math.sin(angle) * legDistance
            );
            supportSystem.add(legMesh);
            
            // 支撑腿底板 - 更大
            const footPlateGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 8);
            const footPlateMesh = new THREE.Mesh(footPlateGeometry, weatheredMetalMaterial);
            footPlateMesh.position.set(
                Math.cos(angle) * legDistance,
                -housingHeight/2 - 4.1,
                Math.sin(angle) * legDistance
            );
            supportSystem.add(footPlateMesh);
            
            // 支撑斜撑
            const braceGeometry = new THREE.CylinderGeometry(0.08, 0.08, 2, 8);
            const braceMesh = new THREE.Mesh(braceGeometry, weatheredMetalMaterial);
            braceMesh.position.set(
                Math.cos(angle) * legDistance * 0.5,
                -housingHeight/2 - 1.5,
                Math.sin(angle) * legDistance * 0.5
            );
            braceMesh.rotation.z = Math.cos(angle) * 0.5;
            braceMesh.rotation.x = Math.sin(angle) * 0.5;
            supportSystem.add(braceMesh);
        }
        
        agitatorGroup.add(supportSystem);

        // === 先进电机驱动系统 ===
        const motorSystem = new THREE.Group();
        
        // 电机外壳 - 圆柱形更真实
        const motorGeometry = new THREE.CylinderGeometry(1.2, 1.2, 2.5, 16);
        const motorMesh = new THREE.Mesh(motorGeometry, industrialBlueMaterial);
        motorMesh.position.set(0, housingHeight/2 + 1.25, 0);
        motorMesh.rotation.z = Math.PI / 2;
        motorSystem.add(motorMesh);
        
        // 电机散热片 - 更真实的设计
        for (let i = 0; i < 12; i++) {
            const finGeometry = new THREE.BoxGeometry(0.05, 2.5, 0.15);
            const finMesh = new THREE.Mesh(finGeometry, weatheredMetalMaterial);
            const angle = (i / 12) * Math.PI * 2;
            finMesh.position.set(
                Math.cos(angle) * 1.3,
                housingHeight/2 + 1.25,
                Math.sin(angle) * 1.3
            );
            motorSystem.add(finMesh);
        }
        
        // 电机接线盒
        const junctionBoxGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.4);
        const junctionBoxMesh = new THREE.Mesh(junctionBoxGeometry, weatheredMetalMaterial);
        junctionBoxMesh.position.set(1.5, housingHeight/2 + 1.25, 0);
        motorSystem.add(junctionBoxMesh);
        
        agitatorGroup.add(motorSystem);

        // === 优化连接法兰系统 - 避免穿模 ===
        const flangeSystem = new THREE.Group();
        
        // 主法兰 - 缩短伸入距离
        const flangeGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.4, 16);
        const flangeMesh = new THREE.Mesh(flangeGeometry, weatheredMetalMaterial);
        flangeMesh.position.set(-housingWidth/2 + 0.2, 0, 0); // 向外移动，减少伸入
        flangeMesh.rotation.z = Math.PI / 2;
        flangeSystem.add(flangeMesh);
        
        // 密封圈
        const sealGeometry = new THREE.TorusGeometry(1.2, 0.05, 8, 32);
        const sealMesh = new THREE.Mesh(sealGeometry, new THREE.MeshPhongMaterial({ color: 0x1F2937 }));
        sealMesh.position.set(-housingWidth/2 + 0.2, 0, 0); // 与法兰对齐
        sealMesh.rotation.y = Math.PI / 2;
        flangeSystem.add(sealMesh);
        
        // 连接管道 - 从法兰到塔体的连接管
        const connectionPipeGeometry = new THREE.CylinderGeometry(1.0, 1.0, 3.0, 16);
        const connectionPipeMesh = new THREE.Mesh(connectionPipeGeometry, weatheredMetalMaterial);
        connectionPipeMesh.position.set(-housingWidth/2 - 1.5, 0, 0); // 连接管位置
        connectionPipeMesh.rotation.z = Math.PI / 2;
        flangeSystem.add(connectionPipeMesh);
        
        // 塔体连接法兰 - 在连接管末端
        const towerFlangeGeometry = new THREE.CylinderGeometry(1.2, 1.2, 0.3, 16);
        const towerFlangeMesh = new THREE.Mesh(towerFlangeGeometry, weatheredMetalMaterial);
        towerFlangeMesh.position.set(-housingWidth/2 - 3.2, 0, 0); // 塔体侧法兰
        towerFlangeMesh.rotation.z = Math.PI / 2;
        flangeSystem.add(towerFlangeMesh);
        
        // 高强度螺栓 - 只在搅拌器侧法兰
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const boltGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.4, 6);
            const boltMesh = new THREE.Mesh(boltGeometry, weatheredMetalMaterial);
            boltMesh.rotation.z = Math.PI / 2;
            boltMesh.position.set(
                -housingWidth/2, 
                Math.cos(angle) * 1.2, 
                Math.sin(angle) * 1.2
            );
            flangeSystem.add(boltMesh);
            
            // 螺母
            const nutGeometry = new THREE.CylinderGeometry(0.12, 0.12, 0.1, 6);
            const nutMesh = new THREE.Mesh(nutGeometry, weatheredMetalMaterial);
            nutMesh.rotation.z = Math.PI / 2;
            nutMesh.position.set(
                -housingWidth/2 - 0.2, 
                Math.cos(angle) * 1.2, 
                Math.sin(angle) * 1.2
            );
            flangeSystem.add(nutMesh);
        }
        
        agitatorGroup.add(flangeSystem);

        // === 工业管道接口 ===
        // 进料口
        const inletGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.0, 12);
        const inletMesh = new THREE.Mesh(inletGeometry, stainlessSteelMaterial);
        inletMesh.rotation.x = Math.PI / 2;
        inletMesh.position.set(0, housingHeight/2 + 0.5, -housingDepth/2 - 0.5);
        agitatorGroup.add(inletMesh);

        // 出料口
        const outletGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.0, 12);
        const outletMesh = new THREE.Mesh(outletGeometry, stainlessSteelMaterial);
        outletMesh.rotation.x = Math.PI / 2;
        outletMesh.position.set(0, -housingHeight/2 - 0.5, housingDepth/2 + 0.5);
        agitatorGroup.add(outletMesh);
        
        // 排放阀
        const drainValveGeometry = new THREE.SphereGeometry(0.3, 12, 8);
        const drainValveMesh = new THREE.Mesh(drainValveGeometry, weatheredMetalMaterial);
        drainValveMesh.position.set(housingWidth/2, -housingHeight/2, 0);
        agitatorGroup.add(drainValveMesh);

        // === 工业铭牌和标识 ===
        const namePlateGeometry = new THREE.BoxGeometry(1.2, 0.6, 0.05);
        const namePlateMesh = new THREE.Mesh(namePlateGeometry, stainlessSteelMaterial);
        namePlateMesh.position.set(0, housingHeight/2 - 0.5, housingDepth/2 + 0.025);
        agitatorGroup.add(namePlateMesh);

        // 应用位置和旋转
        agitatorGroup.position.set(...config.position);
        agitatorGroup.rotation.set(...config.rotation);
        
        // 添加到主组
        this.group.add(agitatorGroup);
        this.components.set(config.name, agitatorGroup);
        
        console.log(`${config.name} 美化升级完成 - 位置: (${config.position[0]}, ${config.position[1]}, ${config.position[2]}), 高级组件数: ${agitatorGroup.children.length}, 包含观察窗`);
    }
    
    /**
     * 创建Z形出气管道 - 整体实现（无连接问题）
     */
    createZShapedOutletPipe() {
        const pipeGroup = new THREE.Group();
        pipeGroup.name = 'zShapedOutletPipe';
        
        // 管道参数 - Z形设计
        const pipeRadius = 1.2; // 出气管道半径
        const pipeThickness = 0.15; // 管壁厚度
        const connectionHeight = 28; // 连接高度（塔体上部）
        const towerRadius = 8; // 塔体半径
        
        // 真实工业管道材质 - 有磨损的碳钢管道
        const pipeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x8A9BA8, // 更暗的灰色金属，符合照片
            metalness: 0.75,  // 降低金属感，更像老旧管道
            roughness: 0.45,  // 增加粗糙度，符合磨损表面
            clearcoat: 0.1,   // 减少清漆层，更真实
            clearcoatRoughness: 0.8, // 增加清漆粗糙度
            envMapIntensity: 0.6 // 降低环境反射
        });
        
        // 管道内壁材质 - 防腐涂层
        const innerMaterial = new THREE.MeshPhongMaterial({
            color: 0x1C2833,
            shininess: 35
        });
        
        // Z形管道的关键尺寸 - 按照真实照片比例调整
        const horizontalLength1 = 4; // 第一段水平长度（更短，符合照片）
        const verticalLength1 = 12;  // 第一段垂直长度（更长，符合照片）
        const diagonalLength = 15;   // 对角线长度（更长的斜段）
        const verticalLength2 = 8;   // 第二段垂直长度
        const horizontalLength2 = 12; // 第二段水平长度（更长的出口段）
        const elbowRadius = 1.5;     // 弯头半径（更小，更真实）
        
        // === 重新设计Z形管道路径 ===
        // 新路径：从塔体向Z轴负方向伸出，最终指向X轴正方向
        const pathPoints = [];
        
        // 1. 起点：塔体连接点（从侧面开始）
        pathPoints.push(new THREE.Vector3(0, connectionHeight, towerRadius));
        
        // 2. 第一段向Z轴负方向水平伸出
        const point1 = new THREE.Vector3(0, connectionHeight, towerRadius + horizontalLength1);
        pathPoints.push(point1);
        
        // 3. 第一个弯头控制点（向上转弯）
        const bend1Control = new THREE.Vector3(
            0, 
            connectionHeight + elbowRadius * 0.3, 
            towerRadius + horizontalLength1 + elbowRadius * 0.7
        );
        pathPoints.push(bend1Control);
        
        // 4. 第一段垂直起点
        const vertical1Start = new THREE.Vector3(
            0, 
            connectionHeight + elbowRadius, 
            towerRadius + horizontalLength1 + elbowRadius
        );
        pathPoints.push(vertical1Start);
        
        // 5. 第一段垂直终点
        const vertical1End = new THREE.Vector3(
            0, 
            connectionHeight + elbowRadius + verticalLength1, 
            towerRadius + horizontalLength1 + elbowRadius
        );
        pathPoints.push(vertical1End);
        
        // 6. 第二个弯头控制点（开始对角线向X轴正方向）
        const bend2Control = new THREE.Vector3(
            elbowRadius, 
            connectionHeight + elbowRadius + verticalLength1 + elbowRadius, 
            towerRadius + horizontalLength1 + elbowRadius
        );
        pathPoints.push(bend2Control);
        
        // 7. 对角线起点
        const diagonalStart = new THREE.Vector3(
            elbowRadius, 
            connectionHeight + elbowRadius + verticalLength1 + elbowRadius, 
            towerRadius + horizontalLength1 + elbowRadius
        );
        pathPoints.push(diagonalStart);
        
        // 8. 对角线终点 - 向X轴正方向和Y轴下方倾斜（60度角）
        const diagonalAngleRadians = Math.PI / 3; // 60度角度
        const diagonalEnd = new THREE.Vector3(
            elbowRadius + Math.cos(diagonalAngleRadians) * diagonalLength, 
            connectionHeight + elbowRadius + verticalLength1 + elbowRadius - Math.sin(diagonalAngleRadians) * diagonalLength, 
            towerRadius + horizontalLength1 + elbowRadius
        );
        pathPoints.push(diagonalEnd);
        
        // 9. 第三个弯头控制点（准备向下垂直）
        const bend3Control = new THREE.Vector3(
            diagonalEnd.x + elbowRadius, 
            diagonalEnd.y - elbowRadius, 
            towerRadius + horizontalLength1 + elbowRadius
        );
        pathPoints.push(bend3Control);
        
        // 10. 第二段垂直起点
        const vertical2Start = new THREE.Vector3(
            diagonalEnd.x + elbowRadius, 
            diagonalEnd.y - elbowRadius, 
            towerRadius + horizontalLength1 + elbowRadius
        );
        pathPoints.push(vertical2Start);
        
        // 11. 第二段垂直终点
        const vertical2End = new THREE.Vector3(
            diagonalEnd.x + elbowRadius, 
            diagonalEnd.y - elbowRadius - verticalLength2, 
            towerRadius + horizontalLength1 + elbowRadius
        );
        pathPoints.push(vertical2End);
        
        // 12. 第四个弯头控制点（转向X轴正方向）
        const bend4Control = new THREE.Vector3(
            diagonalEnd.x + elbowRadius + elbowRadius, 
            vertical2End.y - elbowRadius, 
            towerRadius + horizontalLength1 + elbowRadius
        );
        pathPoints.push(bend4Control);
        
        // 13. 最终水平段起点（X轴正方向）
        const horizontal2Start = new THREE.Vector3(
            diagonalEnd.x + elbowRadius + elbowRadius, 
            vertical2End.y - elbowRadius, 
            towerRadius + horizontalLength1 + elbowRadius
        );
        pathPoints.push(horizontal2Start);
        
        // 14. 终点：最终出口（X轴正方向延伸）
        const finalEnd = new THREE.Vector3(
            diagonalEnd.x + elbowRadius + elbowRadius + horizontalLength2 * 1.2, 
            vertical2End.y - elbowRadius, 
            towerRadius + horizontalLength1 + elbowRadius
        );
        pathPoints.push(finalEnd);
        
        // === 创建平滑路径曲线 ===
        // 使用CatmullRom曲线创建平滑的Z形路径
        const curve = new THREE.CatmullRomCurve3(pathPoints, false, 'catmullrom', 0.1);
        
        // === 创建管道几何体 ===
        // 外壁管道 - 使用TubeGeometry基于路径创建
        const tubeGeometry = new THREE.TubeGeometry(
            curve,           // 路径曲线
            200,            // 路径分段数（越高越平滑）
            pipeRadius,     // 管道半径
            32,             // 圆周分段数
            false           // 不闭合
        );
        
        const pipeMesh = new THREE.Mesh(tubeGeometry, pipeMaterial);
        pipeMesh.castShadow = true;
        pipeMesh.receiveShadow = true;
        pipeGroup.add(pipeMesh);
        
        // 内壁管道
        const innerTubeGeometry = new THREE.TubeGeometry(
            curve,
            200,
            pipeRadius - pipeThickness,
            32,
            false
        );
        
        const innerPipeMesh = new THREE.Mesh(innerTubeGeometry, innerMaterial);
        pipeGroup.add(innerPipeMesh);
        
        // === 添加配套组件 ===
        
        // 1. 塔体连接法兰（调整为Z轴方向连接）
        const towerFlangeMaterial = new THREE.MeshPhongMaterial({
            color: 0x5D6D7E,
            shininess: 95
        });
        
        const towerFlangeGeometry = new THREE.CylinderGeometry(pipeRadius * 1.8, pipeRadius * 1.8, 0.3, 32);
        const towerFlangeMesh = new THREE.Mesh(towerFlangeGeometry, towerFlangeMaterial);
        towerFlangeMesh.rotation.x = Math.PI / 2; // 旋转以适配Z轴方向
        towerFlangeMesh.position.set(0, connectionHeight, towerRadius + 0.15); // Z轴方向连接点
        towerFlangeMesh.castShadow = true;
        pipeGroup.add(towerFlangeMesh);
        
        // 2. 末端排气扩散器（调整为X轴正方向）
        const diffuserMaterial = new THREE.MeshPhongMaterial({
            color: 0x85929E,
            shininess: 75
        });
        
        const diffuserGeometry = new THREE.ConeGeometry(pipeRadius * 2.5, 1.5, 20);
        const diffuserMesh = new THREE.Mesh(diffuserGeometry, diffuserMaterial);
        diffuserMesh.rotation.z = -Math.PI / 2; // 旋转以指向X轴正方向
        // 使用路径终点位置，在X轴正方向延伸
        diffuserMesh.position.set(finalEnd.x + 1.5, finalEnd.y, finalEnd.z);
        diffuserMesh.castShadow = true;
        pipeGroup.add(diffuserMesh);
        
        // 3. 添加关键节点标识球（用于可视化路径关键点）
        const markerMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xff0000, 
            transparent: true, 
            opacity: 0.3 
        });
        const markerGeometry = new THREE.SphereGeometry(0.2, 8, 8);
        
        // 添加关键转折点标识
        const keyPoints = [pathPoints[4], pathPoints[7], pathPoints[10], pathPoints[13]]; // 垂直段和对角线关键点
        keyPoints.forEach((point, index) => {
            const marker = new THREE.Mesh(markerGeometry, markerMaterial);
            marker.position.copy(point);
            marker.name = `pathMarker${index}`;
            // pipeGroup.add(marker); // 取消注释可显示路径标记点
        });
        
        // 4. 添加简化的支撑系统
        this.createZPipeSupportsUnified(pipeGroup, pathPoints);
        
        this.group.add(pipeGroup);
        
        console.log('Z形出气管道创建完成 - 方向已调整（无连接问题）');
        console.log('- 实现方式: 基于路径的一体化管道（TubeGeometry）');
        console.log('- 路径点数:', pathPoints.length);
        console.log('- 起点连接: 塔体Z轴正方向 (高度:', connectionHeight, 'm)');
        console.log('- 终点出口: X轴正方向');
        console.log('- Z形特征: 完整平滑的Z字形路径，彻底解决连接问题');
        console.log('- 管道半径:', pipeRadius, 'm');
        console.log('- 路径方向: Z轴负半轴 → X轴正半轴');
    }
    
    /**
     * 创建Z形管道统一支撑系统 - 基于路径点的支撑
     */
    createZPipeSupportsUnified(pipeGroup, pathPoints) {
        const supportMaterial = new THREE.MeshPhongMaterial({
            color: 0x34495E,
            shininess: 65
        });
        
        // 支撑柱基础几何体
        const supportColumnGeometry = new THREE.CylinderGeometry(0.2, 0.3, 2.0, 8);
        const supportBeamGeometry = new THREE.BoxGeometry(0.3, 0.3, 1.5);
        
        // 根据路径关键点创建支撑
        const supportPoints = [
            { point: pathPoints[4], name: 'vertical1Support' },    // 第一段垂直段
            { point: pathPoints[7], name: 'diagonalSupport' },     // 对角线段
            { point: pathPoints[10], name: 'vertical2Support' },   // 第二段垂直段
            { point: pathPoints[13], name: 'horizontalSupport' }   // 水平段
        ];
        
        supportPoints.forEach((supportInfo, index) => {
            const point = supportInfo.point;
            
            // 支撑柱 - 从地面到管道
            const supportColumn = new THREE.Mesh(supportColumnGeometry, supportMaterial);
            supportColumn.position.set(
                point.x - 1.5, // 偏移以避免与管道重叠
                point.y - 1.0, // 支撑柱高度调整
                point.z
            );
            supportColumn.castShadow = true;
            supportColumn.receiveShadow = true;
            supportColumn.name = `${supportInfo.name}_column`;
            pipeGroup.add(supportColumn);
            
            // 支撑横梁 - 连接到管道
            const supportBeam = new THREE.Mesh(supportBeamGeometry, supportMaterial);
            supportBeam.position.set(
                point.x - 0.75, // 横梁位置
                point.y,
                point.z
            );
            supportBeam.castShadow = true;
            supportBeam.name = `${supportInfo.name}_beam`;
            pipeGroup.add(supportBeam);
            
            // 连接卡环 - 模拟管道夹具
            const clampGeometry = new THREE.TorusGeometry(1.4, 0.15, 8, 16);
            const clampMaterial = new THREE.MeshPhongMaterial({
                color: 0x5D6D7E,
            shininess: 85
        });
            const clamp = new THREE.Mesh(clampGeometry, clampMaterial);
            clamp.position.copy(point);
            clamp.name = `${supportInfo.name}_clamp`;
            
            // 根据管道方向调整夹环方向
            if (index === 1) { // 对角线段需要旋转
                clamp.rotation.z = -Math.PI / 4;
            } else if (index === 3) { // 水平段需要旋转
                clamp.rotation.x = Math.PI / 2;
            }
            
            pipeGroup.add(clamp);
        });
        
        console.log('统一支撑系统创建完成 - 基于路径关键点');
    }
    
    /**
     * 创建Z形管道法兰连接系统
     */
    createZPipeFlanges(pipeGroup, pipeMaterial, pipeRadius, towerRadius, connectionHeight, elbow1X, elbow4Y, finalHorizontalZ) {
        const flangeMaterial = new THREE.MeshPhongMaterial({
            color: 0x5D6D7E,
            shininess: 95
        });
        
        // 主法兰1 - 塔体连接处
        const flange1Geometry = new THREE.CylinderGeometry(pipeRadius * 1.7, pipeRadius * 1.7, 0.3, 32);
        const flange1Mesh = new THREE.Mesh(flange1Geometry, flangeMaterial);
        flange1Mesh.rotation.z = Math.PI / 2;
        flange1Mesh.position.set(towerRadius + 0.15, connectionHeight, 0);
        flange1Mesh.castShadow = true;
        pipeGroup.add(flange1Mesh);
        
        // 主法兰2 - 管道末端
        const flange2Geometry = new THREE.CylinderGeometry(pipeRadius * 1.7, pipeRadius * 1.7, 0.3, 32);
        const flange2Mesh = new THREE.Mesh(flange2Geometry, flangeMaterial);
        flange2Mesh.rotation.z = Math.PI / 2;
        flange2Mesh.position.set(elbow1X - 6.15, elbow4Y, finalHorizontalZ);
        flange2Mesh.castShadow = true;
        pipeGroup.add(flange2Mesh);
        
        // 中间检修法兰 - 第一个弯头处
        const flange3Geometry = new THREE.CylinderGeometry(pipeRadius * 1.5, pipeRadius * 1.5, 0.25, 32);
        const flange3Mesh = new THREE.Mesh(flange3Geometry, flangeMaterial);
        flange3Mesh.position.set(elbow1X, connectionHeight + 3, 0);
        flange3Mesh.castShadow = true;
        pipeGroup.add(flange3Mesh);
        
        // 法兰螺栓系统
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const boltGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.35, 8);
            const boltMesh = new THREE.Mesh(boltGeometry, flangeMaterial);
            boltMesh.position.set(
                towerRadius + 0.15 + Math.cos(angle) * pipeRadius * 1.4,
                connectionHeight,
                Math.sin(angle) * pipeRadius * 1.4
            );
            boltMesh.rotation.z = Math.PI / 2;
            pipeGroup.add(boltMesh);
        }
    }
    
    /**
     * 创建Z形管道保温和防护系统
     */
    createZPipeInsulation(pipeGroup, pipeRadius, towerRadius, connectionHeight, elbow1X, vertical1Y, vertical2Y, elbow4Y, diagonalCenterY, diagonalCenterZ, finalHorizontalZ) {
        const insulationMaterial = new THREE.MeshLambertMaterial({
            color: 0xF4F6F7,
            transparent: true,
            opacity: 0.9
        });
        
        const protectionMaterial = new THREE.MeshPhongMaterial({
            color: 0xBDC3C7,
            shininess: 25
        });
        
        // 保温层厚度
        const insulationThickness = 0.15;
        
        // 第一段垂直管道保温层
        const insulation1Geometry = new THREE.CylinderGeometry(pipeRadius + insulationThickness, pipeRadius + insulationThickness, 6, 24);
        const insulation1Mesh = new THREE.Mesh(insulation1Geometry, insulationMaterial);
        insulation1Mesh.position.set(elbow1X, vertical1Y, 0);
        pipeGroup.add(insulation1Mesh);
        
        // 对角线管道保温层
        const insulation2Geometry = new THREE.CylinderGeometry(pipeRadius + insulationThickness, pipeRadius + insulationThickness, 8, 24);
        const insulation2Mesh = new THREE.Mesh(insulation2Geometry, insulationMaterial);
        insulation2Mesh.rotation.x = Math.PI / 4;
        insulation2Mesh.rotation.z = Math.PI / 6;
        insulation2Mesh.position.set(elbow1X, diagonalCenterY, diagonalCenterZ);
        pipeGroup.add(insulation2Mesh);
        
        // 第二段垂直管道保温层
        const insulation3Geometry = new THREE.CylinderGeometry(pipeRadius + insulationThickness, pipeRadius + insulationThickness, 6, 24);
        const insulation3Mesh = new THREE.Mesh(insulation3Geometry, insulationMaterial);
        insulation3Mesh.position.set(elbow1X, vertical2Y, diagonalCenterZ);
        pipeGroup.add(insulation3Mesh);
        
        // 最终水平管道保温层
        const insulation4Geometry = new THREE.CylinderGeometry(pipeRadius + insulationThickness, pipeRadius + insulationThickness, 6, 24);
        const insulation4Mesh = new THREE.Mesh(insulation4Geometry, insulationMaterial);
        insulation4Mesh.rotation.z = Math.PI / 2;
        insulation4Mesh.position.set(elbow1X - 3, elbow4Y, finalHorizontalZ);
        pipeGroup.add(insulation4Mesh);
        
        // 防护外壳 - 关键弯头处
        const protection1Geometry = new THREE.CylinderGeometry(pipeRadius + insulationThickness + 0.08, pipeRadius + insulationThickness + 0.08, 2, 20);
        const protection1Mesh = new THREE.Mesh(protection1Geometry, protectionMaterial);
        protection1Mesh.position.set(elbow1X, connectionHeight + 3, 0);
        pipeGroup.add(protection1Mesh);
        
        // 防护标识牌
        const signGeometry = new THREE.BoxGeometry(1.0, 0.6, 0.1);
        const signMaterial = new THREE.MeshPhongMaterial({
            color: 0xF39C12,
            shininess: 50
        });
        const signMesh = new THREE.Mesh(signGeometry, signMaterial);
        signMesh.position.set(elbow1X - 2, connectionHeight + 2, 0);
        signMesh.castShadow = true;
        pipeGroup.add(signMesh);
    }
    
    /**
     * 创建Z形管道排气扩散器和导流装置
     */
    createZGasDiffuser(pipeGroup, pipeMaterial, pipeRadius, elbow1X, elbow4Y, finalHorizontalZ) {
        const diffuserMaterial = new THREE.MeshPhongMaterial({
            color: 0x85929E,
            shininess: 75
        });
        
        // 扩散器主体 - 锥形设计
        const diffuserGeometry = new THREE.ConeGeometry(pipeRadius * 2.8, 1.8, 20);
        const diffuserMesh = new THREE.Mesh(diffuserGeometry, diffuserMaterial);
        diffuserMesh.rotation.z = Math.PI / 2;
        diffuserMesh.position.set(
            elbow1X - 7.8,
            elbow4Y,
            finalHorizontalZ
        );
        diffuserMesh.castShadow = true;
        pipeGroup.add(diffuserMesh);
        
        // 扩散器导流片 - Z形特色设计
        for (let i = 0; i < 10; i++) {
            const angle = (i / 10) * Math.PI * 2;
            const vaneGeometry = new THREE.BoxGeometry(1.0, 0.12, 1.4);
            const vaneMesh = new THREE.Mesh(vaneGeometry, diffuserMaterial);
            vaneMesh.position.set(
                elbow1X - 7.8,
                elbow4Y + Math.cos(angle) * pipeRadius * 2.0,
                finalHorizontalZ + Math.sin(angle) * pipeRadius * 2.0
            );
            vaneMesh.rotation.x = angle + Math.PI / 10; // Z形倾斜角度
            vaneMesh.castShadow = true;
            pipeGroup.add(vaneMesh);
        }
        
        // 扩散器支撑环
        const supportRingGeometry = new THREE.TorusGeometry(pipeRadius * 2.3, 0.12, 10, 30);
        const supportRingMesh = new THREE.Mesh(supportRingGeometry, diffuserMaterial);
        supportRingMesh.rotation.z = Math.PI / 2;
        supportRingMesh.position.set(
            elbow1X - 6.2,
            elbow4Y,
            finalHorizontalZ
        );
        supportRingMesh.castShadow = true;
        pipeGroup.add(supportRingMesh);
        
        // 气流导向器 - Z形特色
        const deflectorGeometry = new THREE.BoxGeometry(2.5, 0.8, 0.3);
        const deflectorMesh = new THREE.Mesh(deflectorGeometry, diffuserMaterial);
        deflectorMesh.position.set(
            elbow1X - 9.5,
            elbow4Y,
            finalHorizontalZ + 1.2
        );
        deflectorMesh.rotation.y = Math.PI / 12; // 轻微倾斜，呼应Z形设计
        deflectorMesh.castShadow = true;
        pipeGroup.add(deflectorMesh);
    }
    
    /**
     * 创建外部平台和梯子
     */
    createExternalPlatforms() {
        // 根据新的塔体结构调整平台位置
        const platformLevels = [
            { y: 6, radius: 13 },   // 下段（加宽部分）顶部
            { y: 12, radius: 9 },   // 过渡段
            { y: 18, radius: 9 },   // 中段
            { y: 24, radius: 9 },   // 上段中部
            { y: 30, radius: 9 }    // 上段顶部
        ];
        
        platformLevels.forEach((level, index) => {
            // 平台环形结构
            const platformGeometry = new THREE.RingGeometry(level.radius, level.radius + 1.5, 32);
            const platformMesh = new THREE.Mesh(platformGeometry, this.materials.steel);
            platformMesh.position.y = level.y;
            platformMesh.rotation.x = -Math.PI / 2;
            platformMesh.name = `platform_${index}`;
            this.group.add(platformMesh);
            
            // 平台护栏
            const railGeometry = new THREE.TorusGeometry(level.radius + 0.75, 0.05, 8, 32);
            const railMesh = new THREE.Mesh(railGeometry, this.materials.steel);
            railMesh.position.y = level.y + 1;
            railMesh.rotation.x = -Math.PI / 2;
            this.group.add(railMesh);
            
            // 平台支撑
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const supportGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1, 8);
                const supportMesh = new THREE.Mesh(supportGeometry, this.materials.steel);
                supportMesh.position.set(
                    Math.cos(angle) * level.radius,
                    level.y - 0.5,
                    Math.sin(angle) * level.radius
                );
                this.group.add(supportMesh);
            }
        });
        
        // 螺旋梯子 - 适应新的塔体高度
        this.createSpiralLadder();
    }
    
    /**
     * 创建现代化螺旋梯子 - 采用流行的3D设计技术
     */
    createSpiralLadder() {
        // 根据塔的实际高度动态调整楼梯高度
        const towerHeight = this.towerConfig.height;
        const totalHeight = towerHeight * 0.95; // 楼梯高度略低于塔顶，留出维护空间
        const steps = Math.floor(totalHeight * 4); // 根据高度动态计算台阶数量，每米约4个台阶
        const clearance = 4.0; // 增加间隙距离，避开侧搅拌器
        const angleOffset = Math.PI / 4; // 45度偏移，避开搅拌器方向
        
        // 塔体结构参数
        const towerStructure = {
            lowerHeight: 8,      // 下段高度
            transitionHeight: 2, // 过渡段高度
            middleHeight: 10,    // 中段高度
            upperHeight: 12,     // 上段高度
            lowerRadius: 12,     // 下段半径
            middleRadius: 8,     // 中段半径
            upperRadius: 8       // 上段半径
        };
        
        // 现代化材质系统
        const materials = this.createModernLadderMaterials();
        
        // 创建螺旋梯子主体结构
        const ladderGroup = new THREE.Group();
        ladderGroup.name = 'modernSpiralLadder';
        
        // 创建主螺旋支撑结构
        this.createSpiralSupport(ladderGroup, materials, towerStructure, totalHeight, clearance, angleOffset);
        
        // 创建精美台阶
        this.createModernSteps(ladderGroup, materials, towerStructure, steps, totalHeight, clearance, angleOffset);
        
        // 创建流线型扶手系统
        this.createStreamlinedHandrails(ladderGroup, materials, towerStructure, steps, totalHeight, clearance, angleOffset);
        
        // 创建LED照明系统
        this.createLEDLighting(ladderGroup, materials, towerStructure, steps, totalHeight, clearance, angleOffset);
        
        // 创建现代化平台
        this.createModernPlatforms(ladderGroup, materials, towerStructure, totalHeight, clearance, angleOffset);
        
        // 添加安全防护系统
        this.createSafetyFeatures(ladderGroup, materials, towerStructure, totalHeight, clearance, angleOffset);
        
        this.group.add(ladderGroup);
        
        console.log(`[${this.towerConfig.name}] 现代化螺旋梯子创建完成 - 采用流行3D设计技术`);
        console.log(`- 塔体高度: ${towerHeight} m`);
        console.log(`- 楼梯高度: ${totalHeight.toFixed(1)} m（动态适应塔高）`);
        console.log(`- 台阶数量: ${steps} 个（高精度）`);
        console.log(`- 间隙距离: ${clearance} m（避开侧搅拌器）`);
        console.log(`- 角度偏移: ${(angleOffset * 180 / Math.PI).toFixed(1)} 度（避开搅拌器方向）`);
        console.log('- 设计风格: 现代工业美学');
        console.log('- 特色功能: LED照明、流线型扶手、安全防护');
    }
    
    /**
     * 创建现代化梯子材质系统
     */
    createModernLadderMaterials() {
        return {
            // 主结构材质 - 磨砂不锈钢
            primary: new THREE.MeshPhysicalMaterial({
                color: 0xC0C0C0,
                metalness: 0.9,
                roughness: 0.3,
                clearcoat: 0.1,
                clearcoatRoughness: 0.1,
                envMapIntensity: 1.0
            }),
            
            // 台阶材质 - 防滑纹理
            step: new THREE.MeshPhysicalMaterial({
                color: 0x2C3E50,
                metalness: 0.7,
                roughness: 0.6,
                normalScale: new THREE.Vector2(0.5, 0.5),
                envMapIntensity: 0.8
            }),
            
            // 扶手材质 - 抛光不锈钢
            handrail: new THREE.MeshPhysicalMaterial({
                color: 0xE8E8E8,
                metalness: 1.0,
                roughness: 0.1,
                clearcoat: 1.0,
                clearcoatRoughness: 0.0,
                envMapIntensity: 1.2
            }),
            
            // LED材质 - 发光效果
            led: new THREE.MeshBasicMaterial({
                color: 0x00FFFF,
                transparent: true,
                opacity: 0.8,
                emissive: 0x004444,
                emissiveIntensity: 0.5
            }),
            
            // 安全标识材质
            safety: new THREE.MeshPhongMaterial({
                color: 0xFF4500,
                shininess: 100,
                emissive: 0x331100,
                emissiveIntensity: 0.2
            })
        };
    }
    
    /**
     * 创建螺旋主支撑结构
     */
    createSpiralSupport(parentGroup, materials, towerStructure, totalHeight, clearance, angleOffset = 0) {
        const segments = 200; // 高精度分段
        const supportRadius = 0.15; // 支撑管半径
        
        for (let i = 0; i < segments; i++) {
            const t = i / segments;
            const angle = t * Math.PI * 4 + angleOffset; // 两圈螺旋 + 角度偏移
            const height = t * totalHeight;
            
            // 计算当前塔体半径
            const currentTowerRadius = this.getTowerRadiusAtHeight(height, towerStructure);
            const spiralRadius = currentTowerRadius + clearance;
            
            // 创建支撑管段
            const segmentGeometry = new THREE.CylinderGeometry(supportRadius, supportRadius, totalHeight / segments * 1.2, 12);
            const segmentMesh = new THREE.Mesh(segmentGeometry, materials.primary);
            
            segmentMesh.position.set(
                Math.cos(angle) * spiralRadius,
                height,
                Math.sin(angle) * spiralRadius
            );
            
            // 计算切线方向用于旋转
            const nextAngle = ((i + 1) / segments) * Math.PI * 4 + angleOffset;
            const nextHeight = ((i + 1) / segments) * totalHeight;
            const direction = new THREE.Vector3(
                Math.cos(nextAngle) * spiralRadius - Math.cos(angle) * spiralRadius,
                nextHeight - height,
                Math.sin(nextAngle) * spiralRadius - Math.sin(angle) * spiralRadius
            ).normalize();
            
            segmentMesh.lookAt(
                segmentMesh.position.x + direction.x,
                segmentMesh.position.y + direction.y,
                segmentMesh.position.z + direction.z
            );
            segmentMesh.rotateX(Math.PI / 2);
            
            segmentMesh.name = `spiralSupport_${i}`;
            parentGroup.add(segmentMesh);
        }
    }
    
    /**
     * 创建现代化台阶
     */
    createModernSteps(parentGroup, materials, towerStructure, steps, totalHeight, clearance, angleOffset = 0) {
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * Math.PI * 4 + angleOffset;
            const height = (i / steps) * totalHeight;
            
            const currentTowerRadius = this.getTowerRadiusAtHeight(height, towerStructure);
            const ladderRadius = currentTowerRadius + clearance;
            
            // 创建梯形台阶（更符合人体工程学）
            const stepGeometry = new THREE.BoxGeometry(2.2, 0.15, 0.8);
            // 添加倒角效果
            stepGeometry.vertices?.forEach(vertex => {
                if (Math.abs(vertex.y) > 0.05) {
                    vertex.x *= 0.95;
                    vertex.z *= 0.95;
                }
            });
            
            const stepMesh = new THREE.Mesh(stepGeometry, materials.step);
            stepMesh.position.set(
                Math.cos(angle) * ladderRadius,
                height,
                Math.sin(angle) * ladderRadius
            );
            stepMesh.rotation.y = angle;
            stepMesh.castShadow = true;
            stepMesh.receiveShadow = true;
            stepMesh.name = `modernStep_${i}`;
            
            // 添加防滑条纹
            this.addAntiSlipTexture(stepMesh, materials);
            
            parentGroup.add(stepMesh);
            
            // 台阶支撑臂
            const armGeometry = new THREE.BoxGeometry(0.2, 0.8, 0.15);
            const armMesh = new THREE.Mesh(armGeometry, materials.primary);
            armMesh.position.set(
                Math.cos(angle) * (currentTowerRadius + clearance * 0.3),
                height - 0.3,
                Math.sin(angle) * (currentTowerRadius + clearance * 0.3)
            );
            armMesh.rotation.y = angle;
            armMesh.rotation.z = Math.PI / 6; // 倾斜角度
            armMesh.name = `stepArm_${i}`;
            parentGroup.add(armMesh);
        }
    }
    
    /**
     * 创建流线型扶手系统
     */
    createStreamlinedHandrails(parentGroup, materials, towerStructure, steps, totalHeight, clearance, angleOffset = 0) {
        const handrailPoints = [];
        const innerRailPoints = [];
        
        // 生成扶手路径点
        for (let i = 0; i <= steps; i++) {
            const angle = (i / steps) * Math.PI * 4 + angleOffset;
            const height = (i / steps) * totalHeight;
            const currentTowerRadius = this.getTowerRadiusAtHeight(height, towerStructure);
            const ladderRadius = currentTowerRadius + clearance;
            
            // 外侧扶手
            handrailPoints.push(new THREE.Vector3(
                Math.cos(angle) * (ladderRadius + 1.2),
                height + 1.0,
                Math.sin(angle) * (ladderRadius + 1.2)
            ));
            
            // 内侧扶手
            innerRailPoints.push(new THREE.Vector3(
                Math.cos(angle) * (ladderRadius - 0.3),
                height + 1.0,
                Math.sin(angle) * (ladderRadius - 0.3)
            ));
        }
        
        // 创建流线型扶手管道
        this.createSmoothHandrail(parentGroup, handrailPoints, materials.handrail, 'outerHandrail');
        this.createSmoothHandrail(parentGroup, innerRailPoints, materials.handrail, 'innerHandrail');
        
        // 添加扶手连接支撑
        for (let i = 0; i < steps; i += 8) {
            const angle = (i / steps) * Math.PI * 4 + angleOffset;
            const height = (i / steps) * totalHeight;
            const currentTowerRadius = this.getTowerRadiusAtHeight(height, towerStructure);
            const ladderRadius = currentTowerRadius + clearance;
            
            const supportGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.5, 8);
            const supportMesh = new THREE.Mesh(supportGeometry, materials.primary);
            supportMesh.position.set(
                Math.cos(angle) * (ladderRadius + 0.45),
                height + 0.25,
                Math.sin(angle) * (ladderRadius + 0.45)
            );
            supportMesh.rotation.z = Math.PI / 2;
            supportMesh.rotation.y = angle;
            supportMesh.name = `handrailSupport_${i}`;
            parentGroup.add(supportMesh);
        }
    }
    
    /**
     * 创建LED照明系统
     */
    createLEDLighting(parentGroup, materials, towerStructure, steps, totalHeight, clearance, angleOffset = 0) {
        for (let i = 0; i < steps; i += 6) { // 每6个台阶一个LED
            const angle = (i / steps) * Math.PI * 4 + angleOffset;
            const height = (i / steps) * totalHeight;
            const currentTowerRadius = this.getTowerRadiusAtHeight(height, towerStructure);
            const ladderRadius = currentTowerRadius + clearance;
            
            // LED灯条
            const ledGeometry = new THREE.BoxGeometry(0.8, 0.05, 0.1);
            const ledMesh = new THREE.Mesh(ledGeometry, materials.led);
            ledMesh.position.set(
                Math.cos(angle) * (ladderRadius + 0.1),
                height - 0.1,
                Math.sin(angle) * (ladderRadius + 0.1)
            );
            ledMesh.rotation.y = angle;
            ledMesh.name = `ledLight_${i}`;
            
            // 添加点光源
            const pointLight = new THREE.PointLight(0x00FFFF, 0.3, 3);
            pointLight.position.copy(ledMesh.position);
            pointLight.position.y += 0.1;
            ledMesh.add(pointLight);
            
            parentGroup.add(ledMesh);
        }
    }
    
    /**
     * 创建现代化平台
     */
    createModernPlatforms(parentGroup, materials, towerStructure, totalHeight, clearance, angleOffset = 0) {
        // 底部平台 - 六边形设计
        const basePlatformRadius = towerStructure.lowerRadius + clearance + 1.5;
        const basePlatformGeometry = new THREE.CylinderGeometry(basePlatformRadius, basePlatformRadius, 0.4, 6);
        const basePlatformMesh = new THREE.Mesh(basePlatformGeometry, materials.primary);
        basePlatformMesh.position.y = 0.2;
        basePlatformMesh.name = 'modernBasePlatform';
        basePlatformMesh.castShadow = true;
        basePlatformMesh.receiveShadow = true;
        parentGroup.add(basePlatformMesh);
        
        // 顶部平台 - 圆形设计
        const topPlatformRadius = towerStructure.upperRadius + clearance + 1.5;
        const topPlatformGeometry = new THREE.CylinderGeometry(topPlatformRadius, topPlatformRadius, 0.4, 32);
        const topPlatformMesh = new THREE.Mesh(topPlatformGeometry, materials.primary);
        topPlatformMesh.position.y = totalHeight + 0.2;
        topPlatformMesh.name = 'modernTopPlatform';
        topPlatformMesh.castShadow = true;
        topPlatformMesh.receiveShadow = true;
        parentGroup.add(topPlatformMesh);
        
        // 中间休息平台
        const midHeight = totalHeight / 2;
        const midTowerRadius = this.getTowerRadiusAtHeight(midHeight, towerStructure);
        const midPlatformRadius = midTowerRadius + clearance + 1.0;
        const midPlatformGeometry = new THREE.CylinderGeometry(midPlatformRadius, midPlatformRadius, 0.3, 8);
        const midPlatformMesh = new THREE.Mesh(midPlatformGeometry, materials.primary);
        midPlatformMesh.position.y = midHeight;
        midPlatformMesh.name = 'modernMidPlatform';
        midPlatformMesh.castShadow = true;
        midPlatformMesh.receiveShadow = true;
        parentGroup.add(midPlatformMesh);
    }
    
    /**
     * 添加安全防护系统
     */
    createSafetyFeatures(parentGroup, materials, towerStructure, totalHeight, clearance, angleOffset = 0) {
        // 安全标识牌
        const signPositions = [
            { height: 2, text: 'SAFETY FIRST' },
            { height: totalHeight / 2, text: 'REST AREA' },
            { height: totalHeight - 2, text: 'TOP LEVEL' }
        ];
        
        signPositions.forEach((sign, index) => {
            const signGeometry = new THREE.BoxGeometry(1.5, 0.8, 0.1);
            const signMesh = new THREE.Mesh(signGeometry, materials.safety);
            
            const currentTowerRadius = this.getTowerRadiusAtHeight(sign.height, towerStructure);
            const signRadius = currentTowerRadius + clearance + 2.0;
            
            signMesh.position.set(signRadius, sign.height, 0);
            signMesh.rotation.y = -Math.PI / 2;
            signMesh.name = `safetySign_${index}`;
            parentGroup.add(signMesh);
        });
        
        // 紧急停止按钮
        const emergencyButtonGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.1, 16);
        const emergencyButtonMesh = new THREE.Mesh(emergencyButtonGeometry, materials.safety);
        emergencyButtonMesh.position.set(
            towerStructure.lowerRadius + clearance + 2.5,
            5,
            0
        );
        emergencyButtonMesh.name = 'emergencyButton';
        parentGroup.add(emergencyButtonMesh);
    }
    
    /**
     * 辅助方法：根据高度获取塔体半径
     */
    getTowerRadiusAtHeight(height, towerStructure) {
        if (height <= towerStructure.lowerHeight) {
            return towerStructure.lowerRadius;
        } else if (height <= towerStructure.lowerHeight + towerStructure.transitionHeight) {
            const progress = (height - towerStructure.lowerHeight) / towerStructure.transitionHeight;
            return towerStructure.lowerRadius + (towerStructure.middleRadius - towerStructure.lowerRadius) * progress;
        } else if (height <= towerStructure.lowerHeight + towerStructure.transitionHeight + towerStructure.middleHeight) {
            return towerStructure.middleRadius;
        } else {
            return towerStructure.upperRadius;
        }
    }
    
    /**
     * 创建平滑扶手
     */
    createSmoothHandrail(parentGroup, points, material, name) {
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, 200, 0.08, 12, false);
        const tubeMesh = new THREE.Mesh(tubeGeometry, material);
        tubeMesh.name = name;
        tubeMesh.castShadow = true;
        parentGroup.add(tubeMesh);
    }
    
    /**
     * 添加防滑纹理
     */
    addAntiSlipTexture(stepMesh, materials) {
        // 创建防滑条纹
        for (let i = 0; i < 5; i++) {
            const stripeGeometry = new THREE.BoxGeometry(1.8, 0.02, 0.05);
            const stripeMesh = new THREE.Mesh(stripeGeometry, materials.safety);
            stripeMesh.position.set(0, 0.08, -0.3 + i * 0.15);
            stepMesh.add(stripeMesh);
        }
    }
    
    /**
     * 创建外部仪表和标识
     */
    createExternalInstruments() {
        // 压力表
        const gaugeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.2, 16);
        const gaugeMesh = new THREE.Mesh(gaugeGeometry, this.materials.steel);
        gaugeMesh.position.set(8.5, 15, 0);
        gaugeMesh.rotation.z = Math.PI / 2;
        this.group.add(gaugeMesh);
        
        // 温度计
        const thermometerGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
        const thermometerMesh = new THREE.Mesh(thermometerGeometry, this.materials.pipe);
        thermometerMesh.position.set(8.2, 20, 0);
        this.group.add(thermometerMesh);
    }
    
    /**
     * 在蓝色圆柱上方创建水池
     */
    createWaterPoolOnTop(parentGroup) {
        const waterPoolGroup = new THREE.Group();
        waterPoolGroup.name = 'waterPoolOnTop';
        
        // 蓝色圆柱体参数：半径7m，高度2m，位置y=1，顶部在y=2
        // 水池参数：半径6m（略小于蓝色圆柱），高度1m，紧贴蓝色圆柱顶部
        const poolRadius = 6;    // 半径6m，比蓝色圆柱略小
        const poolHeight = 1;    // 高度1m
        const poolY = 2.5;       // 位置：蓝色圆柱顶部(y=2) + 水池高度的一半(0.5)
        
        console.log('创建内部水池 - 参数:');
        console.log('- 半径:', poolRadius, 'm (直径', poolRadius * 2, 'm)');
        console.log('- 高度:', poolHeight, 'm');
        console.log('- Y位置:', poolY, '(紧贴蓝色圆柱顶部)');
        
        // 创建水池主体
        const poolGeometry = new THREE.CylinderGeometry(poolRadius, poolRadius, poolHeight, 32);
        const poolMesh = new THREE.Mesh(poolGeometry, this.materials.water);
        poolMesh.position.y = poolY;
        poolMesh.receiveShadow = true;
        poolMesh.name = 'waterPoolBody';
        waterPoolGroup.add(poolMesh);
        
        // 创建主水面（用于波动动画）
        const waterSurfaceGeometry = new THREE.PlaneGeometry(poolRadius * 2, poolRadius * 2, 64, 64);
        const waterSurfaceMesh = new THREE.Mesh(waterSurfaceGeometry, this.materials.water);
        waterSurfaceMesh.rotation.x = -Math.PI / 2; // 水平放置
        waterSurfaceMesh.position.y = poolY + poolHeight / 2; // 水池顶部
        waterSurfaceMesh.name = 'waterSurface';
        waterPoolGroup.add(waterSurfaceMesh);
        
        // 创建流动粒子系统
        this.createWaterFlowParticles(waterPoolGroup, poolRadius, poolY + poolHeight / 2);
        
        // 创建涡流效果
        this.createWaterVortex(waterPoolGroup, poolRadius, poolY + poolHeight / 2);
        
        // 创建水流纹理效果
        this.createWaterFlowTexture(waterPoolGroup, poolRadius, poolY + poolHeight / 2);
        
        // 存储水面网格供动画使用
        this.waterSurface = waterSurfaceMesh;
        
        // 添加到父组件
        parentGroup.add(waterPoolGroup);
        
        // 注册组件
        this.components.set('waterPoolOnTop', waterPoolGroup);
        
        console.log('内部水池创建完成 - 位置: y=' + (poolY - poolHeight/2) + ' 到 y=' + (poolY + poolHeight/2));
    }
    
    /**
     * 创建水流粒子系统
     */
    createWaterFlowParticles(parentGroup, radius, yPos) {
        const particleCount = 200;
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        // 初始化粒子位置和速度
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const r = Math.random() * radius * 0.8;
            
            positions[i * 3] = Math.cos(angle) * r;
            positions[i * 3 + 1] = 0;
            positions[i * 3 + 2] = Math.sin(angle) * r;
            
            // 设置旋转速度（顺时针流动）
            velocities[i * 3] = -Math.sin(angle) * 0.5;
            velocities[i * 3 + 1] = 0;
            velocities[i * 3 + 2] = Math.cos(angle) * 0.5;
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x87CEEB,
            size: 0.1,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending
        });
        
        const particles = new THREE.Points(particleGeometry, particleMaterial);
        particles.position.y = yPos + 0.02; // 略高于水面
        particles.name = 'waterFlowParticles';
        
        // 存储速度数据供动画使用
        particles.userData.velocities = velocities;
        particles.userData.radius = radius;
        
        parentGroup.add(particles);
        this.waterFlowParticles = particles;
    }
    
    /**
     * 创建涡流效果
     */
    createWaterVortex(parentGroup, radius, yPos) {
        const vortexGroup = new THREE.Group();
        vortexGroup.name = 'waterVortex';
        
        // 创建多个同心圆环表示涡流
        for (let i = 0; i < 5; i++) {
            const ringRadius = radius * 0.2 + i * radius * 0.15;
            const ringGeometry = new THREE.RingGeometry(ringRadius - 0.1, ringRadius + 0.1, 32);
            const ringMaterial = new THREE.MeshBasicMaterial({
                color: 0x4169E1,
                transparent: true,
                opacity: 0.3 - i * 0.05,
                side: THREE.DoubleSide
            });
            
            const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
            ringMesh.rotation.x = -Math.PI / 2;
            ringMesh.position.y = yPos + 0.01;
            ringMesh.name = `vortexRing_${i}`;
            vortexGroup.add(ringMesh);
        }
        
        vortexGroup.position.y = 0;
        parentGroup.add(vortexGroup);
        this.waterVortex = vortexGroup;
    }
    
    /**
     * 创建水流纹理效果
     */
    createWaterFlowTexture(parentGroup, radius, yPos) {
        // 创建流线效果
        const streamCount = 8;
        const streamGroup = new THREE.Group();
        streamGroup.name = 'waterStreams';
        
        for (let i = 0; i < streamCount; i++) {
            const angle = (i / streamCount) * Math.PI * 2;
            const streamGeometry = new THREE.CylinderGeometry(0.05, 0.05, radius * 1.5, 8);
            const streamMaterial = new THREE.MeshBasicMaterial({
                color: 0x00BFFF,
                transparent: true,
                opacity: 0.4
            });
            
            const streamMesh = new THREE.Mesh(streamGeometry, streamMaterial);
            streamMesh.position.set(
                Math.cos(angle) * radius * 0.3,
                yPos + 0.005,
                Math.sin(angle) * radius * 0.3
            );
            streamMesh.rotation.x = Math.PI / 2;
            streamMesh.rotation.z = angle;
            streamMesh.name = `waterStream_${i}`;
            
            streamGroup.add(streamMesh);
        }
        
        parentGroup.add(streamGroup);
        this.waterStreams = streamGroup;
    }
    
    /**
     * 创建入口点标识 - 明显的可点击区域 (已删除)
     */
    /*
    createEntryPoint() {
        // 创建发光的入口标识
        const entryGroup = new THREE.Group();
        entryGroup.name = 'entryPoint';
        
        // 主入口圆环
        const ringGeometry = new THREE.TorusGeometry(2, 0.3, 8, 32);
        const ringMaterial = new THREE.MeshPhongMaterial({
            color: 0x00FF00,
            emissive: 0x004400,
            transparent: true,
            opacity: 0.8
        });
        const ringMesh = new THREE.Mesh(ringGeometry, ringMaterial);
        ringMesh.position.set(0, 15, 8.5);
        ringMesh.rotation.x = Math.PI / 2;
        entryGroup.add(ringMesh);
        
        // 入口箭头指示
        const arrowGeometry = new THREE.ConeGeometry(0.5, 1.5, 8);
        const arrowMaterial = new THREE.MeshPhongMaterial({
            color: 0x00FF00,
            emissive: 0x002200
        });
        const arrowMesh = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrowMesh.position.set(0, 15, 7);
        arrowMesh.rotation.x = -Math.PI / 2;
        entryGroup.add(arrowMesh);
        
        // 文字标识
        const textGeometry = new THREE.PlaneGeometry(3, 1);
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 64;
        const context = canvas.getContext('2d');
        context.fillStyle = '#00FF00';
        context.font = 'bold 24px Arial';
        context.textAlign = 'center';
        context.fillText('点击进入内部', 128, 40);
        
        const textTexture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: textTexture,
            transparent: true,
            opacity: 0.9
        });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 13, 8.5);
        entryGroup.add(textMesh);
        
        // 添加脉动动画
        this.animateEntryPoint(entryGroup);
        
        this.group.add(entryGroup);
        this.components.set('entryPoint', entryGroup);
    }
    */
    
    /**
     * 入口点脉动动画 (已删除)
     */
    /*
    animateEntryPoint(entryGroup) {
        const animate = () => {
            const time = Date.now() * 0.003;
            const scale = 1 + Math.sin(time) * 0.2;
            entryGroup.scale.setScalar(scale);
            
            // 改变发光强度
            entryGroup.children.forEach(child => {
                if (child.material && child.material.emissive) {
                    const intensity = 0.3 + Math.sin(time * 2) * 0.2;
                    child.material.emissive.setScalar(intensity);
                }
            });
            
            requestAnimationFrame(animate);
        };
        animate();
    }
    */
    
    /**
     * 创建内部组件 - 精细化设计
     */
    createInteriorComponents() {
        this.interiorGroup.name = 'interior';
        
        const config = this.config?.towerConfig?.components || {};
        
        // 创建喷淋层系统 - 确保使用正确的三层配置
        this.createSprayLayers(config.sprayLayers || {});
        
        // 创建除雾器
        const demisterGroup = this.createDemisters(config.demisters);
        this.components.set('demisters', demisterGroup);
        this.interiorGroup.add(demisterGroup);
        
        // 创建合金多孔托盘（根据配置决定是否创建）
        if (this.towerConfig.hasTrays) {
            this.createAlloyPerforatedTray();
        }
        
        // 创建湿式电除尘装置（根据配置决定是否创建）
        if (this.towerConfig.hasWetESP) {
            this.createWetESP();
        }
        
        // 创建内部支撑结构
        this.createInternalSupports(config.internalSupports);
        
        // 创建液体收集系统
        this.createLiquidCollection(config.liquidCollection);
        
        // 创建工艺管道
        this.createProcessPipes(config.processPipes);
        
        // 创建组件名称标注
        this.createComponentLabels();
        
        this.group.add(this.interiorGroup);
        this.interiorGroup.visible = false;
        
        console.log(`[${this.towerConfig.name}] 内部组件创建完成`);
        console.log(`- 托盘: ${this.towerConfig.hasTrays ? '启用' : '禁用'}`);
        console.log(`- 湿式电除尘: ${this.towerConfig.hasWetESP ? '启用' : '禁用'}`);
    }
    
    /**
     * 创建湿式电除尘装置 (Wet ESP)
     * 安装在塔顶部，用于高效去除细小颗粒物
     */
    createWetESP() {
        console.log(`[${this.towerConfig.name}] 开始创建湿式电除尘装置...`);
        
        const wetESPGroup = new THREE.Group();
        wetESPGroup.name = 'wetESP';
        
        const towerHeight = this.towerConfig.height;
        const radius = this.towerConfig.upperRadius;
        
        // 计算除尘器位置：将其整合到塔内部，位于管式除雾器上方（最上层处理设备）
        // 现在二级塔正确的工艺流程：屋脊式除雾器(28m) → 管式除雾器(35m) → 湿式电除尘器(42m)
        const upperTubePosition = this.towerConfig.hasWetESP ? 35 : 28; // 二级塔管式除雾器35米，一级塔屋脊式28米
        const tubeFrameHeight = 2.5; // 管式除雾器实际高度
        const tubeTopHeight = upperTubePosition + tubeFrameHeight/2; // 管式除雾器顶部位置：36.25米
        const espHeight = 6; // ESP高度
        // 将除尘器放置在管式除雾器上方，作为最终处理设备
        const clearanceGap = 1.0; // 除雾器与除尘器之间的间隙
        const espCenterHeight = tubeTopHeight + clearanceGap + espHeight/2; // 约42.75米
        
        // === 湿式电除尘装置主体结构 ===
        
        // 1. 外壳圆筒
        const housingGeometry = new THREE.CylinderGeometry(radius - 0.5, radius - 0.5, espHeight, 32);
        const housingMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x2C3E50,
            metalness: 0.8,
            roughness: 0.3,
            clearcoat: 0.1,
            transparent: true,
            opacity: 0.7
        });
        const housingMesh = new THREE.Mesh(housingGeometry, housingMaterial);
        housingMesh.position.y = espCenterHeight; // 位于塔内部，除雾器下方
        housingMesh.name = 'espHousing';
        wetESPGroup.add(housingMesh);
        
        // 2. 放电极板系统（蜂窝状电极板）
        const plateCount = 24; // 环形排列的电极板数量
        for (let i = 0; i < plateCount; i++) {
            const angle = (i / plateCount) * Math.PI * 2;
            const plateRadius = radius - 1.5;
            
            // 放电极板
            const plateGeometry = new THREE.BoxGeometry(0.1, espHeight - 1.5, 1.2);
            const plateMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x708090,
                metalness: 0.9,
                roughness: 0.1,
                envMapIntensity: 1.0
            });
            const plateMesh = new THREE.Mesh(plateGeometry, plateMaterial);
            plateMesh.position.set(
                Math.cos(angle) * plateRadius,
                espCenterHeight,
                Math.sin(angle) * plateRadius
            );
            plateMesh.rotation.y = angle;
            plateMesh.name = `dischargePlate_${i}`;
            wetESPGroup.add(plateMesh);
            
            // 收集极板（稍大一些）
            const collectorGeometry = new THREE.BoxGeometry(0.15, espHeight - 1.5, 1.5);
            const collectorMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x4682B4,
                metalness: 0.8,
                roughness: 0.2,
                envMapIntensity: 0.8
            });
            const collectorMesh = new THREE.Mesh(collectorGeometry, collectorMaterial);
            collectorMesh.position.set(
                Math.cos(angle) * (plateRadius + 0.5),
                espCenterHeight,
                Math.sin(angle) * (plateRadius + 0.5)
            );
            collectorMesh.rotation.y = angle;
            collectorMesh.name = `collectorPlate_${i}`;
            wetESPGroup.add(collectorMesh);
        }
        
        // 3. 高压电源系统
        const powerSupplyGeometry = new THREE.BoxGeometry(2, 1.5, 1);
        const powerSupplyMaterial = new THREE.MeshPhysicalMaterial({
            color: 0xFF4500,
            metalness: 0.6,
            roughness: 0.4
        });
        const powerSupplyMesh = new THREE.Mesh(powerSupplyGeometry, powerSupplyMaterial);
        powerSupplyMesh.position.set(radius + 1, espCenterHeight, 0);
        powerSupplyMesh.name = 'powerSupply';
        wetESPGroup.add(powerSupplyMesh);
        
        // 4. 高压电缆
        const cableGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const cableMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const cableMesh = new THREE.Mesh(cableGeometry, cableMaterial);
        cableMesh.position.set(radius - 0.5, espCenterHeight, 0);
        cableMesh.rotation.z = Math.PI / 2;
        cableMesh.name = 'highVoltageCable';
        wetESPGroup.add(cableMesh);
        
        // 5. 喷水系统（湿式特点）
        const sprayRingGeometry = new THREE.TorusGeometry(radius - 1, 0.1, 8, 32);
        const sprayRingMaterial = new THREE.MeshPhongMaterial({ 
            color: 0x00CED1,
            transparent: true,
            opacity: 0.8
        });
        const sprayRingMesh = new THREE.Mesh(sprayRingGeometry, sprayRingMaterial);
        sprayRingMesh.position.y = espCenterHeight + espHeight/2 - 0.5; // 顶部喷淋
        sprayRingMesh.rotation.x = -Math.PI / 2;
        sprayRingMesh.name = 'sprayRing';
        wetESPGroup.add(sprayRingMesh);
        
        // 6. 喷淋水管
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const sprayPipeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1, 8);
            const sprayPipeMesh = new THREE.Mesh(sprayPipeGeometry, sprayRingMaterial);
            sprayPipeMesh.position.set(
                Math.cos(angle) * (radius - 1),
                espCenterHeight + espHeight/2,
                Math.sin(angle) * (radius - 1)
            );
            sprayPipeMesh.name = `sprayPipe_${i}`;
            wetESPGroup.add(sprayPipeMesh);
        }
        
        // 7. 液体收集槽
        const collectionTroughGeometry = new THREE.TorusGeometry(radius - 0.8, 0.2, 8, 32);
        const collectionTroughMaterial = new THREE.MeshPhongMaterial({ color: 0x708090 });
        const collectionTroughMesh = new THREE.Mesh(collectionTroughGeometry, collectionTroughMaterial);
        collectionTroughMesh.position.y = espCenterHeight - espHeight/2 + 0.5; // 位于除尘器底部内侧
        collectionTroughMesh.rotation.x = -Math.PI / 2;
        collectionTroughMesh.name = 'collectionTrough';
        wetESPGroup.add(collectionTroughMesh);
        
        // 8. 支撑框架
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const supportGeometry = new THREE.CylinderGeometry(0.1, 0.1, espHeight, 8);
            const supportMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
            const supportMesh = new THREE.Mesh(supportGeometry, supportMaterial);
            supportMesh.position.set(
                Math.cos(angle) * (radius - 0.3),
                espCenterHeight,
                Math.sin(angle) * (radius - 0.3)
            );
            supportMesh.name = `support_${i}`;
            wetESPGroup.add(supportMesh);
        }
        
        // 9. 控制面板
        const controlPanelGeometry = new THREE.BoxGeometry(1, 0.8, 0.2);
        const controlPanelMaterial = new THREE.MeshPhongMaterial({ color: 0x2F4F4F });
        const controlPanelMesh = new THREE.Mesh(controlPanelGeometry, controlPanelMaterial);
        controlPanelMesh.position.set(radius + 1, espCenterHeight - 2, 1);
        controlPanelMesh.name = 'controlPanel';
        wetESPGroup.add(controlPanelMesh);
        
        // 10. 指示灯
        const indicatorGeometry = new THREE.SphereGeometry(0.05, 8, 8);
        const indicatorMaterials = [
            new THREE.MeshBasicMaterial({ color: 0x00FF00, emissive: 0x004400 }), // 绿色 - 运行
            new THREE.MeshBasicMaterial({ color: 0xFF0000, emissive: 0x440000 }), // 红色 - 报警
            new THREE.MeshBasicMaterial({ color: 0xFFFF00, emissive: 0x444400 })  // 黄色 - 维护
        ];
        
        for (let i = 0; i < 3; i++) {
            const indicatorMesh = new THREE.Mesh(indicatorGeometry, indicatorMaterials[i]);
            indicatorMesh.position.set(radius + 1, espCenterHeight - 1.8 - i * 0.2, 1.1);
            indicatorMesh.name = `indicator_${i}`;
            wetESPGroup.add(indicatorMesh);
        }
        
        // 11. 湿式电除尘器观察口系统（用于巡检观察）
        this.createESPObservationPorts(wetESPGroup, radius, espCenterHeight, espHeight);
        
        // 添加到组件映射和内部组
        this.components.set('wetESP', wetESPGroup);
        this.interiorGroup.add(wetESPGroup);
        
        console.log(`[${this.towerConfig.name}] 湿式电除尘装置创建完成`);
        console.log('- 电极板数量:', plateCount);
        console.log('- 安装位置: 塔顶部');
        console.log('- 特殊功能: 高效除尘、喷淋清洗');
        console.log('- 观察口数量: 6个（用于巡检观察）');
    }
    
    /**
     * 创建湿式电除尘器观察口系统
     * @param {THREE.Group} parentGroup - 父组
     * @param {number} radius - 除尘器半径
     * @param {number} centerHeight - 中心高度
     * @param {number} espHeight - 除尘器高度
     */
    createESPObservationPorts(parentGroup, radius, centerHeight, espHeight) {
        const portCount = 6; // 6个观察口，均匀分布
        const portRadius = 0.4; // 观察口半径
        const portDepth = 0.3; // 观察口深度
        
        for (let i = 0; i < portCount; i++) {
            const angle = (i / portCount) * Math.PI * 2;
            const portGroup = new THREE.Group();
            
            // 观察口外框（不锈钢材质）
            const frameGeometry = new THREE.CylinderGeometry(portRadius + 0.1, portRadius + 0.1, portDepth, 16);
            const frameMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xC0C0C0,
                metalness: 0.9,
                roughness: 0.3,
                clearcoat: 0.1
            });
            const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
            frameMesh.rotation.z = Math.PI / 2;
            portGroup.add(frameMesh);
            
            // 观察口玻璃窗（钢化玻璃）
            const glassGeometry = new THREE.CylinderGeometry(portRadius - 0.05, portRadius - 0.05, 0.05, 16);
            const glassMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.2,
                transmission: 0.9,
                roughness: 0.0,
                metalness: 0.0,
                clearcoat: 1.0,
                clearcoatRoughness: 0.0,
                ior: 1.5
            });
            const glassMesh = new THREE.Mesh(glassGeometry, glassMaterial);
            glassMesh.rotation.z = Math.PI / 2;
            glassMesh.position.x = portDepth / 2 - 0.025;
            portGroup.add(glassMesh);
            
            // 观察口法兰盘
            const flangeGeometry = new THREE.CylinderGeometry(portRadius + 0.2, portRadius + 0.2, 0.1, 16);
            const flangeMaterial = new THREE.MeshPhongMaterial({
                color: 0x696969,
                shininess: 50
            });
            const flangeMesh = new THREE.Mesh(flangeGeometry, flangeMaterial);
            flangeMesh.rotation.z = Math.PI / 2;
            flangeMesh.position.x = portDepth / 2 + 0.05;
            portGroup.add(flangeMesh);
            
            // 螺栓装饰（8个螺栓）
            for (let j = 0; j < 8; j++) {
                const boltAngle = (j / 8) * Math.PI * 2;
                const boltGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.12, 8);
                const boltMaterial = new THREE.MeshPhongMaterial({ color: 0x404040 });
                const boltMesh = new THREE.Mesh(boltGeometry, boltMaterial);
                boltMesh.position.set(
                    portDepth / 2 + 0.05,
                    Math.cos(boltAngle) * (portRadius + 0.15),
                    Math.sin(boltAngle) * (portRadius + 0.15)
                );
                boltMesh.rotation.x = Math.PI / 2;
                portGroup.add(boltMesh);
            }
            
            // 观察口标识牌
            const labelGeometry = new THREE.PlaneGeometry(0.8, 0.3);
            const labelMaterial = new THREE.MeshPhongMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.9
            });
            const labelMesh = new THREE.Mesh(labelGeometry, labelMaterial);
            labelMesh.position.set(portDepth / 2 + 0.12, -portRadius - 0.4, 0);
            labelMesh.rotation.y = Math.PI / 2;
            portGroup.add(labelMesh);
            
            // 观察口照明LED
            const ledGeometry = new THREE.SphereGeometry(0.05, 8, 8);
            const ledMaterial = new THREE.MeshBasicMaterial({
                color: 0xFFFFFF,
                emissive: 0x444444,
                emissiveIntensity: 0.3
            });
            const ledMesh = new THREE.Mesh(ledGeometry, ledMaterial);
            ledMesh.position.set(portDepth / 2 + 0.08, portRadius + 0.2, 0);
            portGroup.add(ledMesh);
            
            // 定位观察口
            portGroup.position.set(
                Math.cos(angle) * (radius - 0.25),
                centerHeight + espHeight * 0.3, // 位于除尘器上部
                Math.sin(angle) * (radius - 0.25)
            );
            portGroup.rotation.y = angle;
            portGroup.name = `observationPort_${i}`;
            
            parentGroup.add(portGroup);
        }
        
        console.log(`湿式电除尘器观察口系统创建完成 - ${portCount}个观察口`);
    }
    
    /**
     * 增强塔体外观 - 使其更符合工业实际（适用于一级塔和二级塔）
     */
    enhanceTowerAppearance() {
        const towerType = this.towerConfig.hasWetESP ? '二级塔' : '一级塔';
        console.log(`[${this.towerConfig.name}] 开始美化${towerType}外观...`);
        
        const beautificationGroup = new THREE.Group();
        beautificationGroup.name = 'towerBeautification';
        
        // 1. 工业级外表面包覆（保温层）
        this.createInsulationLayer(beautificationGroup);
        
        // 2. 外部工业管道系统
        this.createExternalPipingSystem(beautificationGroup);
        
        // 3. 工业安全标识系统
        this.createIndustrialSafetySigns(beautificationGroup);
        
        // 4. 高级工业照明系统
        this.createAdvancedLightingSystem(beautificationGroup);
        
        // 5. 维护检修平台系统
        this.createMaintenancePlatforms(beautificationGroup);
        
        // 6. 工业监控系统
        this.createMonitoringSystem(beautificationGroup);
        
        // 7. 防腐防护系统
        this.createCorrosionProtection(beautificationGroup);
        
        this.group.add(beautificationGroup);
        
        console.log(`[${this.towerConfig.name}] ${towerType}外观美化完成`);
        console.log('- 新增功能: 保温层、外部管道、安全标识、高级照明');
        console.log('- 维护设施: 检修平台、监控系统、防腐保护');
        console.log('- 外观级别: 工业标准化设计');
    }
    
    /**
     * 创建工业级保温包覆层
     */
    createInsulationLayer(parentGroup) {
        const towerHeight = this.towerConfig.height;
        const segments = 10; // 分段包覆
        
        for (let i = 0; i < segments; i++) {
            const segmentHeight = towerHeight / segments;
            const y = i * segmentHeight + segmentHeight / 2;
            
            // 计算当前高度的塔体半径
            let radius;
            if (y < 8) {
                radius = 12; // 下段
            } else if (y < 20) {
                radius = 8 + (12 - 8) * (20 - y) / 12; // 过渡段
            } else {
                radius = 8; // 上段
            }
            
            // 保温层外壳
            const insulationGeometry = new THREE.CylinderGeometry(
                radius + 0.3, radius + 0.3, segmentHeight * 0.9, 32
            );
            const insulationMaterial = new THREE.MeshPhysicalMaterial({
                color: 0xE0E0E0,
                metalness: 0.1,
                roughness: 0.8,
                clearcoat: 0.0,
                envMapIntensity: 0.3
            });
            const insulationMesh = new THREE.Mesh(insulationGeometry, insulationMaterial);
            insulationMesh.position.y = y;
            insulationMesh.name = `insulationLayer_${i}`;
            
            // 添加包覆层接缝线
            const seamGeometry = new THREE.TorusGeometry(radius + 0.31, 0.02, 8, 32);
            const seamMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
            const seamMesh = new THREE.Mesh(seamGeometry, seamMaterial);
            seamMesh.position.y = y + segmentHeight / 2;
            seamMesh.rotation.x = -Math.PI / 2;
            
            parentGroup.add(insulationMesh);
            parentGroup.add(seamMesh);
        }
    }
    
    /**
     * 创建外部工业管道系统
     */
    createExternalPipingSystem(parentGroup) {
        const towerHeight = this.towerConfig.height;
        
        // 主要外部管道（垂直走向）
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const pipeRadius = 0.15;
            const pipeDistance = 13.5; // 距离塔中心
            
            const pipeGeometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, towerHeight * 0.8, 12);
            const pipeMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x4169E1,
                metalness: 0.8,
                roughness: 0.3,
                clearcoat: 0.2
            });
            const pipeMesh = new THREE.Mesh(pipeGeometry, pipeMaterial);
            pipeMesh.position.set(
                Math.cos(angle) * pipeDistance,
                towerHeight * 0.4,
                Math.sin(angle) * pipeDistance
            );
            pipeMesh.name = `externalPipe_${i}`;
            parentGroup.add(pipeMesh);
            
            // 管道支架
            for (let j = 0; j < 5; j++) {
                const supportY = j * (towerHeight * 0.8) / 5 + 5;
                const supportGeometry = new THREE.BoxGeometry(0.3, 0.2, 2);
                const supportMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
                const supportMesh = new THREE.Mesh(supportGeometry, supportMaterial);
                supportMesh.position.set(
                    Math.cos(angle) * (pipeDistance - 1),
                    supportY,
                    Math.sin(angle) * (pipeDistance - 1)
                );
                supportMesh.rotation.y = angle;
                parentGroup.add(supportMesh);
            }
        }
    }
    
    /**
     * 创建工业安全标识系统
     */
    createIndustrialSafetySigns(parentGroup) {
        const towerHeight = this.towerConfig.height;
        const isSecondaryTower = this.towerConfig.hasWetESP;
        
        // 根据塔类型设置不同的标识
        let signs;
        if (isSecondaryTower) {
            // 二级塔标识（湿式电除尘塔）
            signs = [
                { text: "二级脱硫塔", position: [0, 5, 13], color: 0x0066CC },
                { text: "湿式电除尘", position: [0, towerHeight * 0.9, 9], color: 0xFF4500 },
                { text: "高压危险", position: [9, towerHeight * 0.84, 0], color: 0xFF0000 },
                { text: "禁止烟火", position: [-9, 25, 0], color: 0xFF0000 },
                { text: "设备运行", position: [0, 15, -13], color: 0x00AA00 }
            ];
        } else {
            // 一级塔标识（传统脱硫塔）
            signs = [
                { text: "一级脱硫塔", position: [0, 5, 13], color: 0x0066CC },
                { text: "喷淋系统", position: [0, 22, 9], color: 0x00BFFF },
                { text: "托盘系统", position: [9, 16, 0], color: 0x32CD32 },
                { text: "禁止烟火", position: [-9, 25, 0], color: 0xFF0000 },
                { text: "设备运行", position: [0, 15, -13], color: 0x00AA00 }
            ];
        }
        
        signs.forEach((sign, index) => {
            // 标识牌背景
            const signGeometry = new THREE.PlaneGeometry(3, 1);
            const signMaterial = new THREE.MeshPhongMaterial({
                color: 0xFFFFFF,
                transparent: true,
                opacity: 0.9
            });
            const signMesh = new THREE.Mesh(signGeometry, signMaterial);
            signMesh.position.set(...sign.position);
            signMesh.name = `safetySign_${index}`;
            
            // 根据位置调整朝向
            if (sign.position[2] !== 0) {
                signMesh.rotation.y = sign.position[2] > 0 ? Math.PI : 0;
            } else {
                signMesh.rotation.y = sign.position[0] > 0 ? -Math.PI/2 : Math.PI/2;
            }
            
            parentGroup.add(signMesh);
            
            // 标识牌边框
            const frameGeometry = new THREE.RingGeometry(1.6, 1.8, 16);
            const frameMaterial = new THREE.MeshPhongMaterial({ color: sign.color });
            const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
            frameMesh.position.copy(signMesh.position);
            frameMesh.rotation.copy(signMesh.rotation);
            frameMesh.position.z += 0.01;
            parentGroup.add(frameMesh);
        });
    }
    
    /**
     * 创建高级工业照明系统
     */
    createAdvancedLightingSystem(parentGroup) {
        const towerHeight = this.towerConfig.height;
        const isSecondaryTower = this.towerConfig.hasWetESP;
        
        // 根据塔高度动态设置照明层
        let lightLevels;
        if (isSecondaryTower) {
            // 二级塔照明（50米高）
            lightLevels = [10, 25, 40]; // 底部、中部、顶部
        } else {
            // 一级塔照明（30米高）
            lightLevels = [8, 18, 28]; // 底部、中部、顶部
        }
        
        lightLevels.forEach((height, levelIndex) => {
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const lightDistance = 14;
                
                // LED泛光灯
                const lightFixtureGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.3);
                const lightFixtureMaterial = new THREE.MeshPhongMaterial({ color: 0x2C3E50 });
                const lightFixtureMesh = new THREE.Mesh(lightFixtureGeometry, lightFixtureMaterial);
                lightFixtureMesh.position.set(
                    Math.cos(angle) * lightDistance,
                    height,
                    Math.sin(angle) * lightDistance
                );
                lightFixtureMesh.rotation.y = angle + Math.PI;
                lightFixtureMesh.name = `lightFixture_${levelIndex}_${i}`;
                parentGroup.add(lightFixtureMesh);
                
                // LED光源
                const ledGeometry = new THREE.PlaneGeometry(0.4, 0.25);
                const ledMaterial = new THREE.MeshBasicMaterial({
                    color: 0xFFFFFF,
                    emissive: 0x666666,
                    emissiveIntensity: 0.4
                });
                const ledMesh = new THREE.Mesh(ledGeometry, ledMaterial);
                ledMesh.position.set(
                    Math.cos(angle) * (lightDistance - 0.15),
                    height,
                    Math.sin(angle) * (lightDistance - 0.15)
                );
                ledMesh.rotation.y = angle + Math.PI;
                parentGroup.add(ledMesh);
                
                // 灯具支架
                const bracketGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.5, 8);
                const bracketMaterial = new THREE.MeshPhongMaterial({ color: 0x696969 });
                const bracketMesh = new THREE.Mesh(bracketGeometry, bracketMaterial);
                bracketMesh.position.set(
                    Math.cos(angle) * (lightDistance - 0.75),
                    height - 0.75,
                    Math.sin(angle) * (lightDistance - 0.75)
                );
                bracketMesh.rotation.z = -Math.PI/4;
                bracketMesh.rotation.y = angle;
                parentGroup.add(bracketMesh);
            }
        });
    }
    
    /**
     * 创建维护检修平台系统
     */
    createMaintenancePlatforms(parentGroup) {
        const towerHeight = this.towerConfig.height;
        const isSecondaryTower = this.towerConfig.hasWetESP;
        
        // 根据塔类型设置不同的维护平台位置
        let platformLevels;
        if (isSecondaryTower) {
            // 二级塔平台（湿式电除尘器相关）
            platformLevels = [35, 47]; // 除雾器和湿式电除尘器附近
        } else {
            // 一级塔平台（传统脱硫塔）
            platformLevels = [16, 26]; // 托盘和除雾器附近
        }
        
        platformLevels.forEach((height, index) => {
            // 环形维护平台
            const platformGeometry = new THREE.RingGeometry(9.5, 11, 32);
            const platformMaterial = new THREE.MeshPhongMaterial({
                color: 0xC0C0C0,
                side: THREE.DoubleSide
            });
            const platformMesh = new THREE.Mesh(platformGeometry, platformMaterial);
            platformMesh.position.y = height;
            platformMesh.rotation.x = -Math.PI / 2;
            platformMesh.name = `maintenancePlatform_${index}`;
            parentGroup.add(platformMesh);
            
            // 平台防滑格栅
            for (let i = 0; i < 24; i++) {
                const angle = (i / 24) * Math.PI * 2;
                const gratingGeometry = new THREE.BoxGeometry(1.4, 0.05, 0.1);
                const gratingMaterial = new THREE.MeshPhongMaterial({ color: 0x808080 });
                const gratingMesh = new THREE.Mesh(gratingGeometry, gratingMaterial);
                gratingMesh.position.set(
                    Math.cos(angle) * 10.25,
                    height + 0.025,
                    Math.sin(angle) * 10.25
                );
                gratingMesh.rotation.y = angle;
                parentGroup.add(gratingMesh);
            }
            
            // 防护栏杆
            const railGeometry = new THREE.TorusGeometry(11.2, 0.05, 8, 32);
            const railMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
            const railMesh = new THREE.Mesh(railGeometry, railMaterial);
            railMesh.position.y = height + 1.1;
            railMesh.rotation.x = -Math.PI / 2;
            parentGroup.add(railMesh);
            
            // 栏杆立柱
            for (let i = 0; i < 16; i++) {
                const angle = (i / 16) * Math.PI * 2;
                const postGeometry = new THREE.CylinderGeometry(0.04, 0.04, 1.1, 8);
                const postMaterial = new THREE.MeshPhongMaterial({ color: 0xFFD700 });
                const postMesh = new THREE.Mesh(postGeometry, postMaterial);
                postMesh.position.set(
                    Math.cos(angle) * 11.2,
                    height + 0.55,
                    Math.sin(angle) * 11.2
                );
                parentGroup.add(postMesh);
            }
        });
    }
    
    /**
     * 创建工业监控系统
     */
    createMonitoringSystem(parentGroup) {
        const towerHeight = this.towerConfig.height;
        const isSecondaryTower = this.towerConfig.hasWetESP;
        
        // 根据塔类型设置不同的监控点
        let monitoringPoints;
        if (isSecondaryTower) {
            // 二级塔监控点（湿式电除尘相关）
            monitoringPoints = [
                { pos: [8, 20, 8], name: "温度监测" },
                { pos: [-8, 30, -8], name: "压力监测" },
                { pos: [0, towerHeight * 0.9, 9], name: "除尘效率监测" },
                { pos: [9, towerHeight * 0.84, 0], name: "电压监测" }
            ];
        } else {
            // 一级塔监控点（传统脱硫相关）
            monitoringPoints = [
                { pos: [8, 15, 8], name: "温度监测" },
                { pos: [-8, 20, -8], name: "压力监测" },
                { pos: [0, 22, 9], name: "喷淋效率监测" },
                { pos: [9, 16, 0], name: "托盘液位监测" }
            ];
        }
        
        monitoringPoints.forEach((point, index) => {
            // 监控设备箱
            const boxGeometry = new THREE.BoxGeometry(0.8, 1, 0.4);
            const boxMaterial = new THREE.MeshPhysicalMaterial({
                color: 0x2F4F4F,
                metalness: 0.6,
                roughness: 0.4
            });
            const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial);
            boxMesh.position.set(...point.pos);
            boxMesh.name = `monitorBox_${index}`;
            parentGroup.add(boxMesh);
            
            // 显示屏
            const screenGeometry = new THREE.PlaneGeometry(0.6, 0.4);
            const screenMaterial = new THREE.MeshBasicMaterial({
                color: 0x000033,
                emissive: 0x001100,
                emissiveIntensity: 0.2
            });
            const screenMesh = new THREE.Mesh(screenGeometry, screenMaterial);
            screenMesh.position.set(point.pos[0], point.pos[1], point.pos[2] + 0.21);
            parentGroup.add(screenMesh);
            
            // 状态指示灯
            const indicatorGeometry = new THREE.SphereGeometry(0.04, 8, 8);
            const indicatorMaterial = new THREE.MeshBasicMaterial({
                color: 0x00FF00,
                emissive: 0x003300,
                emissiveIntensity: 0.5
            });
            const indicatorMesh = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            indicatorMesh.position.set(point.pos[0] + 0.3, point.pos[1] + 0.3, point.pos[2] + 0.21);
            parentGroup.add(indicatorMesh);
        });
    }
    
    /**
     * 创建防腐防护系统
     */
    createCorrosionProtection(parentGroup) {
        const towerHeight = this.towerConfig.height;
        
        // 阴极保护装置
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const protectorGeometry = new THREE.CylinderGeometry(0.1, 0.1, 2, 8);
            const protectorMaterial = new THREE.MeshPhongMaterial({ color: 0x8B4513 });
            const protectorMesh = new THREE.Mesh(protectorGeometry, protectorMaterial);
            protectorMesh.position.set(
                Math.cos(angle) * 14,
                2,
                Math.sin(angle) * 14
            );
            protectorMesh.name = `cathodicProtector_${i}`;
            parentGroup.add(protectorMesh);
        }
        
        // 防腐涂层指示标记
        const coatingIndicators = [15, 30, 45]; // 不同高度的涂层检查点
        coatingIndicators.forEach((height, index) => {
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const markerGeometry = new THREE.SphereGeometry(0.1, 8, 8);
                const markerMaterial = new THREE.MeshPhongMaterial({ color: 0xFF6600 });
                const markerMesh = new THREE.Mesh(markerGeometry, markerMaterial);
                markerMesh.position.set(
                    Math.cos(angle) * 8.5,
                    height,
                    Math.sin(angle) * 8.5
                );
                markerMesh.name = `coatingMarker_${index}_${i}`;
                parentGroup.add(markerMesh);
            }
        });
    }
    
    /**
     * 创建喷淋层系统
     */
    createSprayLayers(config = {}) {
        console.log(`[${this.towerConfig.name}] 创建喷淋层系统，传入配置:`, config);
        
        const sprayGroup = new THREE.Group();
        sprayGroup.name = 'sprayLayers';
        
        const layerCount = config.count || 3;
        const positions = config.positions || [17, 20, 23]; // 三层等间距：底层17米，中层20米，顶层23米，间距3米，在托盘(14.5m)上方且除雾器(26m)下方
        const nozzleCount = config.nozzleCount || 72; // 三层喷淋系统（3层×8分支×3喷嘴=72）
        
        console.log(`[${this.towerConfig.name}] 喷淋层配置 - 层数: ${layerCount}, 位置: [${positions}], 喷嘴总数: ${nozzleCount}`);
        
        // 创建喷淋系统
        for (let layer = 0; layer < layerCount; layer++) {
            console.log(`[${this.towerConfig.name}] 创建第 ${layer + 1} 层喷淋层，高度: ${positions[layer] || (17 + layer * 3)} 米`);
            
            const layerGroup = new THREE.Group();
            const yPos = positions[layer] || (17 + layer * 3);
            
            // 主喷淋管道环
            const ringGeometry = new THREE.TorusGeometry(6, 0.3, 8, 32);
            const ringMesh = new THREE.Mesh(ringGeometry, this.materials.pipe);
            ringMesh.position.y = yPos;
            ringMesh.rotation.x = -Math.PI / 2;
            layerGroup.add(ringMesh);
            
            // 径向分支管道 - 调整长度适配新的喷嘴布局
            for (let i = 0; i < 8; i++) {
                const angle = (i / 8) * Math.PI * 2;
                const branchGeometry = new THREE.CylinderGeometry(0.15, 0.15, 4.5, 8); // 缩短到4.5米
                const branchMesh = new THREE.Mesh(branchGeometry, this.materials.pipe);
                branchMesh.position.set(
                    Math.cos(angle) * 3.75, // 调整到合适的中心位置
                    yPos,
                    Math.sin(angle) * 3.75
                );
                branchMesh.rotation.z = Math.PI / 2;
                branchMesh.rotation.y = angle;
                layerGroup.add(branchMesh);
                
                // 喷嘴 - 优化数量和分布，确保在框架范围内
                const nozzlesPerBranch = Math.floor(nozzleCount / (layerCount * 8)); // 现在是3个每分支
                const maxRadius = 5.5; // 最大半径限制在5.5米，确保在6米环内
                for (let j = 0; j < nozzlesPerBranch; j++) {
                    const nozzleGeometry = new THREE.ConeGeometry(0.1, 0.3, 8);
                    const nozzleMesh = new THREE.Mesh(nozzleGeometry, this.materials.spray);
                    // 重新设计喷嘴分布：从2米开始，间距1.5米，最远5米
                    const nozzleRadius = Math.min(2 + j * 1.5, maxRadius);
                    nozzleMesh.position.set(
                        Math.cos(angle) * nozzleRadius,
                        yPos - 0.2,
                        Math.sin(angle) * nozzleRadius
                    );
                    nozzleMesh.rotation.x = Math.PI;
                    layerGroup.add(nozzleMesh);
                    
                    // 喷雾效果粒子
                    this.createSprayParticles(nozzleMesh.position, layerGroup);
                }
            }
            
            sprayGroup.add(layerGroup);
        }
        
        this.components.set('sprayLayers', sprayGroup);
        this.interiorGroup.add(sprayGroup);
        
        console.log(`[${this.towerConfig.name}] ✓ 喷淋层系统创建完成，总共 ${layerCount} 层，包含 ${sprayGroup.children.length} 个喷淋层组`);
    }
    
    /**
     * 创建喷雾粒子效果
     */
    createSprayParticles(position, parent) {
        // 参数验证
        if (!position || typeof position.x !== 'number' || typeof position.y !== 'number' || typeof position.z !== 'number') {
            console.warn('createSprayParticles: 无效的位置参数', position);
            return;
        }
        
        // 检查位置值是否为NaN
        if (isNaN(position.x) || isNaN(position.y) || isNaN(position.z)) {
            console.warn('createSprayParticles: 位置包含NaN值', position);
            return;
        }
        
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const offsetX = (Math.random() - 0.5) * 2;
            const offsetY = -Math.random() * 3;
            const offsetZ = (Math.random() - 0.5) * 2;
            
            positions[i * 3] = position.x + offsetX;
            positions[i * 3 + 1] = position.y + offsetY;
            positions[i * 3 + 2] = position.z + offsetZ;
            
            // 验证计算结果
            if (isNaN(positions[i * 3]) || isNaN(positions[i * 3 + 1]) || isNaN(positions[i * 3 + 2])) {
                console.warn('createSprayParticles: 粒子位置计算出现NaN', i, position);
                // 使用默认值
                positions[i * 3] = 0;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = 0;
            }
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0x87CEEB,
            size: 0.1,
            transparent: true,
            opacity: 0.6
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        parent.add(particleSystem);
    }
    
    /**
     * 创建除雾器 - 根据塔类型选择合适的除雾器结构
     */
    createDemisters(config = {}) {
        console.log(`[${this.towerConfig.name}] 开始创建除雾器...`);

        // 根据塔的配置决定除雾器类型
        if (this.towerConfig.hasWetESP) {
            // 二级塔：创建两层除雾器（上层管式 + 下层屋脊式）
            console.log(`[${this.towerConfig.name}] 二级塔 - 创建双层除雾器系统`);
            return this.createDualLayerDemisters(config);
        } else {
            // 一级塔：使用屋脊式除雾器  
            console.log(`[${this.towerConfig.name}] 一级塔 - 创建屋脊式除雾器`);
            return this.createRidgeDemisters(config);
        }
    }

    /**
     * 创建屋脊式除雾器 - 单层大规模结构（专用于一级塔）
     */
    createRidgeDemisters(config = {}) {
        console.log(`[${this.towerConfig.name}] 开始创建单层屋脊式除雾器...`);
        const demisterGroup = new THREE.Group();
        demisterGroup.name = 'ridgeDemisters';

        // === 单层屋脊式除雾器参数 ===
        const layerCount = 1;              // 1层屋脊式除雾器（按用户要求）
        const totalHeight = 2.5;           // 总高度2.5米，单层结构
        const layerSpacing = totalHeight; // 单层不需要层间距
        const baseY = config.basePosition || 26; // 基础位置26米
        
        // 单层参数（优化的大规模设计）
        const layerParams = [
            { radius: 7.0, ridgeCount: 32, ridgeHeight: 1.5, name: '屋脊式除雾层' }
        ];

        // 创建每一层屋脊式除雾器
        for (let layer = 0; layer < layerCount; layer++) {
            const layerY = baseY + layer * layerSpacing;
            const params = layerParams[layer];
            
            console.log(`创建${params.name}屋脊式除雾器，位置: ${layerY}米`);
            
            const layerGroup = new THREE.Group();
            layerGroup.name = `ridge_layer_${layer + 1}`;
            layerGroup.position.y = layerY;

            // 1. 创建主支撑框架
            const frameGeometry = new THREE.CylinderGeometry(
                params.radius + 0.3, params.radius + 0.3, 0.3, 32
            );
            const frameMaterial = new THREE.MeshPhongMaterial({
                color: 0x708090,
                metalness: 0.7,
                roughness: 0.3
            });
            const frame = new THREE.Mesh(frameGeometry, frameMaterial);
            layerGroup.add(frame);

            // 2. 创建径向支撑梁
            const beamCount = 8;
            for (let i = 0; i < beamCount; i++) {
                const angle = (i / beamCount) * Math.PI * 2;
                const beamGeometry = new THREE.BoxGeometry(params.radius * 2, 0.2, 0.3);
                const beamMaterial = new THREE.MeshPhongMaterial({
                    color: 0x555555,
                    metalness: 0.6,
                    roughness: 0.4
                });
                const beam = new THREE.Mesh(beamGeometry, beamMaterial);
                beam.rotation.y = angle;
                beam.position.y = -0.2;
                layerGroup.add(beam);
            }

            // 3. 创建密集的V形屋脊板阵列
            const ridgeMaterial = new THREE.MeshPhongMaterial({
                color: layer % 2 === 0 ? 0xE0E0E0 : 0xD8D8D8, // 交替颜色增强层次感
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide,
                metalness: 0.2,
                roughness: 0.4
            });

            // 创建径向屋脊结构
            for (let ridgeIndex = 0; ridgeIndex < params.ridgeCount; ridgeIndex++) {
                const ridgeAngle = (ridgeIndex / params.ridgeCount) * Math.PI * 2;
                const ridgeGroup = new THREE.Group();
                ridgeGroup.name = `ridge_${layer}_${ridgeIndex}`;

                // 创建从中心到边缘的连续V形屋脊
                const segmentCount = 12; // 增加分段数，更精细
                const innerRadius = 0.8;
                const outerRadius = params.radius;
                const ridgeDepth = (outerRadius - innerRadius) / segmentCount;

                for (let segment = 0; segment < segmentCount; segment++) {
                    const startRadius = innerRadius + segment * ridgeDepth;
                    const endRadius = innerRadius + (segment + 1) * ridgeDepth;
                    
                    // V形屋脊的几何参数
                    const ridgeWidth = 0.4;
                    const vAngle = Math.PI / 4; // 45度V形角

                    // 左斜面
                    const leftGeometry = this.createLargeRidgePlane(
                        startRadius, endRadius, params.ridgeHeight, ridgeWidth, -vAngle/2
                    );
                    const leftPlane = new THREE.Mesh(leftGeometry, ridgeMaterial);
                    
                    // 右斜面
                    const rightGeometry = this.createLargeRidgePlane(
                        startRadius, endRadius, params.ridgeHeight, ridgeWidth, vAngle/2
                    );
                    const rightPlane = new THREE.Mesh(rightGeometry, ridgeMaterial);

                    ridgeGroup.add(leftPlane);
                    ridgeGroup.add(rightPlane);

                    // 添加屋脊顶部边缘（增强视觉效果）
                    if (segment % 2 === 0) {
                        const edgeGeometry = new THREE.BoxGeometry(ridgeDepth, 0.05, 0.05);
                        const edgeMaterial = new THREE.MeshPhongMaterial({
                            color: 0x404040,
                            metalness: 0.9,
                            roughness: 0.1
                        });
                        const edge = new THREE.Mesh(edgeGeometry, edgeMaterial);
                        edge.position.set((startRadius + endRadius) / 2, params.ridgeHeight/2, 0);
                        ridgeGroup.add(edge);
                    }
                }

                // 创建底部排水槽
                const drainGeometry = new THREE.BoxGeometry(outerRadius - innerRadius, 0.1, 0.2);
                const drainMaterial = new THREE.MeshPhongMaterial({
                    color: 0x333333,
                    metalness: 0.8,
                    roughness: 0.2
                });
                const drain = new THREE.Mesh(drainGeometry, drainMaterial);
                drain.position.set((innerRadius + outerRadius) / 2, -params.ridgeHeight/2 - 0.1, 0);
                ridgeGroup.add(drain);

                // 设置屋脊组旋转
                ridgeGroup.rotation.y = ridgeAngle;
                layerGroup.add(ridgeGroup);
            }

            // 4. 层间连接结构
            if (layer < layerCount - 1) {
                const connectionCount = 6;
                for (let i = 0; i < connectionCount; i++) {
                    const angle = (i / connectionCount) * Math.PI * 2;
                    const connectionGeometry = new THREE.CylinderGeometry(0.1, 0.1, layerSpacing * 0.8, 8);
                    const connectionMaterial = new THREE.MeshPhongMaterial({
                        color: 0x666666,
                        metalness: 0.7,
                        roughness: 0.3
                    });
                    const connection = new THREE.Mesh(connectionGeometry, connectionMaterial);
                    connection.position.set(
                        Math.cos(angle) * params.radius * 0.8,
                        layerSpacing * 0.4,
                        Math.sin(angle) * params.radius * 0.8
                    );
                    layerGroup.add(connection);
                }
            }

            demisterGroup.add(layerGroup);
        }

                // 5. 顶部封盖已移除（按用户要求）

        // 6. 创建适配大规模屋脊式除雾器的冲洗系统
        const washingSystem = this.createLargeRidgeDemisterWashingSystem(layerParams, baseY, layerSpacing);
        demisterGroup.add(washingSystem);

        console.log(`[${this.towerConfig.name}] 单层屋脊式除雾器创建完成，总高度: ${totalHeight}米`);
        return demisterGroup;
    }

    /**
     * 创建波纹状除雾器 - 传统结构（已弃用，保留用于兼容性）
     * 注意：此函数已不再使用，二级塔现在使用双层除雾器系统（管式+屋脊式）
     */
    createWaveDemisters(config = {}) {
        console.log(`[${this.towerConfig.name}] 开始创建波纹状除雾器...`);
        const demisterGroup = new THREE.Group();
        demisterGroup.name = 'waveDemisters';

        const layerCount = config.count || 2;
        // 根据塔的高度和是否有湿式电除尘来动态设置除雾器位置
        let defaultPositions;
        if (this.towerConfig.hasWetESP) {
            // 二级塔有湿式电除尘，除雾器作为最上层结构，位于塔内顶部
            defaultPositions = [36, 30]; // 上层36米（塔内最高层），下层30米
        } else {
            // 一级塔没有湿式电除尘，使用配置文件中的位置
            defaultPositions = [28, 25];
        }
        const positions = config.positions || defaultPositions;
        const thickness = config.thickness || 1.2;

        // 创建除雾器层
        for (let layer = 0; layer < layerCount; layer++) {
            const yPos = positions[layer] || (28 - layer * 3);
            const demisterLayerGroup = new THREE.Group();
            demisterLayerGroup.name = `wave_demister_layer_${layer + 1}`;

            // 1. 创建圆柱形外框
            const outerRadius = 7.5;
            const frameHeight = 1.5;
            const cylinderGeo = new THREE.CylinderGeometry(outerRadius, outerRadius, frameHeight, 32);
            const frameMat = new THREE.MeshPhongMaterial({
                color: 0xCCCCCC,
                transparent: true,
                opacity: 0.9,
                side: THREE.DoubleSide
            });
            const frame = new THREE.Mesh(cylinderGeo, frameMat);
            frame.position.y = yPos;
            demisterLayerGroup.add(frame);

            // 2. 创建支撑结构
            const supportCount = 8;
            for (let i = 0; i < supportCount; i++) {
                const angle = (i / supportCount) * Math.PI * 2;
                const supportGeo = new THREE.BoxGeometry(0.2, frameHeight, 0.2);
                const supportMat = new THREE.MeshPhongMaterial({ color: 0x666666 });
                const support = new THREE.Mesh(supportGeo, supportMat);
                
                const radius = outerRadius - 0.1;
                support.position.set(
                    Math.cos(angle) * radius,
                    yPos,
                    Math.sin(angle) * radius
                );
                demisterLayerGroup.add(support);
            }

            // 3. 创建波纹状除雾板
            const waveCount = 32;
            const waveHeight = 0.8;
            const waveSegments = 16;
            
            for (let i = 0; i < waveCount; i++) {
                const angle = (i / waveCount) * Math.PI * 2;
                const waveGroup = new THREE.Group();
                
                const points = [];
                for (let j = 0; j <= waveSegments; j++) {
                    const t = j / waveSegments;
                    const x = (outerRadius - 1) * (1 - t);
                    const y = Math.sin(t * Math.PI * 4) * waveHeight * 0.2;
                    points.push(new THREE.Vector2(x, y));
                }
                
                const waveShape = new THREE.LatheGeometry(points, 1);
                const waveMat = new THREE.MeshPhongMaterial({
                    color: 0xE0E0E0,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide
                });
                const wave = new THREE.Mesh(waveShape, waveMat);
                
                wave.rotation.y = angle;
                wave.position.y = yPos;
                demisterLayerGroup.add(wave);
            }

            demisterGroup.add(demisterLayerGroup);

            // 为上层除雾器（第一层）添加顶部连接接口
            if (layer === 0) {
                // 添加顶部连接接口
                const topInterfaceGeometry = new THREE.CylinderGeometry(outerRadius, outerRadius, 0.2, 32);
                const topInterfaceMaterial = new THREE.MeshPhongMaterial({
                    color: 0x708090,
                    metalness: 0.8,
                    roughness: 0.3
                });
                const topInterface = new THREE.Mesh(topInterfaceGeometry, topInterfaceMaterial);
                topInterface.position.y = yPos + frameHeight/2; // 位于除雾器顶部
                topInterface.name = 'waveDemisterTopInterface';
                demisterLayerGroup.add(topInterface);
                
                // 添加连接环，增强连接细节
                const connectionRingGeometry = new THREE.TorusGeometry(outerRadius - 0.1, 0.1, 8, 32);
                const connectionRingMaterial = new THREE.MeshPhongMaterial({ color: 0x555555 });
                const connectionRing = new THREE.Mesh(connectionRingGeometry, connectionRingMaterial);
                connectionRing.position.y = yPos + frameHeight/2 + 0.1;
                connectionRing.rotation.x = -Math.PI / 2;
                connectionRing.name = 'waveDemisterConnectionRing';
                demisterLayerGroup.add(connectionRing);
            }

            // 在第一层之后添加冲洗水阀系统
            if (layer === 0) {
                // 使用几何相切的方式计算冲洗水阀位置
                const upperDemisterY = positions[0] || 30;
                const lowerDemisterY = positions[1] || 22;
                const demisterRadius = outerRadius; // 除雾器半径 7.5
                const frameHeight = 1.5; // 除雾器框架高度
                const pipeThickness = 0.2; // 管道厚度
                
                // 计算冲洗水阀环形管道的理想半径，使管道外边界与除雾器内边界相切
                // 除雾器内半径 = 外半径 - 壁厚，假设壁厚为0.1
                const demisterInnerRadius = demisterRadius - 0.1; // 7.4
                // 水管外边界与除雾器内边界相切：水管半径 = 除雾器内半径 - 管道厚度
                const valveRingRadius = demisterInnerRadius - pipeThickness; // 7.4 - 0.2 = 7.2
                
                // 计算上下边界相切的Y位置
                // 上圈管道的下边界应该与上层除雾器的下边界相切
                const upperRingY = upperDemisterY - frameHeight/2 - pipeThickness;
                // 下圈管道的上边界应该与下层除雾器的上边界相切
                const lowerRingY = lowerDemisterY + frameHeight/2 + pipeThickness;
                
                // 冲洗水阀系统的中心位置
                const valveSystemY = (upperRingY + lowerRingY) / 2;
                
                const valveSystem = this.createWashingValveSystem(valveRingRadius, valveSystemY, {
                    upperRingY: upperRingY,
                    lowerRingY: lowerRingY,
                    pipeThickness: pipeThickness
                });
                demisterGroup.add(valveSystem);
            }
        }

        console.log(`[${this.towerConfig.name}] 波纹状除雾器创建完成`);
        return demisterGroup;
    }

    /**
     * 创建双层除雾器系统 - 专用于二级塔（上层管式 + 下层屋脊式）
     */
    createDualLayerDemisters(config = {}) {
        console.log(`[${this.towerConfig.name}] 开始创建双层除雾器系统...`);
        const demisterGroup = new THREE.Group();
        demisterGroup.name = 'dualLayerDemisters';

        // 根据新的50米高度和正确工艺流程调整位置
        // 从下到上的正确顺序：屋脊式除雾器 → 管式除雾器 → 湿式电除尘器
        // 下层屋脊式除雾器：28米
        // 中层管式除雾器：35米
        const lowerRidgePosition = 28;
        const upperTubePosition = 35;
        const layerSpacing = upperTubePosition - lowerRidgePosition; // 7米间距

        console.log(`创建下层屋脊式除雾器（第一级处理），位置: ${lowerRidgePosition}米`);
        // 1. 创建下层屋脊式除雾器（第一级除雾处理）
        const ridgeDemister = this.createRidgeDemisters({
            count: 1, // 单层
            basePosition: lowerRidgePosition,
            ...config
        });
        demisterGroup.add(ridgeDemister);

        console.log(`创建中间塔体连接结构，高度: ${lowerRidgePosition + 2}米 到 ${upperTubePosition - 2}米`);
        // 2. 创建中间塔体连接结构
        const intermediateTowerStructure = this.createIntermediateTowerStructure({
            startHeight: lowerRidgePosition + 2,
            endHeight: upperTubePosition - 2,
            radius: 7.8
        });
        demisterGroup.add(intermediateTowerStructure);

        console.log(`创建上层管式除雾器（第二级处理），位置: ${upperTubePosition}米`);
        // 3. 创建上层管式除雾器（第二级除雾处理）
        const tubeDemister = this.createTubeDemisters({
            position: upperTubePosition,
            radius: 7.5,
            ...config
        });
        demisterGroup.add(tubeDemister);

        console.log(`[${this.towerConfig.name}] 双层除雾器系统创建完成 - 下层屋脊式(${lowerRidgePosition}m) + 塔体连接结构 + 上层管式(${upperTubePosition}m)`);
        return demisterGroup;
    }

    /**
     * 创建管束式除尘除雾器 - 1:1复刻用户图片中的模型
     */
    createTubeDemisters(config = {}) {
        console.log(`[${this.towerConfig.name}] 开始创建管束式除尘除雾器（1:1复刻模型）...`);
        const tubeGroup = new THREE.Group();
        tubeGroup.name = 'tubeDemisters';

        const position = config.position || 35;
        const radius = config.radius || 7.5;
        
        // 管束式除雾器参数（按图片复刻）
        const tubeRadius = 0.12; // 管子半径
        const tubeLength = 2.5; // 管子长度
        const gridSpacing = 0.6; // 管子间距
        const gridSize = Math.floor((radius * 2 - 2) / gridSpacing); // 网格大小

        // 材质定义
        const tubeMaterial = new THREE.MeshPhongMaterial({
            color: 0xF5F5F5, // 白色管子（如图片所示）
            metalness: 0.2,
            roughness: 0.3,
            transparent: false,
            opacity: 1.0
        });

        const supportMaterial = new THREE.MeshPhongMaterial({
            color: 0xC0C0C0, // 灰色支撑结构
            metalness: 0.6,
            roughness: 0.4
        });

        // 1. 创建底部支撑平台（圆形底座）
        const basePlatformGeometry = new THREE.CylinderGeometry(radius, radius, 0.2, 32);
        const basePlatform = new THREE.Mesh(basePlatformGeometry, supportMaterial);
        basePlatform.position.y = position - tubeLength/2 - 0.1;
        basePlatform.name = 'basePlatform';
        tubeGroup.add(basePlatform);

        // 2. 创建顶部支撑平台
        const topPlatformGeometry = new THREE.CylinderGeometry(radius, radius, 0.15, 32);
        const topPlatform = new THREE.Mesh(topPlatformGeometry, supportMaterial);
        topPlatform.position.y = position + tubeLength/2 + 0.075;
        topPlatform.name = 'topPlatform';
        tubeGroup.add(topPlatform);

        // 3. 创建管束阵列 - 规整的网格排列（如图片所示）
        console.log(`创建管束阵列 - 网格大小: ${gridSize}×${gridSize}`);
        let tubeCount = 0;
        const centerOffset = (gridSize - 1) * gridSpacing / 2; // 居中偏移

        for (let row = 0; row < gridSize; row++) {
            for (let col = 0; col < gridSize; col++) {
                const x = col * gridSpacing - centerOffset;
                const z = row * gridSpacing - centerOffset;
                const distanceFromCenter = Math.sqrt(x * x + z * z);
                
                // 只在圆形区域内创建管子（保持圆形边界）
                if (distanceFromCenter <= radius - 0.5) {
                    // 创建管子
                    const tubeGeometry = new THREE.CylinderGeometry(tubeRadius, tubeRadius, tubeLength, 12);
                    const tubeMesh = new THREE.Mesh(tubeGeometry, tubeMaterial);
                    
                    tubeMesh.position.set(x, position, z);
                    tubeMesh.name = `tube_${row}_${col}`;
                    tubeGroup.add(tubeMesh);

                    // 创建管口细节（顶部开口）
                    const tubeTopGeometry = new THREE.RingGeometry(tubeRadius - 0.02, tubeRadius, 8);
                    const tubeTopMaterial = new THREE.MeshPhongMaterial({
                        color: 0xE8E8E8,
                        side: THREE.DoubleSide
                    });
                    const tubeTop = new THREE.Mesh(tubeTopGeometry, tubeTopMaterial);
                    tubeTop.position.set(x, position + tubeLength/2, z);
                    tubeTop.rotation.x = Math.PI / 2;
                    tubeTop.name = `tubeTop_${row}_${col}`;
                    tubeGroup.add(tubeTop);

                    // 创建管口细节（底部开口）
                    const tubeBottom = new THREE.Mesh(tubeTopGeometry, tubeTopMaterial);
                    tubeBottom.position.set(x, position - tubeLength/2, z);
                    tubeBottom.rotation.x = Math.PI / 2;
                    tubeBottom.name = `tubeBottom_${row}_${col}`;
                    tubeGroup.add(tubeBottom);

                    tubeCount++;
                }
            }
        }

        // 4. 创建支撑梁网格（连接管子的横向支撑）
        // 水平支撑梁（X方向）
        for (let row = 0; row < gridSize; row++) {
            const z = row * gridSpacing - centerOffset;
            if (Math.abs(z) <= radius - 1) {
                const beamLength = (radius - 1) * 2;
                const beamGeometry = new THREE.CylinderGeometry(0.02, 0.02, beamLength, 8);
                const beamMesh = new THREE.Mesh(beamGeometry, supportMaterial);
                beamMesh.position.set(0, position, z);
                beamMesh.rotation.z = Math.PI / 2;
                beamMesh.name = `xBeam_${row}`;
                tubeGroup.add(beamMesh);
            }
        }

        // 垂直支撑梁（Z方向）
        for (let col = 0; col < gridSize; col++) {
            const x = col * gridSpacing - centerOffset;
            if (Math.abs(x) <= radius - 1) {
                const beamLength = (radius - 1) * 2;
                const beamGeometry = new THREE.CylinderGeometry(0.02, 0.02, beamLength, 8);
                const beamMesh = new THREE.Mesh(beamGeometry, supportMaterial);
                beamMesh.position.set(x, position, 0);
                beamMesh.rotation.x = Math.PI / 2;
                beamMesh.name = `zBeam_${col}`;
                tubeGroup.add(beamMesh);
            }
        }

        // 5. 创建外圈支撑环
        const outerRingGeometry = new THREE.TorusGeometry(radius - 0.2, 0.06, 8, 32);
        const outerRing = new THREE.Mesh(outerRingGeometry, supportMaterial);
        outerRing.position.y = position;
        outerRing.rotation.x = Math.PI / 2;
        outerRing.name = 'outerSupportRing';
        tubeGroup.add(outerRing);

        // 6. 创建中央支撑柱
        const centralColumnGeometry = new THREE.CylinderGeometry(0.1, 0.1, tubeLength + 0.4, 12);
        const centralColumn = new THREE.Mesh(centralColumnGeometry, supportMaterial);
        centralColumn.position.set(0, position, 0);
        centralColumn.name = 'centralSupportColumn';
        tubeGroup.add(centralColumn);

        // 7. 创建进出口管道连接
        const inletPipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 12);
        const inletPipe = new THREE.Mesh(inletPipeGeometry, supportMaterial);
        inletPipe.position.set(radius - 0.5, position - tubeLength/2 - 0.5, 0);
        inletPipe.name = 'inletPipe';
        tubeGroup.add(inletPipe);

        // 8. 添加标识牌架（模拟图片中的标识结构）
        const signSupportGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8);
        const signSupport = new THREE.Mesh(signSupportGeometry, supportMaterial);
        signSupport.position.set(radius + 0.3, position + 0.75, 0);
        signSupport.name = 'signSupport';
        tubeGroup.add(signSupport);

        console.log(`[${this.towerConfig.name}] 管束式除尘除雾器创建完成 - ${tubeCount}根管子，${gridSize}×${gridSize}规整阵列`);
        return tubeGroup;
    }

    /**
     * 创建中间简洁支撑结构 - 仅保留6根贯穿柱子（按用户要求简化）
     */
    createIntermediateTowerStructure(config = {}) {
        console.log(`[${this.towerConfig.name}] 开始创建中间简洁支撑结构（仅6根贯穿柱）...`);
        const structureGroup = new THREE.Group();
        structureGroup.name = 'intermediateTowerStructure';

        // 使用与底部支撑柱相同的钢材质
        const supportMaterial = new THREE.MeshPhongMaterial({
            color: 0x404040, // 深灰色（与底部支撑柱相同）
            shininess: 120,  // 增加金属光泽
            transparent: false,
            opacity: 1.0,
            specular: 0x444444 // 添加镜面反射
        });

        // === 仅创建6根贯穿柱子 - 对应屋脊式除雾器下方的6个支撑柱位置 ===
        console.log(`[${this.towerConfig.name}] 创建6根贯穿柱子，从屋脊式除雾器贯穿到管式除雾器...`);
        const penetratingColumnCount = 6;
        const columnRadius = 6; // 与底部支撑柱相同的半径位置
        
        // 贯穿柱的高度和位置 - 从屋脊式除雾器（28米）到管式除雾器（35米+2.5米）
        const ridgePosition = 28; // 屋脊式除雾器位置
        const tubePosition = 35; // 管式除雾器位置
        const tubeHeight = 2.5; // 管式除雾器高度
        const penetratingStart = ridgePosition - 1; // 稍微从屋脊下方开始
        const penetratingEnd = tubePosition + tubeHeight + 1; // 稍微延伸到管式除雾器上方
        const penetratingHeight = penetratingEnd - penetratingStart; // 总贯穿高度
        const penetratingCenter = (penetratingStart + penetratingEnd) / 2; // 贯穿柱的中心位置
        
        for (let i = 0; i < penetratingColumnCount; i++) {
            const angle = (i / penetratingColumnCount) * Math.PI * 2;
            
            // 创建贯穿柱子
            const penetratingColumnGeometry = new THREE.CylinderGeometry(0.25, 0.25, penetratingHeight, 8);
            const penetratingColumnMesh = new THREE.Mesh(penetratingColumnGeometry, supportMaterial);
            penetratingColumnMesh.position.set(
                Math.cos(angle) * columnRadius,
                penetratingCenter, // 贯穿柱的中心高度
                Math.sin(angle) * columnRadius
            );
            penetratingColumnMesh.name = `penetratingColumn_${i}`;
            structureGroup.add(penetratingColumnMesh);
            
            console.log(`贯穿柱子 ${i + 1} - 位置: (${(Math.cos(angle) * columnRadius).toFixed(2)}, ${penetratingCenter.toFixed(2)}, ${(Math.sin(angle) * columnRadius).toFixed(2)}), 高度: ${penetratingHeight.toFixed(2)}米`);
        }

        this.components.set('intermediateTowerStructure', structureGroup);
        this.interiorGroup.add(structureGroup);

        console.log(`[${this.towerConfig.name}] 中间简洁支撑结构创建完成 - 仅保留6根贯穿柱，移除所有格栅填充结构`);
        return structureGroup;
    }

    /**
     * 创建屋脊斜面几何体
     * @param {number} innerRadius - 内圈半径
     * @param {number} outerRadius - 外圈半径
     * @param {number} height - 屋脊高度
     * @param {number} width - 屋脊宽度的一半
     * @param {number} angle - 斜面角度
     */
    createRidgePlaneGeometry(innerRadius, outerRadius, height, width, angle) {
        const geometry = new THREE.BufferGeometry();
        
        // 创建梯形斜面的顶点
        const vertices = [];
        const indices = [];
        const uvs = [];
        
        // 计算斜面的高度偏移
        const heightOffset = Math.tan(angle) * width;
        
        // 四个顶点（梯形）
        // 内圈底部
        vertices.push(innerRadius, -height/2, -width);
        vertices.push(innerRadius, -height/2, width);
        // 外圈顶部
        vertices.push(outerRadius, -height/2 + heightOffset, width);
        vertices.push(outerRadius, -height/2 + heightOffset, -width);
        
        // UV坐标
        uvs.push(0, 0, 1, 0, 1, 1, 0, 1);
        
        // 三角形索引（两个三角形组成一个四边形）
        indices.push(0, 1, 2, 0, 2, 3);
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        return geometry;
    }

    /**
     * 创建大规模屋脊斜面几何体（优化版）
     */
    createLargeRidgePlane(innerRadius, outerRadius, height, width, angle) {
        const geometry = new THREE.BufferGeometry();
        
        // 创建更精细的V形斜面
        const radialSegments = 4; // 径向分段
        const heightSegments = 2; // 高度分段
        
        const vertices = [];
        const indices = [];
        const uvs = [];
        const normals = [];
        
        // 计算角度偏移
        const heightOffset = Math.tan(angle) * width;
        
        // 生成顶点
        for (let r = 0; r <= radialSegments; r++) {
            const radius = innerRadius + (outerRadius - innerRadius) * (r / radialSegments);
            
            for (let h = 0; h <= heightSegments; h++) {
                const y = (-height/2) + (height * h / heightSegments) + heightOffset * (h / heightSegments);
                
                // 左右两个顶点
                vertices.push(radius, y, -width + (2 * width * h / heightSegments));
                vertices.push(radius, y, width - (2 * width * h / heightSegments));
                
                // UV坐标
                uvs.push(r / radialSegments, h / heightSegments);
                uvs.push(r / radialSegments, h / heightSegments);
                
                // 法向量（简化计算）
                const nx = Math.sin(angle);
                const ny = Math.cos(angle);
                normals.push(nx, ny, 0);
                normals.push(nx, ny, 0);
            }
        }
        
        // 生成三角形索引
        const verticesPerRadius = (heightSegments + 1) * 2;
        for (let r = 0; r < radialSegments; r++) {
            for (let h = 0; h < heightSegments; h++) {
                const base = r * verticesPerRadius + h * 2;
                
                // 左侧三角形
                indices.push(base, base + 2, base + verticesPerRadius);
                indices.push(base + 2, base + verticesPerRadius + 2, base + verticesPerRadius);
                
                // 右侧三角形  
                indices.push(base + 1, base + verticesPerRadius + 1, base + 3);
                indices.push(base + 3, base + verticesPerRadius + 1, base + verticesPerRadius + 3);
            }
        }
        
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertices, 3));
        geometry.setAttribute('normal', new THREE.Float32BufferAttribute(normals, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(uvs, 2));
        geometry.setIndex(indices);
        geometry.computeVertexNormals();
        
        return geometry;
    }

    /**
     * 创建大规模多层屋脊式除雾器冲洗系统
     */
    createLargeRidgeDemisterWashingSystem(layerParams, baseY, layerSpacing) {
        console.log(`[${this.towerConfig.name}] 开始创建大规模多层冲洗系统...`);
        const washingGroup = new THREE.Group();
        washingGroup.name = 'largeRidgeDemisterWashingSystem';

        // 冲洗系统材质 - 调整为不突出的颜色
        const pipeMaterial = new THREE.MeshPhongMaterial({
            color: 0x708090, // 灰色管道，与塔体颜色协调
            metalness: 0.6,
            roughness: 0.4
        });

        const valveMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFD700, // 金色阀门
            metalness: 0.9,
            roughness: 0.1
        });

        const nozzleMaterial = new THREE.MeshPhongMaterial({
            color: 0x32CD32, // 绿色喷嘴
            metalness: 0.8,
            roughness: 0.2
        });

        const supportMaterial = new THREE.MeshPhongMaterial({
            color: 0x708090, // 灰色支撑
            metalness: 0.6,
            roughness: 0.4
        });

        // 1. 创建主供水立管（更大尺寸）
        const mainPipeHeight = layerParams.length * layerSpacing + 4;
        const mainPipeRadius = 0.25;
        const mainSupplyGeometry = new THREE.CylinderGeometry(mainPipeRadius, mainPipeRadius, mainPipeHeight, 12);
        const mainSupply = new THREE.Mesh(mainSupplyGeometry, pipeMaterial);
        mainSupply.position.set(layerParams[0].radius * 1.2, baseY + mainPipeHeight/2, 0);
        washingGroup.add(mainSupply);

        // 2. 创建主控制阀门
        const mainValveGeometry = new THREE.BoxGeometry(0.8, 0.6, 0.6);
        const mainValve = new THREE.Mesh(mainValveGeometry, valveMaterial);
        mainValve.position.set(layerParams[0].radius * 1.2, baseY + mainPipeHeight + 0.5, 0);
        washingGroup.add(mainValve);

        // 3. 为每层创建冲洗系统
        for (let layer = 0; layer < layerParams.length; layer++) {
            const layerY = baseY + layer * layerSpacing;
            const params = layerParams[layer];
            
            const layerWashGroup = new THREE.Group();
            layerWashGroup.name = `wash_layer_${layer + 1}`;

            // 3.1 层级环形分配管道
            const ringRadius = params.radius - 0.5;
            const ringPipeRadius = 0.15;
            
            // 上层冲洗环（向下喷射）
            const upperRingY = layerY + 0.8;
            const upperRingGeometry = new THREE.TorusGeometry(ringRadius, ringPipeRadius, 8, 32);
            const upperRing = new THREE.Mesh(upperRingGeometry, pipeMaterial);
            upperRing.position.y = upperRingY;
            upperRing.rotation.x = Math.PI / 2;
            layerWashGroup.add(upperRing);

            // 下层冲洗环（向上喷射，清洗屋脊底部）
            const lowerRingY = layerY - 0.8;
            const lowerRing = new THREE.Mesh(upperRingGeometry.clone(), pipeMaterial);
            lowerRing.position.y = lowerRingY;
            lowerRing.rotation.x = Math.PI / 2;
            layerWashGroup.add(lowerRing);

            // 3.2 连接到主管道的分支管道
            const branchLength = params.radius * 0.4;
            const branchGeometry = new THREE.CylinderGeometry(ringPipeRadius, ringPipeRadius, branchLength, 8);
            
            // 上层连接
            const upperBranch = new THREE.Mesh(branchGeometry, pipeMaterial);
            upperBranch.position.set(ringRadius * 0.7, upperRingY, 0);
            upperBranch.rotation.z = Math.PI / 2;
            layerWashGroup.add(upperBranch);

            // 下层连接
            const lowerBranch = new THREE.Mesh(branchGeometry, pipeMaterial);
            lowerBranch.position.set(ringRadius * 0.7, lowerRingY, 0);
            lowerBranch.rotation.z = Math.PI / 2;
            layerWashGroup.add(lowerBranch);

            // 3.3 分层控制阀门
            const layerValveGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.4);
            const upperValve = new THREE.Mesh(layerValveGeometry, valveMaterial);
            upperValve.position.set(ringRadius * 0.5, upperRingY, 0);
            layerWashGroup.add(upperValve);

            const lowerValve = new THREE.Mesh(layerValveGeometry, valveMaterial);
            lowerValve.position.set(ringRadius * 0.5, lowerRingY, 0);
            layerWashGroup.add(lowerValve);

            // 3.4 密集冲洗喷嘴阵列
            const nozzleCount = params.ridgeCount * 2; // 每个屋脊2个喷嘴
            const sprayRadius = params.radius - 0.3;

            for (let i = 0; i < nozzleCount; i++) {
                const angle = (i / nozzleCount) * Math.PI * 2;
                const x = Math.cos(angle) * sprayRadius;
                const z = Math.sin(angle) * sprayRadius;

                // 上层向下喷嘴
                const upperConnectionGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.3, 6);
                const upperConnection = new THREE.Mesh(upperConnectionGeometry, pipeMaterial);
                upperConnection.position.set(x, upperRingY - 0.15, z);
                layerWashGroup.add(upperConnection);

                const upperNozzleGeometry = new THREE.ConeGeometry(0.06, 0.2, 8);
                const upperNozzle = new THREE.Mesh(upperNozzleGeometry, nozzleMaterial);
                upperNozzle.position.set(x, upperRingY - 0.35, z);
                upperNozzle.rotation.x = Math.PI; // 向下
                layerWashGroup.add(upperNozzle);

                // 下层向上喷嘴
                const lowerConnection = new THREE.Mesh(upperConnectionGeometry.clone(), pipeMaterial);
                lowerConnection.position.set(x, lowerRingY + 0.15, z);
                layerWashGroup.add(lowerConnection);

                const lowerNozzle = new THREE.Mesh(upperNozzleGeometry.clone(), nozzleMaterial);
                lowerNozzle.position.set(x, lowerRingY + 0.35, z);
                // 向上，不需要旋转
                layerWashGroup.add(lowerNozzle);

                // 侧向冲洗喷嘴（冲洗V形斜面）
                if (i % 3 === 0) {
                    // 左斜向喷嘴
                    const leftAngleNozzle = new THREE.Mesh(upperNozzleGeometry.clone(), nozzleMaterial);
                    leftAngleNozzle.position.set(x - 0.15, upperRingY - 0.2, z);
                    leftAngleNozzle.rotation.z = Math.PI / 4; // 45度角
                    layerWashGroup.add(leftAngleNozzle);

                    // 右斜向喷嘴
                    const rightAngleNozzle = new THREE.Mesh(upperNozzleGeometry.clone(), nozzleMaterial);
                    rightAngleNozzle.position.set(x + 0.15, upperRingY - 0.2, z);
                    rightAngleNozzle.rotation.z = -Math.PI / 4; // -45度角
                    layerWashGroup.add(rightAngleNozzle);
                }
            }

            // 3.5 支撑结构
            const supportCount = 6;
            for (let i = 0; i < supportCount; i++) {
                const angle = (i / supportCount) * Math.PI * 2;
                const supportGeometry = new THREE.BoxGeometry(0.1, 1.6, 0.1);
                const support = new THREE.Mesh(supportGeometry, supportMaterial);
                support.position.set(
                    Math.cos(angle) * ringRadius * 1.1,
                    layerY,
                    Math.sin(angle) * ringRadius * 1.1
                );
                layerWashGroup.add(support);
            }

            washingGroup.add(layerWashGroup);
        }

        // 4. 创建底部总收集系统
        const collectSystemY = baseY - 1.5;
        const collectRingRadius = layerParams[0].radius + 0.2;
        const collectRingGeometry = new THREE.TorusGeometry(collectRingRadius, 0.2, 8, 32);
        const collectRingMaterial = new THREE.MeshPhongMaterial({
            color: 0x444444,
            metalness: 0.7,
            roughness: 0.3
        });
        const collectRing = new THREE.Mesh(collectRingGeometry, collectRingMaterial);
        collectRing.position.y = collectSystemY;
        collectRing.rotation.x = Math.PI / 2;
        washingGroup.add(collectRing);

        // 5. 排水管道系统
        const drainCount = 8;
        for (let i = 0; i < drainCount; i++) {
            const angle = (i / drainCount) * Math.PI * 2;
            const drainGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2.0, 8);
            const drain = new THREE.Mesh(drainGeometry, pipeMaterial);
            drain.position.set(
                Math.cos(angle) * collectRingRadius,
                collectSystemY - 1.0,
                Math.sin(angle) * collectRingRadius
            );
            washingGroup.add(drain);

            // 排水阀门
            const drainValveGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const drainValve = new THREE.Mesh(drainValveGeometry, valveMaterial);
            drainValve.position.set(
                Math.cos(angle) * collectRingRadius,
                collectSystemY - 1.5,
                Math.sin(angle) * collectRingRadius
            );
            washingGroup.add(drainValve);
        }

        console.log(`[${this.towerConfig.name}] 大规模多层屋脊式除雾器冲洗系统创建完成`);
        return washingGroup;
    }

    /**
     * 创建适配屋脊式除雾器的冲洗系统
     * @param {number} demisterRadius - 除雾器半径
     * @param {number} yPos - Y轴位置
     * @param {number} frameHeight - 框架高度
     */
    createRidgeDemisterWashingSystem(demisterRadius, yPos, frameHeight) {
        console.log(`[${this.towerConfig.name}] 开始创建屋脊式除雾器冲洗系统...`);
        const washingGroup = new THREE.Group();
        washingGroup.name = 'ridgeDemisterWashingSystem';

        // 冲洗系统材质 - 调整为不突出的颜色
        const pipeMaterial = new THREE.MeshPhongMaterial({
            color: 0x708090, // 灰色管道，与塔体颜色协调
            metalness: 0.6,
            roughness: 0.4
        });

        const valveMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFD700, // 金色阀门
            metalness: 0.9,
            roughness: 0.1
        });

        const nozzleMaterial = new THREE.MeshPhongMaterial({
            color: 0x32CD32, // 绿色喷嘴
            metalness: 0.7,
            roughness: 0.3
        });

        // 管道参数
        const pipeThickness = 0.15;
        const mainPipeHeight = frameHeight + 2.0;
        
        // 1. 创建主供水立管
        const mainSupplyGeometry = new THREE.CylinderGeometry(pipeThickness, pipeThickness, mainPipeHeight, 8);
        const mainSupply = new THREE.Mesh(mainSupplyGeometry, pipeMaterial);
        mainSupply.position.set(demisterRadius * 1.1, yPos, 0);
        washingGroup.add(mainSupply);

        // 2. 创建主控制阀门
        const mainValveGeometry = new THREE.BoxGeometry(0.5, 0.4, 0.4);
        const mainValve = new THREE.Mesh(mainValveGeometry, valveMaterial);
        mainValve.position.set(demisterRadius * 1.1, yPos + frameHeight/2 + 0.5, 0);
        washingGroup.add(mainValve);

        // 3. 创建顶部环形分配管道
        const topRingY = yPos + frameHeight/2 + 1.0;
        const topRingRadius = demisterRadius - 0.3;
        
        const topRingGeometry = new THREE.TorusGeometry(topRingRadius, pipeThickness, 8, 32);
        const topRing = new THREE.Mesh(topRingGeometry, pipeMaterial);
        topRing.position.y = topRingY;
        topRing.rotation.x = Math.PI / 2;
        washingGroup.add(topRing);

        // 4. 连接主管道到环形管道的分支
        const branchLength = demisterRadius * 0.3;
        const branchGeometry = new THREE.CylinderGeometry(pipeThickness, pipeThickness, branchLength, 8);
        const branch = new THREE.Mesh(branchGeometry, pipeMaterial);
        branch.position.set(demisterRadius * 0.8, topRingY, 0);
        branch.rotation.z = Math.PI / 2;
        washingGroup.add(branch);

        // 5. 创建向下的冲洗喷嘴（适配屋脊结构）
        const nozzleCount = 32; // 增加喷嘴数量以充分覆盖屋脊
        const sprayRadius = demisterRadius - 0.5;

        for (let i = 0; i < nozzleCount; i++) {
            const angle = (i / nozzleCount) * Math.PI * 2;
            const x = Math.cos(angle) * sprayRadius;
            const z = Math.sin(angle) * sprayRadius;

            // 喷嘴连接管
            const connectionLength = 0.4;
            const connectionGeometry = new THREE.CylinderGeometry(0.06, 0.06, connectionLength, 6);
            const connection = new THREE.Mesh(connectionGeometry, pipeMaterial);
            connection.position.set(x, topRingY - connectionLength/2, z);
            washingGroup.add(connection);

            // 喷嘴头（锥形，向下喷射）
            const nozzleGeometry = new THREE.ConeGeometry(0.08, 0.3, 8);
            const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
            nozzle.position.set(x, topRingY - connectionLength - 0.15, z);
            nozzle.rotation.x = Math.PI; // 朝下
            washingGroup.add(nozzle);

            // 在一些位置添加角度可调的侧向喷嘴，用于冲洗屋脊斜面
            if (i % 4 === 0) { // 每4个位置添加一个侧向喷嘴
                // 左侧喷嘴（冲洗左斜面）
                const leftNozzleGeometry = new THREE.ConeGeometry(0.06, 0.25, 8);
                const leftNozzle = new THREE.Mesh(leftNozzleGeometry, nozzleMaterial);
                leftNozzle.position.set(x - 0.1, topRingY - 0.2, z);
                leftNozzle.rotation.z = Math.PI / 6; // 向左斜30度
                washingGroup.add(leftNozzle);

                // 右侧喷嘴（冲洗右斜面）
                const rightNozzle = new THREE.Mesh(leftNozzleGeometry.clone(), nozzleMaterial);
                rightNozzle.position.set(x + 0.1, topRingY - 0.2, z);
                rightNozzle.rotation.z = -Math.PI / 6; // 向右斜30度
                washingGroup.add(rightNozzle);
            }
        }

        // 6. 创建底部收集环（收集冲洗水）
        const collectRingY = yPos - frameHeight/2 - 0.3;
        const collectRingGeometry = new THREE.TorusGeometry(demisterRadius - 0.2, 0.1, 6, 32);
        const collectRingMaterial = new THREE.MeshPhongMaterial({
            color: 0x708090,
            metalness: 0.5,
            roughness: 0.5
        });
        const collectRing = new THREE.Mesh(collectRingGeometry, collectRingMaterial);
        collectRing.position.y = collectRingY;
        collectRing.rotation.x = Math.PI / 2;
        washingGroup.add(collectRing);

        // 7. 排水管道
        const drainCount = 4;
        for (let i = 0; i < drainCount; i++) {
            const angle = (i / drainCount) * Math.PI * 2;
            const drainGeometry = new THREE.CylinderGeometry(0.1, 0.1, 1.0, 8);
            const drain = new THREE.Mesh(drainGeometry, pipeMaterial);
            drain.position.set(
                Math.cos(angle) * (demisterRadius - 0.2),
                collectRingY - 0.5,
                Math.sin(angle) * (demisterRadius - 0.2)
            );
            washingGroup.add(drain);
        }

        console.log(`[${this.towerConfig.name}] 屋脊式除雾器冲洗系统创建完成`);
        return washingGroup;
    }

    /**
     * 创建除雾器冲洗水阀系统 - 使用几何相切方式精确定位
     */
    createWashingValveSystem(radius, yPos, geometryParams = {}) {
        console.log('开始创建冲洗水阀系统，半径:', radius, 'Y位置:', yPos);
        const valveGroup = new THREE.Group();
        valveGroup.name = 'washingValveSystem';

        // 从几何参数中获取精确位置，如果没有则使用默认偏移
        const upperRingY = geometryParams.upperRingY || (yPos + 2.0);
        const lowerRingY = geometryParams.lowerRingY || (yPos - 2.0);
        const pipeThickness = geometryParams.pipeThickness || 0.2;

        // 管道材质 - 使用鲜艳颜色便于测试
        const pipeMaterial = new THREE.MeshPhongMaterial({
            color: 0xFF0000, // 红色，便于测试
            metalness: 0.6,
            roughness: 0.4
        });

        // 阀门材质 - 金色
        const valveMaterial = new THREE.MeshPhongMaterial({
            color: 0xFFD700,
            metalness: 0.9,
            roughness: 0.1
        });

        // 喷嘴材质 - 蓝色，便于测试
        const nozzleMaterial = new THREE.MeshPhongMaterial({
            color: 0x0000FF, // 蓝色，便于测试
            metalness: 0.8,
            roughness: 0.2
        });

        const nozzleRingRadius = radius; // 使用传入的精确半径

        // 1. 创建主供水立管（从塔壁进入）- 增大尺寸
        const mainSupplyGeometry = new THREE.CylinderGeometry(pipeThickness, pipeThickness, 6.0, 8);
        const mainSupply = new THREE.Mesh(mainSupplyGeometry, pipeMaterial);
        mainSupply.position.set(radius * 1.2, yPos, 0); // 稍微外移，避免与除雾器重叠
        valveGroup.add(mainSupply);
        console.log('添加主供水立管');

        // 2. 创建主控制阀门 - 增大尺寸
        const mainValveGeometry = new THREE.BoxGeometry(0.6, 0.5, 0.5);
        const mainValve = new THREE.Mesh(mainValveGeometry, valveMaterial);
        mainValve.position.set(radius * 1.2, yPos + 1.0, 0);
        valveGroup.add(mainValve);
        console.log('添加主控制阀门');

        // 3. 创建两圈冲洗管道系统 - 使用精确的几何位置
        const ringPositions = [upperRingY, lowerRingY];
        const ringNames = ['upper', 'lower'];
        // 去掉旋转角度，两条管道都保持水平状态
        const rotationAngles = [0, 0]; // 都设置为0度，不旋转

        for (let ringIndex = 0; ringIndex < 2; ringIndex++) {
            const ringY = ringPositions[ringIndex];
            const rotationAngle = rotationAngles[ringIndex];
            const ringGroup = new THREE.Group();
            ringGroup.name = `${ringNames[ringIndex]}_wash_ring`;

            // 3.1 创建环形主管道 - 使用精确半径和位置
            const ringGeometry = new THREE.TorusGeometry(nozzleRingRadius, pipeThickness, 8, 32);
            const ringPipe = new THREE.Mesh(ringGeometry, pipeMaterial);
            ringPipe.position.y = ringY;
            ringPipe.rotation.x = Math.PI / 2;
            ringPipe.rotation.y = rotationAngle; // 添加横向旋转
            ringGroup.add(ringPipe);

            // 3.2 创建连接到主供水管的分支管道 - 根据旋转角度调整位置
            const branchLength = radius * 0.2; // 连接管道长度
            const branchGeometry = new THREE.CylinderGeometry(pipeThickness, pipeThickness, branchLength, 8);
            const branch = new THREE.Mesh(branchGeometry, pipeMaterial);
            // 根据旋转角度计算分支管道位置
            const branchX = Math.cos(rotationAngle) * radius * 1.1;
            const branchZ = Math.sin(rotationAngle) * radius * 1.1;
            branch.position.set(branchX, ringY, branchZ);
            branch.rotation.z = Math.PI / 2;
            branch.rotation.y = rotationAngle; // 添加横向旋转
            ringGroup.add(branch);

            // 3.3 创建分支控制阀门 - 根据旋转角度调整位置
            const branchValveGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.3);
            const branchValve = new THREE.Mesh(branchValveGeometry, valveMaterial);
            const valveX = Math.cos(rotationAngle) * radius * 1.05;
            const valveZ = Math.sin(rotationAngle) * radius * 1.05;
            branchValve.position.set(valveX, ringY, valveZ);
            branchValve.rotation.y = rotationAngle; // 添加横向旋转
            ringGroup.add(branchValve);

            // 3.4 创建冲洗喷嘴（每圈8个，减少数量便于观察）
            const nozzleCount = 8;
            // 为下层喷嘴添加角度偏移，使上下层喷嘴错开分布
            const angleOffset = ringIndex === 0 ? 0 : Math.PI / nozzleCount; // 下层偏移半个间距
            
            for (let i = 0; i < nozzleCount; i++) {
                const angle = (i / nozzleCount) * Math.PI * 2 + rotationAngle + angleOffset;
                const x = Math.cos(angle) * nozzleRingRadius;
                const z = Math.sin(angle) * nozzleRingRadius;

                // 喷嘴连接短管（从环形管道伸出）
                const connectionLength = 0.3;
                const connectionGeometry = new THREE.CylinderGeometry(0.08, 0.08, connectionLength, 6);
                const connection = new THREE.Mesh(connectionGeometry, pipeMaterial);
                
                // 根据上下圈调整喷嘴方向
                if (ringIndex === 0) { // 上圈，向下喷射
                    connection.position.set(x, ringY - connectionLength/2, z);
                } else { // 下圈，向上喷射
                    connection.position.set(x, ringY + connectionLength/2, z);
                }
                ringGroup.add(connection);

                // 喷嘴主体 - 增大尺寸
                const nozzleGeometry = new THREE.ConeGeometry(0.1, 0.4, 8);
                const nozzle = new THREE.Mesh(nozzleGeometry, nozzleMaterial);
                
                if (ringIndex === 0) { // 上圈，向下喷射
                    nozzle.position.set(x, ringY - connectionLength - 0.2, z);
                    nozzle.rotation.x = Math.PI; // 向下
                } else { // 下圈，向上喷射
                    nozzle.position.set(x, ringY + connectionLength + 0.2, z);
                    nozzle.rotation.x = 0; // 向上
                }
                ringGroup.add(nozzle);
            }

            valveGroup.add(ringGroup);
            console.log(`添加${ringNames[ringIndex]}冲洗环,Y位置:${ringY}`);
        }

        console.log('冲洗水阀系统创建完成，组件数量:', valveGroup.children.length);
        return valveGroup;
    }

    /**
     * 创建水流喷射效果
     */
    createWaterSprayEffect(x, y, z, parent) {
        const particleCount = 50;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);

        for (let i = 0; i < particleCount; i++) {
            const i3 = i * 3;
            // 创建向下的水流粒子
            positions[i3] = x + (Math.random() - 0.5) * 0.2;
            positions[i3 + 1] = y - Math.random() * 2; // 向下流动
            positions[i3 + 2] = z + (Math.random() - 0.5) * 0.2;
        }

        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particleMaterial = new THREE.PointsMaterial({
            color: 0x87CEEB, // 天蓝色水滴
            size: 0.05,
            transparent: true,
            opacity: 0.7
        });

        const waterSpray = new THREE.Points(particles, particleMaterial);
        parent.add(waterSpray);
    }
    
    /**
     * 创建合金多孔托盘 - 位于第二层喷淋层下方
     * 参考2D图片设计，圆形托盘，半径与除雾器保持一致
     */
    createAlloyPerforatedTray() {
        const trayGroup = new THREE.Group();
        trayGroup.name = 'alloyPerforatedTray';
        
        // 托盘参数
        const trayRadius = 6; // 与喷淋层半径保持一致
        const trayThickness = 0.15; // 托盘厚度
        const secondSprayLayerY = 20; // 第二层喷淋层位置（更新为正确值）
        const trayY = 14.5; // 托盘位置固定在14.5米，确保所有喷淋层都在其上方
        
        // 合金材质 - 纯金色
        const alloyMaterial = new THREE.MeshPhongMaterial({
            color: 0x778899, // 纯金色
            metalness: 0.9,
            roughness: 0.1,
            shininess: 120,
            transparent: false,
            side: THREE.DoubleSide
        });
        
        // 支撑框架材质 - 红色
        const frameMaterial = new THREE.MeshPhongMaterial({
            color: 0x555555, // 纯红色
            metalness: 0.7,
            roughness: 0.2,
            shininess: 90
        });
        
        // 1. 创建主托盘底板
        const trayGeometry = new THREE.CylinderGeometry(trayRadius, trayRadius, trayThickness, 64);
        const trayMesh = new THREE.Mesh(trayGeometry, alloyMaterial);
        trayMesh.position.y = trayY;
        trayMesh.name = 'trayBase';
        trayGroup.add(trayMesh);
        
        // 2. 创建多孔结构 - 参考图片的蜂窝状孔洞
        this.createPerforations(trayRadius, trayY, trayThickness, alloyMaterial, trayGroup);
        
        // 3. 创建外圈支撑框架 - 参考图片的红色边框
        const frameGeometry = new THREE.TorusGeometry(trayRadius, 0.2, 16, 64);
        const frameMesh = new THREE.Mesh(frameGeometry, frameMaterial);
        frameMesh.position.y = trayY;
        frameMesh.rotation.x = Math.PI / 2;
        frameMesh.name = 'trayFrame';
        trayGroup.add(frameMesh);
        
        // 4. 创建径向支撑梁 - 参考图片的交叉支撑结构
        this.createRadialSupports(trayRadius, trayY, trayThickness, frameMaterial, trayGroup);
        
        // 5. 创建垂直支撑柱 - 连接到塔体
      
        
        // 6. 创建排液口
        this.createDrainageOutlets(trayRadius, trayY, alloyMaterial, trayGroup);
        
        // 7. 创建标签
        this.createTrayLabel(trayRadius, trayY, trayGroup);
        
        // 添加到内部组件
        this.components.set('alloyPerforatedTray', trayGroup);
        this.interiorGroup.add(trayGroup);
        
        console.log(`合金多孔托盘创建完成，位置Y=${trayY}，半径=${trayRadius}`);
    }
    
    /**
     * 创建托盘多孔结构 - 蜂窝状孔洞
     */
    createPerforations(radius, yPos, thickness, material, parent) {
        const perforationGroup = new THREE.Group();
        perforationGroup.name = 'perforations';
        
        // 蜂窝状孔洞参数
        const holeRadius = 0.15; // 孔洞半径
        const holeSpacing = 0.4; // 孔洞间距
        const rows = Math.floor(radius * 2 / holeSpacing);
        
        for (let row = 0; row < rows; row++) {
            const y = (row - rows/2) * holeSpacing;
            const rowRadius = Math.sqrt(radius * radius - y * y);
            const holesInRow = Math.floor(rowRadius * 2 / holeSpacing);
            
            for (let col = 0; col < holesInRow; col++) {
                const x = (col - holesInRow/2) * holeSpacing;
                
                // 检查是否在圆形范围内
                const distanceFromCenter = Math.sqrt(x * x + y * y);
                if (distanceFromCenter > radius - 0.3) continue; // 边缘留出空间
                
                // 创建孔洞（通过减去圆柱体实现）
                const holeGeometry = new THREE.CylinderGeometry(holeRadius, holeRadius, thickness * 1.2, 12);
                const holeMesh = new THREE.Mesh(holeGeometry, new THREE.MeshBasicMaterial({
                    color: 0x000000,
                    transparent: true,
                    opacity: 0.8
                }));
                holeMesh.position.set(x, yPos, y);
                perforationGroup.add(holeMesh);
                
                // 创建孔洞边缘加强环
                const ringGeometry = new THREE.TorusGeometry(holeRadius + 0.02, 0.01, 8, 16);
                const ringMesh = new THREE.Mesh(ringGeometry, material);
                ringMesh.position.set(x, yPos + thickness/2, y);
                ringMesh.rotation.x = Math.PI / 2;
                perforationGroup.add(ringMesh);
            }
        }
        
        parent.add(perforationGroup);
    }
    
    /**
     * 创建径向支撑梁
     */
    createRadialSupports(radius, yPos, thickness, material, parent) {
        const supportGroup = new THREE.Group();
        supportGroup.name = 'radialSupports';
        
        // 创建8根径向支撑梁
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            
            // 主支撑梁
            const beamGeometry = new THREE.BoxGeometry(0.1, thickness * 2, radius * 1.8);
            const beamMesh = new THREE.Mesh(beamGeometry, material);
            beamMesh.position.set(0, yPos, 0);
            beamMesh.rotation.y = angle;
            supportGroup.add(beamMesh);
            
            // 次级支撑梁（45度偏移）
            if (i % 2 === 0) {
                const secondaryAngle = angle + Math.PI / 8;
                const secondaryBeamGeometry = new THREE.BoxGeometry(0.08, thickness * 1.5, radius * 1.2);
                const secondaryBeamMesh = new THREE.Mesh(secondaryBeamGeometry, material);
                secondaryBeamMesh.position.set(0, yPos, 0);
                secondaryBeamMesh.rotation.y = secondaryAngle;
                supportGroup.add(secondaryBeamMesh);
            }
        }
        
        // 创建同心圆支撑环
        for (let r = 2; r < radius; r += 2) {
            const ringGeometry = new THREE.TorusGeometry(r, 0.05, 8, 32);
            const ringMesh = new THREE.Mesh(ringGeometry, material);
            ringMesh.position.y = yPos;
            ringMesh.rotation.x = Math.PI / 2;
            supportGroup.add(ringMesh);
        }
        
        parent.add(supportGroup);
    }
    
    /**
     * 创建托盘垂直支撑柱
     */
    createTraySupports(radius, yPos, material, parent) {
        const supportGroup = new THREE.Group();
        supportGroup.name = 'traySupports';
        
        // 创建6根垂直支撑柱，连接到塔体内壁
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const supportRadius = radius + 0.3; // 稍微外移到塔体内壁
            
            const columnGeometry = new THREE.CylinderGeometry(0.1, 0.1, 4, 12);
            const columnMesh = new THREE.Mesh(columnGeometry, material);
            columnMesh.position.set(
                Math.cos(angle) * supportRadius,
                yPos - 2, // 向下延伸2个单位
                Math.sin(angle) * supportRadius
            );
            supportGroup.add(columnMesh);
            
            // 支撑柱顶部连接板
            const plateGeometry = new THREE.BoxGeometry(0.3, 0.1, 0.3);
            const plateMesh = new THREE.Mesh(plateGeometry, material);
            plateMesh.position.set(
                Math.cos(angle) * supportRadius,
                yPos + 0.1,
                Math.sin(angle) * supportRadius
            );
            supportGroup.add(plateMesh);
        }
        
        parent.add(supportGroup);
    }
    
    /**
     * 创建排液口
     */
    createDrainageOutlets(radius, yPos, material, parent) {
        const drainGroup = new THREE.Group();
        drainGroup.name = 'drainageOutlets';
        
        // 创建4个排液口，均匀分布
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const drainRadius = radius * 0.7; // 位于托盘内侧
            
            // 排液管
            const drainGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.5, 12);
            const drainMesh = new THREE.Mesh(drainGeometry, material);
            drainMesh.position.set(
                Math.cos(angle) * drainRadius,
                yPos - 0.25,
                Math.sin(angle) * drainRadius
            );
            drainGroup.add(drainMesh);
            
            // 排液口法兰
            const flangeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
            const flangeMesh = new THREE.Mesh(flangeGeometry, material);
            flangeMesh.position.set(
                Math.cos(angle) * drainRadius,
                yPos + 0.1,
                Math.sin(angle) * drainRadius
            );
            drainGroup.add(flangeMesh);
        }
        
        parent.add(drainGroup);
    }

    /**
     * 创建托盘标签
     */
    createTrayLabel(radius, yPos, parent) {
        // 使用正确的Sprite标签实现方式
        const trayLabel = this.createTextLabel('金属托盘', '#FF8C00'); // 橙色标签
        
        // 设置标签位置 - 在托盘下方，紧贴托盘下边界
        // 托盘厚度为0.15，托盘下边界为yPos - 0.075，标签放在下方0.3个单位
        const trayThickness = 0.15;
        const labelY = yPos - trayThickness/2 - 0.3; // 托盘下边界下方0.3个单位
        trayLabel.position.set(-radius * 1.4, labelY, 0);
        trayLabel.name = 'trayLabel';
        
        // 设置渲染层级，确保标签始终在最前面显示，解决穿模问题
        trayLabel.renderOrder = 999;
        trayLabel.material.depthTest = false; // 禁用深度测试，确保标签不被遮挡
        trayLabel.material.depthWrite = false; // 禁用深度写入
        
        parent.add(trayLabel);
        
        console.log(`托盘标签创建完成 - 位置: (-${radius * 1.4}, ${labelY}, 0)，渲染层级: 999`);
    }

    /**
     * 创建除雾器丝网 - 精细化波纹结构
     */
    createDemisterMesh(yPos, thickness, layerIndex, parent) {
        // 参数验证
        if (isNaN(yPos) || isNaN(thickness)) {
            console.warn('createDemisterMesh: 输入参数包含NaN值', { yPos, thickness, layerIndex });
            return;
        }
        
        const meshGroup = new THREE.Group();
        meshGroup.name = `demister_mesh_${layerIndex + 1}`;
        
        // 创建波纹状丝网层
        const waveCount = 8; // 波纹数量
        const radiusSegments = 32;
        
        for (let wave = 0; wave < waveCount; wave++) {
            const waveGroup = new THREE.Group();
            
            // 每个波纹层的半径
            const baseRadius = 1 + wave * 0.8;
            const maxRadius = Math.min(baseRadius + 0.6, 7);
            
            // 验证半径值
            if (isNaN(baseRadius) || isNaN(maxRadius)) {
                console.warn('createDemisterMesh: 半径计算出现NaN', { wave, baseRadius, maxRadius });
                continue;
            }
            
            // 创建波纹丝网
            for (let segment = 0; segment < radiusSegments; segment++) {
                const angle = (segment / radiusSegments) * Math.PI * 2;
                
                // 验证角度
                if (isNaN(angle)) {
                    console.warn('createDemisterMesh: 角度计算出现NaN', { segment, angle });
                    continue;
                }
                
                // 波纹高度变化
                const waveHeight = Math.sin(segment * 0.5) * 0.3;
                
                // 验证波纹高度
                if (isNaN(waveHeight)) {
                    console.warn('createDemisterMesh: 波纹高度计算出现NaN', { segment, waveHeight });
                    continue;
                }
                
                // 创建丝网片段
                const wireGeometry = this.validator.createSafeGeometry(
                    () => new THREE.PlaneGeometry(0.4, thickness * 0.8),
                    'PlaneGeometry'
                );
                const wireMaterial = new THREE.MeshPhongMaterial({
                    color: 0xC0C0C0,
                    transparent: true,
                    opacity: 0.7,
                    side: THREE.DoubleSide,
                    wireframe: false
                });
                
                const wireMesh = new THREE.Mesh(wireGeometry, wireMaterial);
                
                // 位置计算
                const radius = baseRadius + Math.sin(segment * 0.3) * 0.2;
                const x = Math.cos(angle) * radius;
                const y = yPos + waveHeight;
                const z = Math.sin(angle) * radius;
                
                // 验证位置值
                if (isNaN(x) || isNaN(y) || isNaN(z) || isNaN(radius)) {
                    console.warn('createDemisterMesh: 位置计算出现NaN', { 
                        segment, wave, x, y, z, radius, angle, baseRadius, waveHeight 
                    });
                    continue;
                }
                
                wireMesh.position.set(x, y, z);
                
                // 旋转计算
                const rotationY = angle + Math.PI / 2;
                const rotationX = Math.sin(segment * 0.4) * 0.3;
                
                // 验证旋转值
                if (isNaN(rotationY) || isNaN(rotationX)) {
                    console.warn('createDemisterMesh: 旋转计算出现NaN', { rotationY, rotationX });
                    continue;
                }
                
                // 旋转使其面向中心并形成波纹
                wireMesh.rotation.y = rotationY;
                wireMesh.rotation.x = rotationX;
                
                if (radius <= maxRadius) {
                    waveGroup.add(wireMesh);
                }
            }
            
            meshGroup.add(waveGroup);
        }
        
        // 添加细密的丝网纤维
        this.createFineWires(yPos, thickness, meshGroup);
        
        parent.add(meshGroup);
    }
    
    /**
     * 创建细密丝网纤维
     */
    createFineWires(yPos, thickness, parent) {
        // 参数验证
        if (isNaN(yPos) || isNaN(thickness)) {
            console.warn('createFineWires: 输入参数包含NaN值', { yPos, thickness });
            return;
        }
        
        const fiberGroup = new THREE.Group();
        fiberGroup.name = 'fine_wires';
        
        // 创建随机分布的细丝
        for (let i = 0; i < 200; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 6.5;
            
            // 验证随机值
            if (isNaN(angle) || isNaN(radius)) {
                console.warn('createFineWires: 随机值计算出现NaN', { i, angle, radius });
                continue;
            }
            
            const fiberGeometry = this.validator.createSafeGeometry(
                () => new THREE.CylinderGeometry(0.01, 0.01, thickness * 0.6, 4),
                'CylinderGeometry'
            );
            const fiberMaterial = new THREE.MeshPhongMaterial({
                color: 0xB0B0B0,
                transparent: true,
                opacity: 0.6
            });
            
            const fiberMesh = new THREE.Mesh(fiberGeometry, fiberMaterial);
            
            // 位置计算
            const x = Math.cos(angle) * radius;
            const y = yPos + (Math.random() - 0.5) * thickness * 0.4;
            const z = Math.sin(angle) * radius;
            
            // 验证位置值
            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                console.warn('createFineWires: 位置计算出现NaN', { i, x, y, z, angle, radius });
                continue;
            }
            
            fiberMesh.position.set(x, y, z);
            
            // 随机倾斜
            const rotationX = (Math.random() - 0.5) * 0.8;
            const rotationZ = (Math.random() - 0.5) * 0.8;
            
            // 验证旋转值
            if (isNaN(rotationX) || isNaN(rotationZ)) {
                console.warn('createFineWires: 旋转计算出现NaN', { i, rotationX, rotationZ });
                continue;
            }
            
            fiberMesh.rotation.x = rotationX;
            fiberMesh.rotation.z = rotationZ;
            
            fiberGroup.add(fiberMesh);
        }
        
        parent.add(fiberGroup);
    }
    
    /**
     * 创建冲洗系统
     */
    createWashingSystem(yPos, parent) {
        // 参数验证
        if (isNaN(yPos)) {
            console.warn('createWashingSystem: yPos参数包含NaN值', { yPos });
            return;
        }
        
        const washGroup = new THREE.Group();
        washGroup.name = 'washing_system';
        
        // 冲洗管道环
        const washRingGeometry = this.validator.createSafeGeometry(
            () => new THREE.TorusGeometry(6, 0.15, 8, 32),
            'TorusGeometry'
        );
        const washRingMesh = new THREE.Mesh(washRingGeometry, this.materials.pipe);
        washRingMesh.position.y = yPos;
        washRingMesh.rotation.x = -Math.PI / 2;
        washGroup.add(washRingMesh);
        
        // 冲洗喷嘴
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            
            // 验证角度
            if (isNaN(angle)) {
                console.warn('createWashingSystem: 角度计算出现NaN', { i, angle });
                continue;
            }
            
            const nozzleGeometry = this.validator.createSafeGeometry(
                () => new THREE.ConeGeometry(0.05, 0.2, 8),
                'ConeGeometry'
            );
            const nozzleMesh = new THREE.Mesh(nozzleGeometry, this.materials.spray);
            
            // 位置计算
            const x = Math.cos(angle) * 6;
            const y = yPos - 0.1;
            const z = Math.sin(angle) * 6;
            
            // 验证位置值
            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                console.warn('createWashingSystem: 位置计算出现NaN', { i, x, y, z, angle });
                continue;
            }
            
            nozzleMesh.position.set(x, y, z);
            nozzleMesh.rotation.x = Math.PI;
            washGroup.add(nozzleMesh);
        }
        
        parent.add(washGroup);
    }
    
    /**
     * 创建支撑格栅
     */
    createSupportGrid(yPos, parent) {
        const gridGroup = new THREE.Group();
        
        // 径向支撑
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const beamGeometry = this.validator.createSafeGeometry(
                () => new THREE.BoxGeometry(0.2, 0.2, 14),
                'BoxGeometry'
            );
            const beamMesh = new THREE.Mesh(beamGeometry, this.materials.steel);
            beamMesh.position.set(0, yPos, 0);
            beamMesh.rotation.y = angle;
            gridGroup.add(beamMesh);
        }
        
        // 环形支撑
        for (let r = 2; r < 7; r += 2) {
            const ringGeometry = this.validator.createSafeGeometry(
                () => new THREE.TorusGeometry(r, 0.1, 8, 32),
                'TorusGeometry'
            );
            const ringMesh = new THREE.Mesh(ringGeometry, this.materials.steel);
            ringMesh.position.y = yPos;
            ringMesh.rotation.x = -Math.PI / 2;
            gridGroup.add(ringMesh);
        }
        
        parent.add(gridGroup);
    }
    

    
    /**
     * 创建内部支撑结构
     */
    createInternalSupports() {
        const supportGroup = new THREE.Group();
        supportGroup.name = 'internalSupports';
        
        // 垂直支撑柱
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, 28, 8);
            const columnMesh = new THREE.Mesh(columnGeometry, this.materials.steel);
            columnMesh.position.set(
                Math.cos(angle) * 6,
                14,
                Math.sin(angle) * 6
            );
            supportGroup.add(columnMesh);
        }
        
        // 水平支撑梁
        for (let y = 8; y < 25; y += 4) {
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const nextAngle = ((i + 1) / 6) * Math.PI * 2;
                
                const beamGeometry = new THREE.CylinderGeometry(0.15, 0.15, 12, 8);
                const beamMesh = new THREE.Mesh(beamGeometry, this.materials.steel);
                beamMesh.position.set(
                    (Math.cos(angle) + Math.cos(nextAngle)) * 3,
                    y,
                    (Math.sin(angle) + Math.sin(nextAngle)) * 3
                );
                beamMesh.rotation.y = angle + Math.PI / 6;
                beamMesh.rotation.z = Math.PI / 2;
                supportGroup.add(beamMesh);
            }
        }
        
        this.interiorGroup.add(supportGroup);
    }
    
    /**
     * 创建液体收集系统
     */
    createLiquidCollection() {
        const collectionGroup = new THREE.Group();
        collectionGroup.name = 'liquidCollection';
        
        // 底部液体池
        const poolGeometry = new THREE.CylinderGeometry(7, 7, 2, 32);
        const poolMesh = new THREE.Mesh(poolGeometry, this.materials.liquid);
        poolMesh.position.y = 1;
        collectionGroup.add(poolMesh);
        
        // 在蓝色圆柱上方添加水池
        this.createWaterPoolOnTop(collectionGroup);
        
        // 液体表面波纹效果
        const waveGeometry = new THREE.PlaneGeometry(14, 14, 32, 32);
        const waveMaterial = new THREE.MeshPhongMaterial({
            color: 0x1E90FF,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const waveMesh = new THREE.Mesh(waveGeometry, waveMaterial);
        waveMesh.position.y = 2;
        waveMesh.rotation.x = -Math.PI / 2;
        collectionGroup.add(waveMesh);
        
        // 收集槽
        for (let layer = 0; layer < 3; layer++) {
            const yPos = 10 + layer * 6;
            const troughGeometry = new THREE.TorusGeometry(6.5, 0.3, 8, 32);
            const troughMesh = new THREE.Mesh(troughGeometry, this.materials.steel);
            troughMesh.position.y = yPos;
            troughMesh.rotation.x = -Math.PI / 2;
            collectionGroup.add(troughMesh);
            
            // 排液管
            for (let i = 0; i < 4; i++) {
                const angle = (i / 4) * Math.PI * 2;
                const drainGeometry = new THREE.CylinderGeometry(0.1, 0.1, 6, 8);
                const drainMesh = new THREE.Mesh(drainGeometry, this.materials.pipe);
                drainMesh.position.set(
                    Math.cos(angle) * 6.5,
                    yPos - 3,
                    Math.sin(angle) * 6.5
                );
                collectionGroup.add(drainMesh);
            }
        }
        
        this.interiorGroup.add(collectionGroup);
    }
    
    /**
     * 创建工艺管道
     */
    createProcessPipes(config = {}) {
        const pipesGroup = new THREE.Group();
        pipesGroup.name = 'processPipes';
        
        const pipeCount = config.count || 6;
        const pipeRadius = config.radius || 0.2;
        
        // 主要工艺管道
        const mainPipes = [
            { start: [8, 5, 0], end: [8, 25, 0], name: '进料管' },
            { start: [-8, 5, 0], end: [-8, 25, 0], name: '出料管' },
            { start: [0, 2, 8], end: [0, 2, -8], name: '底部排液管' },
            { start: [0, 28, 6], end: [0, 28, -6], name: '顶部排气管' }
        ];
        
        mainPipes.forEach((pipeData, index) => {
            const [startX, startY, startZ] = pipeData.start;
            const [endX, endY, endZ] = pipeData.end;
            
            // 计算管道长度和方向
            const length = Math.sqrt(
                Math.pow(endX - startX, 2) + 
                Math.pow(endY - startY, 2) + 
                Math.pow(endZ - startZ, 2)
            );
            
            const pipeGeometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, length, 12);
            const pipeMesh = new THREE.Mesh(pipeGeometry, this.materials.pipe);
            
            // 设置管道位置和旋转
            pipeMesh.position.set(
                (startX + endX) / 2,
                (startY + endY) / 2,
                (startZ + endZ) / 2
            );
            
            // 计算旋转角度
            const direction = new THREE.Vector3(endX - startX, endY - startY, endZ - startZ);
            direction.normalize();
            const up = new THREE.Vector3(0, 1, 0);
            const quaternion = new THREE.Quaternion().setFromUnitVectors(up, direction);
            pipeMesh.setRotationFromQuaternion(quaternion);
            
            pipeMesh.name = pipeData.name;
            pipesGroup.add(pipeMesh);
            
            // 添加管道接头
            const jointGeometry = new THREE.SphereGeometry(pipeRadius * 1.5, 8, 8);
            const startJoint = new THREE.Mesh(jointGeometry, this.materials.steel);
            startJoint.position.set(startX, startY, startZ);
            pipesGroup.add(startJoint);
            
            const endJoint = new THREE.Mesh(jointGeometry, this.materials.steel);
            endJoint.position.set(endX, endY, endZ);
            pipesGroup.add(endJoint);
        });
        
        // 添加阀门
        this.createValves(pipesGroup);
        
        this.components.set('processPipes', pipesGroup);
        this.interiorGroup.add(pipesGroup);
    }
    
    /**
     * 创建阀门
     */
    createValves(parent) {
        const valvePositions = [
            [8, 10, 0], [-8, 10, 0], [0, 2, 6]
        ];
        
        valvePositions.forEach((pos, index) => {
            const valveGroup = new THREE.Group();
            
            // 阀门主体
            const bodyGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.4);
            const bodyMesh = new THREE.Mesh(bodyGeometry, this.materials.steel);
            valveGroup.add(bodyMesh);
            
            // 阀门手轮
            const wheelGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
            const wheelMesh = new THREE.Mesh(wheelGeometry, this.materials.steel);
            wheelMesh.position.y = 0.3;
            wheelMesh.rotation.x = Math.PI / 2;
            valveGroup.add(wheelMesh);
            
            // 手轮辐条
            for (let i = 0; i < 6; i++) {
                const angle = (i / 6) * Math.PI * 2;
                const spokeGeometry = new THREE.BoxGeometry(0.05, 0.25, 0.05);
                const spokeMesh = new THREE.Mesh(spokeGeometry, this.materials.steel);
                spokeMesh.position.set(
                    Math.cos(angle) * 0.15,
                    0.3,
                    Math.sin(angle) * 0.15
                );
                spokeMesh.rotation.y = angle;
                valveGroup.add(spokeMesh);
            }
            
            valveGroup.position.set(pos[0], pos[1], pos[2]);
            valveGroup.name = `valve_${index + 1}`;
            parent.add(valveGroup);
        });
    }
    

    
    /**
     * 设置动画
     */
    setupAnimations() {
        // 喷雾动画
        this.animateSpray();
        
        // 液体流动动画
        this.animateLiquidFlow();
        
        // 气体流动动画
        this.animateGasFlow();
        
        // 水面波动动画
        this.animateWaterSurface();
    }
    
    /**
     * 喷雾动画
     */
    animateSpray() {
        const sprayLayers = this.interiorGroup.getObjectByName('sprayLayers');
        if (sprayLayers) {
            sprayLayers.children.forEach((layer, index) => {
                layer.children.forEach(child => {
                    if (child.material && child.material.color && child.material.color.getHex() === 0x00FF7F) {
                        // 喷嘴脉动效果
                        const originalScale = child.scale.clone();
                        const animate = () => {
                            const time = Date.now() * 0.005 + index;
                            child.scale.setScalar(originalScale.x * (1 + Math.sin(time) * 0.2));
                            requestAnimationFrame(animate);
                        };
                        animate();
                    }
                });
            });
        }
    }
    
    /**
     * 液体流动动画
     */
    animateLiquidFlow() {
        const liquidCollection = this.interiorGroup.getObjectByName('liquidCollection');
        if (liquidCollection) {
            const waveMesh = liquidCollection.children.find(child => 
                child.geometry instanceof THREE.PlaneGeometry
            );
            if (waveMesh) {
                const animate = () => {
                    const time = Date.now() * 0.001;
                    const positions = waveMesh.geometry.attributes.position;
                    for (let i = 0; i < positions.count; i++) {
                        const x = positions.getX(i);
                        const z = positions.getZ(i);
                        const wave = Math.sin(x * 0.5 + time) * Math.cos(z * 0.5 + time) * 0.1;
                        positions.setY(i, wave);
                    }
                    positions.needsUpdate = true;
                    requestAnimationFrame(animate);
                };
                animate();
            }
        }
    }
    
    /**
     * 气体流动动画
     */
    animateGasFlow() {
        // 创建气体流动粒子效果
        const particleCount = 200;
        const particles = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount; i++) {
            const angle = Math.random() * Math.PI * 2;
            const radius = Math.random() * 6;
            
            // 验证角度和半径
            if (isNaN(angle) || isNaN(radius)) {
                console.warn('animateGasFlow: 角度或半径为NaN', angle, radius);
                continue;
            }
            
            const x = Math.cos(angle) * radius;
            const y = Math.random() * 30;
            const z = Math.sin(angle) * radius;
            
            // 验证位置计算结果
            if (isNaN(x) || isNaN(y) || isNaN(z)) {
                console.warn('animateGasFlow: 位置计算出现NaN', x, y, z);
                positions[i * 3] = 0;
                positions[i * 3 + 1] = 0;
                positions[i * 3 + 2] = 0;
            } else {
                positions[i * 3] = x;
                positions[i * 3 + 1] = y;
                positions[i * 3 + 2] = z;
            }
            
            const vx = (Math.random() - 0.5) * 0.02;
            const vy = 0.05 + Math.random() * 0.05;
            const vz = (Math.random() - 0.5) * 0.02;
            
            // 验证速度计算结果
            if (isNaN(vx) || isNaN(vy) || isNaN(vz)) {
                console.warn('animateGasFlow: 速度计算出现NaN', vx, vy, vz);
                velocities[i * 3] = 0;
                velocities[i * 3 + 1] = 0.05;
                velocities[i * 3 + 2] = 0;
            } else {
                velocities[i * 3] = vx;
                velocities[i * 3 + 1] = vy;
                velocities[i * 3 + 2] = vz;
            }
        }
        
        particles.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xFFFFFF,
            size: 0.05,
            transparent: true,
            opacity: 0.3
        });
        
        const particleSystem = new THREE.Points(particles, particleMaterial);
        this.interiorGroup.add(particleSystem);
        
        // 粒子动画
        const animate = () => {
            const positions = particleSystem.geometry.attributes.position;
            for (let i = 0; i < particleCount; i++) {
                const newX = positions.array[i * 3] + velocities[i * 3];
                const newY = positions.array[i * 3 + 1] + velocities[i * 3 + 1];
                const newZ = positions.array[i * 3 + 2] + velocities[i * 3 + 2];
                
                // 验证新位置
                if (!isNaN(newX) && !isNaN(newY) && !isNaN(newZ)) {
                    positions.array[i * 3] = newX;
                    positions.array[i * 3 + 1] = newY;
                    positions.array[i * 3 + 2] = newZ;
                }
                
                // 重置超出边界的粒子
                if (positions.array[i * 3 + 1] > 30) {
                    const angle = Math.random() * Math.PI * 2;
                    const radius = Math.random() * 6;
                    
                    if (!isNaN(angle) && !isNaN(radius)) {
                        const resetX = Math.cos(angle) * radius;
                        const resetZ = Math.sin(angle) * radius;
                        
                        if (!isNaN(resetX) && !isNaN(resetZ)) {
                            positions.array[i * 3] = resetX;
                            positions.array[i * 3 + 1] = 0;
                            positions.array[i * 3 + 2] = resetZ;
                        }
                    }
                }
            }
            positions.needsUpdate = true;
            requestAnimationFrame(animate);
        };
        animate();
    }
    
    /**
     * 水面波动动画 - 增强流动效果
     */
    animateWaterSurface() {
        if (!this.waterSurface) {
            console.warn('水面网格未找到，跳过水面动画');
            return;
        }
        
        const waterSurface = this.waterSurface;
        const geometry = waterSurface.geometry;
        const positionAttribute = geometry.attributes.position;
        const originalPositions = positionAttribute.array.slice(); // 保存原始位置
        
        const animate = () => {
            const time = Date.now() * 0.001; // 时间因子
            
            // 遍历所有顶点，创建更强烈的波动效果
            for (let i = 0; i < positionAttribute.count; i++) {
                const x = originalPositions[i * 3];     // X坐标
                const z = originalPositions[i * 3 + 2]; // Z坐标
                const r = Math.sqrt(x * x + z * z);     // 距离中心的半径
                
                // 创建多重波动效果，模拟流动的水面
                const wave1 = Math.sin(x * 0.2 + time * 3) * 0.08;        // 主波（增强）
                const wave2 = Math.sin(z * 0.25 + time * 2.5) * 0.06;     // 次波（增强）
                const wave3 = Math.sin((x + z) * 0.15 + time * 4) * 0.04; // 斜向波（增强）
                const radialWave = Math.sin(r * 0.3 + time * 2) * 0.05;   // 径向波（新增）
                const spiralWave = Math.sin(Math.atan2(z, x) * 3 + time * 1.5) * 0.03; // 螺旋波（新增）
                
                // 叠加所有波动效果
                const waveHeight = wave1 + wave2 + wave3 + radialWave + spiralWave;
                positionAttribute.setY(i, waveHeight);
            }
            
            // 更新几何体
            positionAttribute.needsUpdate = true;
            geometry.computeVertexNormals(); // 重新计算法线以获得正确的光照效果
            
            // 动画粒子流动
            this.animateWaterFlowParticles();
            
            // 动画涡流旋转
            this.animateWaterVortex();
            
            // 动画水流纹理
            this.animateWaterStreams();
            
            requestAnimationFrame(animate);
        };
        
        animate();
        console.log('增强水面流动动画已启动');
    }
    
    /**
     * 粒子流动动画
     */
    animateWaterFlowParticles() {
        if (!this.waterFlowParticles) return;
        
        const particles = this.waterFlowParticles;
        const positions = particles.geometry.attributes.position;
        const velocities = particles.userData.velocities;
        const radius = particles.userData.radius;
        const time = Date.now() * 0.001;
        
        for (let i = 0; i < positions.count; i++) {
            const x = positions.getX(i);
            const z = positions.getZ(i);
            const currentRadius = Math.sqrt(x * x + z * z);
            
            // 如果粒子超出边界，重新定位到中心附近
            if (currentRadius > radius * 0.9) {
                const angle = Math.random() * Math.PI * 2;
                const newR = Math.random() * radius * 0.3;
                positions.setX(i, Math.cos(angle) * newR);
                positions.setZ(i, Math.sin(angle) * newR);
            } else {
                // 螺旋流动
                const angle = Math.atan2(z, x);
                const spiralSpeed = 0.02;
                const radialSpeed = 0.005;
                
                const newAngle = angle + spiralSpeed;
                const newRadius = currentRadius + radialSpeed;
                
                positions.setX(i, Math.cos(newAngle) * newRadius);
                positions.setZ(i, Math.sin(newAngle) * newRadius);
            }
        }
        
        positions.needsUpdate = true;
    }
    
    /**
     * 涡流旋转动画
     */
    animateWaterVortex() {
        if (!this.waterVortex) return;
        
        const time = Date.now() * 0.001;
        
        this.waterVortex.children.forEach((ring, index) => {
            // 不同圆环以不同速度旋转
            const rotationSpeed = 0.5 + index * 0.2;
            ring.rotation.z = time * rotationSpeed;
            
            // 添加脉动效果
            const scale = 1 + Math.sin(time * 2 + index) * 0.1;
            ring.scale.setScalar(scale);
        });
    }
    
    /**
     * 水流纹理动画
     */
    animateWaterStreams() {
        if (!this.waterStreams) return;
        
        const time = Date.now() * 0.001;
        
        this.waterStreams.children.forEach((stream, index) => {
            // 流线的波动效果
            const wave = Math.sin(time * 3 + index * 0.5) * 0.3;
            stream.scale.y = 1 + wave;
            
            // 透明度变化模拟流动
            const opacity = 0.4 + Math.sin(time * 2 + index * 0.8) * 0.2;
            stream.material.opacity = opacity;
        });
    }
    
    /**
     * 通用的过渡函数
     * @param {Array} fromGroup - 需要淡出的对象数组
     * @param {Object} toGroup - 需要淡入的根节点
     * @param {Object} options - 选项配置
     */
    transitionFade(fromGroup, toGroup, options = {}) {
        const duration = options.duration || 1000;
        
        // 先把所有材质都设置为 transparent，方便改 opacity
        const setTransparent = obj => {
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.transparent = true);
                } else {
                    obj.material.transparent = true;
                }
            }
            obj.children.forEach(setTransparent);
        };
        
        fromGroup.forEach(setTransparent);
        setTransparent(toGroup);
        
        // 确保要淡入的组是可见的，初始 opacity=0
        toGroup.visible = true;
        toGroup.traverse(obj => {
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(m => m.opacity = 0);
                } else {
                    obj.material.opacity = 0;
                }
            }
        });
        
        const start = performance.now();
        const animate = now => {
            const t = Math.min((now - start) / duration, 1);
            
            // 淡出
            fromGroup.forEach(obj => obj.traverse(o => {
                if (o.material) {
                    if (Array.isArray(o.material)) o.material.forEach(m => m.opacity = 1 - t);
                    else o.material.opacity = 1 - t;
                }
            }));
            
            // 淡入
            toGroup.traverse(o => {
                if (o.material) {
                    if (Array.isArray(o.material)) o.material.forEach(m => m.opacity = t);
                    else o.material.opacity = t;
                }
            });
            
            if (t < 1) {
                requestAnimationFrame(animate);
            } else {
                // 完成后彻底隐藏 fromGroup
                fromGroup.forEach(obj => obj.visible = false);
                // 恢复 toGroup 材质到不透明
                toGroup.traverse(o => {
                    if (o.material) {
                        if (Array.isArray(o.material)) o.material.forEach(m => { 
                            m.opacity = 1; 
                            m.transparent = m.transparent; 
                        });
                        else { 
                            o.material.opacity = 1; 
                            o.material.transparent = o.material.transparent; 
                        }
                    }
                });
            }
        };
        requestAnimationFrame(animate);
    }

    /**
     * 切换到内部视图 - 带过渡动画
     */
    async showInterior() {
        await this.waitForInitialization();
        
        const exteriorObjs = this.group.children.filter(c => c !== this.interiorGroup);
        this.transitionFade(exteriorObjs, this.interiorGroup, { duration: 1000 });
        
        // 显示标签
        const labels = this.components.get('componentLabels');
        if (labels) {
            labels.visible = true;
            // 确保标签始终面向相机
            labels.children.forEach(label => {
                label.material.depthTest = false;
                label.renderOrder = 999;
            });
        }
        
        this.isInteriorView = true;
        document.getElementById('current-view').textContent = '当前视图：内部详细';
    }
    
    /**
     * 切换到外部视图 - 带过渡动画
     */
    async showExterior() {
        await this.waitForInitialization();
        
        const exteriorObjs = this.group.children.filter(c => c !== this.interiorGroup);
        
        // 先把外部全部 set visible=true, opacity=0
        exteriorObjs.forEach(o => { o.visible = true; });
        
        // 创建虚拟容器来处理外部对象的淡入
        const virtualContainer = {
            traverse: fn => exteriorObjs.forEach(o => o.traverse(fn)),
            children: [],
            material: null,
            visible: true
        };
        
        this.transitionFade([this.interiorGroup], virtualContainer, { duration: 1000 });
        
        // 隐藏标签
        const labels = this.components.get('componentLabels');
        if (labels) {
            labels.visible = false;
        }
        
        // 入口点标识已删除，无需恢复显示
        // const entryPoint = this.components.get('entryPoint');
        // if (entryPoint) {
        //     entryPoint.visible = true;
        // }
        
        // 如果是主塔体，恢复原始材质
        exteriorObjs.forEach(child => {
            if (child.name === 'mainTower') {
                child.material = this.materials.steel;
                child.material.depthWrite = true;
                child.material.opacity = 0.9;
                child.renderOrder = 0;
            }
        });
        
        this.isInteriorView = false;
        document.getElementById('current-view').textContent = '当前视图：外部总览';
    }
    
    /**
     * 获取3D对象组
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * 切换线框模式
     */
    toggleWireframe() {
        const toggle = (obj) => {
            // 跳过标签组件，保持标签在线框模式下正常显示
            if (obj.name === 'componentLabels' || obj.type === 'Sprite') {
                return;
            }
            
            if (obj.material) {
                if (Array.isArray(obj.material)) {
                    obj.material.forEach(mat => mat.wireframe = !mat.wireframe);
                } else {
                    obj.material.wireframe = !obj.material.wireframe;
                }
            }
            obj.children.forEach(toggle);
        };
        toggle(this.group);
    }
    
    /**
     * 创建组件标签
     */
    createComponentLabels() {
        const labelGroup = new THREE.Group();
        labelGroup.name = 'componentLabels';
        labelGroup.visible = false;
        
        // 先生成所有其他硬编码标签
        const labelConfigs = [
            { name: 'sprayLayers', text: '喷淋层', position: [0, 16, 7], color: '#00FF00' },
            { name: 'liquidCollection', text: '液体收集系统', position: [0, 2, 7], color: '#00CCFF' },
            { name: 'absorbent', text: '浆液', position: [7, 22, 0], color: '#0088FF' }
        ];
        
        labelConfigs.forEach(cfg => {
            const label = this._makeLabelSprite(cfg.text, cfg.color);
            label.position.set(...cfg.position);
            labelGroup.add(label);
        });
        
        // 然后为 demisters 动态生成一个标签
        const demisterObj = this.components.get('demisters');
        if (demisterObj) {
            // 计算包围盒
            const bbox = new THREE.Box3().setFromObject(demisterObj);
            const size = bbox.getSize(new THREE.Vector3());
            const center = bbox.getCenter(new THREE.Vector3());
            
            // 让标签靠在右侧边界，略微外移 1m
            const labelX = bbox.max.x + 1;
            // 让标签垂直居中
            const labelY = center.y;
            // z 轴对齐包围盒中心
            const labelZ = center.z;
            
            // 根据塔的类型决定除雾器标签文本
            if (this.towerConfig.hasWetESP) {
                // 二级塔：双层除雾器系统，需要两个标签（正确的工艺流程顺序）
                // 下层屋脊式除雾器标签（第一级处理）
                const ridgeLabel = this._makeLabelSprite('屋脊式除雾器', '#FF8800');
                ridgeLabel.position.set(labelX, 28, labelZ); // 28米高度
                labelGroup.add(ridgeLabel);
                
                // 上层管式除雾器标签（第二级处理）
                const tubeLabel = this._makeLabelSprite('管式除雾器', '#FFAA00');
                tubeLabel.position.set(labelX, 35, labelZ); // 35米高度
                labelGroup.add(tubeLabel);
            } else {
                // 一级塔：单层屋脊式除雾器
                const demLabel = this._makeLabelSprite('屋脊式除雾器', '#FFAA00');
                demLabel.position.set(labelX, labelY, labelZ);
                labelGroup.add(demLabel);
            }
        }
        
        // 为湿式电除尘器动态生成标签（仅在二级塔中）
        const wetESPObj = this.components.get('wetESP');
        if (wetESPObj && this.towerConfig.hasWetESP) {
            // 计算包围盒
            const bbox = new THREE.Box3().setFromObject(wetESPObj);
            const size = bbox.getSize(new THREE.Vector3());
            const center = bbox.getCenter(new THREE.Vector3());
            
            // 让标签靠在左侧边界，略微外移 1m（与除雾器标签在不同侧）
            const labelX = bbox.min.x - 1;
            // 让标签垂直居中
            const labelY = center.y;
            // z 轴对齐包围盒中心
            const labelZ = center.z;
            
            const espLabel = this._makeLabelSprite('湿式电除尘器', '#FF6600');
            espLabel.position.set(labelX, 42.75, labelZ); // 调整到正确的高度位置
            
            labelGroup.add(espLabel);
            
            console.log(`[${this.towerConfig.name}] 湿式电除尘器标签创建完成 - 位置: (${labelX}, 42.75, ${labelZ})`);
        }
        
        this.components.set('componentLabels', labelGroup);
        this.interiorGroup.add(labelGroup);
    }

    /**
     * 辅助：把原来的 createTextLabel 简化一下
     */
    _makeLabelSprite(text, color) {
        const sprite = this.createTextLabel(text, color);
        // 这里可以调整大小、字体或其它样式
        return sprite;
    }
    
    /**
     * 创建文字标签 - 改善显示效果
     */
    createTextLabel(text, color = '#FFFFFF') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256; // 减小画布尺寸
        canvas.height = 64;
        
        // 设置字体和样式
        context.font = 'Bold 24px Microsoft YaHei, Arial'; // 减小字体大小
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 绘制背景 - 圆角矩形
        context.fillStyle = 'rgba(0, 0, 0, 0.7)'; // 调整透明度
        this.roundRect(context, 8, 8, canvas.width - 16, canvas.height - 16, 8);
        context.fill();
        
        // 绘制边框
        context.strokeStyle = color;
        context.lineWidth = 1.5; // 调整边框宽度
        this.roundRect(context, 8, 8, canvas.width - 16, canvas.height - 16, 8);
        context.stroke();
        
        // 绘制文字
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // 创建材质
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        
        // 创建精灵
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(4, 1, 1); // 调整标签大小
        
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
     * 导出模型数据
     */
    exportModel() {
        const modelData = {
            name: '3D脱硫塔工艺流程图',
            version: '1.0',
            created: new Date().toISOString(),
            components: {
                exterior: {
                    mainTower: { height: 30, diameter: 16 },
                    platforms: 3,
                    pipes: ['inlet', 'outlet', 'drain']
                },
                interior: {
                    sprayLayers: 3,
                    demisters: 2,
                    supports: 6
                }
            },
            materials: Object.keys(this.materials),
            animations: ['spray', 'liquidFlow', 'gasFlow']
        };
        
        const dataStr = JSON.stringify(modelData, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = '脱硫塔模型数据.json';
        link.click();
        
        URL.revokeObjectURL(url);
    }
}

/**
 * 双塔脱硫系统管理类
 * 管理一级塔和二级塔的协同工作
 */
class DualTowerDesulfurizationSystem {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.group.name = 'DualTowerSystem';
        
        this.primaryTower = null;   // 一级塔
        this.secondaryTower = null; // 二级塔
        this.connectionPipe = null; // 连接管道
        
        this.systemConfig = {
            spacing: config.spacing || 40, // 两塔之间的距离
            ...config
        };
        
        this.isInitialized = false;
        this.initializationPromise = null;
        
        console.log('=== 双塔脱硫系统初始化开始 ===');
        this.initializationPromise = this.initialize();
    }
    
    async initialize() {
        try {
            await this.createPrimaryTower();
            await this.createSecondaryTower();
            this.createConnectionPipe();
            this.setupSystemLogic();
            
            this.isInitialized = true;
            console.log('=== 双塔脱硫系统初始化完成 ===');
            console.log('- 一级塔: 标准脱硫塔（带托盘）');
            console.log('- 二级塔: 高效脱硫塔（无托盘 + 湿式电除尘）');
            console.log('- 连接方式: 一级塔出口 → 二级塔入口');
        } catch (error) {
            console.error('双塔系统初始化失败:', error);
            throw error;
        }
    }
    
    async waitForInitialization() {
        if (this.isInitialized) {
            return;
        }
        return this.initializationPromise;
    }
    
    /**
     * 创建一级塔（标准脱硫塔）
     */
    async createPrimaryTower() {
        console.log('创建一级塔...');
        
        const primaryConfig = {
            name: '一级脱硫塔',
            height: 30,
            upperRadius: 8,
            middleRadius: 8,
            lowerRadius: 12,
            position: { x: 0, y: 0, z: 0 },
            hasTrays: true,      // 有托盘
            hasWetESP: false     // 没有湿式电除尘
        };
        
        this.primaryTower = new DesulfurizationTower(primaryConfig);
        await this.primaryTower.waitForInitialization();
        
        this.group.add(this.primaryTower.group);
        
        // 添加一级塔外部标签
        this.createTowerLabel(this.primaryTower.group, '一级脱硫塔', { x: 0, y: 35, z: 0 }, '#00AAFF');
        
        console.log('✓ 一级塔创建完成');
    }
    
    /**
     * 创建二级塔（高效脱硫塔 + 湿式电除尘）
     */
    async createSecondaryTower() {
        console.log('创建二级塔...');
        
        const secondaryConfig = {
            name: '二级脱硫塔',
            height: 50,          // 进一步加高到50米
            upperRadius: 8,
            middleRadius: 8,
            lowerRadius: 12,
            position: { x: this.systemConfig.spacing, y: 0, z: 0 }, // 水平间距
            hasTrays: false,     // 没有托盘
            hasWetESP: true      // 有湿式电除尘
        };
        
        this.secondaryTower = new DesulfurizationTower(secondaryConfig);
        await this.secondaryTower.waitForInitialization();
        
        this.group.add(this.secondaryTower.group);
        
        // 添加二级塔外部标签 - 紧贴塔顶上方
        this.createTowerLabel(this.secondaryTower.group, '二级脱硫塔', { x: 0, y: 54, z: 0 }, '#FF6600');
        
        console.log('✓ 二级塔创建完成');
    }
    
    /**
     * 创建塔间连接管道 - 从一级塔顶部到二级塔底部
     */
    createConnectionPipe() {
        console.log('创建塔间连接管道（顶部到底部）...');
        
        const connectionGroup = new THREE.Group();
        connectionGroup.name = 'InterTowerConnection';
        
        // 连接管道规格
        const pipeRadius = 1.2;
        const pipeThickness = 0.12; // 管壁厚度
        
        // 工业级不锈钢管道材质 - 更真实的工业外观
        const pipeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x9CB4D2,           // 不锈钢蓝灰色
            metalness: 0.9,            // 高金属感
            roughness: 0.25,           // 抛光不锈钢表面
            clearcoat: 0.3,            // 增加保护涂层
            clearcoatRoughness: 0.1,   // 光滑涂层表面
            envMapIntensity: 1.2,      // 增强环境反射
            reflectivity: 0.8          // 高反射率
        });
        
        // 保温层材质
        const insulationMaterial = new THREE.MeshPhongMaterial({
            color: 0xE8E8E8,          // 浅灰色保温层
            shininess: 10,
            transparent: true,
            opacity: 0.9
        });
        
        // 法兰材质 - 锻钢
        const flangeMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x708090,          // 钢灰色
            metalness: 0.95,
            roughness: 0.3,
            clearcoat: 0.2
        });
        
        // 支撑材质 - 碳钢结构
        const supportMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x4A4A4A,          // 深灰色碳钢
            metalness: 0.8,
            roughness: 0.4
        });
        
        // 计算连接点位置 - 优化连接高度和位置
        const primaryTowerHeight = 30; // 一级塔总高度
        const primaryTowerTopHeight = primaryTowerHeight + 1; // 塔顶平台高度
        const primaryExitHeight = primaryTowerHeight - 3; // 下移到塔体上段，更自然的连接位置
        const secondaryInletHeight = 3; // 二级塔底部入口高度
        const horizontalOffset = 10; // 增加管道水平延伸距离，更平缓的过渡
        const primaryTowerRadius = 8; // 一级塔上段半径
        
        // === 从塔体侧壁开始的连接点 - 更自然的工业连接 ===
        const pipeStartX = primaryTowerRadius - 0.5; // 稍微内嵌到塔体，模拟法兰连接
        
        // === 第一段：一级塔顶部水平延伸段 ===
        
        // === 塔体连接法兰和过渡段 - 美化连接处 ===
        // 塔体开孔法兰 - 模拟真实的塔体开孔连接
        const towerFlangeGeometry = new THREE.CylinderGeometry(pipeRadius * 2.2, pipeRadius * 2.2, 0.4, 24);
        const towerFlangeMesh = new THREE.Mesh(towerFlangeGeometry, flangeMaterial);
        towerFlangeMesh.position.set(pipeStartX - 0.2, primaryExitHeight, 0);
        towerFlangeMesh.rotation.z = Math.PI / 2;
        towerFlangeMesh.castShadow = true;
        towerFlangeMesh.name = 'towerConnectionFlange';
        connectionGroup.add(towerFlangeMesh);
        
        // 过渡段 - 从塔体到管道的平滑过渡
        const transitionGeometry = new THREE.ConeGeometry(pipeRadius * 1.8, pipeRadius, 1.2, 16);
        const transitionMesh = new THREE.Mesh(transitionGeometry, pipeMaterial);
        transitionMesh.position.set(pipeStartX + 0.6, primaryExitHeight, 0);
        transitionMesh.rotation.z = -Math.PI / 2;
        transitionMesh.castShadow = true;
        transitionMesh.name = 'connectionTransition';
        connectionGroup.add(transitionMesh);
        
        // 加强筋 - 增强连接处的结构强度
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const ribGeometry = new THREE.BoxGeometry(0.15, 0.8, 0.1);
            const ribMesh = new THREE.Mesh(ribGeometry, supportMaterial);
            ribMesh.position.set(
                pipeStartX - 0.2 + Math.cos(angle) * pipeRadius * 1.5,
                primaryExitHeight,
                Math.sin(angle) * pipeRadius * 1.5
            );
            ribMesh.lookAt(pipeStartX - 0.2, primaryExitHeight, 0);
            ribMesh.castShadow = true;
            connectionGroup.add(ribMesh);
        }
        
        // 主管道
        const horizontalPipe1Geometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, horizontalOffset, 32);
        const horizontalPipe1Mesh = new THREE.Mesh(horizontalPipe1Geometry, pipeMaterial);
        horizontalPipe1Mesh.position.set(
            pipeStartX + horizontalOffset / 2,
            primaryExitHeight,
            0
        );
        horizontalPipe1Mesh.rotation.z = Math.PI / 2;
        horizontalPipe1Mesh.castShadow = true;
        horizontalPipe1Mesh.receiveShadow = true;
        horizontalPipe1Mesh.name = 'horizontalPipe1';
        connectionGroup.add(horizontalPipe1Mesh);
        
        // 保温层
        const insulationGeometry1 = new THREE.CylinderGeometry(pipeRadius + 0.15, pipeRadius + 0.15, horizontalOffset, 16);
        const insulationMesh1 = new THREE.Mesh(insulationGeometry1, insulationMaterial);
        insulationMesh1.position.copy(horizontalPipe1Mesh.position);
        insulationMesh1.rotation.copy(horizontalPipe1Mesh.rotation);
        connectionGroup.add(insulationMesh1);
        
        // 管道起始法兰 - 调整位置与过渡段连接
        const startFlangeGeometry = new THREE.CylinderGeometry(pipeRadius * 1.8, pipeRadius * 1.8, 0.25, 24);
        const startFlangeMesh = new THREE.Mesh(startFlangeGeometry, flangeMaterial);
        startFlangeMesh.position.set(pipeStartX + 1.2, primaryExitHeight, 0);
        startFlangeMesh.rotation.z = Math.PI / 2;
        startFlangeMesh.castShadow = true;
        connectionGroup.add(startFlangeMesh);
        
        // === 第二段：垂直下降段 ===
        const pipeEndX = pipeStartX + horizontalOffset;
        const verticalDropHeight = primaryExitHeight - secondaryInletHeight - 6;
        
        // 主管道
        const verticalPipeGeometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, verticalDropHeight, 32);
        const verticalPipeMesh = new THREE.Mesh(verticalPipeGeometry, pipeMaterial);
        verticalPipeMesh.position.set(
            pipeEndX,
            primaryExitHeight - verticalDropHeight / 2,
            0
        );
        verticalPipeMesh.castShadow = true;
        verticalPipeMesh.receiveShadow = true;
        verticalPipeMesh.name = 'verticalDropPipe';
        connectionGroup.add(verticalPipeMesh);
        
        // 保温层
        const insulationGeometry2 = new THREE.CylinderGeometry(pipeRadius + 0.15, pipeRadius + 0.15, verticalDropHeight, 16);
        const insulationMesh2 = new THREE.Mesh(insulationGeometry2, insulationMaterial);
        insulationMesh2.position.copy(verticalPipeMesh.position);
        connectionGroup.add(insulationMesh2);
        
        // 中间检修法兰
        const midFlangeGeometry = new THREE.CylinderGeometry(pipeRadius * 1.6, pipeRadius * 1.6, 0.2, 24);
        const midFlangeMesh = new THREE.Mesh(midFlangeGeometry, flangeMaterial);
        midFlangeMesh.position.set(pipeEndX, primaryExitHeight - verticalDropHeight * 0.6, 0);
        midFlangeMesh.castShadow = true;
        connectionGroup.add(midFlangeMesh);
        
        // === 第三段：中间水平过渡段 ===
        const middleHorizontalLength = this.systemConfig.spacing - pipeEndX - 8;
        
        // 主管道
        const middleHorizontalGeometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, middleHorizontalLength, 32);
        const middleHorizontalMesh = new THREE.Mesh(middleHorizontalGeometry, pipeMaterial);
        middleHorizontalMesh.position.set(
            pipeEndX + middleHorizontalLength / 2,
            secondaryInletHeight + 6,
            0
        );
        middleHorizontalMesh.rotation.z = Math.PI / 2;
        middleHorizontalMesh.castShadow = true;
        middleHorizontalMesh.receiveShadow = true;
        middleHorizontalMesh.name = 'middleHorizontalPipe';
        connectionGroup.add(middleHorizontalMesh);
        
        // 保温层
        const insulationGeometry3 = new THREE.CylinderGeometry(pipeRadius + 0.15, pipeRadius + 0.15, middleHorizontalLength, 16);
        const insulationMesh3 = new THREE.Mesh(insulationGeometry3, insulationMaterial);
        insulationMesh3.position.copy(middleHorizontalMesh.position);
        insulationMesh3.rotation.copy(middleHorizontalMesh.rotation);
        connectionGroup.add(insulationMesh3);
        
        // === 第四段：二级塔入口垂直段 ===
        const finalVerticalHeight = 6;
        
        // 主管道
        const finalVerticalGeometry = new THREE.CylinderGeometry(pipeRadius, pipeRadius, finalVerticalHeight, 32);
        const finalVerticalMesh = new THREE.Mesh(finalVerticalGeometry, pipeMaterial);
        finalVerticalMesh.position.set(
            this.systemConfig.spacing - 8,
            secondaryInletHeight + finalVerticalHeight / 2,
            0
        );
        finalVerticalMesh.castShadow = true;
        finalVerticalMesh.receiveShadow = true;
        finalVerticalMesh.name = 'finalVerticalPipe';
        connectionGroup.add(finalVerticalMesh);
        
        // 保温层
        const insulationGeometry4 = new THREE.CylinderGeometry(pipeRadius + 0.15, pipeRadius + 0.15, finalVerticalHeight, 16);
        const insulationMesh4 = new THREE.Mesh(insulationGeometry4, insulationMaterial);
        insulationMesh4.position.copy(finalVerticalMesh.position);
        connectionGroup.add(insulationMesh4);
        
        // 终端法兰
        const endFlangeGeometry = new THREE.CylinderGeometry(pipeRadius * 1.8, pipeRadius * 1.8, 0.3, 24);
        const endFlangeMesh = new THREE.Mesh(endFlangeGeometry, flangeMaterial);
        endFlangeMesh.position.set(this.systemConfig.spacing - 8, secondaryInletHeight, 0);
        endFlangeMesh.castShadow = true;
        connectionGroup.add(endFlangeMesh);
        
        // === 连接弯头 - 改进的工业弯头设计 ===
        const elbowRadius = pipeRadius * 1.8; // 更大的弯曲半径，更真实
        
        // 弯头1：一级塔水平段到垂直段的转换
        const elbow1Geometry = new THREE.TorusGeometry(elbowRadius, pipeRadius, 16, 32, Math.PI / 2);
        const elbow1Mesh = new THREE.Mesh(elbow1Geometry, pipeMaterial);
        elbow1Mesh.position.set(
            pipeEndX,
            primaryExitHeight - elbowRadius,
            0
        );
        elbow1Mesh.rotation.z = Math.PI / 2;
        elbow1Mesh.castShadow = true;
        elbow1Mesh.receiveShadow = true;
        elbow1Mesh.name = 'connectionElbow1';
        connectionGroup.add(elbow1Mesh);
        
        // 弯头1保温层
        const elbowInsulation1 = new THREE.TorusGeometry(elbowRadius, pipeRadius + 0.15, 12, 24, Math.PI / 2);
        const elbowInsulationMesh1 = new THREE.Mesh(elbowInsulation1, insulationMaterial);
        elbowInsulationMesh1.position.copy(elbow1Mesh.position);
        elbowInsulationMesh1.rotation.copy(elbow1Mesh.rotation);
        connectionGroup.add(elbowInsulationMesh1);
        
        // 弯头2：垂直段到中间水平段的转换
        const elbow2Geometry = new THREE.TorusGeometry(elbowRadius, pipeRadius, 16, 32, Math.PI / 2);
        const elbow2Mesh = new THREE.Mesh(elbow2Geometry, pipeMaterial);
        elbow2Mesh.position.set(
            pipeEndX + elbowRadius,
            secondaryInletHeight + 6 - elbowRadius,
            0
        );
        elbow2Mesh.rotation.z = 0;
        elbow2Mesh.castShadow = true;
        elbow2Mesh.receiveShadow = true;
        elbow2Mesh.name = 'connectionElbow2';
        connectionGroup.add(elbow2Mesh);
        
        // 弯头2保温层
        const elbowInsulation2 = new THREE.TorusGeometry(elbowRadius, pipeRadius + 0.15, 12, 24, Math.PI / 2);
        const elbowInsulationMesh2 = new THREE.Mesh(elbowInsulation2, insulationMaterial);
        elbowInsulationMesh2.position.copy(elbow2Mesh.position);
        elbowInsulationMesh2.rotation.copy(elbow2Mesh.rotation);
        connectionGroup.add(elbowInsulationMesh2);
        
        // 弯头3：中间水平段到最终垂直段的转换
        const elbow3Geometry = new THREE.TorusGeometry(elbowRadius, pipeRadius, 16, 32, Math.PI / 2);
        const elbow3Mesh = new THREE.Mesh(elbow3Geometry, pipeMaterial);
        elbow3Mesh.position.set(
            this.systemConfig.spacing - 8 - elbowRadius,
            secondaryInletHeight + 6 - elbowRadius,
            0
        );
        elbow3Mesh.rotation.z = -Math.PI / 2;
        elbow3Mesh.castShadow = true;
        elbow3Mesh.receiveShadow = true;
        elbow3Mesh.name = 'connectionElbow3';
        connectionGroup.add(elbow3Mesh);
        
        // 弯头3保温层
        const elbowInsulation3 = new THREE.TorusGeometry(elbowRadius, pipeRadius + 0.15, 12, 24, Math.PI / 2);
        const elbowInsulationMesh3 = new THREE.Mesh(elbowInsulation3, insulationMaterial);
        elbowInsulationMesh3.position.copy(elbow3Mesh.position);
        elbowInsulationMesh3.rotation.copy(elbow3Mesh.rotation);
        connectionGroup.add(elbowInsulationMesh3);
        
        // === 改进的工业支撑系统 ===
        
        // 垂直段钢结构支撑框架
        const verticalSupportCount = Math.floor(verticalDropHeight / 10); // 每10米一个主支撑
        for (let i = 0; i < verticalSupportCount; i++) {
            const supportGroup = new THREE.Group();
            const supportHeight = primaryExitHeight - (i + 1) * (verticalDropHeight / (verticalSupportCount + 1));
            
            // 主支撑柱（更粗壮的结构）
            const mainSupportGeometry = new THREE.CylinderGeometry(0.25, 0.3, 8, 12);
            const mainSupportMesh = new THREE.Mesh(mainSupportGeometry, supportMaterial);
            mainSupportMesh.position.set(pipeEndX - 4, supportHeight - 4, 0);
            mainSupportMesh.castShadow = true;
            supportGroup.add(mainSupportMesh);
            
            // 支撑臂 - 双臂设计
            const armGeometry = new THREE.CylinderGeometry(0.12, 0.12, 4, 12);
            const arm1 = new THREE.Mesh(armGeometry, supportMaterial);
            arm1.position.set(pipeEndX - 2, supportHeight, 0);
            arm1.rotation.z = Math.PI / 2;
            arm1.castShadow = true;
            supportGroup.add(arm1);
            
            // 斜撑
            const braceGeometry = new THREE.CylinderGeometry(0.08, 0.08, 5, 12);
            const brace1 = new THREE.Mesh(braceGeometry, supportMaterial);
            brace1.position.set(pipeEndX - 2.8, supportHeight - 2, 0);
            brace1.rotation.z = Math.PI / 4;
            brace1.castShadow = true;
            supportGroup.add(brace1);
            
            // 管道抱箍
            const clampGeometry = new THREE.TorusGeometry(pipeRadius + 0.05, 0.08, 8, 16);
            const clampMesh = new THREE.Mesh(clampGeometry, supportMaterial);
            clampMesh.position.set(pipeEndX, supportHeight, 0);
            clampMesh.rotation.x = Math.PI / 2;
            clampMesh.castShadow = true;
            supportGroup.add(clampMesh);
            
            connectionGroup.add(supportGroup);
        }
        
        // 水平段桁架支撑系统
        const horizontalSupportCount = Math.floor(middleHorizontalLength / 8); // 每8米一个支撑
        for (let i = 0; i < horizontalSupportCount; i++) {
            const supportGroup = new THREE.Group();
            const xPos = pipeEndX + (i + 1) * (middleHorizontalLength / (horizontalSupportCount + 1));
            const supportHeight = secondaryInletHeight + 6;
            
            // H型钢支撑柱
            const columnGeometry = new THREE.BoxGeometry(0.4, supportHeight, 0.3);
            const columnMesh = new THREE.Mesh(columnGeometry, supportMaterial);
            columnMesh.position.set(xPos, supportHeight / 2, 0);
            columnMesh.castShadow = true;
            supportGroup.add(columnMesh);
            
            // 工字钢横梁
            const beamGeometry = new THREE.BoxGeometry(0.3, 0.25, 2);
            const beamMesh = new THREE.Mesh(beamGeometry, supportMaterial);
            beamMesh.position.set(xPos, supportHeight, 0);
            beamMesh.castShadow = true;
            supportGroup.add(beamMesh);
            
            // 钢筋混凝土底座
            const foundationGeometry = new THREE.CylinderGeometry(0.8, 1.0, 0.5, 12);
            const foundationMaterial = new THREE.MeshPhongMaterial({ color: 0x8B8B83 }); // 混凝土色
            const foundationMesh = new THREE.Mesh(foundationGeometry, foundationMaterial);
            foundationMesh.position.set(xPos, 0.25, 0);
            foundationMesh.receiveShadow = true;
            supportGroup.add(foundationMesh);
            
            // 管道支撑鞍座
            const saddleGeometry = new THREE.CylinderGeometry(pipeRadius + 0.2, pipeRadius + 0.2, 0.8, 16, 1, false, 0, Math.PI);
            const saddleMesh = new THREE.Mesh(saddleGeometry, supportMaterial);
            saddleMesh.position.set(xPos, supportHeight, 0);
            saddleMesh.rotation.z = Math.PI / 2;
            saddleMesh.castShadow = true;
            supportGroup.add(saddleMesh);
            
            connectionGroup.add(supportGroup);
        }
        
        // === 工业仪表和阀门系统 ===
        
        // 主控制阀门 - 球阀设计
        const valveBodyGeometry = new THREE.SphereGeometry(pipeRadius * 1.2, 16, 16);
        const valveMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0xB22222,          // 阀门红色
            metalness: 0.9,
            roughness: 0.2,
            clearcoat: 0.5
        });
        const valveBodyMesh = new THREE.Mesh(valveBodyGeometry, valveMaterial);
        valveBodyMesh.position.set(
            pipeEndX + middleHorizontalLength / 2,
            secondaryInletHeight + 6,
            0
        );
        valveBodyMesh.castShadow = true;
        valveBodyMesh.name = 'mainControlValve';
        connectionGroup.add(valveBodyMesh);
        
        // 阀门手轮
        const handwheelGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.15, 20);
        const handwheelMesh = new THREE.Mesh(handwheelGeometry, supportMaterial);
        handwheelMesh.position.set(
            pipeEndX + middleHorizontalLength / 2,
            secondaryInletHeight + 6 + pipeRadius * 1.5,
            0
        );
        handwheelMesh.castShadow = true;
        connectionGroup.add(handwheelMesh);
        
        // 电磁流量计（更精密的设计）
        const flowMeterBodyGeometry = new THREE.CylinderGeometry(pipeRadius * 1.3, pipeRadius * 1.3, 1.8, 16);
        const flowMeterMaterial = new THREE.MeshPhysicalMaterial({ 
            color: 0x2F4F4F,
            metalness: 0.7,
            roughness: 0.3
        });
        const flowMeterMesh = new THREE.Mesh(flowMeterBodyGeometry, flowMeterMaterial);
        flowMeterMesh.position.set(
            pipeStartX + horizontalOffset / 2,
            primaryExitHeight,
            0
        );
        flowMeterMesh.rotation.z = Math.PI / 2;
        flowMeterMesh.castShadow = true;
        flowMeterMesh.name = 'electromagneticFlowMeter';
        connectionGroup.add(flowMeterMesh);
        
        // 流量计显示屏
        const displayGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.2);
        const displayMaterial = new THREE.MeshPhongMaterial({ color: 0x000000 });
        const displayMesh = new THREE.Mesh(displayGeometry, displayMaterial);
        displayMesh.position.set(
            pipeStartX + horizontalOffset / 2,
            primaryExitHeight + 1.2,
            0
        );
        displayMesh.castShadow = true;
        connectionGroup.add(displayMesh);
        
        // 多点压力表系统
        const pressurePoints = [
            { x: pipeEndX, y: primaryExitHeight - verticalDropHeight * 0.3, name: 'pressure1' },
            { x: pipeEndX, y: primaryExitHeight - verticalDropHeight * 0.7, name: 'pressure2' },
            { x: pipeEndX + middleHorizontalLength * 0.8, y: secondaryInletHeight + 6, name: 'pressure3' }
        ];
        
        pressurePoints.forEach((point, index) => {
            // 压力表本体
            const gaugeGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.15, 16);
            const gaugeMaterial = new THREE.MeshPhysicalMaterial({ 
                color: 0x1E90FF,
                metalness: 0.8,
                roughness: 0.2
            });
            const gaugeMesh = new THREE.Mesh(gaugeGeometry, gaugeMaterial);
            gaugeMesh.position.set(point.x + 0.8, point.y, 0);
            gaugeMesh.rotation.z = Math.PI / 2;
            gaugeMesh.castShadow = true;
            gaugeMesh.name = point.name;
            connectionGroup.add(gaugeMesh);
            
            // 连接管
            const connectionPipeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.8, 8);
            const connectionPipeMesh = new THREE.Mesh(connectionPipeGeometry, supportMaterial);
            connectionPipeMesh.position.set(point.x + 0.4, point.y, 0);
            connectionPipeMesh.rotation.z = Math.PI / 2;
            connectionGroup.add(connectionPipeMesh);
        });
        
        // 补偿器（膨胀节）
        const expansionJointGeometry = new THREE.TorusGeometry(pipeRadius, 0.3, 8, 16);
        const expansionJointMaterial = new THREE.MeshPhysicalMaterial({
            color: 0x708090,
            metalness: 0.6,
            roughness: 0.4
        });
        const expansionJointMesh = new THREE.Mesh(expansionJointGeometry, expansionJointMaterial);
        expansionJointMesh.position.set(
            pipeEndX + middleHorizontalLength * 0.3,
            secondaryInletHeight + 6,
            0
        );
        expansionJointMesh.rotation.z = Math.PI / 2;
        expansionJointMesh.castShadow = true;
        expansionJointMesh.name = 'expansionJoint';
        connectionGroup.add(expansionJointMesh);
        
        this.connectionPipe = connectionGroup;
        this.group.add(connectionGroup);
        
        const totalPipeLength = horizontalOffset + verticalDropHeight + middleHorizontalLength + finalVerticalHeight;
        console.log('✓ 工业级塔间连接管道系统创建完成');
        console.log(`- 管道类型: 不锈钢316L + 保温层`);
        console.log(`- 起点高度: ${primaryExitHeight.toFixed(1)}m (一级塔顶部)`);
        console.log(`- 终点高度: ${secondaryInletHeight.toFixed(1)}m (二级塔底部)`);
        console.log(`- 总管道长度: ${totalPipeLength.toFixed(1)}m`);
        console.log(`- 高度差: ${(primaryExitHeight - secondaryInletHeight).toFixed(1)}m`);
        console.log(`- 支撑结构: 钢结构框架 + 混凝土基础`);
        console.log(`- 控制系统: 球阀 + 电磁流量计 + 多点压力监测`);
        console.log(`- 安全配置: 补偿器 + 法兰连接 + 保温隔热`);
    }
    
    /**
     * 设置系统逻辑
     */
    setupSystemLogic() {
        console.log('设置双塔系统逻辑...');
        
        // 设置塔的标识
        if (this.primaryTower && this.primaryTower.group) {
            this.primaryTower.group.userData.systemRole = 'primary';
            this.primaryTower.group.userData.systemStage = '一级处理';
        }
        
        if (this.secondaryTower && this.secondaryTower.group) {
            this.secondaryTower.group.userData.systemRole = 'secondary';
            this.secondaryTower.group.userData.systemStage = '二级处理+电除尘';
        }
        
        console.log('✓ 系统逻辑设置完成');
    }
    
    /**
     * 切换内部视图
     */
    toggleInteriorView(showInterior = null) {
        if (this.primaryTower) {
            this.primaryTower.toggleInteriorView(showInterior);
        }
        if (this.secondaryTower) {
            this.secondaryTower.toggleInteriorView(showInterior);
        }
    }
    
    /**
     * 获取系统信息
     */
    getSystemInfo() {
        return {
            primaryTower: this.primaryTower?.towerConfig,
            secondaryTower: this.secondaryTower?.towerConfig,
            connection: {
                spacing: this.systemConfig.spacing,
                isConnected: !!this.connectionPipe
            },
            isInitialized: this.isInitialized
        };
    }
    
    /**
     * 创建塔标签
     * @param {THREE.Group} towerGroup - 塔的组对象
     * @param {string} labelText - 标签文本
     * @param {Object} position - 标签位置 {x, y, z}
     * @param {string} color - 标签颜色
     */
    createTowerLabel(towerGroup, labelText, position, color = '#FFFFFF') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 320; // 增大画布宽度以适应更大字体
        canvas.height = 100; // 增大高度以适应40px字体
        
        // 设置字体和样式
        context.font = 'Bold 40px Microsoft YaHei, Arial'; // 大幅增大字体以便远距离清晰显示
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 绘制背景 - 圆角矩形
        context.fillStyle = 'rgba(0, 0, 0, 0.8)'; // 更明显的背景
        this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.fill();
        
        // 绘制边框
        context.strokeStyle = color;
        context.lineWidth = 3; // 增大边框宽度匹配更大的标签
        this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.stroke();
        
        // 绘制文字
        context.fillStyle = color;
        context.fillText(labelText, canvas.width / 2, canvas.height / 2);
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // 创建材质
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95,
            alphaTest: 0.01 // 避免透明度问题
        });
        
        // 创建精灵
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(15, 4, 1); // 进一步增大标签尺寸
        sprite.position.set(position.x, position.y, position.z);
        sprite.name = `towerLabel_${labelText}`;
        
        // 启用大小衰减，让标签随距离自然缩放
        sprite.material.sizeAttenuation = true;
        
        // 添加到塔组而不是场景，这样标签会跟随塔移动
        towerGroup.add(sprite);
        
        console.log(`✓ 塔标签创建完成: ${labelText} - 位置: (${position.x}, ${position.y}, ${position.z})`);
        
        return sprite;
    }
    
    /**
     * 绘制圆角矩形 - 复用DesulfurizationTower类的方法
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
     * 销毁系统
     */
    dispose() {
        if (this.primaryTower) {
            // 如果有dispose方法就调用
            if (typeof this.primaryTower.dispose === 'function') {
                this.primaryTower.dispose();
            }
        }
        
        if (this.secondaryTower) {
            if (typeof this.secondaryTower.dispose === 'function') {
                this.secondaryTower.dispose();
            }
        }
        
        // 清理组
        this.group.clear();
        
        console.log('双塔系统已销毁');
    }
}