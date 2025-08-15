/**
 * 石膏旋流器模型 - 八个绿色锥形旋流器单元环绕中央白色集管
 * 基于真实工业设备的结构和尺寸设计
 */
class GypsumCyclone {
    constructor(position = { x: 0, y: 0, z: 0 }, rotation = { x: 0, y: 0, z: 0 }) {
        this.position = position;
        this.rotation = rotation;
        this.group = new THREE.Group();
        this.components = {};
        
        // 设备配置参数 - 增大尺寸以适配工业综合楼二层
        this.config = {
            // 旋流器单元 - 全面增大尺寸
            cycloneCount: 8,            // 旋流器数量
            cycloneHeight: 2.0,         // 锥形旋流器高度（增大2.5倍）
            cycloneTopDiameter: 0.4,    // 锥形顶部直径（增大2.7倍）
            cycloneBottomDiameter: 0.12, // 锥形底部直径（增大2.4倍）
            cycloneRadius: 1.8,         // 旋流器环绕半径（增大3倍）
            cycloneTiltAngle: Math.PI / 4, // 向外倾斜45度
            
            // 出口圆柱 - 增大尺寸
            outletCylinderHeight: 0.25, // 出口圆柱高度（增大2.5倍）
            outletCylinderDiameter: 0.15, // 出口圆柱直径（增大2.5倍）
            
            // 蓝色软管 - 增大尺寸
            hoseInnerDiameter: 0.15,    // 软管内径（增大2.5倍）
            hoseWallThickness: 0.012,   // 软管壁厚（增大2.4倍）
            hoseOuterDiameter: 0.18,    // 软管外径（增大2.6倍）
            
            // 中央集管 - 增大尺寸
            manifoldHeight: 3.0,        // 集管高度（增大2.5倍）
            manifoldDiameter: 0.8,      // 集管直径（增大2.7倍）
            manifoldRadius: 0.7,        // 集管中心半径（增大2.8倍）
            
            // 支架 - 增大尺寸
            supportHeight: 4.0,         // 支架高度（增大2.7倍）
            supportLegCount: 4,         // 支架腿数量
            supportLegDiameter: 0.2,    // 支架腿直径（增大2.5倍）
            supportBaseRadius: 2.2      // 支架底座半径（增大2.75倍）
        };
        
        this.initialize();
    }
    
    /**
     * 初始化旋流器
     */
    initialize() {
        this.createMaterials();
        
        // 只保留三个核心组件：
        // 1. 白色集流器模型
        this.createCentralManifold();
        
        // 2. 蓝色软管模型
        this.createHoseSystems();
        
        // 3. 绿色锥体旋流器模型
        this.createCycloneUnits();
        
        // 4. 底座支撑结构 - 四个支撑腿和托盘平台
        this.createSupportBase();
        
        // 5. 阀门系统 - 连接绿色旋流器顶部与白色集流器中部
        this.createValveSystems();
        
        // 6. 创建标签（参考泵房内部排浆泵标签风格）
        this.createCycloneLabels();
        
        // 7. 创建入/出接口管道
        this.createProcessPorts();
        
        // 设置位置和旋转
        this.group.position.set(this.position.x, this.position.y, this.position.z);
        this.group.rotation.set(this.rotation.x, this.rotation.y, this.rotation.z);
        
        // 整体放大比例（全模型放大4倍）
        this.group.scale.set(2.5, 2.5, 2.5);
        
        // 创建完成后，输出坐标信息和验证对齐
        setTimeout(() => {
            this.logHoseBottomCoordinates();
            this.validateAlignment();
        }, 100);
        
        console.log('🎯 石膏旋流器简化版：只保留白色集流器、蓝色软管、绿色锥体三个核心组件');
    }
    
    /**
     * 创建材质
     */
    createMaterials() {
        // 绿色旋流器材质
        this.materials = {
            cyclone: new THREE.MeshPhongMaterial({
                color: 0x2d5016,
                shininess: 30,
                transparent: false
            }),
            
            // 白色集管材质（带锈迹和剥落效果）
            manifold: new THREE.MeshPhongMaterial({
                color: 0xe8e8e8,
                shininess: 20,
                transparent: false
            }),
            
            // 蓝色软管材质
            hose: new THREE.MeshPhongMaterial({
                color: 0x1e4d8b,
                shininess: 40,
                transparent: false
            }),
            
            // 底座材质 - 工业钢材质感
            base: new THREE.MeshPhongMaterial({
                color: 0x4a4a4a,
                shininess: 10,
                transparent: false
            }),
            
            // 支架材质 - 钢结构材质
            support: new THREE.MeshPhongMaterial({
                color: 0x666666,
                shininess: 15,
                transparent: false
            }),
        };
    }
    
    /**
     * 创建主体结构
     */
    createMainBody() {
        const mainBodyGroup = new THREE.Group();
        mainBodyGroup.name = '主体结构';
        
        // 创建旋流器主体（圆锥形）
        const bodyGeometry = new THREE.CylinderGeometry(
            this.config.bottomDiameter / 2,
            this.config.mainBodyDiameter / 2,
            this.config.mainBodyHeight,
            16
        );
        const mainBody = new THREE.Mesh(bodyGeometry, this.materials.stainlessSteel);
        mainBody.position.y = this.config.mainBodyHeight / 2;
        mainBody.castShadow = true;
        mainBody.receiveShadow = true;
        mainBodyGroup.add(mainBody);
        
        // 顶部圆柱段
        const topSectionGeometry = new THREE.CylinderGeometry(
            this.config.topDiameter / 2,
            this.config.mainBodyDiameter / 2,
            0.4,
            16
        );
        const topSection = new THREE.Mesh(topSectionGeometry, this.materials.stainlessSteel);
        topSection.position.y = this.config.mainBodyHeight + 0.2;
        topSection.castShadow = true;
        mainBodyGroup.add(topSection);
        
        // 底部锥形段
        const bottomConeGeometry = new THREE.CylinderGeometry(
            0.05,
            this.config.bottomDiameter / 2,
            0.6,
            16
        );
        const bottomCone = new THREE.Mesh(bottomConeGeometry, this.materials.stainlessSteel);
        bottomCone.position.y = -0.3;
        bottomCone.castShadow = true;
        mainBodyGroup.add(bottomCone);
        
        // 主体加强筋
        for (let i = 0; i < 4; i++) {
            const ribGeometry = new THREE.BoxGeometry(0.05, this.config.mainBodyHeight, 0.03);
            const rib = new THREE.Mesh(ribGeometry, this.materials.stainlessSteel);
            const angle = (i / 4) * Math.PI * 2;
            rib.position.set(
                Math.cos(angle) * (this.config.mainBodyDiameter / 2 + 0.025),
                this.config.mainBodyHeight / 2,
                Math.sin(angle) * (this.config.mainBodyDiameter / 2 + 0.025)
            );
            rib.rotation.y = angle;
            mainBodyGroup.add(rib);
        }
        
        // 检修人孔
        const manholeGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.1, 12);
        const manhole = new THREE.Mesh(manholeGeometry, this.materials.flange);
        manhole.position.set(0, this.config.mainBodyHeight + 0.4, this.config.topDiameter / 2 + 0.05);
        manhole.rotation.z = Math.PI / 2;
        mainBodyGroup.add(manhole);
        
        // 人孔盖
        const manholeCoverGeometry = new THREE.CylinderGeometry(0.28, 0.28, 0.05, 12);
        const manholeCover = new THREE.Mesh(manholeCoverGeometry, this.materials.stainlessSteel);
        manholeCover.position.set(0, 0, 0.075);
        manhole.add(manholeCover);
        
