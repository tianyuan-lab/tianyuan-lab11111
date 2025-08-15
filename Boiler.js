/**
 * 锅炉模型类
 * 基于提供的3D参考图片1:1还原设计
 * 支持独立的内部视角切换（不显示烟道内部）
 */
class Boiler {
    constructor(options = {}) {
        this.name = options.name || '锅炉';
        this.position = options.position || { x: 0, y: 0, z: 0 };
        this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
        this.scale = options.scale || 1.0;
        
        // 锅炉尺寸参数（基于参考图片比例推算）
        this.dimensions = {
            width: 16,      // 主体宽度
            height: 20,     // 主体高度
            depth: 12,      // 主体深度
            supportHeight: 8 // 支撑结构高度
        };
        
        this.isInteriorView = false;
        this.group = new THREE.Group();
        this.exteriorGroup = new THREE.Group();
        this.interiorGroup = new THREE.Group();
        
        this.materials = this.createMaterials();
        this.createBoilerStructure();
        this.setupPositioning();
        
        // 初始只显示外部结构
        this.group.add(this.exteriorGroup);
        
        console.log(`${this.name} 创建完成`);
    }
    
    /**
     * 创建材质
     */
    createMaterials() {
        return {
            // 主体外壳材质 - 工业灰色金属
            mainBody: new THREE.MeshPhongMaterial({
                color: 0x8C8C8C,
                shininess: 30,
                transparent: false
            }),
            
            // 保温层材质 - 浅灰色
            insulation: new THREE.MeshPhongMaterial({
                color: 0xB8B8B8,
                shininess: 10
            }),
            
            // 钢结构支撑材质 - 深灰金属
            steelSupport: new THREE.MeshPhongMaterial({
                color: 0x4A4A4A,
                shininess: 60
            }),
            
            // 观察窗材质 - 半透明
            viewWindow: new THREE.MeshPhongMaterial({
                color: 0x87CEEB,
                transparent: true,
                opacity: 0.6,
                shininess: 100
            }),
            
            // 管道材质 - 银色金属
            pipe: new THREE.MeshPhongMaterial({
                color: 0xC0C0C0,
                shininess: 80
            }),
            
            // 平台材质 - 格栅板
            platform: new THREE.MeshPhongMaterial({
                color: 0x696969,
                shininess: 20
            }),
            
            // 内部火焰材质 - 橙红色发光
            interior: new THREE.MeshPhongMaterial({
                color: 0xFF4500,
                emissive: 0x331100,
                shininess: 0
            })
        };
    }
    
    /**
     * 创建锅炉主体结构
     */
    createBoilerStructure() {
        this.createMainBody();
        this.createSupportStructure();
        this.createPlatformsAndStairs();
        this.createPipingSystem();
        this.createAccessories();
        this.createInteriorStructure();
    }
    
    /**
     * 创建主体结构
     */
    createMainBody() {
        const { width, height, depth } = this.dimensions;
        
        // 主锅炉体 - 圆柱形设计
        const mainBodyGeometry = new THREE.CylinderGeometry(
            width / 2, width / 2, height, 32
        );
        const mainBodyMesh = new THREE.Mesh(mainBodyGeometry, this.materials.mainBody);
        mainBodyMesh.position.set(0, height / 2 + this.dimensions.supportHeight, 0);
        mainBodyMesh.name = 'boilerMainBody';
        this.exteriorGroup.add(mainBodyMesh);
        
        // 保温层外壳
        const insulationGeometry = new THREE.CylinderGeometry(
            width / 2 + 0.3, width / 2 + 0.3, height + 0.6, 32
        );
        const insulationMesh = new THREE.Mesh(insulationGeometry, this.materials.insulation);
        insulationMesh.position.copy(mainBodyMesh.position);
        insulationMesh.name = 'insulationLayer';
        this.exteriorGroup.add(insulationMesh);
        
        // 顶部封头
        const topCapGeometry = new THREE.SphereGeometry(width / 2 + 0.3, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2);
        const topCapMesh = new THREE.Mesh(topCapGeometry, this.materials.mainBody);
        topCapMesh.position.set(0, height + this.dimensions.supportHeight + 0.3, 0);
        topCapMesh.name = 'topCap';
        this.exteriorGroup.add(topCapMesh);
        
        // 底部封头
        const bottomCapGeometry = new THREE.SphereGeometry(width / 2 + 0.3, 16, 8, 0, Math.PI * 2, Math.PI / 2, Math.PI / 2);
        const bottomCapMesh = new THREE.Mesh(bottomCapGeometry, this.materials.mainBody);
        bottomCapMesh.position.set(0, this.dimensions.supportHeight - 0.3, 0);
        bottomCapMesh.name = 'bottomCap';
        this.exteriorGroup.add(bottomCapMesh);
    }
    
