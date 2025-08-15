/**
 * 3D脱硫塔工艺流程图 - 主程序
 * 负责场景初始化、交互控制和渲染循环
 * 更新时间: 2025-01-30 10:46 - 修复点击任意位置进入内部视图
 */

// 全局变量
let scene, camera, renderer, controls;
let dualTowerSystem; // 双塔系统替代单塔
let raycaster, mouse;
let isAnimationEnabled = true;
let stats = { fps: 0, frameCount: 0, lastTime: 0, objectCount: 0 };
let loadingProgress = 0;
let parameterPanel = null;
let zoomRecoverTimer = null;
let zoomRecoverAnimating = false;
let zoomRecoverStart = null;
let zoomRecoverFrom = null;
let zoomRecoverTo = null;
const ZOOM_RECOVER_DELAY = 600; // ms
const ZOOM_RECOVER_DURATION = 500; // ms
let zoomAnim = null;
const ZOOM_ANIM_DURATION = 200; // ms

/**
 * 初始化3D场景
 */
async function init() {
    updateProgress(10, '初始化场景...');
    
    // 创建场景
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x87CEEB);
    scene.fog = new THREE.Fog(0x87CEEB, 100, 1200);
    
    updateProgress(20, '创建相机...');
    
    // 创建相机
    camera = new THREE.PerspectiveCamera(
        75, 
        window.innerWidth / window.innerHeight, 
        0.1, 
        2000
    );
    camera.position.set(50, 30, 50);
    
    updateProgress(30, '初始化渲染器...');
    
    // 创建渲染器
    renderer = new THREE.WebGLRenderer({ 
        antialias: true,
        alpha: true,
        powerPreference: "high-performance"
    });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    
    document.getElementById('container').appendChild(renderer.domElement);
    
    updateProgress(40, '设置控制器...');
    
    // 创建控制器
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;
    controls.minDistance = 5;    // 与自定义缩放的最小距离保持一致
    controls.maxDistance = 800;  // 与自定义缩放的最大距离保持一致
    controls.maxPolarAngle = Math.PI / 2 + 0.3;
    controls.autoRotate = false;
    controls.autoRotateSpeed = 0.5;
    
    // 禁用内置的缩放功能，使用我们的自定义缩放
    controls.enableZoom = false;
    
    // 优化旋转和平移的响应性
    controls.rotateSpeed = 1.0;
    controls.panSpeed = 0.8;
    controls.enablePan = true;
    
    updateProgress(50, '创建光照系统...');
    
    // 创建光照
    setupLighting();
    
    updateProgress(70, '构建双塔脱硫系统...');
    
    // 创建双塔脱硫系统并等待加载完成
    try {
        dualTowerSystem = new DualTowerDesulfurizationSystem({
            spacing: 40 // 两塔间距40米
        });
        await dualTowerSystem.waitForInitialization();
        scene.add(dualTowerSystem.group);
        console.log('双塔脱硫系统添加到场景成功');
        console.log('系统信息:', dualTowerSystem.getSystemInfo());
        
        // 双塔系统初始化完成后，立即创建SCR反应器
        console.log('🔍 开始检查SCR反应器创建条件...');
        console.log('- window对象:', typeof window !== 'undefined');
        console.log('- SCRReactor类:', typeof window.SCRReactor, !!window.SCRReactor);
        console.log('- dualTowerSystem:', !!dualTowerSystem);
        console.log('- dualTowerSystem.isInitialized:', dualTowerSystem?.isInitialized);
        console.log('- primaryTower:', !!dualTowerSystem?.primaryTower);
        
        if (dualTowerSystem?.primaryTower) {
            console.log('- primaryTower.group:', !!dualTowerSystem.primaryTower.group);
            console.log('- primaryTower位置:', dualTowerSystem.primaryTower.group?.position);
        }
        
        try {
            const ENABLE_PRIMARY_SCR = false; // 关闭初始（较小）SCR，避免重复
            if (ENABLE_PRIMARY_SCR && typeof window !== 'undefined' && window.SCRReactor && dualTowerSystem?.primaryTower) {
                console.log('✅ 所有依赖条件满足，开始创建SCR反应器...');
                const ptPos = dualTowerSystem.primaryTower.group.position;
                console.log('📍 一级塔位置:', ptPos);
                
                const scrReactorConfig = {
                    name: 'SCR脱硝反应器',
                    position: { 
                        x: ptPos.x + 30, // 一级塔右侧30个位置
                        y: 0, 
                        z: ptPos.z - 40 // 一级塔后方40个位置
                    },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: 1.2, // 稍微放大以符合工业实际
                    L: 10, // 长度10米
                    W: 6,  // 宽度6米
                    H: 8,  // 高度8米
                    layerCount: 3, // 3层催化剂
                    layerThickness: 1.2,
                    blocksX: 8, // 增加催化剂块数量
                    blocksY: 8,
                    inletSize: [4, 4], // 更大的进出口
                    outletSize: [4, 4],
                    showAIG: true, // 显示氨喷射格栅
                    aigRows: 5, // 增加喷氨管道数量
                    aigCols: 8
                };
                
                console.log('🔧 SCR反应器配置:', scrReactorConfig);
                
                const scrReactor = new SCRReactor(scrReactorConfig);
                console.log('🏗️ SCR反应器实例创建完成');
                
                const scrGroup = scrReactor.getGroup();
                console.log('📦 SCR反应器组对象:', scrGroup);
                console.log('📦 组对象子元素数量:', scrGroup.children.length);
                
                scene.add(scrGroup);
                console.log('🎬 SCR反应器已添加到场景');
                
                window.scrReactor = scrReactor;
                console.log('🌐 SCR反应器已保存到window对象');
                
                console.log('✅ SCR脱硝反应器创建成功！');
                console.log('📊 SCR反应器模型信息:', scrReactor.getModelInfo());
                console.log('📍 SCR反应器最终位置:', scrGroup.position);

                // 若启用初始SCR，这里才添加标签
                try {
                    const g = scrReactor.getGroup();
                    const bbox = new THREE.Box3().setFromObject(g);
                    const groupWorldPos = g.getWorldPosition(new THREE.Vector3());
                    const aboveTopLocalY = Math.max(2.0, (bbox.max.y - groupWorldPos.y) + 2.5);
                    createIndustrialBuildingLabel(g, 'SCR脱硝反应器', { x: 0, y: aboveTopLocalY, z: 0 }, '#90CAF9');
                } catch (e) { console.warn('SCR标签创建失败:', e); }
            } else {
                console.warn('❌ SCR反应器创建失败 - 缺少依赖:', {
                    window: typeof window !== 'undefined',
                    SCRReactor: !!window.SCRReactor,
                    SCRReactorType: typeof window.SCRReactor,
                    dualTowerSystem: !!dualTowerSystem,
                    dualTowerSystemInitialized: dualTowerSystem?.isInitialized,
                    primaryTower: !!dualTowerSystem?.primaryTower,
                    primaryTowerGroup: !!dualTowerSystem?.primaryTower?.group
                });
            }
        } catch (scrErr) { 
            console.error('❌ SCR反应器创建失败:', scrErr);
            console.error('❌ 错误堆栈:', scrErr.stack); 
        }
        
    } catch (error) {
        console.error('双塔脱硫系统创建失败:', error);
        // 占位符已删除，为新模型腾出空间
    }
    
    updateProgress(75, '创建水箱系统...');
    
    // 定义水箱参数
    const tankConfig = {
            height: 25,
            radius: 8,
            capacity: '2000m³',
            material: '316L不锈钢'
    };
    
    // 创建左侧回收水箱
    try {
        const recycleWaterTank = new RecycleFilterTank({
            name: '回收水箱',
            ...tankConfig,
            position: { x: -50, y: 0, z: 70 } // 左侧位置，离脱硫塔更远
        });
        scene.add(recycleWaterTank.group);
        console.log('回收水箱添加到场景成功');
        console.log('回收水箱信息:', recycleWaterTank.getModelInfo());
        
        // 保存回收水箱引用到window对象，便于后续管道连接
        window.recycleFilterTank = recycleWaterTank;
    } catch (error) {
        console.error('回收水箱创建失败:', error);
    }
    
    // 创建右侧滤液水箱
    try {
        const filterLiquidTank = new FilterLiquidTank({
            name: '滤液水箱',
            ...tankConfig,
            position: { x: -30, y: 0, z: 70 } // 右侧位置，离脱硫塔更远
        });
        scene.add(filterLiquidTank.group);
        console.log('滤液水箱添加到场景成功');
        console.log('滤液水箱信息:', filterLiquidTank.getModelInfo());
        
        // 保存滤液水箱引用到window对象，便于后续管道连接
        window.filterLiquidTank = filterLiquidTank;
        
    } catch (error) {
        console.error('滤液水箱创建失败:', error);
    }
    
    // 创建两个水箱塔顶的连接平台 - 自动紧贴水箱顶部
    try {
        const connectingPlatform = new MetalPlatform({
            name: '塔顶连接平台',
            width: 20,       // 20米宽度连接两个水箱
            depth: 3,        // 3米深度
            height: 0.2,     // 平台厚度
            railingHeight: 1.2,
            platformHeight: tankConfig.height, // 自动适配水箱高度，紧贴顶部
            position: { x: -40, y: 0, z: 70 } // 位于两个水箱塔顶中间，自动紧贴顶部
        });
        scene.add(connectingPlatform.group);
        console.log('塔顶连接平台添加到场景成功');
        console.log('平台信息:', connectingPlatform.getModelInfo());
    } catch (error) {
        console.error('连接平台创建失败:', error);
    }
    
    updateProgress(78, '创建回收水泵...');
    
    // 创建两个回收水泵 - 位于回收水箱正前方
    try {
        // 回收水箱位于 x: -50, z: 70
        // 水泵放置在水箱正前方 (朝向正Z方向)
        
        // 第一台水泵 - 左侧
        const pump1 = new RecycleWaterPump({
            name: '回收水泵#1',
            position: { x: -54, y: 0.5, z: 58 }, // 水箱前方左侧，稍微抬高
            rotation: { x: 0, y: Math.PI, z: 0 }, // 旋转180度，出水口朝向水箱
            scale: 1.0
        });
        scene.add(pump1.group);
        console.log('回收水泵#1添加到场景成功');
        console.log('水泵#1信息:', pump1.getModelInfo());
        
        // 第二台水泵 - 右侧
        const pump2 = new RecycleWaterPump({
            name: '回收水泵#2',
            position: { x: -46, y: 0.5, z: 58 }, // 水箱前方右侧，稍微抬高
            rotation: { x: 0, y: Math.PI, z: 0 }, // 旋转180度，出水口朝向水箱
            scale: 1.0
        });
        scene.add(pump2.group);
        console.log('回收水泵#2添加到场景成功');
        console.log('水泵#2信息:', pump2.getModelInfo());
        
    } catch (error) {
        console.error('回收水泵创建失败:', error);
    }
    
    updateProgress(79, '创建滤液水泵...');
    
    // 创建两个滤液水泵 - 位于滤液水箱正前方
    try {
        // 滤液水箱位于 x: -30, z: 70
        // 水泵放置在水箱正前方 (朝向正Z方向)
        
        // 第一台滤液水泵 - 左侧
        const filterPump1 = new FilterLiquidPump({
            name: '滤液水泵#1',
            position: { x: -33, y: 0.5, z: 58 }, // 水箱前方左侧，稍微抬高
            rotation: { x: 0, y: Math.PI, z: 0 }, // 旋转180度，出水口朝向水箱
            scale: 1.0
        });
        scene.add(filterPump1.group);
        console.log('滤液水泵#1添加到场景成功');
        console.log('滤液水泵#1信息:', filterPump1.getModelInfo());
        
        // 第二台滤液水泵 - 右侧
        const filterPump2 = new FilterLiquidPump({
            name: '滤液水泵#2',
            position: { x: -27, y: 0.5, z: 58 }, // 水箱前方右侧，稍微抬高
            rotation: { x: 0, y: Math.PI, z: 0 }, // 旋转180度，出水口朝向水箱
            scale: 1.0
        });
        scene.add(filterPump2.group);
        console.log('滤液水泵#2添加到场景成功');
        console.log('滤液水泵#2信息:', filterPump2.getModelInfo());
        
    } catch (error) {
        console.error('滤液水泵创建失败:', error);
    }
    
    updateProgress(81, '创建管道连接...');
    
    // 创建回收水泵到一级塔的管道连接 (仅连接一台水泵)
    try {
        // 回收水泵位置：大约 (-50, 0.5, 58)
        // 一级塔位置：(0, 0, 0)，一级塔中部高度约 15米
        
        // 仅第一台回收水泵连接到一级塔
        const pumpToTowerConnection = new PipeConnection({
            name: '回收水泵#1→一级塔连接管道',
            startPoint: { x: -56.7, y: 1.0, z: 58 }, // 回收水泵#1出水口（弯头位置，180度旋转后）
            endPoint: { x: -8, y: 15, z: 0 },       // 一级塔中部进水口
            pipeRadius: 0.15,
            pipeColor: 0x4A90E2, // 蓝色，表示回收水
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(pumpToTowerConnection.group);
        console.log('回收水泵#1→一级塔管道连接添加到场景成功');
        console.log('管道连接信息:', pumpToTowerConnection.getModelInfo());
        
        // 创建回收水泵#2到制浆设备中部的管道连接
        createRecyclePumpToSlurryTankConnection();
        
    } catch (error) {
        console.error('管道连接创建失败:', error);
    }
    
    updateProgress(82, '创建磁悬浮风机...');
    
    // 创建磁悬浮风机，位于一级塔底部旁边
    try {
        const magneticBlower = new MagneticBlower({
            name: '磁悬浮风机',
            position: { x: 15, y: 0, z: -5 }, // 位于一级塔外部右侧，距离塔体更远
            rotation: { x: 0, y: Math.PI, z: 0 }, // 出风口朝向塔体
            scale: 1.0,
            casingWidth: 3.5,
            casingHeight: 2.8,
            casingDepth: 2.2,
            inletDiameter: 1.8,
            outletWidth: 1.2,
            outletHeight: 0.8
        });
        scene.add(magneticBlower.group);
        console.log('磁悬浮风机添加到场景成功');
        console.log('磁悬浮风机信息:', magneticBlower.getModelInfo());
        
        // 创建从磁悬浮风机到一级塔底部的送风管道
        const blowerToTowerConnection = new PipeConnection({
            name: '磁悬浮风机→一级塔送风管道',
            startPoint: { x: 12.5, y: 1.7, z: -5 }, // 风机出风口位置（考虑180度旋转）
            endPoint: { x: 8, y: 3, z: -2 }, // 一级塔外壁底部进风口
            pipeRadius: 0.25,
            pipeColor: 0xFF6B35, // 橙色，表示送风
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(blowerToTowerConnection.group);
        console.log('磁悬浮风机→一级塔送风管道连接成功');
        
    } catch (error) {
        console.error('磁悬浮风机创建失败:', error);
    }
    
    updateProgress(83, '创建浆液循环泵房...');
    
    // 创建浆液循环泵房，位于一级塔左侧
    try {
        const pumpHouse = new PumpHouse({
            name: '一级塔泵房',
            position: { x: -25, y: 0, z: -10 }, // 位于一级塔左侧
            rotation: { x: 0, y: 0, z: 0 },
            scale: 1.0,
            buildingWidth: 16,
            buildingHeight: 8,
            buildingDepth: 12,
            circulationPumpCount: 3,
            drainagePumpCount: 2
        });
        scene.add(pumpHouse.group);
        console.log('浆液循环泵房添加到场景成功');
        console.log('泵房信息:', pumpHouse.getModelInfo());
        
        // 存储泵房引用以便后续交互
        window.pumpHouse = pumpHouse;
        
        // 创建泵房外部管道连接
        createPumpHousePipes(pumpHouse);
        
        // 在一级塔泵房后方27个单位处创建事故水箱（原15，后移12）
        try {
            const emergencyWaterTank = new EmergencyWaterTank({
                name: '事故水箱',
                position: { 
                    x: pumpHouse.config.position.x, // 与泵房相同的X坐标：-25
                    y: 0, 
                    z: pumpHouse.config.position.z - 27 // 泵房后方27个单位：-10 - 27 = -37
                },
                rotation: { x: 0, y: 0, z: 0 },
                scale: 1.0,
                tankDiameter: 12.0,  // 根据实物图估算的直径
                tankHeight: 8.0,     // 根据实物图估算的高度
                baseHeight: 0.5,
                platformHeight: 1.2,
                stairWidth: 1.0
            });
            scene.add(emergencyWaterTank.getGroup());
            console.log('事故水箱添加到场景成功');
            console.log('事故水箱位置:', emergencyWaterTank.config.position);
            console.log('事故水箱信息:', emergencyWaterTank.getModelInfo());
            
            // 存储事故水箱引用以便后续交互
            window.emergencyWaterTank = emergencyWaterTank;
            
            // 为事故水箱添加标签
            const tankGroup = emergencyWaterTank.getGroup();
            const labelPosition = {
                x: 0,
                y: emergencyWaterTank.config.tankHeight + emergencyWaterTank.config.baseHeight + 2,
                z: 0
            };
            createIndustrialBuildingLabel(tankGroup, '事故水箱', labelPosition, '#FF6B35');
            
            // 放置“事故水泵”（精细化模型类）到事故水箱后方 10 个单位，并连接入水管
            try {
                const tankPos = emergencyWaterTank.config.position; // {x, y, z}
                const pumpPos = { x: tankPos.x, y: 0, z: tankPos.z - 10 };

                const emergencyPump = new EmergencyWaterPump({
                    name: '事故水泵',
                    position: pumpPos,
                    rotation: { x: 0, y: Math.PI / 2, z: 0 },
                    scale: 1.0
                });
                scene.add(emergencyPump.getGroup());
                window.emergencyWaterPump = emergencyPump;

                // 标签（参考浆液循环泵标签风格）
                const labelCanvas = document.createElement('canvas');
                const ctx = labelCanvas.getContext('2d');
                labelCanvas.width = 320; labelCanvas.height = 100;
                ctx.font = 'Bold 36px Microsoft YaHei, Arial';
                ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
                ctx.fillStyle = 'rgba(0,0,0,0.8)';
                ctx.fillRect(10,10,labelCanvas.width-20,labelCanvas.height-20);
                ctx.strokeStyle = '#50E3C2';
                ctx.lineWidth = 3; ctx.strokeRect(10,10,labelCanvas.width-20,labelCanvas.height-20);
                ctx.fillStyle = '#50E3C2';
                ctx.fillText('事故水泵', labelCanvas.width/2, labelCanvas.height/2);
                const tex = new THREE.CanvasTexture(labelCanvas); tex.needsUpdate = true;
                const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95 });
                const labelSprite = new THREE.Sprite(mat);
                labelSprite.scale.set(15,4,1);
                const labelY = (emergencyPump.config?.baseHeight || 0.3) + (emergencyPump.config?.pumpBodyHeight || 1.2) + 1.0;
                labelSprite.position.set(0, labelY,5);
                emergencyPump.getGroup().add(labelSprite);

                // 连接事故水箱底部 → 事故水泵入水口
                const inletWorld = emergencyPump.getConnectionPoints().inlet;
                const startPoint = {
                    x: tankPos.x,
                    y: emergencyWaterTank.config.baseHeight + 0.1,
                    z: tankPos.z
                };
                const endPoint = { x: inletWorld.x, y: inletWorld.y, z: inletWorld.z };
                const inletPipe = new PipeConnection({
                    name: '事故水箱→事故水泵（入水）',
                    startPoint,
                    endPoint,
                    pipeRadius: 0.18,
                    pipeColor: 0x2E86C1,
                    showFlow: true,
                    flowDirection: 'forward'
                });
                scene.add(inletPipe.group);
                window.emergencyPumpInletPipe = inletPipe;
            } catch (e) {
                console.warn('事故水泵创建或连接失败（可忽略）:', e);
            }
            // 已移除：位于事故水箱后方7个单位（z: -44）的事故水泵，仅保留 z: -37 的一台

            // 将一级塔泵房内部的排浆泵1、排浆泵2连接到事故水箱底部
            try {
                const pumpHouseRef = window.pumpHouse;
                if (!pumpHouseRef || typeof pumpHouseRef.getPumpConnectionPoints !== 'function') {
                    console.warn('未找到泵房或其连接点信息，跳过 排浆泵→事故水箱 连管');
                } else {
                    const pumpConnections = pumpHouseRef.getPumpConnectionPoints();
                    const pumpHousePos = pumpHouseRef.config.position;
                    const drainage = pumpConnections?.drainage || [];
                    if (drainage.length >= 2) {
                        const tankPos = emergencyWaterTank.config.position;
                        const tankBottom = {
                            x: tankPos.x,
                            y: emergencyWaterTank.config.baseHeight + 0.1,
                            z: tankPos.z
                        };

                        const outletWorld1 = {
                            x: pumpHousePos.x + drainage[0].outletPosition.x,
                            y: drainage[0].outletPosition.y,
                            z: pumpHousePos.z + drainage[0].outletPosition.z
                        };
                        const outletWorld2 = {
                            x: pumpHousePos.x + drainage[1].outletPosition.x,
                            y: drainage[1].outletPosition.y,
                            z: pumpHousePos.z + drainage[1].outletPosition.z
                        };

                        const d1ToTank = new PipeConnection({
                            name: '排浆泵1→事故水箱底部',
                            startPoint: outletWorld1,
                            endPoint: tankBottom,
                            pipeRadius: 0.18,
                            pipeColor: 0x8B5CF6, // 深紫，沿用浆液配色
                            showFlow: true,
                            flowDirection: 'forward'
                        });
                        scene.add(d1ToTank.group);

                        const d2ToTank = new PipeConnection({
                            name: '排浆泵2→事故水箱底部',
                            startPoint: outletWorld2,
                            endPoint: tankBottom,
                            pipeRadius: 0.18,
                            pipeColor: 0x8B5CF6,
                            showFlow: true,
                            flowDirection: 'forward'
                        });
                        scene.add(d2ToTank.group);
                    } else {
                        console.warn('泵房排浆泵数量不足2台，跳过 排浆泵→事故水箱 连管');
                    }
                }
            } catch (e) {
                console.warn('创建 排浆泵→事故水箱 底部连管失败（可忽略）:', e);
            }

            // 将事故水泵出水口分两路连接到一级、二级脱硫塔底部
            try {
                if (window.emergencyWaterPump && typeof window.emergencyWaterPump.getConnectionPoints === 'function' &&
                    typeof dualTowerSystem !== 'undefined' && dualTowerSystem && dualTowerSystem.primaryTower && dualTowerSystem.secondaryTower) {
                    const outlet = window.emergencyWaterPump.getConnectionPoints().outlet;
                    const pGroup = dualTowerSystem.primaryTower.group;
                    const sGroup = dualTowerSystem.secondaryTower.group;

                    const primaryBottom = {
                        x: pGroup.position.x - 8,
                        y: 2,
                        z: pGroup.position.z - 5
                    };
                    const secondaryBottom = {
                        x: sGroup.position.x + 7,
                        y: 2,
                        z: sGroup.position.z - 8
                    };

                    const pumpToPrimary = new PipeConnection({
                        name: '事故水泵→一级脱硫塔底部(出水)',
                        startPoint: { x: outlet.x, y: outlet.y, z: outlet.z },
                        endPoint: primaryBottom,
                        pipeRadius: 0.18,
                        pipeColor: 0x2E86C1,
                        showFlow: true,
                        flowDirection: 'forward'
                    });
                    scene.add(pumpToPrimary.group);

                    const pumpToSecondary = new PipeConnection({
                        name: '事故水泵→二级脱硫塔底部(出水)',
                        startPoint: { x: outlet.x, y: outlet.y, z: outlet.z },
                        endPoint: secondaryBottom,
                        pipeRadius: 0.18,
                        pipeColor: 0x2E86C1,
                        showFlow: true,
                        flowDirection: 'forward'
                    });
                    scene.add(pumpToSecondary.group);
                } else {
                    console.warn('未找到事故水泵或双塔系统，跳过 事故水泵→塔底部 连管');
                }
            } catch (e) {
                console.warn('创建 事故水泵→一级/二级塔底部 连管失败（可忽略）:', e);
            }
            
        } catch (error) {
            console.error('事故水箱创建失败:', error);
        }



        // 在一级脱硫塔后方80个单位处创建电袋除尘器
        try {
            if (typeof window !== 'undefined' && window.ElectrostaticBagFilter && dualTowerSystem?.primaryTower) {
                const ptPos = dualTowerSystem.primaryTower.group.position;
                const ebf = new ElectrostaticBagFilter({
                    name: '电袋除尘器',
                    position: { x: ptPos.x, y: 0, z: ptPos.z -  80},
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: 1.0,
                    numChambers: 4
                });
                scene.add(ebf.getGroup());
                window.electrostaticBagFilter = ebf;
                console.log('电袋除尘器已创建并放置在一级塔后方80个单位处');

                // 在二级脱硫塔右侧35个单位处添加烟囱模型（按图片风格：红白相间+圆头）并添加冒烟特效
                try {
                    const sec = dualTowerSystem?.secondaryTower?.group;
                    if (sec && THREE) {
                        const base = sec.position.clone();
                        const stackGroup = new THREE.Group();
                        stackGroup.name = 'CustomChimney';

                        // 尺寸（1:1 近似）：总高 42m，直径 3.2m（以场景米为单位，按比例缩小为 0.6），并整体放大3倍
                        const scaleRatio = 0.6;
                        const totalH = 42 * scaleRatio;
                        const radius = 3.2 / 2 * scaleRatio;
                        const stackScale = 3.0;

                        // 叠加段：底段+中段+顶段，红白相间
                        const makeSegment = (h, color) => new THREE.Mesh(
                            new THREE.CylinderGeometry(radius, radius, h, 32),
                            new THREE.MeshStandardMaterial({ color, metalness: 0.4, roughness: 0.5 })
                        );

                        const segH = [totalH * 0.1, totalH * 0.28, totalH * 0.28, totalH * 0.24, totalH * 0.1];
                        const colors = [0xB22222, 0xECECEC, 0xB22222, 0xECECEC, 0xB22222];
                        let cursorY = segH[0] / 2;
                        for (let i = 0; i < segH.length; i++) {
                            const seg = makeSegment(segH[i], colors[i]);
                            seg.position.y = cursorY;
                            stackGroup.add(seg);
                            cursorY += segH[i] / 2 + (segH[i + 1] ? segH[i + 1] / 2 : 0);
                        }

                        // 圆头（半球）
                        const cap = new THREE.Mesh(
                            new THREE.SphereGeometry(radius, 32, 16, 0, Math.PI * 2, 0, Math.PI / 2),
                            new THREE.MeshStandardMaterial({ color: 0xECECEC, metalness: 0.4, roughness: 0.55 })
                        );
                        cap.position.y = totalH + radius * 0.05;
                        stackGroup.add(cap);

                        // 位置：二级塔右侧 35
                        stackGroup.position.set(base.x + 35, base.y, base.z);
                        // 整体放大3倍
                        stackGroup.scale.setScalar(stackScale);
                        scene.add(stackGroup);
                        window.customChimney = stackGroup;

                        // 冒烟特效（精简粒子）：顶部发射灰白色粒子
                        const smokeGroup = new THREE.Group();
                        smokeGroup.name = 'ChimneySmoke';
                        const smokeMat = new THREE.SpriteMaterial({ color: 0xEEEEEE, transparent: true, opacity: 0.75, depthWrite: false });
                        const sprites = [];
                        const emitPos = new THREE.Vector3(0, (totalH + radius * 0.2) * stackScale, 0);
                        // 将烟雾放置到烟囱世界位置
                        smokeGroup.position.copy(stackGroup.position);
                        const spawn = () => {
                            const s = new THREE.Sprite(smokeMat.clone());
                            const size = THREE.MathUtils.randFloat(0.6, 1.2);
                            s.scale.set(size, size, 1);
                            s.position.copy(emitPos);
                            s.material.opacity = 0.8;
                            s.userData = {
                                life: 0,
                                maxLife: THREE.MathUtils.randFloat(2.5, 4.0),
                                vx: THREE.MathUtils.randFloatSpread(0.4),
                                vz: THREE.MathUtils.randFloatSpread(0.4),
                                vy: THREE.MathUtils.randFloat(0.8, 1.4)
                            };
                            smokeGroup.add(s);
                            sprites.push(s);
                        };
                        // 绑定到全局动画循环
                        const advance = (dt) => {
                            for (let i = sprites.length - 1; i >= 0; i--) {
                                const sp = sprites[i];
                                sp.userData.life += dt;
                                sp.position.x += sp.userData.vx * dt;
                                sp.position.z += sp.userData.vz * dt;
                                sp.position.y += sp.userData.vy * dt;
                                // 随时间变大、变淡
                                const k = 1 + sp.userData.life * 0.25;
                                sp.scale.set(k, k, 1);
                                sp.material.opacity = Math.max(0, 0.8 * (1 - sp.userData.life / sp.userData.maxLife));
                                if (sp.userData.life >= sp.userData.maxLife) {
                                    smokeGroup.remove(sp);
                                    sprites.splice(i, 1);
                                }
                            }
                            // 持续生成
                            if (sprites.length < 60) spawn();
                        };
                        // 将更新函数注入全局渲染循环
                        (function hookSmoke() {
                            const _origAnimate = window.__chimneyAnimateHook || animate;
                            window.__chimneyAnimateHook = function () {
                                const now = performance.now();
                                window.__chimneyPrevTime = window.__chimneyPrevTime || now;
                                const dt = Math.min(0.05, (now - window.__chimneyPrevTime) / 1000);
                                window.__chimneyPrevTime = now;
                                try { advance(dt); } catch (_) {}
                                _origAnimate.apply(this, arguments);
                            };
                        })();
                        scene.add(smokeGroup);
                        console.log('自定义烟囱与冒烟特效已创建');

                        // 二级脱硫塔 → 自定义烟囱：工业风道连接（先水平后下落）
                        try {
                            const secBox = new THREE.Box3().setFromObject(sec);
                            // 从塔顶向下 4 个单位处作为风道矩形端的中心
                            const secTop = new THREE.Vector3((secBox.min.x + secBox.max.x) / 2, secBox.max.y - 4, (secBox.min.z + secBox.max.z) / 2);
                            const chBox = new THREE.Box3().setFromObject(stackGroup);
                            // 水平对准点：与烟囱同X/Z、与塔同Y
                            const chCenterH = new THREE.Vector3((chBox.min.x + chBox.max.x) / 2, secTop.y, (chBox.min.z + chBox.max.z) / 2);
                            const chBottom = new THREE.Vector3((chBox.min.x + chBox.max.x) / 2, chBox.min.y + 1.2, (chBox.min.z + chBox.max.z) / 2);

                            const outletD = radius * 2 * stackScale * 0.98; // 圆端直径接近烟囱净径

                            // 1) 水平段（矩形→圆形过渡）
                            const horizDist = secTop.distanceTo(chCenterH);
                            const duct1 = new RectToRoundDuct({
                                name: '二级塔→烟囱-水平过渡段',
                                rectWidth: 4.2,
                                rectHeight: 3.0,
                                totalLength: Math.max(6, horizDist - 1.5), // 略短避免穿模
                                coneRatio: 0.4,
                                outletDiameter: Math.max(1.6, outletD)
                            });
                            duct1.alignTo(secTop, chCenterH);
                            scene.add(duct1.getGroup());

                            // 水平段出口点（世界坐标）：沿水平方向推进 totalLength
                            const dirH = new THREE.Vector3().subVectors(chCenterH, secTop).normalize();
                            const out1 = new THREE.Vector3(secTop.x + dirH.x * duct1.config.totalLength, secTop.y, secTop.z + dirH.z * duct1.config.totalLength);

                            // 2) 竖直向下落到烟囱底部（圆形大管）
                            const vLen = Math.max(2, out1.y - chBottom.y);
                            const roundR = Math.max(0.8, outletD / 2);
                            const vertGroup = new THREE.Group(); vertGroup.name = 'TowerToChimneyVertical';
                            const vPipe = new THREE.Mesh(new THREE.CylinderGeometry(roundR, roundR, vLen, 28), new THREE.MeshStandardMaterial({ color: 0xD7DBDE, roughness: 0.7, metalness: 0.25 }));
                            vPipe.position.set(out1.x, chBottom.y + vLen / 2, out1.z);
                            vertGroup.add(vPipe);
                            // 加强环
                            const ringCount = Math.max(3, Math.floor(vLen / 2));
                            for (let i = 1; i < ringCount; i++) {
                                const y = chBottom.y + (i / ringCount) * vLen;
                                const ring = new THREE.Mesh(new THREE.TorusGeometry(roundR + 0.06, 0.035, 8, 26), new THREE.MeshStandardMaterial({ color: 0xC6CCD0, roughness: 0.65, metalness: 0.25 }));
                                ring.position.set(out1.x, y, out1.z);
                                ring.rotation.x = Math.PI / 2;
                                vertGroup.add(ring);
                            }
                            // 3) 底部增加一段水平接入烟囱底部（从竖直段底端指向烟囱中心方向，再在靠近烟囱外壁处法兰连接）
                            const vBottom = new THREE.Vector3(out1.x, chBottom.y, out1.z);
                            let toCenter = new THREE.Vector3().subVectors(chBottom, vBottom);
                            let dirBH = new THREE.Vector3(toCenter.x, 0, toCenter.z);
                            let distBH = dirBH.length();
                            const chimneyR = radius * stackScale * 0.98; // 近似烟囱内径的一半
                            // 至少保留1.2m的水平短管；若距离足够，则留出烟囱半径后再接
                            const minStub = 1.2;
                            let horizLen = Math.max(minStub, distBH - chimneyR);
                            if (dirBH.length() < 1e-3) {
                                // 兜底方向：指向烟囱组中心的X/Z方向
                                const chCenter = new THREE.Vector3((chBox.min.x + chBox.max.x) / 2, chBottom.y, (chBox.min.z + chBox.max.z) / 2);
                                dirBH.set(chCenter.x - vBottom.x, 0, chCenter.z - vBottom.z);
                                distBH = dirBH.length();
                                if (distBH < 1e-3) dirBH.set(1, 0, 0);
                            }
                            dirBH.normalize();
                            const hEnd = new THREE.Vector3(
                                vBottom.x + dirBH.x * horizLen,
                                chBottom.y,
                                vBottom.z + dirBH.z * horizLen
                            );
                            // 水平短管
                            const hMid = new THREE.Vector3(
                                (vBottom.x + hEnd.x) / 2,
                                chBottom.y,
                                (vBottom.z + hEnd.z) / 2
                            );
                            const hPipe = new THREE.Mesh(new THREE.CylinderGeometry(roundR, roundR, horizLen, 28), new THREE.MeshStandardMaterial({ color: 0xD7DBDE, roughness: 0.7, metalness: 0.25 }));
                            hPipe.position.copy(hMid);
                            hPipe.lookAt(hMid.x + dirBH.x, hMid.y, hMid.z + dirBH.z);
                            hPipe.rotateX(Math.PI / 2);
                            vertGroup.add(hPipe);
                            // 终端法兰
                            const flange = new THREE.Mesh(new THREE.CylinderGeometry(roundR + 0.12, roundR + 0.12, 0.1, 32), new THREE.MeshStandardMaterial({ color: 0xA3A7AA, roughness: 0.5, metalness: 0.8 }));
                            flange.position.copy(hEnd);
                            flange.lookAt(hEnd.x + dirBH.x, hEnd.y, hEnd.z + dirBH.z);
                            flange.rotateX(Math.PI / 2);
                            vertGroup.add(flange);
                            scene.add(vertGroup);
                            window.towerChimneyDuct_H = duct1; window.towerChimneyDuct_V = vertGroup;
                        } catch (e) { console.warn('创建 二级塔→烟囱 工业风道失败：', e); }
                    }
                } catch (e) { console.warn('创建自定义烟囱失败:', e); }

                // 放置炉内喷钙系统（参考示意图），位于电袋除尘器右后方，避免遮挡
                try {
                    if (window.InFurnaceCalciumInjection) {
                        const base = ebf.getGroup().position;
                        const calcium = new InFurnaceCalciumInjection({
                            name: '炉内喷钙系统',
                            position: { x: base.x -80, y: 0, z: base.z - 35 },
                            scale: 4.0
                        });
                        // 兜底：确保组级整体缩放到6倍
                        if (typeof calcium.setGlobalScale === 'function') {
                            calcium.setGlobalScale(4.0);
                        } else {
                            calcium.getGroup().scale.setScalar(4.0);
                        }
                        scene.add(calcium.getGroup());
                        window.inFurnaceCalcium = calcium;
                        console.log('炉内喷钙系统已创建');

                        // 按工业综合楼标签逻辑为喷钙系统添加标签
                        try {
                            if (typeof createIndustrialBuildingLabel === 'function') {
                                const gCal = calcium.getGroup();
                                const bbox = new THREE.Box3().setFromObject(gCal);
                                const worldPos = new THREE.Vector3();
                                gCal.getWorldPosition(worldPos);
                                const s = gCal.scale?.x || 1.0; // 组级等比缩放
                                const localY = ((bbox.max.y - worldPos.y) / s) + 2.0; // 顶部上方2m
                                const labelSprite = createIndustrialBuildingLabel(gCal, '炉内喷钙系统', { x: 0, y: localY, z: 0 }, '#FFD54F');
                                // 与工业综合楼一致大小：若父组有缩放，则对标签做1/s反向缩放
                                if (labelSprite && s && s !== 1) {
                                    labelSprite.scale.set(labelSprite.scale.x / s, labelSprite.scale.y / s, 1);
                                }
                            }
                        } catch (e) { console.warn('喷钙系统标签创建失败:', e); }
                    } else {
                        console.warn('InFurnaceCalciumInjection 类未加载，跳过喷钙系统创建');
                    }
                } catch (e) { console.warn('喷钙系统创建失败:', e); }

                // 炉内喷钙系统 → 锅炉：创建工业管道连接（参考压缩空气连锅炉的方式，带避障与延迟）
                setTimeout(() => {
                    try {
                        if (window.inFurnaceCalcium && window.boiler && typeof window.boiler.getPortWorldPosition === 'function') {
                            // 起点：从喷钙系统组包围盒顶部后侧作为近似接口
                            const g = window.inFurnaceCalcium.getGroup();
                            const bbox = new THREE.Box3().setFromObject(g);
                            const start = new THREE.Vector3((bbox.min.x + bbox.max.x) / 2, bbox.max.y - 0.5, bbox.min.z + 0.5);

                            // 锅炉入口：优先喷淋头参考，否则尿素主入口
                            const sprayerRef = (typeof window.boiler.getUreaSprayerWorldPosition === 'function')
                                ? window.boiler.getUreaSprayerWorldPosition('label')
                                : null;
                            const boilerMainInlet = sprayerRef || window.boiler.getPortWorldPosition('ureaMainInlet');

                            if (start && boilerMainInlet) {
                                const ebfGroup = window.electrostaticBagFilter?.getGroup?.();
                                const hasEBF = !!ebfGroup && !!THREE;
                                const pathCalc = () => {
                                    const fallback = [
                                        { x: start.x, y: start.y, z: start.z },
                                        { x: start.x, y: start.y + 6, z: start.z },
                                        { x: boilerMainInlet.x - 4, y: start.y + 6, z: start.z },
                                        { x: boilerMainInlet.x - 4, y: start.y + 6, z: boilerMainInlet.z - 10 },
                                        { x: boilerMainInlet.x - 4, y: boilerMainInlet.y + 3, z: boilerMainInlet.z - 10 },
                                        { x: boilerMainInlet.x - 4, y: boilerMainInlet.y + 3, z: boilerMainInlet.z }
                                    ];
                                    if (!hasEBF) return fallback;
                                    try {
                                        const ebfBox = new THREE.Box3().setFromObject(ebfGroup);
                                        const startOnRight = start.x >= (ebfBox.min.x + ebfBox.max.x) / 2;
                                        const margin = 8;
                                        const detourX = startOnRight ? (ebfBox.max.x + margin) : (ebfBox.min.x - margin);
                                        const safeY = Math.max(start.y + 6, ebfBox.max.y + 4, boilerMainInlet.y + 3);
                                        return [
                                            { x: start.x, y: start.y, z: start.z },
                                            { x: start.x, y: safeY, z: start.z },
                                            { x: detourX, y: safeY, z: start.z },
                                            { x: detourX, y: safeY, z: boilerMainInlet.z - 10 },
                                            { x: boilerMainInlet.x - 4, y: safeY, z: boilerMainInlet.z - 10 },
                                            { x: boilerMainInlet.x - 4, y: boilerMainInlet.y + 3, z: boilerMainInlet.z }
                                        ];
                                    } catch (_) { return fallback; }
                                };

                                const path = pathCalc();
                                const pipe = new PipeConnection({
                                    name: '炉内喷钙→锅炉（气送管）',
                                    startPoint: start,
                                    endPoint: { x: boilerMainInlet.x - 4, y: boilerMainInlet.y + 3, z: boilerMainInlet.z },
                                    pipeRadius: 0.22,
                                    pipeColor: 0x708090,
                                    showFlow: true,
                                    flowDirection: 'forward',
                                    customPathPoints: path
                                });
                                scene.add(pipe.group);
                                console.log('炉内喷钙系统已连接至锅炉');
                            } else {
                                console.warn('喷钙系统或锅炉端口不可用，跳过连管');
                            }
                        } else {
                            console.warn('喷钙系统或锅炉未就绪，延迟连管未执行');
                        }
                    } catch (err) {
                        console.warn('炉内喷钙→锅炉 连管失败：', err);
                    }
                }, 2000);

                // 延迟建立 “SCR出口 → 电袋除尘器四个锥形进气口” 的四段工业管道
                (function connectSCRToEBFInlets(maxTries = 12) {
                    let tries = 0;
                    const tryConnect = () => {
                        tries++;
                        try {
                            const scr = window.scrReactor;
                            const ebfInst = window.electrostaticBagFilter;
                            if (!scr || !ebfInst || typeof scr.getPortWorldPosition !== 'function' || typeof ebfInst.getAllConicalInletPortsWorldPosition !== 'function') {
                                if (tries < maxTries) return setTimeout(tryConnect, 800);
                                console.warn('SCR或电袋除尘器未就绪，放弃创建 SCR→电袋进气口 连管');
                                return;
                            }

                            const start = scr.getPortWorldPosition('outlet');
                            const targets = ebfInst.getAllConicalInletPortsWorldPosition();
                            if (!start || !targets || targets.length === 0) {
                                if (tries < maxTries) return setTimeout(tryConnect, 800);
                                console.warn('未获取到有效端点，放弃创建 SCR→电袋进气口 连管');
                                return;
                            }

                            // 计算避障高度：抬到电袋顶部之上
                            let safeY = start.y + 6;
                            try {
                                const ebfGroup = ebfInst.getGroup?.();
                                if (ebfGroup && THREE) {
                                    const ebfBox = new THREE.Box3().setFromObject(ebfGroup);
                                    safeY = Math.max(safeY, ebfBox.max.y + 4);
                                }
                            } catch (_) {}

                            targets.forEach((endPt, idx) => {
                                if (!endPt) return;
                                const path = [
                                    { x: start.x, y: start.y, z: start.z },
                                    { x: start.x, y: safeY, z: start.z },
                                    { x: (start.x + endPt.x) / 2, y: safeY, z: (start.z + endPt.z) / 2 },
                                    { x: endPt.x, y: safeY, z: endPt.z },
                                    { x: endPt.x, y: endPt.y, z: endPt.z }
                                ];
                                const pipe = new PipeConnection({
                                    name: `SCR出口→电袋除尘器进气口#${idx + 1}`,
                                    startPoint: start,
                                    endPoint: endPt,
                                    pipeRadius: 0.6,
                                    pipeColor: 0x9CB4D2,
                                    showFlow: true,
                                    flowDirection: 'forward',
                                    pathStrategy: 'default',
                                    customPathPoints: path
                                });
                                scene.add(pipe.group);
                            });

                            console.log('已创建四段工业管道：SCR出口→电袋除尘器四个锥形进气口');
                        } catch (err) {
                            if (tries < maxTries) return setTimeout(tryConnect, 800);
                            console.warn('创建 SCR→电袋进气口 连管失败：', err);
                        }
                    };
                    setTimeout(tryConnect, 1200);
                })();

                // 在电袋除尘器后方50个单位处创建火电厂锅炉（含三条烟囱）
                try {
                    if (window.PowerPlantBoiler) {
                        const ebfPos = ebf.getGroup().position;
                        const boilerPos = { x: ebfPos.x, y: 0, z: ebfPos.z - 105 };
                        const powerPlantBoiler = new PowerPlantBoiler({ 
                            name: '火电厂锅炉', 
                            position: boilerPos, 
                            rotation: { x: 0, y: 0, z: 0 }, 
                            scale: 1.0 
                        });
                        scene.add(powerPlantBoiler.getGroup());
                        window.boiler = powerPlantBoiler;
                        
                        // 为锅炉添加标签（与工业综合楼标签实现逻辑一致）
                        createIndustrialBuildingLabel(
                            powerPlantBoiler.getGroup(), 
                            '火电厂锅炉', 
                            { x:10, y: powerPlantBoiler.dimensions.supportHeight + powerPlantBoiler.dimensions.mainHeight + 15, z: 0 }, 
                            '#FFD54F'
                        );
                        
                        console.log('火电厂锅炉已创建，包含三条独立烟囱');
                        console.log('锅炉模型信息:', powerPlantBoiler.getModelInfo());
                        
                        // PowerPlantBoiler 已集成烟囱，无需单独创建 BoilerFlue
                        window.boilerFlue = null;

                        // 延迟建立“锅炉三根烟囱→SCR 反应器”的烟气连管（等待 SCR 完成创建）
                        (function connectStacksToSCR(maxTries = 10) {
                            let tries = 0;
                            const tryConnect = () => {
                                tries++;
                                try {
                                    const boiler = window.boiler;
                                    const scr = window.scrReactor;
                                    if (!boiler || !scr || typeof boiler.getStackPortWorldPosition !== 'function' || typeof scr.getPortWorldPosition !== 'function') {
                                        if (tries < maxTries) return setTimeout(tryConnect, 1000);
                                        console.warn('锅炉或SCR未就绪，放弃创建烟囱→SCR连管');
                                        return;
                                    }

                                    const end = scr.getPortWorldPosition('inlet');
                                    if (!end) {
                                        if (tries < maxTries) return setTimeout(tryConnect, 1000);
                                        console.warn('SCR端口坐标不可用，放弃创建烟囱→SCR连管');
                                        return;
                                    }

                                    // 计算避障路径：抬高到电袋除尘器上方并沿侧面绕行
                                    const ebfGroup = window.electrostaticBagFilter?.getGroup?.();
                                    const hasEBF = !!ebfGroup && !!THREE;
                                    // 改为“直接延申烟囱几何体到 SCR”而不是工业管道
                                    if (hasEBF) {
                                        // 选取避障后的目标点（沿电袋外侧），保证三根延申段不穿模
                                        const ebfBox = new THREE.Box3().setFromObject(ebfGroup);
                                        const centerX = (ebfBox.min.x + ebfBox.max.x) / 2;
                                        const marginBase = 8;
                                        const safeY = Math.max(end.y, ebfBox.max.y + 4) + 2;
                                        const detourX = end.x >= centerX ? (ebfBox.max.x + marginBase) : (ebfBox.min.x - marginBase);
                                        const target = new THREE.Vector3(detourX, safeY, end.z);
                                        // 最后一点回落到 SCR 入口中心，延申段直接画到入口中心
                                        boiler.extendStacksTo(end, { offsetStrategy: (idx) => new THREE.Vector3(0, 0, (idx - 1) * (boiler.dimensions.stackDiameter * 0.45)) });
                                    } else {
                                        boiler.extendStacksTo(end, { offsetStrategy: 'parallel' });
                                    }

                                    console.log('三根烟囱几何已直接延申至SCR入口');
                                } catch (err) {
                                    if (tries < maxTries) return setTimeout(tryConnect, 1000);
                                    console.warn('烟囱→SCR连管创建失败:', err);
                                }
                            };
                            setTimeout(tryConnect, 1200);
                        })();
                    }
                } catch (boErr) { console.warn('火电厂锅炉创建失败:', boErr); }

                // 已移除：此处不再创建 SCR，避免与后续实例重复

                // 在塔与电袋除尘器之间放置引风机（ID Fan）
                try {
                    if (window.InducedDraftFan) {
                        const fanPos = new THREE.Vector3(ptPos.x, 0, (ptPos.z + (ptPos.z - 80)) / 2);
                        const idFan = new InducedDraftFan({
                            name: '引风机',
                            position: { x: fanPos.x, y: fanPos.y, z: fanPos.z },
                            rotation: { x: 0, y: Math.PI, z: 0 }, // 旋转180度，让入口朝向电袋除尘器
                            size: { width: 5.2, height: 3.0, depth: 2.6 }
                        });
                        idFan.getGroup().scale.setScalar(2);
                        scene.add(idFan.getGroup());
                        window.idFan = idFan;

                        // 创建 L 形风管：电袋前端中部 → 先下再前 → 引风机入口
                        try {
                            if (window.LShapedDuct && typeof idFan.getInletInfo === 'function') {
                                const ebfGroup = ebf.getGroup();
                                const ebfBox = new THREE.Box3().setFromObject(ebfGroup);
                                const ebfSize = ebfBox.getSize(new THREE.Vector3());
                                const ebfCenter = ebfBox.getCenter(new THREE.Vector3());

                                const fanInletInfo = idFan.getInletInfo();
                                const fanInletCenter = fanInletInfo.center;

                                // 电袋前端中部（保持电袋自身高度，垂直段长度由 LShapedDuct 控制）
                                const filterFrontCenter = new THREE.Vector3(
                                    ebfCenter.x,
                                    ebfCenter.y,
                                    ebfCenter.z + ebfSize.z / 2
                                );

                                const lDuct = new LShapedDuct({
                                    rectWidth: 3.6,
                                    rectHeight: 2.4,
                                    pipeRadius: Math.max(1.2, (fanInletInfo.diameter || 2.4) / 2),
                                    verticalLength: Math.max(2.5, ebfCenter.y - 1.2) // 至少落到约1.2m高度附近
                                });
                                lDuct.alignTo(filterFrontCenter, fanInletCenter);
                                scene.add(lDuct.getGroup());
                                window.lShapedDuct = lDuct;
                            }
                        } catch (lerr) {
                            console.warn('L形风管创建失败:', lerr);
                        }
                    }
                } catch (e) {
                    console.warn('引风机创建失败（可忽略）:', e);
                }

                // 已移除：不再自动创建与引风机相关的连管（电袋→引风机、引风机→塔体）

                // 设置等距相机到前-左-上视角，避免强烈阴影
                try {
                    if (camera && controls) {
                        const box = new THREE.Box3().setFromObject(ebf.getGroup());
                        const size = box.getSize(new THREE.Vector3());
                        const center = box.getCenter(new THREE.Vector3());
                        const maxDim = Math.max(size.x, size.y, size.z);
                        const dist = maxDim * 2.2;
                        camera.position.set(center.x - dist, center.y + dist, center.z + dist);
                        camera.lookAt(center);
                        controls.target.copy(center);
                        controls.update();
                    }
                } catch (_) {}

                // 加载用户上传的锅炉模型（含锅炉/烟道两部分）并放置到电袋后方50m
                try {
                    const ENABLE_BOILER_AND_SCR = false;
                    if (ENABLE_BOILER_AND_SCR && THREE && THREE.GLTFLoader) {
                        const loader = new THREE.GLTFLoader();
                        loader.load('assets/models/boiler.glb', (gltf) => {
                            const ebfPos = ebf.getGroup().position;
                            const root = gltf.scene;
                            root.traverse(o => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });

                            // 如果用户未命名节点，自动按高度阈值拆分：高于中位数的归为烟道
                            const allMeshes = [];
                            root.traverse(o => { if (o.isMesh) allMeshes.push(o); });
                            let boilerObj = root.clone();
                            let flueObj = null;
                            if (allMeshes.length > 0) {
                                const ys = allMeshes.map(m => m.getWorldPosition(new THREE.Vector3()).y);
                                const sorted = ys.slice().sort((a,b)=>a-b);
                                const midY = sorted[Math.floor(sorted.length*0.65)]; // 偏高阈值
                                const flueGroup = new THREE.Group(); flueGroup.name='FlueAuto';
                                const boilerGroupTmp = new THREE.Group(); boilerGroupTmp.name='BoilerAuto';
                                root.traverse(o => {
                                    if (o.isMesh) {
                                        const wy = o.getWorldPosition(new THREE.Vector3()).y;
                                        (wy > midY ? flueGroup : boilerGroupTmp).add(o.clone());
                                    }
                                });
                                boilerObj = boilerGroupTmp;
                                flueObj = flueGroup;
                            }

                            // 锅炉组
                            const boilerGroup = new THREE.Group(); boilerGroup.name = 'BoilerGroup';
                            boilerGroup.add(boilerObj);
                            // 放大至当前的两倍
                            boilerGroup.scale.setScalar(60);
                            // 在当前基础上后移10个单位（-Z 方向）
                            boilerGroup.position.set(ebfPos.x, 20, ebfPos.z - 80);
                            scene.add(boilerGroup);

                            // 烟道组（若自动未分出，则尝试按包围盒置顶）
                            let flueGroup = null;
                            if (flueObj) {
                                flueGroup = new THREE.Group(); flueGroup.name = 'BoilerFlueGroup';
                                flueGroup.add(flueObj);
                                // 放大10倍
                                flueGroup.scale.setScalar(30);
                                const bbox = new THREE.Box3().setFromObject(boilerGroup);
                                flueGroup.position.set(boilerGroup.position.x, bbox.max.y + 10.0, boilerGroup.position.z);
                                scene.add(flueGroup);
                            }

                            // 简单内部显示控制
                            const setOpacity = (g, a) => g?.traverse(o => {
                                if (o.material && 'opacity' in o.material) { o.material.transparent = a < 1; o.material.opacity = a; }
                            });
                            window.boiler = { getGroup: () => boilerGroup, isInteriorView: false,
                                showInterior(){ this.isInteriorView = true; setOpacity(boilerGroup, 0.35); },
                                showExterior(){ this.isInteriorView = false; setOpacity(boilerGroup, 1.0); }
                            };
                            // GLTF烟道组 - 不再赋值给window.boilerFlue，已由PowerPlantBoiler集成处理
                            if (flueGroup) {
                                console.log('GLTF烟道组已创建，但不覆盖PowerPlantBoiler集成烟囱');
                            }

                            // 已移除：SCR 反应器实例化（根据需求不再创建）

                            console.log('boiler.glb 已加载并放置');
                        }, undefined, (err)=>{
                            console.warn('boiler.glb 加载失败:', err);
                        });
                    }
                } catch (eLoad) { console.warn('加载锅炉模型失败:', eLoad); }
            }
        } catch (e) {
            console.warn('电袋除尘器创建失败（可忽略）:', e);
        }
        
        // 创建 SCR 反应器：相对电袋除尘器左侧偏移（使用全局对象，避免作用域问题）
        try {
            if (typeof SCRReactor !== 'undefined' && window.electrostaticBagFilter && typeof window.electrostaticBagFilter.getGroup === 'function') {
                const ref = window.electrostaticBagFilter.getGroup().position;
                const scr = new SCRReactor({
                    name: 'SCR 反应器',
                    L: 8, W: 5, H: 6,
                    layerCount: 3, layerThickness: 1.0,
                    blocksX: 6, blocksY: 6,
                    showAIG: true, aigRows: 4, aigCols: 6,
                    sizeMultiplier: 6,
                    position: { x: ref.x - 20, y: -26, z: ref.z-45 }
                });
                scene.add(scr.getGroup());
                window.scrReactor = scr;
                console.log('SCR 反应器已创建并放置在电袋除尘器左侧 40m');

                // 为大的 SCR 添加标签（放置在其顶部上方）
                try {
                    const g = scr.getGroup();
                    const bbox = new THREE.Box3().setFromObject(g);
                    // 将包围盒最高点转换为本地相对高度：取世界max.y与组中心y差值
                    const groupWorldPos = g.getWorldPosition(new THREE.Vector3());
                    const aboveTopLocalY = Math.max(2.0, (bbox.max.y - groupWorldPos.y) + 2.5);
                    createIndustrialBuildingLabel(g, 'SCR脱硝反应器', { x: 0, y: aboveTopLocalY, z: 0 }, '#90CAF9');
                } catch (e) { console.warn('SCR(大)标签创建失败:', e); }
            }
        } catch (eScrCreate) { console.warn('SCR 反应器创建失败:', eScrCreate); }
        
    } catch (error) {
        console.error('浆液循环泵房创建失败:', error);
    }
    
    updateProgress(85, '创建空气悬浮风机...');
    
    // 创建空气悬浮风机，位于二级塔底部旁边
    try {
        const airSuspensionBlower = new AirSuspensionBlower({
            name: '空气悬浮风机',
            position: { x: 20, y: 0, z: -12 }, // 位于二级塔外部左侧，与原位置对称
            rotation: { x: 0, y: 0, z: 0 }, // 出风口朝向塔体
            scale: 1.0,
            casingWidth: 4.2,
            casingHeight: 3.2,
            casingDepth: 2.8,
            inletDiameter: 1.6,
            outletWidth: 1.5,
            outletHeight: 1.0
        });
        scene.add(airSuspensionBlower.group);
        console.log('空气悬浮风机添加到场景成功');
        console.log('空气悬浮风机信息:', airSuspensionBlower.getModelInfo());
        
        // 创建从空气悬浮风机到二级塔底部的送风管道
        const airBlowerToTowerConnection = new PipeConnection({
            name: '空气悬浮风机→二级塔送风管道',
            startPoint: { x: 23, y: 1.9, z: -12 }, // 风机出风口位置（朝向塔体）
            endPoint: { x: 27, y: 4, z: -2 }, // 二级塔左侧外壁底部进风口
            pipeRadius: 0.3,
            pipeColor: 0x3498DB, // 蓝色，表示空气悬浮风机送风
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(airBlowerToTowerConnection.group);
        console.log('空气悬浮风机→二级塔送风管道连接成功');
        
    } catch (error) {
        console.error('空气悬浮风机创建失败:', error);
    }
    
    updateProgress(86, '创建二级塔泵房...');
    
    // 创建二级塔泵房，位于二级塔右侧，与一级塔泵房对称
    try {
        const secondaryPumpHouse = new PumpHouse({
            name: '二级塔泵房',
            position: { x: 60, y: 0, z: -18 }, // 位于二级塔右侧，向后移动与空气悬浮风机错开
            rotation: { x: 0, y: 0, z: 0 },
            scale: 1.0,
            buildingWidth: 16,
            buildingHeight: 8,
            buildingDepth: 12,
            circulationPumpCount: 3,
            drainagePumpCount: 0  // 二级塔泵房没有排浆泵
        });
        scene.add(secondaryPumpHouse.group);
        console.log('二级塔泵房添加到场景成功');
        console.log('二级塔泵房信息:', secondaryPumpHouse.getModelInfo());
        
        // 存储二级塔泵房引用以便后续交互
        window.secondaryPumpHouse = secondaryPumpHouse;
        
        // 创建二级塔泵房外部管道连接
        createSecondaryPumpHousePipes(secondaryPumpHouse);
        
    } catch (error) {
        console.error('二级塔泵房创建失败:', error);
    }
    
    updateProgress(87, '创建石膏排出泵...');
    
    // 创建一体化石膏输送系统，位于两塔之间
    try {
        const gypsumSystem = new IntegratedGypsumSystem({
            name: '石膏输送系统',
            position: { x: 20, y: 0, z: 8 }, // 位于两塔之间，避开现有设备
            pumpLength: 4.0,
            pumpWidth: 2.0,
            pumpHeight: 1.5
        });
        scene.add(gypsumSystem.group);
        console.log('一体化石膏输送系统添加到场景成功');
        console.log('石膏输送系统信息:', gypsumSystem.getModelInfo());
        
        // 存储石膏输送系统引用
        window.gypsumSystem = gypsumSystem;
        
    } catch (error) {
        console.error('一体化石膏输送系统创建失败:', error);
    }
    
    updateProgress(88, '创建制浆箱...');
    
    // 创建制浆箱 - 位于滤液水箱和回收水箱右边45度方向，距离6个单位
    try {
        // 计算制浆箱位置：两个水箱的中心点向右45度6个单位
        const tankCenterX = (-50 + -30) / 2; // 两个水箱X坐标中心点：-40
        const tankCenterZ = 70; // 两个水箱Z坐标
        
        // 45度方向单位向量：(cos(45°), sin(45°)) = (√2/2, √2/2)
        const angle45 = Math.PI / 4;
        const distance = 6;
        
        const slurryTankX = tankCenterX + Math.cos(angle45) * distance + 50; // 向X轴正方向移动50个单位（原25+新25）
        const slurryTankZ = tankCenterZ + Math.sin(angle45) * distance;
        
        const slurryTank = new SlurryTank(
            { x: slurryTankX, y: 0, z: slurryTankZ },
            { x: 0, y: 0, z: 0 }
        );
        scene.add(slurryTank.getGroup());
        console.log('制浆箱添加到场景成功');
        console.log('制浆箱位置:', { x: slurryTankX, y: 0, z: slurryTankZ });
        
        // 存储制浆箱引用
        window.slurryTank = slurryTank;

        // 仅创建除盐水箱（不再创建水泵房建筑）
        updateProgress(84, '创建除盐水箱...');
        try {
            const stGroup = slurryTank.getGroup();
            const stPos = stGroup.position.clone();
            const tank = new DemineralizedWaterTank({
                name: '除盐水箱',
                position: { x: stPos.x + 50, y: 0, z: stPos.z - 4 },
                height: 20,
                diameter: 10,
            });
            scene.add(tank.getGroup());
            window.demineralizedWaterTank = tank;
            console.log('除盐水箱添加到场景成功');
            
            // 延迟连接稀释水泵到锅炉（模仿尿素循环泵的连接逻辑）
            setTimeout(() => {
                if (window.boiler && window.demineralizedWaterTank && typeof window.boiler.getPortWorldPosition === 'function') {
                    try {
                        // 获取稀释水泵的出水口位置（pumpC和pumpD是稀释水泵1和2）
                        const pump1Outlet = window.demineralizedWaterTank.getPumpPortWorldPosition('pumpC', 'outlet');
                        const pump2Outlet = window.demineralizedWaterTank.getPumpPortWorldPosition('pumpD', 'outlet');
                        
                        // 获取锅炉的尿素主入口（稀释水泵也连接到同一个喷淋系统）
                        const sprayerRef = (typeof window.boiler.getUreaSprayerWorldPosition === 'function')
                            ? window.boiler.getUreaSprayerWorldPosition('label')
                            : null;
                        const boilerMainInlet = sprayerRef || window.boiler.getPortWorldPosition('ureaMainInlet');
                        
                        if (pump1Outlet && pump2Outlet && boilerMainInlet) {
                            // 创建汇合点 - 两个稀释水泵管道在此汇合后进入锅炉
                            const mergePointY = Math.max(pump1Outlet.y, pump2Outlet.y) + 8; // 比尿素泵高一点避免冲突
                            const mergePointX = (pump1Outlet.x + pump2Outlet.x) / 2; // 两泵中间位置
                            const mergePointZ = pump1Outlet.z;
                            const mergePoint = { x: mergePointX, y: mergePointY, z: mergePointZ };
                            
                            // 稀释水泵1到汇合点
                            const path1ToMerge = [
                                { x: pump1Outlet.x, y: pump1Outlet.y, z: pump1Outlet.z },
                                { x: pump1Outlet.x, y: mergePointY, z: pump1Outlet.z }, // 向上到汇合高度
                                { x: mergePointX, y: mergePointY, z: mergePointZ } // 水平到汇合点
                            ];
                            const pipe1ToMerge = new PipeConnection({
                                name: '稀释水泵1→汇合点',
                                startPoint: pump1Outlet,
                                endPoint: mergePoint,
                                pipeRadius: 0.15,
                                pipeColor: 0x10B981, // 绿色，区别于蓝色尿素管道
                                showFlow: true,
                                flowDirection: 'forward',
                                pathStrategy: 'default',
                                customPathPoints: path1ToMerge
                            });
                            
                            // 创建稀释水管道组（如果不存在）
                            if (!window.boiler.dilutionWaterPipeGroup) {
                                window.boiler.dilutionWaterPipeGroup = new THREE.Group();
                                window.boiler.dilutionWaterPipeGroup.name = 'dilutionWaterPipeGroup';
                                scene.add(window.boiler.dilutionWaterPipeGroup);
                            }
                            window.boiler.dilutionWaterPipeGroup.add(pipe1ToMerge.group);
                            
                            // 稀释水泵2到汇合点
                            const path2ToMerge = [
                                { x: pump2Outlet.x, y: pump2Outlet.y, z: pump2Outlet.z },
                                { x: pump2Outlet.x, y: mergePointY, z: pump2Outlet.z }, // 向上到汇合高度
                                { x: mergePointX, y: mergePointY, z: mergePointZ } // 水平到汇合点
                            ];
                            const pipe2ToMerge = new PipeConnection({
                                name: '稀释水泵2→汇合点',
                                startPoint: pump2Outlet,
                                endPoint: mergePoint,
                                pipeRadius: 0.15,
                                pipeColor: 0x10B981, // 绿色
                                showFlow: true,
                                flowDirection: 'forward',
                                pathStrategy: 'default',
                                customPathPoints: path2ToMerge
                            });
                            window.boiler.dilutionWaterPipeGroup.add(pipe2ToMerge.group);
                            
                            // 从汇合点到锅炉主入口（连接到内部喷淋头系统）
                            const pathMergeToBoiler = [
                                { x: mergePointX, y: mergePointY, z: mergePointZ },
                                { x: mergePointX, y: mergePointY, z: boilerMainInlet.z - 10 }, // 向前移动到锅炉附近，比尿素管道稍远
                                { x: boilerMainInlet.x + 2, y: mergePointY, z: boilerMainInlet.z - 10 }, // 水平对准锅炉入口，稍微偏移避免与尿素管道重叠
                                { x: boilerMainInlet.x + 2, y: boilerMainInlet.y + 2, z: boilerMainInlet.z - 10 }, // 下降到入口高度附近
                                { x: boilerMainInlet.x + 2, y: boilerMainInlet.y + 2, z: boilerMainInlet.z } // 连接到锅炉主入口附近
                            ];
                            const pipeMergeToBoiler = new PipeConnection({
                                name: '稀释水汇合管→锅炉喷淋头系统',
                                startPoint: mergePoint,
                                endPoint: { x: boilerMainInlet.x + 2, y: boilerMainInlet.y + 2, z: boilerMainInlet.z },
                                pipeRadius: 0.18, // 汇合后管径稍大
                                pipeColor: 0x10B981, // 绿色
                                showFlow: true,
                                flowDirection: 'forward',
                                pathStrategy: 'default',
                                customPathPoints: pathMergeToBoiler
                            });
                            window.boiler.dilutionWaterPipeGroup.add(pipeMergeToBoiler.group);
                            
                            console.log('两个稀释水泵已通过汇合管道连接到锅炉内部喷淋头系统');
                        } else {
                            console.warn('稀释水泵或锅炉端口获取失败，无法创建管道连接');
                        }
                    } catch (e) {
                        console.warn('稀释水泵与锅炉连接失败:', e);
                    }
                } else {
                    console.warn('锅炉模型或除盐水箱不可用，无法创建稀释水泵连接');
                }
            }, 1500); // 延迟1.5秒确保所有模型完全初始化
        } catch (e) {
            console.error('除盐水箱创建失败:', e);
        }

        // 在除盐水箱X轴正方向8个单位处添加工艺水箱
        updateProgress(84, '创建工艺水箱...');
        try {
            const dwt = window.demineralizedWaterTank;
            const dwtPos = dwt.getGroup().position.clone();
            const pwt = new ProcessWaterTank({
                name: '工艺水箱',
                position: { x: dwtPos.x + 23, y: dwtPos.y, z: dwtPos.z },
                height: 20,
                diameter: 10,
            });
            scene.add(pwt.getGroup());
            window.processWaterTank = pwt;
            console.log('工艺水箱添加到场景成功');

            // 将两台除雾冲洗水泵出水口连接到一级、二级脱硫塔顶部
            try {
                if (dualTowerSystem && dualTowerSystem.primaryTower && dualTowerSystem.secondaryTower) {
                    // 泵出水口（世界坐标）
                    const mist1Outlet = pwt.getPumpPortWorldPosition('mist1', 'outlet');
                    const mist2Outlet = pwt.getPumpPortWorldPosition('mist2', 'outlet');

                    // 一级、二级塔顶部中心（世界坐标）
                    const primaryGroup = dualTowerSystem.primaryTower.group;
                    const secondaryGroup = dualTowerSystem.secondaryTower.group;
                    const primaryTop = new THREE.Vector3(
                        primaryGroup.position.x,
                        primaryGroup.position.y + (dualTowerSystem.primaryTower.towerConfig?.height || 30) + 1,
                        primaryGroup.position.z
                    );
                    const secondaryTop = new THREE.Vector3(
                        secondaryGroup.position.x,
                        secondaryGroup.position.y + (dualTowerSystem.secondaryTower.towerConfig?.height || 40) + 1,
                        secondaryGroup.position.z
                    );

                    if (mist1Outlet) {
                        // 多段路径：先水平到塔心X，再竖直到塔顶
                        const horiz1 = new THREE.Vector3(primaryTop.x, mist1Outlet.y, mist1Outlet.z);
                        const path1 = [
                            { x: mist1Outlet.x, y: mist1Outlet.y, z: mist1Outlet.z },
                            { x: horiz1.x, y: horiz1.y, z: horiz1.z },
                            { x: primaryTop.x, y: primaryTop.y, z: primaryTop.z }
                        ];
                        const pipe1 = new PipeConnection({
                            name: '除雾冲洗水泵1→一级脱硫塔顶部',
                            startPoint: mist1Outlet,
                            endPoint: primaryTop,
                            pipeRadius: 0.16,
                            pipeColor: 0x8E9BA6,
                            showFlow: true,
                            flowDirection: 'forward',
                            pathStrategy: 'default',
                            customPathPoints: path1
                        });
                        scene.add(pipe1.group);
                    }

                    if (mist2Outlet) {
                        // 多段路径：先水平到塔心X，再竖直到塔顶
                        const horiz2 = new THREE.Vector3(secondaryTop.x, mist2Outlet.y, mist2Outlet.z);
                        const path2 = [
                            { x: mist2Outlet.x, y: mist2Outlet.y, z: mist2Outlet.z },
                            { x: horiz2.x, y: horiz2.y, z: horiz2.z },
                            { x: secondaryTop.x, y: secondaryTop.y, z: secondaryTop.z }
                        ];
                        const pipe2 = new PipeConnection({
                            name: '除雾冲洗水泵2→二级脱硫塔顶部',
                            startPoint: mist2Outlet,
                            endPoint: secondaryTop,
                            pipeRadius: 0.16,
                            pipeColor: 0x8E9BA6,
                            showFlow: true,
                            flowDirection: 'forward',
                            pathStrategy: 'default',
                            customPathPoints: path2
                        });
                        scene.add(pipe2.group);
                    }
                }
            } catch (e) {
                console.warn('除雾冲洗水泵到塔顶连管创建失败（可忽略）:', e);
            }
        } catch (e) {
            console.error('工艺水箱创建失败:', e);
        }

        // 在二级脱硫塔前方20个单位添加两个尿素溶液储罐，并在底部用工艺管道相连
        try {
            if (dualTowerSystem && dualTowerSystem.secondaryTower) {
                const secGroup = dualTowerSystem.secondaryTower.group;
                const baseZFront = secGroup.position.z - 55; // 前方（-Z 方向）
                const baseX = secGroup.position.x;
                const y = 0;

                // 两个储罐左右并排，间距12米
                const leftTank = new UreaSolutionTank({
                    name: '尿素溶液储罐A',
                    position: { x: baseX - 6, y, z: baseZFront },
                    height: 24,
                    diameter: 10,
                });
                const rightTank = new UreaSolutionTank({
                    name: '尿素溶液储罐B',
                    position: { x: baseX + 6, y, z: baseZFront },
                    height: 24,
                    diameter: 10,
                });
                scene.add(leftTank.getGroup());
                scene.add(rightTank.getGroup());
                window.ureaTankA = leftTank;
                window.ureaTankB = rightTank;

                // 底部连管：取两罐底部接口，做水平工业管道连接
                const portA = leftTank.getPortWorldPosition('bottom');
                const portB = rightTank.getPortWorldPosition('bottom');
                if (portA && portB) {
                    const mid = new THREE.Vector3((portA.x + portB.x) / 2, portA.y, (portA.z + portB.z) / 2);
                    const path = [
                        { x: portA.x, y: portA.y, z: portA.z },
                        { x: mid.x, y: mid.y, z: mid.z },
                        { x: portB.x, y: portB.y, z: portB.z }
                    ];
                    const tiePipe = new PipeConnection({
                        name: '尿素溶液储罐底部连管',
                        startPoint: portA,
                        endPoint: portB,
                        pipeRadius: 0.18,
                        pipeColor: 0x7A8690,
                        showFlow: false,
                        pathStrategy: 'default',
                        customPathPoints: path
                    });
                    scene.add(tiePipe.group);
                }

                // 在储罐X轴正方向一侧添加一个“尿素溶液溶解罐”，与储罐相距25个单位
                const dissolveX = (rightTank.getGroup().position.x) + 25; // 右侧储罐的X + 25
                const dissolveZ = baseZFront; // 与储罐同Z
                const dissolveTank = new UreaDissolvingTank({
                    name: '尿素溶液溶解罐',
                    position: { x: dissolveX, y: 0, z: dissolveZ },
                    height: 22,
                    diameter: 9,
                });
                scene.add(dissolveTank.getGroup());
                window.ureaDissolveTank = dissolveTank;

                // 在溶解罐前方10个单位添加两台“尿素溶液输送泵”，彼此相距10
                const transPumpsZ = dissolveZ - 10;
                const transCenterX = dissolveX;
                const transOffsetX = 5; // 相距10
                const transPump1 = new UreaTransferPump({
                    name: '尿素溶液输送泵1',
                    position: { x: transCenterX - transOffsetX, y: 0, z: transPumpsZ },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: 1.0,
                });
                const transPump2 = new UreaTransferPump({
                    name: '尿素溶液输送泵2',
                    position: { x: transCenterX + transOffsetX, y: 0, z: transPumpsZ },
                    rotation: { x: 0, y: 0, z: 0 },
                    scale: 1.0,
                });
                scene.add(transPump1.getGroup());
                scene.add(transPump2.getGroup());
                window.ureaTransferPump1 = transPump1;
                window.ureaTransferPump2 = transPump2;

                // 将两台输送泵的入水口连接到溶解罐底部
                const dissolveBottom = dissolveTank.getPortWorldPosition('bottom');
                const tp1In = transPump1.getPortWorldPosition('inlet');
                const tp2In = transPump2.getPortWorldPosition('inlet');
                if (dissolveBottom && tp1In) {
                    const path1 = [
                        { x: dissolveBottom.x, y: dissolveBottom.y, z: dissolveBottom.z },
                        { x: dissolveBottom.x, y: tp1In.y, z: dissolveBottom.z },
                        { x: tp1In.x, y: tp1In.y, z: tp1In.z },
                    ];
                    const p1 = new PipeConnection({
                        name: '溶解罐→输送泵1(入水)',
                        startPoint: dissolveBottom,
                        endPoint: tp1In,
                        pipeRadius: 0.16,
                        pipeColor: 0x8E9BA6,
                        showFlow: true,
                        flowDirection: 'forward',
                        pathStrategy: 'default',
                        customPathPoints: path1,
                    });
                    scene.add(p1.group);
                }
                if (dissolveBottom && tp2In) {
                    const path2 = [
                        { x: dissolveBottom.x, y: dissolveBottom.y, z: dissolveBottom.z },
                        { x: dissolveBottom.x, y: tp2In.y, z: dissolveBottom.z },
                        { x: tp2In.x, y: tp2In.y, z: tp2In.z },
                    ];
                    const p2 = new PipeConnection({
                        name: '溶解罐→输送泵2(入水)',
                        startPoint: dissolveBottom,
                        endPoint: tp2In,
                        pipeRadius: 0.16,
                        pipeColor: 0x8E9BA6,
                        showFlow: true,
                        flowDirection: 'forward',
                        pathStrategy: 'default',
                        customPathPoints: path2,
                    });
                    scene.add(p2.group);
                }

                // 将两台输送泵的出水口分别连接到两个尿素溶液储罐底部
                const tp1Out = transPump1.getPortWorldPosition('outlet');
                const tp2Out = transPump2.getPortWorldPosition('outlet');
                const tankABottom2 = leftTank.getPortWorldPosition('bottom');
                const tankBBottom2 = rightTank.getPortWorldPosition('bottom');

                if (tp1Out && tankABottom2) {
                    const pathOut1 = [
                        { x: tp1Out.x, y: tp1Out.y, z: tp1Out.z },
                        { x: tankABottom2.x, y: tp1Out.y, z: tp1Out.z },
                        { x: tankABottom2.x, y: tp1Out.y, z: tankABottom2.z },
                        { x: tankABottom2.x, y: tankABottom2.y, z: tankABottom2.z }
                    ];
                    const pipeOut1 = new PipeConnection({
                        name: '输送泵1→储罐A(出水)',
                        startPoint: tp1Out,
                        endPoint: tankABottom2,
                        pipeRadius: 0.16,
                        pipeColor: 0x8E9BA6,
                        showFlow: true,
                        flowDirection: 'forward',
                        pathStrategy: 'default',
                        customPathPoints: pathOut1,
                    });
                    scene.add(pipeOut1.group);
                }

                if (tp2Out && tankBBottom2) {
                    const pathOut2 = [
                        { x: tp2Out.x, y: tp2Out.y, z: tp2Out.z },
                        { x: tankBBottom2.x, y: tp2Out.y, z: tp2Out.z },
                        { x: tankBBottom2.x, y: tp2Out.y, z: tankBBottom2.z },
                        { x: tankBBottom2.x, y: tankBBottom2.y, z: tankBBottom2.z }
                    ];
                    const pipeOut2 = new PipeConnection({
                        name: '输送泵2→储罐B(出水)',
                        startPoint: tp2Out,
                        endPoint: tankBBottom2,
                        pipeRadius: 0.16,
                        pipeColor: 0x8E9BA6,
                        showFlow: true,
                        flowDirection: 'forward',
                        pathStrategy: 'default',
                        customPathPoints: pathOut2,
                    });
                    scene.add(pipeOut2.group);
                }

                // 添加两个尿素溶液循环泵：位于两罐中间、前方约12个单位，彼此相距约10个单位
                const pumpsZ = baseZFront - 12; // 原5 + 前移7 = 12
                const pumpsCenterX = baseX; // 中间
                const pumpOffsetX = 5; // 相距10（左右各5）

                const pump1 = new UreaCirculationPump({
                    name: '尿素溶液循环泵1',
                    position: { x: pumpsCenterX - pumpOffsetX, y: 0, z: pumpsZ },
                    rotation: { x: 0, y: Math.PI / 2, z: 0 },
                    scale: 1.0
                });
                const pump2 = new UreaCirculationPump({
                    name: '尿素溶液循环泵2',
                    position: { x: pumpsCenterX + pumpOffsetX, y: 0, z: pumpsZ },
                    rotation: { x: 0, y: Math.PI / 2, z: 0 },
                    scale: 1.0
                });
                scene.add(pump1.getGroup());
                scene.add(pump2.getGroup());
                window.ureaCirPump1 = pump1;
                window.ureaCirPump2 = pump2;

                // 连接每台泵的入水口到对应储罐底部接口（工业管道）
                const inlet1 = pump1.getPortWorldPosition('inlet');
                const inlet2 = pump2.getPortWorldPosition('inlet');
                const tankABottom = leftTank.getPortWorldPosition('bottom');
                const tankBBottom = rightTank.getPortWorldPosition('bottom');

                if (inlet1 && tankABottom) {
                    const pathA = [
                        { x: tankABottom.x, y: tankABottom.y, z: tankABottom.z },
                        { x: tankABottom.x, y: inlet1.y, z: tankABottom.z }, // 垂直到泵高度
                        { x: inlet1.x, y: inlet1.y, z: inlet1.z } // 水平至泵入口
                    ];
                    const pipeA = new PipeConnection({
                        name: '储罐A→循环泵1(入水)',
                        startPoint: tankABottom,
                        endPoint: inlet1,
                        pipeRadius: 0.16,
                        pipeColor: 0x8E9BA6,
                        showFlow: true,
                        flowDirection: 'forward',
                        pathStrategy: 'default',
                        customPathPoints: pathA
                    });
                    scene.add(pipeA.group);
                }

                if (inlet2 && tankBBottom) {
                    const pathB = [
                        { x: tankBBottom.x, y: tankBBottom.y, z: tankBBottom.z },
                        { x: tankBBottom.x, y: inlet2.y, z: tankBBottom.z },
                        { x: inlet2.x, y: inlet2.y, z: inlet2.z }
                    ];
                    const pipeB = new PipeConnection({
                        name: '储罐B→循环泵2(入水)',
                        startPoint: tankBBottom,
                        endPoint: inlet2,
                        pipeRadius: 0.16,
                        pipeColor: 0x8E9BA6,
                        showFlow: true,
                        flowDirection: 'forward',
                        pathStrategy: 'default',
                        customPathPoints: pathB
                    });
                    scene.add(pipeB.group);
                }
                
                // 连接两个尿素循环泵到锅炉内部喷淋头系统
                setTimeout(() => {
                    if (window.boiler && typeof window.boiler.getPortWorldPosition === 'function') {
                        // 优先使用锅炉内喷淋头标签位置作为对接坐标，以确保确实连到喷淋头系统
                        const sprayerRef = (typeof window.boiler.getUreaSprayerWorldPosition === 'function')
                            ? window.boiler.getUreaSprayerWorldPosition('label')
                            : null;
                        const boilerMainInlet = sprayerRef || window.boiler.getPortWorldPosition('ureaMainInlet');
                        const pump1Outlet = pump1.getPortWorldPosition('outlet');
                        const pump2Outlet = pump2.getPortWorldPosition('outlet');
                        
                        if (pump1Outlet && pump2Outlet && boilerMainInlet) {
                            // 创建汇合点 - 两泵管道在此汇合后进入锅炉
                            const mergePointY = Math.max(pump1Outlet.y, pump2Outlet.y) + 6;
                            const mergePointX = (pump1Outlet.x + pump2Outlet.x) / 2; // 两泵中间位置
                            const mergePointZ = pump1Outlet.z;
                            const mergePoint = { x: mergePointX, y: mergePointY, z: mergePointZ };
                            
                            // 循环泵1到汇合点
                            const path1ToMerge = [
                                { x: pump1Outlet.x, y: pump1Outlet.y, z: pump1Outlet.z },
                                { x: pump1Outlet.x, y: mergePointY, z: pump1Outlet.z }, // 向上到汇合高度
                                { x: mergePointX, y: mergePointY, z: mergePointZ } // 水平到汇合点
                            ];
                        const pipe1ToMerge = new PipeConnection({
                                name: '循环泵1→汇合点',
                                startPoint: pump1Outlet,
                                endPoint: mergePoint,
                                pipeRadius: 0.15,
                                pipeColor: 0x4A90E2, // 蓝色尿素管道
                                showFlow: true,
                                flowDirection: 'forward',
                                pathStrategy: 'default',
                                customPathPoints: path1ToMerge
                            });
                            // 将连管加入锅炉的外部尿素管道分组，便于视角切换时统一隐藏/显示
                            if (!window.boiler.ureaExternalPipeGroup) {
                                window.boiler.ureaExternalPipeGroup = new THREE.Group();
                                window.boiler.ureaExternalPipeGroup.name = 'ureaExternalPipeGroup';
                                scene.add(window.boiler.ureaExternalPipeGroup);
                            }
                            window.boiler.ureaExternalPipeGroup.add(pipe1ToMerge.group);
                            
                            // 循环泵2到汇合点
                            const path2ToMerge = [
                                { x: pump2Outlet.x, y: pump2Outlet.y, z: pump2Outlet.z },
                                { x: pump2Outlet.x, y: mergePointY, z: pump2Outlet.z }, // 向上到汇合高度
                                { x: mergePointX, y: mergePointY, z: mergePointZ } // 水平到汇合点
                            ];
                            const pipe2ToMerge = new PipeConnection({
                                name: '循环泵2→汇合点',
                                startPoint: pump2Outlet,
                                endPoint: mergePoint,
                                pipeRadius: 0.15,
                                pipeColor: 0x4A90E2,
                                showFlow: true,
                                flowDirection: 'forward',
                                pathStrategy: 'default',
                                customPathPoints: path2ToMerge
                            });
                            window.boiler.ureaExternalPipeGroup.add(pipe2ToMerge.group);
                            
                            // 从汇合点到锅炉主入口（连接到内部喷淋头系统）
                            const pathMergeToBoiler = [
                                { x: mergePointX, y: mergePointY, z: mergePointZ },
                                { x: mergePointX, y: mergePointY, z: boilerMainInlet.z - 8 }, // 向前移动到锅炉附近
                                { x: boilerMainInlet.x, y: mergePointY, z: boilerMainInlet.z - 8 }, // 水平对准锅炉入口
                                { x: boilerMainInlet.x, y: boilerMainInlet.y, z: boilerMainInlet.z - 8 }, // 下降到入口高度
                                { x: boilerMainInlet.x, y: boilerMainInlet.y, z: boilerMainInlet.z } // 连接到锅炉主入口
                            ];
                            const pipeMergeToBoiler = new PipeConnection({
                                name: '汇合管→锅炉喷淋头系统',
                                startPoint: mergePoint,
                                endPoint: boilerMainInlet,
                                pipeRadius: 0.2, // 汇合后管径增大
                                pipeColor: 0x4A90E2,
                                showFlow: true,
                                flowDirection: 'forward',
                                pathStrategy: 'default',
                                customPathPoints: pathMergeToBoiler
                            });
                            window.boiler.ureaExternalPipeGroup.add(pipeMergeToBoiler.group);
                            
                            console.log('两个尿素循环泵已通过汇合管道连接到锅炉内部喷淋头系统');
                        }
                    } else {
                        console.warn('锅炉模型或端口方法不可用，无法创建管道连接');
                    }
                }, 1000); // 延迟1秒确保锅炉模型完全初始化
            }
        } catch (e) {
            console.warn('尿素溶液储罐创建或连管失败（可忽略）:', e);
        }
        
        // 创建工业综合楼 - 以一级塔泵房为参照，放在其X轴负方向10个单位
        updateProgress(84, '创建工业综合楼...');
        try {
            // 一级塔泵房位置：{ x: -25, y: 0, z: -10 }
            // 综合楼位置：一级塔泵房X轴负方向10个单位
            const buildingX = -25 - 45; // 一级塔泵房X轴负方向10个单位：-35
            const buildingZ = 15; // 与一级塔泵房相同的Z轴位置
            
            const industrialBuilding = new IndustrialBuilding(
                { x: buildingX, y: 0, z: buildingZ },
                { x: 0, y: 0, z: 0 } // 不旋转，保持正向
            );
            scene.add(industrialBuilding.getGroup());
            
            // 存储综合楼引用
            window.industrialBuilding = industrialBuilding;
            
            // 为综合楼添加标签（参考一级脱硫塔标签实现）
            createIndustrialBuildingLabel(industrialBuilding.getGroup(), '工业综合楼', { x: 0, y: 40, z: 0 }, '#FFD700');
            
            // 预创建工业综合楼内部设施（保持隐藏），以便提前生成石膏旋流器实例
            // 避免在外部视图下window.gypsumCyclone为undefined导致后续连管失败
            try {
                if (industrialBuilding && typeof industrialBuilding.createInteriorFacilities === 'function') {
                    industrialBuilding.createInteriorFacilities();
                    console.log('已预创建工业综合楼内部设施');
                }
                console.log('window.gypsumCyclone 是否存在:', !!window.gypsumCyclone);
            } catch (e) {
                console.warn('预创建内部设施失败（可忽略）:', e);
            }
            
            console.log('工业综合楼创建成功');
            console.log('综合楼位置（以一级塔泵房为参照）:', { x: buildingX, y: 0, z: buildingZ });
            console.log('一级塔泵房位置:', { x: -25, y: 0, z: -10 });
             
         } catch (error) {
             console.error('工业综合楼创建失败:', error);
         }

        // 创建空压机房 - 位于工业综合楼后方25个单位（与此前位置相对）
        updateProgress(84.5, '创建空压机房...');
        try {
            const basePos = window.industrialBuilding ? window.industrialBuilding.getGroup().position : { x: -70, y: 0, z: 15 };
            const roomPos = { x: basePos.x, y: 0, z: basePos.z - 35 };
            const airCompressorRoom = new AirCompressorRoom({
                position: roomPos,
                rotation: { x: 0, y: 0, z: 0 },
                // 调整尺寸：宽度减半，长度（深度）加倍
                size: { width: 22, height: 11, depth: 28 }
            });
            scene.add(airCompressorRoom.getGroup());
            window.airCompressorRoom = airCompressorRoom;
            // 标签
            createIndustrialBuildingLabel(airCompressorRoom.getGroup(), '空压机房', { x: 0, y: 13, z: 0 }, '#87CEFA');
            console.log('空压机房创建成功，位置：', roomPos);
            
            // 延迟连接压缩空气储罐到锅炉（模仿尿素循环泵的连接逻辑）
            setTimeout(() => {
                if (window.boiler && window.airCompressorRoom && typeof window.boiler.getPortWorldPosition === 'function') {
                    try {
                        // 获取压缩空气储罐的出口位置
                        const airTankOutlet = window.airCompressorRoom.getAirTankOutletWorldPosition();
                        
                        // 获取锅炉的尿素主入口（压缩空气也连接到同一个喷淋系统，用于雾化）
                        const sprayerRef = (typeof window.boiler.getUreaSprayerWorldPosition === 'function')
                            ? window.boiler.getUreaSprayerWorldPosition('label')
                            : null;
                        const boilerMainInlet = sprayerRef || window.boiler.getPortWorldPosition('ureaMainInlet');
                        
                        if (airTankOutlet && boilerMainInlet) {
                            // 创建压缩空气管道路径：绕开电袋除尘器（若存在），避免穿模
                            const pathAirToBoiler = (() => {
                                // 默认路径（旧逻辑，作为兜底）
                                const fallback = [
                                    { x: airTankOutlet.x, y: airTankOutlet.y, z: airTankOutlet.z },
                                    { x: airTankOutlet.x, y: airTankOutlet.y + 5, z: airTankOutlet.z },
                                    { x: boilerMainInlet.x - 4, y: airTankOutlet.y + 5, z: airTankOutlet.z },
                                    { x: boilerMainInlet.x - 4, y: airTankOutlet.y + 5, z: boilerMainInlet.z - 12 },
                                    { x: boilerMainInlet.x - 4, y: boilerMainInlet.y + 4, z: boilerMainInlet.z - 12 },
                                    { x: boilerMainInlet.x - 4, y: boilerMainInlet.y + 4, z: boilerMainInlet.z }
                                ];

                                try {
                                    const ebfGroup = window.electrostaticBagFilter?.getGroup?.();
                                    if (!ebfGroup || !THREE) return fallback;

                                    // 计算电袋除尘器包围盒
                                    const ebfBox = new THREE.Box3().setFromObject(ebfGroup);
                                    const ebfCenterX = (ebfBox.min.x + ebfBox.max.x) / 2;
                                    const sideToBypassOnRight = airTankOutlet.x >= ebfCenterX;
                                    const margin = 8; // 与设备保持的水平安全间距
                                    const detourX = sideToBypassOnRight ? (ebfBox.max.x + margin) : (ebfBox.min.x - margin);

                                    // 在电袋上方一定高度走水平管，避免穿过主体几何
                                    const safeY = Math.max(
                                        airTankOutlet.y + 6,
                                        ebfBox.max.y + 4,
                                        boilerMainInlet.y + 3
                                    );

                                    return [
                                        { x: airTankOutlet.x, y: airTankOutlet.y, z: airTankOutlet.z },
                                        { x: airTankOutlet.x, y: safeY, z: airTankOutlet.z }, // 垂直抬高到安全高度
                                        { x: detourX, y: safeY, z: airTankOutlet.z }, // 在安全高度沿X偏移至电袋侧外侧
                                        { x: detourX, y: safeY, z: boilerMainInlet.z - 12 }, // 沿Z向前穿过电袋范围外侧
                                        { x: boilerMainInlet.x - 4, y: safeY, z: boilerMainInlet.z - 12 }, // 靠近锅炉入口侧
                                        { x: boilerMainInlet.x - 4, y: boilerMainInlet.y + 4, z: boilerMainInlet.z - 12 }, // 降到入口高度附近
                                        { x: boilerMainInlet.x - 4, y: boilerMainInlet.y + 4, z: boilerMainInlet.z } // 最终接入
                                    ];
                                } catch (_) {
                                    return fallback;
                                }
                            })();
                            
                            const pipeAirToBoiler = new PipeConnection({
                                name: '压缩空气储罐→锅炉喷淋头系统',
                                startPoint: airTankOutlet,
                                endPoint: { x: boilerMainInlet.x - 4, y: boilerMainInlet.y + 4, z: boilerMainInlet.z },
                                pipeRadius: 0.12, // 压缩空气管道较细
                                pipeColor: 0xFFD700, // 金黄色，区别于其他管道
                                showFlow: true,
                                flowDirection: 'forward',
                                pathStrategy: 'default',
                                customPathPoints: pathAirToBoiler
                            });
                            
                            // 创建压缩空气管道组（如果不存在）
                            if (!window.boiler.compressedAirPipeGroup) {
                                window.boiler.compressedAirPipeGroup = new THREE.Group();
                                window.boiler.compressedAirPipeGroup.name = 'compressedAirPipeGroup';
                                scene.add(window.boiler.compressedAirPipeGroup);
                            }
                            window.boiler.compressedAirPipeGroup.add(pipeAirToBoiler.group);
                            
                            console.log('压缩空气储罐已连接到锅炉内部喷淋头系统');
                        } else {
                            console.warn('压缩空气储罐或锅炉端口获取失败，无法创建管道连接');
                        }
                    } catch (e) {
                        console.warn('压缩空气储罐与锅炉连接失败:', e);
                    }
                } else {
                    console.warn('锅炉模型或空压机房不可用，无法创建压缩空气连接');
                }
            }, 2000); // 延迟2秒确保所有模型完全初始化
        } catch (e) {
            console.warn('空压机房创建失败（可忽略）:', e);
        }
        
        // 创建供浆泵系统 - 在制浆设备X轴正方向
        updateProgress(85, '创建供浆泵系统...');
        
        // 计算供浆泵位置 - 重新布局：一级塔泵左右两侧，二级塔泵中间
        const pumpBaseX = slurryTankX + 14; // 制浆设备右侧14个单位
        const pumpBaseZ = slurryTankZ;
        const pumpSpacingZ = 8; // Z轴方向的间距8个单位（增大间距避免连接感）
        const pumpSpacingX = 5; // X轴方向的间距5个单位（纵深布局）
        
        // 创建四个供浆泵，新的分离式布局
        const slurryPumps = [];
        
        // 一级塔供浆泵 1（左侧）
        const pump1 = new SlurrySupplyPump({
            name: '一级塔供浆泵1',
            position: { 
                x: pumpBaseX, 
                y: 0, 
                z: pumpBaseZ - pumpSpacingZ 
            },
            rotation: { x: 0, y: 0, z: 0 }, // 旋转90度，面向前方
            labelText: '一级塔供浆泵1',
            labelColor: '#FF6B35',
            scale: 1.0 // 一级塔泵保持原尺寸
        });
        scene.add(pump1.getGroup());
        slurryPumps.push(pump1);
        
        // 一级塔供浆泵 2（右侧）
        const pump2 = new SlurrySupplyPump({
            name: '一级塔供浆泵2',
            position: { 
                x: pumpBaseX, 
                y: 0, 
                z: pumpBaseZ + pumpSpacingZ 
            },
            rotation: { x: 0, y: 0, z: 0 }, // 旋转90度，面向前方
            labelText: '一级塔供浆泵2',
            labelColor: '#FF6B35',
            scale: 1.0 // 一级塔泵保持原尺寸
        });
        scene.add(pump2.getGroup());
        slurryPumps.push(pump2);
        
        // 二级塔供浆泵 1（中间偏左）
        const pump3 = new SlurrySupplyPump({
            name: '二级塔供浆泵1',
            position: { 
                x: pumpBaseX + pumpSpacingX, 
                y: 0, 
                z: pumpBaseZ - pumpSpacingZ / 2 
            },
            rotation: { x: 0, y: 0, z: 0 }, // 旋转90度，面向前方
            labelText: '二级塔供浆泵1',
            labelColor: '#3498DB',
            scale: 1.3, // 二级塔泵增大30%
            // 增强细节配置
            pumpBodyWidth: 3.2,
            pumpBodyHeight: 2.3,
            pumpBodyDepth: 1.9,
            motorWidth: 1.5,
            motorHeight: 1.3,
            motorLength: 2.6,
            baseWidth: 4.5,
            baseDepth: 3.2
        });
        scene.add(pump3.getGroup());
        slurryPumps.push(pump3);
        
        // 二级塔供浆泵 2（中间偏右）
        const pump4 = new SlurrySupplyPump({
            name: '二级塔供浆泵2',
            position: { 
                x: pumpBaseX + pumpSpacingX, 
                y: 0, 
                z: pumpBaseZ + pumpSpacingZ / 2 
            },
            rotation: { x: 0, y: 0, z: 0 }, // 旋转90度，面向前方
            labelText: '二级塔供浆泵2',
            labelColor: '#3498DB',
            scale: 1.3, // 二级塔泵增大30%
            // 增强细节配置
            pumpBodyWidth: 3.2,
            pumpBodyHeight: 2.3,
            pumpBodyDepth: 1.9,
            motorWidth: 1.5,
            motorHeight: 1.3,
            motorLength: 2.6,
            baseWidth: 4.5,
            baseDepth: 3.2
        });
        scene.add(pump4.getGroup());
        slurryPumps.push(pump4);
        
       
        
        const pipeConnections = [];
        
        // 制浆设备圆柱出料口位置（两个圆柱的底部出料口）
        const slurryTankCylinderPositions = [
            { x: slurryTankX - 3, y: 0, z: slurryTankZ }, // 左侧圆柱
            { x: slurryTankX + 3, y: 0, z: slurryTankZ }  // 右侧圆柱
        ];
        
        // 创建管道连接到每个泵
        slurryPumps.forEach((pump, index) => {
            // 创建工业管道连接
            const pipeConnection = createIndustrialPipeConnection(pump, slurryTankCylinderPositions, index);
            if (pipeConnection) {
                scene.add(pipeConnection);
                pipeConnections.push(pipeConnection);
            }
        });
        
        // 创建一级塔供浆泵到一级脱硫塔中部的管道连接
        createPrimaryTowerSupplyPipes(slurryPumps[0], slurryPumps[1]); // pump1 和 pump2 是一级塔供浆泵
        
        // 创建二级塔供浆泵到二级脱硫塔中部的管道连接
        createSecondaryTowerSupplyPipes(slurryPumps[2], slurryPumps[3]); // pump3 和 pump4 是二级塔供浆泵
        
        // 存储供浆泵和管道连接引用
        window.slurryPumps = slurryPumps;
        window.pipeConnections = pipeConnections;
        
        console.log('供浆泵系统创建成功');
        console.log('供浆泵数量:', slurryPumps.length);
        console.log('管道连接数量:', pipeConnections.length);
        slurryPumps.forEach((pump, index) => {
            console.log(`供浆泵${index + 1}位置:`, pump.getGroup().position);
        });
        
        // 创建工业管道连接函数
        function createIndustrialPipeConnection(pump, tankPositions, pumpIndex) {
            const pipeGroup = new THREE.Group();
            pipeGroup.name = `PipeConnection_Pump${pumpIndex + 1}`;
            
            // 获取泵的进浆口位置
            const pumpPos = pump.getGroup().position.clone();
            
            // 计算进浆口的实际位置（考虑泵的旋转）
            const inletLocalPos = new THREE.Vector3(-1.25, 0.9, 0); // 泵的进浆口相对位置
            const inletWorldPos = inletLocalPos.clone().add(pumpPos);
            
            // 根据泵的索引选择连接的制浆设备圆柱
            let targetTankPos;
            if (pumpIndex < 2) {
                // 一级塔泵连接左侧圆柱
                targetTankPos = new THREE.Vector3(tankPositions[0].x, tankPositions[0].y + 1, tankPositions[0].z);
            } else {
                // 二级塔泵连接右侧圆柱
                targetTankPos = new THREE.Vector3(tankPositions[1].x, tankPositions[1].y + 1, tankPositions[1].z);
            }
            
            // 创建管道材质
            const pipeMaterial = new THREE.MeshStandardMaterial({
                color: 0x708090,
                metalness: 0.8,
                roughness: 0.3
            });
            
            const flangeMaterial = new THREE.MeshStandardMaterial({
                color: 0x556B2F,
                metalness: 0.7,
                roughness: 0.4
            });
            
            // 计算水平管道段
            const horizontalDistance = Math.abs(targetTankPos.x - inletWorldPos.x);
            const horizontalPipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, horizontalDistance, 16);
            const horizontalPipe = new THREE.Mesh(horizontalPipeGeometry, pipeMaterial);
            
            // 水平管道位置
            horizontalPipe.position.set(
                (targetTankPos.x + inletWorldPos.x) / 2,
                inletWorldPos.y,
                inletWorldPos.z
            );
            horizontalPipe.rotation.z = Math.PI / 2;
            horizontalPipe.castShadow = true;
            pipeGroup.add(horizontalPipe);
            
            // 创建垂直连接段（从制浆设备到水平管道）
            const verticalDistance = Math.abs(inletWorldPos.y - targetTankPos.y);
            const verticalPipeGeometry = new THREE.CylinderGeometry(0.2, 0.2, verticalDistance, 16);
            const verticalPipe = new THREE.Mesh(verticalPipeGeometry, pipeMaterial);
            
            verticalPipe.position.set(
                targetTankPos.x,
                (targetTankPos.y + inletWorldPos.y) / 2,
                targetTankPos.z
            );
            verticalPipe.castShadow = true;
            pipeGroup.add(verticalPipe);
            
            // 创建弯头连接件
            const elbowGeometry = new THREE.TorusGeometry(0.3, 0.2, 8, 16, Math.PI / 2);
            const elbow = new THREE.Mesh(elbowGeometry, pipeMaterial);
            elbow.position.set(targetTankPos.x, inletWorldPos.y, targetTankPos.z);
            elbow.rotation.y = pumpIndex < 2 ? 0 : Math.PI; // 根据泵位置调整弯头方向
            elbow.castShadow = true;
            pipeGroup.add(elbow);
            
            // 创建法兰连接件
            const flangeGeometry = new THREE.CylinderGeometry(0.35, 0.35, 0.1, 16);
            
            // 泵侧法兰
            const pumpFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
            pumpFlange.position.set(inletWorldPos.x, inletWorldPos.y, inletWorldPos.z);
            pumpFlange.rotation.z = Math.PI / 2;
            pipeGroup.add(pumpFlange);
            
            // 制浆设备侧法兰
            const tankFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
            tankFlange.position.set(targetTankPos.x, targetTankPos.y, targetTankPos.z);
            pipeGroup.add(tankFlange);
            
            // 添加管道支架
            for (let i = 1; i < 4; i++) {
                const supportGeometry = new THREE.BoxGeometry(0.1, 0.5, 0.1);
                const supportMaterial = new THREE.MeshStandardMaterial({ color: 0x444444 });
                const support = new THREE.Mesh(supportGeometry, supportMaterial);
                
                support.position.set(
                    targetTankPos.x + (inletWorldPos.x - targetTankPos.x) * (i / 4),
                    inletWorldPos.y - 0.3,
                    inletWorldPos.z
                );
                support.castShadow = true;
                pipeGroup.add(support);
            }
            
            // 添加阀门
            const valveBodyGeometry = new THREE.CylinderGeometry(0.25, 0.25, 0.3, 8);
            const valveBody = new THREE.Mesh(valveBodyGeometry, flangeMaterial);
            valveBody.position.set(
                (targetTankPos.x + inletWorldPos.x) / 2,
                inletWorldPos.y,
                inletWorldPos.z
            );
            valveBody.rotation.z = Math.PI / 2;
            pipeGroup.add(valveBody);
            
            // 阀门手轮
            const wheelGeometry = new THREE.CylinderGeometry(0.2, 0.2, 0.05, 16);
            const wheelMaterial = new THREE.MeshStandardMaterial({ color: 0xFF4500 });
            const wheel = new THREE.Mesh(wheelGeometry, wheelMaterial);
            wheel.position.set(
                valveBody.position.x,
                valveBody.position.y + 0.25,
                valveBody.position.z
            );
            pipeGroup.add(wheel);
            
            return pipeGroup;
        }
        
        // 创建流化风机系统 - 在供浆泵对侧
        updateProgress(88, '创建流化风机系统...');
        
        // 计算流化风机位置 - 在制浆设备X轴负方向（左侧），向负方向再移动5个单位
        const blowerBaseX = slurryTankX - 13; // 制浆设备左侧13个单位（原8个单位 + 移动5个单位）
        const blowerBaseZ = slurryTankZ;
        const blowerSpacing = 6; // 两个风机之间的间距
        
        // 创建两个流化风机
        const fluidizationBlowers = [];
        
        // 流化风机1
        const blower1 = new FluidizationBlower({
            name: '流化风机1',
            position: { 
                x: blowerBaseX, 
                y: 0, 
                z: blowerBaseZ - blowerSpacing / 2 
            },
            rotation: { x: 0, y: Math.PI, z: 0 }, // 旋转90度
            scale: 1.3, // 模型放大30%
            labelText: '流化风机1\nFluidization\nBlower #1',
            labelColor: '#2E86C1',
            outletDirection: { x: 1, y: 0, z: 0 } // 出风口朝向制浆设备
        });
        scene.add(blower1.getGroup());
        fluidizationBlowers.push(blower1);
        
        // 流化风机2
        const blower2 = new FluidizationBlower({
            name: '流化风机2',
            position: { 
                x: blowerBaseX, 
                y: 0, 
                z: blowerBaseZ + blowerSpacing / 2 
            },
            rotation: { x: 0, y: Math.PI, z: 0 }, // 旋转90度
            scale: 1.3, // 模型放大30%
            labelText: '流化风机2\nFluidization\nBlower #2',
            labelColor: '#2E86C1',
            outletDirection: { x: 1, y: 0, z: 0 } // 出风口朝向制浆设备
        });
        scene.add(blower2.getGroup());
        fluidizationBlowers.push(blower2);
        
        // 创建流化风机到截锥底部的工业管道连接
        const blowerPipeConnections = [];
        
        // 获取双塔系统的截锥底部位置
        const primaryTowerPos = dualTowerSystem.primaryTower.group.position;
        const secondaryTowerPos = dualTowerSystem.secondaryTower.group.position;
        
        fluidizationBlowers.forEach((blower, index) => {
            // 创建管道连接组
            const pipeGroup = new THREE.Group();
            pipeGroup.name = `BlowerPipeConnection_${index + 1}`;
            
            // 获取风机出风口位置
            const blowerPos = blower.config.position;
            const outletPos = {
                x: blowerPos.x + 2, // 出风口位置
                y: blowerPos.y + 0.9,
                z: blowerPos.z
            };
            
            // 流化风机连接到制浆设备的截锥底部
            const slurryTankPos = { x: slurryTankX, y: 0, z: slurryTankZ };
            const truncatedConeBottomPos = {
                x: slurryTankPos.x,
                y: 10, // 制浆设备截锥底部高度（平台支撑高度）
                z: slurryTankPos.z
            };
            
            // 创建管道材质
            const pipeMaterial = new THREE.MeshLambertMaterial({
                color: 0x708090,
                transparent: false,
                roughness: 0.3,
                metalness: 0.7
            });
            
            const flangeMaterial = new THREE.MeshLambertMaterial({
                color: 0x556B2F,
                transparent: false,
                roughness: 0.4,
                metalness: 0.6
            });
            
            // 计算管道路径：水平段 + 垂直段 + 水平段
            const midPointX = (outletPos.x + truncatedConeBottomPos.x) / 2;
            
            // 第一段：风机出风口到中间点的水平管道
            const horizontalDistance1 = Math.abs(midPointX - outletPos.x);
            const horizontalPipe1Geometry = new THREE.CylinderGeometry(0.25, 0.25, horizontalDistance1, 12);
            const horizontalPipe1 = new THREE.Mesh(horizontalPipe1Geometry, pipeMaterial);
            horizontalPipe1.position.set(
                (midPointX + outletPos.x) / 2,
                outletPos.y,
                outletPos.z
            );
            horizontalPipe1.rotation.z = Math.PI / 2;
            pipeGroup.add(horizontalPipe1);
            
            // 第二段：垂直上升管道
            const verticalDistance = Math.abs(truncatedConeBottomPos.y - outletPos.y);
            const verticalPipeGeometry = new THREE.CylinderGeometry(0.25, 0.25, verticalDistance, 12);
            const verticalPipe = new THREE.Mesh(verticalPipeGeometry, pipeMaterial);
            verticalPipe.position.set(
                midPointX,
                (truncatedConeBottomPos.y + outletPos.y) / 2,
                outletPos.z
            );
            pipeGroup.add(verticalPipe);
            
            // 第三段：到截锥底部的水平管道
            const horizontalDistance2 = Math.abs(truncatedConeBottomPos.x - midPointX);
            const horizontalPipe2Geometry = new THREE.CylinderGeometry(0.25, 0.25, horizontalDistance2, 12);
            const horizontalPipe2 = new THREE.Mesh(horizontalPipe2Geometry, pipeMaterial);
            horizontalPipe2.position.set(
                (truncatedConeBottomPos.x + midPointX) / 2,
                truncatedConeBottomPos.y,
                truncatedConeBottomPos.z
            );
            horizontalPipe2.rotation.z = Math.PI / 2;
            pipeGroup.add(horizontalPipe2);
            
            // 创建弯头连接件
            const elbowGeometry = new THREE.TorusGeometry(0.35, 0.25, 8, 16, Math.PI / 2);
            
            // 第一个弯头（水平转垂直）
            const elbow1 = new THREE.Mesh(elbowGeometry, pipeMaterial);
            elbow1.position.set(midPointX, outletPos.y, outletPos.z);
            elbow1.rotation.y = Math.PI / 2;
            pipeGroup.add(elbow1);
            
            // 第二个弯头（垂直转水平）
            const elbow2 = new THREE.Mesh(elbowGeometry, pipeMaterial);
            elbow2.position.set(midPointX, truncatedConeBottomPos.y, truncatedConeBottomPos.z);
            elbow2.rotation.z = Math.PI / 2;
            pipeGroup.add(elbow2);
            
            // 创建法兰连接件
            const flangeGeometry = new THREE.CylinderGeometry(0.4, 0.4, 0.12, 12);
            
            // 风机出风口法兰
            const blowerFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
            blowerFlange.position.set(outletPos.x, outletPos.y, outletPos.z);
            blowerFlange.rotation.z = Math.PI / 2;
            pipeGroup.add(blowerFlange);
            
            // 截锥底部进风口法兰
            const towerFlange = new THREE.Mesh(flangeGeometry, flangeMaterial);
            towerFlange.position.set(truncatedConeBottomPos.x, truncatedConeBottomPos.y, truncatedConeBottomPos.z);
            towerFlange.rotation.z = Math.PI / 2;
            pipeGroup.add(towerFlange);
            
            // 添加管道支架
            const supportPositions = [
                { x: (outletPos.x + midPointX) / 2, y: outletPos.y - 0.4, z: outletPos.z },
                { x: midPointX, y: (outletPos.y + truncatedConeBottomPos.y) / 2, z: outletPos.z },
                { x: (midPointX + truncatedConeBottomPos.x) / 2, y: truncatedConeBottomPos.y - 0.4, z: truncatedConeBottomPos.z }
            ];
            
            supportPositions.forEach(pos => {
                const supportGeometry = new THREE.BoxGeometry(0.15, 0.6, 0.15);
                const supportMaterial = new THREE.MeshLambertMaterial({ color: 0x444444 });
                const support = new THREE.Mesh(supportGeometry, supportMaterial);
                support.position.set(pos.x, pos.y, pos.z);
                pipeGroup.add(support);
            });
            
            // 添加调节阀
            const valveBodyGeometry = new THREE.CylinderGeometry(0.3, 0.3, 0.4, 8);
            const valveBody = new THREE.Mesh(valveBodyGeometry, flangeMaterial);
            valveBody.position.set(
                (outletPos.x + midPointX) / 2,
                outletPos.y,
                outletPos.z
            );
            valveBody.rotation.z = Math.PI / 2;
            pipeGroup.add(valveBody);
            
            // 阀门执行器
            const actuatorGeometry = new THREE.BoxGeometry(0.3, 0.4, 0.2);
            const actuatorMaterial = new THREE.MeshLambertMaterial({ color: 0x2E86C1 });
            const actuator = new THREE.Mesh(actuatorGeometry, actuatorMaterial);
            actuator.position.set(
                valveBody.position.x,
                valveBody.position.y + 0.3,
                valveBody.position.z
            );
            pipeGroup.add(actuator);
            
            scene.add(pipeGroup);
            blowerPipeConnections.push(pipeGroup);
        });
        
        // 存储流化风机和管道连接引用
        window.fluidizationBlowers = fluidizationBlowers;
        window.blowerPipeConnections = blowerPipeConnections;
        
        console.log('流化风机系统创建成功');
        console.log('流化风机数量:', fluidizationBlowers.length);
        console.log('风机管道连接数量:', blowerPipeConnections.length);
        fluidizationBlowers.forEach((blower, index) => {
            console.log(`流化风机${index + 1}位置:`, blower.getGroup().position);
        });
        
      
        
        
    } catch (error) {
        console.error('制浆箱和相关系统创建失败:', error);
    }
    

    
    updateProgress(90, '创建基础环境...');
    
    // 创建基础环境（仅保留地面和网格）
    createBasicEnvironment();
    
    updateProgress(93, '设置交互...');
    
    // 设置交互
    setupInteraction();
    
    updateProgress(95, '初始化参数面板...');
    
    // 初始化参数面板
    // 注意：目前使用双塔系统，使用主塔进行参数面板初始化
    if (dualTowerSystem && dualTowerSystem.primaryTower) {
        window.parameterPanel = initParameterPanel(dualTowerSystem.primaryTower);
    } else {
        console.warn('双塔系统未完全初始化，跳过参数面板创建');
        window.parameterPanel = null;
    }
    
    updateProgress(100, '加载完成！');
    
    // 开始渲染循环
    animate();
    
    // 隐藏加载提示
    setTimeout(() => {
        document.getElementById('loading').style.display = 'none';
        document.querySelector('.progress-bar').style.display = 'none';
        updateObjectCount();
        
        // 显示NaN验证器统计报告
        if (window.nanValidator) {
            const stats = window.nanValidator.getStatistics();
            console.log('=== NaN验证器统计报告 ===');
            console.log(`总验证次数: ${stats.totalValidations}`);
            console.log(`发现NaN次数: ${stats.nanDetections}`);
            console.log(`几何体修复次数: ${stats.geometryFixes}`);
            console.log(`网格验证次数: ${stats.meshValidations}`);
            console.log(`组验证次数: ${stats.groupValidations}`);
            console.log('========================');
            
            if (stats.nanDetections > 0) {
                console.warn(`⚠️ 检测到 ${stats.nanDetections} 个NaN值，已自动修复`);
            } else {
                console.log('✅ 未检测到NaN值，系统运行正常');
            }
        }
    }, 500);
    
    console.log('3D脱硫塔模型加载完成');

    // 创建石膏旋流器到回收水箱的简单管道连接
    setTimeout(() => {
        createGypsumCycloneToTankConnection();
    }, 3000); // 延长等待时间，确保工业综合楼内部的石膏旋流器创建完成

    // 创建石膏旋流器入浆口 → 一级塔泵房排浆泵1、排浆泵2 的管道（标签定位）
    setTimeout(() => {
        createCycloneInletToDrainagePumpsConnection();
    }, 3500);
}

/**
 * 设置光照系统
 */
function setupLighting() {
    // 环境光
    const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
    scene.add(ambientLight);
    
    // 主光源 - 太阳光
    const directionalLight = new THREE.DirectionalLight(0xffffff, 1.0);
    directionalLight.position.set(50, 80, 50);
    directionalLight.castShadow = true;
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 200;
    directionalLight.shadow.camera.left = -50;
    directionalLight.shadow.camera.right = 50;
    directionalLight.shadow.camera.top = 50;
    directionalLight.shadow.camera.bottom = -50;
    scene.add(directionalLight);
    
    // 补充光源
    const fillLight = new THREE.DirectionalLight(0x87CEEB, 0.3);
    fillLight.position.set(-30, 20, -30);
    scene.add(fillLight);
    
    // 点光源 - 模拟工业照明
    const pointLight1 = new THREE.PointLight(0xffffff, 0.8, 100);
    pointLight1.position.set(20, 40, 20);
    pointLight1.castShadow = true;
    scene.add(pointLight1);
    
    const pointLight2 = new THREE.PointLight(0xffffff, 0.8, 100);
    pointLight2.position.set(-20, 40, -20);
    pointLight2.castShadow = true;
    scene.add(pointLight2);
    
    // 聚光灯 - 突出脱硫塔
    const spotLight = new THREE.SpotLight(0xffffff, 1.5, 100, Math.PI / 6, 0.3);
    spotLight.position.set(0, 60, 30);
    spotLight.target.position.set(0, 15, 0);
    spotLight.castShadow = true;
    scene.add(spotLight);
    scene.add(spotLight.target);
}

/**
 * 创建基础环境（简化版，腾出空间）
 */
function createBasicEnvironment() {
    // 地面 - 工业水泥地面（无光影效果）
    const groundGeometry = new THREE.PlaneGeometry(1000, 1000);
    const groundMaterial = new THREE.MeshBasicMaterial({ 
        color: 0x808080,  // 灰色水泥地面
        transparent: false,
        opacity: 1.0
    });
    const ground = new THREE.Mesh(groundGeometry, groundMaterial);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -5;  // 恢复原始地坪标高
    ground.receiveShadow = false;  // 关闭阴影接收
    ground.castShadow = false;     // 关闭阴影投射
    scene.add(ground);
    
    // 网格线 - 更清晰的工业网格
    const gridHelper = new THREE.GridHelper(1000, 100, 0x555555, 0x888888);
    gridHelper.position.y = -4.9;  // 恢复原始网格标高
    scene.add(gridHelper);
    
    // 天空盒 - 工业天空
    const skyGeometry = new THREE.SphereGeometry(500, 16, 16);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0x87CEEB,  // 天蓝色天空
        side: THREE.BackSide,
        transparent: true,
        opacity: 0.8
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    scene.add(sky);
}

// 已删除原有的复杂环境函数，为新模型腾出空间

// 已删除烟雾效果和管道系统函数，为新模型腾出空间

/**
 * 设置交互
 */
function setupInteraction() {
    raycaster = new THREE.Raycaster();
    mouse = new THREE.Vector2();
    
    // 鼠标点击事件
    renderer.domElement.addEventListener('click', onMouseClick, false);
    
    // 鼠标移动事件 - 用于显示工具提示
    renderer.domElement.addEventListener('mousemove', onMouseMove, false);
    
    // 鼠标滚轮事件 - 智能缩放
    renderer.domElement.addEventListener('wheel', onMouseWheel, { passive: false });
    
    // 键盘事件
    document.addEventListener('keydown', onKeyDownEnhanced, false);
    
    // 窗口大小调整
    window.addEventListener('resize', onWindowResize, false);
}

/**
 * 查找被点击的塔
 */
function findClickedTower(clickedObject) {
    if (!dualTowerSystem) return null;
    
    // 向上遍历对象层次结构，找到所属的塔
    let current = clickedObject;
    while (current) {
        // 检查是否是一级塔
        if (current === dualTowerSystem.primaryTower?.group || 
            (current.parent && current.parent === dualTowerSystem.primaryTower?.group)) {
            return dualTowerSystem.primaryTower;
        }
        
        // 检查是否是二级塔
        if (current === dualTowerSystem.secondaryTower?.group || 
            (current.parent && current.parent === dualTowerSystem.secondaryTower?.group)) {
            return dualTowerSystem.secondaryTower;
        }
        
        // 通过用户数据检查塔的角色
        if (current.userData && current.userData.systemRole) {
            if (current.userData.systemRole === 'primary') {
                return dualTowerSystem.primaryTower;
            } else if (current.userData.systemRole === 'secondary') {
                return dualTowerSystem.secondaryTower;
            }
        }
        
        current = current.parent;
    }
    
    return null;
}

/**
 * 获取当前处于内部视图的塔
 */
function getCurrentInteriorTower() {
    if (!dualTowerSystem) return null;
    
    if (dualTowerSystem.primaryTower?.isInteriorView) {
        return dualTowerSystem.primaryTower;
    }
    
    if (dualTowerSystem.secondaryTower?.isInteriorView) {
        return dualTowerSystem.secondaryTower;
    }
    
    return null;
}

/**
 * 鼠标点击事件处理（重构版）
 */
function onMouseClick(event) {
    console.log('点击事件触发');
    
    // 1. 拾取射线
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    
    // 检查是否点击了一级塔泵房
    if (window.pumpHouse) {
        const pumpHouseIntersects = raycaster.intersectObjects(window.pumpHouse.group.children, true);
        if (pumpHouseIntersects.length > 0) {
            console.log('检测到点击一级塔泵房');
            
            // 如果当前在外部视图，进入内部视图
            if (!window.pumpHouse.isInteriorView) {
                console.log('准备进入一级塔泵房内部视图');
                enterPumpHouseInteriorView();
                return;
            } else {
                // 如果已经在内部视图，可以点击内部设备查看详情
                console.log('一级塔泵房内部视图 - 点击设备');
                // 这里可以添加设备详情逻辑
                return;
            }
        }
    }
    
    // 检查是否点击了二级塔泵房
    if (window.secondaryPumpHouse) {
        const secondaryPumpHouseIntersects = raycaster.intersectObjects(window.secondaryPumpHouse.group.children, true);
        if (secondaryPumpHouseIntersects.length > 0) {
            console.log('检测到点击二级塔泵房');
            
            // 如果当前在外部视图，进入内部视图
            if (!window.secondaryPumpHouse.isInteriorView) {
                console.log('准备进入二级塔泵房内部视图');
                enterSecondaryPumpHouseInteriorView();
                return;
            } else {
                // 如果已经在内部视图，可以点击内部设备查看详情
                console.log('二级塔泵房内部视图 - 点击设备');
                // 这里可以添加设备详情逻辑
                return;
            }
        }
    }

    // 检查是否点击了水泵房
    if (window.waterPumpHouse) {
        const waterPumpHouseIntersects = raycaster.intersectObjects(window.waterPumpHouse.group.children, true);
        if (waterPumpHouseIntersects.length > 0) {
            console.log('检测到点击水泵房');

            // 如果当前在外部视图，进入内部视图
            if (!window.waterPumpHouse.isInteriorView) {
                console.log('准备进入水泵房内部视图');
                enterWaterPumpHouseInteriorView();
                return;
            } else {
                console.log('水泵房内部视图 - 点击设备');
                return;
            }
        }
    }
    
    // 检查是否点击了工业综合楼
    if (window.industrialBuilding) {
        const buildingIntersects = raycaster.intersectObjects(window.industrialBuilding.getGroup().children, true);
        if (buildingIntersects.length > 0) {
            console.log('检测到点击工业综合楼');
            
            // 如果当前在外部视图，进入内部视图
            if (!window.industrialBuilding.isInteriorView) {
                console.log('准备进入工业综合楼内部视图');
                enterIndustrialBuildingInteriorView();
                return;
            } else {
                // 如果已经在内部视图，可以点击内部设备查看详情
                console.log('工业综合楼内部视图 - 点击设备');
                // 这里可以添加设备详情逻辑
                return;
            }
        }
    }

    // 检查是否点击了空压机房
    if (window.airCompressorRoom) {
        const roomIntersects = raycaster.intersectObjects(window.airCompressorRoom.getGroup().children, true);
        if (roomIntersects.length > 0) {
            console.log('检测到点击空压机房');
            if (!window.airCompressorRoom.isInteriorView) {
                console.log('准备进入空压机房内部视图');
                enterAirCompressorRoomInteriorView();
                return;
            } else {
                // 内部视图点击保留
                return;
            }
        }
    }

    // 检查是否点击了电袋除尘器
    if (window.electrostaticBagFilter) {
        const filterIntersects = raycaster.intersectObjects(window.electrostaticBagFilter.getGroup().children, true);
        if (filterIntersects.length > 0) {
            console.log('检测到点击电袋除尘器');
            if (!window.electrostaticBagFilter.isInteriorView) {
                console.log('准备进入电袋除尘器内部视图');
                enterElectrostaticBagFilterInteriorView();
                return;
            } else {
                // 内部视图点击保留
                console.log('电袋除尘器内部视图 - 点击设备');
                return;
            }
        }
    }

    // 检查是否点击了锅炉
    if (window.boiler) {
        const boilerIntersects = raycaster.intersectObjects(window.boiler.getGroup().children, true);
        if (boilerIntersects.length > 0) {
            console.log('检测到点击锅炉');
            if (!window.boiler.isInteriorView) {
                console.log('准备进入锅炉内部视图');
                window.enterBoilerInteriorView();
                return;
            } else {
                // 内部视图点击保留
                return;
            }
        }
    }
    


    // 检查是否点击了锅炉顶部烟道
    if (window.boilerFlue) {
        const flueIntersects = raycaster.intersectObjects(window.boilerFlue.getGroup().children, true);
        if (flueIntersects.length > 0) {
            console.log('检测到点击锅炉顶部烟道');
            if (!window.boilerFlue.isInteriorView) {
                console.log('准备进入锅炉顶部烟道内部视图');
                window.enterBoilerFlueInteriorView();
                return;
            } else {
                // 内部视图点击保留
                return;
            }
        }
    }
    
    if (!dualTowerSystem) {
        console.warn('双塔系统未初始化，无法处理点击事件');
        return;
    }
    
    const intersects = raycaster.intersectObjects(
      dualTowerSystem.group.children,
      true
    );

    console.log('射线检测结果:', intersects.length, '个交点');

    if (intersects.length > 0) {
        // 查找被点击的塔
        const clickedTower = findClickedTower(intersects[0].object);
        
        if (clickedTower) {
            console.log('检测到点击塔:', clickedTower.towerConfig.name);
            
            // 2. 外部视图逻辑 - 点击脱硫塔任何部分都可以进入内部
            if (!clickedTower.isInteriorView) {
                console.log('准备进入内部视图');
                enterInteriorView(clickedTower);
                return; 
            }
        }
    }

    // 如果当前有塔处于内部视图，处理内部点击逻辑
    const currentInteriorTower = getCurrentInteriorTower();
    if (currentInteriorTower && intersects.length > 0) {
        console.log('当前视图状态: 内部');
        const clicked = intersects[0].object;
        const name = getComponentName(clicked);
        if (name) {
            showObjectInfo(clicked);
            highlightComponent(clicked);
            window.parameterPanel?.show(name);
        } else {
            showObjectInfo(clicked);
            showClickInfo(intersects[0].point, clicked);
        }
    } else if (intersects.length === 0) {
        console.log('未检测到脱硫塔点击');
    }
}

/**
 * 鼠标移动事件处理
 */
function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    
    raycaster.setFromCamera(mouse, camera);
    
    // 使用双塔系统的整个组进行检测
    if (!dualTowerSystem) {
        return;
    }
    const intersects = raycaster.intersectObjects(dualTowerSystem.group.children, true);
    
    const tooltip = document.getElementById('tooltip');
    
    if (intersects.length > 0) {
        const hoveredObject = intersects[0].object;
        const componentInfo = getComponentInfo(hoveredObject);
        
        if (componentInfo) {
            tooltip.innerHTML = componentInfo;
            tooltip.style.display = 'block';
            tooltip.style.left = event.clientX + 10 + 'px';
            tooltip.style.top = event.clientY - 30 + 'px';
        }
        
        // 改变鼠标样式
        renderer.domElement.style.cursor = 'pointer';
    } else {
        tooltip.style.display = 'none';
        renderer.domElement.style.cursor = 'default';
    }
}

