/**
 * 管道连接系统
 * 用于连接水泵和塔体，表示工艺流程
 */

class PipeConnection {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.components = new Map();
        
        // 管道配置参数
        this.pipeConfig = {
            name: config.name || '管道连接',
            startPoint: config.startPoint || { x: 0, y: 0, z: 0 },
            endPoint: config.endPoint || { x: 10, y: 10, z: 10 },
            pipeRadius: config.pipeRadius || 0.2,
            pipeColor: config.pipeColor || 0x708090,
            showFlow: config.showFlow || true,
            flowDirection: config.flowDirection || 'forward',
            // 路径策略：'default'（多控制点曲线）或 'straight'（直线）
            pathStrategy: config.pathStrategy || 'default',
            // 可选：自定义路径点（数组），若提供则优先使用
            customPathPoints: config.customPathPoints || null,
            ...config
        };
        
        // 材质定义
        this.materials = {
            // 主管道材质 - 不锈钢管道
            mainPipe: new THREE.MeshStandardMaterial({
                color: this.pipeConfig.pipeColor,
                metalness: 0.8,
                roughness: 0.3,
                envMapIntensity: 0.9
            }),
            // 法兰材质
            flange: new THREE.MeshStandardMaterial({
                color: 0xB0B0B0,
                metalness: 0.9,
                roughness: 0.2,
                envMapIntensity: 1.0
            }),
            // 支撑材质
            support: new THREE.MeshStandardMaterial({
                color: 0x4A5568,
                metalness: 0.7,
                roughness: 0.4,
                envMapIntensity: 0.6
            }),
            // 流动指示材质
            flowIndicator: new THREE.MeshStandardMaterial({
                color: 0x00FF00,
                metalness: 0.0,
                roughness: 0.8,
                envMapIntensity: 0.3
            }),
            // 阀门材质
            valve: new THREE.MeshStandardMaterial({
                color: 0xCD7F32,
                metalness: 0.9,
                roughness: 0.1,
                envMapIntensity: 1.5
            })
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log(`创建${this.pipeConfig.name}...`);
        
        // 计算管道路径
        this.calculatePipePath();
        
        // 创建主管道
        this.createMainPipe();
        
        // 管道支撑已移除，仅保留管道本体
        
        // 创建连接法兰
        this.createConnectionFlanges();
        
        // 创建阀门
        this.createValves();
        
        // 创建流动指示器
        if (this.pipeConfig.showFlow) {
            this.createFlowIndicators();
        }
        
        console.log(`✓ ${this.pipeConfig.name}创建完成`);
    }
    
    /**
     * 计算管道路径
     */
    calculatePipePath() {
        const start = this.pipeConfig.startPoint;
        const end = this.pipeConfig.endPoint;
        
        if (Array.isArray(this.pipeConfig.customPathPoints) && this.pipeConfig.customPathPoints.length >= 2) {
            // 使用外部提供的自定义路径点
            this.pathPoints = this.pipeConfig.customPathPoints.map(p => new THREE.Vector3(p.x, p.y, p.z));
            this.curve = new THREE.CatmullRomCurve3(this.pathPoints);
        } else if (this.pipeConfig.pathStrategy === 'straight') {
            // 直线连接，去除弯曲
            this.pathPoints = [
                new THREE.Vector3(start.x, start.y, start.z),
                new THREE.Vector3(end.x, end.y, end.z)
            ];
            this.curve = new THREE.CatmullRomCurve3(this.pathPoints);
        } else {
            // 默认：多控制点曲线，形成柔和弯管
            this.pathPoints = [
                new THREE.Vector3(start.x, start.y, start.z),
                new THREE.Vector3(start.x, start.y + 2, start.z), // 向上
                new THREE.Vector3(start.x, start.y + 4, (start.z + end.z) / 2), // 向中间
                new THREE.Vector3((start.x + end.x) / 2, start.y + 6, (start.z + end.z) / 2), // 向塔方向上升
                new THREE.Vector3((start.x + end.x) / 2, end.y, (start.z + end.z) / 2), // 到达塔的高度
                new THREE.Vector3(end.x, end.y, end.z) // 最终点
            ];
            this.curve = new THREE.CatmullRomCurve3(this.pathPoints);
        }
    }
    
