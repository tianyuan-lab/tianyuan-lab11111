/**
 * 旋转楼梯系统 - 真实工业级螺旋楼梯
 * 围绕制浆设备外部水泥支撑结构，从底部到顶部螺旋上升
 * 采用真实的钢结构设计，符合工业安全标准和实际工程要求
 */
class SpiralStaircase {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.group.name = 'spiralStaircase';
        
        // 旋转楼梯配置参数
        this.config = {
            // 基础几何参数
            centerRadius: config.centerRadius || 9.5,        // 楼梯中心半径（围绕支撑柱外侧）
            stepWidth: config.stepWidth || 1.0,              // 踏步宽度（减小以更真实）
            stepHeight: config.stepHeight || 0.18,           // 踏步高度（18cm，符合建筑规范）
            stepDepth: config.stepDepth || 0.25,             // 踏步深度（25cm）
            stepThickness: config.stepThickness || 0.05,     // 踏步厚度（5cm钢格板）
            
            // 螺旋参数
            totalHeight: config.totalHeight || 25.0,         // 总高度（与支撑柱同高）
            totalRotations: config.totalRotations || 4.0,    // 总旋转圈数（减少以更合理）
            stepsPerRotation: config.stepsPerRotation || 16, // 每圈踏步数（减少以增加舒适度）
            
            // 扶手栏杆参数
            handrailHeight: config.handrailHeight || 1.1,    // 扶手高度
            handrailDiameter: config.handrailDiameter || 0.04, // 扶手管径
            postDiameter: config.postDiameter || 0.06,       // 立柱直径
            postSpacing: config.postSpacing || 1.2,          // 立柱间距
            
            // 平台参数
            platformCount: config.platformCount || 4,        // 休息平台数量
            platformWidth: config.platformWidth || 2.5,      // 平台宽度
            platformDepth: config.platformDepth || 2.0,      // 平台深度
            platformThickness: config.platformThickness || 0.06, // 平台厚度
            
            // 支撑结构参数
            stringerWidth: config.stringerWidth || 0.3,      // 主梁宽度
            stringerHeight: config.stringerHeight || 0.4,    // 主梁高度
            bracingSize: config.bracingSize || 0.08,         // 斜撑尺寸
            centralColumnRadius: config.centralColumnRadius || 0.25, // 中心支撑柱半径
            
            // 钢格板参数
            gratingBarSpacing: config.gratingBarSpacing || 0.03, // 钢格板条间距
            gratingBarWidth: config.gratingBarWidth || 0.005,    // 钢格板条宽度
            gratingBarHeight: config.gratingBarHeight || 0.02,   // 钢格板条高度
            
            // 材质和安全特性
            antiSlipPattern: config.antiSlipPattern || true,  // 防滑纹理
            safetyKickPlate: config.safetyKickPlate || true, // 安全踢脚板
            emergencyLighting: config.emergencyLighting || true // 应急照明
        };
        
        this.materials = {};
        this.components = {};
        