/**
 * 基于摄像机距离的简单缩放 - 适用于内部和外部视图
 */
let lastWheelTime = 0;
let wheelAccumulator = 0;
const wheelThrottleDelay = 50; // 节流延迟

function onMouseWheel(event) {
    event.preventDefault();
    
    const currentTime = performance.now();
    
    // 累积滚轮增量
    wheelAccumulator += event.deltaY;
    
    // 节流处理：如果距离上次处理时间太短，则延迟处理
    if (currentTime - lastWheelTime < wheelThrottleDelay) {
        // 清除之前的延迟处理
        clearTimeout(window.wheelTimeout);
        
        // 设置新的延迟处理
        window.wheelTimeout = setTimeout(() => {
            processWheelZoom(wheelAccumulator);
            wheelAccumulator = 0;
            lastWheelTime = performance.now();
        }, wheelThrottleDelay);
        
        return;
    }
    
    // 立即处理
    processWheelZoom(wheelAccumulator);
    wheelAccumulator = 0;
    lastWheelTime = currentTime;
}

/**
 * 处理滚轮缩放的核心逻辑 - 基于摄像机距离变换
 */
function processWheelZoom(deltaY) {
    // 缩放参数 - 增加缩放幅度
    const zoomSpeed = 0.25; // 增加缩放速度系数，从0.1提升到0.25
    const minDistance = 5;   // 最小距离
    const maxDistance = 200; // 最大距离
    
    // 获取当前相机到控制中心的距离
    const currentDistance = camera.position.distanceTo(controls.target);
    
    // 计算距离变化量（基于当前距离的比例，增加变化幅度）
    const distanceChange = (deltaY > 0 ? 1 : -1) * zoomSpeed * Math.max(currentDistance * 0.2, 2);
    
    // 计算新的距离
    const newDistance = currentDistance + distanceChange;
    
    // 检查距离限制
    if (newDistance < minDistance || newDistance > maxDistance) {
        return; // 超出限制，不进行缩放
    }
    
    // 计算从控制中心到相机的方向向量
    const direction = new THREE.Vector3().subVectors(camera.position, controls.target).normalize();
    
    // 计算新的相机位置（沿着方向向量移动）
    const newCameraPosition = controls.target.clone().add(direction.multiplyScalar(newDistance));
    
    // 使用平滑动画移动相机到新位置
    smoothCameraMove(camera.position.clone(), newCameraPosition, 120);
    
    // 更新缩放状态指示器
    updateZoomIndicator(newDistance, "场景中心");
}

