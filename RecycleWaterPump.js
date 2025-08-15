/**
 * 回收水泵模型
 * 1:1复刻工业离心泵设计
 */

class RecycleWaterPump {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.components = new Map();
        
        // 水泵配置参数
        this.pumpConfig = {
            name: config.name || '回收水泵',
            position: config.position || { x: 0, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            scale: config.scale || 1,
            ...config
        };
        
        // 材质定义 - 工业水泵材质
        this.materials = {
            // 泵体外壳 - 铸铁材质
            pumpBody: new THREE.MeshStandardMaterial({
                color: 0xE8E8E8,
                metalness: 0.6,
                roughness: 0.4,
                envMapIntensity: 0.8
            }),
            // 法兰材质 - 钢制法兰
            flange: new THREE.MeshStandardMaterial({
                color: 0xB0B0B0,
                metalness: 0.8,
                roughness: 0.3,
                envMapIntensity: 1.0
            }),
            // 底座材质 - 铸铁底座
            base: new THREE.MeshStandardMaterial({
                color: 0x808080,
                metalness: 0.7,
                roughness: 0.5,
                envMapIntensity: 0.6
            }),
            // 螺栓材质
            bolt: new THREE.MeshStandardMaterial({
                color: 0x4A4A4A,
                metalness: 0.9,
                roughness: 0.2,
                envMapIntensity: 1.2
            }),
            // 管道接口
            pipe: new THREE.MeshStandardMaterial({
                color: 0x95A5B8,
                metalness: 0.85,
                roughness: 0.2,
                envMapIntensity: 0.8
            })
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log(`创建${this.pumpConfig.name}...`);
        
        // 创建主体泵壳
        this.createPumpCasing();
        
        // 创建进水法兰
        this.createInletFlange();
        
        // 创建出水法兰
        this.createOutletFlange();
        
        // 创建底座支撑
        this.createPumpBase();
        
        // 创建螺栓连接
        this.createBolts();
        
        // 创建管道接口
        this.createPipeConnections();
        
        // 设置位置和旋转
        this.group.position.set(
            this.pumpConfig.position.x,
            this.pumpConfig.position.y,
            this.pumpConfig.position.z
        );
        
        this.group.rotation.set(
            this.pumpConfig.rotation.x,
            this.pumpConfig.rotation.y,
            this.pumpConfig.rotation.z
        );
        
        this.group.scale.setScalar(this.pumpConfig.scale);
        
        console.log(`✓ ${this.pumpConfig.name}创建完成`);
    }
    
    /**
     * 创建主体泵壳
     */
    createPumpCasing() {
        const casingGroup = new THREE.Group();
        casingGroup.name = 'pumpCasing';
        
        // 主泵体 - 蜗壳设计，更接近图片中的形状
        const mainBodyGeometry = new THREE.CylinderGeometry(1.0, 1.2, 0.8, 32);
        const mainBodyMesh = new THREE.Mesh(mainBodyGeometry, this.materials.pumpBody);
        mainBodyMesh.position.y = 0.8;
        mainBodyMesh.castShadow = true;
        mainBodyMesh.receiveShadow = true;
        casingGroup.add(mainBodyMesh);
        
        // 蜗壳扩展部分 - 模拟离心泵特有的蜗壳形状
        const volute1Geometry = new THREE.CylinderGeometry(1.3, 1.0, 0.3, 32);
        const volute1Mesh = new THREE.Mesh(volute1Geometry, this.materials.pumpBody);
        volute1Mesh.position.y = 1.05;
        volute1Mesh.castShadow = true;
        casingGroup.add(volute1Mesh);
        
        const volute2Geometry = new THREE.CylinderGeometry(1.0, 1.3, 0.3, 32);
        const volute2Mesh = new THREE.Mesh(volute2Geometry, this.materials.pumpBody);
        volute2Mesh.position.y = 0.55;
        volute2Mesh.castShadow = true;
        casingGroup.add(volute2Mesh);
        
        // 电机外壳 - 水平圆柱形
        const motorHousingGeometry = new THREE.CylinderGeometry(0.6, 0.6, 2.2, 32);
        const motorHousingMesh = new THREE.Mesh(motorHousingGeometry, this.materials.pumpBody);
        motorHousingMesh.position.set(0, 0.8, -1.5);
        motorHousingMesh.rotation.x = Math.PI / 2;
        motorHousingMesh.castShadow = true;
        casingGroup.add(motorHousingMesh);
        
        // 电机端盖
        const endCapGeometry = new THREE.CylinderGeometry(0.65, 0.65, 0.15, 32);
        const endCapMesh = new THREE.Mesh(endCapGeometry, this.materials.flange);
        endCapMesh.position.set(0, 0.8, -2.6);
        endCapMesh.rotation.x = Math.PI / 2;
        endCapMesh.castShadow = true;
        casingGroup.add(endCapMesh);
        
        // 泵体冷却翅片
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const finGeometry = new THREE.BoxGeometry(0.05, 0.6, 0.08);
            const finMesh = new THREE.Mesh(finGeometry, this.materials.pumpBody);
            finMesh.position.set(
                Math.cos(angle) * 0.68,
                0.8,
                -1.5 + Math.sin(angle) * 0.68
            );
            finMesh.castShadow = true;
            casingGroup.add(finMesh);
        }
        
        this.components.set('pumpCasing', casingGroup);
        this.group.add(casingGroup);
    }
    