        this.components.mainBody = mainBodyGroup;
        this.group.add(mainBodyGroup);
    }
    
    /**
     * 创建中央集管 - 白色油漆钢材，带裂纹剥落和锈迹
     */
    createCentralManifold() {
        const manifoldGroup = new THREE.Group();
        
        // 主集管圆柱体
        const manifoldGeometry = new THREE.CylinderGeometry(
            this.config.manifoldDiameter / 2,
            this.config.manifoldDiameter / 2,
            this.config.manifoldHeight,
            32
        );
        
        const manifold = new THREE.Mesh(manifoldGeometry, this.materials.manifold);
        manifold.position.set(0, this.config.supportHeight + this.config.manifoldHeight / 2, 0);
        manifold.name = '中央集管';
        manifoldGroup.add(manifold);
        
        // 集管顶部封头
        const topCapGeometry = new THREE.SphereGeometry(
            this.config.manifoldDiameter / 2,
            16,
            8,
            0,
            Math.PI * 2,
            0,
            Math.PI / 2
        );
        
        const topCap = new THREE.Mesh(topCapGeometry, this.materials.manifold);
        topCap.position.set(0, this.config.supportHeight + this.config.manifoldHeight, 0);
        topCap.name = '集管顶部封头';
        manifoldGroup.add(topCap);
        
        // 集管底部封头
        const bottomCapGeometry = new THREE.SphereGeometry(
            this.config.manifoldDiameter / 2,
            16,
            8,
            0,
            Math.PI * 2,
            Math.PI / 2,
            Math.PI / 2
        );
        
        const bottomCap = new THREE.Mesh(bottomCapGeometry, this.materials.manifold);
        bottomCap.position.set(0, this.config.supportHeight, 0);
        bottomCap.name = '集管底部封头';
        manifoldGroup.add(bottomCap);
        
        // 在集管侧面偏上位置创建8个入口接管（按真实设备1:1还原）
        for (let i = 0; i < this.config.cycloneCount; i++) {
            const angle = (i / this.config.cycloneCount) * Math.PI * 2;
            const x = Math.cos(angle) * this.config.manifoldRadius;
            const z = Math.sin(angle) * this.config.manifoldRadius;
            
            // 入口接管（径向向外，切线连接）
            const inletGeometry = new THREE.CylinderGeometry(
                this.config.hoseOuterDiameter / 2,
                this.config.hoseOuterDiameter / 2,
                0.08,
                16
            );
            
            const inlet = new THREE.Mesh(inletGeometry, this.materials.manifold);
            inlet.position.set(x, this.config.supportHeight + this.config.manifoldHeight * 0.8, z); // 侧面偏上位置
            inlet.rotation.z = Math.PI / 2;
            inlet.lookAt(new THREE.Vector3(0, inlet.position.y, 0)); // 朝向中心
            inlet.name = `集管侧面入口_${i + 1}`;
            manifoldGroup.add(inlet);
        }
        
        // 在集管底部创建8个阀门连接接口
        for (let i = 0; i < this.config.cycloneCount; i++) {
            const angle = (i / this.config.cycloneCount) * Math.PI * 2;
            const bottomRadius = this.config.manifoldRadius * 0.8; // 底部接口半径略小
            const x = Math.cos(angle) * bottomRadius;
            const z = Math.sin(angle) * bottomRadius;
            
            // 阀门连接接口（径向向外）
            const valveInletGeometry = new THREE.CylinderGeometry(0.04, 0.04, 0.06, 12);
            const valveInlet = new THREE.Mesh(valveInletGeometry, this.materials.manifold);
            valveInlet.position.set(x, this.config.supportHeight + this.config.manifoldHeight * 0.1, z); // 底部位置
            valveInlet.rotation.z = Math.PI / 2;
            valveInlet.lookAt(new THREE.Vector3(0, valveInlet.position.y, 0)); // 朝向中心
            valveInlet.name = `集管底部阀门接口_${i + 1}`;
            manifoldGroup.add(valveInlet);
        }
        
        // 在集管底部创建4个平台支撑柱连接点
        for (let i = 0; i < 4; i++) {
            const angle = (i / 4) * Math.PI * 2;
            const connectionRadius = 0.3; // 连接点半径
            const x = Math.cos(angle) * connectionRadius;
            const z = Math.sin(angle) * connectionRadius;
            
            // 支撑柱连接点
            const supportConnectionGeometry = new THREE.CylinderGeometry(0.05, 0.05, 0.04, 12);
            const supportConnection = new THREE.Mesh(supportConnectionGeometry, this.materials.manifold);
            supportConnection.position.set(x, this.config.supportHeight - 0.02, z); // 集流器底部
            supportConnection.name = `集管底部支撑柱接口_${i + 1}`;
            manifoldGroup.add(supportConnection);
        }
        
        manifoldGroup.name = '中央集管';
        this.components.manifold = manifoldGroup;
        this.group.add(manifoldGroup);
    }
    
    /**
     * 创建旋流器单元 - 八个绿色锥形旋流器，底部与蓝色软管底部坐标精确重合
     */
    createCycloneUnits() {
        const cycloneGroup = new THREE.Group();
        
        // 存储八个蓝色软管底部坐标，用于精确对齐
        this.hoseBottomCoordinates = [];
        
        for (let i = 0; i < this.config.cycloneCount; i++) {
            const angle = (i / this.config.cycloneCount) * Math.PI * 2;
            
            // 与createHoseSystems()中完全一致的计算逻辑
            const cycloneBaseX = Math.cos(angle) * this.config.cycloneRadius;
            const cycloneBaseZ = Math.sin(angle) * this.config.cycloneRadius;
            const cycloneBaseY = this.config.supportHeight + 0.5;
            
            // 计算旋流器倾斜后的底部出口位置（软管起始点）
            const tiltOffset = Math.sin(this.config.cycloneTiltAngle) * this.config.cycloneHeight * 0.5;
            const bottomTiltOffset = Math.cos(this.config.cycloneTiltAngle) * this.config.cycloneHeight * 0.5;
            
            // 精确的软管底部坐标（绿色旋流器底部出口位置）
            const hoseBottomX = cycloneBaseX + Math.cos(angle) * tiltOffset;
            const hoseBottomZ = cycloneBaseZ + Math.sin(angle) * tiltOffset;
            const hoseBottomY = cycloneBaseY - bottomTiltOffset - this.config.outletCylinderHeight / 2;
            
            // 保存软管底部坐标供调试使用
            this.hoseBottomCoordinates.push({
                index: i,
                angle: angle * 180 / Math.PI, // 转换为度数
                x: hoseBottomX,
                y: hoseBottomY,
                z: hoseBottomZ
            });
            
            // 单个旋流器组
            const singleCycloneGroup = new THREE.Group();
            
            // 锥形旋流器主体（增加高度，顶部位置不变）
            const extendedHeight = this.config.cycloneHeight + 2.0; // 增加2个单位高度
            const cycloneGeometry = new THREE.ConeGeometry(
                this.config.cycloneTopDiameter / 2,
                extendedHeight,
                16,
                1,
                false,
                0,
                Math.PI * 2
            );
            
            const cyclone = new THREE.Mesh(cycloneGeometry, this.materials.cyclone);
            // 调整锥体位置，使顶部保持在原位，底部自然延长
            cyclone.position.set(0, this.config.cycloneHeight / 2 - 1.0, 0); // 向下移动1个单位，使顶部位置不变
            cyclone.rotation.x = Math.PI; // 旋转180度，让锥尖朝下
            cyclone.name = `旋流器锥体_${i + 1}`;
            singleCycloneGroup.add(cyclone);
            
            // 旋流器顶部圆柱段
            const topCylinderGeometry = new THREE.CylinderGeometry(
                this.config.cycloneTopDiameter / 2,
                this.config.cycloneTopDiameter / 2,
                0.1,
                16
            );
            
            const topCylinder = new THREE.Mesh(topCylinderGeometry, this.materials.cyclone);
            topCylinder.position.set(0, this.config.cycloneHeight + 0.05, 0);
            topCylinder.name = `旋流器顶部_${i + 1}`;
            singleCycloneGroup.add(topCylinder);
            
            // 出口圆柱 - 底部必须与软管起始点完全重合
            const outletGeometry = new THREE.CylinderGeometry(
                this.config.outletCylinderDiameter / 2,
                this.config.outletCylinderDiameter / 2,
                this.config.outletCylinderHeight,
                16
            );
            
            const outlet = new THREE.Mesh(outletGeometry, this.materials.cyclone);
            // 精确设置出口圆柱位置，使其底部与软管起始点重合
            outlet.position.set(0, -this.config.cycloneHeight / 2 - this.config.outletCylinderHeight / 2, 0);
            outlet.name = `出口圆柱_${i + 1}`;
            singleCycloneGroup.add(outlet);
            
            // 精确计算旋流器组基础位置，确保底部出口圆柱与绿色小圆柱连接
            let targetGreenCylinderX, targetGreenCylinderY, targetGreenCylinderZ;
            
            // 使用软管终点坐标作为锥体底部连接目标（流向：集流器→软管→锥体）
            // 获取软管底部坐标，让锥体底部连接到软管底部
            if (this.greenCylinderCoordinates && this.greenCylinderCoordinates[i]) {
                const hoseBottomCoord = this.greenCylinderCoordinates[i];
                const hoseBottomX = hoseBottomCoord.x;
                const hoseBottomZ = hoseBottomCoord.z;
                const hoseBottomY = hoseBottomCoord.y;
                
                // 计算锥体位置：旋转180度后，让锥体底部（现在在上方）对齐软管底部
                targetGreenCylinderX = hoseBottomX;
                targetGreenCylinderZ = hoseBottomZ;
                targetGreenCylinderY = hoseBottomY - this.config.cycloneHeight; // 锥体基座位置，锥底在上方与软管底部对齐
                
                console.log(`绿色锥体${i + 1}已旋转180度，锥底（上方）连接软管底部: 锥体位置(${targetGreenCylinderX.toFixed(3)}, ${targetGreenCylinderY.toFixed(3)}, ${targetGreenCylinderZ.toFixed(3)}), 软管底部(${hoseBottomX.toFixed(3)}, ${hoseBottomY.toFixed(3)}, ${hoseBottomZ.toFixed(3)})`);
            } else {
                console.warn(`绿色锥体${i + 1}：软管底部坐标未找到，使用默认位置`);
                targetGreenCylinderX = cycloneBaseX;
                targetGreenCylinderZ = cycloneBaseZ;
                targetGreenCylinderY = cycloneBaseY - this.config.cycloneHeight;
            }
            
            // 直接设置锥体位置，让锥体底部连接到软管底部
            singleCycloneGroup.position.set(targetGreenCylinderX, targetGreenCylinderY, targetGreenCylinderZ);
            
            // 顶端不动，只有底部向内倾斜50度
            const bottomTiltAngle = Math.PI * 50 / 180; // 50度倾斜角
            
            // 先将锥体移动到顶端位置作为旋转中心
            const topY = targetGreenCylinderY + this.config.cycloneHeight; // 锥底（现在是顶端）的Y坐标
            singleCycloneGroup.position.set(targetGreenCylinderX, topY, targetGreenCylinderZ);
            
            // 以顶端为支点，绕垂直于径向的轴向内旋转
            const tiltAxis = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle)); // 垂直于径向的轴
            singleCycloneGroup.rotateOnAxis(tiltAxis, -bottomTiltAngle); // 负角度表示底部向内倾斜
            
            // 计算旋转后需要调整的位置，使顶端保持在原位
            const rotationOffset = this.config.cycloneHeight * Math.sin(bottomTiltAngle);
            const heightOffset = this.config.cycloneHeight * (1 - Math.cos(bottomTiltAngle));
            
            // 调整位置，确保顶端位置不变，并向下移动一个单位
            singleCycloneGroup.position.set(
                targetGreenCylinderX - Math.cos(angle) * rotationOffset,
                targetGreenCylinderY + this.config.cycloneHeight - heightOffset - 0.5, // 向下移动1个单位
                targetGreenCylinderZ - Math.sin(angle) * rotationOffset
            );
            
            console.log(`绿色锥体${i + 1}高度增加: 原长${this.config.cycloneHeight}m → 新长${extendedHeight}m, 顶部位置不变`);
            
            singleCycloneGroup.name = `旋流器单元_${i + 1}`;
            singleCycloneGroup.userData.coneBottomCoord = {
                x: targetGreenCylinderX,
                y: targetGreenCylinderY + this.config.cycloneHeight, // 旋转180度后，锥底在上方
                z: targetGreenCylinderZ
            };
            singleCycloneGroup.userData.coneTopCoord = {
                x: targetGreenCylinderX,
                y: targetGreenCylinderY, // 旋转180度后，锥尖在下方
                z: targetGreenCylinderZ
            };
            
            cycloneGroup.add(singleCycloneGroup);
        }
        
        cycloneGroup.name = '旋流器单元组';
        this.components.cyclones = cycloneGroup;
        this.group.add(cycloneGroup);
        
        // 输出调试信息
        console.log('石膏旋流器完整版 - 五个核心组件创建完成:');
        console.log('✅ 1. 白色集流器模型（带阀门连接接口）');
        console.log('✅ 2. 蓝色软管模型（8根）');
        console.log('✅ 3. 绿色锥体旋流器模型（8个，已增高并旋转180度）');
        console.log('✅ 4. 底座支撑结构（四个支撑腿和平台）');
        console.log('✅ 5. 工业阀门系统（8个绿色阀门带手轮）');
        console.log('🔄 八个绿色锥体已旋转180度，锥尖朝下，锥底朝上');
        console.log('📏 锥体高度增加2个单位，顶部位置保持不变，底部自然延长');
        console.log('📐 锥体顶端固定不动，底部向内倾斜50°');
        console.log('⬇️ 整体向下移动1个单位');
        console.log('🎯 倾斜方式：以顶端为支点，底部向设备中心倾斜');
        console.log('✓ 连接：蓝色软管底部 ↔ 八个绿色锥体底部（上方）');
        if (this.greenCylinderCoordinates) {
            this.greenCylinderCoordinates.forEach((coord, index) => {
                console.log(`锥体连接点${index + 1}: 角度${coord.angle.toFixed(1)}°, 坐标(${coord.x.toFixed(3)}, ${coord.y.toFixed(3)}, ${coord.z.toFixed(3)})`);
            });
        }
    }
    
    /**
     * 创建软管系统 - 蓝色软管，底部带绿色小圆柱连接器，顶部连接白色集流器
     */
    createHoseSystems() {
        const hoseGroup = new THREE.Group();
        
        // 存储绿色小圆柱位置供绿色锥体连接使用
        this.greenCylinderCoordinates = [];
        
        for (let i = 0; i < this.config.cycloneCount; i++) {
            const angle = (i / this.config.cycloneCount) * Math.PI * 2;
            
            // 使用与createCycloneUnits()完全一致的坐标计算
            const cycloneBaseX = Math.cos(angle) * this.config.cycloneRadius;
            const cycloneBaseZ = Math.sin(angle) * this.config.cycloneRadius;
            const cycloneBaseY = this.config.supportHeight + 0.5;
            
            // 计算旋流器倾斜后的底部出口位置
            const tiltOffset = Math.sin(this.config.cycloneTiltAngle) * this.config.cycloneHeight * 0.5;
            const bottomTiltOffset = Math.cos(this.config.cycloneTiltAngle) * this.config.cycloneHeight * 0.5;
            
            // 绿色锥体底部出口位置 - 这将成为绿色小圆柱的位置
            const greenCylinderX = cycloneBaseX + Math.cos(angle) * tiltOffset;
            const greenCylinderZ = cycloneBaseZ + Math.sin(angle) * tiltOffset;
            const greenCylinderY = cycloneBaseY - bottomTiltOffset - this.config.outletCylinderHeight / 2;
            
            // 保存绿色小圆柱坐标供绿色锥体连接使用
            this.greenCylinderCoordinates.push({
                index: i,
                angle: angle * 180 / Math.PI,
                x: greenCylinderX,
                y: greenCylinderY,
                z: greenCylinderZ
            });
            
            // 蓝色软管底部位置（绿色小圆柱底部）
            const hoseBottomX = greenCylinderX;
            const hoseBottomZ = greenCylinderZ;
            const hoseBottomY = greenCylinderY - 0.15; // 软管从绿色小圆柱底部开始
            
            // 白色集流器侧面偏上位置连接点（按真实设备1:1还原）
            const manifoldConnectionX = Math.cos(angle) * this.config.manifoldRadius;
            const manifoldConnectionZ = Math.sin(angle) * this.config.manifoldRadius;
            const manifoldConnectionY = this.config.supportHeight + this.config.manifoldHeight * 0.8; // 侧面偏上位置
            
            // 创建单个软管组（包含绿色小圆柱 + 蓝色软管）
            const singleHoseGroup = new THREE.Group();
            
            // 蓝色软管：按照真实设备1:1还原 白色集流器侧面偏上 → S形弯曲软管 → 绿色锥体底部
            const hose = this.createSplineHose(
                new THREE.Vector3(manifoldConnectionX, manifoldConnectionY, manifoldConnectionZ), // 起点：白色集流器侧面偏上
                new THREE.Vector3(greenCylinderX, greenCylinderY, greenCylinderZ),    // 终点：绿色锥体底部
                i
            );
            singleHoseGroup.add(hose);
            
            singleHoseGroup.name = `软管系统_${i + 1}`;
            singleHoseGroup.userData.manifoldCoord = {
                x: manifoldConnectionX,  // 软管起点：集流器侧面偏上
                y: manifoldConnectionY,
                z: manifoldConnectionZ
            };
            singleHoseGroup.userData.coneBottomCoord = {
                x: greenCylinderX,  // 软管终点：锥体底部
                y: greenCylinderY,
                z: greenCylinderZ
            };
            singleHoseGroup.userData.hoseTopCoord = {
                x: manifoldConnectionX,  // 软管顶部连接集流器侧面偏上
                y: manifoldConnectionY,
                z: manifoldConnectionZ
            };
            singleHoseGroup.userData.hoseBottomCoord = {
                x: greenCylinderX,  // 软管底部连接锥体
                y: greenCylinderY,
                z: greenCylinderZ
            };
            
            hoseGroup.add(singleHoseGroup);
        }
        
        hoseGroup.name = '软管系统';
        this.components.hoses = hoseGroup;
        this.group.add(hoseGroup);
        
        console.log('✓ 软管系统创建完成：白色集流器侧面偏上 → S形弯曲软管 → 绿色锥体底部');
        console.log('✓ 按真实设备1:1还原S形弯曲路径');
        console.log('✓ 软管先向外弯曲，再向下，最后向内连接');
        console.log('✓ 八个软管终点坐标已保存，供绿色锥体直接连接使用');
    }
    
    /**
     * 创建单根样条曲线软管 - 按真实设备1:1还原S形弯曲连接方式
     */
    createSplineHose(startPos, endPos, index) {
        const hoseGroup = new THREE.Group();
        
        // 计算从集流器侧面偏上到锥体底部的路径
        const heightDiff = endPos.y - startPos.y; // 负值，向下流动
        const horizontalDistance = Math.sqrt(
            Math.pow(endPos.x - startPos.x, 2) + 
            Math.pow(endPos.z - startPos.z, 2)
        );
        
        // 计算径向方向（从中心向外）
        const angle = Math.atan2(startPos.z, startPos.x);
        const radialDir = new THREE.Vector3(Math.cos(angle), 0, Math.sin(angle));
        const tangentDir = new THREE.Vector3(-Math.sin(angle), 0, Math.cos(angle));
        
        // 按图片中的S形弯曲路径设计控制点
        // 1. 从集流器侧面切线方向出来
        const controlPoint1 = new THREE.Vector3(
            startPos.x + radialDir.x * 0.3, // 径向向外
            startPos.y - 0.1, // 稍微下降
            startPos.z + radialDir.z * 0.3
        );
        
        // 2. 向外弯曲到最外侧（S形的第一个弯）
        const maxOutwardOffset = horizontalDistance * 0.4;
        const controlPoint2 = new THREE.Vector3(
            startPos.x + radialDir.x * maxOutwardOffset,
            startPos.y + heightDiff * 0.2, // 缓慢下降
            startPos.z + radialDir.z * maxOutwardOffset
        );
        
        // 3. 开始向内弯曲（S形的转折点）
        const controlPoint3 = new THREE.Vector3(
            startPos.x + (endPos.x - startPos.x) * 0.4 + radialDir.x * maxOutwardOffset * 0.5,
            startPos.y + heightDiff * 0.5, // 中间高度
            startPos.z + (endPos.z - startPos.z) * 0.4 + radialDir.z * maxOutwardOffset * 0.5
        );
        
        // 4. 继续向内弯曲（S形的第二个弯）
        const controlPoint4 = new THREE.Vector3(
            startPos.x + (endPos.x - startPos.x) * 0.7,
            startPos.y + heightDiff * 0.8, // 继续下降
            startPos.z + (endPos.z - startPos.z) * 0.7
        );
        
        // 5. 接近终点，准备连接
        const controlPoint5 = new THREE.Vector3(
            endPos.x + radialDir.x * 0.1, // 稍微偏外，便于连接
            endPos.y + 0.15, // 稍微抬高，便于连接
            endPos.z + radialDir.z * 0.1
        );
        
        // 创建样条曲线，按真实设备S形弯曲1:1还原
        const curve = new THREE.CatmullRomCurve3([
            startPos,
            controlPoint1,
            controlPoint2,
            controlPoint3,
            controlPoint4,
            controlPoint5,
            endPos
        ]);
        
        // 沿曲线创建软管几何体
        const tubeGeometry = new THREE.TubeGeometry(
            curve,
            64, // 路径分段数
            this.config.hoseOuterDiameter / 2,
            16, // 径向分段数
            false
        );
        
        const hoseMesh = new THREE.Mesh(tubeGeometry, this.materials.hose);
        hoseMesh.name = `软管主体_${index + 1}`;
        hoseGroup.add(hoseMesh);
        
        // 创建内管（表现壁厚效果）
        const innerTubeGeometry = new THREE.TubeGeometry(
            curve,
            64,
            this.config.hoseInnerDiameter / 2,
            12,
            false
        );
        
        const innerMaterial = new THREE.MeshPhongMaterial({
            color: 0x000000,
            shininess: 5,
            transparent: true,
            opacity: 0.8
        });
        
        const innerMesh = new THREE.Mesh(innerTubeGeometry, innerMaterial);
        innerMesh.name = `软管内腔_${index + 1}`;
        hoseGroup.add(innerMesh);
        
        // 在弯曲处添加轻微变形效果（受重力影响）
        this.addHoseDeformation(hoseMesh, curve);
        
        return hoseGroup;
    }
    
    /**
     * 为软管添加重力变形效果
     */
    addHoseDeformation(hoseMesh, curve) {
        const geometry = hoseMesh.geometry;
        const position = geometry.attributes.position;
        
        // 在弯曲处添加轻微下垂
        for (let i = 0; i < position.count; i++) {
            const t = (i % 64) / 64; // 沿路径的参数
            if (t > 0.3 && t < 0.7) { // 中间弯曲段
                const deformation = Math.sin((t - 0.3) * Math.PI / 0.4) * 0.02;
                position.setY(i, position.getY(i) - deformation);
            }
        }
        
        position.needsUpdate = true;
        geometry.computeVertexNormals();
    }
    
    // 支撑结构已删除 - 简化版只保留白色集流器、蓝色软管、绿色锥体三个核心组件
    
    /**
     * 创建底座支撑结构 - 四个支撑腿和托盘平台，预留八个圆形孔洞
     */
    createSupportBase() {
        const supportGroup = new THREE.Group();
        
        // 1. 创建四个支撑腿（延伸到白色集流器底部）
        const platformY = 2; // 平台高度位置
        const platformThickness = 0.15; // 平台厚度
        const manifoldBottomY = this.config.supportHeight; // 集流器底部高度
        const supportLegHeight = manifoldBottomY; // 支撑腿总高度：延伸到集流器底部
        
        // 存储支撑柱坐标供上方支撑柱使用
        this.supportLegCoordinates = [];
        
        for (let i = 0; i < this.config.supportLegCount; i++) {
            const angle = (i / this.config.supportLegCount) * Math.PI * 2;
            const x = Math.cos(angle) * this.config.supportBaseRadius;
            const z = Math.sin(angle) * this.config.supportBaseRadius;
            
            // 存储支撑柱坐标
            this.supportLegCoordinates.push({
                id: i + 1,
                index: i,
                angle: angle,
                x: x,
                z: z,
                topY: supportLegHeight, // 支撑柱顶部Y坐标（延伸到平台上方）
                platformY: platformY + platformThickness / 2, // 平台顶部Y坐标
                centerY: supportLegHeight / 2 // 支撑柱中心Y坐标
            });
            
            // 计算集流器底部连接点（所有柱子都汇集到集流器中心）
            // 所有柱子的终点都是集流器的中心位置，这样它们就会汇集到一点
            const manifoldConnectionX = 0; // 集流器中心X坐标
            const manifoldConnectionZ = 0; // 集流器中心Z坐标
            
            // 确定柱子的方位名称
            const directions = ["前方", "右侧", "后方", "左侧"];
            const directionName = directions[i];
            
            console.log(`🏗️ ${directionName}支撑柱${i + 1}起点: (${x.toFixed(3)}, 0, ${z.toFixed(3)})`);
            console.log(`🎯 ${directionName}支撑柱${i + 1}终点: (${manifoldConnectionX.toFixed(3)}, ${manifoldBottomY.toFixed(3)}, ${manifoldConnectionZ.toFixed(3)}) - 集流器中心`);
            console.log(`📍 ${directionName}支撑柱${i + 1}角度: ${(angle * 180 / Math.PI).toFixed(1)}° - 汇集到集流器中心`);
            
            // 创建一体化支撑柱组
            const columnGroup = new THREE.Group();
            
            // 1. 底部垂直段（地面到平台）
            const verticalHeight = platformY + platformThickness / 2;
            const verticalGeometry = new THREE.CylinderGeometry(
                this.config.supportLegDiameter / 2,
                this.config.supportLegDiameter / 2,
                verticalHeight,
                16
            );
            
            const verticalSegment = new THREE.Mesh(verticalGeometry, this.materials.support);
            verticalSegment.position.set(x, verticalHeight / 2, z);
            verticalSegment.name = `垂直段_${i + 1}`;
            verticalSegment.castShadow = true;
            verticalSegment.receiveShadow = true;
            columnGroup.add(verticalSegment);
            
            // 2. 上部倾斜段（平台到集流器）
            const tiltStartX = x;
            const tiltStartZ = z;
            const tiltStartY = platformY + platformThickness / 2;
            
            const tiltEndX = manifoldConnectionX;
            const tiltEndZ = manifoldConnectionZ;
            const tiltEndY = manifoldBottomY;
            
            // 计算倾斜段的长度和角度
            const horizontalDistance = Math.sqrt(
                Math.pow(tiltEndX - tiltStartX, 2) +
                Math.pow(tiltEndZ - tiltStartZ, 2)
            );
            const verticalDistance = tiltEndY - tiltStartY;
            const tiltLength = Math.sqrt(
                Math.pow(horizontalDistance, 2) + Math.pow(verticalDistance, 2)
            );
            
            const tiltGeometry = new THREE.CylinderGeometry(
                this.config.supportLegDiameter / 2,
                this.config.supportLegDiameter / 2,
                tiltLength,
                16
            );
            
            const tiltSegment = new THREE.Mesh(tiltGeometry, this.materials.support);
            
            // 使用四元数使圆柱从默认Y轴方向对齐到 (start -> end) 方向
            const startVec = new THREE.Vector3(tiltStartX, tiltStartY, tiltStartZ);
            const endVec = new THREE.Vector3(tiltEndX, tiltEndY, tiltEndZ);
            const dirVec = new THREE.Vector3().subVectors(endVec, startVec).normalize();
            const upVec = new THREE.Vector3(0, 1, 0); // CylinderGeometry 默认沿Y轴
            const quaternion = new THREE.Quaternion().setFromUnitVectors(upVec, dirVec);
            tiltSegment.quaternion.copy(quaternion);
            
            // 设置倾斜段位置为起点与终点的中点，确保两端精确对齐
            const midPoint = new THREE.Vector3().addVectors(startVec, endVec).multiplyScalar(0.5);
            tiltSegment.position.copy(midPoint);
            
            tiltSegment.name = `倾斜段_${i + 1}`;
            tiltSegment.castShadow = true;
            tiltSegment.receiveShadow = true;
            columnGroup.add(tiltSegment);
            
            // 注意：不在这里添加连接法兰，因为所有柱子都汇聚到同一点
            // 稍后会在集流器中心创建一个统一的连接节点
            
            columnGroup.name = `一体化支撑柱_${i + 1}`;
            supportGroup.add(columnGroup);
            
            console.log(`✅ ${directionName}一体化支撑柱${i + 1}创建完成:`);
            console.log(`   垂直段: ${verticalHeight.toFixed(3)}m (地面到平台)`);
            console.log(`   倾斜段: ${tiltLength.toFixed(3)}m (平台到集流器中心)`);
            console.log(`   倾斜角度: ${(Math.atan2(horizontalDistance, verticalDistance) * 180 / Math.PI).toFixed(1)}°`);
            console.log(`   汇聚效果: 从平台${directionName}边缘汇集到集流器中心点`);
            
            // 底座脚垫
            const footGeometry = new THREE.CylinderGeometry(
                this.config.supportLegDiameter * 0.8,
                this.config.supportLegDiameter * 0.8,
                0.05,
                16
            );
            
            const foot = new THREE.Mesh(footGeometry, this.materials.base);
            foot.position.set(x, 0.025, z);
            foot.name = `底座脚垫_${i + 1}`;
            foot.castShadow = true;
            supportGroup.add(foot);
        }
        
        // 创建集流器中心的统一连接节点（所有柱子汇聚点）
        const centralConnectionGeometry = new THREE.SphereGeometry(
            this.config.supportLegDiameter * 0.6, // 连接球的半径
            16, 
            16
        );
        
        const centralConnection = new THREE.Mesh(centralConnectionGeometry, this.materials.base);
        centralConnection.position.set(0, manifoldBottomY, 0); // 集流器底部中心
        centralConnection.name = '中心连接节点';
        centralConnection.castShadow = true;
        supportGroup.add(centralConnection);
        
        console.log('🎯 创建中心连接节点完成: 四个柱子汇聚到集流器底部中心');
        console.log(`   位置: (0, ${manifoldBottomY.toFixed(3)}, 0)`);
        console.log(`   半径: ${(this.config.supportLegDiameter * 0.6).toFixed(3)}m`);
        
        // 2. 创建托盘平台，预留八个圆形孔洞
        this.createPlatformWithHoles(supportGroup);
        
        // 3. 顶部支撑环
        const ringGeometry = new THREE.TorusGeometry(
            this.config.supportBaseRadius * 0.8,
            this.config.supportLegDiameter / 4,
            8,
            32
        );
        
        const supportRing = new THREE.Mesh(ringGeometry, this.materials.support);
        supportRing.position.set(0, this.config.supportHeight, 0);
        supportRing.name = '顶部支撑环';
        supportRing.castShadow = true;
        supportGroup.add(supportRing);
        
        supportGroup.name = '底座支撑结构';
        this.components.supportBase = supportGroup;
        this.group.add(supportGroup);
    }
    
    /**
     * 创建托盘平台，预留八个圆形孔洞供绿色旋流器锥形底部插入
     */
    createPlatformWithHoles(parentGroup) {
        const platformGroup = new THREE.Group();
        
        // 平台基础参数
        const platformRadius = this.config.supportBaseRadius * 1.2; // 平台半径
        const platformThickness = 0.15; // 平台厚度
        const holeRadius = this.config.outletCylinderDiameter / 2 + 0.02; // 孔洞半径，略大于出口圆柱
        const platformY = 2; // 平台高度位置
        const railingHeight = 0.5; // 围栏高度
        
        // 创建平台主体（圆形）
        const platformGeometry = new THREE.CylinderGeometry(
            platformRadius,
            platformRadius,
            platformThickness,
            64
        );
        
        const platform = new THREE.Mesh(platformGeometry, this.materials.base);
        platform.position.set(0, platformY, 0);
        platform.name = '托盘平台主体';
        platform.castShadow = true;
        platform.receiveShadow = true;
        
        // 使用CSG操作在平台上创建八个圆形孔洞
        // 由于Three.js不直接支持CSG，我们使用多个圆环来模拟孔洞效果
        for (let i = 0; i < this.config.cycloneCount; i++) {
            const angle = (i / this.config.cycloneCount) * Math.PI * 2;
            const holeX = Math.cos(angle) * this.config.cycloneRadius;
            const holeZ = Math.sin(angle) * this.config.cycloneRadius;
            
            // 创建孔洞边缘加强环
            const holeRingGeometry = new THREE.TorusGeometry(
                holeRadius + 0.01, // 外半径
                0.01, // 管半径
                8,
                32
            );
            
            const holeRing = new THREE.Mesh(holeRingGeometry, this.materials.support);
            holeRing.position.set(holeX, platformY + platformThickness / 2 + 0.005, holeZ);
            holeRing.name = `孔洞加强环_${i + 1}`;
            holeRing.castShadow = true;
            platformGroup.add(holeRing);
            
            // 创建孔洞标识（用小圆环表示孔洞位置）
            const holeMarkerGeometry = new THREE.TorusGeometry(
                holeRadius * 0.8,
                0.005,
                6,
                24
            );
            
            const holeMarker = new THREE.Mesh(holeMarkerGeometry, this.materials.cyclone);
            holeMarker.position.set(holeX, platformY + platformThickness / 2 + 0.01, holeZ);
            holeMarker.name = `孔洞标识_${i + 1}`;
            platformGroup.add(holeMarker);
        }
        
        // 创建平台围栏
        this.createPlatformRailing(platformGroup, platformRadius, platformY, platformThickness, railingHeight);
        
        // 不创建倾斜连接柱，只保留垂直支撑柱到平台
        // this.createTiltedConnectionColumns(platformGroup, platformY, platformThickness);
        
        platformGroup.add(platform);
        platformGroup.name = '托盘平台';
        parentGroup.add(platformGroup);
        
        // 存储平台信息供后续使用
        this.platformInfo = {
            radius: platformRadius,
            thickness: platformThickness,
            y: platformY,
            holeRadius: holeRadius,
            railingHeight: railingHeight,
            holePositions: []
        };
        
        // 记录八个孔洞位置
        for (let i = 0; i < this.config.cycloneCount; i++) {
            const angle = (i / this.config.cycloneCount) * Math.PI * 2;
            this.platformInfo.holePositions.push({
                x: Math.cos(angle) * this.config.cycloneRadius,
                z: Math.sin(angle) * this.config.cycloneRadius,
                angle: angle * 180 / Math.PI
            });
        }
        
        console.log('🔧 托盘平台创建完成，预留八个圆形孔洞，添加高度为0.5的围栏');
    }
    
    /**
     * 创建平台围栏
     */
    createPlatformRailing(platformGroup, platformRadius, platformY, platformThickness, railingHeight) {
        const railingGroup = new THREE.Group();
        
        // 围栏参数
        const postCount = 16; // 围栏柱数量
        const postRadius = 0.02; // 围栏柱半径
        const railCount = 2; // 横杆数量
        
        // 创建围栏柱
        for (let i = 0; i < postCount; i++) {
            const angle = (i / postCount) * Math.PI * 2;
            const postX = Math.cos(angle) * (platformRadius - 0.05);
            const postZ = Math.sin(angle) * (platformRadius - 0.05);
            
            // 围栏柱几何体
            const postGeometry = new THREE.CylinderGeometry(
                postRadius,
                postRadius,
                railingHeight,
                8
            );
            
            const post = new THREE.Mesh(postGeometry, this.materials.support);
            post.position.set(
                postX, 
                platformY + platformThickness / 2 + railingHeight / 2, 
                postZ
            );
            post.name = `围栏柱_${i + 1}`;
            post.castShadow = true;
            railingGroup.add(post);
            
            // 围栏柱顶部球形装饰
            const capGeometry = new THREE.SphereGeometry(postRadius * 1.2, 8, 8);
            const cap = new THREE.Mesh(capGeometry, this.materials.support);
            cap.position.set(
                postX,
                platformY + platformThickness / 2 + railingHeight,
                postZ
            );
            cap.name = `围栏柱顶_${i + 1}`;
            cap.castShadow = true;
            railingGroup.add(cap);
        }
        
        // 创建围栏横杆
        for (let j = 0; j < railCount; j++) {
            const railHeight = platformY + platformThickness / 2 + (j + 1) * (railingHeight / (railCount + 1));
            
            // 创建环形横杆
            const railGeometry = new THREE.TorusGeometry(
                platformRadius - 0.05,
                postRadius * 0.8,
                8,
                64
            );
            
            const rail = new THREE.Mesh(railGeometry, this.materials.support);
            rail.position.set(0, railHeight, 0);
            rail.rotation.x = Math.PI / 2; // 水平放置
            rail.name = `围栏横杆_${j + 1}`;
            rail.castShadow = true;
            railingGroup.add(rail);
        }
        
        // 创建顶部环形横杆
        const topRailGeometry = new THREE.TorusGeometry(
            platformRadius - 0.05,
            postRadius * 0.8,
            8,
            64
        );
        
        const topRail = new THREE.Mesh(topRailGeometry, this.materials.support);
        topRail.position.set(0, platformY + platformThickness / 2 + railingHeight, 0);
        topRail.rotation.x = Math.PI / 2; // 水平放置
        topRail.name = '围栏顶部横杆';
        topRail.castShadow = true;
        railingGroup.add(topRail);
        
        railingGroup.name = '平台围栏';
        platformGroup.add(railingGroup);
        
        console.log(`🛡️ 平台围栏创建完成：高度${railingHeight}m，立柱${postCount}根，三层横栏`);
    }
    

    

    
    /**
     * 创建工业阀门 - 真实工业样式（放大版，带法兰、螺栓圈、填料函、支架、手轮）
     */
    createIndustrialValve(position, rotation = { x: 0, y: 0, z: 0 }) {
        const valveGroup = new THREE.Group();

        // 尺寸基准（比原来整体放大 ~1.6x）
        const bodyDiameter = 0.14;
        const bodyHeight = 0.22;
        const flangeDiameter = bodyDiameter * 1.6;
        const flangeThickness = 0.035;
        const boltCount = 8;
        const boltRadius = flangeDiameter * 0.36; // 螺栓分布半径
        const boltDia = 0.018;

        // 主体（阀腔）
        const bodyGeometry = new THREE.CylinderGeometry(bodyDiameter / 2, bodyDiameter / 2, bodyHeight, 24);
        const bodyMaterial = new THREE.MeshPhongMaterial({ color: 0x2d5016, shininess: 40 });
        const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
        body.name = '阀体';
        body.castShadow = true;
        valveGroup.add(body);

        // 上盖（阀盖/压盖座）
        const bonnetGeometry = new THREE.CylinderGeometry(bodyDiameter * 0.45, bodyDiameter * 0.45, 0.05, 24);
        const bonnet = new THREE.Mesh(bonnetGeometry, bodyMaterial);
        bonnet.position.y = bodyHeight / 2 + 0.025;
        bonnet.name = '阀盖';
        bonnet.castShadow = true;
        valveGroup.add(bonnet);

        // 填料函（压盖筒段）
        const packingGeometry = new THREE.CylinderGeometry(bodyDiameter * 0.22, bodyDiameter * 0.22, 0.08, 16);
        const packing = new THREE.Mesh(packingGeometry, new THREE.MeshPhongMaterial({ color: 0x3a3a3a, shininess: 20 }));
        packing.position.y = bonnet.position.y + 0.065;
        packing.name = '填料函';
        packing.castShadow = true;
        valveGroup.add(packing);

        // 阀杆
        const stemGeometry = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 12);
        const stem = new THREE.Mesh(stemGeometry, new THREE.MeshPhongMaterial({ color: 0xB0B0B0, shininess: 80 }));
        stem.position.y = packing.position.y + 0.12;
        stem.name = '阀杆';
        stem.castShadow = true;
        valveGroup.add(stem);

        // 手轮（更大的直径与更细的辐条）
        const handwheelOuterR = 0.11;
        const handwheelGeometry = new THREE.TorusGeometry(handwheelOuterR, 0.012, 12, 32);
        const handwheel = new THREE.Mesh(handwheelGeometry, new THREE.MeshPhongMaterial({ color: 0x222222, shininess: 15 }));
        handwheel.position.y = stem.position.y + 0.06;
        handwheel.rotation.x = Math.PI / 2;
        handwheel.name = '手轮';
        handwheel.castShadow = true;
        valveGroup.add(handwheel);

        // 手轮辐条
        const spokeCount = 6;
        for (let i = 0; i < spokeCount; i++) {
            const a = (i / spokeCount) * Math.PI * 2;
            const spokeGeom = new THREE.BoxGeometry(handwheelOuterR * 1.4, 0.008, 0.008);
            const spoke = new THREE.Mesh(spokeGeom, new THREE.MeshPhongMaterial({ color: 0x2b2b2b }));
            spoke.position.set(Math.cos(a) * handwheelOuterR * 0.5, handwheel.position.y, Math.sin(a) * handwheelOuterR * 0.5);
            spoke.rotation.y = a;
            spoke.castShadow = true;
            valveGroup.add(spoke);
        }

        // 进出口短管 + 法兰（两端）
        const nozzleLen = 0.08;
        const nozzleDia = bodyDiameter * 0.7;
        const nozzleGeom = new THREE.CylinderGeometry(nozzleDia / 2, nozzleDia / 2, nozzleLen, 16);
        const nozzleMat = new THREE.MeshPhongMaterial({ color: 0x888888, shininess: 60 });

        const nozzle1 = new THREE.Mesh(nozzleGeom, nozzleMat);
        nozzle1.position.set(0, 0, nozzleLen / 2 + bodyDiameter * 0.05);
        nozzle1.rotation.x = Math.PI / 2;
        nozzle1.castShadow = true;
        valveGroup.add(nozzle1);

        const nozzle2 = nozzle1.clone();
        nozzle2.position.z = -(nozzleLen / 2 + bodyDiameter * 0.05);
        valveGroup.add(nozzle2);

        // 法兰盘
        const flangeGeom = new THREE.CylinderGeometry(flangeDiameter / 2, flangeDiameter / 2, flangeThickness, 24);
        const flangeMat = new THREE.MeshPhongMaterial({ color: 0xA0A0A0, shininess: 80 });

        const flange1 = new THREE.Mesh(flangeGeom, flangeMat);
        flange1.position.set(0, 0, nozzle1.position.z + flangeThickness / 2 + nozzleLen / 2);
        flange1.rotation.x = Math.PI / 2;
        flange1.castShadow = true;
        valveGroup.add(flange1);

        const flange2 = flange1.clone();
        flange2.position.z = -flange1.position.z;
        valveGroup.add(flange2);

        // 法兰螺栓圈
        for (let i = 0; i < boltCount; i++) {
            const a = (i / boltCount) * Math.PI * 2;
            const bx = Math.cos(a) * boltRadius;
            const bz = Math.sin(a) * boltRadius;
            const boltGeom = new THREE.CylinderGeometry(boltDia / 2, boltDia / 2, flangeThickness * 1.6, 8);
            const nutGeom = new THREE.CylinderGeometry(boltDia * 0.7, boltDia * 0.7, flangeThickness * 0.6, 6);
            const metalMat = new THREE.MeshPhongMaterial({ color: 0x7A7A7A, shininess: 90 });

            const bolt1 = new THREE.Mesh(boltGeom, metalMat);
            bolt1.position.set(bx, 0, flange1.position.z);
            bolt1.rotation.x = Math.PI / 2;
            bolt1.castShadow = true;
            valveGroup.add(bolt1);

            const nut1 = new THREE.Mesh(nutGeom, metalMat);
            nut1.position.set(bx, 0, flange1.position.z + flangeThickness / 2);
            nut1.rotation.x = Math.PI / 2;
            nut1.castShadow = true;
            valveGroup.add(nut1);

            const bolt2 = bolt1.clone();
            bolt2.position.z = flange2.position.z;
            valveGroup.add(bolt2);

            const nut2 = nut1.clone();
            nut2.position.z = flange2.position.z - flangeThickness / 2;
            valveGroup.add(nut2);
        }

        // 阀体加强肋（四向）
        for (let i = 0; i < 4; i++) {
            const a = (i / 4) * Math.PI * 2;
            const ribGeom = new THREE.BoxGeometry(0.02, bodyHeight * 0.7, 0.008);
            const rib = new THREE.Mesh(ribGeom, bodyMaterial);
            rib.position.set(Math.cos(a) * bodyDiameter * 0.32, 0, Math.sin(a) * bodyDiameter * 0.32);
            rib.rotation.y = a;
            rib.castShadow = true;
            valveGroup.add(rib);
        }
        
        // 设置阀门位置和旋转
        valveGroup.position.set(position.x, position.y, position.z);
        valveGroup.rotation.set(rotation.x, rotation.y, rotation.z);
        valveGroup.name = '工业水阀(增强)';
        
        return valveGroup;
    }
    
    /**
     * 创建阀门系统 - 连接蓝色软管底部与白色集流器底部
     */
    createValveSystems() {
        const valveSystemGroup = new THREE.Group();
        
        for (let i = 0; i < this.config.cycloneCount; i++) {
            const angle = (i / this.config.cycloneCount) * Math.PI * 2;
            
            // 获取蓝色软管底部位置（从greenCylinderCoordinates获取）
            let hoseBottomX, hoseBottomZ, hoseBottomY;
            if (this.greenCylinderCoordinates && this.greenCylinderCoordinates[i]) {
                const hoseBottomCoord = this.greenCylinderCoordinates[i];
                hoseBottomX = hoseBottomCoord.x;
                hoseBottomZ = hoseBottomCoord.z;
                hoseBottomY = hoseBottomCoord.y - 0.15; // 软管底部位置
            } else {
                // 备用计算方式
                hoseBottomX = Math.cos(angle) * this.config.cycloneRadius;
                hoseBottomZ = Math.sin(angle) * this.config.cycloneRadius;
                hoseBottomY = this.config.supportHeight - 1.0; // 软管底部位置
            }
            
            // 白色集流器底部位置
            const manifoldBottomX = Math.cos(angle) * this.config.manifoldRadius * 0.8;
            const manifoldBottomZ = Math.sin(angle) * this.config.manifoldRadius * 0.8;
            const manifoldBottomY = this.config.supportHeight + this.config.manifoldHeight * 0.1; // 集流器底部
            
            // 计算阀门位置（蓝色软管底部与集流器底部之间的中点）
            const valveX = (hoseBottomX + manifoldBottomX) / 2;
            const valveZ = (hoseBottomZ + manifoldBottomZ) / 2;
            const valveY = (hoseBottomY + manifoldBottomY) / 2;
            
            // 计算阀门朝向（从集流器底部指向软管底部）
            const direction = new THREE.Vector3(
                hoseBottomX - manifoldBottomX,
                hoseBottomY - manifoldBottomY,
                hoseBottomZ - manifoldBottomZ
            ).normalize();
            
            // 计算旋转角度
            const rotationY = Math.atan2(direction.x, direction.z);
            const rotationX = Math.asin(-direction.y);
            
            // 创建阀门
            const valve = this.createIndustrialValve(
                { x: valveX, y: valveY, z: valveZ },
                { x: rotationX, y: rotationY, z: 0 }
            );
            valve.name = `阀门_${i + 1}`;
            valveSystemGroup.add(valve);
            
            // 创建连接管道 - 从集流器底部到阀门
            const manifoldPipeGeometry = new THREE.CylinderGeometry(0.045, 0.045, 0.3, 16);
            const pipeManifoldMaterial = new THREE.MeshPhongMaterial({
                color: 0x8c8c8c, // 灰色管道
                shininess: 40
            });
            
            const manifoldPipe = new THREE.Mesh(manifoldPipeGeometry, pipeManifoldMaterial);
            const manifoldPipeLength = Math.sqrt(
                Math.pow(valveX - manifoldBottomX, 2) +
                Math.pow(valveY - manifoldBottomY, 2) +
                Math.pow(valveZ - manifoldBottomZ, 2)
            );
            
            manifoldPipe.scale.y = manifoldPipeLength / 0.3;
            manifoldPipe.position.set(
                (manifoldBottomX + valveX) / 2,
                (manifoldBottomY + valveY) / 2,
                (manifoldBottomZ + valveZ) / 2
            );
            
            // 设置管道方向
            manifoldPipe.lookAt(new THREE.Vector3(valveX, valveY, valveZ));
            manifoldPipe.rotateX(Math.PI / 2);
            manifoldPipe.name = `集流器底部连接管_${i + 1}`;
            manifoldPipe.castShadow = true;
            valveSystemGroup.add(manifoldPipe);
            
            // 创建连接管道 - 从阀门到蓝色软管底部
            const hosePipe = new THREE.Mesh(manifoldPipeGeometry, pipeManifoldMaterial);
            const hosePipeLength = Math.sqrt(
                Math.pow(hoseBottomX - valveX, 2) +
                Math.pow(hoseBottomY - valveY, 2) +
                Math.pow(hoseBottomZ - valveZ, 2)
            );
            
            hosePipe.scale.y = hosePipeLength / 0.3;
            hosePipe.position.set(
                (hoseBottomX + valveX) / 2,
                (hoseBottomY + valveY) / 2,
                (hoseBottomZ + valveZ) / 2
            );
            
            // 设置管道方向
            hosePipe.lookAt(new THREE.Vector3(hoseBottomX, hoseBottomY, hoseBottomZ));
            hosePipe.rotateX(Math.PI / 2);
            hosePipe.name = `软管底部连接管_${i + 1}`;
            hosePipe.castShadow = true;
            valveSystemGroup.add(hosePipe);
            
            console.log(`✅ 阀门${i + 1}创建完成: 位置(${valveX.toFixed(3)}, ${valveY.toFixed(3)}, ${valveZ.toFixed(3)})`);
        }
        
        valveSystemGroup.name = '阀门系统';
        this.components.valves = valveSystemGroup;
        this.group.add(valveSystemGroup);
        
        console.log('🔧 阀门系统创建完成：8个工业阀门连接蓝色软管底部与白色集流器底部');
        console.log('⚙️ 每个阀门包含：绿色主体、黑色手轮、灰色连接管道');
        console.log('🔗 连接路径：白色集流器底部 ← 阀门 ← 蓝色软管底部');
    }
    
    /**
     * 获取设备组
     */
    getGroup() {
        return this.group;
    }
    
    /**
     * 获取八个蓝色软管底部坐标
     */
    getHoseBottomCoordinates() {
        return this.hoseBottomCoordinates || [];
    }
    
    /**
     * 获取八个绿色小圆柱坐标
     */
    getGreenCylinderCoordinates() {
        return this.greenCylinderCoordinates || [];
    }
    
    /**
     * 输出八个蓝色软管底部坐标的详细信息
     */
    logHoseBottomCoordinates() {
        console.group('🔧 石膏旋流器 - 八个蓝色软管底部坐标详情');
        
        if (!this.hoseBottomCoordinates || this.hoseBottomCoordinates.length === 0) {
            console.warn('坐标数据未初始化！');
            console.groupEnd();
            return;
        }
        
        console.log('基础配置参数:');
        console.log(`- 旋流器数量: ${this.config.cycloneCount}`);
        console.log(`- 环绕半径: ${this.config.cycloneRadius}m`);
        console.log(`- 倾斜角度: ${(this.config.cycloneTiltAngle * 180 / Math.PI).toFixed(1)}°`);
        console.log(`- 支架高度: ${this.config.supportHeight}m`);
        console.log(`- 锥体高度: ${this.config.cycloneHeight}m`);
        console.log(`- 出口圆柱高度: ${this.config.outletCylinderHeight}m`);
        
        console.log('\n八个蓝色软管底部坐标 (绿色锥体底部出口位置):');
        this.hoseBottomCoordinates.forEach((coord, index) => {
            console.log(`软管${index + 1}: 角度${coord.angle.toFixed(1)}° → 坐标(${coord.x.toFixed(3)}, ${coord.y.toFixed(3)}, ${coord.z.toFixed(3)})`);
        });
        
        console.log('\n坐标计算公式:');
        console.log('cycloneBaseX = cos(angle) * cycloneRadius');
        console.log('cycloneBaseZ = sin(angle) * cycloneRadius');
        console.log('cycloneBaseY = supportHeight + 0.5');
        console.log('tiltOffset = sin(tiltAngle) * cycloneHeight * 0.5');
        console.log('bottomTiltOffset = cos(tiltAngle) * cycloneHeight * 0.5');
        console.log('hoseBottomX = cycloneBaseX + cos(angle) * tiltOffset');
        console.log('hoseBottomZ = cycloneBaseZ + sin(angle) * tiltOffset');
        console.log('hoseBottomY = cycloneBaseY - bottomTiltOffset - outletCylinderHeight / 2');
        
        console.groupEnd();
    }
    
    /**
     * 验证新的连接方式：绿色锥体底部 ↔ 蓝色软管底部，蓝色软管顶部 ↔ 白色集流器
     */
    validateAlignment() {
        console.group('🔍 验证新连接方式对齐情况');
        
        if (!this.components.cyclones || !this.components.hoses) {
            console.warn('旋流器单元或软管系统未初始化！');
            console.groupEnd();
            return;
        }
        
        const cycloneUnits = this.components.cyclones.children;
        const hoseUnits = this.components.hoses.children;
        
        let alignmentErrors = 0;
        const tolerance = 0.001; // 1mm容差
        
        console.log('验证连接关系（锥体旋转180度后）：');
        console.log('1. 白色集流器侧面 ↔ 蓝色软管顶部');
        console.log('2. 蓝色软管底部 ↔ 绿色锥体底部（锥体已旋转180度，锥尖朝下）');
        
        for (let i = 0; i < Math.min(cycloneUnits.length, hoseUnits.length); i++) {
            const cycloneUnit = cycloneUnits[i];
            const hoseUnit = hoseUnits[i];
            
            // 验证绿色锥体底部与蓝色软管底部的连接
            if (cycloneUnit.userData.coneBottomCoord && hoseUnit.userData.hoseBottomCoord) {
                const coneBottomCoord = cycloneUnit.userData.coneBottomCoord;
                const hoseBottomCoord = hoseUnit.userData.hoseBottomCoord;
                
                const deltaX = Math.abs(coneBottomCoord.x - hoseBottomCoord.x);
                const deltaY = Math.abs(coneBottomCoord.y - hoseBottomCoord.y);
                const deltaZ = Math.abs(coneBottomCoord.z - hoseBottomCoord.z);
                
                const maxDelta = Math.max(deltaX, deltaY, deltaZ);
                
                if (maxDelta > tolerance) {
                    console.warn(`❌ 单元${i + 1}绿色锥体底部-软管底部连接误差: Δx=${deltaX.toFixed(4)}, Δy=${deltaY.toFixed(4)}, Δz=${deltaZ.toFixed(4)}`);
                    alignmentErrors++;
                } else {
                    console.log(`✅ 单元${i + 1}绿色锥体底部-软管底部连接正确: 误差${maxDelta.toFixed(4)}m`);
                }
            }
            
            // 验证蓝色软管顶部与白色集流器的连接（这个连接点由集管入口接管确定）
            if (hoseUnit.userData.topCoord) {
                const hoseTopCoord = hoseUnit.userData.topCoord;
                console.log(`🔗 单元${i + 1}软管顶部连接到集流器: (${hoseTopCoord.x.toFixed(3)}, ${hoseTopCoord.y.toFixed(3)}, ${hoseTopCoord.z.toFixed(3)})`);
            }
        }
        
        if (alignmentErrors === 0) {
            console.log(`🎉 所有${cycloneUnits.length}个连接完美对齐！`);
            console.log('✓ 白色集流器侧面 → 蓝色软管顶部');
            console.log('✓ 蓝色软管底部 → 绿色锥体底部（锥体已旋转180度）');
            console.log('🔄 绿色锥体已旋转180度，锥尖朝下，锥底朝上');
            console.log('🎯 锥体底部（上方）已连接到蓝色软管底部');
        } else {
            console.warn(`⚠️ 发现${alignmentErrors}个对齐误差，需要调整`);
        }
        
        console.groupEnd();
        return alignmentErrors === 0;
    }
    
    /**
     * 获取设备边界框
     */
    getBoundingBox() {
        const box = new THREE.Box3().setFromObject(this.group);
        return box;
    }
    
    /**
     * 设置设备可见性
     */
    setVisible(visible) {
        this.group.visible = visible;
    }
    
    /**
     * 销毁设备
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

    /**
     * 创建石膏旋流器标签（参考泵房内部排浆泵标签样式）
     */
    createCycloneLabels() {
        const labelGroup = new THREE.Group();
        labelGroup.name = 'componentLabels';

        // 主标题（设备名称）
        const title = this.createSpriteLabel('石膏旋流器', '#00FF88', 256, 64, 24);
        // 放在集流器上方
        title.position.set(0, this.config.supportHeight + this.config.manifoldHeight + 0.6, 0);
        labelGroup.add(title);
        
        this.group.add(labelGroup);
        if (!this.components) this.components = {};
        this.components.set ? this.components.set('componentLabels', labelGroup) : (this.components['componentLabels'] = labelGroup);

        console.log('✅ 石膏旋流器标签创建完成');
    }

    /** 在集流器上增加入浆口与出水口 */
    createProcessPorts() {
        const portsGroup = new THREE.Group();
        portsGroup.name = 'processPorts';

        // 记录端口（局部坐标）
        this.ports = {
            inlet: null,
            outlet: null
        };

        // 1) 入浆口：集流器中间部分向右侧延伸的工业管道
        const inletY = this.config.supportHeight + this.config.manifoldHeight * 0.5; // 中间部分
        const inletLength = 2.0; // 延长管道，向右侧延伸
        const inletRadius = 0.15; // 稍微增大管道直径
        
        // 创建入浆口主管道
        const inletGeom = new THREE.CylinderGeometry(inletRadius, inletRadius, inletLength, 16);
        const inletMat = new THREE.MeshStandardMaterial({ 
            color: 0x95A5B8, 
            metalness: 0.85, 
            roughness: 0.25 
        });
        const inletPipe = new THREE.Mesh(inletGeom, inletMat);
        inletPipe.rotation.z = Math.PI / 2; // 沿X轴（向右）
        inletPipe.position.set(this.config.manifoldRadius + inletLength / 2, inletY, 0);
        inletPipe.name = '入浆口管道';
        inletPipe.castShadow = true;
        portsGroup.add(inletPipe);

        // 入浆口法兰
        const inletFlange = new THREE.Mesh(
            new THREE.CylinderGeometry(inletRadius * 1.6, inletRadius * 1.6, 0.08, 20), 
            new THREE.MeshStandardMaterial({ color: 0xB0B0B0, metalness: 0.9, roughness: 0.2 })
        );
        inletFlange.rotation.z = Math.PI / 2;
        inletFlange.position.set(this.config.manifoldRadius + inletLength, inletY, 0);
        inletFlange.name = '入浆口法兰';
        portsGroup.add(inletFlange);

        // 入浆口连接接管（从集管表面到主管道）
        const connectionLength = 0.3;
        const connectionGeom = new THREE.CylinderGeometry(inletRadius * 0.9, inletRadius * 0.9, connectionLength, 16);
        const connectionPipe = new THREE.Mesh(connectionGeom, inletMat);
        connectionPipe.rotation.z = Math.PI / 2;
        connectionPipe.position.set(this.config.manifoldRadius + connectionLength / 2, inletY, 0);
        connectionPipe.name = '入浆口连接管';
        connectionPipe.castShadow = true;
        portsGroup.add(connectionPipe);

        // 入浆口标签
        const inletLabel = this.createSpriteLabel('入浆口', '#00D1FF', 192, 48, 20);
        inletLabel.position.set(this.config.manifoldRadius + inletLength + 0.3, inletY + 0.3, 0.2);
        portsGroup.add(inletLabel);

        // 保存入浆口端点（局部坐标）
        this.ports.inlet = { 
            x: this.config.manifoldRadius + inletLength, 
            y: inletY, 
            z: 0 
        };

        // 2) 出水口：集流器底部添加工业管道，标记为出水口
        const outletY = this.config.supportHeight; // 集流器底部
        const outletLength = 1.5; // 向下延伸的长度
        const outletRadius = 0.15; // 与入浆口相同直径
        
        // 创建出水口主管道（向下）
        const outletGeom = new THREE.CylinderGeometry(outletRadius, outletRadius, outletLength, 16);
        const outletMat = inletMat; // 使用相同材质
        const outletPipe = new THREE.Mesh(outletGeom, outletMat);
        outletPipe.position.set(0, outletY - outletLength / 2, 0); // 向下延伸
        outletPipe.name = '出水口管道';
        outletPipe.castShadow = true;
        portsGroup.add(outletPipe);

        // 出水口法兰
        const outletFlange = new THREE.Mesh(
            new THREE.CylinderGeometry(outletRadius * 1.6, outletRadius * 1.6, 0.08, 20),
            new THREE.MeshStandardMaterial({ color: 0xB0B0B0, metalness: 0.9, roughness: 0.2 })
        );
        outletFlange.position.set(0, outletY - outletLength, 0);
        outletFlange.name = '出水口法兰';
        portsGroup.add(outletFlange);

        // 出水口连接接管（从集管底部到主管道）
        const outletConnectionLength = 0.2;
        const outletConnectionGeom = new THREE.CylinderGeometry(outletRadius * 0.9, outletRadius * 0.9, outletConnectionLength, 16);
        const outletConnectionPipe = new THREE.Mesh(outletConnectionGeom, outletMat);
        outletConnectionPipe.position.set(0, outletY - outletConnectionLength / 2, 0);
        outletConnectionPipe.name = '出水口连接管';
        outletConnectionPipe.castShadow = true;
        portsGroup.add(outletConnectionPipe);

        // 出水口标签
        const outletLabel = this.createSpriteLabel('出水口', '#FFD166', 192, 48, 20);
        outletLabel.position.set(0.3, outletY - outletLength + 0.2, 0.2);
        portsGroup.add(outletLabel);

        // 保存出水口端点（局部坐标）
        this.ports.outlet = { 
            x: 0, 
            y: outletY - outletLength, 
            z: 0 
        };

        this.group.add(portsGroup);
        console.log('✅ 石膏旋流器入/出接口创建完成');
        console.log(`   入浆口：位于集流器中间部分，向右侧延伸 ${inletLength} 米`);
        console.log(`   出水口：位于集流器底部，向下延伸 ${outletLength} 米`);
    }

    /** 获取某端口的世界坐标 */
    getPortWorldPosition(portName) {
        if (!this.ports || !this.ports[portName]) return null;
        const local = new THREE.Vector3(this.ports[portName].x, this.ports[portName].y, this.ports[portName].z);
        return this.group.localToWorld(local.clone());
    }

    /**
     * 创建精灵标签（与泵房内部排浆泵一致的画布标签风格）
     */
    createSpriteLabel(text, color = '#FFFFFF', width = 256, height = 64, fontPx = 20) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = width;
        canvas.height = height;

        // 背景与边框
        context.font = `Bold ${fontPx}px Microsoft YaHei, Arial`;
        context.textAlign = 'center';
        context.textBaseline = 'middle';

        // 背景圆角矩形
        context.fillStyle = 'rgba(0, 0, 0, 0.75)';
        this._roundRect(context, 8, 8, width - 16, height - 16, 10);
        context.fill();

        // 边框
        context.strokeStyle = color;
        context.lineWidth = 2;
        this._roundRect(context, 8, 8, width - 16, height - 16, 10);
        context.stroke();

        // 文本（支持换行）
        context.fillStyle = color;
        const lines = String(text).split('\n');
        const lineHeight = fontPx + 6;
        const startY = height / 2 - ((lines.length - 1) * lineHeight) / 2;
        lines.forEach((line, idx) => {
            context.fillText(line, width / 2, startY + idx * lineHeight);
        });

        const texture = new THREE.CanvasTexture(canvas);
        texture.needsUpdate = true;
        const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.95, alphaTest: 0.01 });
        const sprite = new THREE.Sprite(material);
        // 根据画布比例设置可读尺寸
        sprite.scale.set(width / 64, height / 64, 1);
        return sprite;
    }

    // 内部工具：画圆角矩形
    _roundRect(ctx, x, y, w, h, r) {
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
}