    /**
     * 创建支撑结构
     */
    createSupportStructure() {
        const supportHeight = this.dimensions.supportHeight;
        const width = this.dimensions.width;
        
        // 主要支撑柱 - 8根柱子环形分布
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const x = Math.cos(angle) * (width / 2 + 1);
            const z = Math.sin(angle) * (width / 2 + 1);
            
            const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, supportHeight, 8);
            const columnMesh = new THREE.Mesh(columnGeometry, this.materials.steelSupport);
            columnMesh.position.set(x, supportHeight / 2, z);
            columnMesh.name = `supportColumn_${i}`;
            this.exteriorGroup.add(columnMesh);
            
            // 支撑梁连接
            if (i < 7) {
                const nextAngle = ((i + 1) / 8) * Math.PI * 2;
                const nextX = Math.cos(nextAngle) * (width / 2 + 1);
                const nextZ = Math.sin(nextAngle) * (width / 2 + 1);
                
                const beamLength = Math.sqrt(Math.pow(nextX - x, 2) + Math.pow(nextZ - z, 2));
                const beamGeometry = new THREE.CylinderGeometry(0.15, 0.15, beamLength, 6);
                const beamMesh = new THREE.Mesh(beamGeometry, this.materials.steelSupport);
                
                beamMesh.position.set((x + nextX) / 2, supportHeight - 1, (z + nextZ) / 2);
                beamMesh.lookAt(new THREE.Vector3(nextX, supportHeight - 1, nextZ));
                beamMesh.rotateX(Math.PI / 2);
                beamMesh.name = `supportBeam_${i}`;
                this.exteriorGroup.add(beamMesh);
            }
        }
        
        // 基础平台
        const basePlatformGeometry = new THREE.CylinderGeometry(width / 2 + 2, width / 2 + 2, 0.5, 32);
        const basePlatformMesh = new THREE.Mesh(basePlatformGeometry, this.materials.platform);
        basePlatformMesh.position.set(0, 0.25, 0);
        basePlatformMesh.name = 'basePlatform';
        this.exteriorGroup.add(basePlatformMesh);
    }
    
    /**
     * 创建平台和楼梯
     */
    createPlatformsAndStairs() {
        const height = this.dimensions.height;
        const width = this.dimensions.width;
        const supportHeight = this.dimensions.supportHeight;
        
        // 操作平台 - 多层
        const platformLevels = [
            supportHeight + height * 0.3,
            supportHeight + height * 0.6,
            supportHeight + height * 0.9
        ];
        
        platformLevels.forEach((level, index) => {
            // 环形平台
            const platformGeometry = new THREE.RingGeometry(width / 2 + 0.5, width / 2 + 2.5, 32);
            const platformMesh = new THREE.Mesh(platformGeometry, this.materials.platform);
            platformMesh.position.set(0, level, 0);
            platformMesh.rotateX(-Math.PI / 2);
            platformMesh.name = `operatingPlatform_${index}`;
            this.exteriorGroup.add(platformMesh);
            
            // 平台护栏
            const railingGeometry = new THREE.TorusGeometry(width / 2 + 2.5, 0.05, 4, 32);
            const railingMesh = new THREE.Mesh(railingGeometry, this.materials.steelSupport);
            railingMesh.position.set(0, level + 1, 0);
            railingMesh.name = `platformRailing_${index}`;
            this.exteriorGroup.add(railingMesh);
        });
        
        // 螺旋楼梯
        this.createSpiralStaircase(width / 2 + 3, supportHeight, height + supportHeight);
    }
    
    /**
     * 创建螺旋楼梯
     */
    createSpiralStaircase(radius, startHeight, endHeight) {
        const steps = 48;  // 楼梯台阶数
        const totalHeight = endHeight - startHeight;
        
        for (let i = 0; i < steps; i++) {
            const angle = (i / steps) * Math.PI * 4; // 两圈螺旋
            const stepHeight = startHeight + (i / steps) * totalHeight;
            
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            // 楼梯踏板
            const stepGeometry = new THREE.BoxGeometry(1.2, 0.1, 0.4);
            const stepMesh = new THREE.Mesh(stepGeometry, this.materials.platform);
            stepMesh.position.set(x, stepHeight, z);
            stepMesh.lookAt(new THREE.Vector3(0, stepHeight, 0));
            stepMesh.name = `spiralStep_${i}`;
            this.exteriorGroup.add(stepMesh);
            
            // 扶手支撑
            if (i % 4 === 0) {
                const handrailGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1, 6);
                const handrailMesh = new THREE.Mesh(handrailGeometry, this.materials.steelSupport);
                handrailMesh.position.set(x, stepHeight + 0.5, z);
                handrailMesh.name = `handrailSupport_${i}`;
                this.exteriorGroup.add(handrailMesh);
            }
        }
    }
    
    /**
     * 创建管道系统
     */
    createPipingSystem() {
        const height = this.dimensions.height;
        const width = this.dimensions.width;
        const supportHeight = this.dimensions.supportHeight;
        
        // 主蒸汽管道
        const mainSteamPipeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 8, 16);
        const mainSteamPipeMesh = new THREE.Mesh(mainSteamPipeGeometry, this.materials.pipe);
        mainSteamPipeMesh.position.set(width / 2 + 1, supportHeight + height * 0.8, 0);
        mainSteamPipeMesh.rotateZ(Math.PI / 2);
        mainSteamPipeMesh.name = 'mainSteamPipe';
        this.exteriorGroup.add(mainSteamPipeMesh);
        
        // 给水管道
        const feedWaterPipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 6, 16);
        const feedWaterPipeMesh = new THREE.Mesh(feedWaterPipeGeometry, this.materials.pipe);
        feedWaterPipeMesh.position.set(-width / 2 - 1, supportHeight + height * 0.6, 0);
        feedWaterPipeMesh.rotateZ(Math.PI / 2);
        feedWaterPipeMesh.name = 'feedWaterPipe';
        this.exteriorGroup.add(feedWaterPipeMesh);
        
        // 安全阀
        const safetyValveGeometry = new THREE.CylinderGeometry(0.2, 0.3, 1.5, 12);
        const safetyValveMesh = new THREE.Mesh(safetyValveGeometry, this.materials.steelSupport);
        safetyValveMesh.position.set(0, supportHeight + height + 1, 0);
        safetyValveMesh.name = 'safetyValve';
        this.exteriorGroup.add(safetyValveMesh);
        
        // 排污管道
        const blowdownPipeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 3, 12);
        const blowdownPipeMesh = new THREE.Mesh(blowdownPipeGeometry, this.materials.pipe);
        blowdownPipeMesh.position.set(0, supportHeight - 1, width / 2);
        blowdownPipeMesh.rotateX(Math.PI / 2);
        blowdownPipeMesh.name = 'blowdownPipe';
        this.exteriorGroup.add(blowdownPipeMesh);
    }
    
    /**
     * 创建附件设备
     */
    createAccessories() {
        const height = this.dimensions.height;
        const width = this.dimensions.width;
        const supportHeight = this.dimensions.supportHeight;
        
        // 观察窗
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const x = Math.cos(angle) * (width / 2 + 0.35);
            const z = Math.sin(angle) * (width / 2 + 0.35);
            
            const windowGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
            const windowMesh = new THREE.Mesh(windowGeometry, this.materials.viewWindow);
            windowMesh.position.set(x, supportHeight + height * 0.5, z);
            windowMesh.lookAt(new THREE.Vector3(0, supportHeight + height * 0.5, 0));
            windowMesh.rotateY(Math.PI / 2);
            windowMesh.name = `observationWindow_${i}`;
            this.exteriorGroup.add(windowMesh);
        }
        
        // 控制箱
        const controlBoxGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.4);
        const controlBoxMesh = new THREE.Mesh(controlBoxGeometry, this.materials.steelSupport);
        controlBoxMesh.position.set(width / 2 + 3, supportHeight + 1, 0);
        controlBoxMesh.name = 'controlBox';
        this.exteriorGroup.add(controlBoxMesh);
        
        // 仪表盘
        const instrumentGeometry = new THREE.CylinderGeometry(0.1, 0.1, 0.05, 16);
        for (let i = 0; i < 6; i++) {
            const instrumentMesh = new THREE.Mesh(instrumentGeometry, this.materials.steelSupport);
            instrumentMesh.position.set(
                width / 2 + 2.8,
                supportHeight + 1.2 + (i % 3) * 0.3,
                -0.3 + Math.floor(i / 3) * 0.6
            );
            instrumentMesh.rotateZ(Math.PI / 2);
            instrumentMesh.name = `instrument_${i}`;
            this.exteriorGroup.add(instrumentMesh);
        }
    }
    
    /**
     * 创建内部结构（仅在内部视图时显示）
     */
    createInteriorStructure() {
        const height = this.dimensions.height;
        const width = this.dimensions.width;
        const supportHeight = this.dimensions.supportHeight;
        
        // 内部燃烧室
        const combustionChamberGeometry = new THREE.CylinderGeometry(
            width / 2 - 1, width / 2 - 1, height - 4, 24
        );
        const combustionChamberMesh = new THREE.Mesh(combustionChamberGeometry, this.materials.interior);
        combustionChamberMesh.position.set(0, supportHeight + height / 2, 0);
        combustionChamberMesh.name = 'combustionChamber';
        this.interiorGroup.add(combustionChamberMesh);
        
        // 水管束
        for (let i = 0; i < 20; i++) {
            const angle = (i / 20) * Math.PI * 2;
            const radius = width / 2 - 2;
            const x = Math.cos(angle) * radius;
            const z = Math.sin(angle) * radius;
            
            const tubeGeometry = new THREE.CylinderGeometry(0.08, 0.08, height - 6, 12);
            const tubeMesh = new THREE.Mesh(tubeGeometry, this.materials.pipe);
            tubeMesh.position.set(x, supportHeight + height / 2, z);
            tubeMesh.name = `waterTube_${i}`;
            this.interiorGroup.add(tubeMesh);
        }
        
        // 炉膛内部照明效果
        const furnaceLight = new THREE.PointLight(0xFF4500, 2, width);
        furnaceLight.position.set(0, supportHeight + height / 2, 0);
        furnaceLight.name = 'furnaceLight';
        this.interiorGroup.add(furnaceLight);
        
        // 内部工作平台
        const interiorPlatformGeometry = new THREE.RingGeometry(1, width / 2 - 0.5, 24);
        const interiorPlatformMesh = new THREE.Mesh(interiorPlatformGeometry, this.materials.platform);
        interiorPlatformMesh.position.set(0, supportHeight + 2, 0);
        interiorPlatformMesh.rotateX(-Math.PI / 2);
        interiorPlatformMesh.name = 'interiorPlatform';
        this.interiorGroup.add(interiorPlatformMesh);
    }
    
    /**
     * 设置位置和旋转
     */
    setupPositioning() {
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.group.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        this.group.scale.setScalar(this.scale);
        this.group.name = this.name;
        
        // 设置userData用于点击检测
        this.group.userData = {
            type: 'boiler',
            name: this.name,
            clickable: true
        };
    }
    
    /**
     * 显示内部视图
     */
    showInterior() {
        console.log(`${this.name}: 切换到内部视图`);
        
        // 移除外部结构
        this.group.remove(this.exteriorGroup);
        
        // 添加内部结构
        this.group.add(this.interiorGroup);
        
        this.isInteriorView = true;
    }
    
    /**
     * 显示外部视图
     */
    showExterior() {
        console.log(`${this.name}: 切换到外部视图`);
        
        // 移除内部结构
        this.group.remove(this.interiorGroup);
        
        // 添加外部结构
        this.group.add(this.exteriorGroup);
        
        this.isInteriorView = false;
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
            type: 'Boiler',
            position: this.position,
            dimensions: this.dimensions,
            isInteriorView: this.isInteriorView,
            componentCount: this.exteriorGroup.children.length + this.interiorGroup.children.length
        };
    }
    
    /**
     * 销毁模型
     */
    dispose() {
        // 清理几何体和材质
        this.group.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }
            if (child.material) {
                if (Array.isArray(child.material)) {
                    child.material.forEach(material => material.dispose());
                } else {
                    child.material.dispose();
                }
            }
        });
        
        // 从父对象中移除
        if (this.group.parent) {
            this.group.parent.remove(this.group);
        }
        
        console.log(`${this.name} 已销毁`);
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = Boiler;
}