/**
 * 平滑相机移动动画（只移动相机位置，不改变target）
 */
function smoothCameraMove(startPos, endPos, duration = 250) { // 增加动画持续时间，原来是150
    const startTime = performance.now();
    
    function animate(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用easeOutCubic缓动函数，提供更自然的减速效果
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        // 插值计算当前位置（只移动相机，target保持不变）
        camera.position.lerpVectors(startPos, endPos, easeProgress);
        
        // 更新控制器
        controls.update();
        
        // 继续动画直到完成
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    }
    
    requestAnimationFrame(animate);
}



/**
 * 更新缩放状态指示器
 */
function updateZoomIndicator(distance, focusTarget) {
    const zoomIndicator = document.getElementById('zoom-indicator');
    const zoomValue = document.getElementById('zoom-value');
    const focusTargetElement = document.getElementById('focus-target');
    
    if (!zoomIndicator || !zoomValue || !focusTargetElement) return;
    
    // 计算缩放百分比（基于初始距离50）
    const initialDistance = 50;
    const zoomPercentage = Math.round((initialDistance / distance) * 100);
    
    // 更新显示值
    zoomValue.textContent = `${zoomPercentage}%`;
    focusTargetElement.textContent = focusTarget;
    
    // 显示指示器
    zoomIndicator.classList.add('visible');
    
    // 3秒后自动隐藏
    clearTimeout(window.zoomIndicatorTimeout);
    window.zoomIndicatorTimeout = setTimeout(() => {
        zoomIndicator.classList.remove('visible');
    }, 3000);
}









