/**
 * 制浆箱系统 - 重新设计版本
 * 第一部分：高锥形结构，底部为两个倒置小圆锥，配套平台和围栏
 * 第二部分：两个大圆柱制浆箱连接在小圆锥下方
 * 外部支撑：参照真实工业水泥支撑结构
 */
class SlurryTank {
    constructor(position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 }) {
        this.position = position;
        this.rotation = rotation;
        this.group = new THREE.Group();
        this.components = {};
        
        // 重新设计的制浆箱系统参数
        this.config = {
            // 第一部分：主截锥结构（倒截锥体，缩小尺寸，Z轴偏移）
            mainCone: {
                topDiameter: 18.0,     // 顶部直径 12.0m (大端在上，缩小)
                bottomDiameter: 6.0,   // 底部直径 5.0m (小端在下，比平台稍大)
                height: 14.0,          // 主锥高度 18.0m
                wallThickness: 0.03,   // 壁厚 3cm
            },
            
            // 底部倒置小圆锥（两个）
            bottomCones: {
                topDiameter: 5.0,      // 小锥顶部直径 3.0m (与主锥连接)
                bottomDiameter: 2,   // 小锥底部直径 1.2m (出料口)
                height: 7,           // 小锥高度 2.5m
                spacing: 4.0,          // 两个锥的中心距离 4.0m
                flangeThickness: 0.08  // 法兰厚度 8cm
            },
            
            // 第二部分：圆柱形制浆箱（两个大圆柱）
            cylinderTanks: {
                diameter: 4.5,         // 直径 4.5m (更大)
                height: 8.0,           // 高度 8.0m (更高)
                wallThickness: 0.03,   // 壁厚 3cm
                bottomThickness: 0.05, // 底板厚度 5cm
                spacing: 6.0           // 两个圆柱的中心距离 6.0m
            },
            
            // 平台系统（第一部分下方，适配倒截锥小端）
            platform: {
                diameter: 16.0,         // 平台直径 8.0m (适配6m底径截锥，稍大一些)
                height: 0.2,           // 平台厚度 20cm
                railingHeight: 1.2,    // 围栏高度 1.2m
                walkwayWidth: 1.5,     // 走道宽度 1.5m
                supportHeight: 15.0    // 平台支撑高度 15.0m
            },
            
            // 水泥支撑结构（参照图片）
            support: {
                columnCount: 6,        // 主支柱数量
                columnDiameter: 1.2,   // 支柱直径 1.2m
                columnHeight: 25.0,    // 支柱高度 20.0m
                concreteBase: 2.0,     // 混凝土基础尺寸 2.0m
                reinforcement: {
                    ringCount: 6,      // 环形加强圈数量
                    beamCount: 8       // 连接梁数量
                }
            }
        };
        
        this.initialize();
    }
    
    /**
     * 初始化制浆箱系统
     */
    initialize() {
        // 创建材质
        this.createMaterials();
        
        // 创建各个组件（按从下到上的顺序）
        this.createConcreteSupports();         // 水泥支撑结构
        this.createCylinderTanks();           // 第二部分：圆柱形制浆箱
        this.createMainConeStructure();       // 第一部分：主锥形结构
        this.createBottomCones();             // 倒置小圆锥
        this.createPlatformSystem();          // 平台和围栏系统
        this.createSpiralStaircase();         // 外部旋转楼梯系统
        this.createSafetyFeatures();          // 安全设施
        this.createLabelsAndSigns();          // 标识标签
        
        // 设置位置和旋转
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.group.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        
        console.log('重新设计的制浆箱系统创建完成');
    }
    
    /**
     * 创建材质系统
     */
    createMaterials() {
        this.materials = {
            // 不锈钢仓体
            stainlessSteel: new THREE.MeshStandardMaterial({
                color: 0xe8e8e8,
                metalness: 0.8,
                roughness: 0.2,
                envMapIntensity: 1.0
            }),
            
            // 水泥混凝土
            concrete: new THREE.MeshStandardMaterial({
                color: 0xa0a0a0,
                metalness: 0.0,
                roughness: 0.9,
                envMapIntensity: 0.2
            }),
            
            // 钢筋混凝土
            reinforcedConcrete: new THREE.MeshStandardMaterial({
                color: 0x808080,
                metalness: 0.1,
                roughness: 0.8,
                envMapIntensity: 0.3
            }),
            
            // 金属栏杆
            railingSteel: new THREE.MeshStandardMaterial({
                color: 0x4a90e2,
                metalness: 0.7,
                roughness: 0.3,
                envMapIntensity: 0.8
            }),
            
            // 花纹钢板
            patternPlate: new THREE.MeshStandardMaterial({
                color: 0x666666,
                metalness: 0.6,
                roughness: 0.4,
                envMapIntensity: 0.6
            }),
            
            // 黄色安全标识
            safetyYellow: new THREE.MeshStandardMaterial({
                color: 0xffcc00,
                metalness: 0.2,
                roughness: 0.7
            })
        };
    }
    
    /**
     * 创建水泥支撑结构（参照真实工业照片）
     */
    createConcreteSupports() {
        const supportGroup = new THREE.Group();
        supportGroup.name = 'concreteSupports';
        
        const config = this.config.support;
        
        // 1. 创建6根主要水泥支撑柱
        for (let i = 0; i < config.columnCount; i++) {
            const angle = (Math.PI * 2 * i) / config.columnCount;
            const radius = 8.0; // 支撑柱分布半径
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // 混凝土支撑柱主体
            const columnGeometry = new THREE.CylinderGeometry(
                config.columnDiameter / 2,
                config.columnDiameter / 2 + 0.2, // 底部稍粗
                config.columnHeight,
                12
            );
            const column = new THREE.Mesh(columnGeometry, this.materials.reinforcedConcrete);
            column.position.set(x, config.columnHeight / 2, z);
            column.castShadow = true;
            column.receiveShadow = true;
            supportGroup.add(column);
            
            // 混凝土基础
            const baseGeometry = new THREE.CylinderGeometry(
                config.concreteBase,
                config.concreteBase + 0.3,
                0.8,
                12
            );
            const base = new THREE.Mesh(baseGeometry, this.materials.concrete);
            base.position.set(x, 0.4, z);
            base.receiveShadow = true;
            supportGroup.add(base);
            
            // 支撑柱顶部扩展平台
            const capGeometry = new THREE.CylinderGeometry(
                config.columnDiameter / 2 + 0.3,
                config.columnDiameter / 2,
                0.5,
                12
            );
            const cap = new THREE.Mesh(capGeometry, this.materials.concrete);
            cap.position.set(x, config.columnHeight - 0.25, z);
            cap.castShadow = true;
            supportGroup.add(cap);
        }
        
        // 2. 环形加强圈（4层）
        for (let ring = 0; ring < config.reinforcement.ringCount; ring++) {
            const ringHeight = 5.0 + ring * 4.0;
            const ringRadius = 8.2;
            
            // 创建环形梁
            const ringGeometry = new THREE.TorusGeometry(ringRadius, 0.3, 8, 32);
            const ringBeam = new THREE.Mesh(ringGeometry, this.materials.reinforcedConcrete);
            ringBeam.position.y = ringHeight;
            ringBeam.rotation.x = Math.PI / 2;
        supportGroup.add(ringBeam);
        }
        
        // 3. 径向连接梁
        for (let beam = 0; beam < config.reinforcement.beamCount; beam++) {
            const angle = (Math.PI * 2 * beam) / config.reinforcement.beamCount;
            const beamLength = 6.0;
            
            const beamGeometry = new THREE.BoxGeometry(0.4, 0.6, beamLength);
            const connectBeam = new THREE.Mesh(beamGeometry, this.materials.reinforcedConcrete);
            connectBeam.position.set(
                Math.cos(angle) * beamLength / 2,
                15.0,
                Math.sin(angle) * beamLength / 2
            );
            connectBeam.rotation.y = angle;
            connectBeam.castShadow = true;
            supportGroup.add(connectBeam);
        }
        
        this.components.supports = supportGroup;
        this.group.add(supportGroup);
    }
    
    /**
     * 创建第一部分：主锥形结构
     */
    createMainConeStructure() {
        const coneGroup = new THREE.Group();
        coneGroup.name = 'mainConeStructure';
        
        const config = this.config.mainCone;
        const baseHeight = this.config.platform.supportHeight;
        
        // 主截锥体（倒截锥体 - 小端在下与平台接触，大端在上）
        const truncatedConeGeometry = new THREE.CylinderGeometry(
            config.topDiameter / 2,      // 顶部半径（大端在上）
            config.bottomDiameter / 2,   // 底部半径（小端在下，与平台接触）
            config.height,               // 高度
            32,                          // 径向分段
            1,                           // 高度分段
            false                        // 不封闭
        );
        
        const yOffset = 1; // 向上偏移10个单位
        
        const mainCone = new THREE.Mesh(truncatedConeGeometry, this.materials.stainlessSteel);
        mainCone.position.set(0, baseHeight + config.height / 2 + yOffset, 0); // Y轴向上偏移，取消Z轴偏移
        mainCone.castShadow = true;
        coneGroup.add(mainCone);
        
        // 锥体内壁（显示厚度）
        const innerTruncatedConeGeometry = new THREE.CylinderGeometry(
            config.topDiameter / 2 - config.wallThickness,
            config.bottomDiameter / 2 - config.wallThickness,
            config.height - config.wallThickness,
            32,
            1,
            false
        );
        const innerCone = new THREE.Mesh(innerTruncatedConeGeometry, this.materials.stainlessSteel);
        innerCone.position.set(0, baseHeight + config.height / 2 + yOffset, 0); // Y轴向上偏移
        coneGroup.add(innerCone);
        
        // 顶部封盖（大端封盖，有大开口）
        const topCapGeometry = new THREE.RingGeometry(
            1.5, // 内半径（中心大开口，缩小）
            config.topDiameter / 2,
            32
        );
        const topCap = new THREE.Mesh(topCapGeometry, this.materials.stainlessSteel);
        topCap.rotation.x = -Math.PI / 2;
        topCap.position.set(0, baseHeight + config.height + yOffset, 0); // Y轴向上偏移
        coneGroup.add(topCap);
        
        // 底部小端封盖（小开口底部）
        const bottomCapGeometry = new THREE.RingGeometry(
            0.3, // 内半径（中心小开口）
            config.bottomDiameter / 2,
            32
        );
        const bottomCap = new THREE.Mesh(bottomCapGeometry, this.materials.stainlessSteel);
        bottomCap.rotation.x = -Math.PI / 2;
        bottomCap.position.set(0, baseHeight + yOffset, 0); // Y轴向上偏移
        coneGroup.add(bottomCap);
        
        // 添加工业装饰和细节
        this.addConeDecorations(coneGroup, config, baseHeight, yOffset);
        
        this.components.mainCone = coneGroup;
        this.group.add(coneGroup);
    }
    
    /**
     * 创建底部倒置小圆锥（两个）
     */
    createBottomCones() {
        const conesGroup = new THREE.Group();
        conesGroup.name = 'bottomCones';
        
        const config = this.config.bottomCones;
        const baseHeight = this.config.platform.supportHeight;
        
        // 创建两个倒置小圆锥
        for (let i = 0; i < 2; i++) {
            const coneSubGroup = new THREE.Group();
            
            // 计算位置（左右分布）
            const xOffset = (i === 0) ? -config.spacing / 2 : config.spacing / 2;
            
            // 倒置锥体（顶部大，底部小）- 嵌入截锥底部
            const smallConeGeometry = new THREE.ConeGeometry(
                config.bottomDiameter / 2,  // 底部半径（小）
                config.height,              // 高度
                16,                         // 径向分段
                1,                          // 高度分段
                false                       // 不封闭
            );
            
            const smallCone = new THREE.Mesh(smallConeGeometry, this.materials.stainlessSteel);
            // 将小锥向上移动，使其顶部与截锥底部内部相连
            smallCone.position.set(xOffset, baseHeight - config.height / 2 + 1.0, 0);
            smallCone.rotation.x = Math.PI; // 倒置
            smallCone.castShadow = true;
            coneSubGroup.add(smallCone);
            
            // 顶部连接法兰（与截锥底部连接）
            const flangeGeometry = new THREE.CylinderGeometry(
                config.topDiameter / 2 + 0.1,
                config.topDiameter / 2 + 0.1,
                config.flangeThickness,
                24
            );
            const flange = new THREE.Mesh(flangeGeometry, this.materials.stainlessSteel);
            flange.position.set(xOffset, baseHeight + config.flangeThickness / 2, 0);
            coneSubGroup.add(flange);
            
            // 底部出料口法兰（调整位置）
            const outletFlangeGeometry = new THREE.CylinderGeometry(
                config.bottomDiameter / 2 + 0.05,
                config.bottomDiameter / 2 + 0.05,
                0.1,
                16
            );
            const outletFlange = new THREE.Mesh(outletFlangeGeometry, this.materials.stainlessSteel);
            outletFlange.position.set(xOffset, baseHeight - config.height + 1.0 - 0.05, 0);
            coneSubGroup.add(outletFlange);
            
            // 直接连接法兰（与圆柱箱顶部直接对接）
            const directConnectionGeometry = new THREE.CylinderGeometry(
                config.bottomDiameter / 2 + 0.05,
                config.bottomDiameter / 2 + 0.05,
                0.15,
                16
            );
            const directConnection = new THREE.Mesh(directConnectionGeometry, this.materials.stainlessSteel);
            directConnection.position.set(xOffset, baseHeight - config.height + 1.0 - 0.075, 0);
            coneSubGroup.add(directConnection);
            
            // 添加小圆锥装饰
            this.addSmallConeDecorations(coneSubGroup, config, xOffset, baseHeight);
            
            conesGroup.add(coneSubGroup);
        }
        
        this.components.bottomCones = conesGroup;
        this.group.add(conesGroup);
    }
    
    /**
     * 创建第二部分：圆柱形制浆箱（两个大圆柱）
     */
    createCylinderTanks() {
        const tanksGroup = new THREE.Group();
        tanksGroup.name = 'cylinderTanks';
        
        const config = this.config.cylinderTanks;
        const baseHeight = this.config.platform.supportHeight;
        
        // 创建两个大圆柱制浆箱
        for (let i = 0; i < 2; i++) {
            const tankSubGroup = new THREE.Group();
            
            // 计算位置（与小锥对应）
            const xOffset = (i === 0) ? -config.spacing / 2 : config.spacing / 2;
            
            // 圆柱罐体（直接连接到小圆锥下方，调整位置）
            const tankGeometry = new THREE.CylinderGeometry(
                config.diameter / 2,
                config.diameter / 2,
                config.height,
                32
            );
            const tank = new THREE.Mesh(tankGeometry, this.materials.stainlessSteel);
            tank.position.set(xOffset, baseHeight - this.config.bottomCones.height + 1.0 - config.height / 2, 0);
            tank.castShadow = true;
            tank.receiveShadow = true;
            tankSubGroup.add(tank);
            
            // 罐体底部（调整位置）
            const bottomGeometry = new THREE.CylinderGeometry(
                config.diameter / 2,
                config.diameter / 2,
                config.bottomThickness,
                32
            );
            const bottom = new THREE.Mesh(bottomGeometry, this.materials.stainlessSteel);
            bottom.position.set(
                xOffset, 
                baseHeight - this.config.bottomCones.height + 1.0 - config.height + config.bottomThickness / 2, 
                0
            );
            tankSubGroup.add(bottom);
            
            // 顶部开口法兰（与小锥直接连接，调整位置）
            const topFlangeGeometry = new THREE.CylinderGeometry(
                config.diameter / 2 + 0.1,
                config.diameter / 2 + 0.1,
                0.1,
                32
            );
            const topFlange = new THREE.Mesh(topFlangeGeometry, this.materials.stainlessSteel);
            topFlange.position.set(
                xOffset, 
                baseHeight - this.config.bottomCones.height + 1.0 + 0.05, 
                0
            );
            tankSubGroup.add(topFlange);
            
            // 侧面检修人孔（调整位置）
            const manholeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.1, 16);
            const manhole = new THREE.Mesh(manholeGeometry, this.materials.stainlessSteel);
            manhole.position.set(
                xOffset + config.diameter / 2 + 0.05, 
                baseHeight - this.config.bottomCones.height + 1.0 - config.height / 2, 
                0
            );
            manhole.rotation.z = Math.PI / 2;
            tankSubGroup.add(manhole);
            
            // 底部排料阀（调整位置）
            const valveGeometry = new THREE.BoxGeometry(0.4, 0.4, 0.6);
            const valve = new THREE.Mesh(valveGeometry, this.materials.railingSteel);
            valve.position.set(
                xOffset, 
                baseHeight - this.config.bottomCones.height + 1.0 - config.height - 0.2, 
                config.diameter / 2 + 0.3
            );
            tankSubGroup.add(valve);
            
            // 添加圆柱罐装饰
            this.addCylinderTankDecorations(tankSubGroup, config, xOffset, baseHeight);
            
            tanksGroup.add(tankSubGroup);
        }
        
        this.components.cylinderTanks = tanksGroup;
        this.group.add(tanksGroup);
    }
    
    /**
     * 创建平台系统
     */
    createPlatformSystem() {
        const platformGroup = new THREE.Group();
        platformGroup.name = 'platformSystem';
        
        const config = this.config.platform;
        
        // 主要圆形平台（适配倒截锥小端）
        const platformGeometry = new THREE.CylinderGeometry(
                config.diameter / 2,
                config.diameter / 2,
                config.height,
            48
        );
        const platform = new THREE.Mesh(platformGeometry, this.materials.patternPlate);
        platform.position.y = config.supportHeight;
        platform.castShadow = true;
        platform.receiveShadow = true;
        platformGroup.add(platform);
        
        // 平台围栏（圆形，适配新尺寸）
        const railingCount = 48; // 减少栏杆数量以适配较小平台
        for (let i = 0; i < railingCount; i++) {
            const angle = (Math.PI * 2 * i) / railingCount;
            const x = Math.cos(angle) * (config.diameter / 2 - 0.1);
            const z = Math.sin(angle) * (config.diameter / 2 - 0.1);
            
            // 垂直栏杆柱
            const postGeometry = new THREE.CylinderGeometry(0.03, 0.03, config.railingHeight, 8);
            const post = new THREE.Mesh(postGeometry, this.materials.railingSteel);
            post.position.set(x, config.supportHeight + config.railingHeight / 2, z);
            platformGroup.add(post);
            
            // 每隔4根柱子添加横向扶手（适配新的栏杆数量）
            if (i % 4 === 0) {
                const nextAngle = (Math.PI * 2 * (i + 4)) / railingCount;
                const nextX = Math.cos(nextAngle) * (config.diameter / 2 - 0.1);
                const nextZ = Math.sin(nextAngle) * (config.diameter / 2 - 0.1);
                
                const handrailLength = Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextZ - z, 2));
                const handrailGeometry = new THREE.CylinderGeometry(0.02, 0.02, handrailLength, 8);
                const handrail = new THREE.Mesh(handrailGeometry, this.materials.railingSteel);
                handrail.position.set((x + nextX) / 2, config.supportHeight + config.railingHeight * 0.8, (z + nextZ) / 2);
                handrail.rotation.y = Math.atan2(nextZ - z, nextX - x);
                handrail.rotation.z = Math.PI / 2;
                platformGroup.add(handrail);
            }
        }
        
        // 旋转楼梯已移除
        
        this.components.platform = platformGroup;
        this.group.add(platformGroup);
    }
    
    /**
     * 添加截锥的简洁工业装饰
     */
    addConeDecorations(parentGroup, coneConfig, baseHeight, yOffset) {
        const decorationGroup = new THREE.Group();
        decorationGroup.name = 'coneDecorations';
        
        const coneBottomY = baseHeight + yOffset;
        const coneTopY = baseHeight + coneConfig.height + yOffset;
        
        // 1. 简洁的检修梯（一侧）
        this.createSimpleLadder(decorationGroup, coneConfig, coneBottomY, coneTopY);
        
        // 2. 关键检修平台（仅一层）
        this.createKeyMaintenancePlatform(decorationGroup, coneConfig, coneBottomY, coneTopY);
        
        // 3. 主要管道接口
        this.createMainPipeConnections(decorationGroup, coneConfig, coneBottomY, coneTopY);
        
        // 4. 基础加强结构
        this.createBasicReinforcement(decorationGroup, coneConfig, coneBottomY, coneTopY);
        
        parentGroup.add(decorationGroup);
    }
    
    /**
     * 创建简洁梯子
     */
    createSimpleLadder(parentGroup, config, bottomY, topY) {
        const totalHeight = topY - bottomY;
        const stepCount = Math.floor(totalHeight / 0.3); // 每30cm一级台阶
        const radius = config.bottomDiameter / 2 + 0.5; // 固定半径，在底部
        
        // 梯子位置固定在一侧
        const ladderX = radius;
        const ladderZ = 0;
        
        // 主立柱（两根）
        const railGeometry = new THREE.CylinderGeometry(0.03, 0.03, totalHeight, 8);
        const leftRail = new THREE.Mesh(railGeometry, this.materials.railingSteel);
        leftRail.position.set(ladderX - 0.2, bottomY + totalHeight / 2, ladderZ);
        leftRail.castShadow = true;
        parentGroup.add(leftRail);
        
        const rightRail = new THREE.Mesh(railGeometry, this.materials.railingSteel);
        rightRail.position.set(ladderX + 0.2, bottomY + totalHeight / 2, ladderZ);
        rightRail.castShadow = true;
        parentGroup.add(rightRail);
        
        // 横向踏步
        for (let i = 0; i < stepCount; i++) {
            const y = bottomY + (i * totalHeight) / stepCount;
            const stepGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.4, 8);
            const step = new THREE.Mesh(stepGeometry, this.materials.railingSteel);
            step.position.set(ladderX, y, ladderZ);
            step.rotation.z = Math.PI / 2;
            parentGroup.add(step);
        }
    }
    
    /**
     * 创建关键检修平台（仅一层）
     */
    createKeyMaintenancePlatform(parentGroup, config, bottomY, topY) {
        const totalHeight = topY - bottomY;
        const y = bottomY + totalHeight * 0.6; // 60%高度处
        const radius = config.bottomDiameter / 2 + 
            (config.topDiameter / 2 - config.bottomDiameter / 2) * 0.6;
        
        // 半圆形平台（仅梯子一侧）
        const platformGeometry = new THREE.RingGeometry(
            radius + 0.2,
            radius + 1.0,
            16,
            1,
            0,
            Math.PI
        );
        const platform = new THREE.Mesh(platformGeometry, this.materials.patternPlate);
        platform.rotation.x = -Math.PI / 2;
        platform.position.y = y;
        platform.castShadow = true;
        parentGroup.add(platform);
        
        // 简洁栏杆（仅外侧）
        const railingCount = 8;
        for (let j = 0; j < railingCount; j++) {
            const angle = (Math.PI * j) / (railingCount - 1);
            const x = Math.cos(angle) * (radius + 0.6);
            const z = Math.sin(angle) * (radius + 0.6);
            
            const postGeometry = new THREE.CylinderGeometry(0.02, 0.02, 1.0, 8);
            const post = new THREE.Mesh(postGeometry, this.materials.railingSteel);
            post.position.set(x, y + 0.5, z);
            parentGroup.add(post);
        }
    }
    
    /**
     * 创建主要管道接口
     */
    createMainPipeConnections(parentGroup, config, bottomY, topY) {
        // 顶部进料管道（简洁版）
        const inletPipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.5, 12);
        const inletPipe = new THREE.Mesh(inletPipeGeometry, this.materials.stainlessSteel);
        inletPipe.position.set(0, topY + 0.75, config.topDiameter / 2 * 0.6);
        inletPipe.castShadow = true;
        parentGroup.add(inletPipe);
        
        // 进料法兰
        const flangeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        const flange = new THREE.Mesh(flangeGeometry, this.materials.stainlessSteel);
        flange.position.set(0, topY + 0.05, config.topDiameter / 2 * 0.6);
        parentGroup.add(flange);
        
        // 侧面人孔（仅一个）
        const manholeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.15, 12);
        const manhole = new THREE.Mesh(manholeGeometry, this.materials.stainlessSteel);
        manhole.position.set(config.bottomDiameter / 2 + 0.08, bottomY + (topY - bottomY) * 0.5, 0);
        manhole.rotation.z = Math.PI / 2;
        manhole.castShadow = true;
        parentGroup.add(manhole);
    }
    
    /**
     * 创建基础加强结构
     */
    createBasicReinforcement(parentGroup, config, bottomY, topY) {
        // 仅2道环形加强圈（减少数量）
        const ringCount = 2;
        const totalHeight = topY - bottomY;
        
        for (let i = 0; i < ringCount; i++) {
            const progress = (i + 1) / (ringCount + 1);
            const y = bottomY + totalHeight * progress;
            const radius = config.bottomDiameter / 2 + 
                (config.topDiameter / 2 - config.bottomDiameter / 2) * progress;
            
            const ringGeometry = new THREE.TorusGeometry(radius + 0.02, 0.03, 8, 24);
            const ring = new THREE.Mesh(ringGeometry, this.materials.stainlessSteel);
            ring.position.y = y;
            ring.rotation.x = Math.PI / 2;
            parentGroup.add(ring);
        }
    }
    

    
    /**
     * 添加小圆锥简洁装饰
     */
    addSmallConeDecorations(parentGroup, config, xOffset, baseHeight) {
        // 仅添加顶部维护阀门
        const smallValveGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.12, 8);
        const smallValve = new THREE.Mesh(smallValveGeometry, this.materials.safetyYellow);
        smallValve.position.set(xOffset, baseHeight + 0.15, 0);
        smallValve.castShadow = true;
        parentGroup.add(smallValve);
        
        // 简化的连接法兰
        const flangeGeometry = new THREE.CylinderGeometry(config.topDiameter / 2 + 0.1, config.topDiameter / 2 + 0.1, 0.05, 16);
        const flange = new THREE.Mesh(flangeGeometry, this.materials.stainlessSteel);
        flange.position.set(xOffset, baseHeight + config.flangeThickness / 2, 0);
        parentGroup.add(flange);
    }
    
    /**
     * 添加圆柱罐简洁装饰
     */
    addCylinderTankDecorations(parentGroup, config, xOffset, baseHeight) {
        const tankCenterY = baseHeight - this.config.bottomCones.height + 1.0 - config.height / 2;
        
        // 1. 液位指示器（简化）
        const levelIndicatorGeometry = new THREE.BoxGeometry(0.1, 2.0, 0.05);
        const levelIndicator = new THREE.Mesh(levelIndicatorGeometry, this.materials.safetyYellow);
        levelIndicator.position.set(
            xOffset + config.diameter / 2 + 0.06,
            tankCenterY,
            0
        );
        levelIndicator.castShadow = true;
        parentGroup.add(levelIndicator);
        
        // 2. 顶部搅拌器（简化）
        const motorGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 12);
        const motor = new THREE.Mesh(motorGeometry, this.materials.railingSteel);
        motor.position.set(
            xOffset,
            baseHeight - this.config.bottomCones.height + 1.0 + 0.2,
            0
        );
        motor.castShadow = true;
        parentGroup.add(motor);
        
        // 3. 仅一道加强圈
        const ringGeometry = new THREE.TorusGeometry(config.diameter / 2 + 0.02, 0.02, 8, 20);
        const ring = new THREE.Mesh(ringGeometry, this.materials.stainlessSteel);
        ring.position.set(xOffset, tankCenterY, 0);
        ring.rotation.x = Math.PI / 2;
        parentGroup.add(ring);
        
        // 4. 侧面安全阀
        const safetyValveGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8);
        const safetyValve = new THREE.Mesh(safetyValveGeometry, this.materials.safetyYellow);
        safetyValve.position.set(
            xOffset + config.diameter / 2 + 0.08,
            tankCenterY + config.height / 3,
            0
        );
        safetyValve.rotation.z = Math.PI / 2;
        safetyValve.castShadow = true;
        parentGroup.add(safetyValve);
    }
    
    /**
     * 创建水泥支撑结构托举截锥
     */
    createConcreteSupportForCone(parentGroup, coneConfig, baseHeight, yOffset = 0) {
        const supportGroup = new THREE.Group();
        supportGroup.name = 'concreteSupportsForCone';
        
        const totalHeight = baseHeight + yOffset; // 总支撑高度
        
        // 主要水泥支撑柱（从地面延伸到截锥底部）
        const supportPillarGeometry = new THREE.BoxGeometry(2.0, totalHeight, 1.5);
        const supportPillar = new THREE.Mesh(supportPillarGeometry, this.materials.reinforcedConcrete);
        supportPillar.position.set(0, totalHeight / 2, 0); // 中心位置，取消Z轴偏移
        supportPillar.castShadow = true;
        supportPillar.receiveShadow = true;
        supportGroup.add(supportPillar);
        
        
        
        // 侧面加强支撑（类似图片中的结构）
        const sideSupports = 4;
        for (let i = 0; i < sideSupports; i++) {
            const angle = (Math.PI * 2 * i) / sideSupports;
            const x = Math.cos(angle) * 2.0;
            const z = Math.sin(angle) * 2.0;
            
            // 倾斜支撑梁（从底部到顶部）
            const supportBeamGeometry = new THREE.BoxGeometry(0.5, totalHeight * 0.9, 0.8);
            const supportBeam = new THREE.Mesh(supportBeamGeometry, this.materials.reinforcedConcrete);
            supportBeam.position.set(x * 0.5, totalHeight * 0.45, z * 0.5);
            
            // 计算倾斜角度（向内倾斜）
            const tiltAngle = Math.atan2(x, totalHeight * 0.9);
            supportBeam.rotation.z = -tiltAngle * Math.cos(angle);
            supportBeam.rotation.x = -tiltAngle * Math.sin(angle);
            supportBeam.rotation.y = angle;
            
            supportBeam.castShadow = true;
            supportGroup.add(supportBeam);
        }
        
        // 中层支撑环（增强稳定性）
        const midRingGeometry = new THREE.TorusGeometry(3.0, 0.3, 8, 24);
        const midRing = new THREE.Mesh(midRingGeometry, this.materials.reinforcedConcrete);
        midRing.position.set(0, totalHeight * 0.6, 0);
        midRing.rotation.x = Math.PI / 2;
        supportGroup.add(midRing);
        
        // 底部基础扩展
        const foundationGeometry = new THREE.CylinderGeometry(4.0, 4.5, 1.5, 12);
        const foundation = new THREE.Mesh(foundationGeometry, this.materials.concrete);
        foundation.position.set(0, 0.75, 0);
        foundation.receiveShadow = true;
        supportGroup.add(foundation);
        
        parentGroup.add(supportGroup);
    }
    
    /**
     * 创建外部旋转楼梯系统
     */
    createSpiralStaircase() {
        console.log('开始创建制浆设备外部旋转楼梯...');
        
        // 旋转楼梯配置（适配制浆设备）
        const staircaseConfig = {
            centerRadius: 9.5,          // 楼梯中心半径（围绕水泥支撑柱外侧）
            stepWidth: 1.2,             // 踏步宽度
            stepHeight: 0.18,           // 踏步高度（符合建筑规范）
            stepDepth: 0.28,            // 踏步深度
            stepThickness: 0.04,        // 踏步厚度
            totalHeight: 25.0,          // 总高度（与支撑柱同高）
            totalRotations: 4.5,        // 总旋转圈数
            stepsPerRotation: 20,       // 每圈踏步数
            handrailHeight: 1.1,        // 扶手高度
            handrailDiameter: 0.05,     // 扶手管径
            platformCount: 5,           // 休息平台数量
            platformWidth: 2.0,         // 平台宽度
            platformDepth: 1.5,         // 平台深度
            antiSlipPattern: true,      // 防滑纹理
            safetyKickPlate: true,      // 安全踢脚板
            emergencyLighting: true     // 应急照明
        };
        
        // 创建旋转楼梯实例
        const spiralStaircase = new SpiralStaircase(staircaseConfig);
        
        // 将旋转楼梯添加到制浆设备组
        this.components.spiralStaircase = spiralStaircase.getGroup();
        this.group.add(this.components.spiralStaircase);
        
        console.log('制浆设备外部旋转楼梯创建完成');
    }
    
    /**
     * 创建安全设施
     */
    createSafetyFeatures() {
        const safetyGroup = new THREE.Group();
        safetyGroup.name = 'safetyFeatures';
        
        // 安全警示牌
        const signGeometry = new THREE.BoxGeometry(1.5, 1.0, 0.1);
        const sign = new THREE.Mesh(signGeometry, this.materials.safetyYellow);
        sign.position.set(10, 2, 0);
        sign.castShadow = true;
        safetyGroup.add(sign);
        
        // 应急照明灯
        for (let i = 0; i < 4; i++) {
            const angle = (Math.PI * 2 * i) / 4;
            const x = Math.cos(angle) * 12;
            const z = Math.sin(angle) * 12;
            
            const lightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8);
            const light = new THREE.Mesh(lightGeometry, this.materials.safetyYellow);
            light.position.set(x, this.config.platform.supportHeight + 3, z);
            safetyGroup.add(light);
        }
        
        this.components.safety = safetyGroup;
        this.group.add(safetyGroup);
    }
    
    /**
     * 创建标签和标识
     */
    createLabelsAndSigns() {
        const labelsGroup = new THREE.Group();
        labelsGroup.name = 'labels';
        
        // 主标签 - "制浆设备"
        const mainLabel = this.createTankLabel('制浆设备', '#00FF00');
        mainLabel.position.set(0, 32,0);
        labelsGroup.add(mainLabel);
        
        this.components.labels = labelsGroup;
        this.group.add(labelsGroup);
    }
    
    /**
     * 创建设备标签（参考滤液水箱标签实现）
     */
    createTankLabel(text, color = '#FFFFFF') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 100;
        
        // 设置字体和样式
        context.font = 'Bold 40px Microsoft YaHei, Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 绘制背景
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.fill();
        
        // 绘制边框
        context.strokeStyle = color;
        context.lineWidth = 3;
        this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.stroke();
        
        // 绘制文字
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // 创建精灵
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(15, 4, 1);
        sprite.material.sizeAttenuation = true;
        
        return sprite;
    }
    
    /**
     * 绘制圆角矩形辅助函数
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
     * 创建文字标签
     */
    createTextLabel(text, color = 0x000000) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        context.fillStyle = '#ffffff';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        context.fillStyle = `#${color.toString(16).padStart(6, '0')}`;
        context.font = '32px Arial';
        context.textAlign = 'center';
        
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, 80 + index * 40);
        });
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshBasicMaterial({ map: texture });
        const geometry = new THREE.PlaneGeometry(2, 1);
        
        return new THREE.Mesh(geometry, material);
    }
    
    /**
     * 获取组件分组
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * 获取指定组件
     */
    getComponent(name) {
        return this.components[name];
    }
    
    /**
     * 设置可见性
     */
    setVisibility(visible) {
        this.group.visible = visible;
    }
    
    /**
     * 更新动画
     */
    update(time) {
        // 可以添加一些动画效果，比如液体搅拌等
        if (this.components.cylinderTanks) {
            // 制浆箱液体搅拌效果的模拟（待实现）
        }
    }
}