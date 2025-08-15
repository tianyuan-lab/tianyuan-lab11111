/**
 * 滤液水箱模型
 * 基于实际工业照片1:1复刻，符合工业标准设计
 */

class FilterLiquidTank {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.components = new Map();
        
        // 水箱配置参数
        this.tankConfig = {
            name: config.name || '滤液水箱',
            height: config.height || 25, // 主体高度25米
            radius: config.radius || 8,   // 半径8米
            position: config.position || { x: 0, y: 0, z: 0 },
            capacity: config.capacity || '2000m³', // 容量
            material: config.material || '316L不锈钢',
            ...config
        };
        
        // 材质定义 - 工业风格美化
        this.materials = {
            // 主体钢材 - 高级不锈钢质感
            steel: new THREE.MeshStandardMaterial({
                color: 0xB8C5D6,
                metalness: 0.9,
                roughness: 0.1,
                envMapIntensity: 1.2,
                transparent: false
            }),
            // 罐体外壳 - 带磨损效果的工业钢材
            tankShell: new THREE.MeshStandardMaterial({
                color: 0xA8B2C1,
                metalness: 0.8,
                roughness: 0.3,
                envMapIntensity: 1.0
            }),
            // 管道材质 - 镀锌钢管
            pipe: new THREE.MeshStandardMaterial({
                color: 0x95A5B8,
                metalness: 0.85,
                roughness: 0.2,
                envMapIntensity: 0.8
            }),
            // 平台护栏 - 深色工业钢材
            railing: new THREE.MeshStandardMaterial({
                color: 0x5D6B7C,
                metalness: 0.7,
                roughness: 0.4,
                envMapIntensity: 0.6
            }),
            // 阀门材质 - 黄铜材质
            valve: new THREE.MeshStandardMaterial({
                color: 0xCD7F32,
                metalness: 0.9,
                roughness: 0.1,
                envMapIntensity: 1.5
            }),
            // 标识牌背景 - 工业标准白色
            signBackground: new THREE.MeshStandardMaterial({
                color: 0xF0F4F8,
                metalness: 0.0,
                roughness: 0.8,
                envMapIntensity: 0.3
            }),
            // 液体材质 - 深绿色滤液
            liquid: new THREE.MeshStandardMaterial({
                color: 0x32CD32,
                transparent: true,
                opacity: 0.75,
                metalness: 0.0,
                roughness: 0.15,
                envMapIntensity: 1.8,
                transmission: 0.4
            }),
            // 加强环材质 - 重型钢材
            reinforcement: new THREE.MeshStandardMaterial({
                color: 0x4A5568,
                metalness: 0.9,
                roughness: 0.2,
                envMapIntensity: 1.0
            }),
            // 支撑结构 - 结构钢
            support: new THREE.MeshStandardMaterial({
                color: 0x708090,
                metalness: 0.8,
                roughness: 0.3,
                envMapIntensity: 0.7
            })
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log(`创建${this.tankConfig.name}...`);
        
        // 创建主体结构
        this.createMainTank();
        
        // 创建底部支撑
        this.createBottomSupport();
        
        // 创建顶部结构
        this.createTopStructure();
        
        // 创建管道系统
        this.createPipeSystem();
        
        // 创建平台和梯子
        this.createPlatformsAndLadders();
        
        // 创建阀门和控制设备
        this.createValvesAndControls();
        
        // 创建安全设施
        this.createSafetyEquipment();
        
        // 创建标识和标签
        this.createLabelsAndSigns();
        
        // 创建液体内容
        this.createLiquidContent();
        
        // 底部管道接口已简化，不再需要复杂的接口
        
        // 设置位置
        this.group.position.set(
            this.tankConfig.position.x,
            this.tankConfig.position.y,
            this.tankConfig.position.z
        );
        
        console.log(`✓ ${this.tankConfig.name}创建完成`);
    }
    