/**
 * 进入泵房内部视图
 */
function enterPumpHouseInteriorView() {
    if (!window.pumpHouse) {
        console.warn('泵房未初始化，无法进入内部视图');
        return;
    }
    
    console.log('进入泵房内部视图');
    
    // 确保脱硫塔都处于外部视图
    if (dualTowerSystem) {
        if (dualTowerSystem.primaryTower?.isInteriorView) {
            dualTowerSystem.primaryTower.showExterior();
        }
        if (dualTowerSystem.secondaryTower?.isInteriorView) {
            dualTowerSystem.secondaryTower.showExterior();
        }
    }
    
    // 切换泵房到内部视图
    window.pumpHouse.showInterior();
    
    // 调整相机位置聚焦到泵房内部
    const pumpHousePos = window.pumpHouse.config.position;
    const targetPosition = new THREE.Vector3(pumpHousePos.x, pumpHousePos.y + 3, pumpHousePos.z);
    const cameraPosition = new THREE.Vector3(pumpHousePos.x + 20, pumpHousePos.y + 8, pumpHousePos.z + 15);
    
    animateCamera(cameraPosition, targetPosition);
}

/**
 * 退出泵房内部视图
 */
function exitPumpHouseInteriorView() {
    if (!window.pumpHouse) return;
    
    console.log('退出一级塔泵房内部视图');
    
    // 切换泵房到外部视图
    window.pumpHouse.showExterior();
    
    // 返回外部总览视图
    const targetPosition = new THREE.Vector3(0, 15, 0);
    const cameraPosition = new THREE.Vector3(50, 30, 50);
    animateCamera(cameraPosition, targetPosition);
}

