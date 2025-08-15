/**
 * 流化风机类 - 根据实物图片1:1复刻
 * 包含蓝色圆柱形风机本体、红色电机、白色防护罩、出风口等组件
 */
class FluidizationBlower {
    constructor(config = {}) {
        this.config = {
            name: config.name || '流化风机',
            position: config.position || { x: 0, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            scale: config.scale || 1,
            labelText: config.labelText || '流化风机',
            labelColor: config.labelColor || '#2E86C1',
            outletDirection: config.outletDirection || { x: 1, y: 0, z: 0 } // 出风口方向
        };
        
        this.group = new THREE.Group();
        this.materials = this.createMaterials();
        this.components = {};
        
        this.init();
    }
    
    /**
     * 创建材质系统
     */
    createMaterials() {
        return {
            // 蓝色风机本体材质
            blowerBody: new THREE.MeshLambertMaterial({
                color: 0x2E86C1,
                transparent: false,
                roughness: 0.3,
                metalness: 0.7
            }),
            
            // 红色电机材质
            motor: new THREE.MeshLambertMaterial({
                color: 0xE74C3C,
                transparent: false,
                roughness: 0.2,
                metalness: 0.8
            }),
            
            // 白色防护罩材质
            protectiveCover: new THREE.MeshLambertMaterial({
                color: 0xF8F9FA,
                transparent: false,
                roughness: 0.1,
                metalness: 0.1
            }),
            
            // 灰色管道材质
            pipe: new THREE.MeshLambertMaterial({
                color: 0x7F8C8D,
                transparent: false,
                roughness: 0.4,
                metalness: 0.6
            }),
            
            // 黄黑警示条纹材质
            warningStripe: new THREE.MeshLambertMaterial({
                color: 0xF1C40F,
                transparent: false
            }),
            
            // 黑色基座材质
            base: new THREE.MeshLambertMaterial({
                color: 0x2C3E50,
                transparent: false,
                roughness: 0.8,
                metalness: 0.2
            })
        };
    }
    
    /**
     * 初始化流化风机
     */
    init() {
        try {
            this.createBase();
            this.createBlowerBody();
            this.createMotor();
            this.createProtectiveCover();
            this.createOutlet();
            this.createOutletLabel(); // 添加出风口标记
            // this.createSlurryOutletLabel(); // 出浆口标记已删除
            this.createWarningStripes();
            this.createLabel();
            
            // 设置位置、旋转和缩放
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
            
            this.group.scale.setScalar(this.config.scale);
            
            console.log(`流化风机 ${this.config.name} 创建成功`);
            
        } catch (error) {
            console.error(`流化风机 ${this.config.name} 创建失败:`, error);
        }
    }
    
    /**
     * 创建基座平台
     */
    createBase() {
        // 主基座
        const baseGeometry = new THREE.BoxGeometry(3, 0.3, 2);
        const base = new THREE.Mesh(baseGeometry, this.materials.base);
        base.position.set(0, 0.15, 0);
        this.group.add(base);
        
        // 黄黑警示条纹基座边缘
        const stripeGeometry = new THREE.BoxGeometry(3.2, 0.1, 2.2);
        const stripeBase = new THREE.Mesh(stripeGeometry, this.materials.warningStripe);
        stripeBase.position.set(0, 0.05, 0);
        this.group.add(stripeBase);
        
        // 地脚螺栓
        for (let i = 0; i < 4; i++) {
            const boltGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.4, 8);
            const bolt = new THREE.Mesh(boltGeometry, this.materials.base);
            const angle = (i * Math.PI) / 2;
            bolt.position.set(
                Math.cos(angle) * 1.2,
                0.2,
                Math.sin(angle) * 0.8
            );
            this.group.add(bolt);
        }
        
        this.components.base = base;
    }
    
    /**
     * 创建蓝色风机本体
     */
    createBlowerBody() {
        // 主风机圆柱体
        const blowerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 1.2, 16);
        const blowerBody = new THREE.Mesh(blowerGeometry, this.materials.blowerBody);
        blowerBody.position.set(0, 0.9, 0);
        this.group.add(blowerBody);
        
        // 风机进气口
        const inletGeometry = new THREE.CylinderGeometry(0.6, 0.8, 0.3, 16);
        const inlet = new THREE.Mesh(inletGeometry, this.materials.blowerBody);
        inlet.position.set(0, 1.65, 0);
        this.group.add(inlet);
        
