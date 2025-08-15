/**
 * 磁悬浮风机 - 高效离心风机系统
 * 根据结构图和实物图片设计的工业级磁悬浮风机
 */
class MagneticBlower {
    constructor(config = {}) {
        this.config = {
            name: config.name || '磁悬浮风机',
            position: config.position || { x: 0, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            scale: config.scale || 1.0,
            
            // 风机尺寸配置
            casingWidth: config.casingWidth || 3.5,
            casingHeight: config.casingHeight || 2.8,
            casingDepth: config.casingDepth || 2.2,
            
            // 进风口配置
            inletDiameter: config.inletDiameter || 1.8,
            
            // 出风口配置
            outletWidth: config.outletWidth || 1.2,
            outletHeight: config.outletHeight || 0.8,
            
            // 控制柜配置
            controlPanelWidth: config.controlPanelWidth || 1.5,
            controlPanelHeight: config.controlPanelHeight || 2.0,
            controlPanelDepth: config.controlPanelDepth || 0.6,
            
            ...config
        };

        this.group = new THREE.Group();
        this.group.name = this.config.name;
        
        // 材质定义
        this.materials = {
            // 风机机壳 - 铝合金材质
            casing: new THREE.MeshStandardMaterial({
                color: 0xE8E8E8,
                metalness: 0.7,
                roughness: 0.3,
                envMapIntensity: 1.0
            }),
            
            // 进出风口 - 不锈钢材质
            ductwork: new THREE.MeshStandardMaterial({
                color: 0xD4D4D4,
                metalness: 0.8,
                roughness: 0.2,
                envMapIntensity: 1.2
            }),
            
            // 控制面板 - 电气柜灰色
            controlPanel: new THREE.MeshStandardMaterial({
                color: 0xC0C0C0,
                metalness: 0.4,
                roughness: 0.6,
                envMapIntensity: 0.8
            }),
            
            // 基础底座 - 混凝土色
            foundation: new THREE.MeshStandardMaterial({
                color: 0x8B8B8B,
                metalness: 0.1,
                roughness: 0.9,
                envMapIntensity: 0.3
            }),
            
            // 管道 - 钢管材质
            pipe: new THREE.MeshStandardMaterial({
                color: 0x4A90E2,
                metalness: 0.6,
                roughness: 0.4,
                envMapIntensity: 1.0
            }),
            
            // 法兰 - 铸铁材质
            flange: new THREE.MeshStandardMaterial({
                color: 0x555555,
                metalness: 0.5,
                roughness: 0.7,
                envMapIntensity: 0.6
            }),
            
            // 螺栓 - 钢材质
            bolt: new THREE.MeshStandardMaterial({
                color: 0x444444,
                metalness: 0.8,
                roughness: 0.3,
                envMapIntensity: 1.0
            }),
            
            // 显示屏/仪表 - 黑色材质
            display: new THREE.MeshStandardMaterial({
                color: 0x1A1A1A,
                metalness: 0.1,
                roughness: 0.1,
                envMapIntensity: 0.2
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
            
            // 创建进风口
            this.createInlet();
            
            // 创建出风口
            this.createOutlet();
            
            // 创建控制柜
            this.createControlPanel();
            
            // 创建连接管道
            this.createConnectingPipe();
            
            // 创建支撑结构
            this.createSupportStructure();
            
            // 创建细节装饰
            this.createDetails();
            
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
     * 创建风机基础底座
     */
    createFoundation() {
        const foundationGroup = new THREE.Group();
        foundationGroup.name = '风机基础';
        
        // 主基础平台
        const mainFoundationGeometry = new THREE.BoxGeometry(
            this.config.casingWidth + 1.0,
            0.3,
            this.config.casingDepth + 1.0
        );
        const mainFoundation = new THREE.Mesh(mainFoundationGeometry, this.materials.foundation);
        mainFoundation.position.set(0, 0.15, 0);
        mainFoundation.castShadow = true;
        mainFoundation.receiveShadow = true;
        foundationGroup.add(mainFoundation);
        
        // 减震垫块（4个角）
        const padGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
        const positions = [
            { x: (this.config.casingWidth + 0.5) / 2, z: (this.config.casingDepth + 0.5) / 2 },
            { x: -(this.config.casingWidth + 0.5) / 2, z: (this.config.casingDepth + 0.5) / 2 },
            { x: (this.config.casingWidth + 0.5) / 2, z: -(this.config.casingDepth + 0.5) / 2 },
            { x: -(this.config.casingWidth + 0.5) / 2, z: -(this.config.casingDepth + 0.5) / 2 }
        ];
        
        positions.forEach((pos, index) => {
            const pad = new THREE.Mesh(padGeometry, this.materials.casing);
            pad.position.set(pos.x, 0.35, pos.z);
            pad.castShadow = true;
            foundationGroup.add(pad);
        });
        
        this.group.add(foundationGroup);
    }

    /**
     * 创建主机壳
     */
    createMainCasing() {
        const casingGroup = new THREE.Group();
        casingGroup.name = '主机壳';
        
        // 主机壳本体
        const mainCasingGeometry = new THREE.BoxGeometry(
            this.config.casingWidth,
            this.config.casingHeight,
            this.config.casingDepth
        );
        const mainCasing = new THREE.Mesh(mainCasingGeometry, this.materials.casing);
        mainCasing.position.set(0, this.config.casingHeight / 2 + 0.3, 0);
        mainCasing.castShadow = true;
        mainCasing.receiveShadow = true;
        casingGroup.add(mainCasing);
        
        // 机壳顶部盖板
        const topCoverGeometry = new THREE.BoxGeometry(
            this.config.casingWidth + 0.1,
            0.15,
            this.config.casingDepth + 0.1
        );
        const topCover = new THREE.Mesh(topCoverGeometry, this.materials.casing);
        topCover.position.set(0, this.config.casingHeight + 0.3 + 0.075, 0);
        topCover.castShadow = true;
        casingGroup.add(topCover);
        
        // 散热肋片
        for (let i = 0; i < 8; i++) {
            const finGeometry = new THREE.BoxGeometry(0.05, this.config.casingHeight * 0.8, 0.3);
            const fin = new THREE.Mesh(finGeometry, this.materials.casing);
            fin.position.set(
                this.config.casingWidth / 2 + 0.025,
                this.config.casingHeight / 2 + 0.3,
                -this.config.casingDepth / 2 + 0.3 + i * 0.25
            );
            fin.castShadow = true;
            casingGroup.add(fin);
        }
        
        // 检修门
        const doorGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.05);
        const door = new THREE.Mesh(doorGeometry, this.materials.controlPanel);
        door.position.set(-this.config.casingWidth / 2 - 0.025, this.config.casingHeight / 2 + 0.3, 0);
        door.castShadow = true;
        casingGroup.add(door);
        
        // 门把手
        const handleGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.15, 8);
        const handle = new THREE.Mesh(handleGeometry, this.materials.bolt);
        handle.rotation.z = Math.PI / 2;
        handle.position.set(-this.config.casingWidth / 2 - 0.075, this.config.casingHeight / 2 + 0.3, 0.2);
        casingGroup.add(handle);
        
        this.group.add(casingGroup);
    }

    /**
     * 创建进风口
     */
    createInlet() {
        const inletGroup = new THREE.Group();
        inletGroup.name = '进风口';
        
        // 进风管道
        const inletGeometry = new THREE.CylinderGeometry(
            this.config.inletDiameter / 2,
            this.config.inletDiameter / 2,
            0.8,
            32
        );
        const inlet = new THREE.Mesh(inletGeometry, this.materials.ductwork);
        inlet.rotation.x = Math.PI / 2;
        inlet.position.set(0, this.config.casingHeight + 0.3, -this.config.casingDepth / 2 - 0.4);
        inlet.castShadow = true;
        inlet.receiveShadow = true;
        inletGroup.add(inlet);
        
        // 进风口法兰
        const inletFlangeGeometry = new THREE.CylinderGeometry(
            this.config.inletDiameter / 2 + 0.1,
            this.config.inletDiameter / 2 + 0.1,
            0.08,
            32
        );
        const inletFlange = new THREE.Mesh(inletFlangeGeometry, this.materials.flange);
        inletFlange.rotation.x = Math.PI / 2;
        inletFlange.position.set(0, this.config.casingHeight + 0.3, -this.config.casingDepth / 2 - 0.8);
        inletFlange.castShadow = true;
        inletGroup.add(inletFlange);
        
        // 进风口螺栓
        for (let i = 0; i < 8; i++) {
            const angle = (i / 8) * Math.PI * 2;
            const boltGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
            const bolt = new THREE.Mesh(boltGeometry, this.materials.bolt);
            bolt.rotation.x = Math.PI / 2;
            bolt.position.set(
                Math.cos(angle) * (this.config.inletDiameter / 2 + 0.08),
                this.config.casingHeight + 0.3,
                -this.config.casingDepth / 2 - 0.8
            );
            inletGroup.add(bolt);
        }
        
        // 进风口滤网
        const filterGeometry = new THREE.CylinderGeometry(
            this.config.inletDiameter / 2 - 0.05,
            this.config.inletDiameter / 2 - 0.05,
            0.05,
            32
        );
        const filter = new THREE.Mesh(filterGeometry, this.materials.controlPanel);
        filter.rotation.x = Math.PI / 2;
        filter.position.set(0, this.config.casingHeight + 0.3, -this.config.casingDepth / 2 - 0.85);
        inletGroup.add(filter);
        
        this.group.add(inletGroup);
    }

    /**
     * 创建出风口
     */
    createOutlet() {
        const outletGroup = new THREE.Group();
        outletGroup.name = '出风口';
        
        // 出风口矩形管道
        const outletGeometry = new THREE.BoxGeometry(
            this.config.outletWidth,
            this.config.outletHeight,
            0.6
        );
        const outlet = new THREE.Mesh(outletGeometry, this.materials.ductwork);
        outlet.position.set(this.config.casingWidth / 2 + 0.3, this.config.casingHeight / 2 + 0.3, 0);
        outlet.castShadow = true;
        outlet.receiveShadow = true;
        outletGroup.add(outlet);
        
        // 出风口法兰
        const outletFlangeGeometry = new THREE.BoxGeometry(
            this.config.outletWidth + 0.2,
            this.config.outletHeight + 0.2,
            0.08
        );
        const outletFlange = new THREE.Mesh(outletFlangeGeometry, this.materials.flange);
        outletFlange.position.set(this.config.casingWidth / 2 + 0.64, this.config.casingHeight / 2 + 0.3, 0);
        outletFlange.castShadow = true;
        outletGroup.add(outletFlange);
        
        // 出风口螺栓
        const boltPositions = [
            { x: this.config.outletWidth / 2 + 0.08, y: this.config.outletHeight / 2 + 0.08 },
            { x: -this.config.outletWidth / 2 - 0.08, y: this.config.outletHeight / 2 + 0.08 },
            { x: this.config.outletWidth / 2 + 0.08, y: -this.config.outletHeight / 2 - 0.08 },
            { x: -this.config.outletWidth / 2 - 0.08, y: -this.config.outletHeight / 2 - 0.08 }
        ];
        
        boltPositions.forEach(pos => {
            const boltGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.12, 8);
            const bolt = new THREE.Mesh(boltGeometry, this.materials.bolt);
            bolt.rotation.z = Math.PI / 2;
            bolt.position.set(
                this.config.casingWidth / 2 + 0.64,
                this.config.casingHeight / 2 + 0.3 + pos.y,
                pos.x
            );
            outletGroup.add(bolt);
        });
        
        this.group.add(outletGroup);
    }

    /**
     * 创建控制柜
     */
    createControlPanel() {
        const controlGroup = new THREE.Group();
        controlGroup.name = '控制柜';
        
        // 控制柜主体
        const panelGeometry = new THREE.BoxGeometry(
            this.config.controlPanelWidth,
            this.config.controlPanelHeight,
            this.config.controlPanelDepth
        );
        const panel = new THREE.Mesh(panelGeometry, this.materials.controlPanel);
        panel.position.set(
            -this.config.casingWidth / 2 - this.config.controlPanelWidth / 2 - 0.5,
            this.config.controlPanelHeight / 2 + 0.3,
            0
        );
        panel.castShadow = true;
        panel.receiveShadow = true;
        controlGroup.add(panel);
        
        // 控制面板前门
        const doorGeometry = new THREE.BoxGeometry(
            this.config.controlPanelWidth - 0.1,
            this.config.controlPanelHeight - 0.2,
            0.05
        );
        const door = new THREE.Mesh(doorGeometry, this.materials.casing);
        door.position.set(
            -this.config.casingWidth / 2 - this.config.controlPanelWidth / 2 - 0.5,
            this.config.controlPanelHeight / 2 + 0.3,
            this.config.controlPanelDepth / 2 + 0.025
        );
        door.castShadow = true;
        controlGroup.add(door);
        
        // 显示屏
        const displayGeometry = new THREE.BoxGeometry(0.4, 0.25, 0.02);
        const display = new THREE.Mesh(displayGeometry, this.materials.display);
        display.position.set(
            -this.config.casingWidth / 2 - this.config.controlPanelWidth / 2 - 0.5,
            this.config.controlPanelHeight / 2 + 0.6,
            this.config.controlPanelDepth / 2 + 0.06
        );
        controlGroup.add(display);
        
        // 控制按钮
        for (let i = 0; i < 6; i++) {
            const buttonGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.04, 16);
            const button = new THREE.Mesh(buttonGeometry, this.materials.bolt);
            button.rotation.x = Math.PI / 2;
            button.position.set(
                -this.config.casingWidth / 2 - this.config.controlPanelWidth / 2 - 0.5 + (i % 3 - 1) * 0.15,
                this.config.controlPanelHeight / 2 + 0.3 - Math.floor(i / 3) * 0.15,
                this.config.controlPanelDepth / 2 + 0.07
            );
            controlGroup.add(button);
        }
        
        // 指示灯
        for (let i = 0; i < 4; i++) {
            const lightGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.03, 16);
            const lightColors = [0xFF0000, 0x00FF00, 0xFFFF00, 0x0000FF];
            const lightMaterial = new THREE.MeshStandardMaterial({
                color: lightColors[i],
                metalness: 0.1,
                roughness: 0.2,
                emissive: lightColors[i],
                emissiveIntensity: 0.3
            });
            const light = new THREE.Mesh(lightGeometry, lightMaterial);
            light.rotation.x = Math.PI / 2;
            light.position.set(
                -this.config.casingWidth / 2 - this.config.controlPanelWidth / 2 - 0.5 + (i - 1.5) * 0.1,
                this.config.controlPanelHeight / 2 + 0.8,
                this.config.controlPanelDepth / 2 + 0.065
            );
            controlGroup.add(light);
        }
        
        this.group.add(controlGroup);
    }

