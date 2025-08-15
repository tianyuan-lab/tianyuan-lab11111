/**
 * 金属平台模型
 * 用于连接两个水箱之间的通道
 */

class MetalPlatform {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.components = new Map();
        
        // 平台配置参数
        this.platformConfig = {
            name: config.name || '连接平台',
            width: config.width || 20,      // 平台宽度20米（连接两个水箱）
            depth: config.depth || 3,       // 平台深度3米
            height: config.height || 0.2,   // 平台厚度0.2米
            railingHeight: config.railingHeight || 1.2, // 栏杆高度1.2米
            platformHeight: config.platformHeight || 2, // 平台离地高度2米
            position: config.position || { x: 0, y: 0, z: 0 },
            ...config
        };
        
        // 材质定义
        this.materials = {
            // 平台钢板
            platform: new THREE.MeshPhongMaterial({
                color: 0x708090,
                shininess: 100,
                specular: 0x555555,
                transparent: false
            }),
            // 栏杆材质
            railing: new THREE.MeshPhongMaterial({
                color: 0x4A5568,
                shininess: 60,
                specular: 0x333333
            }),
            // 支撑柱材质
            support: new THREE.MeshPhongMaterial({
                color: 0x556B2F,
                shininess: 80,
                specular: 0x444444
            }),
            // 格栅材质
            grating: new THREE.MeshPhongMaterial({
                color: 0x778899,
                shininess: 90,
                specular: 0x666666
            })
        };
        
