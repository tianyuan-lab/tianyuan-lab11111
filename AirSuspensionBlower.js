/**
 * 空气悬浮风机 - 二级塔专用高效风机系统
 * 与磁悬浮风机结构不同，采用空气悬浮技术
 */
class AirSuspensionBlower {
    constructor(config = {}) {
        this.config = {
            name: config.name || '空气悬浮风机',
            position: config.position || { x: 0, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            scale: config.scale || 1.0,
            
            // 风机尺寸配置 - 与磁悬浮风机不同的尺寸
            casingWidth: config.casingWidth || 4.2,  // 更宽的机身
            casingHeight: config.casingHeight || 3.2, // 更高的机身
            casingDepth: config.casingDepth || 2.8,  // 更深的机身
            
            // 进风口配置 - 双进风设计
            inletDiameter: config.inletDiameter || 1.6,
            
            // 出风口配置 - 矩形出风口
            outletWidth: config.outletWidth || 1.5,
            outletHeight: config.outletHeight || 1.0,
            
            // 控制柜配置 - 更现代化的设计
            controlPanelWidth: config.controlPanelWidth || 1.8,
            controlPanelHeight: config.controlPanelHeight || 2.4,
            controlPanelDepth: config.controlPanelDepth || 0.8,
            
            ...config
        };

        this.group = new THREE.Group();
        this.group.name = this.config.name;
        
        // 材质定义 - 与磁悬浮风机不同的材质配色
        this.materials = {
            // 风机机壳 - 高级铝镁合金材质（更亮的银色）
            casing: new THREE.MeshStandardMaterial({
                color: 0xF0F0F0,
                metalness: 0.8,
                roughness: 0.2,
                envMapIntensity: 1.2
            }),
            
            // 进出风口 - 钛合金材质（略带蓝色）
            ductwork: new THREE.MeshStandardMaterial({
                color: 0xC8D2DC,
                metalness: 0.85,
                roughness: 0.15,
                envMapIntensity: 1.1
            }),
            
            // 控制柜 - 现代化黑色金属面板
            controlPanel: new THREE.MeshStandardMaterial({
                color: 0x2C3E50,
                metalness: 0.6,
                roughness: 0.4,
                envMapIntensity: 0.8
            }),
            
            // 基础 - 高强度混凝土
            foundation: new THREE.MeshStandardMaterial({
                color: 0x95A5A6,
                metalness: 0.1,
                roughness: 0.8,
                envMapIntensity: 0.3
            }),
            
            // 管道连接 - 不锈钢
            pipe: new THREE.MeshStandardMaterial({
                color: 0xBDC3C7,
                metalness: 0.75,
                roughness: 0.25,
                envMapIntensity: 1.0
            }),
            
            // 特殊装饰 - 警示色
            accent: new THREE.MeshStandardMaterial({
                color: 0xE74C3C,
                metalness: 0.3,
                roughness: 0.6,
                envMapIntensity: 0.7
            })
        };

        this.initialize();
    }

    initialize() {
        try {
            // 创建风机基础
            this.createFoundation();
            
            // 创建主机壳
            this.createMainCasing();
            
            // 创建双进风口
            this.createDualInlets();
            
            // 创建矩形出风口
            this.createRectangularOutlet();
            
            // 创建现代化控制柜
            this.createModernControlPanel();
            
            // 创建空气悬浮系统特有的支撑结构
            this.createAirSuspensionSupport();
            
            // 创建连接管道
            this.createConnectingPipe();
            
            // 创建装饰细节
            this.createAirSuspensionDetails();
            
            // 创建标签
            this.createLabel();
            
            // 应用位置、旋转和缩放
            this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
            this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);
            this.group.scale.setScalar(this.config.scale);
            
            console.log(`✅ ${this.config.name} 创建成功`);
            
        } catch (error) {
            console.error(`❌ ${this.config.name} 创建失败:`, error);
            throw error;
        }
    }