    /**
     * 创建连接管道
     */
    createConnectingPipe() {
        const pipeGroup = new THREE.Group();
        pipeGroup.name = '连接管道';
        
        // 出风口到主管道的弯头
        const elbowGeometry = new THREE.TorusGeometry(0.4, 0.15, 8, 16, Math.PI / 2);
        const elbow = new THREE.Mesh(elbowGeometry, this.materials.pipe);
        elbow.rotation.z = Math.PI / 2;
        elbow.position.set(this.config.casingWidth / 2 + 0.8, this.config.casingHeight / 2 + 0.3, 0);
        elbow.castShadow = true;
        pipeGroup.add(elbow);
        
        // 存储出风口位置，供主场景使用
        this.outletPosition = {
            x: this.config.casingWidth / 2 + 1.2,
            y: this.config.casingHeight / 2 + 0.3,
            z: 0
        };
        
        this.group.add(pipeGroup);
    }

    /**
     * 创建支撑结构
     */
    createSupportStructure() {
        const supportGroup = new THREE.Group();
        supportGroup.name = '支撑结构';
        
        // 机壳支撑腿
        for (let i = 0; i < 4; i++) {
            const legGeometry = new THREE.BoxGeometry(0.1, this.config.casingHeight * 0.3, 0.1);
            const leg = new THREE.Mesh(legGeometry, this.materials.casing);
            const angle = (i / 4) * Math.PI * 2;
            leg.position.set(
                Math.cos(angle) * this.config.casingWidth * 0.3,
                this.config.casingHeight * 0.15 + 0.3,
                Math.sin(angle) * this.config.casingDepth * 0.3
            );
            leg.castShadow = true;
            supportGroup.add(leg);
        }
        
        this.group.add(supportGroup);
    }

