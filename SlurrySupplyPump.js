/**
 * 供浆泵 - 工业级离心泵系统
 * 用于向一级塔和二级塔供应石灰石浆液
 */
class SlurrySupplyPump {
    constructor(config = {}) {
        this.config = {
            name: config.name || '供浆泵',
            position: config.position || { x: 0, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            scale: config.scale || 1.0,
            
            // 泵体尺寸配置
            pumpBodyWidth: config.pumpBodyWidth || 2.5,
            pumpBodyHeight: config.pumpBodyHeight || 1.8,
            pumpBodyDepth: config.pumpBodyDepth || 1.5,
            
            // 电机配置
            motorWidth: config.motorWidth || 1.2,
            motorHeight: config.motorHeight || 1.0,
            motorLength: config.motorLength || 2.0,
            
            // 管道配置
            inletDiameter: config.inletDiameter || 0.6,
            outletDiameter: config.outletDiameter || 0.5,
            pipeLength: config.pipeLength || 1.5,
            
            // 基础配置
            baseWidth: config.baseWidth || 3.5,
            baseDepth: config.baseDepth || 2.5,
            baseHeight: config.baseHeight || 0.3,
            
            // 标签配置
            labelText: config.labelText || '供浆泵',
            labelColor: config.labelColor || '#FF6B35'
        };
        
        this.group = new THREE.Group();
        this.group.name = this.config.name;
        this.components = {};
        
        // 创建材质
        this.createMaterials();
        
        // 初始化
        this.initialize();
        
        // 设置位置和旋转
        this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
        this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);
        this.group.scale.setScalar(this.config.scale);
    }
    
    /**
     * 创建材质
     */
    createMaterials() {
        this.materials = {
            // 泵体材质 - 铸铁
            pumpBody: new THREE.MeshStandardMaterial({
                color: 0x2C3E50,
                metalness: 0.8,
                roughness: 0.3,
                envMapIntensity: 0.5
            }),
            
            // 电机材质 - 钢制外壳
            motor: new THREE.MeshStandardMaterial({
                color: 0x34495E,
                metalness: 0.7,
                roughness: 0.4
            }),
            
            // 管道材质 - 不锈钢
            pipe: new THREE.MeshStandardMaterial({
                color: 0xBDC3C7,
                metalness: 0.9,
                roughness: 0.1
            }),
            
            // 基础材质 - 混凝土
            base: new THREE.MeshStandardMaterial({
                color: 0x95A5A6,
                metalness: 0.1,
                roughness: 0.8
            }),
            
            // 法兰材质 - 钢制
            flange: new THREE.MeshStandardMaterial({
                color: 0x7F8C8D,
                metalness: 0.8,
                roughness: 0.3
            }),
            
            // 装饰材质 - 黄色警示
            accent: new THREE.MeshStandardMaterial({
                color: 0xF39C12,
                metalness: 0.2,
                roughness: 0.6
            })
        };
    }
    
    /**
     * 初始化泵系统
     */
    initialize() {
        try {
            // 创建基础
            this.createBase();
            
            // 创建泵体
            this.createPumpBody();
            
            // 创建电机
            this.createMotor();
            
            // 创建进浆管道
            this.createInletPipe();
            
            // 创建出浆管道
            this.createOutletPipe();
            
            // 创建支撑结构
            this.createSupportStructure();
            
            // 创建装饰细节
            this.createDetails();
            
            // 创建增强工业细节
            this.createEnhancedDetails();
            
            // 创建管道系统细节
            this.createPipeSystemDetails();
            
            // 创建安全防护设施
            this.createSafetyEquipment();
            
            // 创建标签
            this.createLabel();
            
        } catch (error) {
            console.error('供浆泵初始化失败:', error);
        }
    }
    
