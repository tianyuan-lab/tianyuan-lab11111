/**
 * 简化版石膏输送泵模型
 * 重点：简单结构 + 清晰连接点 + 易于管道对接
 */

class SimpleGypsumPump {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.group.name = 'SimpleGypsumPump';
        
        this.config = {
            name: config.name || '石膏输送泵',
            position: config.position || { x: 0, y: 0, z: 0 },
            
            // 简化的泵体参数
            pumpLength: 4.0,    // 泵体长度
            pumpWidth: 2.0,     // 泵体宽度  
            pumpHeight: 1.5,    // 泵体高度
            
            // 基础参数
            baseHeight: 0.3,    // 基础高度
            
            ...config
        };
        
        this.initialize();
    }
    
    /**
     * 初始化泵模型
     */
    initialize() {
        // 设置位置
        this.group.position.set(
            this.config.position.x, 
            this.config.position.y, 
            this.config.position.z
        );
        
        // 创建各部分
        this.createBase();
        this.createPumpBody();
        this.createInletConnection();
        this.createOutletConnection();
        this.createMotor();
        this.createLabel();
        
        // 定义连接点（简单明确）
        this.defineConnectionPoints();
        
        console.log(`简化石膏输送泵 "${this.config.name}" 创建完成`);
    }
    
    /**
     * 创建基础
     */
    createBase() {
        const baseGeometry = new THREE.BoxGeometry(
            this.config.pumpLength + 0.5,
            this.config.baseHeight,
            this.config.pumpWidth + 0.5
        );
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x666666,
            shininess: 10
        });
        
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.set(0, this.config.baseHeight / 2, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        this.group.add(base);
    }
    
    /**
     * 创建泵体
     */
    createPumpBody() {
        const pumpGeometry = new THREE.BoxGeometry(
            this.config.pumpLength,
            this.config.pumpHeight,
            this.config.pumpWidth
        );
        const pumpMaterial = new THREE.MeshPhongMaterial({
            color: 0x4A90E2,
            shininess: 80,
            specular: 0x444444
        });
        
        const pumpBody = new THREE.Mesh(pumpGeometry, pumpMaterial);
        pumpBody.position.set(
            0, 
            this.config.baseHeight + this.config.pumpHeight / 2, 
            0
        );
        pumpBody.castShadow = true;
        this.group.add(pumpBody);
    }
    
    /**
     * 创建进水口连接（左侧）
     */
    createInletConnection() {
        const inletGroup = new THREE.Group();
        inletGroup.name = 'inletConnection';
        
        // 进水管
        const pipeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.0, 12);
        const pipeMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 60
        });
        
        const inletPipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        inletPipe.position.set(
            -this.config.pumpLength / 2 - 0.5,
            this.config.baseHeight + this.config.pumpHeight / 2,
            0
        );
        inletPipe.rotation.z = Math.PI / 2;
        inletPipe.castShadow = true;
        inletGroup.add(inletPipe);
        
        // 法兰
        const flangeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12);
        const flangeMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            shininess: 80
        });
        
        const inletFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
        inletFlange.position.set(
            -this.config.pumpLength / 2 - 1.0,
            this.config.baseHeight + this.config.pumpHeight / 2,
            0
        );
        inletFlange.rotation.z = Math.PI / 2;
        inletFlange.castShadow = true;
        inletGroup.add(inletFlange);
        
        this.group.add(inletGroup);
    }
    
    /**
     * 创建出水口连接（右侧）
     */
    createOutletConnection() {
        const outletGroup = new THREE.Group();
        outletGroup.name = 'outletConnection';
        
        // 出水管
        const pipeGeometry = new THREE.CylinderGeometry(0.25, 0.25, 1.0, 12);
        const pipeMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 60
        });
        
        const outletPipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
        outletPipe.position.set(
            this.config.pumpLength / 2 + 0.5,
            this.config.baseHeight + this.config.pumpHeight / 2,
            0
        );
        outletPipe.rotation.z = Math.PI / 2;
        outletPipe.castShadow = true;
        outletGroup.add(outletPipe);
        
        // 法兰
        const flangeGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 12);
        const flangeMaterial = new THREE.MeshPhongMaterial({
            color: 0x222222,
            shininess: 80
        });
        
        const outletFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
        outletFlange.position.set(
            this.config.pumpLength / 2 + 1.0,
            this.config.baseHeight + this.config.pumpHeight / 2,
            0
        );
        outletFlange.rotation.z = Math.PI / 2;
        outletFlange.castShadow = true;
        outletGroup.add(outletFlange);
        
        this.group.add(outletGroup);
    }
    
    /**
     * 创建电机
     */
    createMotor() {
        const motorGeometry = new THREE.CylinderGeometry(0.4, 0.4, 1.2, 16);
        const motorMaterial = new THREE.MeshPhongMaterial({
            color: 0x2D3748,
            shininess: 60
        });
        
        const motor = new THREE.Mesh(motorGeometry, motorMaterial);
        motor.position.set(
            0,
            this.config.baseHeight + this.config.pumpHeight + 0.6,
            0
        );
        motor.castShadow = true;
        this.group.add(motor);
    }
    
    /**
     * 定义连接点
     */
    defineConnectionPoints() {
        this.connectionPoints = {
            inlet: {
                // 进水口：左侧法兰中心
                x: this.config.position.x - this.config.pumpLength / 2 - 1.0,
                y: this.config.position.y + this.config.baseHeight + this.config.pumpHeight / 2,
                z: this.config.position.z
            },
            outlet: {
                // 出水口：右侧法兰中心
                x: this.config.position.x + this.config.pumpLength / 2 + 1.0,
                y: this.config.position.y + this.config.baseHeight + this.config.pumpHeight / 2,
                z: this.config.position.z
            }
        };
    }
    
    /**
     * 创建标签
     */
    createLabel() {
        const labelSprite = this.createLabelSprite(this.config.name);
        labelSprite.position.set(
            0, 
            this.config.baseHeight + this.config.pumpHeight + 2.0, 
            0
        );
        this.group.add(labelSprite);
    }
    
    /**
     * 创建标签精灵
     */
    createLabelSprite(text) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        
        canvas.width = 384;
        canvas.height = 96;
        
        context.font = 'Bold 36px Microsoft YaHei, Arial';
        context.fillStyle = '#FF6600';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 背景
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        this.roundRect(context, 8, 8, canvas.width - 16, canvas.height - 16, 8);
        context.fill();
        
        // 边框
        context.strokeStyle = '#FF6600';
        context.lineWidth = 2;
        this.roundRect(context, 8, 8, canvas.width - 16, canvas.height - 16, 8);
        context.stroke();
        
        // 文字
        context.fillStyle = '#FF6600';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(6, 1.5, 1);
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
     * 获取连接点
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
            connectionPoints: this.connectionPoints
        };
    }
}