    /**
     * 创建进水法兰
     */
    createInletFlange() {
        const inletGroup = new THREE.Group();
        inletGroup.name = 'inletFlange';
        
        // 主法兰盘 - 更大更厚重
        const flangeGeometry = new THREE.CylinderGeometry(0.9, 0.9, 0.2, 32);
        const flangeMesh = new THREE.Mesh(flangeGeometry, this.materials.flange);
        flangeMesh.position.set(0, 1.4, 0);
        flangeMesh.castShadow = true;
        inletGroup.add(flangeMesh);
        
        // 法兰内部连接管
        const innerPipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.25, 32);
        const innerPipeMesh = new THREE.Mesh(innerPipeGeometry, this.materials.pipe);
        innerPipeMesh.position.set(0, 1.275, 0);
        innerPipeMesh.castShadow = true;
        inletGroup.add(innerPipeMesh);
        
        // 法兰螺栓 - 更多螺栓更真实
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const boltGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.25, 8);
            const boltMesh = new THREE.Mesh(boltGeometry, this.materials.bolt);
            boltMesh.position.set(
                Math.cos(angle) * 0.75,
                1.4,
                Math.sin(angle) * 0.75
            );
            inletGroup.add(boltMesh);
            
            // 螺栓头
            const nutGeometry = new THREE.BoxGeometry(0.08, 0.08, 0.06);
            const nutMesh = new THREE.Mesh(nutGeometry, this.materials.bolt);
            nutMesh.position.set(
                Math.cos(angle) * 0.75,
                1.515,
                Math.sin(angle) * 0.75
            );
            nutMesh.rotation.y = angle + Math.PI / 6;
            inletGroup.add(nutMesh);
        }
        
        this.components.set('inletFlange', inletGroup);
        this.group.add(inletGroup);
    }
    
    /**
     * 创建出水法兰
     */
    createOutletFlange() {
        const outletGroup = new THREE.Group();
        outletGroup.name = 'outletFlange';
        
        // 出水法兰 - 水平方向
        const flangeGeometry = new THREE.CylinderGeometry(0.7, 0.7, 0.12, 32);
        const flangeMesh = new THREE.Mesh(flangeGeometry, this.materials.flange);
        flangeMesh.position.set(1.5, 0.5, 0);
        flangeMesh.rotation.z = Math.PI / 2;
        flangeMesh.castShadow = true;
        outletGroup.add(flangeMesh);
        
        // 出水管道
        const pipeGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.4, 32);
        const pipeMesh = new THREE.Mesh(pipeGeometry, this.materials.pipe);
        pipeMesh.position.set(1.2, 0.5, 0);
        pipeMesh.rotation.z = Math.PI / 2;
        pipeMesh.castShadow = true;
        outletGroup.add(pipeMesh);
        
        // 出水法兰螺栓
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const boltGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.15, 8);
            const boltMesh = new THREE.Mesh(boltGeometry, this.materials.bolt);
            boltMesh.position.set(
                1.5,
                0.5 + Math.cos(angle) * 0.6,
                Math.sin(angle) * 0.6
            );
            boltMesh.rotation.z = Math.PI / 2;
            outletGroup.add(boltMesh);
        }
        
        this.components.set('outletFlange', outletGroup);
        this.group.add(outletGroup);
    }
    
    /**
     * 创建泵底座
     */
    createPumpBase() {
        const baseGroup = new THREE.Group();
        baseGroup.name = 'pumpBase';
        
        // 主底座板
        const baseGeometry = new THREE.BoxGeometry(3, 0.2, 1.5);
        const baseMesh = new THREE.Mesh(baseGeometry, this.materials.base);
        baseMesh.position.set(0, 0.1, 0);
        baseMesh.castShadow = true;
        baseMesh.receiveShadow = true;
        baseGroup.add(baseMesh);
        
        // 底座加强筋
        for (let i = 0; i < 3; i++) {
            const ribGeometry = new THREE.BoxGeometry(2.8, 0.15, 0.1);
            const ribMesh = new THREE.Mesh(ribGeometry, this.materials.base);
            ribMesh.position.set(0, 0.175, -0.6 + i * 0.6);
            ribMesh.castShadow = true;
            baseGroup.add(ribMesh);
        }
        
        // 底座支撑脚
        for (let i = 0; i < 4; i++) {
            const x = (i % 2) * 2.6 - 1.3;
            const z = Math.floor(i / 2) * 1.2 - 0.6;
            
            const footGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.3, 8);
            const footMesh = new THREE.Mesh(footGeometry, this.materials.base);
            footMesh.position.set(x, -0.05, z);
            footMesh.castShadow = true;
            baseGroup.add(footMesh);
        }
        
        this.components.set('pumpBase', baseGroup);
        this.group.add(baseGroup);
    }
    
    /**
     * 创建螺栓连接
     */
    createBolts() {
        const boltGroup = new THREE.Group();
        boltGroup.name = 'bolts';
        
        // 泵体固定螺栓
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const boltGeometry = new THREE.CylinderGeometry(0.06, 0.06, 0.6, 8);
            const boltMesh = new THREE.Mesh(boltGeometry, this.materials.bolt);
            boltMesh.position.set(
                Math.cos(angle) * 1.3,
                0.3,
                Math.sin(angle) * 1.3
            );
            boltMesh.castShadow = true;
            boltGroup.add(boltMesh);
            
            // 螺栓头
            const headGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.08, 6);
            const headMesh = new THREE.Mesh(headGeometry, this.materials.bolt);
            headMesh.position.set(
                Math.cos(angle) * 1.3,
                0.64,
                Math.sin(angle) * 1.3
            );
            boltGroup.add(headMesh);
        }
        
        this.components.set('bolts', boltGroup);
        this.group.add(boltGroup);
    }
    
    /**
     * 创建管道接口
     */
    createPipeConnections() {
        const connectionGroup = new THREE.Group();
        connectionGroup.name = 'pipeConnections';
        
        // 进水管道连接
        const inletPipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.0, 16);
        const inletPipeMesh = new THREE.Mesh(inletPipeGeometry, this.materials.pipe);
        inletPipeMesh.position.set(0, 2.5, 0);
        inletPipeMesh.castShadow = true;
        connectionGroup.add(inletPipeMesh);
        
        // 出水管道连接
        const outletPipeGeometry = new THREE.CylinderGeometry(0.35, 0.35, 1.2, 16);
        const outletPipeMesh = new THREE.Mesh(outletPipeGeometry, this.materials.pipe);
        outletPipeMesh.position.set(2.1, 0.5, 0);
        outletPipeMesh.rotation.z = Math.PI / 2;
        outletPipeMesh.castShadow = true;
        connectionGroup.add(outletPipeMesh);
        
        // 管道弯头
        const elbowGeometry = new THREE.TorusGeometry(0.3, 0.15, 8, 16, Math.PI / 2);
        const elbowMesh = new THREE.Mesh(elbowGeometry, this.materials.pipe);
        elbowMesh.position.set(2.7, 0.5, 0);
        elbowMesh.rotation.y = Math.PI / 2;
        elbowMesh.castShadow = true;
        connectionGroup.add(elbowMesh);
        
        this.components.set('pipeConnections', connectionGroup);
        this.group.add(connectionGroup);
    }
    
    /**
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.pumpConfig.name,
            type: '离心式回收水泵',
            components: Array.from(this.components.keys()),
            position: this.pumpConfig.position,
            boundingBox: this.getBoundingBox()
        };
    }
    
    /**
     * 获取边界框
     */
    getBoundingBox() {
        const box = new THREE.Box3().setFromObject(this.group);
        return {
            min: box.min,
            max: box.max,
            size: box.getSize(new THREE.Vector3())
        };
    }
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = RecycleWaterPump;
} else if (typeof window !== 'undefined') {
    window.RecycleWaterPump = RecycleWaterPump;
}