    /**
     * 创建基础底座
     */
    createBase() {
        const baseGroup = new THREE.Group();
        baseGroup.name = '基础底座';
        
        // 主基础
        const baseGeometry = new THREE.BoxGeometry(
            this.config.baseWidth,
            this.config.baseHeight,
            this.config.baseDepth
        );
        const base = new THREE.Mesh(baseGeometry, this.materials.base);
        base.position.y = this.config.baseHeight / 2;
        base.castShadow = true;
        base.receiveShadow = true;
        baseGroup.add(base);
        
        // 基础边缘加强
        const edgeGeometry = new THREE.BoxGeometry(
            this.config.baseWidth + 0.1,
            0.05,
            this.config.baseDepth + 0.1
        );
        const edge = new THREE.Mesh(edgeGeometry, this.materials.flange);
        edge.position.y = this.config.baseHeight + 0.025;
        baseGroup.add(edge);
        
        // 地脚螺栓
        for (let i = 0; i < 4; i++) {
            const boltGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.2, 8);
            const bolt = new THREE.Mesh(boltGeometry, this.materials.flange);
            const angle = (i / 4) * Math.PI * 2;
            bolt.position.set(
                Math.cos(angle) * (this.config.baseWidth / 2 - 0.2),
                this.config.baseHeight + 0.1,
                Math.sin(angle) * (this.config.baseDepth / 2 - 0.2)
            );
            baseGroup.add(bolt);
        }
        
