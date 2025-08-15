/**
 * 锅炉顶部烟道/集箱模型
 * 作为与锅炉独立的对象，支持单独进入内部视角
 */
class BoilerFlue {
    constructor(options = {}) {
        this.name = options.name || '锅炉烟道';
        this.position = options.position || { x: 0, y: 0, z: 0 };
        this.rotation = options.rotation || { x: 0, y: 0, z: 0 };
        this.scale = options.scale || 1.0;
        
        // 尺寸（与锅炉匹配）
        this.dimensions = {
            baseWidth: 16,
            baseHeight: 4.0,
            manifoldRadius: 2.2,
            stackDiameter: 2.0,
            stackHeight: 10.0,
            stackCount: 3
        };
        
        this.isInteriorView = false;
        this.group = new THREE.Group();
        this.exteriorGroup = new THREE.Group();
        this.interiorGroup = new THREE.Group();
        
        this.materials = this.createMaterials();
        this.createFlueStructure();
        this.setupPositioning();
        
        // 初始只显示外部
        this.group.add(this.exteriorGroup);
    }
    
    createMaterials() {
        return {
            ductMetal: new THREE.MeshPhongMaterial({ color: 0xB0B0B0, shininess: 60 }),
            stackMetal: new THREE.MeshPhongMaterial({ color: 0xD0D0D0, shininess: 80 }),
            interior: new THREE.MeshPhongMaterial({ color: 0x777777, side: THREE.DoubleSide })
        };
    }
    
    createFlueStructure() {
        const { baseWidth, manifoldRadius, stackDiameter, stackHeight, stackCount } = this.dimensions;
        
        // 顶部矩形到圆形过渡总管（类似参考图的“П”型）
        const manifold = new THREE.Group();
        manifold.name = 'manifoldGroup';
        
        const bridgeLen = baseWidth * 0.9;
        const bridgeGeom = new THREE.TorusGeometry(manifoldRadius, 0.4, 16, 32, Math.PI);
        const bridgeMesh = new THREE.Mesh(bridgeGeom, this.materials.ductMetal);
        bridgeMesh.rotation.set(Math.PI / 2, 0, 0);
        bridgeMesh.position.set(0, 0, 0);
        bridgeMesh.name = 'manifoldBridge';
        manifold.add(bridgeMesh);
        
        // 垂直两侧落地段（圆管）
        const legGeom = new THREE.CylinderGeometry(0.4, 0.4, 4.0, 16);
        const leftLeg = new THREE.Mesh(legGeom, this.materials.ductMetal);
        leftLeg.position.set(-bridgeLen / 2, -2.0, 0);
        leftLeg.name = 'leftLeg';
        manifold.add(leftLeg);
        const rightLeg = new THREE.Mesh(legGeom, this.materials.ductMetal);
        rightLeg.position.set(bridgeLen / 2, -2.0, 0);
        rightLeg.name = 'rightLeg';
        manifold.add(rightLeg);
        
        this.exteriorGroup.add(manifold);
        
        // 三根竖直烟囱（与参考图一致）
        const stackGeom = new THREE.CylinderGeometry(stackDiameter / 2, stackDiameter / 2, stackHeight, 24);
        const stackOffsets = [-baseWidth * 0.2, 0, baseWidth * 0.2];
        stackOffsets.forEach((x, i) => {
            const stack = new THREE.Mesh(stackGeom, this.materials.stackMetal);
            stack.position.set(x, stackHeight / 2 + 1.5, 0);
            stack.name = `stack_${i}`;
            this.exteriorGroup.add(stack);
        });
        
        // 内部视图：中空壳体展示
        const interiorShellGeom = new THREE.CylinderGeometry(stackDiameter / 2 - 0.1, stackDiameter / 2 - 0.1, stackHeight - 1, 24, 1, true);
        const shell = new THREE.Mesh(interiorShellGeom, this.materials.interior);
        shell.position.set(0, stackHeight / 2 + 1.5, 0);
        shell.name = 'stackInteriorShell';
        this.interiorGroup.add(shell);
    }
    
    setupPositioning() {
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.group.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        this.group.scale.setScalar(this.scale);
        this.group.name = this.name;
        this.group.userData = { type: 'boilerFlue', name: this.name, clickable: true };
    }
    
    showInterior() {
        this.group.remove(this.exteriorGroup);
        this.group.add(this.interiorGroup);
        this.isInteriorView = true;
    }
    
    showExterior() {
        this.group.remove(this.interiorGroup);
        this.group.add(this.exteriorGroup);
        this.isInteriorView = false;
    }
    
    getGroup() { return this.group; }
}

if (typeof module !== 'undefined' && module.exports) {
    module.exports = BoilerFlue;
}