        this.initialize();
    }
    
    /**
     * 初始化旋转楼梯系统
     */
    initialize() {
        console.log('开始创建工业级旋转楼梯系统...');
        
        // 创建材质
        this.createMaterials();
        
        // 创建中心支撑柱
        this.createCentralColumn();
        
        // 创建简化螺旋踏步
        this.createSimpleSteps();
        
        // 创建简化扶手系统
        this.createSimpleHandrails();
        

        
        console.log('工业级旋转楼梯系统创建完成');
    }
    
    /**
     * 创建材质系统
     */
    createMaterials() {
        this.materials = {
            // 钢格板踏步（防滑）
            steelGrating: new THREE.MeshStandardMaterial({
                color: 0x4a4a4a,
                metalness: 0.8,
                roughness: 0.4,
                envMapIntensity: 0.6
            }),
            
            // 不锈钢扶手
            stainlessSteel: new THREE.MeshStandardMaterial({
                color: 0xc0c0c0,
                metalness: 0.9,
                roughness: 0.1,
                envMapIntensity: 1.0
            }),
            
            // 钢结构支撑
            structuralSteel: new THREE.MeshStandardMaterial({
                color: 0x2c3e50,
                metalness: 0.7,
                roughness: 0.3,
                envMapIntensity: 0.7
            }),
            
            // 防滑条
            antiSlipStrip: new THREE.MeshStandardMaterial({
                color: 0xf39c12,
                metalness: 0.2,
                roughness: 0.8,
                envMapIntensity: 0.3
            }),
            
            // 安全黄色标识
            safetyYellow: new THREE.MeshStandardMaterial({
                color: 0xffcc00,
                metalness: 0.1,
                roughness: 0.7,
                envMapIntensity: 0.4
            }),
            
            // LED照明
            ledLight: new THREE.MeshStandardMaterial({
                color: 0xffffff,
                emissive: 0x444444,
                metalness: 0.0,
                roughness: 0.1
            })
        };
    }
    
    /**
     * 创建中心支撑柱
     */
    createCentralColumn() {
        const columnGroup = new THREE.Group();
        columnGroup.name = 'centralColumn';
        
        // 主支撑柱
        const columnGeometry = new THREE.CylinderGeometry(
            this.config.centralColumnRadius,
            this.config.centralColumnRadius + 0.1, // 底部稍粗
            this.config.totalHeight,
            16
        );
        const column = new THREE.Mesh(columnGeometry, this.materials.structuralSteel);
        column.position.y = this.config.totalHeight / 2;
        column.castShadow = true;
        column.receiveShadow = true;
        columnGroup.add(column);
        
        // 柱顶装饰
        const capGeometry = new THREE.CylinderGeometry(
            this.config.centralColumnRadius + 0.1,
            this.config.centralColumnRadius,
            0.3,
            16
        );
        const cap = new THREE.Mesh(capGeometry, this.materials.structuralSteel);
        cap.position.y = this.config.totalHeight - 0.15;
        cap.castShadow = true;
        columnGroup.add(cap);
        
        this.components.centralColumn = columnGroup;
        this.group.add(columnGroup);
    }
    
    /**
     * 创建简化螺旋踏步
     */
    createSimpleSteps() {
        const stepsGroup = new THREE.Group();
        stepsGroup.name = 'simpleSteps';
        
        const totalSteps = Math.floor(this.config.totalRotations * this.config.stepsPerRotation);
        const angleStep = (2 * Math.PI * this.config.totalRotations) / totalSteps;
        const heightStep = this.config.totalHeight / totalSteps;
        
        for (let i = 0; i < totalSteps; i++) {
            const angle = i * angleStep;
            const height = i * heightStep + 0.5;
            
            // 简单的楔形踏步
            const stepGeometry = new THREE.CylinderGeometry(
                this.config.centerRadius + this.config.stepWidth / 2,
                this.config.centerRadius + this.config.stepWidth / 2,
                0.05, // 踏步厚度
                16,
                1,
                false,
                angle - Math.PI / 12, // 楔形角度
                Math.PI / 6
            );
            
            const step = new THREE.Mesh(stepGeometry, this.materials.steelGrating);
            step.position.y = height;
            step.castShadow = true;
            step.receiveShadow = true;
            stepsGroup.add(step);
        }
        
        this.components.steps = stepsGroup;
        this.group.add(stepsGroup);
    }
    

    
    /**
     * 创建简化扶手系统
     */
    createSimpleHandrails() {
        const handrailGroup = new THREE.Group();
        handrailGroup.name = 'simpleHandrails';
        
        const totalSteps = Math.floor(this.config.totalRotations * this.config.stepsPerRotation);
        const angleStep = (2 * Math.PI * this.config.totalRotations) / totalSteps;
        const heightStep = this.config.totalHeight / totalSteps;
        
        // 创建简单的螺旋扶手
        const points = [];
        for (let i = 0; i <= totalSteps; i++) {
            const angle = i * angleStep;
            const height = i * heightStep + 0.5 + this.config.handrailHeight;
            const radius = this.config.centerRadius + this.config.stepWidth / 2 + 0.1;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            points.push(new THREE.Vector3(x, height, z));
        }
        
        // 创建扶手曲线
        const curve = new THREE.CatmullRomCurve3(points);
        const tubeGeometry = new THREE.TubeGeometry(curve, totalSteps * 2, 0.025, 8, false);
        const handrail = new THREE.Mesh(tubeGeometry, this.materials.stainlessSteel);
        handrail.castShadow = true;
        handrailGroup.add(handrail);
        
        this.components.handrail = handrailGroup;
        this.group.add(handrailGroup);
    }

    
    
    
    /**
     * 获取组件分组
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * 设置位置
     */
    setPosition(x, y, z) {
        this.group.position.set(x, y, z);
    }
    
    /**
     * 设置旋转
     */
    setRotation(x, y, z) {
        this.group.rotation.set(x, y, z);
    }
    
    /**
     * 获取配置信息
     */
    getConfig() {
        return this.config;
    }
    
    /**
     * 更新配置
     */
    updateConfig(newConfig) {
        Object.assign(this.config, newConfig);
        
        // 清除现有组件
        this.group.clear();
        this.components = {};
        
        // 重新初始化
        this.initialize();
    }
}