/**
 * 进入二级塔泵房内部视图
 */
function enterSecondaryPumpHouseInteriorView() {
    if (!window.secondaryPumpHouse) {
        console.warn('二级塔泵房未初始化，无法进入内部视图');
        return;
    }
    
    console.log('进入二级塔泵房内部视图');
    
    // 退出其他内部视图
    if (dualTowerSystem.primaryTower?.isInteriorView) {
        dualTowerSystem.primaryTower.showExterior();
    }
    if (dualTowerSystem.secondaryTower?.isInteriorView) {
        dualTowerSystem.secondaryTower.showExterior();
    }
    if (window.pumpHouse?.isInteriorView) {
        window.pumpHouse.showExterior();
    }
    
    // 切换二级塔泵房到内部视图
    window.secondaryPumpHouse.showInterior();
    
    // 调整相机位置聚焦到二级塔泵房内部
    const pumpHousePos = window.secondaryPumpHouse.config.position;
    const targetPosition = new THREE.Vector3(pumpHousePos.x, pumpHousePos.y + 3, pumpHousePos.z);
    const cameraPosition = new THREE.Vector3(pumpHousePos.x + 20, pumpHousePos.y + 8, pumpHousePos.z + 15);
    animateCamera(cameraPosition, targetPosition);
}

