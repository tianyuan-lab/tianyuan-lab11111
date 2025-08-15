/**
 * 事故水泵模型类 - 现代化离心泵机组
 * 特点：不锈钢外壳、法兰连接、防护罩、PBR材质、工业级设计
 */
class EmergencyWaterPump {
    constructor(config = {}) {
        this.config = {
            name: config.name || '事故水泵',
            position: config.position || { x: 10, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            scale: config.scale || 1.0,
            
            // 泵体尺寸（现代离心泵标准尺寸）
            pumpBodyLength: 2.4,  // 泵体长度
            pumpBodyWidth: 1.0,   // 泵体宽度  
            pumpBodyHeight: 1.2,  // 泵体高度
            
            // 电机尺寸
            motorLength: 1.8,     // 电机长度
            motorDiameter: 0.8,   // 电机直径
            
            // 底座与管道
            baseWidth: 3.0,       // 底座宽度
            baseDepth: 2.0,       // 底座深度
            baseHeight: 0.3,      // 底座高度
            pipeRadius: 0.2,      // 管道半径
            
            // 入出口参数
            inletDiameter: 0.4,   // 入水口直径
            outletDiameter: 0.35, // 出水口直径
        };
        
        Object.assign(this.config, config);
        this.group = new THREE.Group();
        this.group.name = this.config.name;
        
        this.createPumpModel();
        this.applyTransform();
    }
    
    /**
     * 创建完整的水泵模型
     */
    createPumpModel() {
        // 1. 混凝土底座
        this.createFoundation();
        
        // 2. 泵体主体（蜗壳）
        this.createPumpBody();
        
        // 3. 电机
        this.createMotor();
        
        // 4. 联轴器
        this.createCoupling();
        
        // 5. 入水口与出水口管道
        this.createInletOutletPorts();
        
        // 6. 支撑架与防护装置
        this.createSupportStructure();
        
        // 7. 控制箱
        this.createControlBox();
        
        // 8. 铭牌与标识
        this.createNameplate();
        
        // 9. 端口标识（按当前需求不创建）
    }
    
    /**
     * 创建混凝土底座
     */
    createFoundation() {
        const geometry = new THREE.BoxGeometry(
            this.config.baseWidth, 
            this.config.baseHeight, 
            this.config.baseDepth
        );
        
        const material = new THREE.MeshLambertMaterial({ 
            color: 0x888888,
            roughness: 0.8
        });
        
        const foundation = new THREE.Mesh(geometry, material);
        foundation.position.set(0, this.config.baseHeight / 2, 0);
        foundation.name = '混凝土基座';
        foundation.castShadow = true;
        foundation.receiveShadow = true;
        
        this.group.add(foundation);
    }
    
    /**
     * 创建泵体（蜗壳）- 现代离心泵设计
     */
    createPumpBody() {
        const pumpGroup = new THREE.Group();
        pumpGroup.name = '泵体组件';
        
        // 主蜗壳（螺旋形状近似）
        const spiralGeometry = new THREE.CylinderGeometry(
            this.config.pumpBodyWidth / 2, 
            this.config.pumpBodyWidth / 2,
            this.config.pumpBodyHeight,
            16
        );
        
        // 不锈钢材质
        const stainlessMaterial = new THREE.MeshStandardMaterial({
            color: 0xC0C0C0,
            metalness: 0.8,
            roughness: 0.2,
            envMapIntensity: 1.0
        });
        
        const pumpBody = new THREE.Mesh(spiralGeometry, stainlessMaterial);
        pumpBody.position.set(
            -this.config.pumpBodyLength / 4, 
            this.config.baseHeight + this.config.pumpBodyHeight / 2, 
            0
        );
        pumpBody.rotation.z = Math.PI / 2;
        pumpBody.name = '泵体蜗壳';
        pumpBody.castShadow = true;
        
        pumpGroup.add(pumpBody);
        
        // 进口法兰盖
        const inletFlange = this.createFlange(0.6, 0.1);
        inletFlange.position.set(
            -this.config.pumpBodyLength / 2 - 0.05, 
            this.config.baseHeight + this.config.pumpBodyHeight / 2, 
            0
        );
        inletFlange.rotation.z = Math.PI / 2;
        inletFlange.name = '进口法兰';
        pumpGroup.add(inletFlange);
        
        // 出口法兰盖 
        const outletFlange = this.createFlange(0.5, 0.08);
        outletFlange.position.set(
            -this.config.pumpBodyLength / 4, 
            this.config.baseHeight + this.config.pumpBodyHeight + 0.04, 
            0
        );
        outletFlange.name = '出口法兰';
        pumpGroup.add(outletFlange);
        
        this.group.add(pumpGroup);
    }
    
    /**
     * 创建法兰
     */
    createFlange(diameter, thickness) {
        const geometry = new THREE.CylinderGeometry(diameter / 2, diameter / 2, thickness, 16);
        const material = new THREE.MeshStandardMaterial({
            color: 0xB0B0B0,
            metalness: 0.7,
            roughness: 0.3
        });
        
        const flange = new THREE.Mesh(geometry, material);
        flange.castShadow = true;
        return flange;
    }
    
    /**
     * 创建电机
     */
    createMotor() {
        const motorGroup = new THREE.Group();
        motorGroup.name = '电机组件';
        
        // 电机机身
        const motorGeometry = new THREE.CylinderGeometry(
            this.config.motorDiameter / 2,
            this.config.motorDiameter / 2,
            this.config.motorLength,
            16
        );
        
        const motorMaterial = new THREE.MeshStandardMaterial({
            color: 0x2E4057,  // 深蓝灰色
            metalness: 0.4,
            roughness: 0.6
        });
        
        const motor = new THREE.Mesh(motorGeometry, motorMaterial);
        motor.position.set(
            this.config.pumpBodyLength / 2, 
            this.config.baseHeight + this.config.pumpBodyHeight / 2, 
            0
        );
        motor.rotation.z = Math.PI / 2;
        motor.name = '电机机身';
        motor.castShadow = true;
        
        motorGroup.add(motor);
        
        // 接线盒
        const junctionBox = new THREE.BoxGeometry(0.3, 0.15, 0.4);
        const junctionMaterial = new THREE.MeshLambertMaterial({ color: 0x333333 });
        const junction = new THREE.Mesh(junctionBox, junctionMaterial);
        junction.position.set(
            this.config.pumpBodyLength / 2, 
            this.config.baseHeight + this.config.pumpBodyHeight / 2 + 0.5, 
            0
        );
        junction.name = '接线盒';
        motorGroup.add(junction);
        
        // 散热片
        for (let i = 0; i < 6; i++) {
            const finGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.8);
            const finMaterial = new THREE.MeshLambertMaterial({ color: 0x666666 });
            const fin = new THREE.Mesh(finGeometry, finMaterial);
            fin.position.set(
                this.config.pumpBodyLength / 2 - 0.6 + i * 0.2, 
                this.config.baseHeight + this.config.pumpBodyHeight / 2, 
                0
            );
            fin.name = '散热片';
            motorGroup.add(fin);
        }
        
        this.group.add(motorGroup);
    }
    