    /**
     * 创建细节装饰
     */
    createDetails() {
        const detailGroup = new THREE.Group();
        detailGroup.name = '细节装饰';
        
        // 铭牌
        const nameplateGeometry = new THREE.BoxGeometry(0.6, 0.3, 0.02);
        const nameplate = new THREE.Mesh(nameplateGeometry, this.materials.casing);
        nameplate.position.set(0, this.config.casingHeight * 0.8 + 0.3, this.config.casingDepth / 2 + 0.01);
        nameplate.castShadow = true;
        detailGroup.add(nameplate);
        
        // 警示标签
        const warningGeometry = new THREE.BoxGeometry(0.2, 0.15, 0.01);
        const warningMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFD700,
            metalness: 0.1,
            roughness: 0.8
        });
        const warning = new THREE.Mesh(warningGeometry, warningMaterial);
        warning.position.set(0.5, this.config.casingHeight * 0.6 + 0.3, this.config.casingDepth / 2 + 0.005);
        detailGroup.add(warning);
        
        this.group.add(detailGroup);
    }

    /**
     * 创建设备标签
     */
    createLabel() {
        const labelGroup = new THREE.Group();
        labelGroup.name = 'magneticBlowerLabel';
        
        // 创建主标签
        const labelSprite = this.createLabelSprite('磁悬浮风机', '#00FF88');
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
     * 获取出风口世界坐标位置
     */
    getOutletWorldPosition() {
        const worldPosition = new THREE.Vector3();
        worldPosition.setFromMatrixPosition(this.group.matrixWorld);
        
        // 考虑旋转和缩放
        const localOutlet = new THREE.Vector3(
            this.outletPosition.x,
            this.outletPosition.y,
            this.outletPosition.z
        );
        
        localOutlet.applyMatrix4(this.group.matrixWorld);
        return localOutlet;
    }

    /**
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.config.name,
            type: '磁悬浮风机',
            position: this.config.position,
            dimensions: {
                width: this.config.casingWidth,
                height: this.config.casingHeight,
                depth: this.config.casingDepth
            },
            specifications: {
                inletDiameter: this.config.inletDiameter + 'm',
                outletSize: this.config.outletWidth + 'x' + this.config.outletHeight + 'm',
                powerControl: '变频控制',
                bearing: '磁悬浮轴承',
                efficiency: '≥85%',
                noiseLevel: '≤75dB(A)'
            },
            components: [
                '主机壳',
                '进风口',
                '出风口',
                '控制柜',
                '连接管道',
                '支撑结构'
            ]
        };
    }
}