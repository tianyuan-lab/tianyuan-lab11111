/**
 * 一体化石膏输送系统
 * 包含：泵体 + 进水管道 + 出水管道，无连接错位问题
 */

class IntegratedGypsumSystem {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.group.name = 'IntegratedGypsumSystem';
        
        this.config = {
            name: config.name || '石膏输送系统',
            position: config.position || { x: 0, y: 0, z: 0 },
            
            // 系统参数
            pumpLength: 4.0,
            pumpWidth: 2.0,
            pumpHeight: 1.5,
            baseHeight: 0.3,
            
            // 管道参数
            inletPipeLength: 15,  // 从二级塔到泵的距离
            outletPipeLength: 15, // 从泵到一级塔的距离
            pipeRadius: 0.3,
            
            ...config
        };
        
        this.initialize();
    }
    
    /**
     * 初始化系统
     */
    initialize() {
        // 设置位置
        this.group.position.set(
            this.config.position.x,
            this.config.position.y,
            this.config.position.z
        );
        
        // 创建各个部分
        this.createBase();
        this.createPumpBody();
        this.createMotor();
        this.createIntegratedPipes();
        this.createLabel();
        
        console.log(`一体化石膏输送系统 "${this.config.name}" 创建完成`);
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
     * 创建一体化管道系统
     */
    createIntegratedPipes() {
        const pipeGroup = new THREE.Group();
        pipeGroup.name = 'integratedPipes';
        
        // 管道材质
        const pipeMaterial = new THREE.MeshPhongMaterial({
            color: 0xD4AF37, // 金色，表示石膏浆液
            shininess: 60,
            specular: 0x444444
        });
        
        // 创建进水管道系统（从二级塔到泵）
        this.createInletPipeSystem(pipeGroup, pipeMaterial);
        
        // 创建出水管道系统（从泵到一级塔）
        this.createOutletPipeSystem(pipeGroup, pipeMaterial);
        
        this.group.add(pipeGroup);
    }
    
    /**
     * 创建进水管道系统
     */
    createInletPipeSystem(pipeGroup, pipeMaterial) {
        // 泵左侧连接口
        const pumpLeftX = -this.config.pumpLength / 2;
        const pumpY = this.config.baseHeight + this.config.pumpHeight / 2;
        
        // 二级塔连接点（相对于泵的位置）
        const secondaryTowerX = 15; // 二级塔相对于泵的X偏移
        const secondaryTowerY = 2;  // 二级塔底部高度
        const secondaryTowerZ = 0;  // 同一Z平面
        
        // 水平管段1：从二级塔到中间转折点
        const horizontalPipe1Length = 10;
        const horizontalPipe1 = new THREE.CylinderGeometry(
            this.config.pipeRadius, this.config.pipeRadius, horizontalPipe1Length, 12
        );
        const horizontalPipe1Mesh = new THREE.Mesh(horizontalPipe1, pipeMaterial);
        horizontalPipe1Mesh.position.set(
            secondaryTowerX - horizontalPipe1Length / 2,
            secondaryTowerY,
            secondaryTowerZ
        );
        horizontalPipe1Mesh.rotation.z = Math.PI / 2;
        horizontalPipe1Mesh.castShadow = true;
        pipeGroup.add(horizontalPipe1Mesh);
        
        // 垂直管段：从二级塔高度降到泵高度
        const verticalPipeHeight = Math.abs(secondaryTowerY - pumpY);
        const verticalPipe = new THREE.CylinderGeometry(
            this.config.pipeRadius, this.config.pipeRadius, verticalPipeHeight, 12
        );
        const verticalPipeMesh = new THREE.Mesh(verticalPipe, pipeMaterial);
        verticalPipeMesh.position.set(
            secondaryTowerX - horizontalPipe1Length,
            pumpY + verticalPipeHeight / 2,
            secondaryTowerZ
        );
        verticalPipeMesh.castShadow = true;
        pipeGroup.add(verticalPipeMesh);
        
        // 水平管段2：从转折点到泵进水口
        const horizontalPipe2Length = Math.abs((secondaryTowerX - horizontalPipe1Length) - pumpLeftX);
        const horizontalPipe2 = new THREE.CylinderGeometry(
            this.config.pipeRadius, this.config.pipeRadius, horizontalPipe2Length, 12
        );
        const horizontalPipe2Mesh = new THREE.Mesh(horizontalPipe2, pipeMaterial);
        horizontalPipe2Mesh.position.set(
            pumpLeftX + horizontalPipe2Length / 2,
            pumpY,
            secondaryTowerZ
        );
        horizontalPipe2Mesh.rotation.z = Math.PI / 2;
        horizontalPipe2Mesh.castShadow = true;
        pipeGroup.add(horizontalPipe2Mesh);
        
        // 90度弯头连接处
        this.createElbow(pipeGroup, pipeMaterial, 
            secondaryTowerX - horizontalPipe1Length, pumpY + verticalPipeHeight, secondaryTowerZ,
            'down-left'
        );
        this.createElbow(pipeGroup, pipeMaterial,
            secondaryTowerX - horizontalPipe1Length, pumpY, secondaryTowerZ,
            'left-left'
        );
    }
    
    /**
     * 创建出水管道系统
     */
    createOutletPipeSystem(pipeGroup, pipeMaterial) {
        // 泵右侧连接口
        const pumpRightX = this.config.pumpLength / 2;
        const pumpY = this.config.baseHeight + this.config.pumpHeight / 2;
        
        // 一级塔连接点（相对于泵的位置）
        const primaryTowerX = -15; // 一级塔相对于泵的X偏移
        const primaryTowerY = 2;   // 一级塔底部高度
        const primaryTowerZ = 0;   // 同一Z平面
        
        // 水平管段1：从泵出水口到中间转折点
        const horizontalPipe1Length = 5;
        const horizontalPipe1 = new THREE.CylinderGeometry(
            this.config.pipeRadius, this.config.pipeRadius, horizontalPipe1Length, 12
        );
        const horizontalPipe1Mesh = new THREE.Mesh(horizontalPipe1, pipeMaterial);
        horizontalPipe1Mesh.position.set(
            pumpRightX + horizontalPipe1Length / 2,
            pumpY,
            primaryTowerZ
        );
        horizontalPipe1Mesh.rotation.z = Math.PI / 2;
        horizontalPipe1Mesh.castShadow = true;
        pipeGroup.add(horizontalPipe1Mesh);
        
        // 垂直管段：从泵高度升到一级塔高度
        const verticalPipeHeight = Math.abs(primaryTowerY - pumpY);
        const verticalPipe = new THREE.CylinderGeometry(
            this.config.pipeRadius, this.config.pipeRadius, verticalPipeHeight, 12
        );
        const verticalPipeMesh = new THREE.Mesh(verticalPipe, pipeMaterial);
        verticalPipeMesh.position.set(
            pumpRightX + horizontalPipe1Length,
            pumpY + verticalPipeHeight / 2,
            primaryTowerZ
        );
        verticalPipeMesh.castShadow = true;
        pipeGroup.add(verticalPipeMesh);
        
        // 水平管段2：从转折点到一级塔
        const horizontalPipe2Length = Math.abs(primaryTowerX - (pumpRightX + horizontalPipe1Length));
        const horizontalPipe2 = new THREE.CylinderGeometry(
            this.config.pipeRadius, this.config.pipeRadius, horizontalPipe2Length, 12
        );
        const horizontalPipe2Mesh = new THREE.Mesh(horizontalPipe2, pipeMaterial);
        horizontalPipe2Mesh.position.set(
            primaryTowerX + horizontalPipe2Length / 2,
            primaryTowerY,
            primaryTowerZ
        );
        horizontalPipe2Mesh.rotation.z = Math.PI / 2;
        horizontalPipe2Mesh.castShadow = true;
        pipeGroup.add(horizontalPipe2Mesh);
        
        // 90度弯头连接处
        this.createElbow(pipeGroup, pipeMaterial,
            pumpRightX + horizontalPipe1Length, pumpY + verticalPipeHeight, primaryTowerZ,
            'up-left'
        );
        this.createElbow(pipeGroup, pipeMaterial,
            pumpRightX + horizontalPipe1Length, primaryTowerY, primaryTowerZ,
            'left-left'
        );
    }
    
    /**
     * 创建90度弯头
     */
    createElbow(pipeGroup, pipeMaterial, x, y, z, direction) {
        const elbowGeometry = new THREE.TorusGeometry(
            this.config.pipeRadius + 0.1,
            this.config.pipeRadius,
            8, 16, Math.PI / 2
        );
        const elbowMesh = new THREE.Mesh(elbowGeometry, pipeMaterial);
        elbowMesh.position.set(x, y, z);
        
        // 根据方向调整弯头朝向
        switch (direction) {
            case 'down-left':
                elbowMesh.rotation.set(0, 0, Math.PI);
                break;
            case 'up-left':
                elbowMesh.rotation.set(0, 0, Math.PI / 2);
                break;
            case 'left-left':
                elbowMesh.rotation.set(Math.PI / 2, 0, 0);
                break;
        }
        
        elbowMesh.castShadow = true;
        pipeGroup.add(elbowMesh);
    }
    
    /**
     * 创建标签
     */
    createLabel() {
        const labelSprite = this.createLabelSprite(this.config.name);
        labelSprite.position.set(
            0,
            this.config.baseHeight + this.config.pumpHeight + 2.5,
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
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.config.name,
            position: this.config.position,
            type: 'IntegratedSystem',
            components: ['pump', 'inletPipes', 'outletPipes']
        };
    }
}