        // 风机叶轮护罩
        const impellerCoverGeometry = new THREE.CylinderGeometry(0.5, 0.5, 0.1, 16);
        const impellerCover = new THREE.Mesh(impellerCoverGeometry, this.materials.protectiveCover);
        impellerCover.position.set(0, 1.8, 0);
        this.group.add(impellerCover);
        
        // 风机侧面法兰
        const flangeGeometry = new THREE.TorusGeometry(0.85, 0.05, 8, 16);
        const flange = new THREE.Mesh(flangeGeometry, this.materials.pipe);
        flange.position.set(0, 0.9, 0);
        flange.rotation.x = Math.PI / 2;
        this.group.add(flange);
        
        this.components.blowerBody = blowerBody;
    }
    
    /**
     * 创建红色电机
     */
    createMotor() {
        // 电机主体
        const motorGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.8, 12);
        const motor = new THREE.Mesh(motorGeometry, this.materials.motor);
        motor.position.set(0, 0.1, 0);
        this.group.add(motor);
        
        // 电机散热片
        for (let i = 0; i < 8; i++) {
            const finGeometry = new THREE.BoxGeometry(0.02, 0.6, 0.1);
            const fin = new THREE.Mesh(finGeometry, this.materials.motor);
            const angle = (i * Math.PI) / 4;
            fin.position.set(
                Math.cos(angle) * 0.42,
                0.1,
                Math.sin(angle) * 0.42
            );
            fin.rotation.y = angle;
            this.group.add(fin);
        }
        
        // 电机接线盒
        const junctionBoxGeometry = new THREE.BoxGeometry(0.3, 0.2, 0.15);
        const junctionBox = new THREE.Mesh(junctionBoxGeometry, this.materials.base);
        junctionBox.position.set(0.5, 0.2, 0);
        this.group.add(junctionBox);
        
        this.components.motor = motor;
    }
    
    /**
     * 创建白色防护罩
     */
    createProtectiveCover() {
        // 主防护罩
        const coverGeometry = new THREE.BoxGeometry(1.8, 1.0, 1.2);
        const cover = new THREE.Mesh(coverGeometry, this.materials.protectiveCover);
        cover.position.set(-0.2, 1.2, 0);
        this.group.add(cover);
        
        // 防护罩通风格栅
        for (let i = 0; i < 5; i++) {
            const grillGeometry = new THREE.BoxGeometry(1.6, 0.05, 0.02);
            const grill = new THREE.Mesh(grillGeometry, this.materials.base);
            grill.position.set(-0.2, 1.0 + i * 0.1, 0.61);
            this.group.add(grill);
        }
        
        // 防护罩铰链
        const hingeGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.2, 8);
        const hinge = new THREE.Mesh(hingeGeometry, this.materials.base);
        hinge.position.set(-1.1, 1.2, 0);
        hinge.rotation.z = Math.PI / 2;
        this.group.add(hinge);
        
        this.components.protectiveCover = cover;
    }
    
    /**
     * 创建出风口
     */
    createOutlet() {
        // 出风口主管道
        const outletGeometry = new THREE.CylinderGeometry(0.3, 0.3, 1.5, 12);
        const outlet = new THREE.Mesh(outletGeometry, this.materials.pipe);
        outlet.position.set(1.2, 0.9, 0);
        outlet.rotation.z = Math.PI / 2;
        this.group.add(outlet);
        
        // 出风口法兰
        const outletFlangeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.1, 12);
        const outletFlange = new THREE.Mesh(outletFlangeGeometry, this.materials.base);
        outletFlange.position.set(1.95, 0.9, 0);
        outletFlange.rotation.z = Math.PI / 2;
        this.group.add(outletFlange);
        
        // 出风口连接法兰螺栓
        for (let i = 0; i < 6; i++) {
            const boltGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 6);
            const bolt = new THREE.Mesh(boltGeometry, this.materials.base);
            const angle = (i * Math.PI) / 3;
            bolt.position.set(
                1.95,
                0.9 + Math.cos(angle) * 0.35,
                Math.sin(angle) * 0.35
            );
            bolt.rotation.z = Math.PI / 2;
            this.group.add(bolt);
        }
        
        this.components.outlet = outlet;
    }
    
    /**
     * 创建出风口标记
     */
    createOutletLabel() {
        // 出风口标识牌
        const outletLabelSprite = this.createPortLabelSprite('流化风机', '#FF6B00');
        outletLabelSprite.position.set(4, 1.5, 0); // 向X轴负方向移动3个单位（从2.5到-0.5）
        this.group.add(outletLabelSprite);
        
        // 出风口方向箭头
        const arrowGeometry = new THREE.ConeGeometry(0.08, 0.25, 8);
        const arrowMaterial = new THREE.MeshBasicMaterial({ color: 0xFF6B00 });
        const arrow = new THREE.Mesh(arrowGeometry, arrowMaterial);
        arrow.position.set(-0.8, 0.9, 0); // 向X轴负方向移动3个单位（从2.2到-0.8）
        arrow.rotation.z = -Math.PI / 2; // 指向出风方向
        this.group.add(arrow);
        
        // 出风口标记环
        const markerRingGeometry = new THREE.TorusGeometry(0.45, 0.03, 8, 16);
        const markerRingMaterial = new THREE.MeshBasicMaterial({ 
            color: 0xFF6B00,
            transparent: true,
            opacity: 0.8
        });
        const markerRing = new THREE.Mesh(markerRingGeometry, markerRingMaterial);
        markerRing.position.set(1.95, 0.9, 0);
        markerRing.rotation.z = Math.PI / 2;
        this.group.add(markerRing);
    }
    
    /**
     * 创建出浆口标记
     */
    createSlurryOutletLabel() {
        // 出浆口标识牌
        const slurryOutletLabelSprite = this.createPortLabelSprite('出浆口', '#00FF00');
        slurryOutletLabelSprite.position.set(-2, 0.3, 0); // 位于风机底部左侧
        this.group.add(slurryOutletLabelSprite);
        
        // 出浆口标记环
        const slurryMarkerRingGeometry = new THREE.TorusGeometry(0.35, 0.03, 8, 16);
        const slurryMarkerRingMaterial = new THREE.MeshBasicMaterial({ 
            color: 0x00FF00,
            transparent: true,
            opacity: 0.8
        });
        const slurryMarkerRing = new THREE.Mesh(slurryMarkerRingGeometry, slurryMarkerRingMaterial);
        slurryMarkerRing.position.set(-1.5, 0.3, 0); // 出浆口位置
        slurryMarkerRing.rotation.z = Math.PI / 2;
        this.group.add(slurryMarkerRing);
        
        // 出浆口方向箭头
        const slurryArrowGeometry = new THREE.ConeGeometry(0.06, 0.2, 8);
        const slurryArrowMaterial = new THREE.MeshBasicMaterial({ color: 0x00FF00 });
        const slurryArrow = new THREE.Mesh(slurryArrowGeometry, slurryArrowMaterial);
        slurryArrow.position.set(-1.2, 0.3, 0);
        slurryArrow.rotation.z = -Math.PI / 2; // 指向出浆方向
        this.group.add(slurryArrow);
        
        this.components.slurryOutlet = {
            position: { x: -1.5, y: 0.3, z: 0 },
            ring: slurryMarkerRing,
            arrow: slurryArrow,
            label: slurryOutletLabelSprite
        };
    }
    
    /**
     * 创建标识精灵
     */
    createPortLabelSprite(text, color = '#FFFFFF') {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 200;
        canvas.height = 80;
        
        // 设置字体和样式
        context.font = 'Bold 24px Microsoft YaHei, Arial';
        context.fillStyle = color;
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 绘制背景
        context.fillStyle = 'rgba(0, 0, 0, 0.8)';
        this.roundRect(context, 5, 5, canvas.width - 10, canvas.height - 10, 8);
        context.fill();
        
        // 绘制边框
        context.strokeStyle = color;
        context.lineWidth = 2;
        this.roundRect(context, 5, 5, canvas.width - 10, canvas.height - 10, 8);
        context.stroke();
        
        // 绘制文字
        context.fillStyle = color;
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // 创建纹理和材质
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.95
        });
        
        const sprite = new THREE.Sprite(material);
        sprite.scale.set(6, 2.4, 1);
        sprite.name = `portLabel_${text}`;
        
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
     * 获取出风口连接点位置（世界坐标）
     */
    getOutletConnectionPoint() {
        const outletPoint = new THREE.Vector3(1.95, 0.9, 0);
        
        // 转换为世界坐标
        outletPoint.applyMatrix4(this.group.matrixWorld);
        return outletPoint;
    }
    
    /**
     * 创建黄黑警示条纹
     */
    createWarningStripes() {
        // 基座周围警示条纹
        const stripeCount = 8;
        for (let i = 0; i < stripeCount; i++) {
            const stripeGeometry = new THREE.BoxGeometry(0.2, 0.05, 0.1);
            const stripe = new THREE.Mesh(stripeGeometry, 
                i % 2 === 0 ? this.materials.warningStripe : this.materials.base);
            const angle = (i * Math.PI * 2) / stripeCount;
            stripe.position.set(
                Math.cos(angle) * 1.6,
                0.1,
                Math.sin(angle) * 1.1
            );
            stripe.rotation.y = angle;
            this.group.add(stripe);
        }
    }
    
    /**
     * 创建标签
     */
    createLabel() {
        // 创建标签背景
        const labelGeometry = new THREE.PlaneGeometry(2, 0.8);
        const labelMaterial = new THREE.MeshBasicMaterial({
            color: 0xFFFFFF,
            transparent: true,
            opacity: 0.9,
            side: THREE.DoubleSide
        });
        const labelBackground = new THREE.Mesh(labelGeometry, labelMaterial);
        labelBackground.position.set(0, 2.5, 0);
        
        // 创建标签边框
        const borderGeometry = new THREE.PlaneGeometry(2.1, 0.9);
        const borderMaterial = new THREE.MeshBasicMaterial({
            color: this.config.labelColor,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide
        });
        const labelBorder = new THREE.Mesh(borderGeometry, borderMaterial);
        labelBorder.position.set(0, 2.5, -0.01);
        
        // 创建文字纹理
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // 设置文字样式
        context.fillStyle = '#FFFFFF';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#2C3E50';
        context.font = 'bold 36px Arial';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        
        // 绘制多行文字
        const lines = this.config.labelText.split('\n');
        const lineHeight = 50;
        const startY = canvas.height / 2 - (lines.length - 1) * lineHeight / 2;
        
        lines.forEach((line, index) => {
            context.fillText(line, canvas.width / 2, startY + index * lineHeight);
        });
        
        // 创建文字纹理
        const textTexture = new THREE.CanvasTexture(canvas);
        const textMaterial = new THREE.MeshBasicMaterial({
            map: textTexture,
            transparent: true,
            side: THREE.DoubleSide
        });
        const textMesh = new THREE.Mesh(labelGeometry, textMaterial);
        textMesh.position.set(0, 2.5, 0.01);
        
        // 添加到组
        this.group.add(labelBorder);
        this.group.add(labelBackground);
        this.group.add(textMesh);
        
        // 标签始终面向相机
        textMesh.lookAt = labelBackground.lookAt = labelBorder.lookAt = function() {
            if (window.camera) {
                this.lookAt(window.camera.position);
            }
        };
        
        this.components.label = {
            background: labelBackground,
            border: labelBorder,
            text: textMesh
        };
    }
    
    /**
     * 获取出风口位置（用于管道连接）
     */
    getOutletPosition() {
        const worldPosition = new THREE.Vector3();
        this.components.outlet.getWorldPosition(worldPosition);
        return worldPosition;
    }
    
    /**
     * 获取出风口方向（用于管道连接）
     */
    getOutletDirection() {
        const direction = new THREE.Vector3(
            this.config.outletDirection.x,
            this.config.outletDirection.y,
            this.config.outletDirection.z
        );
        direction.applyQuaternion(this.group.quaternion);
        return direction.normalize();
    }
    
    /**
     * 获取出浆口连接点位置（世界坐标）
     */
    getSlurryOutletConnectionPoint() {
        if (!this.components.slurryOutlet) {
            console.warn('出浆口组件尚未初始化');
            return new THREE.Vector3();
        }
        
        const slurryOutletPoint = new THREE.Vector3(
            this.components.slurryOutlet.position.x,
            this.components.slurryOutlet.position.y,
            this.components.slurryOutlet.position.z
        );
        
        // 转换为世界坐标
        slurryOutletPoint.applyMatrix4(this.group.matrixWorld);
        return slurryOutletPoint;
    }
    
    /**
     * 获取组对象
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * 更新动画（如果需要旋转效果）
     */
    update(deltaTime) {
        // 可以添加风机叶轮旋转动画
        if (this.components.blowerBody) {
            this.components.blowerBody.rotation.y += deltaTime * 2;
        }
    }
    
    /**
     * 销毁流化风机
     */
    dispose() {
        // 清理材质
        Object.values(this.materials).forEach(material => {
            if (material.map) material.map.dispose();
            material.dispose();
        });
        
        // 清理几何体
        this.group.traverse((child) => {
            if (child.geometry) {
                child.geometry.dispose();
            }
        });
        
        // 从场景中移除
        if (this.group.parent) {
            this.group.parent.remove(this.group);
        }
        
        console.log(`流化风机 ${this.config.name} 已销毁`);
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = FluidizationBlower;
} else if (typeof window !== 'undefined') {
    window.FluidizationBlower = FluidizationBlower;
}