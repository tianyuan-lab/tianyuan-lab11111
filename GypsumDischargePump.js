/**
 * 石膏排出泵模型
 * 用于从二级塔向一级塔排送石膏浆液
 */

class GypsumDischargePump {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.group.name = 'GypsumDischargePump';
        
        this.config = {
            name: config.name || '石膏排出泵',
            position: config.position || { x: 0, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            scale: config.scale || 1.0,
            
            // 泵体参数
            pumpBodyLength: config.pumpBodyLength || 3.5,
            pumpBodyWidth: config.pumpBodyWidth || 1.8,
            pumpBodyHeight: config.pumpBodyHeight || 2.2,
            
            // 管道参数
            inletDiameter: config.inletDiameter || 0.8,
            outletDiameter: config.outletDiameter || 0.6,
            
            // 基础参数
            foundationLength: config.foundationLength || 4.5,
            foundationWidth: config.foundationWidth || 2.5,
            foundationHeight: config.foundationHeight || 0.5,
            
            ...config
        };
        
        this.materials = this.createMaterials();
        this.initialize();
    }
    
    /**
     * 创建材质
     */
    createMaterials() {
        return {
            // 泵体主材质 - 不锈钢
            pumpBody: new THREE.MeshPhongMaterial({
                color: 0x8C9EAF,
                shininess: 100,
                specular: 0x444444,
                transparent: false
            }),
            
            // 管道材质 - 碳钢
            pipe: new THREE.MeshPhongMaterial({
                color: 0x4A5568,
                shininess: 80,
                specular: 0x333333
            }),
            
            // 电机材质 - 深灰色
            motor: new THREE.MeshPhongMaterial({
                color: 0x2D3748,
                shininess: 60,
                specular: 0x222222
            }),
            
            // 基础材质 - 混凝土
            foundation: new THREE.MeshPhongMaterial({
                color: 0x9CA3AF,
                shininess: 10,
                specular: 0x111111
            }),
            
            // 法兰材质 - 铸铁
            flange: new THREE.MeshPhongMaterial({
                color: 0x374151,
                shininess: 40,
                specular: 0x222222
            }),
            
            // 控制箱材质
            controlBox: new THREE.MeshPhongMaterial({
                color: 0xE5E7EB,
                shininess: 30,
                specular: 0x333333
            })
        };
    }
    
    /**
     * 初始化石膏排出泵
     */
    initialize() {
        // 应用位置、旋转和缩放
        this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
        this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);
        this.group.scale.setScalar(this.config.scale);
        
        // 创建各个组件
        this.createFoundation();
        this.createPumpBody();
        this.createMotor();
        this.createInletPipe();
        this.createOutletPipe();
        this.createSupportStructure();
        this.createControlBox();
        this.createPipeConnections();
        this.createLabel();
        