    /**
     * 创建风机基础底座 - 空气悬浮风机特有的圆形基础
     */
    createFoundation() {
        const foundationGroup = new THREE.Group();
        foundationGroup.name = '空气悬浮风机基础';
        
        // 圆形主基础平台
        const mainFoundationGeometry = new THREE.CylinderGeometry(
            this.config.casingWidth / 2 + 0.8,
            this.config.casingWidth / 2 + 1.0,
            0.4,
            32
        );
        const mainFoundation = new THREE.Mesh(mainFoundationGeometry, this.materials.foundation);
        mainFoundation.position.set(0, 0.2, 0);
        mainFoundation.castShadow = true;
        mainFoundation.receiveShadow = true;
        foundationGroup.add(mainFoundation);
        
        // 空气悬浮特有的气垫支撑（8个）
        const airPadGeometry = new THREE.CylinderGeometry(0.2, 0.25, 0.15, 8);
        const airPadMaterial = new THREE.MeshStandardMaterial({
            color: 0x3498DB,
            metalness: 0.4,
            roughness: 0.3
        });
        
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = this.config.casingWidth / 2 + 0.5;
            const airPad = new THREE.Mesh(airPadGeometry, airPadMaterial);
            airPad.position.set(
                Math.cos(angle) * radius,
                0.475,
                Math.sin(angle) * radius
            );
            airPad.castShadow = true;
            foundationGroup.add(airPad);
        }
        