/**
 * 进入水泵房内部视图
 */
function enterWaterPumpHouseInteriorView() {
    if (!window.waterPumpHouse) {
        console.warn('水泵房未初始化，无法进入内部视图');
        return;
    }

    console.log('进入水泵房内部视图');

    // 退出其他内部视图
    if (dualTowerSystem?.primaryTower?.isInteriorView) {
        dualTowerSystem.primaryTower.showExterior();
    }
    if (dualTowerSystem?.secondaryTower?.isInteriorView) {
        dualTowerSystem.secondaryTower.showExterior();
    }
    if (window.pumpHouse?.isInteriorView) {
        window.pumpHouse.showExterior();
    }
    if (window.secondaryPumpHouse?.isInteriorView) {
        window.secondaryPumpHouse.showExterior();
    }
    if (window.industrialBuilding?.isInteriorView) {
        window.industrialBuilding.showExterior();
    }

    // 切换水泵房到内部视图
    window.waterPumpHouse.showInterior();

    // 调整相机位置聚焦到水泵房内部
    const pos = window.waterPumpHouse.config.position;
    const targetPosition = new THREE.Vector3(pos.x, pos.y + 3, pos.z);
    const cameraPosition = new THREE.Vector3(pos.x + 20, pos.y + 8, pos.z + 15);
    animateCamera(cameraPosition, targetPosition);
}

/**
 * 退出水泵房内部视图
 */
function exitWaterPumpHouseInteriorView() {
    if (!window.waterPumpHouse) return;

    console.log('退出水泵房内部视图');
    window.waterPumpHouse.showExterior();

    // 平滑聚焦到水泵房所在位置（而非全局总览）
    const pos = window.waterPumpHouse.config.position;
    const targetPosition = new THREE.Vector3(pos.x, pos.y + 4, pos.z);
    const cameraPosition = new THREE.Vector3(pos.x + 28, pos.y + 12, pos.z + 22);
    animateCamera(cameraPosition, targetPosition);
}

/**
 * 退出二级塔泵房内部视图
 */
function exitSecondaryPumpHouseInteriorView() {
    if (!window.secondaryPumpHouse) return;
    
    console.log('退出二级塔泵房内部视图');
    
    // 切换二级塔泵房到外部视图
    window.secondaryPumpHouse.showExterior();
    
    // 返回外部总览视图
    const targetPosition = new THREE.Vector3(0, 15, 0);
    const cameraPosition = new THREE.Vector3(50, 30, 50);
    animateCamera(cameraPosition, targetPosition);
}

/**
 * 进入工业综合楼内部视图
 */
function enterIndustrialBuildingInteriorView() {
    if (!window.industrialBuilding) {
        console.warn('工业综合楼未初始化，无法进入内部视图');
        return;
    }
    
    console.log('进入工业综合楼内部视图');
    
    // 退出其他内部视图
    if (dualTowerSystem.primaryTower?.isInteriorView) {
        dualTowerSystem.primaryTower.showExterior();
    }
    if (dualTowerSystem.secondaryTower?.isInteriorView) {
        dualTowerSystem.secondaryTower.showExterior();
    }
    if (window.pumpHouse?.isInteriorView) {
        window.pumpHouse.showExterior();
    }
    if (window.secondaryPumpHouse?.isInteriorView) {
        window.secondaryPumpHouse.showExterior();
    }
    
    // 切换工业综合楼到内部视图
    window.industrialBuilding.showInterior();
    
    // 调整相机位置聚焦到工业综合楼内部
    // 工业综合楼位置：{ x: buildingX, y: 0, z: buildingZ }
    // buildingX = -25 - 45 = -70, buildingZ = 15
    const buildingPos = { x: -70, y: 0, z: 15 };
    const targetPosition = new THREE.Vector3(buildingPos.x, buildingPos.y + 5, buildingPos.z);
    const cameraPosition = new THREE.Vector3(buildingPos.x + 25, buildingPos.y + 10, buildingPos.z + 20);
    
    animateCamera(cameraPosition, targetPosition);
}

/**
 * 进入空压机房内部视图
 */
function enterAirCompressorRoomInteriorView() {
    if (!window.airCompressorRoom) {
        console.warn('空压机房未初始化，无法进入内部视图');
        return;
    }

    // 退出其他内部视图
    if (dualTowerSystem?.primaryTower?.isInteriorView) dualTowerSystem.primaryTower.showExterior();
    if (dualTowerSystem?.secondaryTower?.isInteriorView) dualTowerSystem.secondaryTower.showExterior();
    if (window.pumpHouse?.isInteriorView) window.pumpHouse.showExterior();
    if (window.secondaryPumpHouse?.isInteriorView) window.secondaryPumpHouse.showExterior();
    if (window.industrialBuilding?.isInteriorView) window.industrialBuilding.showExterior();
    if (window.waterPumpHouse?.isInteriorView) window.waterPumpHouse.showExterior();

    // 切换自身到内部
    window.airCompressorRoom.showInterior();

    // 相机移入
    const pos = window.airCompressorRoom.getGroup().position;
    const targetPosition = new THREE.Vector3(pos.x, pos.y + 5, pos.z);
    const cameraPosition = new THREE.Vector3(pos.x + 24, pos.y + 12, pos.z + 18);
    animateCamera(cameraPosition, targetPosition);
}

/**
 * 退出空压机房内部视图
 */
function exitAirCompressorRoomInteriorView() {
    if (!window.airCompressorRoom) return;
    window.airCompressorRoom.showExterior();

    // 返回外部总览
    const targetPosition = new THREE.Vector3(0, 15, 0);
    const cameraPosition = new THREE.Vector3(50, 30, 50);
    animateCamera(cameraPosition, targetPosition);
}

/**
 * 进入电袋除尘器内部视图
 */
function enterElectrostaticBagFilterInteriorView() {
    if (!window.electrostaticBagFilter) {
        console.warn('电袋除尘器未初始化，无法进入内部视图');
        return;
    }

    // 退出其他内部视图
    if (dualTowerSystem?.primaryTower?.isInteriorView) dualTowerSystem.primaryTower.showExterior();
    if (dualTowerSystem?.secondaryTower?.isInteriorView) dualTowerSystem.secondaryTower.showExterior();
    if (window.pumpHouse?.isInteriorView) window.pumpHouse.showExterior();
    if (window.secondaryPumpHouse?.isInteriorView) window.secondaryPumpHouse.showExterior();
    if (window.industrialBuilding?.isInteriorView) window.industrialBuilding.showExterior();
    if (window.waterPumpHouse?.isInteriorView) window.waterPumpHouse.showExterior();
    if (window.airCompressorRoom?.isInteriorView) window.airCompressorRoom.showExterior();

    // 切换自身到内部
    window.electrostaticBagFilter.showInterior();

    // 相机移入电袋除尘器内部
    const pos = window.electrostaticBagFilter.getGroup().position;
    const targetPosition = new THREE.Vector3(pos.x, pos.y + 15, pos.z);
    const cameraPosition = new THREE.Vector3(pos.x + 30, pos.y + 20, pos.z + 25);
    animateCamera(cameraPosition, targetPosition);
}

/**
 * 退出电袋除尘器内部视图
 */
function exitElectrostaticBagFilterInteriorView() {
    if (!window.electrostaticBagFilter) return;
    window.electrostaticBagFilter.showExterior();

    // 返回外部总览
    const targetPosition = new THREE.Vector3(0, 15, 0);
    const cameraPosition = new THREE.Vector3(50, 30, 50);
    animateCamera(cameraPosition, targetPosition);
}
/**
 * 退出工业综合楼内部视图
 */
function exitIndustrialBuildingInteriorView() {
    if (!window.industrialBuilding) return;
    
    console.log('退出工业综合楼内部视图');
    
    window.industrialBuilding.showExterior();
    
    // 返回外部总览视图
    const targetPosition = new THREE.Vector3(0, 15, 0);
    const cameraPosition = new THREE.Vector3(50, 30, 50);
    animateCamera(cameraPosition, targetPosition);
}

// 平滑进入内部视图 - 支持指定塔参数
function enterInteriorView(targetTower = null) {
    // 如果没有指定塔，默认使用主塔
    const currentTower = targetTower || dualTowerSystem?.primaryTower;
    if (!currentTower) {
        console.warn('双塔系统未初始化，无法进入内部视图');
        return;
    }
    
    console.log(`进入${currentTower.towerConfig.name}内部视图`);
    
    // 确保其他塔都处于外部视图
    if (dualTowerSystem.primaryTower && dualTowerSystem.primaryTower !== currentTower) {
        dualTowerSystem.primaryTower.showExterior();
    }
    if (dualTowerSystem.secondaryTower && dualTowerSystem.secondaryTower !== currentTower) {
        dualTowerSystem.secondaryTower.showExterior();
    }
    
    const duration = 1000; // 缩短动画时间到1秒
    const startPos = camera.position.clone();
    const startTarget = controls.target.clone();
    
    // 根据塔的位置设置相机目标位置
    const towerPosition = currentTower.towerConfig.position;
    const endPos = new THREE.Vector3(
        towerPosition.x + 15, 
        15, 
        towerPosition.z + 15
    );
    const endTarget = new THREE.Vector3(
        towerPosition.x, 
        15, 
        towerPosition.z
    );
    
    const startTime = performance.now();

    // 立即切换到内部视图
    currentTower.showInterior();

    function animate() {
        const elapsed = performance.now() - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // 使用easeOutCubic缓动函数，提供更自然的减速效果
        const easeProgress = 1 - Math.pow(1 - progress, 3);

        // 更新相机位置和目标
        camera.position.lerpVectors(startPos, endPos, easeProgress);
        controls.target.lerpVectors(startTarget, endTarget, easeProgress);
        controls.update();

        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // 动画完成，确保最终位置准确
            camera.position.copy(endPos);
            controls.target.copy(endTarget);
            controls.update();
            console.log('进入内部视图动画完成');
        }
    }
    animate();
}

function startZoomAnim(fromTarget, fromCam, toTarget, toCam) {
    if (zoomAnim && zoomAnim.animating) return;
    zoomAnim = {
        animating: true,
        start: performance.now(),
        fromTarget,
        fromCam,
        toTarget,
        toCam
    };
    requestAnimationFrame(zoomAnimStep);
}

function zoomAnimStep(now) {
    if (!zoomAnim || !zoomAnim.animating) return;
    const elapsed = now - zoomAnim.start;
    const t = Math.min(elapsed / ZOOM_ANIM_DURATION, 1);
    // easeInOut
    const easeT = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    controls.target.lerpVectors(zoomAnim.fromTarget, zoomAnim.toTarget, easeT);
    camera.position.lerpVectors(zoomAnim.fromCam, zoomAnim.toCam, easeT);
    controls.update();
    if (t < 1) {
        requestAnimationFrame(zoomAnimStep);
    } else {
        controls.target.copy(zoomAnim.toTarget);
        camera.position.copy(zoomAnim.toCam);
        controls.update();
        zoomAnim.animating = false;
    }
}

/**
 * 键盘事件处理
 */
function onKeyDown(event) {
    const currentTower = dualTowerSystem?.primaryTower;
    
    switch (event.code) {
        case 'Escape':
            // 检查并退出各种内部视图
            if (currentTower && currentTower.isInteriorView) {
                currentTower.showExterior();
                
                // 返回外部视角
                const targetPosition = new THREE.Vector3(0, 15, 0);
                const cameraPosition = new THREE.Vector3(50, 30, 50);
                
                animateCamera(cameraPosition, targetPosition);
            } else if (window.airCompressorRoom?.isInteriorView) {
                exitAirCompressorRoomInteriorView();
            } else if (window.electrostaticBagFilter?.isInteriorView) {
                exitElectrostaticBagFilterInteriorView();
            } else if (window.industrialBuilding?.isInteriorView) {
                exitIndustrialBuildingInteriorView();
            } else if (window.pumpHouse?.isInteriorView) {
                exitPumpHouseInteriorView();
            } else if (window.secondaryPumpHouse?.isInteriorView) {
                exitSecondaryPumpHouseInteriorView();
            }
            break;
        case 'KeyR':
            resetView();
            break;
        case 'KeyW':
            toggleWireframe();
            break;
        case 'KeyA':
            toggleAnimation();
            break;
    }
}

/**
 * 窗口大小调整
 */
function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * 相机动画
 */
function animateCamera(targetPosition, lookAtPosition) {
    const startPosition = camera.position.clone();
    const startLookAt = controls.target.clone();
    
    let progress = 0;
    const duration = 2000; // 2秒
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);
        
        // 使用缓动函数
        const easeProgress = 1 - Math.pow(1 - progress, 3);
        
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        controls.target.lerpVectors(startLookAt, lookAtPosition, easeProgress);
        controls.update();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        }
    };
    
    animate();
}

/**
 * 平滑相机动画（增强版）
 */
function animateCameraSmooth(targetPosition, lookAtPosition, duration = 2000) {
    const startPosition = camera.position.clone();
    const startLookAt = controls.target.clone();
    
    let progress = 0;
    const startTime = Date.now();
    
    const animate = () => {
        const elapsed = Date.now() - startTime;
        progress = Math.min(elapsed / duration, 1);
        
        // 使用更平滑的缓动函数（ease-in-out-cubic）
        const easeProgress = progress < 0.5 
            ? 4 * progress * progress * progress 
            : 1 - Math.pow(-2 * progress + 2, 3) / 2;
        
        camera.position.lerpVectors(startPosition, targetPosition, easeProgress);
        controls.target.lerpVectors(startLookAt, lookAtPosition, easeProgress);
        controls.update();
        
        if (progress < 1) {
            requestAnimationFrame(animate);
        } else {
            // 动画完成后的回调
            console.log('相机动画完成');
        }
    };
    
    animate();
}

/**
 * 显示临时提示
 */
function showTooltip(message, x, y) {
    // 创建或获取提示元素
    let tooltip = document.getElementById('temp-tooltip');
    if (!tooltip) {
        tooltip = document.createElement('div');
        tooltip.id = 'temp-tooltip';
        tooltip.style.cssText = `
            position: fixed;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-size: 14px;
            z-index: 10000;
            pointer-events: none;
            transition: opacity 0.3s ease;
        `;
        document.body.appendChild(tooltip);
    }
    
    tooltip.textContent = message;
    tooltip.style.left = x + 10 + 'px';
    tooltip.style.top = y - 30 + 'px';
    tooltip.style.opacity = '1';
    tooltip.style.display = 'block';
    
    // 3秒后自动隐藏
    setTimeout(() => {
        tooltip.style.opacity = '0';
        setTimeout(() => {
            tooltip.style.display = 'none';
        }, 300);
    }, 3000);
}

/**
 * 获取组件信息
 */
function getComponentInfo(object) {
    const parent = object.parent;
    
    if (object.name === 'mainTower') {
        // 根据当前视图状态返回不同的信息
        const currentTower = dualTowerSystem?.primaryTower;
        if (currentTower && currentTower.isInteriorView) {
            return '<strong>主脱硫塔</strong><br>高度: 30m<br>直径: 16m<br>当前视图: 内部';
        } else {
            return '<strong>主脱硫塔</strong><br>高度: 30m<br>直径: 16m<br>当前视图: 外部';
        }
    }
    

  
    
    return null;
}

/**
 * 获取组件名称
 */
function getComponentName(object) {
    let current = object;
    while (current) {
        if (current.name) {
            // 检查组件名称
            const componentNames = [
                'sprayLayers', 'demisters',
                'internalSupports', 'liquidCollection', 
                'processPipes'
            ];
            
            for (const component of componentNames) {
                if (current.name.includes(component) || current.name === component) {
                    return component;
                }
            }
            
            // 检查父级组件
            if (current.parent && current.parent.name) {
                for (const component of componentNames) {
                    if (current.parent.name.includes(component) || current.parent.name === component) {
                        return component;
                    }
                }
            }
        }
        current = current.parent;
    }
    return null;
}

/**
 * 显示对象详细信息
 */