        this.initialize();
    }
    
    initialize() {
        console.log(`创建${this.platformConfig.name}...`);
        
        // 创建平台主体
        this.createPlatformBase();
        
        // 创建栏杆系统
        this.createRailingSystem();
        
        // 创建格栅效果
        this.createGratingPattern();
        
        // 设置位置
        this.group.position.set(
            this.platformConfig.position.x,
            this.platformConfig.position.y,
            this.platformConfig.position.z
        );
        
        console.log(`✓ ${this.platformConfig.name}创建完成`);
    }
    
    /**
     * 创建平台主体
     */
    createPlatformBase() {
        const platformGroup = new THREE.Group();
        platformGroup.name = 'platformBase';
        
        const width = this.platformConfig.width;
        const depth = this.platformConfig.depth;
        const height = this.platformConfig.height;
        const platformHeight = this.platformConfig.platformHeight;
        
        // 主平台板
        const platformGeometry = new THREE.BoxGeometry(width, height, depth);
        const platformMesh = new THREE.Mesh(platformGeometry, this.materials.platform);
        platformMesh.position.y = platformHeight;
        platformMesh.castShadow = true;
        platformMesh.receiveShadow = true;
        platformGroup.add(platformMesh);
        
        // 平台边缘加强
        const edgeThickness = 0.1;
        
        // 前后边缘
        for (let side = -1; side <= 1; side += 2) {
            const edgeGeometry = new THREE.BoxGeometry(width + 0.2, height + 0.1, edgeThickness);
            const edgeMesh = new THREE.Mesh(edgeGeometry, this.materials.support);
            edgeMesh.position.set(0, platformHeight, side * (depth / 2 + 0.05));
            edgeMesh.castShadow = true;
            platformGroup.add(edgeMesh);
        }
        
        // 左右边缘
        for (let side = -1; side <= 1; side += 2) {
            const edgeGeometry = new THREE.BoxGeometry(edgeThickness, height + 0.1, depth);
            const edgeMesh = new THREE.Mesh(edgeGeometry, this.materials.support);
            edgeMesh.position.set(side * (width / 2 + 0.05), platformHeight, 0);
            edgeMesh.castShadow = true;
            platformGroup.add(edgeMesh);
        }
        
        this.components.set('platformBase', platformGroup);
        this.group.add(platformGroup);
    }
    
    /**
     * 创建支撑结构
     */
    createSupportStructure() {
        const supportGroup = new THREE.Group();
        supportGroup.name = 'supportStructure';
        
        const width = this.platformConfig.width;
        const depth = this.platformConfig.depth;
        const platformHeight = this.platformConfig.platformHeight;
        
        // 主要支撑柱
        const supportPositions = [
            [-width/2 + 2, 0, -depth/2 + 0.5],
            [-width/2 + 2, 0, depth/2 - 0.5],
            [width/2 - 2, 0, -depth/2 + 0.5],
            [width/2 - 2, 0, depth/2 - 0.5],
            [0, 0, -depth/2 + 0.5],
            [0, 0, depth/2 - 0.5]
        ];
        
        supportPositions.forEach(pos => {
            const supportGeometry = new THREE.CylinderGeometry(0.15, 0.15, platformHeight, 12);
            const supportMesh = new THREE.Mesh(supportGeometry, this.materials.support);
            supportMesh.position.set(pos[0], platformHeight / 2, pos[2]);
            supportMesh.castShadow = true;
            supportGroup.add(supportMesh);
            
            // 底座
            const baseGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.2, 12);
            const baseMesh = new THREE.Mesh(baseGeometry, this.materials.support);
            baseMesh.position.set(pos[0], 0.1, pos[2]);
            baseMesh.castShadow = true;
            supportGroup.add(baseMesh);
        });
        
        // 横向支撑梁
        const beamPositions = [
            { start: [-width/2 + 2, platformHeight * 0.7, -depth/2 + 0.5], end: [width/2 - 2, platformHeight * 0.7, -depth/2 + 0.5] },
            { start: [-width/2 + 2, platformHeight * 0.7, depth/2 - 0.5], end: [width/2 - 2, platformHeight * 0.7, depth/2 - 0.5] },
            { start: [0, platformHeight * 0.3, -depth/2 + 0.5], end: [0, platformHeight * 0.3, depth/2 - 0.5] }
        ];
        
        beamPositions.forEach(beam => {
            const beamLength = Math.sqrt(
                Math.pow(beam.end[0] - beam.start[0], 2) + 
                Math.pow(beam.end[2] - beam.start[2], 2)
            );
            const beamGeometry = new THREE.BoxGeometry(beamLength, 0.2, 0.15);
            const beamMesh = new THREE.Mesh(beamGeometry, this.materials.support);
            beamMesh.position.set(
                (beam.start[0] + beam.end[0]) / 2,
                beam.start[1],
                (beam.start[2] + beam.end[2]) / 2
            );
            beamMesh.castShadow = true;
            supportGroup.add(beamMesh);
        });
        
        this.components.set('supportStructure', supportGroup);
        this.group.add(supportGroup);
    }
    
    /**
     * 创建栏杆系统
     */
    createRailingSystem() {
        const railingGroup = new THREE.Group();
        railingGroup.name = 'railingSystem';
        
        const width = this.platformConfig.width;
        const depth = this.platformConfig.depth;
        const platformHeight = this.platformConfig.platformHeight;
        const railingHeight = this.platformConfig.railingHeight;
        
        // 栏杆立柱
        const postCount = Math.floor(width / 2) + 1; // 每2米一个立柱
        
        // 前后栏杆
        for (let side = -1; side <= 1; side += 2) {
            for (let i = 0; i < postCount; i++) {
                const x = -width/2 + i * 2;
                const z = side * (depth/2 + 0.1);
                
                // 立柱
                const postGeometry = new THREE.CylinderGeometry(0.04, 0.04, railingHeight, 8);
                const postMesh = new THREE.Mesh(postGeometry, this.materials.railing);
                postMesh.position.set(x, platformHeight + railingHeight/2, z);
                postMesh.castShadow = true;
                railingGroup.add(postMesh);
                
                // 顶部扶手
                if (i < postCount - 1) {
                    const railGeometry = new THREE.CylinderGeometry(0.03, 0.03, 2, 8);
                    const railMesh = new THREE.Mesh(railGeometry, this.materials.railing);
                    railMesh.position.set(x + 1, platformHeight + railingHeight - 0.1, z);
                    railMesh.rotation.z = Math.PI / 2;
                    railMesh.castShadow = true;
                    railingGroup.add(railMesh);
                    
                    // 中间扶手
                    const midRailMesh = railMesh.clone();
                    midRailMesh.position.y = platformHeight + railingHeight/2;
                    railingGroup.add(midRailMesh);
                }
            }
        }
        
        // 侧面栏杆
        for (let side = -1; side <= 1; side += 2) {
            const sidePostCount = Math.floor(depth / 1.5) + 1;
            
            for (let i = 0; i < sidePostCount; i++) {
                const x = side * (width/2 + 0.1);
                const z = -depth/2 + i * 1.5;
                
                // 立柱
                const postGeometry = new THREE.CylinderGeometry(0.04, 0.04, railingHeight, 8);
                const postMesh = new THREE.Mesh(postGeometry, this.materials.railing);
                postMesh.position.set(x, platformHeight + railingHeight/2, z);
                postMesh.castShadow = true;
                railingGroup.add(postMesh);
                
                // 扶手
                if (i < sidePostCount - 1) {
                    const railGeometry = new THREE.CylinderGeometry(0.03, 0.03, 1.5, 8);
                    const railMesh = new THREE.Mesh(railGeometry, this.materials.railing);
                    railMesh.position.set(x, platformHeight + railingHeight - 0.1, z + 0.75);
                    railMesh.rotation.x = Math.PI / 2;
                    railMesh.castShadow = true;
                    railingGroup.add(railMesh);
                    
                    // 中间扶手
                    const midRailMesh = railMesh.clone();
                    midRailMesh.position.y = platformHeight + railingHeight/2;
                    railingGroup.add(midRailMesh);
                }
            }
        }
        
        this.components.set('railingSystem', railingGroup);
        this.group.add(railingGroup);
    }
    
    /**
     * 创建格栅效果
     */
    createGratingPattern() {
        const gratingGroup = new THREE.Group();
        gratingGroup.name = 'gratingPattern';
        
        const width = this.platformConfig.width;
        const depth = this.platformConfig.depth;
        const platformHeight = this.platformConfig.platformHeight;
        
        // 纵向格栅
        const gratingCount = Math.floor(width / 0.3);
        for (let i = 0; i < gratingCount; i++) {
            const x = -width/2 + i * 0.3;
            const gratingGeometry = new THREE.BoxGeometry(0.05, 0.15, depth - 0.2);
            const gratingMesh = new THREE.Mesh(gratingGeometry, this.materials.grating);
            gratingMesh.position.set(x, platformHeight + 0.08, 0);
            gratingMesh.castShadow = true;
            gratingGroup.add(gratingMesh);
        }
        
        // 横向格栅
        const crossGratingCount = Math.floor(depth / 0.4);
        for (let i = 0; i < crossGratingCount; i++) {
            const z = -depth/2 + i * 0.4;
            const gratingGeometry = new THREE.BoxGeometry(width - 0.2, 0.1, 0.05);
            const gratingMesh = new THREE.Mesh(gratingGeometry, this.materials.grating);
            gratingMesh.position.set(0, platformHeight + 0.06, z);
            gratingMesh.castShadow = true;
            gratingGroup.add(gratingMesh);
        }
        
        this.components.set('gratingPattern', gratingGroup);
        this.group.add(gratingGroup);
    }
    
    /**
     * 创建楼梯
     */
    createStairs() {
        const stairGroup = new THREE.Group();
        stairGroup.name = 'stairs';
        
        const platformHeight = this.platformConfig.platformHeight;
        const stepCount = 8;
        const stepHeight = platformHeight / stepCount;
        const stepDepth = 0.3;
        const stepWidth = 2;
        
        // 在平台一侧创建楼梯
        const stairX = this.platformConfig.width/2 + 1;
        
        for (let i = 0; i < stepCount; i++) {
            const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
            const stepMesh = new THREE.Mesh(stepGeometry, this.materials.platform);
            stepMesh.position.set(
                stairX,
                (i + 0.5) * stepHeight,
                -stepDepth * i
            );
            stepMesh.castShadow = true;
            stepMesh.receiveShadow = true;
            stairGroup.add(stepMesh);
        }
        
        // 楼梯扶手
        const handrailGeometry = new THREE.CylinderGeometry(0.03, 0.03, stepCount * stepDepth, 8);
        const handrailMesh = new THREE.Mesh(handrailGeometry, this.materials.railing);
        handrailMesh.position.set(
            stairX + stepWidth/2,
            platformHeight/2,
            -stepCount * stepDepth / 2
        );
        handrailMesh.rotation.x = Math.PI / 2;
        handrailMesh.castShadow = true;
        stairGroup.add(handrailMesh);
        
        this.components.set('stairs', stairGroup);
        this.group.add(stairGroup);
    }
    
    /**
     * 创建安全设施
     */
    createSafetyFeatures() {
        const safetyGroup = new THREE.Group();
        safetyGroup.name = 'safetyFeatures';
        
        const platformHeight = this.platformConfig.platformHeight;
        
        // 安全标志
        const signGeometry = new THREE.PlaneGeometry(0.6, 0.4);
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 128;
        canvas.height = 64;
        
        // 绘制安全标志
        context.fillStyle = '#FFD700';
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.fillStyle = '#000000';
        context.font = 'Bold 16px Arial';
        context.textAlign = 'center';
        context.fillText('注意安全', canvas.width / 2, canvas.height / 2);
        
        const signTexture = new THREE.CanvasTexture(canvas);
        const signMaterial = new THREE.MeshPhongMaterial({
            map: signTexture,
            side: THREE.DoubleSide
        });
        
        const signMesh = new THREE.Mesh(signGeometry, signMaterial);
        signMesh.position.set(0, platformHeight + 1.5, 0);
        signMesh.rotation.y = Math.PI;
        safetyGroup.add(signMesh);
        
        // 防滑条
        const gripCount = Math.floor(this.platformConfig.width / 1);
        for (let i = 0; i < gripCount; i++) {
            const gripGeometry = new THREE.BoxGeometry(0.8, 0.02, 0.1);
            const gripMaterial = new THREE.MeshPhongMaterial({ color: 0xFFFF00 });
            const gripMesh = new THREE.Mesh(gripGeometry, gripMaterial);
            gripMesh.position.set(
                -this.platformConfig.width/2 + i * 1 + 0.5,
                platformHeight + 0.12,
                0
            );
            safetyGroup.add(gripMesh);
        }
        
        this.components.set('safetyFeatures', safetyGroup);
        this.group.add(safetyGroup);
    }
    
    /**
     * 获取模型信息
     */
    getModelInfo() {
        return {
            name: this.platformConfig.name,
            type: '金属连接平台',
            width: this.platformConfig.width,
            depth: this.platformConfig.depth,
            height: this.platformConfig.platformHeight,
            railingHeight: this.platformConfig.railingHeight,
            components: Array.from(this.components.keys()),
            position: this.platformConfig.position
        };
    }
    
    /**
     * 销毁模型
     */
    dispose() {
        this.group.clear();
        this.components.clear();
    }
}

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = MetalPlatform;
} else if (typeof window !== 'undefined') {
    window.MetalPlatform = MetalPlatform;
}