    /**
     * 创建主体储罐
     */
    createMainTank() {
        const tankGroup = new THREE.Group();
        tankGroup.name = 'mainTank';
        
        const radius = this.tankConfig.radius;
        const height = this.tankConfig.height;
        
        // 主圆柱体 - 使用专用罐体材质
        const cylinderGeometry = new THREE.CylinderGeometry(radius, radius, height, 48);
        const cylinderMesh = new THREE.Mesh(cylinderGeometry, this.materials.tankShell);
        cylinderMesh.position.y = height / 2;
        cylinderMesh.castShadow = true;
        cylinderMesh.receiveShadow = true;
        tankGroup.add(cylinderMesh);
        
        // 顶盖 - 厚重的工业风格
        const topGeometry = new THREE.CylinderGeometry(radius + 0.1, radius + 0.1, 0.5, 48);
        const topMesh = new THREE.Mesh(topGeometry, this.materials.steel);
        topMesh.position.y = height + 0.25;
        topMesh.castShadow = true;
        tankGroup.add(topMesh);
        
        // 底盖 - 厚重基座
        const bottomGeometry = new THREE.CylinderGeometry(radius + 0.1, radius + 0.1, 0.5, 48);
        const bottomMesh = new THREE.Mesh(bottomGeometry, this.materials.steel);
        bottomMesh.position.y = -0.25;
        bottomMesh.castShadow = true;
        tankGroup.add(bottomMesh);
        
        // 罐体加强环 - 更粗壮的工业设计
        for (let i = 1; i < 6; i++) {
            const ringGeometry = new THREE.TorusGeometry(radius + 0.1, 0.12, 12, 48);
            const ringMesh = new THREE.Mesh(ringGeometry, this.materials.reinforcement);
            ringMesh.position.y = (height / 6) * i;
            ringMesh.rotation.x = Math.PI / 2;
            ringMesh.castShadow = true;
            tankGroup.add(ringMesh);
        }
        
        // 添加垂直加强肋条
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const ribGeometry = new THREE.BoxGeometry(0.2, height, 0.15);
            const ribMesh = new THREE.Mesh(ribGeometry, this.materials.reinforcement);
            ribMesh.position.set(
                Math.cos(angle) * (radius + 0.05),
                height / 2,
                Math.sin(angle) * (radius + 0.05)
            );
            ribMesh.castShadow = true;
            tankGroup.add(ribMesh);
        }
        
        // 添加人孔盖
        const manholeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
        const manholeMesh = new THREE.Mesh(manholeGeometry, this.materials.steel);
        manholeMesh.position.set(0, height + 0.35, 0);
        manholeMesh.castShadow = true;
        tankGroup.add(manholeMesh);
        
