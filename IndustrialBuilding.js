/**
 * 工业综合楼模型 - 二层建筑
 * 符合真实工业建筑标准，包含办公区、控制室、设备间等功能区域
 */
class IndustrialBuilding {
    constructor(position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 }) {
        this.position = position;
        this.rotation = rotation;
        this.group = new THREE.Group();
        this.components = {};
        this.isInteriorView = false; // 初始化内部视图状态
        
        // 建筑配置参数
        this.config = {
            // 建筑主体尺寸 - 提升楼层高度与内部视图一致（每层15米）
            width: 30,      // 宽度 30米
            depth: 20,      // 深度 20米
            firstFloorHeight: 15,    // 一层高度与内部一致 15米
            secondFloorHeight: 15,   // 二层高度与内部一致 15米
            foundationHeight: 0.8,   // 基础高度 0.8米
            
            // 墙体参数
            wallThickness: 0.3,      // 墙体厚度 30cm
            windowHeight: 2.0,       // 窗户高度（增加）
            windowWidth: 1.8,        // 窗户宽度（增加）
            doorHeight: 2.5,         // 门高度（增加）
            doorWidth: 1.5,          // 门宽度（增加）
            
            // 屋顶参数
            roofHeight: 1.5,         // 屋顶高度（增加）
            roofOverhang: 1.0,       // 屋檐悬挑（增加）
            
            // 楼梯参数
            stairWidth: 2.0,         // 楼梯宽度（增加）
            stairSteps: 18,          // 楼梯台阶数（增加）
            
            // 平台参数
            platformWidth: 4,        // 入口平台宽度（增加）
            platformDepth: 3,        // 入口平台深度（增加）
            railingHeight: 1.2       // 栏杆高度（增加）
        };
        
        this.initialize();
    }
    
    /**
     * 初始化建筑
     */
    initialize() {
        this.createMaterials();
        this.createFoundation();
        this.createMainStructure();
        this.createRoof();
        this.createWindows();
        this.createDoors();
        this.createStaircase();
        this.createPlatforms();
        this.createExternalFeatures();
        this.createSignage();
        
        // 设置建筑位置和旋转
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.group.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        this.group.name = '工业综合楼';
    }
    
    /**
     * 创建材质
     */
    createMaterials() {
        this.materials = {
            // 混凝土墙体
            concrete: new THREE.MeshStandardMaterial({
                color: 0xC0C0C0,
                roughness: 0.8,
                metalness: 0.1
            }),
            
            // 钢结构
            steel: new THREE.MeshStandardMaterial({
                color: 0x708090,
                roughness: 0.3,
                metalness: 0.8
            }),
            
            // 玻璃
            glass: new THREE.MeshStandardMaterial({
                color: 0x4682B4,
                transparent: true,
                opacity: 0.7,
                roughness: 0.1,
                metalness: 0.1
            }),
            
            // 屋顶材料
            roof: new THREE.MeshStandardMaterial({
                color: 0x2F4F4F,
                roughness: 0.7,
                metalness: 0.2
            }),
            
            // 门材料
            door: new THREE.MeshStandardMaterial({
                color: 0x654321,
                roughness: 0.6,
                metalness: 0.1
            }),
            
            // 基础材料
            foundation: new THREE.MeshStandardMaterial({
                color: 0x696969,
                roughness: 0.9,
                metalness: 0.1
            }),
            
            // 栏杆材料
            railing: new THREE.MeshStandardMaterial({
                color: 0x4682B4,
                roughness: 0.4,
                metalness: 0.7
            }),
            
            // 标识牌材料
            signage: new THREE.MeshStandardMaterial({
                color: 0x000080,
                roughness: 0.3,
                metalness: 0.2
            })
        };
    }
    
    /**
     * 创建基础
     */
    createFoundation() {
        const foundationGroup = new THREE.Group();
        foundationGroup.name = '建筑基础';
        
        // 主基础
        const foundationGeometry = new THREE.BoxGeometry(
            this.config.width + 1,
            this.config.foundationHeight,
            this.config.depth + 1
        );
        const foundation = new THREE.Mesh(foundationGeometry, this.materials.foundation);
        foundation.position.y = this.config.foundationHeight / 2;
        foundation.castShadow = true;
        foundation.receiveShadow = true;
        foundationGroup.add(foundation);
        
        // 基础装饰线条
        const decorativeStripGeometry = new THREE.BoxGeometry(
            this.config.width + 1.2,
            0.1,
            this.config.depth + 1.2
        );
        const decorativeStrip = new THREE.Mesh(decorativeStripGeometry, this.materials.steel);
        decorativeStrip.position.y = this.config.foundationHeight + 0.05;
        foundationGroup.add(decorativeStrip);
        
        this.components.foundation = foundationGroup;
        this.group.add(foundationGroup);
    }
    
    /**
     * 创建主体结构
     */
    createMainStructure() {
        const structureGroup = new THREE.Group();
        structureGroup.name = '主体结构';
        
        // 一层墙体
        this.createFloorWalls(structureGroup, 1, this.config.foundationHeight, this.config.firstFloorHeight);
        
        // 二层墙体
        this.createFloorWalls(structureGroup, 2, this.config.foundationHeight + this.config.firstFloorHeight, this.config.secondFloorHeight);
        
        // 楼板（按新的楼层高度上移）
        this.createFloorSlab(structureGroup, this.config.foundationHeight + this.config.firstFloorHeight);
        
        // 结构柱
        this.createStructuralColumns(structureGroup);
        
        this.components.structure = structureGroup;
        this.group.add(structureGroup);
    }
    
    /**
     * 创建楼层墙体
     */
    createFloorWalls(parentGroup, floor, baseHeight, floorHeight) {
        const wallGroup = new THREE.Group();
        wallGroup.name = `${floor}层墙体`;
        
        // 前墙（南墙）
        const frontWallGeometry = new THREE.BoxGeometry(
            this.config.width,
            floorHeight,
            this.config.wallThickness
        );
        const frontWall = new THREE.Mesh(frontWallGeometry, this.materials.concrete);
        frontWall.position.set(0, baseHeight + floorHeight / 2, -this.config.depth / 2);
        frontWall.castShadow = true;
        frontWall.receiveShadow = true;
        wallGroup.add(frontWall);
        
        // 后墙（北墙）
        const backWallGeometry = new THREE.BoxGeometry(
            this.config.width,
            floorHeight,
            this.config.wallThickness
        );
        const backWall = new THREE.Mesh(backWallGeometry, this.materials.concrete);
        backWall.position.set(0, baseHeight + floorHeight / 2, this.config.depth / 2);
        backWall.castShadow = true;
        backWall.receiveShadow = true;
        wallGroup.add(backWall);
        
        // 左墙（西墙）
        const leftWallGeometry = new THREE.BoxGeometry(
            this.config.wallThickness,
            floorHeight,
            this.config.depth
        );
        const leftWall = new THREE.Mesh(leftWallGeometry, this.materials.concrete);
        leftWall.position.set(-this.config.width / 2, baseHeight + floorHeight / 2, 0);
        leftWall.castShadow = true;
        leftWall.receiveShadow = true;
        wallGroup.add(leftWall);
        
        // 右墙（东墙）
        const rightWallGeometry = new THREE.BoxGeometry(
            this.config.wallThickness,
            floorHeight,
            this.config.depth
        );
        const rightWall = new THREE.Mesh(rightWallGeometry, this.materials.concrete);
        rightWall.position.set(this.config.width / 2, baseHeight + floorHeight / 2, 0);
        rightWall.castShadow = true;
        rightWall.receiveShadow = true;
        wallGroup.add(rightWall);
        
        // 添加楼层标识带（区分一二层）
        if (floor === 2) {
            const floorBandGeometry = new THREE.BoxGeometry(
                this.config.width + 0.1,
                0.3,
                this.config.wallThickness + 0.05
            );
            const floorBand = new THREE.Mesh(floorBandGeometry, this.materials.steel);
            floorBand.position.set(0, baseHeight - 0.15, -this.config.depth / 2 - 0.025);
            wallGroup.add(floorBand);
            
            // 后墙楼层标识带
            const backFloorBand = new THREE.Mesh(floorBandGeometry, this.materials.steel);
            backFloorBand.position.set(0, baseHeight - 0.15, this.config.depth / 2 + 0.025);
            wallGroup.add(backFloorBand);
        }
        
        parentGroup.add(wallGroup);
    }
    
    /**
     * 创建楼板
     */
    createFloorSlab(parentGroup, height) {
        const slabGeometry = new THREE.BoxGeometry(
            this.config.width,
            0.2,
            this.config.depth
        );
        const slab = new THREE.Mesh(slabGeometry, this.materials.concrete);
        slab.position.set(0, height, 0);
        slab.castShadow = true;
        slab.receiveShadow = true;
        parentGroup.add(slab);
    }
    
    /**
     * 创建结构柱
     */
    createStructuralColumns(parentGroup) {
        const columnGroup = new THREE.Group();
        columnGroup.name = '结构柱';
        
        const columnGeometry = new THREE.BoxGeometry(0.4, this.config.firstFloorHeight + this.config.secondFloorHeight, 0.4);
        const totalHeight = this.config.firstFloorHeight + this.config.secondFloorHeight;
        
        // 四角结构柱
        const columnPositions = [
            { x: -this.config.width / 2 + 1, z: -this.config.depth / 2 + 1 },
            { x: this.config.width / 2 - 1, z: -this.config.depth / 2 + 1 },
            { x: -this.config.width / 2 + 1, z: this.config.depth / 2 - 1 },
            { x: this.config.width / 2 - 1, z: this.config.depth / 2 - 1 }
        ];
        
        columnPositions.forEach((pos, index) => {
            const column = new THREE.Mesh(columnGeometry, this.materials.steel);
            column.position.set(
                pos.x,
                this.config.foundationHeight + totalHeight / 2,
                pos.z
            );
            column.castShadow = true;
            column.receiveShadow = true;
            columnGroup.add(column);
        });
        
        parentGroup.add(columnGroup);
    }
    
    /**
     * 创建屋顶
     */
    createRoof() {
        const roofGroup = new THREE.Group();
        roofGroup.name = '屋顶系统';
        
        const roofHeight = this.config.foundationHeight + this.config.firstFloorHeight + this.config.secondFloorHeight;
        
        // 主屋顶
        const roofGeometry = new THREE.BoxGeometry(
            this.config.width + this.config.roofOverhang * 2,
            0.15,
            this.config.depth + this.config.roofOverhang * 2
        );
        const roof = new THREE.Mesh(roofGeometry, this.materials.roof);
        roof.position.set(0, roofHeight + 0.075, 0);
        roof.castShadow = true;
        roof.receiveShadow = true;
        roofGroup.add(roof);
        
        // 屋顶边缘装饰
        const edgeGeometry = new THREE.BoxGeometry(
            this.config.width + this.config.roofOverhang * 2 + 0.2,
            0.3,
            0.2
        );
        
        // 前后边缘
        [-this.config.depth / 2 - this.config.roofOverhang, this.config.depth / 2 + this.config.roofOverhang].forEach(z => {
            const edge = new THREE.Mesh(edgeGeometry, this.materials.steel);
            edge.position.set(0, roofHeight + 0.225, z);
            roofGroup.add(edge);
        });
        
        // 左右边缘
        const sideEdgeGeometry = new THREE.BoxGeometry(
            0.2,
            0.3,
            this.config.depth + this.config.roofOverhang * 2
        );
        
        [-this.config.width / 2 - this.config.roofOverhang, this.config.width / 2 + this.config.roofOverhang].forEach(x => {
            const edge = new THREE.Mesh(sideEdgeGeometry, this.materials.steel);
            edge.position.set(x, roofHeight + 0.225, 0);
            roofGroup.add(edge);
        });
        
        this.components.roof = roofGroup;
        this.group.add(roofGroup);
    }
    
    /**
     * 创建窗户
     */
    createWindows() {
        const windowGroup = new THREE.Group();
        windowGroup.name = '窗户系统';
        
        // 一层窗户
        this.createFloorWindows(windowGroup, 1, this.config.foundationHeight + this.config.firstFloorHeight / 2);
        
        // 二层窗户
        this.createFloorWindows(windowGroup, 2, this.config.foundationHeight + this.config.firstFloorHeight + this.config.secondFloorHeight / 2);
        
        this.components.windows = windowGroup;
        this.group.add(windowGroup);
    }
    
    /**
     * 创建楼层窗户
     */
    createFloorWindows(parentGroup, floor, centerHeight) {
        // 前墙窗户（3个）
        for (let i = 0; i < 3; i++) {
            const windowX = -this.config.width / 2 + (i + 1) * this.config.width / 4;
            this.createWindow(parentGroup, windowX, centerHeight, -this.config.depth / 2 - 0.05, 'front');
        }
        
        // 后墙窗户（2个）
        for (let i = 0; i < 2; i++) {
            const windowX = -this.config.width / 2 + (i + 1) * this.config.width / 3;
            this.createWindow(parentGroup, windowX, centerHeight, this.config.depth / 2 + 0.05, 'back');
        }
        
        // 侧墙窗户
        const sideWindowZ = -this.config.depth / 4;
        this.createWindow(parentGroup, -this.config.width / 2 - 0.05, centerHeight, sideWindowZ, 'left');
        this.createWindow(parentGroup, this.config.width / 2 + 0.05, centerHeight, sideWindowZ, 'right');
    }
    
    /**
     * 创建单个窗户
     */
    createWindow(parentGroup, x, y, z, orientation) {
        const windowGroup = new THREE.Group();
        
        // 窗台
        let sillGeometry;
        if (orientation === 'front' || orientation === 'back') {
            sillGeometry = new THREE.BoxGeometry(this.config.windowWidth + 0.3, 0.15, 0.25);
        } else {
            sillGeometry = new THREE.BoxGeometry(0.25, 0.15, this.config.windowWidth + 0.3);
        }
        
        const sill = new THREE.Mesh(sillGeometry, this.materials.concrete);
        sill.position.set(x, y - this.config.windowHeight / 2 - 0.075, z);
        sill.castShadow = true;
        windowGroup.add(sill);
        
        // 外窗框
        const frameThickness = 0.08;
        let outerFrameGeometry;
        
        if (orientation === 'front' || orientation === 'back') {
            outerFrameGeometry = new THREE.BoxGeometry(this.config.windowWidth + 0.2, this.config.windowHeight + 0.2, frameThickness);
        } else {
            outerFrameGeometry = new THREE.BoxGeometry(frameThickness, this.config.windowHeight + 0.2, this.config.windowWidth + 0.2);
        }
        
        const outerFrame = new THREE.Mesh(outerFrameGeometry, this.materials.steel);
        outerFrame.position.set(x, y, z);
        outerFrame.castShadow = true;
        windowGroup.add(outerFrame);
        
        // 内窗框
        const innerFrameThickness = 0.04;
        let innerFrameGeometry;
        
        if (orientation === 'front' || orientation === 'back') {
            innerFrameGeometry = new THREE.BoxGeometry(this.config.windowWidth, this.config.windowHeight, innerFrameThickness);
        } else {
            innerFrameGeometry = new THREE.BoxGeometry(innerFrameThickness, this.config.windowHeight, this.config.windowWidth);
        }
        
        const innerFrame = new THREE.Mesh(innerFrameGeometry, this.materials.steel);
        innerFrame.position.set(x, y, z);
        windowGroup.add(innerFrame);
        
        // 玻璃
        let glassGeometry;
        if (orientation === 'front' || orientation === 'back') {
            glassGeometry = new THREE.BoxGeometry(this.config.windowWidth - 0.1, this.config.windowHeight - 0.1, 0.02);
        } else {
            glassGeometry = new THREE.BoxGeometry(0.02, this.config.windowHeight - 0.1, this.config.windowWidth - 0.1);
        }
        
        const glass = new THREE.Mesh(glassGeometry, this.materials.glass);
        glass.position.set(x, y, z);
        windowGroup.add(glass);
        
        // 窗户分隔条（十字形）
        const dividerMaterial = new THREE.MeshStandardMaterial({
            color: 0x404040,
            roughness: 0.4,
            metalness: 0.6
        });
        
        // 垂直分隔条
        let verticalDividerGeometry;
        if (orientation === 'front' || orientation === 'back') {
            verticalDividerGeometry = new THREE.BoxGeometry(0.03, this.config.windowHeight - 0.1, 0.03);
        } else {
            verticalDividerGeometry = new THREE.BoxGeometry(0.03, this.config.windowHeight - 0.1, 0.03);
        }
        
        const verticalDivider = new THREE.Mesh(verticalDividerGeometry, dividerMaterial);
        verticalDivider.position.set(x, y, z);
        windowGroup.add(verticalDivider);
        
        // 水平分隔条
        let horizontalDividerGeometry;
        if (orientation === 'front' || orientation === 'back') {
            horizontalDividerGeometry = new THREE.BoxGeometry(this.config.windowWidth - 0.1, 0.03, 0.03);
        } else {
            horizontalDividerGeometry = new THREE.BoxGeometry(0.03, 0.03, this.config.windowWidth - 0.1);
        }
        
        const horizontalDivider = new THREE.Mesh(horizontalDividerGeometry, dividerMaterial);
        horizontalDivider.position.set(x, y, z);
        windowGroup.add(horizontalDivider);
        
        parentGroup.add(windowGroup);
    }
    
    /**
     * 创建门
     */
    createDoors() {
        const doorGroup = new THREE.Group();
        doorGroup.name = '门系统';
        
        // 主入口门（一层前门）
        this.createDoor(doorGroup, 0, this.config.foundationHeight + this.config.doorHeight / 2, -this.config.depth / 2 - 0.05, 'main');
        
        // 侧门（一层左侧）
        this.createDoor(doorGroup, -this.config.width / 2 - 0.05, this.config.foundationHeight + this.config.doorHeight / 2, this.config.depth / 4, 'side');
        
        this.components.doors = doorGroup;
        this.group.add(doorGroup);
    }
    
    /**
     * 创建单个门
     */
    createDoor(parentGroup, x, y, z, type) {
        const doorGroup = new THREE.Group();
        
        // 门框
        let doorFrameGeometry;
        if (type === 'main') {
            doorFrameGeometry = new THREE.BoxGeometry(this.config.doorWidth + 0.2, this.config.doorHeight + 0.2, 0.15);
        } else {
            doorFrameGeometry = new THREE.BoxGeometry(0.15, this.config.doorHeight + 0.2, this.config.doorWidth + 0.2);
        }
        
        const doorFrame = new THREE.Mesh(doorFrameGeometry, this.materials.steel);
        doorFrame.position.set(x, y, z);
        doorFrame.castShadow = true;
        doorGroup.add(doorFrame);
        
        // 门扇
        let doorGeometry;
        if (type === 'main') {
            doorGeometry = new THREE.BoxGeometry(this.config.doorWidth, this.config.doorHeight, 0.08);
        } else {
            doorGeometry = new THREE.BoxGeometry(0.08, this.config.doorHeight, this.config.doorWidth);
        }
        
        const door = new THREE.Mesh(doorGeometry, this.materials.door);
        door.position.set(x, y, z);
        door.castShadow = true;
        doorGroup.add(door);
        
        // 门把手
        const handleGeometry = new THREE.BoxGeometry(0.15, 0.05, 0.03);
        const handle = new THREE.Mesh(handleGeometry, this.materials.steel);
        
        if (type === 'main') {
            handle.position.set(x + this.config.doorWidth / 3, y - 0.2, z - 0.05);
        } else {
            handle.position.set(x - 0.05, y - 0.2, z + this.config.doorWidth / 3);
        }
        doorGroup.add(handle);
        
        // 门锁
        const lockGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.05, 8);
        const lock = new THREE.Mesh(lockGeometry, this.materials.steel);
        
        if (type === 'main') {
            lock.position.set(x + this.config.doorWidth / 3, y - 0.2, z - 0.06);
            lock.rotation.x = Math.PI / 2;
        } else {
            lock.position.set(x - 0.06, y - 0.2, z + this.config.doorWidth / 3);
            lock.rotation.z = Math.PI / 2;
        }
        doorGroup.add(lock);
        
        // 门牌号
        if (type === 'main') {
            const signGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.02);
            const sign = new THREE.Mesh(signGeometry, this.materials.signage);
            sign.position.set(x - this.config.doorWidth / 2 - 0.2, y + this.config.doorHeight / 2 - 0.3, z - 0.08);
            doorGroup.add(sign);
            
            // 门牌号文字背景
            const textBgGeometry = new THREE.BoxGeometry(0.28, 0.13, 0.01);
            const textBg = new THREE.Mesh(textBgGeometry, new THREE.MeshStandardMaterial({
                color: 0xF0F8FF,
                roughness: 0.2,
                metalness: 0.1
            }));
            textBg.position.set(x - this.config.doorWidth / 2 - 0.2, y + this.config.doorHeight / 2 - 0.3, z - 0.09);
            doorGroup.add(textBg);
        }
        
        // 门槛
        let thresholdGeometry;
        if (type === 'main') {
            thresholdGeometry = new THREE.BoxGeometry(this.config.doorWidth + 0.4, 0.05, 0.3);
        } else {
            thresholdGeometry = new THREE.BoxGeometry(0.3, 0.05, this.config.doorWidth + 0.4);
        }
        
        const threshold = new THREE.Mesh(thresholdGeometry, this.materials.concrete);
        threshold.position.set(x, y - this.config.doorHeight / 2 - 0.025, z);
        threshold.castShadow = true;
        doorGroup.add(threshold);
        
        parentGroup.add(doorGroup);
    }
    
    /**
     * 创建楼梯
     */
    createStaircase() {
        const stairGroup = new THREE.Group();
        stairGroup.name = '楼梯系统';
        
        // 外部楼梯（通往二层）
        const stairX = this.config.width / 2 + 2;
        const stairStartY = this.config.foundationHeight;
        const stairEndY = this.config.foundationHeight + this.config.firstFloorHeight;
        const stairLength = 8;
        
        // 楼梯梁
        const stairBeamGeometry = new THREE.BoxGeometry(0.3, 0.2, stairLength);
        const leftBeam = new THREE.Mesh(stairBeamGeometry, this.materials.steel);
        leftBeam.position.set(stairX - this.config.stairWidth / 2, (stairStartY + stairEndY) / 2, -stairLength / 2);
        leftBeam.rotation.x = -Math.atan((stairEndY - stairStartY) / stairLength);
        stairGroup.add(leftBeam);
        
        const rightBeam = new THREE.Mesh(stairBeamGeometry, this.materials.steel);
        rightBeam.position.set(stairX + this.config.stairWidth / 2, (stairStartY + stairEndY) / 2, -stairLength / 2);
        rightBeam.rotation.x = -Math.atan((stairEndY - stairStartY) / stairLength);
        stairGroup.add(rightBeam);
        
        // 楼梯踏步
        const stepHeight = (stairEndY - stairStartY) / this.config.stairSteps;
        const stepDepth = stairLength / this.config.stairSteps;
        
        for (let i = 0; i < this.config.stairSteps; i++) {
            const stepGeometry = new THREE.BoxGeometry(this.config.stairWidth, 0.05, stepDepth);
            const step = new THREE.Mesh(stepGeometry, this.materials.concrete);
            step.position.set(
                stairX,
                stairStartY + (i + 1) * stepHeight,
                -stairLength + (i + 0.5) * stepDepth
            );
            step.castShadow = true;
            step.receiveShadow = true;
            stairGroup.add(step);
        }
        
        // 楼梯栏杆
        this.createStairRailing(stairGroup, stairX, stairStartY, stairEndY, stairLength);
        
        this.components.staircase = stairGroup;
        this.group.add(stairGroup);
    }
    
    /**
     * 创建楼梯栏杆
     */
    createStairRailing(parentGroup, stairX, startY, endY, length) {
        const railingGroup = new THREE.Group();
        
        // 栏杆立柱
        const postGeometry = new THREE.CylinderGeometry(0.03, 0.03, this.config.railingHeight, 8);
        const postCount = 8;
        
        for (let i = 0; i <= postCount; i++) {
            const post = new THREE.Mesh(postGeometry, this.materials.railing);
            const t = i / postCount;
            post.position.set(
                stairX + this.config.stairWidth / 2 + 0.1,
                startY + t * (endY - startY) + this.config.railingHeight / 2,
                -length + t * length
            );
            railingGroup.add(post);
        }
        
        // 栏杆扶手
        const handrailGeometry = new THREE.CylinderGeometry(0.02, 0.02, length, 8);
        const handrail = new THREE.Mesh(handrailGeometry, this.materials.railing);
        handrail.position.set(
            stairX + this.config.stairWidth / 2 + 0.1,
            startY + (endY - startY) / 2 + this.config.railingHeight - 0.1,
            -length / 2
        );
        handrail.rotation.x = -Math.atan((endY - startY) / length);
        handrail.rotation.z = Math.PI / 2;
        railingGroup.add(handrail);
        
        parentGroup.add(railingGroup);
    }
    
    /**
     * 创建平台
     */
    createPlatforms() {
        const platformGroup = new THREE.Group();
        platformGroup.name = '平台系统';
        
        // 主入口平台
        const mainPlatformGeometry = new THREE.BoxGeometry(
            this.config.platformWidth,
            0.15,
            this.config.platformDepth
        );
        const mainPlatform = new THREE.Mesh(mainPlatformGeometry, this.materials.concrete);
        mainPlatform.position.set(0, this.config.foundationHeight + 0.075, -this.config.depth / 2 - this.config.platformDepth / 2);
        mainPlatform.castShadow = true;
        mainPlatform.receiveShadow = true;
        platformGroup.add(mainPlatform);
        
        // 二层外部平台
        const secondFloorPlatformGeometry = new THREE.BoxGeometry(
            this.config.platformWidth,
            0.15,
            this.config.platformDepth
        );
        const secondFloorPlatform = new THREE.Mesh(secondFloorPlatformGeometry, this.materials.concrete);
        secondFloorPlatform.position.set(
            this.config.width / 2 + 1.5,
            this.config.foundationHeight + this.config.firstFloorHeight + 0.075,
            0
        );
        secondFloorPlatform.castShadow = true;
        secondFloorPlatform.receiveShadow = true;
        platformGroup.add(secondFloorPlatform);
        
        this.components.platforms = platformGroup;
        this.group.add(platformGroup);
    }
    
    /**
     * 创建外部特征
     */
    createExternalFeatures() {
        const featuresGroup = new THREE.Group();
        featuresGroup.name = '外部特征';
        
        // 空调外机
        this.createAirConditioners(featuresGroup);
        
        // 管道系统
        this.createExternalPipes(featuresGroup);
        
        // 照明设备
        this.createLighting(featuresGroup);
        
        // 工业设备外壳
        this.createIndustrialEquipment(featuresGroup);
        
        // 通风设备
        this.createVentilationSystem(featuresGroup);
        
        // 电缆桥架
        this.createCableTray(featuresGroup);
        
        // 安全设施
        this.createSafetyFeatures(featuresGroup);
        
        // 工业标识
        this.createIndustrialMarkings(featuresGroup);
        
        this.components.externalFeatures = featuresGroup;
        this.group.add(featuresGroup);
    }
    
    /**
     * 创建空调外机
     */
    createAirConditioners(parentGroup) {
        const acGroup = new THREE.Group();
        
        // 空调外机材质
        const acMaterial = new THREE.MeshStandardMaterial({
            color: 0xF5F5F5,
            roughness: 0.4,
            metalness: 0.3
        });
        
        const fanMaterial = new THREE.MeshStandardMaterial({
            color: 0x2F2F2F,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // 一层空调外机组
        for (let i = 0; i < 2; i++) {
            const acUnit = new THREE.Group();
            
            // 主机箱
            const acGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.4);
            const acBox = new THREE.Mesh(acGeometry, acMaterial);
            acBox.castShadow = true;
            acUnit.add(acBox);
            
            // 散热格栅
            for (let j = 0; j < 8; j++) {
                const grillGeometry = new THREE.BoxGeometry(1.0, 0.02, 0.02);
                const grill = new THREE.Mesh(grillGeometry, fanMaterial);
                grill.position.set(0, -0.3 + j * 0.08, 0.21);
                acUnit.add(grill);
            }
            
            // 风扇
            const fanGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.05, 8);
            const fan = new THREE.Mesh(fanGeometry, fanMaterial);
            fan.rotation.x = Math.PI / 2;
            fan.position.set(0, 0, 0.225);
            acUnit.add(fan);
            
            // 支架
            const bracketGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
            const bracket1 = new THREE.Mesh(bracketGeometry, this.materials.steel);
            bracket1.position.set(-0.5, -0.65, 0);
            acUnit.add(bracket1);
            
            const bracket2 = new THREE.Mesh(bracketGeometry, this.materials.steel);
            bracket2.position.set(0.5, -0.65, 0);
            acUnit.add(bracket2);
            
            // 位置设置
            acUnit.position.set(
                -this.config.width / 2 - 0.7,
                this.config.foundationHeight + 2.5 + i * 0.1,
                this.config.depth / 2 + 0.2 + i * 1.5
            );
            
            acGroup.add(acUnit);
        }
        
        // 二层空调外机组
        for (let i = 0; i < 3; i++) {
            const acUnit = new THREE.Group();
            
            // 主机箱
            const acGeometry = new THREE.BoxGeometry(1.0, 0.7, 0.35);
            const acBox = new THREE.Mesh(acGeometry, acMaterial);
            acBox.castShadow = true;
            acUnit.add(acBox);
            
            // 散热格栅
            for (let j = 0; j < 6; j++) {
                const grillGeometry = new THREE.BoxGeometry(0.8, 0.02, 0.02);
                const grill = new THREE.Mesh(grillGeometry, fanMaterial);
                grill.position.set(0, -0.25 + j * 0.08, 0.18);
                acUnit.add(grill);
            }
            
            // 风扇
            const fanGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.04, 8);
            const fan = new THREE.Mesh(fanGeometry, fanMaterial);
            fan.rotation.x = Math.PI / 2;
            fan.position.set(0, 0, 0.195);
            acUnit.add(fan);
            
            // 支架
            const bracketGeometry = new THREE.BoxGeometry(0.08, 0.4, 0.08);
            const bracket1 = new THREE.Mesh(bracketGeometry, this.materials.steel);
            bracket1.position.set(-0.4, -0.55, 0);
            acUnit.add(bracket1);
            
            const bracket2 = new THREE.Mesh(bracketGeometry, this.materials.steel);
            bracket2.position.set(0.4, -0.55, 0);
            acUnit.add(bracket2);
            
            // 位置设置
            acUnit.position.set(
                -this.config.width / 2 - 0.6,
                this.config.foundationHeight + this.config.firstFloorHeight + 2.5,
                this.config.depth / 2 + 0.2 + i * 1.2
            );
            
            acGroup.add(acUnit);
        }
        
        parentGroup.add(acGroup);
    }
    
    /**
     * 创建外部管道
     */
    createExternalPipes(parentGroup) {
        const pipeGroup = new THREE.Group();
        
        // 垂直主管道
        const mainPipeGeometry = new THREE.CylinderGeometry(0.1, 0.1, this.config.firstFloorHeight + this.config.secondFloorHeight, 8);
        const mainPipe = new THREE.Mesh(mainPipeGeometry, this.materials.steel);
        mainPipe.position.set(
            -this.config.width / 2 - 0.3,
            this.config.foundationHeight + (this.config.firstFloorHeight + this.config.secondFloorHeight) / 2,
            -this.config.depth / 2 - 0.3
        );
        pipeGroup.add(mainPipe);
        
        // 水平连接管道
        const horizontalPipeGeometry = new THREE.CylinderGeometry(0.05, 0.05, 2, 8);
        const horizontalPipe = new THREE.Mesh(horizontalPipeGeometry, this.materials.steel);
        horizontalPipe.position.set(-this.config.width / 2 - 1.3, this.config.foundationHeight + 2, this.config.depth / 2 + 0.2);
        horizontalPipe.rotation.z = Math.PI / 2;
        pipeGroup.add(horizontalPipe);
        
        parentGroup.add(pipeGroup);
    }
    
    /**
     * 创建工业设备外壳
     */
    createIndustrialEquipment(parentGroup) {
        const equipmentGroup = new THREE.Group();
        
        // 配电箱
        const electricalBoxGeometry = new THREE.BoxGeometry(1.2, 1.8, 0.4);
        const electricalBoxMaterial = new THREE.MeshStandardMaterial({
            color: 0x2F4F4F,
            roughness: 0.4,
            metalness: 0.8
        });
        const electricalBox = new THREE.Mesh(electricalBoxGeometry, electricalBoxMaterial);
        electricalBox.position.set(
            this.config.width / 2 + 0.25,
            this.config.foundationHeight + 1.5,
            -this.config.depth / 2 + 2
        );
        electricalBox.castShadow = true;
        equipmentGroup.add(electricalBox);
        
        // 配电箱门把手
        const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
        const handle = new THREE.Mesh(handleGeometry, this.materials.steel);
        handle.position.set(
            this.config.width / 2 + 0.45,
            this.config.foundationHeight + 1.5,
            -this.config.depth / 2 + 2
        );
        handle.rotation.z = Math.PI / 2;
        equipmentGroup.add(handle);
        
        // 变压器外壳
        const transformerGeometry = new THREE.CylinderGeometry(0.8, 0.8, 2.5, 8);
        const transformerMaterial = new THREE.MeshStandardMaterial({
            color: 0x708090,
            roughness: 0.3,
            metalness: 0.9
        });
        const transformer = new THREE.Mesh(transformerGeometry, transformerMaterial);
        transformer.position.set(
            this.config.width / 2 + 1.5,
            this.config.foundationHeight + 1.25,
            this.config.depth / 2 - 2
        );
        transformer.castShadow = true;
        equipmentGroup.add(transformer);
        
        // 变压器散热片
        for (let i = 0; i < 8; i++) {
            const finGeometry = new THREE.BoxGeometry(0.05, 2.0, 0.3);
            const fin = new THREE.Mesh(finGeometry, transformerMaterial);
            const angle = (i / 8) * Math.PI * 2;
            fin.position.set(
                this.config.width / 2 + 1.5 + Math.cos(angle) * 0.85,
                this.config.foundationHeight + 1.25,
                this.config.depth / 2 - 2 + Math.sin(angle) * 0.85
            );
            fin.rotation.y = angle;
            equipmentGroup.add(fin);
        }
        
        // 控制柜
        const controlCabinetGeometry = new THREE.BoxGeometry(0.8, 2.2, 0.6);
        const controlCabinet = new THREE.Mesh(controlCabinetGeometry, electricalBoxMaterial);
        controlCabinet.position.set(
            -this.config.width / 2 - 0.4,
            this.config.foundationHeight + 1.1,
            this.config.depth / 2 - 1
        );
        controlCabinet.castShadow = true;
        equipmentGroup.add(controlCabinet);
        
        // 控制柜指示灯
        const indicatorColors = [0xFF0000, 0x00FF00, 0x0000FF, 0xFFFF00];
        for (let i = 0; i < 4; i++) {
            const indicatorGeometry = new THREE.CylinderGeometry(0.03, 0.03, 0.02, 8);
            const indicatorMaterial = new THREE.MeshStandardMaterial({
                color: indicatorColors[i],
                emissive: indicatorColors[i],
                emissiveIntensity: 0.3
            });
            const indicator = new THREE.Mesh(indicatorGeometry, indicatorMaterial);
            indicator.position.set(
                -this.config.width / 2 - 0.7,
                this.config.foundationHeight + 1.8 - i * 0.15,
                this.config.depth / 2 - 1
            );
            indicator.rotation.z = Math.PI / 2;
            equipmentGroup.add(indicator);
        }
        
        parentGroup.add(equipmentGroup);
    }
    
    /**
     * 创建通风设备
     */
    createVentilationSystem(parentGroup) {
        const ventGroup = new THREE.Group();
        
        // 屋顶通风机
        const ventFanGeometry = new THREE.CylinderGeometry(0.6, 0.6, 0.8, 12);
        const ventFanMaterial = new THREE.MeshStandardMaterial({
            color: 0x4682B4,
            roughness: 0.3,
            metalness: 0.8
        });
        
        for (let i = 0; i < 3; i++) {
            const ventFan = new THREE.Mesh(ventFanGeometry, ventFanMaterial);
            ventFan.position.set(
                -this.config.width / 2 + 5 + i * 8,
                this.config.foundationHeight + this.config.firstFloorHeight + this.config.secondFloorHeight + this.config.roofHeight + 0.4,
                0
            );
            ventFan.castShadow = true;
            ventGroup.add(ventFan);
            
            // 通风机叶片
            for (let j = 0; j < 6; j++) {
                const bladeGeometry = new THREE.BoxGeometry(0.05, 0.4, 0.1);
                const blade = new THREE.Mesh(bladeGeometry, ventFanMaterial);
                const angle = (j / 6) * Math.PI * 2;
                blade.position.set(
                    Math.cos(angle) * 0.3,
                    0.3,
                    Math.sin(angle) * 0.3
                );
                blade.rotation.y = angle + Math.PI / 4;
                ventFan.add(blade);
            }
            
            // 通风机底座
            const baseGeometry = new THREE.CylinderGeometry(0.8, 0.8, 0.2, 12);
            const base = new THREE.Mesh(baseGeometry, this.materials.steel);
            base.position.set(0, -0.5, 0);
            ventFan.add(base);
        }
        
        // 排风口
        const exhaustVentGeometry = new THREE.BoxGeometry(1.0, 0.8, 0.3);
        const exhaustVentMaterial = new THREE.MeshStandardMaterial({
            color: 0x696969,
            roughness: 0.4,
            metalness: 0.6
        });
        
        // 侧墙排风口
        for (let i = 0; i < 4; i++) {
            const exhaustVent = new THREE.Mesh(exhaustVentGeometry, exhaustVentMaterial);
            exhaustVent.position.set(
                this.config.width / 2 + 0.2,
                this.config.foundationHeight + 2 + i * 1.5,
                -this.config.depth / 2 + 3 + i * 2
            );
            ventGroup.add(exhaustVent);
            
            // 排风口百叶窗
            for (let j = 0; j < 8; j++) {
                const louverGeometry = new THREE.BoxGeometry(0.9, 0.02, 0.1);
                const louver = new THREE.Mesh(louverGeometry, exhaustVentMaterial);
                louver.position.set(0, -0.3 + j * 0.08, 0);
                louver.rotation.x = Math.PI / 6;
                exhaustVent.add(louver);
            }
        }
        
        parentGroup.add(ventGroup);
    }
    
    /**
     * 创建电缆桥架
     */
    createCableTray(parentGroup) {
        const cableTrayGroup = new THREE.Group();
        
        const trayMaterial = new THREE.MeshStandardMaterial({
            color: 0x708090,
            roughness: 0.4,
            metalness: 0.8
        });
        
        // 主桥架 - 沿建筑外墙
        const mainTrayGeometry = new THREE.BoxGeometry(0.3, 0.1, this.config.depth);
        const mainTray = new THREE.Mesh(mainTrayGeometry, trayMaterial);
        mainTray.position.set(
            -this.config.width / 2 - 0.5,
            this.config.foundationHeight + 3.5,
            0
        );
        cableTrayGroup.add(mainTray);
        
        // 桥架支架
        for (let i = 0; i < 5; i++) {
            const bracketGeometry = new THREE.BoxGeometry(0.05, 0.8, 0.05);
            const bracket = new THREE.Mesh(bracketGeometry, trayMaterial);
            bracket.position.set(
                -this.config.width / 2 - 0.5,
                this.config.foundationHeight + 3.1,
                -this.config.depth / 2 + i * (this.config.depth / 4)
            );
            cableTrayGroup.add(bracket);
            
            // 支架连接件
            const connectorGeometry = new THREE.BoxGeometry(0.4, 0.05, 0.05);
            const connector = new THREE.Mesh(connectorGeometry, trayMaterial);
            connector.position.set(
                -this.config.width / 2 - 0.3,
                this.config.foundationHeight + 3.5,
                -this.config.depth / 2 + i * (this.config.depth / 4)
            );
            cableTrayGroup.add(connector);
        }
        
        // 垂直桥架
        const verticalTrayGeometry = new THREE.BoxGeometry(0.3, this.config.firstFloorHeight, 0.1);
        const verticalTray = new THREE.Mesh(verticalTrayGeometry, trayMaterial);
        verticalTray.position.set(
            -this.config.width / 2 - 0.5,
            this.config.foundationHeight + this.config.firstFloorHeight / 2,
            this.config.depth / 2 - 1
        );
        cableTrayGroup.add(verticalTray);
        
        // 电缆模拟
        const cableGeometry = new THREE.CylinderGeometry(0.02, 0.02, this.config.depth, 8);
        const cableMaterial = new THREE.MeshStandardMaterial({
            color: 0x000000,
            roughness: 0.8
        });
        
        for (let i = 0; i < 6; i++) {
            const cable = new THREE.Mesh(cableGeometry, cableMaterial);
            cable.position.set(
                -this.config.width / 2 - 0.5 + (i % 3) * 0.05,
                this.config.foundationHeight + 3.45 + Math.floor(i / 3) * 0.03,
                0
            );
            cable.rotation.x = Math.PI / 2;
            cableTrayGroup.add(cable);
        }
        
        parentGroup.add(cableTrayGroup);
    }
    
    /**
     * 创建安全设施
     */
    createSafetyFeatures(parentGroup) {
        const safetyGroup = new THREE.Group();
        
        // 消防栓箱
        const fireHydrantBoxGeometry = new THREE.BoxGeometry(0.8, 1.2, 0.3);
        const fireHydrantMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF0000,
            roughness: 0.3,
            metalness: 0.2
        });
        const fireHydrantBox = new THREE.Mesh(fireHydrantBoxGeometry, fireHydrantMaterial);
        fireHydrantBox.position.set(
            0,
            this.config.foundationHeight + 1.2,
            -this.config.depth / 2 - 0.2
        );
        safetyGroup.add(fireHydrantBox);
        
        // 消防栓箱玻璃门
        const glassGeometry = new THREE.BoxGeometry(0.7, 1.1, 0.02);
        const glass = new THREE.Mesh(glassGeometry, this.materials.glass);
        glass.position.set(0, 0, 0.16);
        fireHydrantBox.add(glass);
        
        // 灭火器箱
        const extinguisherBoxGeometry = new THREE.BoxGeometry(0.4, 0.8, 0.25);
        const extinguisherBox = new THREE.Mesh(extinguisherBoxGeometry, fireHydrantMaterial);
        extinguisherBox.position.set(
            this.config.width / 2 - 2,
            this.config.foundationHeight + 0.8,
            -this.config.depth / 2 - 0.15
        );
        safetyGroup.add(extinguisherBox);
        
        // 应急照明
        const emergencyLightGeometry = new THREE.BoxGeometry(0.3, 0.15, 0.1);
        const emergencyLightMaterial = new THREE.MeshStandardMaterial({
            color: 0x00FF00,
            emissive: 0x004400,
            emissiveIntensity: 0.2
        });
        
        for (let i = 0; i < 4; i++) {
            const emergencyLight = new THREE.Mesh(emergencyLightGeometry, emergencyLightMaterial);
            emergencyLight.position.set(
                -this.config.width / 2 + i * (this.config.width / 3),
                this.config.foundationHeight + this.config.firstFloorHeight - 0.3,
                -this.config.depth / 2 - 0.1
            );
            safetyGroup.add(emergencyLight);
        }
        
        // 安全警示牌
        const warningSignGeometry = new THREE.BoxGeometry(0.6, 0.6, 0.05);
        const warningSignMaterial = new THREE.MeshStandardMaterial({
            color: 0xFFFF00,
            roughness: 0.2
        });
        
        const warningPositions = [
            { x: this.config.width / 2 + 0.05, y: this.config.foundationHeight + 2, z: 0 },
            { x: -this.config.width / 2 - 0.05, y: this.config.foundationHeight + 2, z: 0 },
            { x: 0, y: this.config.foundationHeight + 2, z: this.config.depth / 2 + 0.05 }
        ];
        
        warningPositions.forEach(pos => {
            const warningSign = new THREE.Mesh(warningSignGeometry, warningSignMaterial);
            warningSign.position.set(pos.x, pos.y, pos.z);
            safetyGroup.add(warningSign);
        });
        
        parentGroup.add(safetyGroup);
    }
    
    /**
     * 创建工业标识
     */
    createIndustrialMarkings(parentGroup) {
        const markingGroup = new THREE.Group();
        
        // 楼层标识
        const floorMarkingMaterial = new THREE.MeshStandardMaterial({
            color: 0x000080,
            roughness: 0.2
        });
        
        // 一层标识
        const firstFloorMarkingGeometry = new THREE.BoxGeometry(1.0, 0.3, 0.05);
        const firstFloorMarking = new THREE.Mesh(firstFloorMarkingGeometry, floorMarkingMaterial);
        firstFloorMarking.position.set(
            -this.config.width / 2 + 2,
            this.config.foundationHeight + 1,
            -this.config.depth / 2 - 0.05
        );
        markingGroup.add(firstFloorMarking);
        
        // 二层标识
        const secondFloorMarking = new THREE.Mesh(firstFloorMarkingGeometry, floorMarkingMaterial);
        secondFloorMarking.position.set(
            -this.config.width / 2 + 2,
            this.config.foundationHeight + this.config.firstFloorHeight + 1,
            -this.config.depth / 2 - 0.05
        );
        markingGroup.add(secondFloorMarking);
        
        // 功能区域标识
        const areaSigns = [
            { text: "办公区", x: -8, y: this.config.foundationHeight + 1.5, z: -this.config.depth / 2 - 0.05 },
            { text: "控制室", x: 0, y: this.config.foundationHeight + this.config.firstFloorHeight + 1.5, z: -this.config.depth / 2 - 0.05 },
            { text: "设备间", x: 8, y: this.config.foundationHeight + 1.5, z: -this.config.depth / 2 - 0.05 }
        ];
        
        areaSigns.forEach(sign => {
            const signGeometry = new THREE.BoxGeometry(2.0, 0.4, 0.05);
            const signMesh = new THREE.Mesh(signGeometry, floorMarkingMaterial);
            signMesh.position.set(sign.x, sign.y, sign.z);
            markingGroup.add(signMesh);
            
            // 标识背景
            const backgroundGeometry = new THREE.BoxGeometry(1.9, 0.35, 0.02);
            const background = new THREE.Mesh(backgroundGeometry, new THREE.MeshStandardMaterial({
                color: 0xF5F5DC,
                roughness: 0.2
            }));
            background.position.set(0, 0, -0.025);
            signMesh.add(background);
        });
        
        // 管道标识
        const pipeMarkingGeometry = new THREE.RingGeometry(0.12, 0.15, 8);
        const pipeMarkingMaterial = new THREE.MeshStandardMaterial({
            color: 0xFF6600,
            roughness: 0.3
        });
        
        for (let i = 0; i < 3; i++) {
            const pipeMarking = new THREE.Mesh(pipeMarkingGeometry, pipeMarkingMaterial);
            pipeMarking.position.set(
                -this.config.width / 2 - 0.3,
                this.config.foundationHeight + 2 + i * 2,
                -this.config.depth / 2 - 0.3
            );
            pipeMarking.rotation.x = Math.PI / 2;
            markingGroup.add(pipeMarking);
        }
        
        parentGroup.add(markingGroup);
    }
    
    /**
     * 创建照明设备
     */
    createLighting(parentGroup) {
        const lightingGroup = new THREE.Group();
        
        // 建筑外墙灯具材质
        const lightMaterial = new THREE.MeshStandardMaterial({
            color: 0x2F2F2F,
            roughness: 0.3,
            metalness: 0.7
        });
        
        // LED投光灯
        const floodlightGeometry = new THREE.BoxGeometry(0.4, 0.3, 0.2);
        const floodlights = [
            { x: -this.config.width / 2 - 0.15, y: this.config.foundationHeight + this.config.firstFloorHeight + this.config.secondFloorHeight - 0.5, z: 0 },
            { x: this.config.width / 2 + 0.15, y: this.config.foundationHeight + this.config.firstFloorHeight + this.config.secondFloorHeight - 0.5, z: 0 },
            { x: 0, y: this.config.foundationHeight + this.config.firstFloorHeight + this.config.secondFloorHeight - 0.5, z: -this.config.depth / 2 - 0.15 },
            { x: 0, y: this.config.foundationHeight + this.config.firstFloorHeight + this.config.secondFloorHeight - 0.5, z: this.config.depth / 2 + 0.15 }
        ];
        
        floodlights.forEach(pos => {
            const floodlight = new THREE.Mesh(floodlightGeometry, lightMaterial);
            floodlight.position.set(pos.x, pos.y, pos.z);
            floodlight.castShadow = true;
            lightingGroup.add(floodlight);
            
            // LED灯珠
            const ledGeometry = new THREE.BoxGeometry(0.35, 0.25, 0.05);
            const ledMaterial = new THREE.MeshStandardMaterial({
                color: 0xFFFFE0,
                emissive: 0xFFFFE0,
                emissiveIntensity: 0.1
            });
            const led = new THREE.Mesh(ledGeometry, ledMaterial);
            led.position.set(0, 0, 0.125);
            floodlight.add(led);
        });
        
        // 走廊照明
        const corridorLightGeometry = new THREE.CylinderGeometry(0.15, 0.15, 0.1, 8);
        const corridorLightMaterial = new THREE.MeshStandardMaterial({
            color: 0xF5F5F5,
            emissive: 0xFFFFE0,
            emissiveIntensity: 0.2,
            transparent: true,
            opacity: 0.8
        });
        
        // 一层走廊照明
        for (let i = 0; i < 6; i++) {
            const corridorLight = new THREE.Mesh(corridorLightGeometry, corridorLightMaterial);
            corridorLight.position.set(
                -this.config.width / 2 + 3 + i * 4,
                this.config.foundationHeight + this.config.firstFloorHeight - 0.2,
                -this.config.depth / 2 - 0.1
            );
            lightingGroup.add(corridorLight);
        }
        
        // 二层走廊照明
        for (let i = 0; i < 6; i++) {
            const corridorLight = new THREE.Mesh(corridorLightGeometry, corridorLightMaterial);
            corridorLight.position.set(
                -this.config.width / 2 + 3 + i * 4,
                this.config.foundationHeight + this.config.firstFloorHeight + this.config.secondFloorHeight - 0.2,
                -this.config.depth / 2 - 0.1
            );
            lightingGroup.add(corridorLight);
        }
        
        // 景观照明柱
        const lightPoleGeometry = new THREE.CylinderGeometry(0.05, 0.05, 3.5, 8);
        const lightPoleMaterial = new THREE.MeshStandardMaterial({
            color: 0x2F2F2F,
            roughness: 0.4,
            metalness: 0.8
        });
        
        const lightPolePositions = [
            { x: -this.config.width / 2 - 3, z: -this.config.depth / 2 - 3 },
            { x: this.config.width / 2 + 3, z: -this.config.depth / 2 - 3 },
            { x: -this.config.width / 2 - 3, z: this.config.depth / 2 + 3 },
            { x: this.config.width / 2 + 3, z: this.config.depth / 2 + 3 }
        ];
        
        lightPolePositions.forEach(pos => {
            const lightPole = new THREE.Mesh(lightPoleGeometry, lightPoleMaterial);
            lightPole.position.set(pos.x, this.config.foundationHeight + 1.75, pos.z);
            lightPole.castShadow = true;
            lightingGroup.add(lightPole);
            
            // 灯头
            const lampHeadGeometry = new THREE.SphereGeometry(0.2, 8, 6);
            const lampHead = new THREE.Mesh(lampHeadGeometry, corridorLightMaterial);
            lampHead.position.set(0, 1.75, 0);
            lightPole.add(lampHead);
        });
        
        parentGroup.add(lightingGroup);
    }
    /**
     * 创建标识牌
     */
    createSignage() {
        const signageGroup = new THREE.Group();
        signageGroup.name = '标识系统';
        
        // 主标识牌
        const mainSignGeometry = new THREE.BoxGeometry(4, 1, 0.1);
        const mainSign = new THREE.Mesh(mainSignGeometry, this.materials.signage);
        mainSign.position.set(0, this.config.foundationHeight + this.config.firstFloorHeight + 1, -this.config.depth / 2 - 0.1);
        signageGroup.add(mainSign);
        
        // 标识牌文字背景
        const textBackgroundGeometry = new THREE.BoxGeometry(3.8, 0.8, 0.05);
        const textBackground = new THREE.Mesh(textBackgroundGeometry, new THREE.MeshStandardMaterial({
            color: 0xF5F5DC,
            roughness: 0.2,
            metalness: 0.1
        }));
        textBackground.position.set(0, this.config.foundationHeight + this.config.firstFloorHeight + 1, -this.config.depth / 2 - 0.12);
        signageGroup.add(textBackground);
        
        this.components.signage = signageGroup;
        this.group.add(signageGroup);
    }
    
    /**
     * 进入内部视图 - 显示内部设备
     */
    showInterior() {
        console.log('进入工业综合楼内部视图');
        
        // 隐藏所有外部建筑组件（除了基础）
        Object.keys(this.components).forEach(key => {
            if (key !== 'foundation' && this.components[key]) {
                this.components[key].visible = false;
            }
        });
        
        // 隐藏工业综合楼标签
        this.group.children.forEach(child => {
            if (child.name && child.name.includes('buildingLabel_')) {
                child.visible = false;
            }
        });
        
        // 创建并显示内部设施（如果还没有创建）
        if (!this.interiorGroup) {
            this.createInteriorFacilities();
        }
        
        // 显示内部设备
        if (this.interiorGroup) {
            this.interiorGroup.visible = true;
        }
        
        // 更新状态
        this.isInteriorView = true;
        
        // 更新UI状态指示
        const currentViewElement = document.getElementById('current-view');
        if (currentViewElement) {
            currentViewElement.textContent = '当前视图：工业综合楼内部';
        }
    }

    /**
     * 退出内部视图 - 显示外部建筑
     */
    showExterior() {
        console.log('退出工业综合楼内部视图');
        
        // 显示所有外部建筑组件
        Object.keys(this.components).forEach(key => {
            if (this.components[key]) {
                this.components[key].visible = true;
            }
        });
        
        // 显示工业综合楼标签
        this.group.children.forEach(child => {
            if (child.name && child.name.includes('buildingLabel_')) {
                child.visible = true;
            }
        });
        
        // 隐藏内部设备
        if (this.interiorGroup) {
            this.interiorGroup.visible = false;
        }
        
        // 更新状态
        this.isInteriorView = false;
        
        // 更新UI状态指示
        const currentViewElement = document.getElementById('current-view');
        if (currentViewElement) {
            currentViewElement.textContent = '当前视图：外部总览';
        }
    }

    /**
     * 创建内部设施
     */
    createInteriorFacilities() {
        this.interiorGroup = new THREE.Group();
        this.interiorGroup.name = '内部设施';
        this.interiorGroup.visible = false;
        
        // 扩大的内部空间参数
        this.interiorConfig = {
            width: 60,        // 扩大宽度到60米
            depth: 40,        // 扩大深度到40米
            firstFloorHeight: 15,   // 一层高度15米
            secondFloorHeight: 15,  // 二层高度15米
            floorThickness: 0.2     // 楼板厚度
        };
        
        // 创建扩大的地面
        this.createExpandedFloor();
        
        // 创建一层设施
        this.createFirstFloorFacilities();
        
        // 创建二层楼板
        this.createSecondFloorSlab();
        
        // 创建二层设施
        this.createSecondFloorFacilities();
        
        // 创建楼梯连接
        this.createInteriorStaircase();
        
        // 创建支撑柱
        this.createSupportColumns();
        
        this.group.add(this.interiorGroup);
    }
    
    /**
     * 创建扩大的地面
     */
    createExpandedFloor() {
        const floorGeometry = new THREE.BoxGeometry(
            this.interiorConfig.width, 
            this.interiorConfig.floorThickness, 
            this.interiorConfig.depth
        );
        const floorMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xE0E0E0,
            roughness: 0.8,
            metalness: 0.1 
        });
        const floor = new THREE.Mesh(floorGeometry, floorMaterial);
        floor.position.set(0, this.interiorConfig.floorThickness / 2, 0);
        floor.receiveShadow = true;
        floor.name = '扩大地面';
        
        this.interiorGroup.add(floor);
    }
    
    /**
     * 创建一层设施
     */
    createFirstFloorFacilities() {
        const firstFloorGroup = new THREE.Group();
        firstFloorGroup.name = '一层设施';
        
        // 在一层添加真空皮带机（位于设备区中央略偏右侧）
        try {
            const baseY = this.config.foundationHeight; // 一层地面标高
            const vbf = new VacuumBeltFilter({
                name: '真空皮带机',
                length: 18,
                width: 4.2,
                height: 3.8,
                beltWidth: 2.2,
                position: { x: 4, y: baseY, z: 0 },
                rotation: { x: 0, y: Math.PI / 2, z: 0 }
            });
            firstFloorGroup.add(vbf.getGroup());
            // 需求：整体再旋转90度并放大1.5倍
            const vbfGroup = vbf.getGroup();
            vbfGroup.rotation.y += Math.PI / 2; // 追加旋转90°
            vbfGroup.scale.set(1.5, 1.5, 1.5); // 放大1.5倍
            // 暴露引用便于后续连管
            if (typeof window !== 'undefined') {
                window.vacuumBeltFilter = vbf;
            }

            // 在皮带机附近添加：布洗冲洗罐、液环真空泵、真空缓冲罐，并与皮带机相连
            try {
                const vbfPos = vbfGroup.position.clone();

                // 1) 真空缓冲罐（立式压力容器）
                const receiverTank = new VacuumReceiverTank({
                    name: '真空缓冲罐',
                    height: 5.2,
                    radius: 1.2,
                    position: { x: vbfPos.x + 7.5, y: baseY, z: vbfPos.z - 4.0 }
                });
                firstFloorGroup.add(receiverTank.group);

                // 2) 液环真空泵（卧式）
                const vacuumPump = new LiquidRingVacuumPump({
                    name: '真空泵B',
                    position: { x: vbfPos.x + 4.8, y: baseY, z: vbfPos.z - 3.5 },
                    rotation: { x: 0, y: 0, z: 0 }
                });
                firstFloorGroup.add(vacuumPump.group);

                // 3) 布洗冲洗罐（清洗水罐）
                const washTank = new ClothWashTank({
                    name: '滤布冲洗罐',
                    height: 3.2,
                    radius: 1.2,
                    position: { x: vbfPos.x - 7.2, y: baseY, z: vbfPos.z + 3.8 }
                });
                firstFloorGroup.add(washTank.group);

                // 暴露引用
                if (typeof window !== 'undefined') {
                    window.vacuumReceiverTank = receiverTank;
                    window.vacuumPumpB = vacuumPump;
                    window.clothWashTank = washTank;
                }

                // 建立三条连接
                const points = [];
                // a) 皮带机真空总管 → 真空缓冲罐顶部
                const vbfVac = vbf.getPortWorldPosition('vacuum');
                const recIn = receiverTank.getPortWorldPosition('inlet');
                if (vbfVac && recIn) {
                    points.push({ name: '皮带机真空→缓冲罐', start: vbfVac, end: recIn, color: 0x9AA5B1 });
                }
                // b) 缓冲罐侧面 → 真空泵吸入口
                const recOut = receiverTank.getPortWorldPosition('outlet');
                const pumpIn = vacuumPump.getPortWorldPosition('inlet');
                if (recOut && pumpIn) {
                    points.push({ name: '缓冲罐→真空泵', start: recOut, end: pumpIn, color: 0x708090 });
                }
                // c) 冲洗罐 → 皮带机喷淋进水
                const washOut = washTank.getPortWorldPosition('outlet');
                const sprayIn = vbf.getPortWorldPosition('sprayFeed');
                if (washOut && sprayIn) {
                    points.push({ name: '冲洗罐→皮带机喷淋', start: washOut, end: sprayIn, color: 0xE0E0E0 });
                }

                // 创建管道
                points.forEach(p => {
                    const pipe = new PipeConnection({
                        name: p.name,
                        startPoint: p.start,
                        endPoint: p.end,
                        pipeRadius: 0.15,
                        pipeColor: p.color,
                        showFlow: true,
                        flowDirection: 'forward'
                    });
                    // 优先添加到全局场景，避免父组变换影响
                    if (typeof window !== 'undefined' && window.scene) {
                        window.scene.add(pipe.group);
                    } else {
                        this.group.add(pipe.group);
                    }
                });
            } catch (e) {
                console.warn('创建真空系统周边设备或连管失败:', e);
            }
        } catch (e) {
            console.warn('创建真空皮带机失败:', e);
        }
        
        this.interiorGroup.add(firstFloorGroup);
    }
    
    /**
     * 创建二层楼板
     */
    createSecondFloorSlab() {
        const slabGeometry = new THREE.BoxGeometry(
            this.interiorConfig.width, 
            this.interiorConfig.floorThickness, 
            this.interiorConfig.depth
        );
        const slabMaterial = new THREE.MeshStandardMaterial({ 
            color: 0xD0D0D0,
            roughness: 0.8,
            metalness: 0.1 
        });
        const slab = new THREE.Mesh(slabGeometry, slabMaterial);
        slab.position.set(0, this.interiorConfig.firstFloorHeight + this.interiorConfig.floorThickness / 2, 0);
        slab.receiveShadow = true;
        slab.name = '二层楼板';
        
        this.interiorGroup.add(slab);
    }
    
    /**
     * 创建二层设施
     */
    createSecondFloorFacilities() {
        const secondFloorGroup = new THREE.Group();
        secondFloorGroup.name = '二层设施';
        
        const secondFloorY = this.interiorConfig.firstFloorHeight + this.interiorConfig.floorThickness;
        
        // 创建增大的石膏旋流器设备，放置在二层中间位置
        const gypsumCyclone = new GypsumCyclone(
            { x: 0, y: secondFloorY, z: 0 },  // 位置：二层中心位置
            { x: 0, y: 0, z: 0 }               // 旋转：保持默认方向
        );
        
        // 暴露到全局，便于创建跨设备连接
        if (typeof window !== 'undefined') {
            window.gypsumCyclone = gypsumCyclone;
        }
        
        // 将石膏旋流器添加到二层设施组
        const cycloneGroup = gypsumCyclone.getGroup();
        cycloneGroup.name = '石膏旋流器设备';
        secondFloorGroup.add(cycloneGroup);
        
        // 通过“标签”定位并连接：石膏旋流器 出水口 标签 → 真空皮带机 主标签
        try {
            const cyclone = gypsumCyclone;
            const vbf = (typeof window !== 'undefined') ? window.vacuumBeltFilter : null;
            if (cyclone && vbf && typeof PipeConnection !== 'undefined') {
                const cg = cyclone.getGroup();
                const portsGroup = cg.getObjectByName('processPorts');
                const vbfGroup = vbf.getGroup();
                if (portsGroup && vbfGroup) {
                    // 在processPorts下寻找“出水口”附近的标签（Sprite）
                    const outletAnchor = portsGroup.getObjectByName('出水口法兰')
                        || portsGroup.getObjectByName('出水口管道')
                        || portsGroup.getObjectByName('出水口连接管');
                    let outletLabelSprite = null;
                    if (outletAnchor) {
                        const outletWorld = new THREE.Vector3();
                        outletAnchor.getWorldPosition(outletWorld);
                        let minDist = Infinity;
                        portsGroup.traverse(obj => {
                            if (obj && obj.isSprite) {
                                const p = new THREE.Vector3();
                                obj.getWorldPosition(p);
                                const d = p.distanceTo(outletWorld);
                                if (d < minDist) { minDist = d; outletLabelSprite = obj; }
                            }
                        });
                    }
                    // 如果没找到，退化为在processPorts下任取最近的Sprite
                    if (!outletLabelSprite) {
                        let candidate = null; let minY = Number.POSITIVE_INFINITY;
                        portsGroup.traverse(obj => {
                            if (obj && obj.isSprite) {
                                const p = new THREE.Vector3(); obj.getWorldPosition(p);
                                if (p.y < minY) { minY = p.y; candidate = obj; }
                            }
                        });
                        outletLabelSprite = candidate;
                    }

                    if (outletLabelSprite) {
                        const start = new THREE.Vector3();
                        outletLabelSprite.getWorldPosition(start);
                        // 选取真空皮带机模型的任意一点：使用其包围盒中心
                        const vbfBox = new THREE.Box3().setFromObject(vbfGroup);
                        const end = vbfBox.getCenter(new THREE.Vector3());
                        // 保留之前的下移6个单位
                       
                        const pipe = new PipeConnection({
                            name: '旋流器出水口标签→真空皮带机标签',
                            startPoint: { x: start.x, y: start.y, z: start.z },
                            endPoint: { x: end.x, y: end.y, z: end.z },
                            pipeRadius: 0.15,
                            pipeColor: 0x9AA5B1,
                            showFlow: true,
                            flowDirection: 'forward',
                            pathStrategy: 'straight'
                        });
                        if (typeof window !== 'undefined' && window.scene) {
                            window.scene.add(pipe.group);
                        } else {
                            this.group.add(pipe.group);
                        }
                    }
                }
            }
        } catch (e) {
            console.warn('通过标签创建旋流器出水口到真空皮带机的管道失败:', e);
        }

        this.interiorGroup.add(secondFloorGroup);
    }
    

    
    /**
     * 创建主控制中心（一层）
     */
    createMainControlCenter(parentGroup, baseY) {
        const controlGroup = new THREE.Group();
        controlGroup.name = '主控制中心';
        
        // 大型控制台
        const mainConsoleGeometry = new THREE.BoxGeometry(8, 1.5, 1.2);
        const consoleMaterial = new THREE.MeshStandardMaterial({ color: 0x2C3E50 });
        const mainConsole = new THREE.Mesh(mainConsoleGeometry, consoleMaterial);
        mainConsole.position.set(0, baseY + 0.75, 15);
        mainConsole.castShadow = true;
        controlGroup.add(mainConsole);
        
        // 多个显示屏
        for (let i = 0; i < 6; i++) {
            const screenGeometry = new THREE.BoxGeometry(1.2, 0.8, 0.05);
            const screenMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const screen = new THREE.Mesh(screenGeometry, screenMaterial);
            screen.position.set(-3 + i * 1.2, baseY + 2.5, 15.6);
            screen.castShadow = true;
            controlGroup.add(screen);
        }
        
        // 操作员座椅
        for (let i = 0; i < 4; i++) {
            const chairGeometry = new THREE.BoxGeometry(0.6, 1.2, 0.6);
            const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x34495E });
            const chair = new THREE.Mesh(chairGeometry, chairMaterial);
            chair.position.set(-2 + i * 1.5, baseY + 0.6, 13);
            chair.castShadow = true;
            controlGroup.add(chair);
        }
        
        parentGroup.add(controlGroup);
    }
    
    /**
     * 创建设备区域（一层）
     */
    createEquipmentZone(parentGroup, baseY) {
        const equipmentGroup = new THREE.Group();
        equipmentGroup.name = '设备区域';
        
        // 大型设备机柜
        for (let i = 0; i < 8; i++) {
            const cabinetGeometry = new THREE.BoxGeometry(1.2, 3, 0.8);
            const cabinetMaterial = new THREE.MeshStandardMaterial({ color: 0x7F8C8D });
            const cabinet = new THREE.Mesh(cabinetGeometry, cabinetMaterial);
            cabinet.position.set(-20 + (i % 4) * 3, baseY + 1.5, -15 + Math.floor(i / 4) * 4);
            cabinet.castShadow = true;
            equipmentGroup.add(cabinet);
        }
        
        // 工业管道系统
        for (let i = 0; i < 6; i++) {
            const pipeGeometry = new THREE.CylinderGeometry(0.15, 0.15, 12, 8);
            const pipeMaterial = new THREE.MeshStandardMaterial({ color: 0x95A5A6 });
            const pipe = new THREE.Mesh(pipeGeometry, pipeMaterial);
            pipe.rotation.z = Math.PI / 2;
            pipe.position.set(-15, baseY + 8 + i * 0.8, -10);
            pipe.castShadow = true;
            equipmentGroup.add(pipe);
        }
        
        parentGroup.add(equipmentGroup);
    }
    
    /**
     * 创建存储区域（一层）
     */
    createStorageArea(parentGroup, baseY) {
        const storageGroup = new THREE.Group();
        storageGroup.name = '存储区域';
        
        // 货架系统
        for (let i = 0; i < 12; i++) {
            const rackGeometry = new THREE.BoxGeometry(1, 4, 0.3);
            const rackMaterial = new THREE.MeshStandardMaterial({ color: 0xE67E22 });
            const rack = new THREE.Mesh(rackGeometry, rackMaterial);
            rack.position.set(15 + (i % 3) * 2, baseY + 2, -15 + Math.floor(i / 3) * 3);
            rack.castShadow = true;
            storageGroup.add(rack);
        }
        
        parentGroup.add(storageGroup);
    }
    
    /**
     * 创建车间区域（一层）
     */
    createWorkshopArea(parentGroup, baseY) {
        const workshopGroup = new THREE.Group();
        workshopGroup.name = '车间区域';
        
        // 工作台
        for (let i = 0; i < 6; i++) {
            const benchGeometry = new THREE.BoxGeometry(2, 1, 1.2);
            const benchMaterial = new THREE.MeshStandardMaterial({ color: 0x8E44AD });
            const bench = new THREE.Mesh(benchGeometry, benchMaterial);
            bench.position.set(-25 + (i % 2) * 4, baseY + 0.5, 5 + Math.floor(i / 2) * 3);
            bench.castShadow = true;
            workshopGroup.add(bench);
        }
        
        parentGroup.add(workshopGroup);
    }
    
    /**
     * 创建办公综合区（二层）
     */
    createOfficeComplex(parentGroup, baseY) {
        const officeGroup = new THREE.Group();
        officeGroup.name = '办公综合区';
        
        // 办公桌阵列
        for (let i = 0; i < 20; i++) {
            const deskGeometry = new THREE.BoxGeometry(1.8, 0.8, 0.08);
            const deskMaterial = new THREE.MeshStandardMaterial({ color: 0xA0522D });
            const desk = new THREE.Mesh(deskGeometry, deskMaterial);
            desk.position.set(-20 + (i % 5) * 4, baseY + 0.4, -15 + Math.floor(i / 5) * 3);
            desk.castShadow = true;
            officeGroup.add(desk);
            
            // 办公椅
            const chairGeometry = new THREE.BoxGeometry(0.6, 1, 0.6);
            const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x2F4F4F });
            const chair = new THREE.Mesh(chairGeometry, chairMaterial);
            chair.position.set(-20 + (i % 5) * 4, baseY + 0.5, -16 + Math.floor(i / 5) * 3);
            chair.castShadow = true;
            officeGroup.add(chair);
        }
        
        parentGroup.add(officeGroup);
    }
    
    /**
     * 创建监控中心（二层）
     */
    createMonitoringCenter(parentGroup, baseY) {
        const monitorGroup = new THREE.Group();
        monitorGroup.name = '监控中心';
        
        // 监控台
        const monitorConsoleGeometry = new THREE.BoxGeometry(6, 1.2, 1);
        const consoleMaterial = new THREE.MeshStandardMaterial({ color: 0x1ABC9C });
        const monitorConsole = new THREE.Mesh(monitorConsoleGeometry, consoleMaterial);
        monitorConsole.position.set(15, baseY + 0.6, 10);
        monitorConsole.castShadow = true;
        monitorGroup.add(monitorConsole);
        
        // 监控屏幕墙
        for (let i = 0; i < 9; i++) {
            const screenGeometry = new THREE.BoxGeometry(1, 0.7, 0.05);
            const screenMaterial = new THREE.MeshStandardMaterial({ color: 0x000000 });
            const screen = new THREE.Mesh(screenGeometry, screenMaterial);
            screen.position.set(12 + (i % 3) * 1.2, baseY + 2 + Math.floor(i / 3) * 1, 10.5);
            screen.castShadow = true;
            monitorGroup.add(screen);
        }
        
        parentGroup.add(monitorGroup);
    }
    
    /**
     * 创建会议室（二层）
     */
    createMeetingRooms(parentGroup, baseY) {
        const meetingGroup = new THREE.Group();
        meetingGroup.name = '会议室';
        
        // 会议桌
        const tableGeometry = new THREE.BoxGeometry(4, 0.8, 2);
        const tableMaterial = new THREE.MeshStandardMaterial({ color: 0x654321 });
        const table = new THREE.Mesh(tableGeometry, tableMaterial);
        table.position.set(0, baseY + 0.4, -10);
        table.castShadow = true;
        meetingGroup.add(table);
        
        // 会议椅
        for (let i = 0; i < 8; i++) {
            const chairGeometry = new THREE.BoxGeometry(0.5, 1, 0.5);
            const chairMaterial = new THREE.MeshStandardMaterial({ color: 0x8B0000 });
            const chair = new THREE.Mesh(chairGeometry, chairMaterial);
            const angle = (i / 8) * Math.PI * 2;
            chair.position.set(
                Math.cos(angle) * 2.5, 
                baseY + 0.5, 
                -10 + Math.sin(angle) * 1.5
            );
            chair.castShadow = true;
            meetingGroup.add(chair);
        }
        
        parentGroup.add(meetingGroup);
    }
    
    /**
     * 创建数据中心（二层）
     */
    createDataCenter(parentGroup, baseY) {
        const dataGroup = new THREE.Group();
        dataGroup.name = '数据中心';
        
        // 服务器机架
        for (let i = 0; i < 10; i++) {
            const serverGeometry = new THREE.BoxGeometry(0.8, 2, 0.6);
            const serverMaterial = new THREE.MeshStandardMaterial({ color: 0x2C3E50 });
            const server = new THREE.Mesh(serverGeometry, serverMaterial);
            server.position.set(20 + (i % 2) * 1.2, baseY + 1, 5 + Math.floor(i / 2) * 1.5);
            server.castShadow = true;
            dataGroup.add(server);
        }
        
        parentGroup.add(dataGroup);
    }
    
    /**
     * 创建内部楼梯
     */
    createInteriorStaircase() {
        const stairGroup = new THREE.Group();
        stairGroup.name = '内部楼梯';
        
        // 楼梯台阶
        const stepCount = 30;
        const stepHeight = this.interiorConfig.firstFloorHeight / stepCount;
        const stepDepth = 0.3;
        const stepWidth = 3;
        
        for (let i = 0; i < stepCount; i++) {
            const stepGeometry = new THREE.BoxGeometry(stepWidth, stepHeight, stepDepth);
            const stepMaterial = new THREE.MeshStandardMaterial({ color: 0x5D6D7E });
            const step = new THREE.Mesh(stepGeometry, stepMaterial);
            step.position.set(
                25, 
                stepHeight * (i + 0.5), 
                -15 + i * stepDepth
            );
            step.castShadow = true;
            stairGroup.add(step);
        }
        
       
    }
    
    /**
     * 创建支撑柱
     */
    createSupportColumns() {
        const columnGroup = new THREE.Group();
        columnGroup.name = '支撑柱';
        
        // 在扩大空间中创建支撑柱
        const columnPositions = [
            [-20, -10], [0, -10], [20, -10],
            [-20, 0], [20, 0],
            [-20, 10], [0, 10], [20, 10]
        ];
        
        columnPositions.forEach(([x, z]) => {
            const columnGeometry = new THREE.CylinderGeometry(0.3, 0.3, this.interiorConfig.firstFloorHeight + this.interiorConfig.secondFloorHeight, 8);
            const columnMaterial = new THREE.MeshStandardMaterial({ color: 0xBDC3C7 });
            const column = new THREE.Mesh(columnGeometry, columnMaterial);
            column.position.set(x, (this.interiorConfig.firstFloorHeight + this.interiorConfig.secondFloorHeight) / 2, z);
            column.castShadow = true;
            columnGroup.add(column);
        });
        
        this.interiorGroup.add(columnGroup);
    }

    /**
     * 获取建筑组
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * 获取建筑边界框
     */
    getBoundingBox() {
        const box = new THREE.Box3().setFromObject(this.group);
        return box;
    }
    
    /**
     * 设置建筑可见性
     */
    setVisible(visible) {
        this.group.visible = visible;
    }
    
    /**
     * 销毁建筑
     */
    dispose() {
        // 清理几何体和材质
        this.group.traverse((child) => {
            if (child.isMesh) {
                if (child.geometry) child.geometry.dispose();
                if (child.material) {
                    if (Array.isArray(child.material)) {
                        child.material.forEach(material => material.dispose());
                    } else {
                        child.material.dispose();
                    }
                }
            }
        });
        
        // 从场景中移除
        if (this.group.parent) {
            this.group.parent.remove(this.group);
        }
    }
}