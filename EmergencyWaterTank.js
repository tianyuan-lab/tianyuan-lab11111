/**
 * 事故水箱模型类
 * 根据实物图1:1还原设计
 */
class EmergencyWaterTank {
    constructor(config = {}) {
        this.config = {
            name: config.name || '事故水箱',
            position: config.position || { x: 0, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            scale: config.scale || 1.0,
            // 尺寸参数（单位：米）
            tankDiameter: config.tankDiameter || 12.0,
            tankHeight: config.tankHeight || 8.0,
            baseHeight: config.baseHeight || 0.5,
            platformHeight: config.platformHeight || 1.2,
            stairWidth: config.stairWidth || 1.0
        };

        this.group = new THREE.Group();
        this.group.name = this.config.name;

        this.materials = this.createMaterials();
        this.createTankModel();
        this.applyTransforms();
    }

    /**
     * 创建材质
     */
    createMaterials() {
        // 使用PBR材质获得更真实的金属效果
        const tankBaseColor = 0x9AA6B2; // 更偏工业浅灰蓝
        const metal = new THREE.MeshStandardMaterial({
            color: tankBaseColor,
            metalness: 0.6,
            roughness: 0.45,
        });
        const concrete = new THREE.MeshStandardMaterial({ color: 0xBDBDBD, metalness: 0.0, roughness: 0.9 });
        const platform = new THREE.MeshStandardMaterial({ color: 0x50555A, metalness: 0.5, roughness: 0.6 });
        const pipe = new THREE.MeshStandardMaterial({ color: 0xC7CED6, metalness: 0.7, roughness: 0.35 });
        const signBlue = new THREE.MeshStandardMaterial({ color: 0x1E88E5, metalness: 0.2, roughness: 0.6 });
        const handrail = new THREE.MeshStandardMaterial({ color: 0xD0D6DB, metalness: 0.6, roughness: 0.4 });

        // 底部黄黑警示纹理
        const hazardTex = new THREE.CanvasTexture(this.generateHazardTexture(1024, 128));
        hazardTex.wrapS = hazardTex.wrapT = THREE.RepeatWrapping;
        hazardTex.repeat.set(2, 1);
        const hazardMat = new THREE.MeshStandardMaterial({ map: hazardTex, metalness: 0.0, roughness: 1.0 });

        return { tankBody: metal, concrete, platform, pipe, signBlue, handrail, hazard: hazardMat };
    }

    /**
     * 创建储罐模型
     */
    createTankModel() {
        // 底座
        this.createBase();
        // 主体（含加强圈与顶部包边）
        this.createTankBody();
        // 顶部环形走道与防坠栏杆
        this.createGuardrailWalkway();
        // 斜梯 + 中部小平台
    
        // 侧面人孔与铭牌
        this.createSideManhole();
        this.createSignage();
        // 顶部小接口
        this.createTopEquipment();
    }

    /**
     * 创建底座
     */
    createBase() {
        const baseGeometry = new THREE.CylinderGeometry(
            this.config.tankDiameter / 2 + 0.5, // 顶部半径（略大于储罐）
            this.config.tankDiameter / 2 + 0.5, // 底部半径
            this.config.baseHeight,              // 高度
            32                                   // 分段数
        );
        
        const base = new THREE.Mesh(baseGeometry, this.materials.concrete);
        base.position.set(0, this.config.baseHeight / 2, 0);
        base.castShadow = true;
        base.receiveShadow = true;
        base.name = '底座';
        
        this.group.add(base);
    }

    /**
     * 创建储罐主体
     */
    createTankBody() {
        const radius = this.config.tankDiameter / 2;
        const bodyH = this.config.tankHeight;
        const baseH = this.config.baseHeight;

        // 主体圆筒
        const tankGeometry = new THREE.CylinderGeometry(radius, radius, bodyH, 64, 1, false);
        const tankBody = new THREE.Mesh(tankGeometry, this.materials.tankBody);
        tankBody.position.set(0, baseH + bodyH / 2, 0);
        tankBody.castShadow = true;
        tankBody.receiveShadow = true;
        tankBody.name = '储罐主体';
        this.group.add(tankBody);

        // 顶盖（微突出）
        const topThickness = 0.12;
        const topGeometry = new THREE.CylinderGeometry(radius, radius, topThickness, 64);
        const topCover = new THREE.Mesh(topGeometry, this.materials.tankBody);
        topCover.position.set(0, baseH + bodyH + topThickness / 2, 0);
        topCover.castShadow = true;
        topCover.receiveShadow = true;
        topCover.name = '储罐顶盖';
        this.group.add(topCover);

        // 顶部包边（倒角观感）
        const edgeRing = new THREE.TorusGeometry(radius + 0.05, 0.06, 12, 64);
        const edgeMesh = new THREE.Mesh(edgeRing, this.materials.tankBody);
        edgeMesh.rotation.x = Math.PI / 2;
        edgeMesh.position.set(0, baseH + bodyH + 0.06, 0);
        edgeMesh.castShadow = true;
        this.group.add(edgeMesh);

        // 水平加强圈（三道）
        this.createBodyBands(radius, baseH, bodyH);

        // 底部警示裙边
        const skirtGeom = new THREE.CylinderGeometry(radius + 0.15, radius + 0.15, 0.35, 64, 1, true);
        const skirt = new THREE.Mesh(skirtGeom, this.materials.hazard);
        skirt.position.set(0, baseH + 0.17, 0);
        skirt.castShadow = false;
        skirt.receiveShadow = true;
        skirt.name = '警示裙边';
        this.group.add(skirt);
    }

    /**
     * 创建加强圈
     */
    createBodyBands(radius, baseH, bodyH) {
        const bandPositions = [0.25, 0.5, 0.75]; // 相对高度位置
        
        bandPositions.forEach((pos, index) => {
            const bandY = baseH + bodyH * pos;
            const bandGeom = new THREE.TorusGeometry(radius + 0.03, 0.04, 8, 64);
            const band = new THREE.Mesh(bandGeom, this.materials.tankBody);
            band.rotation.x = Math.PI / 2;
            band.position.set(0, bandY, 0);
            band.castShadow = true;
            band.name = `加强圈${index + 1}`;
            this.group.add(band);
        });
    }

    /**
     * 创建顶部环形走道与防坠栏杆
     */
    createGuardrailWalkway() {
        const radius = this.config.tankDiameter / 2;
        const baseH = this.config.baseHeight;
        const bodyH = this.config.tankHeight;
        const walkwayY = baseH + bodyH + 0.25;

        // 环形走道
        const walkwayGeom = new THREE.RingGeometry(radius + 0.2, radius + 1.2, 64);
        const walkway = new THREE.Mesh(walkwayGeom, this.materials.platform);
        walkway.rotation.x = -Math.PI / 2;
        walkway.position.set(0, walkwayY, 0);
        walkway.castShadow = true;
        walkway.receiveShadow = true;
        walkway.name = '顶部环形走道';
        this.group.add(walkway);

        // 防坠栏杆（内外圈）
        const railHeight = 1.1;
        const railY = walkwayY + railHeight / 2;
        
        // 外圈栏杆
        const outerRailGeom = new THREE.TorusGeometry(radius + 1.2, 0.025, 8, 64);
        const outerRail = new THREE.Mesh(outerRailGeom, this.materials.handrail);
        outerRail.rotation.x = Math.PI / 2;
        outerRail.position.set(0, railY, 0);
        outerRail.castShadow = true;
        this.group.add(outerRail);

        // 内圈栏杆
        const innerRailGeom = new THREE.TorusGeometry(radius + 0.2, 0.025, 8, 64);
        const innerRail = new THREE.Mesh(innerRailGeom, this.materials.handrail);
        innerRail.rotation.x = Math.PI / 2;
        innerRail.position.set(0, railY, 0);
        innerRail.castShadow = true;
        this.group.add(innerRail);

        // 栏杆立柱
        for (let i = 0; i < 16; i++) {
            const angle = (i / 16) * Math.PI * 2;
            const x = Math.cos(angle) * (radius + 0.7);
            const z = Math.sin(angle) * (radius + 0.7);
            
            const pillarGeom = new THREE.CylinderGeometry(0.02, 0.02, railHeight, 8);
            const pillar = new THREE.Mesh(pillarGeom, this.materials.handrail);
            pillar.position.set(x, walkwayY + railHeight / 2, z);
            pillar.castShadow = true;
            this.group.add(pillar);
        }
    }

    /**
     * 创建斜梯（现代化设计）
     */
    createInclinedStair() {
        const radius = this.config.tankDiameter / 2;
        const baseH = this.config.baseHeight;
        const bodyH = this.config.tankHeight;
        const totalH = baseH + bodyH + 0.25; // 到达走道高度

        // 斜梯参数
        const stairAngle = Math.PI / 6; // 30度倾斜
        const stairLength = totalH / Math.sin(stairAngle);
        const stairStartX = radius + 2.0;
        const stairWidth = 0.8;

        // 斜梯主体框架
        const stairFrameGeom = new THREE.BoxGeometry(stairLength, 0.08, stairWidth);
        const stairFrame = new THREE.Mesh(stairFrameGeom, this.materials.platform);
        stairFrame.position.set(
            stairStartX + stairLength * Math.cos(stairAngle) / 2,
            totalH / 2,
            0
        );
        stairFrame.rotation.z = -stairAngle;
        stairFrame.castShadow = true;
        stairFrame.name = '斜梯主框架';
        this.group.add(stairFrame);

        // 斜梯踏步
        const stepCount = Math.floor(stairLength / 0.25);
        for (let i = 1; i < stepCount; i++) {
            const stepProgress = i / stepCount;
            const stepX = stairStartX + stairLength * Math.cos(stairAngle) * stepProgress;
            const stepY = totalH * stepProgress;
            
            const stepGeom = new THREE.BoxGeometry(0.25, 0.03, stairWidth - 0.1);
            const step = new THREE.Mesh(stepGeom, this.materials.platform);
            step.position.set(stepX, stepY, 0);
            step.rotation.z = -stairAngle;
            step.castShadow = true;
            this.group.add(step);
        }

        // 斜梯扶手
        const handrailGeom = new THREE.CylinderGeometry(0.02, 0.02, stairLength, 8);
        const leftHandrail = new THREE.Mesh(handrailGeom, this.materials.handrail);
        leftHandrail.position.set(
            stairStartX + stairLength * Math.cos(stairAngle) / 2,
            totalH / 2 + 0.9,
            -stairWidth / 2 - 0.1
        );
        leftHandrail.rotation.z = -stairAngle;
        leftHandrail.castShadow = true;
        this.group.add(leftHandrail);

        const rightHandrail = leftHandrail.clone();
        rightHandrail.position.z = stairWidth / 2 + 0.1;
        this.group.add(rightHandrail);

        // 中部休息平台
        const midPlatformH = totalH * 0.6;
        const midPlatformGeom = new THREE.BoxGeometry(1.5, 0.08, 1.2);
        const midPlatform = new THREE.Mesh(midPlatformGeom, this.materials.platform);
        midPlatform.position.set(stairStartX + 2.0, midPlatformH, 0);
        midPlatform.castShadow = true;
        midPlatform.name = '中部休息平台';
        this.group.add(midPlatform);
    }

    /**
     * 创建管道连接
     */
    createPipes() {
        const pipeGroup = new THREE.Group();
        pipeGroup.name = '管道系统';
        
        // 垂直外置立管（右侧）
        const r = this.config.tankDiameter / 2;
        const baseH = this.config.baseHeight;
        const bodyH = this.config.tankHeight;
        const riser = new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, bodyH, 16), this.materials.pipe);
        riser.position.set(r + 0.4, baseH + bodyH / 2, -0.6);
        riser.castShadow = true;
        pipeGroup.add(riser);