        console.log(`石膏排出泵 "${this.config.name}" 创建完成`);
    }
    
    /**
     * 创建基础
     */
    createFoundation() {
        const foundationGroup = new THREE.Group();
        foundationGroup.name = 'foundation';
        
        // 主基础
        const foundationGeometry = new THREE.BoxGeometry(
            this.config.foundationLength,
            this.config.foundationHeight,
            this.config.foundationWidth
        );
        const foundationMesh = new THREE.Mesh(foundationGeometry, this.materials.foundation);
        foundationMesh.position.set(0, this.config.foundationHeight / 2, 0);
        foundationMesh.castShadow = true;
        foundationMesh.receiveShadow = true;
        foundationGroup.add(foundationMesh);
        
        // 地脚螺栓
        const boltPositions = [
            [-this.config.foundationLength/2 + 0.3, this.config.foundationHeight, -this.config.foundationWidth/2 + 0.3],
            [this.config.foundationLength/2 - 0.3, this.config.foundationHeight, -this.config.foundationWidth/2 + 0.3],
            [-this.config.foundationLength/2 + 0.3, this.config.foundationHeight, this.config.foundationWidth/2 - 0.3],
            [this.config.foundationLength/2 - 0.3, this.config.foundationHeight, this.config.foundationWidth/2 - 0.3]
        ];
        
        boltPositions.forEach(pos => {
            const boltGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.2, 8);
            const boltMesh = new THREE.Mesh(boltGeometry, this.materials.flange);
            boltMesh.position.set(pos[0], pos[1] + 0.1, pos[2]);
            boltMesh.castShadow = true;
            foundationGroup.add(boltMesh);
        });
        
        this.group.add(foundationGroup);
    }
    
    /**
     * 创建泵体
     */
    createPumpBody() {
        const pumpGroup = new THREE.Group();
        pumpGroup.name = 'pumpBody';
        
        // 主泵体 - 蜗壳式设计
        const pumpBodyGeometry = new THREE.CylinderGeometry(
            this.config.pumpBodyWidth / 2,
            this.config.pumpBodyWidth / 2,
            this.config.pumpBodyHeight,
            16
        );
        const pumpBodyMesh = new THREE.Mesh(pumpBodyGeometry, this.materials.pumpBody);
        pumpBodyMesh.position.set(0, this.config.foundationHeight + this.config.pumpBodyHeight / 2, 0);
        pumpBodyMesh.castShadow = true;
        pumpGroup.add(pumpBodyMesh);
        
        // 泵体前端进水口
        const inletHousingGeometry = new THREE.CylinderGeometry(
            this.config.inletDiameter / 2 + 0.1,
            this.config.inletDiameter / 2 + 0.1,
            0.3,
            12
        );
        const inletHousingMesh = new THREE.Mesh(inletHousingGeometry, this.materials.pumpBody);
        inletHousingMesh.position.set(
            -this.config.pumpBodyWidth / 2 - 0.15,
            this.config.foundationHeight + this.config.pumpBodyHeight / 2,
            0
        );
        inletHousingMesh.rotation.z = Math.PI / 2;
        inletHousingMesh.castShadow = true;
        pumpGroup.add(inletHousingMesh);
        
        // 泵体顶部出水口
        const outletHousingGeometry = new THREE.CylinderGeometry(
            this.config.outletDiameter / 2 + 0.1,
            this.config.outletDiameter / 2 + 0.1,
            0.3,
            12
        );
        const outletHousingMesh = new THREE.Mesh(outletHousingGeometry, this.materials.pumpBody);
        outletHousingMesh.position.set(
            0,
            this.config.foundationHeight + this.config.pumpBodyHeight + 0.15,
            0
        );
        outletHousingMesh.castShadow = true;
        pumpGroup.add(outletHousingMesh);
        
        // 泵体法兰
        const flangeGeometry = new THREE.CylinderGeometry(
            this.config.pumpBodyWidth / 2 + 0.1,
            this.config.pumpBodyWidth / 2 + 0.1,
            0.1,
            16
        );
        const bottomFlangeMesh = new THREE.Mesh(flangeGeometry, this.materials.flange);
        bottomFlangeMesh.position.set(0, this.config.foundationHeight + 0.05, 0);
        bottomFlangeMesh.castShadow = true;
        pumpGroup.add(bottomFlangeMesh);
        
        this.group.add(pumpGroup);
    }
    
    /**
     * 创建电机
     */
    createMotor() {
        const motorGroup = new THREE.Group();
        motorGroup.name = 'motor';
        
        // 电机主体
        const motorGeometry = new THREE.CylinderGeometry(0.6, 0.6, 1.5, 16);
        const motorMesh = new THREE.Mesh(motorGeometry, this.materials.motor);
        motorMesh.position.set(
            this.config.pumpBodyLength / 2,
            this.config.foundationHeight + this.config.pumpBodyHeight / 2,
            0
        );
        motorMesh.rotation.z = Math.PI / 2;
        motorMesh.castShadow = true;
        motorGroup.add(motorMesh);
        
        // 电机端盖
        const endCapGeometry = new THREE.CylinderGeometry(0.65, 0.65, 0.1, 16);
        const frontEndCapMesh = new THREE.Mesh(endCapGeometry, this.materials.flange);
        frontEndCapMesh.position.set(
            this.config.pumpBodyLength / 2 - 0.8,
            this.config.foundationHeight + this.config.pumpBodyHeight / 2,
            0
        );
        frontEndCapMesh.rotation.z = Math.PI / 2;
        frontEndCapMesh.castShadow = true;
        motorGroup.add(frontEndCapMesh);
        
        const backEndCapMesh = new THREE.Mesh(endCapGeometry, this.materials.flange);
        backEndCapMesh.position.set(
            this.config.pumpBodyLength / 2 + 0.8,
            this.config.foundationHeight + this.config.pumpBodyHeight / 2,
            0
        );
        backEndCapMesh.rotation.z = Math.PI / 2;
        backEndCapMesh.castShadow = true;
        motorGroup.add(backEndCapMesh);
        
        // 电机轴
        const shaftGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.5, 8);
        const shaftMesh = new THREE.Mesh(shaftGeometry, this.materials.flange);
        shaftMesh.position.set(
            this.config.pumpBodyLength / 2 - 1.0,
            this.config.foundationHeight + this.config.pumpBodyHeight / 2,
            0
        );
        shaftMesh.rotation.z = Math.PI / 2;
        shaftMesh.castShadow = true;
        motorGroup.add(shaftMesh);
        
        this.group.add(motorGroup);
    }
    
    /**
     * 创建进水管道
     */
    createInletPipe() {
        const inletGroup = new THREE.Group();
        inletGroup.name = 'inletPipe';
        
        // 水平进水管段
        const horizontalPipeGeometry = new THREE.CylinderGeometry(
            this.config.inletDiameter / 2,
            this.config.inletDiameter / 2,
            2.0,
            12
        );
        const horizontalPipeMesh = new THREE.Mesh(horizontalPipeGeometry, this.materials.pipe);
        horizontalPipeMesh.position.set(
            -this.config.pumpBodyWidth / 2 - 1.15,
            this.config.foundationHeight + this.config.pumpBodyHeight / 2,
            0
        );
        horizontalPipeMesh.rotation.z = Math.PI / 2;
        horizontalPipeMesh.castShadow = true;
        inletGroup.add(horizontalPipeMesh);
        
        // 进水法兰
        const inletFlangeGeometry = new THREE.CylinderGeometry(
            this.config.inletDiameter / 2 + 0.1,
            this.config.inletDiameter / 2 + 0.1,
            0.08,
            12
        );
        const inletFlangeMesh = new THREE.Mesh(inletFlangeGeometry, this.materials.flange);
        inletFlangeMesh.position.set(
            -this.config.pumpBodyWidth / 2 - 2.2,
            this.config.foundationHeight + this.config.pumpBodyHeight / 2,
            0
        );
        inletFlangeMesh.rotation.z = Math.PI / 2;
        inletFlangeMesh.castShadow = true;
        inletGroup.add(inletFlangeMesh);
        
        this.group.add(inletGroup);
    }
    
    /**
     * 创建出水管道
     */
    createOutletPipe() {
        const outletGroup = new THREE.Group();
        outletGroup.name = 'outletPipe';
        
        // 垂直出水管段
        const verticalPipeGeometry = new THREE.CylinderGeometry(
            this.config.outletDiameter / 2,
            this.config.outletDiameter / 2,
            1.5,
            12
        );
        const verticalPipeMesh = new THREE.Mesh(verticalPipeGeometry, this.materials.pipe);
        verticalPipeMesh.position.set(
            0,
            this.config.foundationHeight + this.config.pumpBodyHeight + 1.0,
            0
        );
        verticalPipeMesh.castShadow = true;
        outletGroup.add(verticalPipeMesh);
        
        // 90度弯头
        const elbowGeometry = new THREE.TorusGeometry(
            this.config.outletDiameter / 2 + 0.1,
            this.config.outletDiameter / 2,
            8,
            16,
            Math.PI / 2
        );
        const elbowMesh = new THREE.Mesh(elbowGeometry, this.materials.pipe);
        elbowMesh.position.set(
            0,
            this.config.foundationHeight + this.config.pumpBodyHeight + 1.75,
            0
        );
        elbowMesh.rotation.y = Math.PI / 2;
        elbowMesh.castShadow = true;
        outletGroup.add(elbowMesh);
        
        // 水平出水管段
        const horizontalOutletGeometry = new THREE.CylinderGeometry(
            this.config.outletDiameter / 2,
            this.config.outletDiameter / 2,
            1.5,
            12
        );
        const horizontalOutletMesh = new THREE.Mesh(horizontalOutletGeometry, this.materials.pipe);
        horizontalOutletMesh.position.set(
            0.85,
            this.config.foundationHeight + this.config.pumpBodyHeight + 1.75,
            0
        );
        horizontalOutletMesh.rotation.z = Math.PI / 2;
        horizontalOutletMesh.castShadow = true;
        outletGroup.add(horizontalOutletMesh);
        
        // 出水法兰
        const outletFlangeGeometry = new THREE.CylinderGeometry(
            this.config.outletDiameter / 2 + 0.1,
            this.config.outletDiameter / 2 + 0.1,
            0.08,
            12
        );
        const outletFlangeMesh = new THREE.Mesh(outletFlangeGeometry, this.materials.flange);
        outletFlangeMesh.position.set(
            1.6,
            this.config.foundationHeight + this.config.pumpBodyHeight + 1.75,
            0
        );
        outletFlangeMesh.rotation.z = Math.PI / 2;
        outletFlangeMesh.castShadow = true;
        outletGroup.add(outletFlangeMesh);
        
        this.group.add(outletGroup);
    }
    
    /**
     * 创建支撑结构
     */
    createSupportStructure() {
        const supportGroup = new THREE.Group();
        supportGroup.name = 'supportStructure';
        
        // 电机支撑架
        const motorSupportPositions = [
            [this.config.pumpBodyLength / 2 - 0.5, 0.3],
            [this.config.pumpBodyLength / 2 + 0.5, 0.3]
        ];
        
        motorSupportPositions.forEach(pos => {
            const supportGeometry = new THREE.BoxGeometry(0.1, 0.6, 0.4);
            const supportMesh = new THREE.Mesh(supportGeometry, this.materials.flange);
            supportMesh.position.set(
                pos[0],
                this.config.foundationHeight + pos[1],
                0
            );
            supportMesh.castShadow = true;
            supportGroup.add(supportMesh);
        });
        
        // 管道支撑
        const pipeSupportGeometry = new THREE.BoxGeometry(0.1, 0.8, 0.2);
        const pipeSupportMesh = new THREE.Mesh(pipeSupportGeometry, this.materials.flange);
        pipeSupportMesh.position.set(
            0.5,
            this.config.foundationHeight + this.config.pumpBodyHeight + 1.35,
            0
        );
        pipeSupportMesh.castShadow = true;
        supportGroup.add(pipeSupportMesh);
        
        this.group.add(supportGroup);
    }
    
    /**
     * 创建控制箱
     */
    createControlBox() {
        const controlGroup = new THREE.Group();
        controlGroup.name = 'controlBox';
        
        // 主控制箱
        const controlBoxGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.3);
        const controlBoxMesh = new THREE.Mesh(controlBoxGeometry, this.materials.controlBox);
        controlBoxMesh.position.set(
            this.config.pumpBodyLength / 2 + 1.2,
            this.config.foundationHeight + 0.4,
            0.8
        );
        controlBoxMesh.castShadow = true;
        controlGroup.add(controlBoxMesh);
        
        // 控制箱门
        const doorGeometry = new THREE.BoxGeometry(0.5, 0.7, 0.02);
        const doorMesh = new THREE.Mesh(doorGeometry, this.materials.motor);
        doorMesh.position.set(
            this.config.pumpBodyLength / 2 + 1.2,
            this.config.foundationHeight + 0.4,
            0.96
        );
        doorMesh.castShadow = true;
        controlGroup.add(doorMesh);
        
        // 指示灯
        const indicatorGeometry = new THREE.SphereGeometry(0.03, 8, 8);
        const redIndicatorMesh = new THREE.Mesh(indicatorGeometry, new THREE.MeshPhongMaterial({ color: 0xFF0000, emissive: 0x330000 }));
        redIndicatorMesh.position.set(
            this.config.pumpBodyLength / 2 + 1.2 - 0.15,
            this.config.foundationHeight + 0.65,
            0.97
        );
        controlGroup.add(redIndicatorMesh);
        
        const greenIndicatorMesh = new THREE.Mesh(indicatorGeometry, new THREE.MeshPhongMaterial({ color: 0x00FF00, emissive: 0x003300 }));
        greenIndicatorMesh.position.set(
            this.config.pumpBodyLength / 2 + 1.2 + 0.15,
            this.config.foundationHeight + 0.65,
            0.97
        );
        controlGroup.add(greenIndicatorMesh);
        
        this.group.add(controlGroup);
    }
    
    /**
     * 创建管道连接点
     */
    createPipeConnections() {
        // 存储连接点信息供外部使用
        this.connectionPoints = {
            inlet: {
                position: {
                    x: -this.config.pumpBodyWidth / 2 - 2.2,
                    y: this.config.foundationHeight + this.config.pumpBodyHeight / 2,
                    z: 0
                }
            },
            outlet: {
                position: {
                    x: 1.6,
                    y: this.config.foundationHeight + this.config.pumpBodyHeight + 1.75,
                    z: 0
                }
            }
        };
    }
    
    /**
     * 创建标签
     */
    createLabel() {
        const labelGroup = new THREE.Group();
        labelGroup.name = 'pumpLabel';
        
        const labelSprite = this.createLabelSprite(this.config.name, '#FF6600');
        labelSprite.position.set(0, this.config.foundationHeight + this.config.pumpBodyHeight + 3, 0);
        labelGroup.add(labelSprite);
        
        this.group.add(labelGroup);
    }
    
    /**
     * 创建标签精灵
     */
    createLabelSprite(text, color = '#FFFFFF') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = 384;
        canvas.height = 96;
        
        context.font = 'Bold 36px Microsoft YaHei, Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 背景
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.roundRect(context, 8, 8, canvas.width - 16, canvas.height - 16, 8);
        context.fill();
        
        // 边框
        context.strokeStyle = color;
        context.lineWidth = 1.5;
        this.roundRect(context, 8, 8, canvas.width - 16, canvas.height - 16, 8);
        context.stroke();
        
        // 文字
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(6, 1.5, 1);
        sprite.name = `pumpLabel_${text.replace(/\s+/g, '_')}`;
        
        return sprite;
    }
    
    /**
     * 绘制圆角矩形
     */
    roundRect(ctx, x, y, w, h, r) {
        ctx.beginPath();
        ctx.moveTo(x + r, y);
        ctx.lineTo(x + w - r, y);
        ctx.quadraticCurveTo(x + w, y, x + w, y + r);
        ctx.lineTo(x + w, y + h - r);
        ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
        ctx.lineTo(x + r, y + h);
        ctx.quadraticCurveTo(x, y + h, x, y + h - r);
        ctx.lineTo(x, y + r);
        ctx.quadraticCurveTo(x, y, x + r, y);
        ctx.closePath();
    }
    
    /**
     * 获取连接点信息
     */
    getConnectionPoints() {
        return this.connectionPoints;
    }
    
    /**
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.config.name,
            position: this.config.position,
            pumpBodySize: {
                length: this.config.pumpBodyLength,
                width: this.config.pumpBodyWidth,
                height: this.config.pumpBodyHeight
            },
            connectionPoints: this.connectionPoints
        };
    }
}