        // 人孔盖螺栓
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const boltGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.15, 8);
            const boltMesh = new THREE.Mesh(boltGeometry, this.materials.valve);
            boltMesh.position.set(
                Math.cos(angle) * 0.7,
                height + 0.45,
                Math.sin(angle) * 0.7
            );
            tankGroup.add(boltMesh);
        }
        
        // 滤液水箱特有的过滤器外置装置
        const filterHousingGeometry = new THREE.CylinderGeometry(1.2, 1.2, 3, 16);
        const filterHousingMesh = new THREE.Mesh(filterHousingGeometry, this.materials.steel);
        filterHousingMesh.position.set(radius + 1.5, height * 0.7, 0);
        filterHousingMesh.rotation.z = Math.PI / 2;
        filterHousingMesh.castShadow = true;
        tankGroup.add(filterHousingMesh);
        
        this.components.set('mainTank', tankGroup);
        this.group.add(tankGroup);
    }
    
    /**
     * 创建底部支撑结构
     */
    createBottomSupport() {
        const supportGroup = new THREE.Group();
        supportGroup.name = 'bottomSupport';
        
        const radius = this.tankConfig.radius;
        
        // 钢筋混凝土基础环 - 更厚重的工业基础
        const baseGeometry = new THREE.CylinderGeometry(radius + 1.5, radius + 1.5, 1.2, 48);
        const baseMaterial = new THREE.MeshStandardMaterial({ 
            color: 0x5A5A5A,
            metalness: 0.1,
            roughness: 0.9,
            envMapIntensity: 0.2
        });
        const baseMesh = new THREE.Mesh(baseGeometry, baseMaterial);
        baseMesh.position.y = -0.6;
        baseMesh.receiveShadow = true;
        supportGroup.add(baseMesh);
        
        // 钢制支撑框架 - 工字钢结构
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const x = Math.cos(angle) * (radius - 0.5);
            const z = Math.sin(angle) * (radius - 0.5);
            
            // 垂直支撑柱
            const supportGeometry = new THREE.BoxGeometry(0.4, 3, 0.4);
            const supportMesh = new THREE.Mesh(supportGeometry, this.materials.support);
            supportMesh.position.set(x, 1.5, z);
            supportMesh.castShadow = true;
            supportGroup.add(supportMesh);
            
            // 支撑柱底部法兰
            const flangeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.2, 16);
            const flangeMesh = new THREE.Mesh(flangeGeometry, this.materials.steel);
            flangeMesh.position.set(x, 0.1, z);
            flangeMesh.castShadow = true;
            supportGroup.add(flangeMesh);
        }
        
        // 环形支撑梁
        for (let level = 0; level < 2; level++) {
            const y = 1 + level * 1.5;
            const beamRadius = radius - 0.3;
            
            for (let i = 0; i < 12; i++) {
                const angle1 = (i / 12) * Math.PI * 2;
                const angle2 = ((i + 1) / 12) * Math.PI * 2;
                
                const x1 = Math.cos(angle1) * beamRadius;
                const z1 = Math.sin(angle1) * beamRadius;
                const x2 = Math.cos(angle2) * beamRadius;
                const z2 = Math.sin(angle2) * beamRadius;
                
                const beamLength = Math.sqrt((x2-x1)**2 + (z2-z1)**2);
                const beamGeometry = new THREE.BoxGeometry(beamLength, 0.3, 0.2);
                const beamMesh = new THREE.Mesh(beamGeometry, this.materials.support);
                
                beamMesh.position.set((x1+x2)/2, y, (z1+z2)/2);
                beamMesh.rotation.y = Math.atan2(z2-z1, x2-x1);
                beamMesh.castShadow = true;
                supportGroup.add(beamMesh);
            }
        }
        
        this.components.set('bottomSupport', supportGroup);
        this.group.add(supportGroup);
    }
    
    /**
     * 创建顶部结构
     */
    createTopStructure() {
        const topGroup = new THREE.Group();
        topGroup.name = 'topStructure';
        
        const height = this.tankConfig.height;
        const radius = this.tankConfig.radius;
        
        // 人孔盖
        const manholeGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 16);
        const manholeMesh = new THREE.Mesh(manholeGeometry, this.materials.steel);
        manholeMesh.position.set(2, height + 0.4, 0);
        manholeMesh.castShadow = true;
        topGroup.add(manholeMesh);
        
        // 通气管
        const ventGeometry = new THREE.CylinderGeometry(0.15, 0.15, 2, 8);
        const ventMesh = new THREE.Mesh(ventGeometry, this.materials.pipe);
        ventMesh.position.set(-2, height + 1.3, 2);
        ventMesh.castShadow = true;
        topGroup.add(ventMesh);
        
        // 液位计
        const levelGeometry = new THREE.BoxGeometry(0.3, 1.5, 0.2);
        const levelMesh = new THREE.Mesh(levelGeometry, this.materials.valve);
        levelMesh.position.set(radius + 0.2, height - 2, 0);
        levelMesh.castShadow = true;
        topGroup.add(levelMesh);
        
        this.components.set('topStructure', topGroup);
        this.group.add(topGroup);
    }
    
    /**
     * 创建管道系统
     */
    createPipeSystem() {
        const pipeGroup = new THREE.Group();
        pipeGroup.name = 'pipeSystem';
        
        const radius = this.tankConfig.radius;
        const height = this.tankConfig.height;
        
        // 进液管道
        const inletPipe = this.createPipeSegment(0.4, 6, { x: radius + 3, y: height * 0.8, z: 0 });
        inletPipe.rotation.z = Math.PI / 2;
        pipeGroup.add(inletPipe);
        
        // 出液管道
        const outletPipe = this.createPipeSegment(0.4, 8, { x: 0, y: 1, z: radius + 4 });
        outletPipe.rotation.x = Math.PI / 2;
        pipeGroup.add(outletPipe);
        
        // 排污管道
        const drainPipe = this.createPipeSegment(0.3, 4, { x: -radius - 2, y: 0.5, z: 0 });
        drainPipe.rotation.z = Math.PI / 2;
        pipeGroup.add(drainPipe);
        
        // 过滤管道
        const filterPipe = this.createPipeSegment(0.35, 12, { x: radius + 6, y: height * 0.5, z: 0 });
        filterPipe.rotation.z = Math.PI / 2;
        pipeGroup.add(filterPipe);
        
        // 管道弯头和连接件
        this.createPipeConnections(pipeGroup);
        
        this.components.set('pipeSystem', pipeGroup);
        this.group.add(pipeGroup);
    }
    
    /**
     * 创建管道段
     */
    createPipeSegment(radius, length, position) {
        const pipeGeometry = new THREE.CylinderGeometry(radius, radius, length, 12);
        const pipeMesh = new THREE.Mesh(pipeGeometry, this.materials.pipe);
        pipeMesh.position.set(position.x, position.y, position.z);
        pipeMesh.castShadow = true;
        return pipeMesh;
    }
    
    /**
     * 创建管道连接件
     */
    createPipeConnections(pipeGroup) {
        const radius = this.tankConfig.radius;
        const height = this.tankConfig.height;
        
        // 法兰连接
        for (let i = 0; i < 4; i++) {
            const flangeGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.2, 16);
            const flangeMesh = new THREE.Mesh(flangeGeometry, this.materials.steel);
            flangeMesh.position.set(
                radius + 0.5,
                height * 0.2 + i * 3,
                0
            );
            flangeMesh.rotation.z = Math.PI / 2;
            flangeMesh.castShadow = true;
            pipeGroup.add(flangeMesh);
        }
        
        // 弯头
        const elbowGeometry = new THREE.TorusGeometry(1, 0.4, 8, 16, Math.PI / 2);
        const elbowMesh = new THREE.Mesh(elbowGeometry, this.materials.pipe);
        elbowMesh.position.set(radius + 6, height * 0.8, 0);
        elbowMesh.rotation.y = Math.PI / 2;
        elbowMesh.castShadow = true;
        pipeGroup.add(elbowMesh);
    }
    
    /**
     * 创建平台和梯子
     */
    createPlatformsAndLadders() {
        const accessGroup = new THREE.Group();
        accessGroup.name = 'platformsAndLadders';
        
        const radius = this.tankConfig.radius;
        const height = this.tankConfig.height;
        
        // 顶部检修平台
        this.createPlatform(accessGroup, radius + 2, height + 0.5, 0, 1.2);
        
        // 中部操作平台
        this.createPlatform(accessGroup, radius + 1.5, height * 0.6, 0, 1);
        
        // 底部维护平台  
        this.createPlatform(accessGroup, radius + 1, 2, 0, 0.8);
        
        // 主梯子
        this.createLadder(accessGroup, radius + 0.3, height, 0);
        
        // 护栏
        this.createRailings(accessGroup);
        
        this.components.set('platformsAndLadders', accessGroup);
        this.group.add(accessGroup);
    }
    
    /**
     * 创建平台
     */
    createPlatform(parent, x, y, z, width) {
        const platformGeometry = new THREE.BoxGeometry(width * 2, 0.1, width * 2);
        const platformMesh = new THREE.Mesh(platformGeometry, this.materials.steel);
        platformMesh.position.set(x, y, z);
        platformMesh.castShadow = true;
        platformMesh.receiveShadow = true;
        parent.add(platformMesh);
        
        // 格栅效果
        for (let i = -3; i <= 3; i++) {
            const grateGeometry = new THREE.BoxGeometry(0.05, 0.12, width * 2);
            const grateMesh = new THREE.Mesh(grateGeometry, this.materials.railing);
            grateMesh.position.set(x + i * 0.2, y, z);
            parent.add(grateMesh);
        }
    }
    
    /**
     * 创建梯子
     */
    createLadder(parent, x, height, z) {
        // 左侧立柱
        const leftRailGeometry = new THREE.CylinderGeometry(0.05, 0.05, height, 8);
        const leftRailMesh = new THREE.Mesh(leftRailGeometry, this.materials.railing);
        leftRailMesh.position.set(x - 0.3, height / 2, z);
        leftRailMesh.castShadow = true;
        parent.add(leftRailMesh);
        
        // 右侧立柱
        const rightRailMesh = leftRailMesh.clone();
        rightRailMesh.position.set(x + 0.3, height / 2, z);
        parent.add(rightRailMesh);
        
        // 横档
        const rungs = Math.floor(height / 0.4);
        for (let i = 0; i < rungs; i++) {
            const rungGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.6, 8);
            const rungMesh = new THREE.Mesh(rungGeometry, this.materials.railing);
            rungMesh.position.set(x, i * 0.4 + 0.2, z);
            rungMesh.rotation.z = Math.PI / 2;
            parent.add(rungMesh);
        }
    }
    
    /**
     * 创建护栏
     */
    createRailings(parent) {
        const radius = this.tankConfig.radius;
        const height = this.tankConfig.height;
        
        // 顶部平台护栏
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const x = Math.cos(angle) * (radius + 2);
            const z = Math.sin(angle) * (radius + 2);
            
            const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, 1.2, 8);
            const postMesh = new THREE.Mesh(postGeometry, this.materials.railing);
            postMesh.position.set(x, height + 1.1, z);
            postMesh.castShadow = true;
            parent.add(postMesh);
        }
    }
    
    /**
     * 创建阀门和控制设备
     */
    createValvesAndControls() {
        const controlGroup = new THREE.Group();
        controlGroup.name = 'valvesAndControls';
        
        const radius = this.tankConfig.radius;
        const height = this.tankConfig.height;
        
        // 主控制阀门
        const mainValve = this.createValve(0.5, { x: radius + 3.5, y: height * 0.8, z: 0 });
        controlGroup.add(mainValve);
        
        // 过滤阀门
        const filterValve = this.createValve(0.45, { x: radius + 6.5, y: height * 0.5, z: 0 });
        controlGroup.add(filterValve);
        
        // 排放阀门
        const drainValve = this.createValve(0.4, { x: -radius - 2.5, y: 0.5, z: 0 });
        controlGroup.add(drainValve);
        
        // 安全阀
        const safetyValve = this.createValve(0.3, { x: 0, y: height + 0.5, z: 2 });
        controlGroup.add(safetyValve);
        
        // 控制柜
        const controlBoxGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.4);
        const controlBoxMesh = new THREE.Mesh(controlBoxGeometry, this.materials.valve);
        controlBoxMesh.position.set(radius + 3, 1.4, 3);
        controlBoxMesh.castShadow = true;
        controlGroup.add(controlBoxMesh);
        
        this.components.set('valvesAndControls', controlGroup);
        this.group.add(controlGroup);
    }
    
    /**
     * 创建阀门
     */
    createValve(size, position) {
        const valveGroup = new THREE.Group();
        
        // 阀体
        const bodyGeometry = new THREE.BoxGeometry(size, size, size * 0.8);
        const bodyMesh = new THREE.Mesh(bodyGeometry, this.materials.valve);
        bodyMesh.castShadow = true;
        valveGroup.add(bodyMesh);
        
        // 手轮
        const wheelGeometry = new THREE.CylinderGeometry(size * 0.6, size * 0.6, 0.1, 16);
        const wheelMesh = new THREE.Mesh(wheelGeometry, this.materials.steel);
        wheelMesh.position.y = size * 0.8;
        wheelMesh.castShadow = true;
        valveGroup.add(wheelMesh);
        
        valveGroup.position.set(position.x, position.y, position.z);
        return valveGroup;
    }
    
    /**
     * 创建安全设施
     */
    createSafetyEquipment() {
        const safetyGroup = new THREE.Group();
        safetyGroup.name = 'safetyEquipment';
        
        const radius = this.tankConfig.radius;
        
        // 安全标志牌
        const signGeometry = new THREE.PlaneGeometry(1, 0.8);
        const signMaterial = new THREE.MeshPhongMaterial({ 
            color: 0xFFFF00,
            side: THREE.DoubleSide
        });
        const signMesh = new THREE.Mesh(signGeometry, signMaterial);
        signMesh.position.set(radius + 0.5, 3, 0);
        signMesh.rotation.y = -Math.PI / 2;
        safetyGroup.add(signMesh);
        
        this.components.set('safetyEquipment', safetyGroup);
        this.group.add(safetyGroup);
    }
    
    /**
     * 创建标识和标签
     */
    createLabelsAndSigns() {
        const labelGroup = new THREE.Group();
        labelGroup.name = 'labelsAndSigns';
        
        const radius = this.tankConfig.radius;
        const height = this.tankConfig.height;
        
        // 主标签 - 滤液水箱
        const mainLabel = this.createTankLabel('滤液水箱', '#228B22');
        mainLabel.position.set(0, height + 2, 0);
        labelGroup.add(mainLabel);
        
        // 容量标识
        const capacitySign = this.createInformationSign(
            `容量: ${this.tankConfig.capacity}\n材质: ${this.tankConfig.material}`,
            { x: radius + 0.2, y: height * 0.7, z: 0 }
        );
        labelGroup.add(capacitySign);
        
        // 编号标识
        const numberSign = this.createInformationSign(
            'T-002\n滤液水箱',
            { x: -radius - 0.2, y: height * 0.5, z: 0 }
        );
        labelGroup.add(numberSign);
        
        this.components.set('labelsAndSigns', labelGroup);
        this.group.add(labelGroup);
    }
    
    /**
     * 创建水箱标签
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
     * 创建信息标牌
     */
    createInformationSign(text, position) {
        const signGeometry = new THREE.PlaneGeometry(2, 1.5);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 192;
        
        // 白色背景
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 黑色边框
        context.strokeStyle = '#000000';
        context.lineWidth = 4;
        context.strokeRect(0, 0, canvas.width, canvas.height);
        
        // 文字
        context.fillStyle = '#000000';
        context.font = 'Bold 24px Arial';
        context.textAlign = 'center';
        
        const lines = text.split('\n');
        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, 60 + index * 40);
        });
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.MeshPhongMaterial({
            map: texture,
            transparent: true,
            side: THREE.DoubleSide
        });
        
        const signMesh = new THREE.Mesh(signGeometry, material);
        signMesh.position.set(position.x, position.y, position.z);
        signMesh.rotation.y = position.x > 0 ? -Math.PI / 2 : Math.PI / 2;
        
        return signMesh;
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
     * 创建液体内容
     */
    createLiquidContent() {
        const liquidGroup = new THREE.Group();
        liquidGroup.name = 'liquidContent';
        
        const radius = this.tankConfig.radius - 0.1;
        const liquidHeight = this.tankConfig.height * 0.6; // 60%液位
        
        // 液体主体 - 绿色滤液
        const liquidGeometry = new THREE.CylinderGeometry(radius, radius, liquidHeight, 32);
        const liquidMesh = new THREE.Mesh(liquidGeometry, this.materials.liquid);
        liquidMesh.position.y = liquidHeight / 2;
        liquidGroup.add(liquidMesh);
        
        // 液面波纹效果
        const surfaceGeometry = new THREE.CylinderGeometry(radius, radius, 0.1, 32);
        const surfaceMaterial = new THREE.MeshPhongMaterial({
            color: 0x32CD32,
            transparent: true,
            opacity: 0.8,
            shininess: 200
        });
        const surfaceMesh = new THREE.Mesh(surfaceGeometry, surfaceMaterial);
        surfaceMesh.position.y = liquidHeight;
        liquidGroup.add(surfaceMesh);
        
        this.components.set('liquidContent', liquidGroup);
        this.group.add(liquidGroup);
    }
    
    /**
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.tankConfig.name,
            type: '滤液水箱',
            height: this.tankConfig.height,
            radius: this.tankConfig.radius,
            capacity: this.tankConfig.capacity,
            material: this.tankConfig.material,
            components: Array.from(this.components.keys()),
            position: this.tankConfig.position
        };
    }

    getBottomOutletWorldPosition() {
        // 简化版：直接返回水箱底部位置（兼容性保留）
        const local = new THREE.Vector3(0, 0.4, -0.8);
        return this.group.localToWorld(local.clone());
    }
    
    /**
     * 销毁模型
     */
    dispose() {
        this.group.clear();
        this.components.clear();
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FilterLiquidTank;
} else if (typeof window !== 'undefined') {
    window.FilterLiquidTank = FilterLiquidTank;
}