        // 连接底部出水的弯头
        const elbow = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.06, 8, 24, Math.PI / 2), this.materials.pipe);
        elbow.rotation.z = Math.PI / 2;
        elbow.position.set(r + 0.4, baseH + 0.5, -0.6);
        pipeGroup.add(elbow);

        // 底部出水短节
        const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 1.6, 16), this.materials.pipe);
        outlet.rotation.z = Math.PI / 2;
        outlet.position.set(r + 1.2, baseH + 0.5, -0.6);
        pipeGroup.add(outlet);

        // 侧面溢流（靠后部位）
        const overflow = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 1.5, 16), this.materials.pipe);
        overflow.rotation.x = Math.PI / 2;
        overflow.position.set(0.5, baseH + bodyH - 0.6, -r - 0.15);
        pipeGroup.add(overflow);

        this.group.add(pipeGroup);
    }

    /**
     * 创建侧面人孔
     */
    createSideManhole() {
        const radius = this.config.tankDiameter / 2;
        const baseH = this.config.baseHeight;
        const bodyH = this.config.tankHeight;
        const manholeY = baseH + bodyH * 0.7; // 储罐上部

        // 人孔法兰
        const flangeGeom = new THREE.CylinderGeometry(0.4, 0.4, 0.08, 32);
        const flange = new THREE.Mesh(flangeGeom, this.materials.pipe);
        flange.rotation.x = Math.PI / 2;
        flange.position.set(0, manholeY, radius + 0.04);
        flange.castShadow = true;
        flange.name = '侧面人孔';
        this.group.add(flange);

        // 人孔盖板
        const coverGeom = new THREE.CylinderGeometry(0.35, 0.35, 0.04, 32);
        const cover = new THREE.Mesh(coverGeom, this.materials.tankBody);
        cover.rotation.x = Math.PI / 2;
        cover.position.set(0, manholeY, radius + 0.08);
        cover.castShadow = true;
        this.group.add(cover);
    }

    /**
     * 创建标识牌
     */
    createSignage() {
        const signGroup = new THREE.Group();
        signGroup.name = '标识系统';
        
        const signGeometry = new THREE.BoxGeometry(2.0, 1.0, 0.05);
        const mainSign = new THREE.Mesh(signGeometry, this.materials.signBlue);
        mainSign.position.set(0, this.config.baseHeight + this.config.tankHeight / 2.2, this.config.tankDiameter / 2 + 0.06);
        mainSign.castShadow = true;
        mainSign.name = '主标识牌';
        signGroup.add(mainSign);

        this.createSignText(mainSign, '事故水箱');
        this.group.add(signGroup);
    }

    /**
     * 创建标识牌文字
     */
    createSignText(signMesh, text) {
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 256;
        const context = canvas.getContext('2d');
        
        // 绘制蓝色背景
        context.fillStyle = '#1E88E5';
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        // 绘制白色文字
        context.fillStyle = '#FFFFFF';
        context.font = 'bold 48px Arial, sans-serif';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);
        
        // 创建纹理
        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        
        // 应用纹理到标识牌
        const textMaterial = new THREE.MeshLambertMaterial({
            map: texture,
            transparent: false
        });
        
        signMesh.material = textMaterial;
    }

    /**
     * 创建顶部设备
     */
    createTopEquipment() {
        const topGroup = new THREE.Group();
        topGroup.name = '顶部设备';
        
        const topY = this.config.baseHeight + this.config.tankHeight + 0.3;
        
        // 人孔
        const manholeGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 16);
        const manhole = new THREE.Mesh(manholeGeometry, this.materials.pipe);
        manhole.position.set(-1.5, topY, 0);
        manhole.castShadow = true;
        manhole.name = '人孔';
        
        topGroup.add(manhole);
        
        // 液位计
        const levelGaugeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.8, 8);
        const levelGauge = new THREE.Mesh(levelGaugeGeometry, this.materials.pipe);
        levelGauge.position.set(1.5, topY + 0.4, 0);
        levelGauge.castShadow = true;
        levelGauge.name = '液位计';
        
        topGroup.add(levelGauge);
        
        // 通气管
        const ventPipeGeometry = new THREE.CylinderGeometry(0.08, 0.08, 1.2, 8);
        const ventPipe = new THREE.Mesh(ventPipeGeometry, this.materials.pipe);
        ventPipe.position.set(0, topY + 0.6, 1.5);
        ventPipe.castShadow = true;
        ventPipe.name = '通气管';
        
        topGroup.add(ventPipe);
        
        this.group.add(topGroup);
    }

    /**
     * 生成警示纹理
     */
    generateHazardTexture(w, h) {
        const canvas = document.createElement('canvas');
        canvas.width = w; 
        canvas.height = h;
        const ctx = canvas.getContext('2d');
        
        // 黄黑斜纹
        const stripeW = 64;
        for (let x = -h; x < w + h; x += stripeW) {
            ctx.fillStyle = '#FFC107';
            ctx.beginPath();
            ctx.moveTo(x, 0); 
            ctx.lineTo(x + h, 0); 
            ctx.lineTo(x + h - stripeW / 2, h); 
            ctx.lineTo(x - stripeW / 2, h); 
            ctx.closePath();
            ctx.fill();
            
            ctx.fillStyle = '#222';
            ctx.beginPath();
            ctx.moveTo(x + stripeW / 2, 0); 
            ctx.lineTo(x + h + stripeW / 2, 0); 
            ctx.lineTo(x + h, h); 
            ctx.lineTo(x, h); 
            ctx.closePath();
            ctx.fill();
        }
        return canvas;
    }

    /**
     * 应用变换
     */
    applyTransforms() {
        // 应用位置
        this.group.position.set(
            this.config.position.x,
            this.config.position.y,
            this.config.position.z
        );
        
        // 应用旋转
        this.group.rotation.set(
            this.config.rotation.x,
            this.config.rotation.y,
            this.config.rotation.z
        );
        
        // 应用缩放
        this.group.scale.set(
            this.config.scale,
            this.config.scale,
            this.config.scale
        );
    }

    /**
     * 获取模型组
     */
    getGroup() {
        return this.group;
    }

    /**
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.config.name,
            type: '事故水箱',
            position: this.config.position,
            dimensions: {
                diameter: this.config.tankDiameter,
                height: this.config.tankHeight,
                totalHeight: this.config.tankHeight + this.config.baseHeight
            },
            components: [
                '储罐主体',
                '混凝土底座',
                '斜梯系统',
                '顶部走道',
                '防坠栏杆',
                // '管道系统', // 已移除
                '标识系统',
                '顶部设备',
                '侧面人孔',
                '加强圈',
                '警示裙边'
            ]
        };
    }

    /**
     * 显示/隐藏模型
     */
    setVisible(visible) {
        this.group.visible = visible;
    }

    /**
     * 获取连接点位置（用于管道连接）
     */
    getConnectionPoints() {
        const basePos = this.group.position;
        
        return {
            inlet: {
                x: basePos.x - this.config.tankDiameter / 2 - 1.5,
                y: basePos.y + this.config.baseHeight + 1.0,
                z: basePos.z
            },
            outlet: {
                x: basePos.x + this.config.tankDiameter / 2 + 1.5,
                y: basePos.y + this.config.baseHeight + 0.5,
                z: basePos.z
            },
            overflow: {
                x: basePos.x,
                y: basePos.y + this.config.baseHeight + this.config.tankHeight - 0.5,
                z: basePos.z + this.config.tankDiameter / 2 + 1.0
            }
        };
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = EmergencyWaterTank;
}