    /**
     * 创建主管道
     */
    createMainPipe() {
        const pipeGroup = new THREE.Group();
        pipeGroup.name = 'mainPipe';
        
        // 使用管道路径创建管道几何体
        const tubeGeometry = new THREE.TubeGeometry(
            this.curve,
            100, // 路径分段数
            this.pipeConfig.pipeRadius,
            8, // 径向分段数
            false // 不闭合
        );
        
        const pipeMesh = new THREE.Mesh(tubeGeometry, this.materials.mainPipe);
        pipeMesh.castShadow = true;
        pipeMesh.receiveShadow = true;
        pipeGroup.add(pipeMesh);
        
        // 管道保温层
        const insulationGeometry = new THREE.TubeGeometry(
            this.curve,
            100,
            this.pipeConfig.pipeRadius + 0.05,
            8,
            false
        );
        
        const insulationMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0,
            metalness: 0.1,
            roughness: 0.8,
            envMapIntensity: 0.2
        });
        
        const insulationMesh = new THREE.Mesh(insulationGeometry, insulationMaterial);
        insulationMesh.castShadow = true;
        pipeGroup.add(insulationMesh);
        
        this.components.set('mainPipe', pipeGroup);
        this.group.add(pipeGroup);
    }
    
    /**
     * 创建管道支撑
     */
    createPipeSupports() {
        const supportGroup = new THREE.Group();
        supportGroup.name = 'pipeSupports';
        
        // 在管道路径上每隔一定距离添加支撑
        const supportCount = 8;
        for (let i = 1; i < supportCount; i++) {
            const t = i / supportCount;
            const point = this.curve.getPoint(t);
            
            // 支撑托架
            const bracketGeometry = new THREE.BoxGeometry(0.6, 0.1, 0.3);
            const bracketMesh = new THREE.Mesh(bracketGeometry, this.materials.support);
            bracketMesh.position.copy(point);
            bracketMesh.position.y -= this.pipeConfig.pipeRadius + 0.1;
            bracketMesh.castShadow = true;
            supportGroup.add(bracketMesh);
            
            // 支撑立柱 (如果不是起点和终点)
            if (i > 1 && i < supportCount - 1) {
                const postHeight = point.y - 0.5;
                const postGeometry = new THREE.CylinderGeometry(0.05, 0.05, postHeight, 8);
                const postMesh = new THREE.Mesh(postGeometry, this.materials.support);
                postMesh.position.set(point.x, postHeight / 2 + 0.5, point.z);
                postMesh.castShadow = true;
                supportGroup.add(postMesh);
                
                // 支撑底座
                const baseGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
                const baseMesh = new THREE.Mesh(baseGeometry, this.materials.support);
                baseMesh.position.set(point.x, 0.55, point.z);
                baseMesh.castShadow = true;
                supportGroup.add(baseMesh);
            }
        }
        
        this.components.set('pipeSupports', supportGroup);
        this.group.add(supportGroup);
    }
    
    /**
     * 创建连接法兰
     */
    createConnectionFlanges() {
        const flangeGroup = new THREE.Group();
        flangeGroup.name = 'connectionFlanges';
        
        // 起点法兰
        const startPoint = this.pathPoints[0];
        const startFlangeGeometry = new THREE.CylinderGeometry(
            this.pipeConfig.pipeRadius + 0.15,
            this.pipeConfig.pipeRadius + 0.15,
            0.1,
            16
        );
        const startFlangeMesh = new THREE.Mesh(startFlangeGeometry, this.materials.flange);
        startFlangeMesh.position.copy(startPoint);
        startFlangeMesh.castShadow = true;
        flangeGroup.add(startFlangeMesh);
        
        // 起点法兰螺栓
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const boltGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6);
            const boltMesh = new THREE.Mesh(boltGeometry, this.materials.support);
            boltMesh.position.set(
                startPoint.x + Math.cos(angle) * (this.pipeConfig.pipeRadius + 0.12),
                startPoint.y,
                startPoint.z + Math.sin(angle) * (this.pipeConfig.pipeRadius + 0.12)
            );
            flangeGroup.add(boltMesh);
        }
        
        // 终点法兰
        const endPoint = this.pathPoints[this.pathPoints.length - 1];
        const endFlangeGeometry = new THREE.CylinderGeometry(
            this.pipeConfig.pipeRadius + 0.15,
            this.pipeConfig.pipeRadius + 0.15,
            0.1,
            16
        );
        const endFlangeMesh = new THREE.Mesh(endFlangeGeometry, this.materials.flange);
        endFlangeMesh.position.copy(endPoint);
        endFlangeMesh.rotation.x = Math.PI / 2;
        endFlangeMesh.castShadow = true;
        flangeGroup.add(endFlangeMesh);
        
        this.components.set('connectionFlanges', flangeGroup);
        this.group.add(flangeGroup);
    }
    
    /**
     * 创建阀门
     */
    createValves() {
        const valveGroup = new THREE.Group();
        valveGroup.name = 'valves';
        
        // 在管道中段添加控制阀门
        const valvePosition = this.curve.getPoint(0.3);
        
        // 阀门主体
        const valveBodyGeometry = new THREE.SphereGeometry(this.pipeConfig.pipeRadius + 0.1, 16, 12);
        const valveBodyMesh = new THREE.Mesh(valveBodyGeometry, this.materials.valve);
        valveBodyMesh.position.copy(valvePosition);
        valveBodyMesh.castShadow = true;
        valveGroup.add(valveBodyMesh);
        
        // 阀门手轮
        const handwheelGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.05, 16);
        const handwheelMesh = new THREE.Mesh(handwheelGeometry, this.materials.valve);
        handwheelMesh.position.set(valvePosition.x, valvePosition.y + 0.25, valvePosition.z);
        handwheelMesh.castShadow = true;
        valveGroup.add(handwheelMesh);
        
        // 手轮辐条
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const spokeGeometry = new THREE.BoxGeometry(0.25, 0.02, 0.02);
            const spokeMesh = new THREE.Mesh(spokeGeometry, this.materials.valve);
            spokeMesh.position.set(
                valvePosition.x + Math.cos(angle) * 0.07,
                valvePosition.y + 0.25,
                valvePosition.z + Math.sin(angle) * 0.07
            );
            spokeMesh.rotation.y = angle;
            valveGroup.add(spokeMesh);
        }
        
        // 阀门杆
        const stemGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.2, 8);
        const stemMesh = new THREE.Mesh(stemGeometry, this.materials.valve);
        stemMesh.position.set(valvePosition.x, valvePosition.y + 0.15, valvePosition.z);
        valveGroup.add(stemMesh);
        
        this.components.set('valves', valveGroup);
        this.group.add(valveGroup);
    }
    
    /**
     * 创建流动指示器
     */
    createFlowIndicators() {
        const flowGroup = new THREE.Group();
        flowGroup.name = 'flowIndicators';
        
        // 在管道上添加流动方向箭头
        const arrowCount = 5;
        for (let i = 1; i <= arrowCount; i++) {
            const t = (i / (arrowCount + 1)) * 0.8 + 0.1; // 避开起点和终点
            const point = this.curve.getPoint(t);
            const tangent = this.curve.getTangent(t);
            
            // 箭头几何体
            const arrowGeometry = new THREE.ConeGeometry(0.05, 0.15, 8);
            const arrowMesh = new THREE.Mesh(arrowGeometry, this.materials.flowIndicator);
            arrowMesh.position.copy(point);
            arrowMesh.position.y += this.pipeConfig.pipeRadius + 0.1;
            
            // 设置箭头方向
            arrowMesh.lookAt(
                point.x + tangent.x,
                point.y + tangent.y,
                point.z + tangent.z
            );
            arrowMesh.rotateX(Math.PI / 2);
            
            arrowMesh.castShadow = true;
            flowGroup.add(arrowMesh);
        }
        
        // 流动标识牌
        const signGeometry = new THREE.BoxGeometry(0.8, 0.3, 0.05);
        const signMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFFFF,
            metalness: 0.0,
            roughness: 0.8
        });
        const signMesh = new THREE.Mesh(signGeometry, signMaterial);
        
        const midPoint = this.curve.getPoint(0.5);
        signMesh.position.set(midPoint.x, midPoint.y + 0.8, midPoint.z);
        signMesh.castShadow = true;
        flowGroup.add(signMesh);
        
        this.components.set('flowIndicators', flowGroup);
        this.group.add(flowGroup);
    }
    
    /**
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.pipeConfig.name,
            type: '管道连接系统',
            startPoint: this.pipeConfig.startPoint,
            endPoint: this.pipeConfig.endPoint,
            components: Array.from(this.components.keys()),
            pathLength: this.curve.getLength()
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
    module.exports = PipeConnection;
} else if (typeof window !== 'undefined') {
    window.PipeConnection = PipeConnection;
}