function showObjectInfo(object) {
    const info = getComponentInfo(object);
    if (info) {
        const infoPanel = document.getElementById('info-panel');
        
        // 保存原始内容
        if (!window.originalInfoContent) {
            window.originalInfoContent = infoPanel.innerHTML;
        }
        
        infoPanel.innerHTML = `
            <h3>🔧 组件详情</h3>
            ${info}
            <br><br>
            <button id="return-btn" style="
                background: #007acc; 
                color: white; 
                border: none; 
                padding: 8px 16px; 
                border-radius: 4px; 
                cursor: pointer;
                font-size: 14px;
            ">返回</button>
        `;
        
        // 添加返回按钮事件监听器
        const returnBtn = document.getElementById('return-btn');
        if (returnBtn) {
            returnBtn.addEventListener('click', restoreInfoPanel);
        }
    }
}

/**
 * 高亮组件
 */
function highlightComponent(object) {
    // 清除之前的高亮
    clearHighlight();
    
    // 保存原始材质
    if (object.material) {
        object.userData.originalMaterial = object.material.clone();
        
        // 创建高亮材质
        const highlightMaterial = object.material.clone();
        highlightMaterial.emissive = new THREE.Color(0x444444);
        highlightMaterial.emissiveIntensity = 0.3;
        
        object.material = highlightMaterial;
        object.userData.highlighted = true;
        
        // 2秒后恢复原始材质
        setTimeout(() => {
            clearHighlight();
        }, 2000);
    }
}

/**
 * 清除高亮
 */
function clearHighlight() {
    scene.traverse((child) => {
        if (child.userData.highlighted) {
            if (child.userData.originalMaterial) {
                child.material = child.userData.originalMaterial;
                delete child.userData.originalMaterial;
            }
            delete child.userData.highlighted;
        }
    });
}

/**
 * 显示点击信息
 */
function showClickInfo(point, object) {
    console.log('点击位置:', point);
    console.log('点击对象:', object);
    
    // 更新状态显示
    const viewStatus = document.getElementById('view-status');
    if (viewStatus) {
        const currentTower = getCurrentInteriorTower();
        if (currentTower) {
            viewStatus.textContent = `内部 - ${currentTower.towerConfig.name}`;
        } else {
            viewStatus.textContent = '外部';
        }
    }
}

/**
 * 恢复信息面板
 */
function restoreInfoPanel() {
    const infoPanel = document.getElementById('info-panel');
    if (window.originalInfoContent && infoPanel) {
        infoPanel.innerHTML = window.originalInfoContent;
        // 清除保存的内容，以便下次重新保存
        window.originalInfoContent = null;
    }
}

/**
 * 重置视角
 */
function resetView() {
    const currentTower = getCurrentInteriorTower();
    if (currentTower) {
        // 内部视图 - 根据塔的位置调整视角
        const towerPosition = currentTower.towerConfig.position;
        const targetPosition = new THREE.Vector3(towerPosition.x, 15, towerPosition.z);
        const cameraPosition = new THREE.Vector3(towerPosition.x + 15, 15, towerPosition.z + 15);
        animateCamera(cameraPosition, targetPosition);
    } else {
        // 外部视图 - 显示整个双塔系统
        const targetPosition = new THREE.Vector3(0, 15, 0);
        const cameraPosition = new THREE.Vector3(50, 30, 50);
        animateCamera(cameraPosition, targetPosition);
    }
}

/**
 * 切换线框模式
 */
function toggleWireframe() {
    const currentTower = getCurrentInteriorTower();
    if (currentTower) {
        // 只对当前内部视图的塔切换线框模式
        currentTower.toggleWireframe();
    } else if (dualTowerSystem) {
        // 外部视图时，对两个塔都切换线框模式
        if (dualTowerSystem.primaryTower) {
            dualTowerSystem.primaryTower.toggleWireframe();
        }
        if (dualTowerSystem.secondaryTower) {
            dualTowerSystem.secondaryTower.toggleWireframe();
        }
    }
}

/**
 * 切换动画
 */
function toggleAnimation() {
    isAnimationEnabled = !isAnimationEnabled;
    const button = event.target;
    button.textContent = isAnimationEnabled ? '动画开关' : '动画已关闭';
}

/**
 * 导出模型
 */
function exportModel() {
    const currentTower = getCurrentInteriorTower();
    if (currentTower) {
        // 导出当前内部视图的塔
        currentTower.exportModel();
    } else if (dualTowerSystem) {
        // 外部视图时，导出整个双塔系统
        // 这里可以添加双塔系统的导出逻辑
        console.log('导出双塔系统模型');
    }
}

/**
 * 渲染循环
 */
function animate() {
    requestAnimationFrame(animate);
    
    // 更新控制器
    controls.update();
    
    // 更新锅炉火焰动画
    if (window.boiler && typeof window.boiler.updateFlameAnimation === 'function') {
        window.boiler.updateFlameAnimation();
    }
    
    // 更新标签朝向
    const currentTower = getCurrentInteriorTower();
    if (currentTower) {
        const labels = currentTower.components.get('componentLabels');
        if (labels && labels.visible) {
            labels.children.forEach(label => {
                label.lookAt(camera.position);
            });
        }
    }
    
    // 更新动画
    if (isAnimationEnabled && dualTowerSystem) {
        // 更新两个塔的动画
        if (dualTowerSystem.primaryTower) {
            dualTowerSystem.primaryTower.animationMixers.forEach(mixer => {
                mixer.update(0.016);
            });
        }
        if (dualTowerSystem.secondaryTower) {
            dualTowerSystem.secondaryTower.animationMixers.forEach(mixer => {
                mixer.update(0.016);
            });
        }
    }
    
    // 渲染场景
    // 动态更新所有标准标签尺寸，解决远距离观察模糊
    if (typeof updateAllLabels === 'function') {
        updateAllLabels(camera);
    }
    renderer.render(scene, camera);
    
    // 更新性能统计
    updateStats();
}

/**
 * 更新性能统计
 */
function updateStats() {
    const now = performance.now();
    stats.frameCount++;
    
    if (now >= stats.lastTime + 1000) {
        stats.fps = Math.round((stats.frameCount * 1000) / (now - stats.lastTime));
        stats.frameCount = 0;
        stats.lastTime = now;
        
        // 更新FPS显示
        const fpsElement = document.getElementById('fps-counter');
        if (fpsElement) {
            fpsElement.textContent = stats.fps;
            fpsElement.style.color = stats.fps >= 50 ? '#00ff88' : stats.fps >= 30 ? '#ffaa00' : '#ff4444';
        }
    }
}

/**
 * 更新对象计数
 */
function updateObjectCount() {
    let count = 0;
    scene.traverse(() => count++);
    stats.objectCount = count;
    
    const objectElement = document.getElementById('object-counter');
    if (objectElement) {
        objectElement.textContent = count;
    }
}

/**
 * 更新加载进度
 */
function updateProgress(percent, message) {
    loadingProgress = percent;
    const progressFill = document.getElementById('progress');
    const loadingElement = document.getElementById('loading');
    
    if (progressFill) {
        progressFill.style.width = percent + '%';
    }
    
    if (loadingElement && message) {
        loadingElement.innerHTML = `
            <div>${message}</div>
            <div style="margin-top: 10px; font-size: 14px; opacity: 0.8;">
                ${percent}% 完成
            </div>
        `;
    }
}

/**
 * 全屏功能
 */
function toggleFullscreen() {
    if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen().then(() => {
            console.log('进入全屏模式');
        }).catch(err => {
            console.log('全屏模式失败:', err);
        });
    } else {
        document.exitFullscreen().then(() => {
            console.log('退出全屏模式');
        });
    }
}

/**
 * 显示帮助信息
 */
function showHelp() {
    const helpContent = `
        <div style="max-height: 400px; overflow-y: auto;">
            <h3>🎮 操作指南</h3>
            
            <h4>🖱️ 鼠标操作</h4>
            <ul>
                <li><strong>左键拖拽</strong>：旋转视角</li>
                <li><strong>滚轮</strong>：缩放视图</li>
                <li><strong>左键点击</strong>：选择组件/进入内部</li>
                <li><strong>鼠标悬停</strong>：显示组件信息</li>
            </ul>
            
            <h4>⌨️ 键盘快捷键</h4>
            <ul>
                <li><strong>ESC</strong>：返回外部视图</li>
                <li><strong>R</strong>：重置视角</li>
                <li><strong>W</strong>：切换线框模式</li>
                <li><strong>A</strong>：动画开关</li>
                <li><strong>F</strong>：全屏模式</li>
            </ul>
            
            <h4>🏭 脱硫塔组件</h4>
            <ul>
                <li><strong>主塔体</strong>：点击进入内部视图</li>
                <li><strong>喷淋层</strong>：3层喷淋系统，120个喷嘴</li>
                <li><strong>除雾器</strong>：2层丝网除雾器</li>
                <li><strong>填料层</strong>：增加气液接触面积</li>
                <li><strong>分布器</strong>：均匀分布气体和液体</li>
            </ul>
            
            <h4>🎨 视觉效果</h4>
            <ul>
                <li><strong>动画效果</strong>：喷雾、液体流动、气体流动</li>
                <li><strong>材质渲染</strong>：金属、玻璃、液体材质</li>
                <li><strong>光照系统</strong>：多光源真实照明</li>
                <li><strong>环境背景</strong>：工业场景模拟</li>
            </ul>
            
            <div style="margin-top: 20px; padding: 10px; background: rgba(0, 212, 255, 0.1); border-radius: 5px;">
                <strong>💡 提示</strong>：点击主塔体可进入内部查看精细化结构！
            </div>
        </div>
        
        <button id="help-close-btn" style="
            background: #007acc; 
            color: white; 
            border: none; 
            padding: 8px 16px; 
            border-radius: 5px; 
            cursor: pointer;
            margin-top: 15px;
            width: 100%;
        ">关闭帮助</button>
    `;
    
    const infoPanel = document.getElementById('info-panel');
    window.originalInfoContent = infoPanel.innerHTML;
    infoPanel.innerHTML = helpContent;
    
    // 添加关闭按钮事件监听器
    const helpCloseBtn = document.getElementById('help-close-btn');
    if (helpCloseBtn) {
        helpCloseBtn.addEventListener('click', restoreInfoPanel);
    }
}

/**
 * 自动旋转功能
 */
function toggleAutoRotate() {
    controls.autoRotate = !controls.autoRotate;
    const button = event.target;
    button.textContent = controls.autoRotate ? '🔄 停止旋转' : '🔄 自动旋转';
}

/**
 * 截图功能
 */
function takeScreenshot() {
    const link = document.createElement('a');
    link.download = `脱硫塔_${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.png`;
    link.href = renderer.domElement.toDataURL();
    link.click();
}

/**
 * 性能优化切换
 */
function togglePerformanceMode() {
    const isHighPerf = renderer.getPixelRatio() > 1;
    
    if (isHighPerf) {
        // 切换到性能模式
        renderer.setPixelRatio(1);
        renderer.shadowMap.enabled = false;
        scene.fog = null;
        console.log('切换到性能模式');
    } else {
        // 切换到质量模式
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.shadowMap.enabled = true;
        scene.fog = new THREE.Fog(0x87CEEB, 50, 200);
        console.log('切换到质量模式');
    }
}

/**
 * 键盘事件增强
 */
function onKeyDownEnhanced(event) {
    const currentTower = getCurrentInteriorTower();
    
    switch (event.code) {
        case 'Escape':
            if (currentTower) {
                console.log(`退出${currentTower.towerConfig.name}内部视图`);
                currentTower.showExterior();
                // 返回外部视图，显示整个双塔系统
                const targetPosition = new THREE.Vector3(0, 15, 0);
                const cameraPosition = new THREE.Vector3(50, 30, 50);
                animateCamera(cameraPosition, targetPosition);
            } else if (window.pumpHouse && window.pumpHouse.isInteriorView) {
                console.log('退出一级塔泵房内部视图');
                exitPumpHouseInteriorView();
            } else if (window.secondaryPumpHouse && window.secondaryPumpHouse.isInteriorView) {
                console.log('退出二级塔泵房内部视图');
                exitSecondaryPumpHouseInteriorView();
            } else if (window.industrialBuilding && window.industrialBuilding.isInteriorView) {
                console.log('退出工业综合楼内部视图');
                exitIndustrialBuildingInteriorView();
            } else if (window.waterPumpHouse && window.waterPumpHouse.isInteriorView) {
                console.log('退出水泵房内部视图');
                exitWaterPumpHouseInteriorView();
            } else if (window.airCompressorRoom && window.airCompressorRoom.isInteriorView) {
                console.log('退出空压机房内部视图');
                exitAirCompressorRoomInteriorView();
            } else if (window.electrostaticBagFilter && window.electrostaticBagFilter.isInteriorView) {
                console.log('退出电袋除尘器内部视图');
                exitElectrostaticBagFilterInteriorView();

            } else if (window.boiler && window.boiler.isInteriorView) {
                console.log('退出锅炉内部视图');
                exitBoilerInteriorView();
            } else if (window.boilerFlue && window.boilerFlue.isInteriorView) {
                console.log('退出锅炉烟道内部视图');
                exitBoilerFlueInteriorView();
            }
            break;
        case 'KeyR':
            resetView();
            break;
        case 'KeyW':
            toggleWireframe();
            break;
        case 'KeyA':
            toggleAnimation();
            break;
        case 'KeyF':
            toggleFullscreen();
            break;
        case 'KeyH':
            showHelp();
            break;
        case 'KeyS':
            if (event.ctrlKey) {
                event.preventDefault();
                takeScreenshot();
            }
            break;
        case 'KeyP':
            togglePerformanceMode();
            break;
    }
}

function getDefaultTarget() {
    // 外部和内部中心都为(0, 15, 0)，如需自定义可修改
    return new THREE.Vector3(0, 15, 0);
}

/**
 * 创建泵房外部管道连接
 */