        this.components.base = baseGroup;
        this.group.add(baseGroup);
    }
    
    /**
     * 创建泵体
     */
    createPumpBody() {
        const pumpGroup = new THREE.Group();
        pumpGroup.name = '泵体';
        
        // 主泵体 - 蜗壳形状
        const pumpBodyGeometry = new THREE.CylinderGeometry(
            this.config.pumpBodyWidth / 2,
            this.config.pumpBodyWidth / 2,
            this.config.pumpBodyHeight,
            16
        );
        const pumpBody = new THREE.Mesh(pumpBodyGeometry, this.materials.pumpBody);
        pumpBody.position.y = this.config.baseHeight + this.config.pumpBodyHeight / 2;
        pumpBody.castShadow = true;
        pumpGroup.add(pumpBody);
        
        // 泵体顶盖
        const topCoverGeometry = new THREE.CylinderGeometry(
            this.config.pumpBodyWidth / 2 + 0.1,
            this.config.pumpBodyWidth / 2 + 0.1,
            0.15,
            16
        );
        const topCover = new THREE.Mesh(topCoverGeometry, this.materials.flange);
        topCover.position.y = this.config.baseHeight + this.config.pumpBodyHeight + 0.075;
        pumpGroup.add(topCover);
        
        // 泵体底盖
        const bottomCoverGeometry = new THREE.CylinderGeometry(
            this.config.pumpBodyWidth / 2 + 0.1,
            this.config.pumpBodyWidth / 2 + 0.1,
            0.15,
            16
        );
        const bottomCover = new THREE.Mesh(bottomCoverGeometry, this.materials.flange);
        bottomCover.position.y = this.config.baseHeight - 0.075;
        pumpGroup.add(bottomCover);
        
        // 叶轮室（可见部分）
        const impellerGeometry = new THREE.CylinderGeometry(
            this.config.pumpBodyWidth / 3,
            this.config.pumpBodyWidth / 3,
            0.3,
            12
        );
        const impeller = new THREE.Mesh(impellerGeometry, this.materials.motor);
        impeller.position.y = this.config.baseHeight + this.config.pumpBodyHeight / 2;
        pumpGroup.add(impeller);
        
        this.components.pumpBody = pumpGroup;
        this.group.add(pumpGroup);
    }
    
    /**
     * 创建电机
     */
    createMotor() {
        const motorGroup = new THREE.Group();
        motorGroup.name = '电机';
        
        // 电机主体
        const motorGeometry = new THREE.BoxGeometry(
            this.config.motorWidth,
            this.config.motorHeight,
            this.config.motorLength
        );
        const motor = new THREE.Mesh(motorGeometry, this.materials.motor);
        motor.position.set(
            this.config.pumpBodyWidth / 2 + this.config.motorWidth / 2 + 0.2,
            this.config.baseHeight + this.config.pumpBodyHeight / 2,
            0
        );
        motor.castShadow = true;
        motorGroup.add(motor);
        
        // 电机端盖
        for (let i = 0; i < 2; i++) {
            const endCapGeometry = new THREE.CylinderGeometry(
                this.config.motorHeight / 2,
                this.config.motorHeight / 2,
                0.1,
                16
            );
            const endCap = new THREE.Mesh(endCapGeometry, this.materials.flange);
            endCap.position.set(
                this.config.pumpBodyWidth / 2 + this.config.motorWidth / 2 + 0.2,
                this.config.baseHeight + this.config.pumpBodyHeight / 2,
                (i - 0.5) * this.config.motorLength
            );
            endCap.rotation.x = Math.PI / 2;
            motorGroup.add(endCap);
        }
        
        // 电机接线盒
        const junctionBoxGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.4);
        const junctionBox = new THREE.Mesh(junctionBoxGeometry, this.materials.accent);
        junctionBox.position.set(
            this.config.pumpBodyWidth / 2 + this.config.motorWidth / 2 + 0.2,
            this.config.baseHeight + this.config.pumpBodyHeight / 2 + this.config.motorHeight / 2 + 0.1,
            0
        );
        motorGroup.add(junctionBox);
        
        // 联轴器
        const couplingGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.2, 12);
        const coupling = new THREE.Mesh(couplingGeometry, this.materials.flange);
        coupling.position.set(
            this.config.pumpBodyWidth / 2 + 0.1,
            this.config.baseHeight + this.config.pumpBodyHeight / 2,
            0
        );
        coupling.rotation.z = Math.PI / 2;
        motorGroup.add(coupling);
        
        this.components.motor = motorGroup;
        this.group.add(motorGroup);
    }
    
    /**
     * 创建进浆管道
     */
    createInletPipe() {
        const inletGroup = new THREE.Group();
        inletGroup.name = '进浆管道';
        
        // 进浆管主体 - 从侧面进入
        const inletGeometry = new THREE.CylinderGeometry(
            this.config.inletDiameter / 2,
            this.config.inletDiameter / 2,
            this.config.pipeLength,
            16
        );
        const inlet = new THREE.Mesh(inletGeometry, this.materials.pipe);
        inlet.position.set(
            -this.config.pumpBodyWidth / 2 - this.config.pipeLength / 2,
            this.config.baseHeight + this.config.pumpBodyHeight / 2,
            0
        );
        inlet.rotation.z = Math.PI / 2;
        inlet.castShadow = true;
        inletGroup.add(inlet);
        
        // 进浆法兰
        const inletFlangeGeometry = new THREE.CylinderGeometry(
            this.config.inletDiameter / 2 + 0.1,
            this.config.inletDiameter / 2 + 0.1,
            0.1,
            16
        );
        const inletFlange = new THREE.Mesh(inletFlangeGeometry, this.materials.flange);
        inletFlange.position.set(
            -this.config.pumpBodyWidth / 2 - this.config.pipeLength,
            this.config.baseHeight + this.config.pumpBodyHeight / 2,
            0
        );
        inletFlange.rotation.z = Math.PI / 2;
        inletGroup.add(inletFlange);
        
        // 进浆管弯头
        const elbowGeometry = new THREE.TorusGeometry(0.3, this.config.inletDiameter / 2, 8, 16, Math.PI / 2);
        const elbow = new THREE.Mesh(elbowGeometry, this.materials.pipe);
        elbow.position.set(
            -this.config.pumpBodyWidth / 2 - 0.3,
            this.config.baseHeight + this.config.pumpBodyHeight / 2 + 0.3,
            0
        );
        elbow.rotation.y = Math.PI;
        inletGroup.add(elbow);
        
        this.components.inlet = inletGroup;
        this.group.add(inletGroup);
    }
    
    /**
     * 创建出浆管道
     */
    createOutletPipe() {
        const outletGroup = new THREE.Group();
        outletGroup.name = '出浆管道';
        
        // 出浆管主体 - 从顶部出去
        const outletGeometry = new THREE.CylinderGeometry(
            this.config.outletDiameter / 2,
            this.config.outletDiameter / 2,
            this.config.pipeLength,
            16
        );
        const outlet = new THREE.Mesh(outletGeometry, this.materials.pipe);
        outlet.position.set(
            0,
            this.config.baseHeight + this.config.pumpBodyHeight + this.config.pipeLength / 2,
            0
        );
        outlet.castShadow = true;
        outletGroup.add(outlet);
        
        // 出浆法兰
        const outletFlangeGeometry = new THREE.CylinderGeometry(
            this.config.outletDiameter / 2 + 0.1,
            this.config.outletDiameter / 2 + 0.1,
            0.1,
            16
        );
        const outletFlange = new THREE.Mesh(outletFlangeGeometry, this.materials.flange);
        outletFlange.position.set(
            0,
            this.config.baseHeight + this.config.pumpBodyHeight + this.config.pipeLength,
            0
        );
        outletGroup.add(outletFlange);
        
        // 出浆管弯头
        const elbowGeometry = new THREE.TorusGeometry(0.25, this.config.outletDiameter / 2, 8, 16, Math.PI / 2);
        const elbow = new THREE.Mesh(elbowGeometry, this.materials.pipe);
        elbow.position.set(
            0.25,
            this.config.baseHeight + this.config.pumpBodyHeight + this.config.pipeLength + 0.25,
            0
        );
        elbow.rotation.z = -Math.PI / 2;
        outletGroup.add(elbow);
        
        this.components.outlet = outletGroup;
        this.group.add(outletGroup);
    }
    
    /**
     * 创建支撑结构
     */
    createSupportStructure() {
        const supportGroup = new THREE.Group();
        supportGroup.name = '支撑结构';
        
        // 泵体支撑腿
        for (let i = 0; i < 3; i++) {
            const legGeometry = new THREE.BoxGeometry(0.1, this.config.pumpBodyHeight * 0.8, 0.1);
            const leg = new THREE.Mesh(legGeometry, this.materials.flange);
            const angle = (i / 3) * Math.PI * 2;
            leg.position.set(
                Math.cos(angle) * (this.config.pumpBodyWidth / 2 - 0.2),
                this.config.baseHeight + this.config.pumpBodyHeight * 0.4,
                Math.sin(angle) * (this.config.pumpBodyWidth / 2 - 0.2)
            );
            leg.castShadow = true;
            supportGroup.add(leg);
        }
        
        // 电机支撑架
        const motorSupportGeometry = new THREE.BoxGeometry(
            this.config.motorWidth + 0.2,
            0.1,
            this.config.motorLength + 0.2
        );
        const motorSupport = new THREE.Mesh(motorSupportGeometry, this.materials.flange);
        motorSupport.position.set(
            this.config.pumpBodyWidth / 2 + this.config.motorWidth / 2 + 0.2,
            this.config.baseHeight + this.config.pumpBodyHeight / 2 - this.config.motorHeight / 2 - 0.05,
            0
        );
        supportGroup.add(motorSupport);
        
        this.components.support = supportGroup;
        this.group.add(supportGroup);
    }
    
    /**
     * 创建装饰细节
     */
    createDetails() {
        const detailGroup = new THREE.Group();
        detailGroup.name = '装饰细节';
        
        // 铭牌
        const nameplateGeometry = new THREE.BoxGeometry(0.4, 0.2, 0.02);
        const nameplate = new THREE.Mesh(nameplateGeometry, this.materials.accent);
        nameplate.position.set(
            0,
            this.config.baseHeight + this.config.pumpBodyHeight * 0.8,
            this.config.pumpBodyWidth / 2 + 0.01
        );
        detailGroup.add(nameplate);
        
        // 压力表
        const gaugeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.05, 16);
        const gauge = new THREE.Mesh(gaugeGeometry, this.materials.flange);
        gauge.position.set(
            0,
            this.config.baseHeight + this.config.pumpBodyHeight + 0.5,
            this.config.pumpBodyWidth / 2
        );
        gauge.rotation.x = Math.PI / 2;
        detailGroup.add(gauge);
        
        // 排气阀
        const ventGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.1, 8);
        const vent = new THREE.Mesh(ventGeometry, this.materials.pipe);
        vent.position.set(
            0.3,
            this.config.baseHeight + this.config.pumpBodyHeight + 0.3,
            0
        );
        detailGroup.add(vent);
        
        this.components.details = detailGroup;
        this.group.add(detailGroup);
    }
    
    /**
     * 创建增强工业细节
     */
    createEnhancedDetails() {
        const enhancedGroup = new THREE.Group();
        enhancedGroup.name = '增强工业细节';
        
        // 泵体加强筋
        for (let i = 0; i < 8; i++) {
            const ribGeometry = new THREE.BoxGeometry(0.06, this.config.pumpBodyHeight * 0.8, 0.08);
            const rib = new THREE.Mesh(ribGeometry, this.materials.flange);
            const angle = (i / 8) * Math.PI * 2;
            rib.position.set(
                Math.cos(angle) * (this.config.pumpBodyWidth / 2 - 0.05),
                this.config.baseHeight + this.config.pumpBodyHeight / 2,
                Math.sin(angle) * (this.config.pumpBodyWidth / 2 - 0.05)
            );
            rib.castShadow = true;
            enhancedGroup.add(rib);
        }
        
        // 电机散热翅片
        for (let i = 0; i < 12; i++) {
            const finGeometry = new THREE.BoxGeometry(this.config.motorWidth + 0.1, 0.02, 0.1);
            const fin = new THREE.Mesh(finGeometry, this.materials.motor);
            fin.position.set(
                this.config.pumpBodyWidth / 2 + this.config.motorWidth / 2 + 0.2,
                this.config.baseHeight + this.config.pumpBodyHeight / 2 - this.config.motorHeight / 2 + (i * 0.08),
                0
            );
            enhancedGroup.add(fin);
        }
        
        // 减震器
        for (let i = 0; i < 4; i++) {
            const shockGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 8);
            const shock = new THREE.Mesh(shockGeometry, this.materials.accent);
            const angle = (i / 4) * Math.PI * 2;
            shock.position.set(
                Math.cos(angle) * (this.config.baseWidth / 2 - 0.3),
                this.config.baseHeight + 0.075,
                Math.sin(angle) * (this.config.baseDepth / 2 - 0.3)
            );
            enhancedGroup.add(shock);
        }
        
        // 控制柜
        const controlBoxGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.4);
        const controlBox = new THREE.Mesh(controlBoxGeometry, this.materials.motor);
        controlBox.position.set(
            this.config.pumpBodyWidth / 2 + this.config.motorWidth + 0.8,
            this.config.baseHeight + 0.6,
            0
        );
        controlBox.castShadow = true;
        enhancedGroup.add(controlBox);
        
        // 控制柜门把手
        const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
        const handle = new THREE.Mesh(handleGeometry, this.materials.flange);
        handle.position.set(
            controlBox.position.x - 0.21,
            controlBox.position.y,
            controlBox.position.z + 0.1
        );
        handle.rotation.z = Math.PI / 2;
        enhancedGroup.add(handle);
        
        // 指示灯
        const lights = ['#FF0000', '#00FF00', '#FFFF00']; // 红绿黄指示灯
        lights.forEach((color, index) => {
            const lightGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 12);
            const lightMaterial = new THREE.MeshStandardMaterial({
                color: color,
                metalness: 0.1,
                roughness: 0.2,
                emissive: color,
                emissiveIntensity: 0.3
            });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.position.set(
                controlBox.position.x - 0.21,
                controlBox.position.y + 0.4 - index * 0.15,
                controlBox.position.z
            );
            enhancedGroup.add(light);
        });
        
        this.components.enhanced = enhancedGroup;
        this.group.add(enhancedGroup);
    }
    
    /**
     * 创建管道系统细节
     */
    createPipeSystemDetails() {
        const pipeSystemGroup = new THREE.Group();
        pipeSystemGroup.name = '管道系统细节';
        
        // 管道支架
        for (let i = 0; i < 3; i++) {
            const bracketGeometry = new THREE.BoxGeometry(0.1, 0.3, 0.1);
            const bracket = new THREE.Mesh(bracketGeometry, this.materials.flange);
            bracket.position.set(
                -this.config.pumpBodyWidth / 2 - this.config.pipeLength / 2,
                this.config.baseHeight + this.config.pumpBodyHeight / 2 - 0.2 + (i * 0.2),
                0.3
            );
            bracket.castShadow = true;
            pipeSystemGroup.add(bracket);
        }
        
        // 管道保温层
        const insulationGeometry = new THREE.CylinderGeometry(
            this.config.inletDiameter / 2 + 0.05,
            this.config.inletDiameter / 2 + 0.05,
            this.config.pipeLength * 0.6,
            16
        );
        const insulationMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0,
            metalness: 0.1,
            roughness: 0.8
        });
        const insulation = new THREE.Mesh(insulationGeometry, insulationMaterial);
        insulation.position.set(
            -this.config.pumpBodyWidth / 2 - this.config.pipeLength * 0.7,
            this.config.baseHeight + this.config.pumpBodyHeight / 2,
            0
        );
        insulation.rotation.z = Math.PI / 2;
        pipeSystemGroup.add(insulation);
        
        // 阀门
        const valveBodyGeometry = new THREE.CylinderGeometry(
            this.config.inletDiameter / 2 + 0.1,
            this.config.inletDiameter / 2 + 0.1,
            0.2,
            8
        );
        const valveBody = new THREE.Mesh(valveBodyGeometry, this.materials.flange);
        valveBody.position.set(
            -this.config.pumpBodyWidth / 2 - this.config.pipeLength * 0.3,
            this.config.baseHeight + this.config.pumpBodyHeight / 2,
            0
        );
        valveBody.rotation.z = Math.PI / 2;
        pipeSystemGroup.add(valveBody);
        
        // 阀门手轮
        const wheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
        const wheel = new THREE.Mesh(wheelGeometry, this.materials.accent);
        wheel.position.set(
            valveBody.position.x,
            valveBody.position.y + 0.2,
            valveBody.position.z
        );
        pipeSystemGroup.add(wheel);
        
        // 流量计
        const flowMeterGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.15);
        const flowMeter = new THREE.Mesh(flowMeterGeometry, this.materials.motor);
        flowMeter.position.set(
            0,
            this.config.baseHeight + this.config.pumpBodyHeight + this.config.pipeLength * 0.7,
            0.2
        );
        pipeSystemGroup.add(flowMeter);
        
        this.components.pipeSystem = pipeSystemGroup;
        this.group.add(pipeSystemGroup);
    }
    
    /**
     * 创建安全防护设施
     */
    createSafetyEquipment() {
        const safetyGroup = new THREE.Group();
        safetyGroup.name = '安全防护设施';
        
        // 联轴器防护罩
        const guardGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 12, 1, true);
        const guardMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFF00,
            metalness: 0.3,
            roughness: 0.7,
            transparent: true,
            opacity: 0.7
        });
        const guard = new THREE.Mesh(guardGeometry, guardMaterial);
        guard.position.set(
            this.config.pumpBodyWidth / 2 + 0.1,
            this.config.baseHeight + this.config.pumpBodyHeight / 2,
            0
        );
        guard.rotation.z = Math.PI / 2;
        safetyGroup.add(guard);
        
        // 安全警示标识
        const warningSignGeometry = new THREE.PlaneGeometry(0.2, 0.2);
        const warningSignMaterial = new THREE.MeshBasicMaterial({
            color: 0xFF0000,
            transparent: true,
            opacity: 0.9
        });
        const warningSign = new THREE.Mesh(warningSignGeometry, warningSignMaterial);
        warningSign.position.set(
            guard.position.x,
            guard.position.y + 0.2,
            guard.position.z
        );
        safetyGroup.add(warningSign);
        
        // 排水沟
        const drainGeometry = new THREE.BoxGeometry(
            this.config.baseWidth + 1.0,
            0.1,
            this.config.baseDepth + 1.0
        );
        const drainMaterial = new THREE.MeshStandardMaterial({
            color: 0x666666,
            metalness: 0.2,
            roughness: 0.8
        });
        const drain = new THREE.Mesh(drainGeometry, drainMaterial);
        drain.position.set(0, -0.05, 0);
        drain.receiveShadow = true;
        safetyGroup.add(drain);
        
        // 防溅护板
        const splashGuardGeometry = new THREE.BoxGeometry(0.05, 0.8, 1.2);
        const splashGuard = new THREE.Mesh(splashGuardGeometry, guardMaterial);
        splashGuard.position.set(
            -this.config.pumpBodyWidth / 2 - 0.5,
            this.config.baseHeight + 0.4,
            0
        );
        splashGuard.castShadow = true;
        safetyGroup.add(splashGuard);
        
        this.components.safety = safetyGroup;
        this.group.add(safetyGroup);
    }
    

    
    /**
     * 获取进浆口连接点位置（世界坐标）
     */
    getInletConnectionPoint() {
        const inletPoint = new THREE.Vector3(
            -this.config.pumpBodyWidth / 2 - this.config.pipeLength,
            this.config.baseHeight + this.config.pumpBodyHeight / 2,
            0
        );
        
        // 转换为世界坐标
        inletPoint.applyMatrix4(this.group.matrixWorld);
        return inletPoint;
    }
    
    /**
     * 获取出浆口连接点位置（世界坐标）
     */
    getOutletConnectionPoint() {
        const outletPoint = new THREE.Vector3(
            0,
            this.config.baseHeight + this.config.pumpBodyHeight + this.config.pipeLength,
            0
        );
        
        // 转换为世界坐标
        outletPoint.applyMatrix4(this.group.matrixWorld);
        return outletPoint;
    }
    
    /**
     * 创建设备标签
     */
    createLabel() {
        const labelGroup = new THREE.Group();
        labelGroup.name = 'slurryPumpLabel';
        
        const labelSprite = this.createLabelSprite(this.config.labelText, this.config.labelColor);
        labelSprite.position.set(0, this.config.baseHeight + this.config.pumpBodyHeight + 3, 0);
        labelGroup.add(labelSprite);
        
        this.components.label = labelGroup;
        this.group.add(labelGroup);
    }
    
    /**
     * 创建标签精灵 - 参考磁悬浮风机的设计
     */
    createLabelSprite(text, color = '#FFFFFF') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 100;
        
        // 设置字体和样式
        context.font = 'Bold 36px Microsoft YaHei, Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 绘制背景 - 圆角矩形
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.fill();
        
        // 绘制边框
        context.strokeStyle = color;
        context.lineWidth = 3;
        this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.stroke();
        
        // 绘制文字（支持多行）
        context.fillStyle = color;
        const lines = text.split('\n');
        if (lines.length === 1) {
            context.fillText(text, canvas.width / 2, canvas.height / 2);
        } else {
            const lineHeight = 30;
            const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
            lines.forEach((line, index) => {
                context.fillText(line, canvas.width / 2, startY + index * lineHeight);
            });
        }
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // 创建材质
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95,
            alphaTest: 0.01
        });
        
        // 创建精灵
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(12, 4, 1);
        sprite.name = `label_${text.replace('\n', '_')}`;
        
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
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.config.name,
            type: '供浆泵',
            position: this.config.position,
            dimensions: {
                width: this.config.pumpBodyWidth,
                height: this.config.pumpBodyHeight,
                depth: this.config.pumpBodyDepth
            },
            specifications: {
                inletDiameter: this.config.inletDiameter + 'm',
                outletDiameter: this.config.outletDiameter + 'm',
                pumpType: '离心泵',
                material: '铸铁泵体',
                sealType: '机械密封',
                driveType: '电机直联'
            },
            components: [
                '泵体',
                '电机',
                '进浆管道',
                '出浆管道',
                '支撑结构',
                '基础底座'
            ]
        };
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
}