    /**
     * 创建联轴器
     */
    createCoupling() {
        const couplingGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.3, 12);
        const couplingMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,  // 黄铜色
            metalness: 0.8,
            roughness: 0.2
        });
        
        const coupling = new THREE.Mesh(couplingGeometry, couplingMaterial);
        coupling.position.set(
            0, 
            this.config.baseHeight + this.config.pumpBodyHeight / 2, 
            0
        );
        coupling.rotation.z = Math.PI / 2;
        coupling.name = '联轴器';
        coupling.castShadow = true;
        
        this.group.add(coupling);
    }
    
    /**
     * 创建入水口与出水口管道
     */
    createInletOutletPorts() {
        const portsGroup = new THREE.Group();
        portsGroup.name = '进出口管道';
        
        // 入水管道（垂直向下连接事故水箱）
        const inletGeometry = new THREE.CylinderGeometry(
            this.config.inletDiameter / 2, 
            this.config.inletDiameter / 2, 
            1.5
        );
        const pipeMaterial = new THREE.MeshStandardMaterial({
            color: 0x4A90E2,  // 蓝色管道
            metalness: 0.6,
            roughness: 0.4
        });
        
        const inletPipe = new THREE.Mesh(inletGeometry, pipeMaterial);
        inletPipe.position.set(
            -this.config.pumpBodyLength / 2 - 0.3, 
            this.config.baseHeight + 0.75, 
            0
        );
        inletPipe.name = '入水管';
        inletPipe.userData.connectionType = 'inlet';
        inletPipe.castShadow = true;
        portsGroup.add(inletPipe);
        
        // 入水法兰
        const inletFlange = this.createFlange(this.config.inletDiameter + 0.1, 0.05);
        inletFlange.position.set(
            -this.config.pumpBodyLength / 2 - 0.3, 
            this.config.baseHeight + 0.15, 
            0
        );
        inletFlange.name = '入水法兰';
        portsGroup.add(inletFlange);
        
        // 出水管道（水平向右，便于连接其他系统）
        const outletGeometry = new THREE.CylinderGeometry(
            this.config.outletDiameter / 2, 
            this.config.outletDiameter / 2, 
            1.8
        );
        
        const outletPipe = new THREE.Mesh(outletGeometry, pipeMaterial);
        outletPipe.position.set(
            0.5, 
            this.config.baseHeight + this.config.pumpBodyHeight + 0.3, 
            0
        );
        outletPipe.rotation.z = Math.PI / 2;
        outletPipe.name = '出水管';
        outletPipe.userData.connectionType = 'outlet';
        outletPipe.castShadow = true;
        portsGroup.add(outletPipe);
        
        // 出水法兰
        const outletFlange = this.createFlange(this.config.outletDiameter + 0.08, 0.05);
        outletFlange.position.set(
            1.3, 
            this.config.baseHeight + this.config.pumpBodyHeight + 0.3, 
            0
        );
        outletFlange.rotation.z = Math.PI / 2;
        outletFlange.name = '出水法兰';
        portsGroup.add(outletFlange);
        
        this.group.add(portsGroup);
        
        // 存储端口位置供外部连接使用
        this.inletPosition = {
            x: -this.config.pumpBodyLength / 2 - 0.3,
            y: this.config.baseHeight + 0.15,
            z: 0
        };
        
        this.outletPosition = {
            x: 1.3,
            y: this.config.baseHeight + this.config.pumpBodyHeight + 0.3,
            z: 0
        };
    }
    
    /**
     * 创建支撑架与防护装置
     */
    createSupportStructure() {
        const supportGroup = new THREE.Group();
        supportGroup.name = '支撑防护系统';
        
        // 防护栏杆
        const railingMaterial = new THREE.MeshLambertMaterial({ color: 0xFFD700 });
        
        // 栏杆立柱
        for (let i = 0; i < 4; i++) {
            const postGeometry = new THREE.CylinderGeometry(0.025, 0.025, 1.0);
            const post = new THREE.Mesh(postGeometry, railingMaterial);
            
            const angle = (i / 4) * Math.PI * 2;
            const radius = 1.8;
            post.position.set(
                Math.cos(angle) * radius, 
                this.config.baseHeight + 0.5, 
                Math.sin(angle) * radius
            );
            post.name = '防护立柱';
            supportGroup.add(post);
        }
        
        // 横向栏杆
        const railGeometry = new THREE.CylinderGeometry(0.02, 0.02, 11.3);
        const rail = new THREE.Mesh(railGeometry, railingMaterial);
        rail.position.set(0, this.config.baseHeight + 0.8, 0);
        rail.rotation.y = Math.PI / 4;
        rail.name = '防护栏杆';
        supportGroup.add(rail);
        
        this.group.add(supportGroup);
    }
    
    /**
     * 创建控制箱
     */
    createControlBox() {
        const controlGeometry = new THREE.BoxGeometry(0.6, 0.8, 0.3);
        const controlMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x2E4057,
            transparent: false
        });
        
        const controlBox = new THREE.Mesh(controlGeometry, controlMaterial);
        controlBox.position.set(
            -1.8, 
            this.config.baseHeight + 0.4, 
            -1.2
        );
        controlBox.name = '控制箱';
        controlBox.castShadow = true;
        
        this.group.add(controlBox);
    }
    
    /**
     * 创建铭牌与标识
     */
    createNameplate() {
        // 设备铭牌
        const plateGeometry = new THREE.PlaneGeometry(0.6, 0.3);
        const plateTexture = this.createNameplateTexture();
        const plateMaterial = new THREE.MeshLambertMaterial({ 
            map: plateTexture,
            transparent: true
        });
        
        const nameplate = new THREE.Mesh(plateGeometry, plateMaterial);
        nameplate.position.set(
            this.config.pumpBodyLength / 2, 
            this.config.baseHeight + this.config.pumpBodyHeight * 0.3, 
            0.45
        );
        nameplate.name = '设备铭牌';
        
        this.group.add(nameplate);
    }
    
    /**
     * 创建铭牌纹理
     */
    createNameplateTexture() {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 512;
        canvas.height = 256;
        
        // 背景
        ctx.fillStyle = '#E8E8E8';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // 边框
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 4;
        ctx.strokeRect(10, 10, canvas.width - 20, canvas.height - 20);
        
        // 文字
        ctx.fillStyle = '#1a1a1a';
        ctx.font = 'bold 24px Microsoft YaHei';
        ctx.textAlign = 'center';
        
        ctx.fillText('事故水泵', canvas.width / 2, 60);
        ctx.font = '18px Microsoft YaHei';
        ctx.fillText('Emergency Water Pump', canvas.width / 2, 90);
        ctx.fillText('型号：IS125-100-200', canvas.width / 2, 130);
        ctx.fillText('流量：200m³/h', canvas.width / 2, 155);
        ctx.fillText('扬程：32m', canvas.width / 2, 180);
        ctx.fillText('功率：22kW', canvas.width / 2, 205);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        return texture;
    }
    
    // 端口标识功能移除（避免在场景中显示标签）
    
    /**
     * 创建端口标识精灵
     */
    createPortSprite(text, color = '#FFFFFF') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 400;
        canvas.height = 100;
        
        // 背景
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(5, 5, canvas.width - 10, canvas.height - 10);
        
        // 边框
        ctx.strokeStyle = color;
        ctx.lineWidth = 3;
        ctx.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
        
        // 文字
        ctx.fillStyle = color;
        ctx.font = 'bold 28px Microsoft YaHei, Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
            depthTest: false,
            depthWrite: false
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(3, 0.75, 1);
        sprite.renderOrder = 10000;
        
        return sprite;
    }
    
    /**
     * 应用变换
     */
    applyTransform() {
        this.group.position.set(
            this.config.position.x,
            this.config.position.y,
            this.config.position.z
        );
        this.group.rotation.set(
            this.config.rotation.x,
            this.config.rotation.y,
            this.config.rotation.z
        );
        this.group.scale.set(this.config.scale, this.config.scale, this.config.scale);
    }
    
    /**
     * 获取模型组
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * 获取连接点位置（世界坐标系）
     */
    getConnectionPoints() {
        const worldInlet = new THREE.Vector3(
            this.config.position.x + this.inletPosition.x * this.config.scale,
            this.config.position.y + this.inletPosition.y * this.config.scale,
            this.config.position.z + this.inletPosition.z * this.config.scale
        );
        
        const worldOutlet = new THREE.Vector3(
            this.config.position.x + this.outletPosition.x * this.config.scale,
            this.config.position.y + this.outletPosition.y * this.config.scale,
            this.config.position.z + this.outletPosition.z * this.config.scale
        );
        
        return {
            inlet: worldInlet,
            outlet: worldOutlet
        };
    }
    
    /**
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.config.name,
            type: '事故水泵',
            position: this.config.position,
            dimensions: {
                length: this.config.baseWidth,
                width: this.config.baseDepth,
                height: this.config.pumpBodyHeight + this.config.baseHeight
            },
            specifications: {
                model: 'IS125-100-200',
                flow: '200m³/h',
                head: '32m',
                power: '22kW',
                inletDiameter: this.config.inletDiameter + 'm',
                outletDiameter: this.config.outletDiameter + 'm'
            },
            components: [
                '混凝土基座',
                '泵体蜗壳', 
                '电机组件',
                '联轴器',
                '进出口管道',
                '支撑防护系统',
                '控制箱',
                '设备铭牌',
                '端口标识系统'
            ],
            connectionPoints: this.getConnectionPoints(),
            status: '就绪待连接'
        };
    }
}

// 模块导出
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmergencyWaterPump;
}