function createPumpHousePipes(pumpHouse) {
    try {
        const pumpConnections = pumpHouse.getPumpConnectionPoints();
        const pumpHousePos = pumpHouse.config.position;
        
        // 创建浆液循环泵到一级塔的管道连接
        // 循环泵1 → 一级塔第一层喷淋层 (高度约17米) - 从第一根竖向进水支管顶部开始
        const circulation1Connection = new PipeConnection({
            name: '循环泵1→一级塔喷淋层1',
            startPoint: { 
                x: pumpHousePos.x - 6, // 第一根竖向进水支管的x位置
                y: 3.05, // 竖向进水支管顶部高度（1.8 + 2.5/2 = 3.05）
                z: pumpHousePos.z - 1 // 竖向进水支管的z位置
            },
            endPoint: { x: -5, y: 17, z: -3 }, // 一级塔第一层喷淋（17米高度）
            pipeRadius: 0.2,
            pipeColor: 0x7C3AED, // 紫色，表示浆液
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(circulation1Connection.group);
        
        // 循环泵2 → 一级塔第二层喷淋层 (高度约20米) - 从第二根竖向进水支管顶部开始
        const circulation2Connection = new PipeConnection({
            name: '循环泵2→一级塔喷淋层2',
            startPoint: { 
                x: pumpHousePos.x - 2, // 第二根竖向进水支管的x位置
                y: 3.05, // 竖向进水支管顶部高度（1.8 + 2.5/2 = 3.05）
                z: pumpHousePos.z - 1 // 竖向进水支管的z位置
            },
            endPoint: { x: -5, y: 20, z: 3 }, // 一级塔第二层喷淋（20米高度）
            pipeRadius: 0.2,
            pipeColor: 0x7C3AED,
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(circulation2Connection.group);
        
        // 循环泵3 → 一级塔第三层喷淋层 (高度约23米) - 从第三根竖向进水支管顶部开始
        const circulation3Connection = new PipeConnection({
            name: '循环泵3→一级塔喷淋层3',
            startPoint: { 
                x: pumpHousePos.x + 2, // 第三根竖向进水支管的x位置
                y: 3.05, // 竖向进水支管顶部高度（1.8 + 2.5/2 = 3.05）
                z: pumpHousePos.z - 1 // 竖向进水支管的z位置
            },
            endPoint: { x: 5, y: 23, z: 0 }, // 一级塔第三层喷淋（23米高度）
            pipeRadius: 0.2,
            pipeColor: 0x7C3AED,
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(circulation3Connection.group);
        
        // 一级塔底部 → 循环泵1进水管道
        const towerToCirculation1Inlet = new PipeConnection({
            name: '一级塔底部→循环泵1进水',
            startPoint: { x: -8, y: 2, z: -5 }, // 一级塔底部出浆口1
            endPoint: { 
                x: pumpHousePos.x - 6, // 循环泵1左侧进水支管位置
                y: 1.8, 
                z: pumpHousePos.z - 1 
            }, // 循环泵1左侧进水支管
            pipeRadius: 0.25,
            pipeColor: 0x8B5CF6, // 深紫色，表示待处理浆液
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(towerToCirculation1Inlet.group);
        
        // 一级塔底部 → 循环泵2进水管道
        const towerToCirculation2Inlet = new PipeConnection({
            name: '一级塔底部→循环泵2进水',
            startPoint: { x: -4, y: 2, z: -5 }, // 一级塔底部出浆口2
            endPoint: { 
                x: pumpHousePos.x - 2, // 循环泵2左侧进水支管位置
                y: 1.8, 
                z: pumpHousePos.z - 1 
            }, // 循环泵2左侧进水支管
            pipeRadius: 0.25,
            pipeColor: 0x8B5CF6, // 深紫色，表示待处理浆液
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(towerToCirculation2Inlet.group);
        
        // 一级塔底部 → 循环泵3进水管道
        const towerToCirculation3Inlet = new PipeConnection({
            name: '一级塔底部→循环泵3进水',
            startPoint: { x: 0, y: 2, z: -5 }, // 一级塔底部出浆口3
            endPoint: { 
                x: pumpHousePos.x + 2, // 循环泵3左侧进水支管位置
                y: 1.8, 
                z: pumpHousePos.z - 1 
            }, // 循环泵3左侧进水支管
            pipeRadius: 0.25,
            pipeColor: 0x8B5CF6, // 深紫色，表示待处理浆液
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(towerToCirculation3Inlet.group);
        
        // 排浆泵管道连接：从一级塔底部进浆，向外排出废浆
        // 一级塔底部 → 排浆泵1进浆口
        const towerToDrainage1Inlet = new PipeConnection({
            name: '一级塔底部→排浆泵1进浆',
            startPoint: { x: -2, y: 1.5, z: -5 }, // 一级塔底部废浆出口1
            endPoint: { 
                x: pumpHousePos.x + pumpConnections.drainage[0].inletPosition.x, 
                y: pumpConnections.drainage[0].inletPosition.y, 
                z: pumpHousePos.z + pumpConnections.drainage[0].inletPosition.z 
            },
            pipeRadius: 0.2,
            pipeColor: 0x8B5CF6, // 深紫色，表示待处理浆液
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(towerToDrainage1Inlet.group);
        
        // 一级塔底部 → 排浆泵2进浆口
        const towerToDrainage2Inlet = new PipeConnection({
            name: '一级塔底部→排浆泵2进浆',
            startPoint: { x: 2, y: 1.5, z: -5 }, // 一级塔底部废浆出口2
            endPoint: { 
                x: pumpHousePos.x + pumpConnections.drainage[1].inletPosition.x, 
                y: pumpConnections.drainage[1].inletPosition.y, 
                z: pumpHousePos.z + pumpConnections.drainage[1].inletPosition.z 
            },
            pipeRadius: 0.2,
            pipeColor: 0x8B5CF6, // 深紫色，表示待处理浆液
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(towerToDrainage2Inlet.group);
        
        // 排浆泵出口管道 - 后续设计
        // TODO: 排浆泵出口管道将在后续阶段设计
        
        console.log('泵房外部管道连接创建完成');
        
    } catch (error) {
        console.error('泵房管道连接创建失败:', error);
    }
}

/**
 * 创建二级塔泵房外部管道连接
 */
function createSecondaryPumpHousePipes(pumpHouse) {
    try {
        const pumpConnections = pumpHouse.getPumpConnectionPoints();
        const pumpHousePos = pumpHouse.config.position;
        
        // 创建二级塔循环泵到二级塔的管道连接（参考一级塔泵房实现方式）
        // 循环泵1 → 二级塔第一层喷淋层 (高度约17米) - 从第一根竖向进水支管顶部开始
        const secondaryPump1ToTower = new PipeConnection({
            name: '二级塔循环泵1→二级塔喷淋层1',
            startPoint: { 
                x: pumpHousePos.x - 6, // 第一根竖向进水支管的x位置
                y: 3.05, // 竖向进水支管顶部高度（1.8 + 2.5/2 = 3.05）
                z: pumpHousePos.z - 1 // 竖向进水支管的z位置
            },
            endPoint: { x: 45, y: 17, z: -8 }, // 二级塔第一层喷淋层（避开旋转楼梯）
            pipeRadius: 0.2,
            pipeColor: 0x27AE60, // 绿色，表示循环水
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(secondaryPump1ToTower.group);
        
        // 循环泵2 → 二级塔第二层喷淋层 (高度约20米) - 从第二根竖向进水支管顶部开始
        const secondaryPump2ToTower = new PipeConnection({
            name: '二级塔循环泵2→二级塔喷淋层2',
            startPoint: { 
                x: pumpHousePos.x - 2, // 第二根竖向进水支管的x位置
                y: 3.05, // 竖向进水支管顶部高度（1.8 + 2.5/2 = 3.05）
                z: pumpHousePos.z - 1 // 竖向进水支管的z位置
            },
            endPoint: { x: 45, y: 20, z: -6 }, // 二级塔第二层喷淋层（避开旋转楼梯）
            pipeRadius: 0.2,
            pipeColor: 0x27AE60, // 绿色，表示循环水
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(secondaryPump2ToTower.group);
        
        // 循环泵3 → 二级塔第三层喷淋层 (高度约23米) - 从第三根竖向进水支管顶部开始
        const secondaryPump3ToTower = new PipeConnection({
            name: '二级塔循环泵3→二级塔喷淋层3',
            startPoint: { 
                x: pumpHousePos.x + 2, // 第三根竖向进水支管的x位置
                y: 3.05, // 竖向进水支管顶部高度（1.8 + 2.5/2 = 3.05）
                z: pumpHousePos.z - 1 // 竖向进水支管的z位置
            },
            endPoint: { x: 45, y: 23, z: -4 }, // 二级塔第三层喷淋层（避开旋转楼梯）
            pipeRadius: 0.2,
            pipeColor: 0x27AE60, // 绿色，表示循环水
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(secondaryPump3ToTower.group);
        
        // 二级塔底部 → 循环泵1进水管道（参考一级塔泵房实现方式）
        const secondaryTowerToPump1 = new PipeConnection({
            name: '二级塔底部→循环泵1进水',
            startPoint: { x: 47, y: 2, z: -10 }, // 二级塔底部废浆出口1（避开旋转楼梯）
            endPoint: { 
                x: pumpHousePos.x - 6, // 循环泵1左侧进水支管位置
                y: 1.8, 
                z: pumpHousePos.z - 1 
            }, // 循环泵1左侧进水支管
            pipeRadius: 0.25,
            pipeColor: 0x3498DB, // 蓝色，表示待处理浆液
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(secondaryTowerToPump1.group);
        
        // 二级塔底部 → 循环泵2进水管道
        const secondaryTowerToPump2 = new PipeConnection({
            name: '二级塔底部→循环泵2进水',
            startPoint: { x: 45, y: 2, z: -8 }, // 二级塔底部废浆出口2（避开旋转楼梯）
            endPoint: { 
                x: pumpHousePos.x - 2, // 循环泵2左侧进水支管位置
                y: 1.8, 
                z: pumpHousePos.z - 1 
            }, // 循环泵2左侧进水支管
            pipeRadius: 0.25,
            pipeColor: 0x3498DB, // 蓝色，表示待处理浆液
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(secondaryTowerToPump2.group);
        
        // 二级塔底部 → 循环泵3进水管道
        const secondaryTowerToPump3 = new PipeConnection({
            name: '二级塔底部→循环泵3进水',
            startPoint: { x: 43, y: 2, z: -6 }, // 二级塔底部废浆出口3（避开旋转楼梯）
            endPoint: { 
                x: pumpHousePos.x + 2, // 循环泵3左侧进水支管位置
                y: 1.8, 
                z: pumpHousePos.z - 1 
            }, // 循环泵3左侧进水支管
            pipeRadius: 0.25,
            pipeColor: 0x3498DB, // 蓝色，表示待处理浆液
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(secondaryTowerToPump3.group);
        
        console.log('二级塔泵房外部管道连接创建完成');
        
    } catch (error) {
        console.error('二级塔泵房管道连接创建失败:', error);
    }
}

// 一体化石膏输送系统无需单独的管道连接函数

/**
 * 创建工业综合楼标签（参考一级脱硫塔标签实现）
 * @param {THREE.Group} buildingGroup - 综合楼的组对象
 * @param {string} labelText - 标签文本
 * @param {Object} position - 标签位置 {x, y, z}
 * @param {string} color - 标签颜色
 */
function createIndustrialBuildingLabel(buildingGroup, labelText, position, color = '#FFFFFF') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 320; // 增大画布宽度以适应更大字体
    canvas.height = 100; // 增大高度以适应40px字体
    
    // 设置字体和样式
    context.font = 'Bold 40px Microsoft YaHei, Arial'; // 大幅增大字体以便远距离清晰显示
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // 绘制背景 - 圆角矩形
    context.fillStyle = 'rgba(0, 0, 0, 0.8)'; // 更明显的背景
    roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
    context.fill();
    
    // 绘制边框
    context.strokeStyle = color;
    context.lineWidth = 3; // 增大边框宽度匹配更大的标签
    roundRect(context, 10, 10, canvas.width - 20, canvas.height - 20, 10);
    context.stroke();
    
    // 绘制文字
    context.fillStyle = color;
    context.fillText(labelText, canvas.width / 2, canvas.height / 2);
    
    // 创建纹理
    const texture = new THREE.CanvasTexture(canvas);
    texture.needsUpdate = true;
    
    // 创建材质
    const material = new THREE.SpriteMaterial({
        map: texture,
        transparent: true,
        opacity: 0.95,
        alphaTest: 0.01 // 避免透明度问题
    });
    // 确保标签不被其它几何遮挡，并始终清晰可见
    material.depthTest = false;
    material.depthWrite = false;
    
    // 创建精灵
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(15, 4, 1); // 进一步增大标签尺寸
    sprite.position.set(position.x, position.y, position.z);
    sprite.renderOrder = 10000; // 提高渲染顺序，避免被遮挡
    sprite.name = `buildingLabel_${labelText}`;
    
    // 添加到建筑组
    buildingGroup.add(sprite);
    
    console.log(`✓ 创建${labelText}标签完成`);
    return sprite;
}

/**
 * 绘制圆角矩形
 */
function roundRect(ctx, x, y, width, height, radius) {
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
 * 创建回收水泵#2到制浆设备中部的管道连接
 */
function createRecyclePumpToSlurryTankConnection() {
    try {
        console.log('开始创建回收水泵#2到制浆设备中部的管道连接...');
        
        // 回收水泵#2的位置
        const recyclePump2Pos = { x: -46, y: 0.5, z: 58 };
        
        // 计算制浆设备位置（基于main.js中的计算逻辑）
        const tankCenterX = (-50 + -30) / 2; // 两个水箱X坐标中心点：-40
        const tankCenterZ = 70; // 两个水箱Z坐标
        const angle45 = Math.PI / 4;
        const distance = 6;
        const slurryTankX = tankCenterX + Math.cos(angle45) * distance + 50; // 向X轴正方向移动50个单位
        const slurryTankZ = tankCenterZ + Math.sin(angle45) * distance;
        
        // 制浆设备的中部位置（根据SlurryTank设计，主锥结构高度14米，中部约7米高）
        const slurryTankMiddlePos = {
            x: slurryTankX,
            y: 7, // 制浆设备中部高度
            z: slurryTankZ
        };
        
        // 回收水泵#2的出水口位置（考虑180度旋转）
        const pump2OutletPos = {
            x: recyclePump2Pos.x - 2.7, // 旋转180度后，出水口在泵的左侧
            y: recyclePump2Pos.y + 0.5, // 出水口高度
            z: recyclePump2Pos.z
        };
        
        // 创建分段管道避免穿模，使用三段式管道路径
        // 第一段：从泵出口向上升高
        const intermediatePoint1 = {
            x: pump2OutletPos.x,
            y: pump2OutletPos.y + 8, // 升高8米避开障碍物
            z: pump2OutletPos.z
        };
        
        const pipe1 = new PipeConnection({
            name: '回收水泵#2→上升段',
            startPoint: pump2OutletPos,
            endPoint: intermediatePoint1,
            pipeRadius: 0.15,
            pipeColor: 0x1E88E5, // 深蓝色，表示回收水
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(pipe1.group);
        
        // 第二段：向制浆设备方向平滑弯曲，绕开水箱区域
        // 选择一个中间点，在水箱南侧但不过于偏离直线路径
        const intermediatePoint2 = {
            x: pump2OutletPos.x + (slurryTankMiddlePos.x - pump2OutletPos.x) * 0.4, // 40%距离处
            y: intermediatePoint1.y, // 保持高度
            z: 45 // 在水箱南侧，但不过分偏离
        };
        
        const pipe2 = new PipeConnection({
            name: '回收水泵#2→弯曲段',
            startPoint: intermediatePoint1,
            endPoint: intermediatePoint2,
            pipeRadius: 0.15,
            pipeColor: 0x1E88E5,
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(pipe2.group);
        
        // 第三段：从中间点下降到制浆设备中部，形成自然弯曲
        const pipe3 = new PipeConnection({
            name: '回收水泵#2→制浆设备',
            startPoint: intermediatePoint2,
            endPoint: slurryTankMiddlePos,
            pipeRadius: 0.15,
            pipeColor: 0x1E88E5,
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(pipe3.group);
        
        console.log('✓ 回收水泵#2到制浆设备中部管道连接创建完成');
        console.log('泵2出口位置:', pump2OutletPos, '→', '制浆设备中部:', slurryTankMiddlePos);
        
    } catch (error) {
        console.error('回收水泵#2到制浆设备管道连接创建失败:', error);
    }
}

/**
 * 创建石膏旋流器到回收水箱的简单管道连接 - 使用标签定位方法
 */
function createGypsumCycloneToTankConnection() {
    try {
        console.log('🔧 开始创建石膏旋流器到回收水箱的管道连接（使用标签定位）...');
        
        // 检查设备实例是否存在
        console.log('📋 检查设备实例:');
        console.log('  - window.gypsumCyclone:', !!window.gypsumCyclone);
        console.log('  - window.recycleFilterTank:', !!window.recycleFilterTank);
        console.log('  - scene对象数量:', scene.children.length);
        
        if (!window.gypsumCyclone) {
            console.error('❌ 石膏旋流器实例未找到');
            console.log('🔍 尝试在场景中查找石膏旋流器...');
            scene.traverse((child) => {
                if (child.name && child.name.includes('石膏旋流器')) {
                    console.log('  找到石膏旋流器相关对象:', child.name);
                }
            });
            return;
        }
        
        if (!window.recycleFilterTank) {
            console.error('❌ 回收水箱实例未找到');
            console.log('🔍 尝试在场景中查找回收水箱...');
            scene.traverse((child) => {
                if (child.name && child.name.includes('回收')) {
                    console.log('  找到回收相关对象:', child.name);
                }
            });
            return;
        }
        
        // 使用标签定位方法查找石膏旋流器的出水口标签
        console.log('🔍 开始查找石膏旋流器出水口标签...');
        const gypsumCycloneGroup = window.gypsumCyclone.getGroup();
        console.log('  - 石膏旋流器组对象数量:', gypsumCycloneGroup.children.length);
        
        // 列出所有子对象的名称
        console.log('📋 石膏旋流器组中的所有对象:');
        gypsumCycloneGroup.traverse((child) => {
            if (child.name) {
                console.log('  - ' + child.name);
            }
        });
        
        let outletObject = gypsumCycloneGroup.getObjectByName('出水口连接管');
        console.log('  - 查找出水口连接管:', !!outletObject);
        
        if (!outletObject) {
            console.log('🔍 未找到出水口连接管，尝试查找出水口法兰...');
            outletObject = gypsumCycloneGroup.getObjectByName('出水口法兰');
            console.log('  - 查找出水口法兰:', !!outletObject);
        }
        
        if (!outletObject) {
            console.log('🔍 未找到出水口法兰，遍历查找包含"出水口"的对象...');
            // 遍历查找包含"出水口"的对象
            gypsumCycloneGroup.traverse((child) => {
                if (child.name && child.name.includes('出水口') && !outletObject) {
                    outletObject = child;
                    console.log('📍 找到出水口相关对象:', child.name);
                }
            });
        }
        
        if (!outletObject) {
            console.error('❌ 未找到石膏旋流器出水口相关对象');
            console.log('🔍 尝试使用固定坐标作为备选方案...');
            
            // 使用石膏旋流器的固定出水口坐标作为备选
            const cyclonePos = gypsumCycloneGroup.position;
            const cycloneScale = gypsumCycloneGroup.scale;
            const fixedOutletPos = {
                x: cyclonePos.x,
                y: cyclonePos.y - 1.5 * cycloneScale.y, // 出水口在底部
                z: cyclonePos.z
            };
            
            console.log('📍 使用固定出水口位置:', fixedOutletPos);
            
            // 获取回收水箱位置
            const tankPos = window.recycleFilterTank.group.position;
            const tankMiddlePos = {
                x: tankPos.x,
                y: tankPos.y + window.recycleFilterTank.tankConfig.height / 2,
                z: tankPos.z
            };
            
            // 创建管道连接
            const connectionPipe = new PipeConnection({
                name: '石膏旋流器→回收水箱（固定坐标）',
                startPoint: fixedOutletPos,
                endPoint: tankMiddlePos,
                pipeRadius: 0.15,
                pipeColor: 0xE0E0E0,
                showFlow: true,
                flowDirection: 'forward'
            });
            
            scene.add(connectionPipe.group);
            console.log('✅ 使用固定坐标创建管道连接成功！');
            return;
        }
        
        // 获取出水口对象的世界位置
        const outletWorldPos = new THREE.Vector3();
        outletObject.getWorldPosition(outletWorldPos);
        console.log('🎯 石膏旋流器出水口位置（标签定位）:', outletWorldPos);
        
        // 查找回收水箱的中部位置
        const tankGroup = window.recycleFilterTank.group;
        let tankCenterObject = tankGroup.getObjectByName('回收水箱');
        
        let tankMiddlePos;
        if (tankCenterObject) {
            // 如果找到主标签，使用其位置作为参考
            const labelWorldPos = new THREE.Vector3();
            tankCenterObject.getWorldPosition(labelWorldPos);
            tankMiddlePos = {
                x: labelWorldPos.x,
                y: labelWorldPos.y - 2, // 稍微向下调整到水箱中部
                z: labelWorldPos.z
            };
            console.log('📍 使用回收水箱主标签位置');
        } else {
            // 使用水箱的几何中心
            const tankPos = window.recycleFilterTank.group.position;
            tankMiddlePos = {
                x: tankPos.x,
                y: tankPos.y + window.recycleFilterTank.tankConfig.height / 2,
                z: tankPos.z
            };
            console.log('📍 使用回收水箱几何中心位置');
        }
        
        console.log('🎯 回收水箱中部位置（标签定位）:', tankMiddlePos);
        
        // 创建简单的白色工业管道连接
        console.log('🔨 创建管道连接...');
        console.log('  - 起点:', {x: outletWorldPos.x, y: outletWorldPos.y, z: outletWorldPos.z});
        console.log('  - 终点:', tankMiddlePos);
        
        const connectionPipe = new PipeConnection({
            name: '石膏旋流器→回收水箱',
            startPoint: {
                x: outletWorldPos.x,
                y: outletWorldPos.y,
                z: outletWorldPos.z
            },
            endPoint: tankMiddlePos,
            pipeRadius: 0.15,
            pipeColor: 0xE0E0E0, // 白色工业管道
            showFlow: true,
            flowDirection: 'forward'
        });
        
        console.log('  - 管道对象创建完成:', !!connectionPipe);
        console.log('  - 管道组对象:', !!connectionPipe.group);
        console.log('  - 管道组子对象数量:', connectionPipe.group.children.length);
        
        scene.add(connectionPipe.group);
        console.log('  - 管道已添加到场景');
        console.log('  - 场景对象总数:', scene.children.length);
        
        // 验证管道是否真的在场景中
        let pipeFoundInScene = false;
        scene.traverse((child) => {
            if (child.name && child.name.includes('石膏旋流器→回收水箱')) {
                pipeFoundInScene = true;
                console.log('  - 在场景中找到管道:', child.name);
            }
        });
        
        if (!pipeFoundInScene) {
            console.warn('⚠️ 管道未在场景中找到，可能存在问题');
        }
        
        console.log('✅ 石膏旋流器到回收水箱管道连接创建完成！');
        
        // 计算管道长度
        const distance = Math.sqrt(
            Math.pow(tankMiddlePos.x - outletWorldPos.x, 2) +
            Math.pow(tankMiddlePos.y - outletWorldPos.y, 2) +
            Math.pow(tankMiddlePos.z - outletWorldPos.z, 2)
        );
        console.log('📏 管道长度:', distance.toFixed(2), '米');
        
        // 检查管道是否可见
        if (connectionPipe.group.visible) {
            console.log('👁️ 管道可见性: true');
        } else {
            console.warn('👁️ 管道可见性: false - 这可能是管道不显示的原因！');
        }
        
    } catch (error) {
        console.error('❌ 石膏旋流器到回收水箱管道连接创建失败:', error);
        console.error('错误详情:', error.stack);
    }
}

/**
 * 使用标签定位：石膏旋流器“入浆口” → 一级塔泵房“排浆泵 1 / 排浆泵 2”
 * - 起点：工业综合楼二层内石膏旋流器的入浆口（通过名称包含“入浆口”的对象）
 * - 终点：一级塔泵房内部的排浆泵 1、排浆泵 2 标签所在位置的稍下方（近似泵中部高度）
 */
function createCycloneInletToDrainagePumpsConnection() {
    try {
        console.log('🔧 开始创建 石膏旋流器入浆口 → 排浆泵1/2 的管道（标签定位）...');

        // 基本实例检查
        if (!window.industrialBuilding || !window.pumpHouse) {
            console.warn('❌ 缺少必要实例：', {
                industrialBuilding: !!window.industrialBuilding,
                pumpHouse: !!window.pumpHouse
            });
            return;
        }
        if (!window.gypsumCyclone) {
            console.warn('❌ 石膏旋流器实例未准备好');
            return;
        }

        // 1) 起点：石膏旋流器入浆口（通过标签名称查找）
        const cycloneGroup = window.gypsumCyclone.getGroup();
        let inletObject = cycloneGroup.getObjectByName('入浆口连接管')
            || cycloneGroup.getObjectByName('入浆口法兰');
        if (!inletObject) {
            cycloneGroup.traverse(child => {
                if (!inletObject && child.name && child.name.includes('入浆口')) inletObject = child;
            });
        }
        if (!inletObject) {
            console.error('❌ 未找到石膏旋流器入浆口相关对象');
            return;
        }
        const inletWorld = new THREE.Vector3();
        inletObject.getWorldPosition(inletWorld);
        console.log('🎯 入浆口位置:', inletWorld);

        // 2) 终点：泵房内部 排浆泵 1 / 排浆泵 2 标签
        const pumpInterior = window.pumpHouse.interiorGroup;
        if (!pumpInterior) {
            console.error('❌ 泵房内部组未创建');
            return;
        }

        const label1 = pumpInterior.getObjectByName('pumpLabel_排浆泵_1');
        const label2 = pumpInterior.getObjectByName('pumpLabel_排浆泵_2');
        if (!label1 || !label2) {
            console.warn('⚠️ 未找到排浆泵标签:', { has1: !!label1, has2: !!label2 });
        }

        const targets = [];
        if (label1) targets.push({ label: label1, name: '排浆泵1' });
        if (label2) targets.push({ label: label2, name: '排浆泵2' });
        if (targets.length === 0) {
            console.error('❌ 无可用的排浆泵标签，取消连管');
            return;
        }

        // 3) 为每个目标创建一根白色工业管道
        targets.forEach(({ label, name }) => {
            const labelWorld = new THREE.Vector3();
            label.getWorldPosition(labelWorld);

            // 略微下移，使连接点更贴近泵体中部
            const endPoint = { x: labelWorld.x, y: labelWorld.y - 2.0, z: labelWorld.z };

            const pipe = new PipeConnection({
                name: `石膏旋流器入浆口→${name}`,
                startPoint: { x: inletWorld.x, y: inletWorld.y, z: inletWorld.z },
                endPoint,
                pipeRadius: 0.15,
                pipeColor: 0xE0E0E0,
                showFlow: true,
                flowDirection: 'forward'
            });
            scene.add(pipe.group);
            console.log(`✅ 已连接到${name}`, endPoint);
        });

    } catch (e) {
        console.error('❌ 创建入浆口到排浆泵连管失败:', e);
    }
}

/**
 * 创建一级塔供浆泵到一级脱硫塔中部的管道连接
 */
function createPrimaryTowerSupplyPipes(pump1, pump2) {
    try {
        console.log('开始创建一级塔供浆泵到一级脱硫塔中部的管道连接...');
        
        // 一级脱硫塔的位置（原点位置）
        const primaryTowerPos = { x: 0, y: 0, z: 0 }; // 基于双塔系统配置
        
        // 一级脱硫塔的中部位置（高度30米的中部，大约15米高）
        const towerMiddleHeight = 15;
        
        // 一级脱硫塔中部的连接点位置（在塔的左右两侧）
        const towerMiddleConnection1 = {
            x: primaryTowerPos.x - 8, // 塔的左侧，距离塔心8米
            y: towerMiddleHeight,
            z: primaryTowerPos.z - 2
        };
        
        const towerMiddleConnection2 = {
            x: primaryTowerPos.x - 8, // 塔的左侧，距离塔心8米
            y: towerMiddleHeight,
            z: primaryTowerPos.z + 2
        };
        
        // 获取泵的出口位置
        const pump1Pos = pump1.getGroup().position.clone();
        const pump2Pos = pump2.getGroup().position.clone();
        
        // 泵的出口位置（考虑泵的实际设计）
        const pump1OutletPos = {
            x: pump1Pos.x + 2.5, // 泵的右侧出口
            y: pump1Pos.y + 1.2, // 出口高度
            z: pump1Pos.z
        };
        
        const pump2OutletPos = {
            x: pump2Pos.x + 2.5, // 泵的右侧出口
            y: pump2Pos.y + 1.2, // 出口高度
            z: pump2Pos.z
        };
        
        // 创建一级塔供浆泵1到一级塔中部的管道连接
        const pump1ToTowerPipe = new PipeConnection({
            name: '一级塔供浆泵1→一级塔中部',
            startPoint: pump1OutletPos,
            endPoint: towerMiddleConnection1,
            pipeRadius: 0.3,
            pipeColor: 0xFF6B35, // 橙色，表示石灰石浆液（与一级塔泵标签颜色匹配）
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(pump1ToTowerPipe.group);
        
        // 创建一级塔供浆泵2到一级塔中部的管道连接
        const pump2ToTowerPipe = new PipeConnection({
            name: '一级塔供浆泵2→一级塔中部',
            startPoint: pump2OutletPos,
            endPoint: towerMiddleConnection2,
            pipeRadius: 0.3,
            pipeColor: 0xFF6B35, // 橙色，表示石灰石浆液（与一级塔泵标签颜色匹配）
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(pump2ToTowerPipe.group);
        
        console.log('✓ 一级塔供浆泵管道连接创建完成');
        console.log('泵1连接点:', pump1OutletPos, '→', towerMiddleConnection1);
        console.log('泵2连接点:', pump2OutletPos, '→', towerMiddleConnection2);
        
    } catch (error) {
        console.error('一级塔供浆泵管道连接创建失败:', error);
    }
}

/**
 * 创建二级塔供浆泵到二级脱硫塔中部的管道连接
 */
function createSecondaryTowerSupplyPipes(pump3, pump4) {
    try {
        console.log('开始创建二级塔供浆泵到二级脱硫塔中部的管道连接...');
        
        // 二级脱硫塔的位置（距离一级塔40米）
        const secondaryTowerPos = { x: 40, y: 0, z: 0 }; // 基于双塔系统spacing配置
        
        // 二级脱硫塔的中部位置（高度50米的中部，大约25米高）
        const towerMiddleHeight = 25;
        
        // 二级脱硫塔中部的连接点位置（在塔的左右两侧）
        const towerMiddleConnection1 = {
            x: secondaryTowerPos.x - 8, // 塔的左侧，距离塔心8米
            y: towerMiddleHeight,
            z: secondaryTowerPos.z - 2
        };
        
        const towerMiddleConnection2 = {
            x: secondaryTowerPos.x - 8, // 塔的左侧，距离塔心8米
            y: towerMiddleHeight,
            z: secondaryTowerPos.z + 2
        };
        
        // 获取泵的出口位置
        const pump3Pos = pump3.getGroup().position.clone();
        const pump4Pos = pump4.getGroup().position.clone();
        
        // 泵的出口位置（考虑泵的实际设计）
        const pump3OutletPos = {
            x: pump3Pos.x + 2.5, // 泵的右侧出口
            y: pump3Pos.y + 1.2, // 出口高度
            z: pump3Pos.z
        };
        
        const pump4OutletPos = {
            x: pump4Pos.x + 2.5, // 泵的右侧出口
            y: pump4Pos.y + 1.2, // 出口高度
            z: pump4Pos.z
        };
        
        // 创建二级塔供浆泵1到二级塔中部的管道连接
        const pump3ToTowerPipe = new PipeConnection({
            name: '二级塔供浆泵1→二级塔中部',
            startPoint: pump3OutletPos,
            endPoint: towerMiddleConnection1,
            pipeRadius: 0.3,
            pipeColor: 0x2ECC71, // 绿色，表示石灰石浆液
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(pump3ToTowerPipe.group);
        
        // 创建二级塔供浆泵2到二级塔中部的管道连接
        const pump4ToTowerPipe = new PipeConnection({
            name: '二级塔供浆泵2→二级塔中部',
            startPoint: pump4OutletPos,
            endPoint: towerMiddleConnection2,
            pipeRadius: 0.3,
            pipeColor: 0x2ECC71, // 绿色，表示石灰石浆液
            showFlow: true,
            flowDirection: 'forward'
        });
        scene.add(pump4ToTowerPipe.group);
        
        console.log('✓ 二级塔供浆泵管道连接创建完成');
        console.log('泵3连接点:', pump3OutletPos, '→', towerMiddleConnection1);
        console.log('泵4连接点:', pump4OutletPos, '→', towerMiddleConnection2);
        
    } catch (error) {
        console.error('二级塔供浆泵管道连接创建失败:', error);
    }
}

function startZoomRecover() {
    if (zoomRecoverAnimating) return;
    zoomRecoverAnimating = true;
    zoomRecoverStart = performance.now();
    zoomRecoverFrom = controls.target.clone();
    zoomRecoverTo = getDefaultTarget();
    requestAnimationFrame(zoomRecoverStep);
}

function zoomRecoverStep(now) {
    const elapsed = now - zoomRecoverStart;
    const t = Math.min(elapsed / ZOOM_RECOVER_DURATION, 1);
    controls.target.lerpVectors(zoomRecoverFrom, zoomRecoverTo, t);
    controls.update();
    if (t < 1) {
        requestAnimationFrame(zoomRecoverStep);
    } else {
        controls.target.copy(zoomRecoverTo);
        zoomRecoverAnimating = false;
    }
}

/**
 * 创建端口标识精灵
 */
function createPortLabelSprite(text, color = '#FFFFFF') {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 300;
    canvas.height = 80;
    
    // 设置字体和样式
    context.font = 'Bold 20px Microsoft YaHei, Arial';
    context.fillStyle = color;
    context.textAlign = 'center';
    context.textBaseline = 'middle';
    
    // 绘制背景
    context.fillStyle = 'rgba(0, 0, 0, 0.8)';
    context.fillRect(5, 5, canvas.width - 10, canvas.height - 10);
    
    // 绘制边框
    context.strokeStyle = color;
    context.lineWidth = 2;
    context.strokeRect(5, 5, canvas.width - 10, canvas.height - 10);
    
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
    sprite.scale.set(8, 2, 1);
    sprite.name = `portLabel_${text}`;
    
    return sprite;
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', init);
 
 window.resetView = resetView;
 window.toggleWireframe = toggleWireframe;
 window.toggleAnimation = toggleAnimation;
 window.toggleFullscreen = toggleFullscreen;
 window.showHelp = showHelp;
 window.exportModel = exportModel;
 window.restoreInfoPanel = restoreInfoPanel;
 window.toggleAutoRotate = toggleAutoRotate;
 window.takeScreenshot = takeScreenshot;
 window.toggleParameterPanel = toggleParameterPanel;
 
 // 对外暴露锅炉/烟道内部视角切换接口 - PowerPlantBoiler集成版
 window.enterBoilerInteriorView = function() {
     if (!window.boiler) return;
     if (dualTowerSystem?.primaryTower?.isInteriorView) dualTowerSystem.primaryTower.showExterior();
     if (dualTowerSystem?.secondaryTower?.isInteriorView) dualTowerSystem.secondaryTower.showExterior();
     if (window.pumpHouse?.isInteriorView) window.pumpHouse.showExterior();
     if (window.secondaryPumpHouse?.isInteriorView) window.secondaryPumpHouse.showExterior();
     if (window.industrialBuilding?.isInteriorView) window.industrialBuilding.showExterior();
     if (window.waterPumpHouse?.isInteriorView) window.waterPumpHouse.showExterior();
     if (window.airCompressorRoom?.isInteriorView) window.airCompressorRoom.showExterior();
     if (window.electrostaticBagFilter?.isInteriorView) window.electrostaticBagFilter.showExterior();
     window.boiler.showInterior();
     const pos = window.boiler.getGroup().position;
     animateCamera(new THREE.Vector3(pos.x + 25, pos.y + 18, pos.z + 25), new THREE.Vector3(pos.x, pos.y + 12, pos.z));
 };
 window.exitBoilerInteriorView = function() {
     if (!window.boiler) return;
     window.boiler.showExterior();
     animateCamera(new THREE.Vector3(50, 30, 50), new THREE.Vector3(0, 15, 0));
 };
 

window.enterBoilerFlueInteriorView = function() {
    // PowerPlantBoiler已集成烟囱，不再支持独立烟道视角
    console.log('PowerPlantBoiler已集成烟囱，使用锅炉内部视角代替');
    if (window.boiler && !window.boiler.isInteriorView) {
        window.enterBoilerInteriorView();
    }
};
window.exitBoilerFlueInteriorView = function() {
    // PowerPlantBoiler已集成烟囱，退出锅炉内部视角
    if (window.boiler && window.boiler.isInteriorView) {
        window.exitBoilerInteriorView();
    }
};