        this.group.add(foundationGroup);
    }

    /**
     * 创建主机壳 - 流线型设计
     */
    createMainCasing() {
        const casingGroup = new THREE.Group();
        casingGroup.name = '主机壳';
        
        // 流线型主机壳（椭圆形状）
        const mainCasingGeometry = new THREE.SphereGeometry(
            this.config.casingWidth / 2,
            32,
            16
        );
        mainCasingGeometry.scale(1, this.config.casingHeight / this.config.casingWidth, this.config.casingDepth / this.config.casingWidth);
        
        const mainCasing = new THREE.Mesh(mainCasingGeometry, this.materials.casing);
        mainCasing.position.set(0, this.config.casingHeight / 2 + 0.4, 0);
        mainCasing.castShadow = true;
        casingGroup.add(mainCasing);
        
        // 机壳顶部散热翅片
        for (let i = 0; i < 12; i++) {
            const angle = (i / 12) * Math.PI * 2;
            const finGeometry = new THREE.BoxGeometry(0.05, 0.3, 0.8);
            const fin = new THREE.Mesh(finGeometry, this.materials.casing);
            fin.position.set(
                Math.cos(angle) * (this.config.casingWidth / 2 - 0.1),
                this.config.casingHeight + 0.25,
                Math.sin(angle) * (this.config.casingWidth / 2 - 0.1)
            );
            fin.rotation.y = angle;
            fin.castShadow = true;
            casingGroup.add(fin);
        }
        
        this.group.add(casingGroup);
    }

    /**
     * 创建双进风口
     */
    createDualInlets() {
        const inletGroup = new THREE.Group();
        inletGroup.name = '双进风口';
        
        // 左右两个进风口
        const positions = [
            { x: -this.config.casingWidth / 2 - 0.3, y: 0 },
            { x: this.config.casingWidth / 2 + 0.3, y: 0 }
        ];
        
        positions.forEach((pos, index) => {
            const inletGeometry = new THREE.CylinderGeometry(
                this.config.inletDiameter / 2,
                this.config.inletDiameter / 2 + 0.1,
                0.6,
                16
            );
            const inlet = new THREE.Mesh(inletGeometry, this.materials.ductwork);
            inlet.position.set(pos.x, this.config.casingHeight / 2 + 0.4, 0);
            inlet.rotation.z = Math.PI / 2;
            inlet.castShadow = true;
            inletGroup.add(inlet);
            
            // 进风口防护网
            const guardGeometry = new THREE.CylinderGeometry(
                this.config.inletDiameter / 2 - 0.05,
                this.config.inletDiameter / 2 - 0.05,
                0.02,
                16
            );
            const guard = new THREE.Mesh(guardGeometry, this.materials.accent);
            guard.position.set(pos.x - (index === 0 ? 0.31 : -0.31), this.config.casingHeight / 2 + 0.4, 0);
            guard.rotation.z = Math.PI / 2;
            inletGroup.add(guard);
        });
        
        this.group.add(inletGroup);
    }

    /**
     * 创建矩形出风口
     */
    createRectangularOutlet() {
        const outletGroup = new THREE.Group();
        outletGroup.name = '矩形出风口';
        
        // 矩形出风口主体
        const outletGeometry = new THREE.BoxGeometry(
            this.config.outletWidth,
            this.config.outletHeight,
            0.8
        );
        const outlet = new THREE.Mesh(outletGeometry, this.materials.ductwork);
        outlet.position.set(0, this.config.casingHeight / 2 + 0.4, this.config.casingDepth / 2 + 0.4);
        outlet.castShadow = true;
        outletGroup.add(outlet);
        
        // 出风口导流板
        for (let i = 0; i < 5; i++) {
            const vaneGeometry = new THREE.BoxGeometry(this.config.outletWidth - 0.2, 0.02, 0.6);
            const vane = new THREE.Mesh(vaneGeometry, this.materials.casing);
            vane.position.set(
                0,
                this.config.casingHeight / 2 + 0.4 + (i - 2) * 0.18,
                this.config.casingDepth / 2 + 0.4
            );
            vane.rotation.x = Math.PI / 12;
            outletGroup.add(vane);
        }
        
        this.group.add(outletGroup);
    }

    /**
     * 创建现代化控制柜
     */
    createModernControlPanel() {
        const panelGroup = new THREE.Group();
        panelGroup.name = '现代化控制柜';
        
        // 主控制柜
        const panelGeometry = new THREE.BoxGeometry(
            this.config.controlPanelWidth,
            this.config.controlPanelHeight,
            this.config.controlPanelDepth
        );
        const panel = new THREE.Mesh(panelGeometry, this.materials.controlPanel);
        panel.position.set(
            this.config.casingWidth / 2 + this.config.controlPanelWidth / 2 + 0.5,
            this.config.controlPanelHeight / 2 + 0.4,
            0
        );
        panel.castShadow = true;
        panelGroup.add(panel);
        
        // 控制面板屏幕
        const screenGeometry = new THREE.BoxGeometry(0.6, 0.4, 0.02);
        const screenMaterial = new THREE.MeshStandardMaterial({
            color: 0x1ABC9C,
            emissive: 0x0A5D4F,
            emissiveIntensity: 0.3
        });
        const screen = new THREE.Mesh(screenGeometry, screenMaterial);
        screen.position.set(
            this.config.casingWidth / 2 + this.config.controlPanelWidth / 2 + 0.5,
            this.config.controlPanelHeight / 2 + 0.8,
            this.config.controlPanelDepth / 2 + 0.01
        );
        panelGroup.add(screen);
        
        // 控制按钮
        for (let i = 0; i < 8; i++) {
            const buttonGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8);
            const buttonMaterial = new THREE.MeshStandardMaterial({
                color: i % 2 === 0 ? 0xE74C3C : 0x27AE60,
                emissive: i % 2 === 0 ? 0x8B0000 : 0x0F5132,
                emissiveIntensity: 0.2
            });
            const button = new THREE.Mesh(buttonGeometry, buttonMaterial);
            button.position.set(
                this.config.casingWidth / 2 + this.config.controlPanelWidth / 2 + 0.5 + (i % 4 - 1.5) * 0.1,
                this.config.controlPanelHeight / 2 + 0.4 + Math.floor(i / 4) * 0.1,
                this.config.controlPanelDepth / 2 + 0.02
            );
            button.rotation.x = Math.PI / 2;
            panelGroup.add(button);
        }
        
        this.group.add(panelGroup);
    }

    /**
     * 创建空气悬浮系统特有的支撑结构
     */
    createAirSuspensionSupport() {
        const supportGroup = new THREE.Group();
        supportGroup.name = '空气悬浮支撑系统';
        
        // 空气管道（连接8个气垫）
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const radius = this.config.casingWidth / 2 + 0.5;
            
            const pipeGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.8, 8);
            const pipe = new THREE.Mesh(pipeGeometry, this.materials.pipe);
            pipe.position.set(
                Math.cos(angle) * radius,
                0.8,
                Math.sin(angle) * radius
            );
            supportGroup.add(pipe);
        }
        
        // 中央空气分配器
        const distributorGeometry = new THREE.CylinderGeometry(0.3, 0.4, 0.2, 16);
        const distributor = new THREE.Mesh(distributorGeometry, this.materials.casing);
        distributor.position.set(0, 1.2, 0);
        distributor.castShadow = true;
        supportGroup.add(distributor);
        
        this.group.add(supportGroup);
    }

    /**
     * 创建连接管道
     */
    createConnectingPipe() {
        const pipeGroup = new THREE.Group();
        pipeGroup.name = '连接管道';
        
        // 主连接管道
        const mainPipeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 1.5, 12);
        const mainPipe = new THREE.Mesh(mainPipeGeometry, this.materials.pipe);
        mainPipe.position.set(0, this.config.casingHeight / 2 + 0.4, this.config.casingDepth / 2 + 1.15);
        mainPipe.rotation.x = Math.PI / 2;
        mainPipe.castShadow = true;
        pipeGroup.add(mainPipe);
        
        this.group.add(pipeGroup);
    }

    /**
     * 创建空气悬浮风机特有的装饰细节
     */
    createAirSuspensionDetails() {
        const detailGroup = new THREE.Group();
        detailGroup.name = '装饰细节';
        
        // 空气悬浮标识条纹
        for (let i = 0; i < 4; i++) {
            const stripeGeometry = new THREE.BoxGeometry(this.config.casingWidth + 0.1, 0.05, 0.02);
            const stripe = new THREE.Mesh(stripeGeometry, this.materials.accent);
            stripe.position.set(0, this.config.casingHeight / 4 + 0.4 + i * 0.3, this.config.casingDepth / 2 + 0.01);
            detailGroup.add(stripe);
        }
        
        // 警示标识
        const warningGeometry = new THREE.BoxGeometry(0.3, 0.3, 0.02);
        const warningMaterial = new THREE.MeshStandardMaterial({
            color: 0xF39C12,
            emissive: 0xD68910,
            emissiveIntensity: 0.2
        });
        const warning = new THREE.Mesh(warningGeometry, warningMaterial);
        warning.position.set(
            -this.config.casingWidth / 2 + 0.2,
            this.config.casingHeight + 0.2,
            this.config.casingDepth / 2 + 0.01
        );
        detailGroup.add(warning);
        
        this.group.add(detailGroup);
    }

    /**
     * 创建设备标签
     */
    createLabel() {
        const labelGroup = new THREE.Group();
        labelGroup.name = 'airSuspensionBlowerLabel';
        
        const labelSprite = this.createLabelSprite('空气悬浮风机', '#3498DB');
        labelSprite.position.set(0, this.config.casingHeight + 2, 0);
        labelGroup.add(labelSprite);
        
        this.group.add(labelGroup);
    }

    /**
     * 创建标签精灵
     */
    createLabelSprite(text, color = '#FFFFFF') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 320;
        canvas.height = 100;
        
        context.font = 'Bold 36px Microsoft YaHei, Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.fill();
        
        context.strokeStyle = color;
        context.lineWidth = 3;
        this.roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
        context.stroke();
        
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95,
            alphaTest: 0.01
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(12, 4, 1);
        sprite.name = `label_${text}`;
        
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
            type: '空气悬浮风机',
            position: this.config.position,
            dimensions: {
                width: this.config.casingWidth,
                height: this.config.casingHeight,
                depth: this.config.casingDepth
            },
            features: [
                '空气悬浮技术',
                '双进风口设计',
                '矩形出风口',
                '现代化控制系统',
                '低噪音运行',
                '高效节能'
            ]
        };
    }
}