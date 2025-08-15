/**
 * SCRReactor - 程序化创建横流式 SCR 脱硝反应器（工业级精美版本）
 * 单位：1 = 1 米
 * 符合火电厂实际工程应用的SCR反应器设计
 */

class SCRReactor {
	constructor(config = {}) {
		this.name = config.name || 'SCR脱硝反应器';
		this.config = Object.assign({
			L: 10, // 长度（米）
			W: 6,  // 宽度（米）
			H: 8,  // 高度（米）
			layerCount: 3, // 催化剂层数
			layerThickness: 1.2, // 催化剂层厚度
			blocksX: 8, // 催化剂块X方向数量
			blocksY: 8, // 催化剂块Y方向数量
			inletSize: [4, 4], // 进口尺寸 [宽, 高]
			outletSize: [4, 4], // 出口尺寸 [宽, 高]
			showAIG: true, // 显示氨喷射格栅
			aigRows: 5, // 氨喷射管道行数
			aigCols: 8, // 氨喷射管道列数
			inletOffset: -0.35, // AIG相对中心位置
			position: { x: 0, y: 0, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			scale: 1.0,
			sizeMultiplier: 1.0, // 几何尺寸整体放大系数（非 three.js 缩放）
			// 视觉风格：'iconic' 使用图标化外观（匹配提供图片），'detailed' 使用工业级细节
			mode: 'iconic',
			// 图标化外观参数（参考图片：底座+主体筒仓+斜肩+三段配色立管+顶盖）
			iconic: {
				baseW: 2.6, baseD: 2.2, baseH: 0.12,
				bodyW: 2.3, bodyD: 2.0, bodyH: 3.1,
				neckH: 1.0,
				stackW: 1.3, stackD: 1.3, stackH: 2.9,
				colors: {
					base: 0x8e44ad,
					body: 0xb565c0,
					shoulder: 0xa04db3,
					bandDark: 0x4b1d6e,
					bandLight: 0xd28dd3,
					topCap: 0xe57373
				}
			},
			// 新增工业细节配置
			showSupportStructure: true, // 显示支撑结构
			showPlatforms: true, // 显示检修平台
			showPiping: true, // 显示管道系统
			showInstrumentation: true, // 显示仪表设备
			showInsulation: true // 显示保温层
		}, config);

		this.group = new THREE.Group();
		this.group.name = this.name;
		this.materials = this._createMaterials();
		this.isInteriorView = false;
		this._interiorGhost = null;

		this._build();
		this._applyTransform();
	}

	getGroup() { return this.group; }

	/** 进入内部视角：隐藏外壳/平台/外部管道，仅展示内部核心（催化剂、AIG、测点等），并添加半透明外壳轮廓 */
	showInterior() {
		try {
			// 分组可见性管理
			const mainFrame = this.group.getObjectByName('MainFrame');
			const catalyst = this.group.getObjectByName('CatalystLayers');
			const aig = this.group.getObjectByName('AIG_System');
			const duct = this.group.getObjectByName('Ductwork');
			const platform = this.group.getObjectByName('PlatformSystem');
			const piping = this.group.getObjectByName('PipingSystem');
			const instr = this.group.getObjectByName('InstrumentationSystem');
			const access = this.group.getObjectByName('AccessAndProbes');

			if (mainFrame) mainFrame.visible = false;
			if (platform) platform.visible = false;
			if (duct) duct.visible = false;
			if (piping) piping.visible = false;

			if (catalyst) catalyst.visible = true;
			if (aig) aig.visible = true;
			if (instr) instr.visible = true;
			if (access) access.visible = true;

			// 半透明外壳轮廓（一次性生成）
			if (!this._interiorGhost) {
				const { L, W, H } = this.config;
				const ghost = new THREE.Mesh(
					new THREE.BoxGeometry(L + 0.2, H + 0.2, W + 0.2),
					new THREE.MeshStandardMaterial({ color: 0xC0C0C0, transparent: true, opacity: 0.2, metalness: 0.2, roughness: 0.8, depthWrite: false })
				);
				ghost.name = 'SCR_InteriorGhost';
				ghost.renderOrder = 1.0001;
				this._interiorGhost = ghost;
			}
			if (!this.group.children.includes(this._interiorGhost)) {
				this.group.add(this._interiorGhost);
			}
			this._interiorGhost.visible = true;

			this.isInteriorView = true;
		} catch (_) {
			this.isInteriorView = true;
		}
	}

	/** 退出内部视角：恢复外部结构与平台、管道，移除半透明轮廓 */
	showExterior() {
		try {
			const mainFrame = this.group.getObjectByName('MainFrame');
			const duct = this.group.getObjectByName('Ductwork');
			const platform = this.group.getObjectByName('PlatformSystem');
			const piping = this.group.getObjectByName('PipingSystem');

			if (mainFrame) mainFrame.visible = true;
			if (platform) platform.visible = true;
			if (duct) duct.visible = true;
			if (piping) piping.visible = true;

			if (this._interiorGhost) this._interiorGhost.visible = false;
			this.isInteriorView = false;
		} catch (_) {
			this.isInteriorView = false;
		}
	}

	/** 切换内部/外部视角 */
	toggleInteriorView() {
		if (this.isInteriorView) this.showExterior(); else this.showInterior();
		return this.isInteriorView;
	}

	/**
	 * 提供对外管道接口的世界坐标：
	 * - inlet: 进口风道中点外侧法兰中心（-X 方向）
	 * - outlet: 出口风道中点外侧法兰中心（+X 方向）
	 */
	getPortWorldPosition(name = 'inlet') {
		const { L } = this.config;
		const local = new THREE.Vector3(
			name === 'inlet' ? -L/2 - 1.5 : L/2 + 1.5,
			0,
			0
		);
		return local.applyMatrix4(this.group.matrixWorld.clone());
	}

	getModelInfo() {
		return { 
			name: this.name, 
			type: 'SCR脱硝反应器',
			dimensions: {
				length: this.config.L,
				width: this.config.W,
				height: this.config.H
			},
			catalystLayers: this.config.layerCount,
			features: [
				'横流式设计',
				'多层催化剂',
				'氨喷射格栅系统',
				'工业级支撑结构',
				'检修平台系统',
				'完整管道连接',
				'仪表监测设备'
			],
			...this.config 
		};
	}

	/**
	 * 创建材质库
	 */
	_createMaterials() {
		return {
			// 主体结构材质
			shell: new THREE.MeshStandardMaterial({ 
				color: 0x8B9DC3, 
				metalness: 0.7, 
				roughness: 0.3,
				transparent: true, 
				opacity: 0.2 
			}),
			// 外壳钢结构
			steelStructure: new THREE.MeshStandardMaterial({ 
				color: 0x5F6368, 
				metalness: 0.8, 
				roughness: 0.2 
			}),
			// 保温层
			insulation: new THREE.MeshStandardMaterial({ 
				color: 0xE8E8E8, 
				metalness: 0.1, 
				roughness: 0.8 
			}),
			// 催化剂
			catalyst: new THREE.MeshStandardMaterial({ 
				color: 0xF6C453, 
				metalness: 0.05, 
				roughness: 0.75 
			}),
			// 氨喷射管道
			aigPipe: new THREE.MeshStandardMaterial({ 
				color: 0x4A90E2, 
				metalness: 0.6, 
				roughness: 0.3 
			}),
			// 支撑结构
			support: new THREE.MeshStandardMaterial({ 
				color: 0x2C3E50, 
				metalness: 0.9, 
				roughness: 0.1 
			}),
			// 平台格栅
			platform: new THREE.MeshStandardMaterial({ 
				color: 0x34495E, 
				metalness: 0.7, 
				roughness: 0.4 
			}),
			// 管道
			piping: new THREE.MeshStandardMaterial({ 
				color: 0x7F8C8D, 
				metalness: 0.8, 
				roughness: 0.2 
			}),
			// 仪表设备
			instrument: new THREE.MeshStandardMaterial({ 
				color: 0xE74C3C, 
				metalness: 0.3, 
				roughness: 0.6 
			}),
			// 检修门
			accessDoor: new THREE.MeshStandardMaterial({ 
				color: 0x27AE60, 
				metalness: 0.4, 
				roughness: 0.5 
			}),
			// 边线材质
			edge: new THREE.LineBasicMaterial({ color: 0x2C3E50 })
		};
	}

	/**
	 * 构建完整的SCR反应器模型
	 */
	_build() {
		// 图标化外观优先，符合用户图片
		if (this.config.mode === 'iconic') {
			this._buildIconic();
			return;
		}
		const { L, W, H } = this.config;

		// 1. 创建主体结构（外部视角）
		this._createMainStructure();
		
		// 2. 创建支撑结构（外部视角）
		if (this.config.showSupportStructure) {
			this._createSupportStructure();
		}
		
		// 3. 创建催化剂层（外部视角）
		this._createCatalystLayers();
		
		// 4. 创建氨喷射格栅系统（外部视角）
		if (this.config.showAIG) {
			this._createAIGSystem();
		}
		
		// 5. 创建进出口风道（外部视角）
		this._createDuctwork();
		
		// 6. 创建检修平台和楼梯（外部视角）
		if (this.config.showPlatforms) {
			this._createPlatformSystem();
		}
		
		// 7. 创建管道系统（外部视角）
		if (this.config.showPiping) {
			this._createPipingSystem();
		}
		
		// 8. 创建仪表设备（外部视角）
		if (this.config.showInstrumentation) {
			this._createInstrumentationSystem();
		}
		
		// 9. 创建检修门和探测口
		this._createAccessAndProbes();
	}

	/**
	 * 图标化外观（匹配提供图片的几何关系与配色）
	 */
	_buildIconic() {
		const k = this.config.sizeMultiplier || 1.0;
		const src = this.config.iconic;
		// 基于尺寸系数构造一份放大后的参数
		const p = {
			baseW: src.baseW * k, baseD: src.baseD * k, baseH: src.baseH * k,
			bodyW: src.bodyW * k, bodyD: src.bodyD * k, bodyH: src.bodyH * k,
			neckH: src.neckH * k,
			stackW: src.stackW * k, stackD: src.stackD * k, stackH: src.stackH * k,
			colors: src.colors
		};
		const g = this.group;

		// 1) 底座
		const base = new THREE.Mesh(
			new THREE.BoxGeometry(p.baseW + 0.3, p.baseH, p.baseD + 0.3),
			new THREE.MeshStandardMaterial({ color: p.colors.base, metalness: 0.1, roughness: 0.8 })
		);
		base.position.y = p.baseH / 2;
		g.add(base);

		// 2) 主体仓（矩形柱）
		const body = new THREE.Mesh(
			new THREE.BoxGeometry(p.bodyW, p.bodyH, p.bodyD),
			new THREE.MeshStandardMaterial({ color: p.colors.body, roughness: 0.7, metalness: 0.05 })
		);
		body.position.y = p.baseH + p.bodyH / 2;
		g.add(body);

		// 3) 斜肩过渡（四边棱台，使用4边柱旋转45度实现）
		const shoulder = new THREE.Mesh(
			new THREE.CylinderGeometry(Math.max(p.bodyW, p.bodyD) / 2, Math.max(p.stackW, p.stackD) / 2, p.neckH, 4, 1, false),
			new THREE.MeshStandardMaterial({ color: p.colors.shoulder, roughness: 0.6 })
		);
		shoulder.rotation.y = Math.PI / 4;
		// 拉伸到矩形比例
		const maxBD = Math.max(p.bodyW, p.bodyD);
		shoulder.scale.set(p.bodyW / maxBD, 1, p.bodyD / maxBD);
		shoulder.position.y = p.baseH + p.bodyH + p.neckH / 2;
		g.add(shoulder);

		// 4) 立管三段配色
		const bandH = p.stackH / 3;
		const mkBand = (h, color, idx) => {
			const m = new THREE.Mesh(
				new THREE.BoxGeometry(p.stackW, h, p.stackD),
				new THREE.MeshStandardMaterial({ color, metalness: 0.05, roughness: 0.6 })
			);
			m.position.y = p.baseH + p.bodyH + p.neckH + h / 2 + bandH * idx;
			g.add(m);
			return m;
		};
		mkBand(bandH, p.colors.bandDark, 0);
		mkBand(bandH, p.colors.bandLight, 1);
		mkBand(bandH, p.colors.bandDark, 2);

		// 5) 顶盖薄片
		const cap = new THREE.Mesh(
			new THREE.BoxGeometry(p.stackW * 1.05, 0.08, p.stackD * 1.05),
			new THREE.MeshStandardMaterial({ color: p.colors.topCap, metalness: 0.1, roughness: 0.5 })
		);
		cap.position.y = p.baseH + p.bodyH + p.neckH + p.stackH + 0.04;
		g.add(cap);

		// 记录总高度用于落地
		this._iconicTotalHeight = p.baseH + p.bodyH + p.neckH + p.stackH + 0.08;
		this._iconicBaseParams = p; // 保存放大后的参数，供外部查询
	}

	/**
	 * 创建主体结构
	 */
	_createMainStructure() {
		const { L, W, H } = this.config;
		
		// 主体外壳（钢结构框架）
		const mainFrame = new THREE.Group();
		mainFrame.name = 'MainFrame';
		
		// 外部钢结构框架
		const frameThickness = 0.2;
		const frameGeometry = new THREE.BoxGeometry(L + frameThickness, H + frameThickness, W + frameThickness);
		const frameMesh = new THREE.Mesh(frameGeometry, this.materials.steelStructure);
		frameMesh.castShadow = true;
		frameMesh.receiveShadow = true;
		mainFrame.add(frameMesh);
		
		// 内部透明壳体
		const shellGeometry = new THREE.BoxGeometry(L, H, W);
		const shellMesh = new THREE.Mesh(shellGeometry, this.materials.shell);
		shellMesh.castShadow = false;
		shellMesh.receiveShadow = false;
		mainFrame.add(shellMesh);
		
		// 保温层（如果启用）
		if (this.config.showInsulation) {
			const insulationGeometry = new THREE.BoxGeometry(L + 0.4, H + 0.4, W + 0.4);
			const insulationMesh = new THREE.Mesh(insulationGeometry, this.materials.insulation);
			insulationMesh.position.set(0, 0, 0);
			insulationMesh.castShadow = true;
			insulationMesh.receiveShadow = true;
			mainFrame.add(insulationMesh);
		}
		
		// 结构边线
		const edges = new THREE.LineSegments(
			new THREE.EdgesGeometry(frameGeometry),
			this.materials.edge
		);
		edges.renderOrder = 1.001;
		mainFrame.add(edges);
		
		this.group.add(mainFrame);
	}
	


	/**
	 * 创建支撑结构
	 */
	_createSupportStructure() {
		const { L, W, H } = this.config;
		const supportGroup = new THREE.Group();
		supportGroup.name = 'SupportStructure';
		
		// 底部支撑框架
		const baseFrameHeight = 2.0;
		const beamWidth = 0.3;
		
		// 纵向主梁
		for (let i = 0; i < 3; i++) {
			const z = -W/2 + (i * W/2);
			const beam = new THREE.Mesh(
				new THREE.BoxGeometry(L + 1, beamWidth, beamWidth),
				this.materials.support
			);
			beam.position.set(0, -H/2 - baseFrameHeight/2, z);
			beam.castShadow = true;
			beam.receiveShadow = true;
			supportGroup.add(beam);
		}
		
		// 横向支撑梁
		for (let i = 0; i < 5; i++) {
			const x = -L/2 + (i * L/4);
			const beam = new THREE.Mesh(
				new THREE.BoxGeometry(beamWidth, beamWidth, W + 1),
				this.materials.support
			);
			beam.position.set(x, -H/2 - baseFrameHeight/2, 0);
			beam.castShadow = true;
			beam.receiveShadow = true;
			supportGroup.add(beam);
		}
		
		// 垂直支撑柱
		const columnPositions = [
			[-L/2, -W/2], [-L/2, W/2], [L/2, -W/2], [L/2, W/2],
			[0, -W/2], [0, W/2]
		];
		
		columnPositions.forEach(([x, z]) => {
			const column = new THREE.Mesh(
				new THREE.CylinderGeometry(0.15, 0.2, baseFrameHeight, 12),
				this.materials.support
			);
			column.position.set(x, -H/2 - baseFrameHeight/2, z);
			column.castShadow = true;
			column.receiveShadow = true;
			supportGroup.add(column);
		});
		
		this.group.add(supportGroup);
	}
	
	/**
	 * 创建催化剂层系统
	 */
	_createCatalystLayers() {
		const { L, W, H, layerCount, layerThickness } = this.config;
		const catalystGroup = new THREE.Group();
		catalystGroup.name = 'CatalystLayers';
		
		// 计算催化剂层位置
		const innerL = L * 0.85;
		const startX = -innerL / 2 + layerThickness / 2;
		const spacing = (innerL - layerCount * layerThickness) / (layerCount + 1);
		
		for (let i = 0; i < layerCount; i++) {
			const x = startX + i * (layerThickness + spacing) + spacing;
			const layer = this._createSingleCatalystLayer({
				w: W * 0.8,
				h: H * 0.8,
				length: layerThickness,
				blocksX: this.config.blocksX,
				blocksY: this.config.blocksY
			});
			layer.position.x = x;
			layer.name = `CatalystLayer_${i + 1}`;
			catalystGroup.add(layer);
		}
		
		this.group.add(catalystGroup);
	}

	/**
	 * 创建氨喷射格栅系统（AIG）
	 */
	_createAIGSystem() {
		const { W, H, L, aigRows, aigCols, inletOffset } = this.config;
		const aigGroup = new THREE.Group();
		aigGroup.name = 'AIG_System';
		
		const w = W * 0.8, h = H * 0.8, x = L * inletOffset;
		const rows = Math.max(1, aigRows), cols = Math.max(1, aigCols);
		const pipeDia = 0.08; // 增大管径
		
		aigGroup.position.set(x, 0, 0);
		
		const spacingY = h / (rows + 1);
		const spacingZ = w / (cols + 1);
		
		// 主供氨管道（顶部横管）
		const mainSupplyPipe = new THREE.Mesh(
			new THREE.CylinderGeometry(pipeDia * 0.8, pipeDia * 0.8, w + 1, 24),
			this.materials.aigPipe
		);
		mainSupplyPipe.position.set(0, h/2 + 0.5, 0);
		mainSupplyPipe.castShadow = true;
		mainSupplyPipe.receiveShadow = true;
		aigGroup.add(mainSupplyPipe);
		
		// 纵向分配管道（沿 Z 方向）
		for (let i = 0; i < rows; i++) {
			const y = -h / 2 + spacingY * (i + 1);
			const distributionPipe = new THREE.Mesh(
				new THREE.CylinderGeometry(pipeDia * 0.6, pipeDia * 0.6, w, 24),
				this.materials.aigPipe
			);
			distributionPipe.position.set(0, y, 0);
			distributionPipe.castShadow = true;
			distributionPipe.receiveShadow = true;
			aigGroup.add(distributionPipe);
			
			// 连接到主管的垂直管道
			const connectPipe = new THREE.Mesh(
				new THREE.CylinderGeometry(pipeDia * 0.4, pipeDia * 0.4, h/2 + 0.5 - y, 16),
				this.materials.aigPipe
			);
			connectPipe.position.set(0, (h/2 + 0.5 + y) / 2, w/2 - 0.2);
			connectPipe.castShadow = true;
			connectPipe.receiveShadow = true;
			aigGroup.add(connectPipe);
		}
		
		// 喷射喷嘴（沿 Y 和 Z 方向分布）
		for (let j = 0; j < cols; j++) {
			const z = -w / 2 + spacingZ * (j + 1);
			for (let i = 0; i < rows; i++) {
				const y = -h / 2 + spacingY * (i + 1);
				
				// 喷嘴本体
				const nozzle = new THREE.Mesh(
					new THREE.ConeGeometry(pipeDia * 0.3, pipeDia * 0.8, 12),
					this.materials.aigPipe
				);
				nozzle.position.set(0.1, y, z);
				nozzle.rotation.z = -Math.PI / 2;
				nozzle.castShadow = true;
				nozzle.receiveShadow = true;
				aigGroup.add(nozzle);
				
				// 连接管
				const connectionPipe = new THREE.Mesh(
					new THREE.CylinderGeometry(pipeDia * 0.25, pipeDia * 0.25, 0.3, 12),
					this.materials.aigPipe
				);
				connectionPipe.position.set(-0.1, y, z);
				connectionPipe.rotation.z = Math.PI / 2;
				connectionPipe.castShadow = true;
				connectionPipe.receiveShadow = true;
				aigGroup.add(connectionPipe);
			}
		}
		
		// 支撑框架
		const frameThickness = 0.02;
		const topFrame = new THREE.Mesh(
			new THREE.TorusGeometry(w/2, frameThickness, 8, 32),
			this.materials.support
		);
		topFrame.position.set(0, h/2, 0);
		topFrame.rotation.x = Math.PI / 2;
		aigGroup.add(topFrame);
		
		const bottomFrame = new THREE.Mesh(
			new THREE.TorusGeometry(w/2, frameThickness, 8, 32),
			this.materials.support
		);
		bottomFrame.position.set(0, -h/2, 0);
		bottomFrame.rotation.x = Math.PI / 2;
		aigGroup.add(bottomFrame);
		
		this.group.add(aigGroup);
	}

	/**
	 * 创建单个催化剂层
	 */
	_createSingleCatalystLayer({ w, h, length, blocksX, blocksY, gap = 0.08 }) {
		const layerGroup = new THREE.Group();
		layerGroup.rotation.y = Math.PI / 2; // length 沿 X 轴
		
		// 催化剂载体框架
		const frameGeometry = new THREE.BoxGeometry(w + 0.2, length + 0.1, h + 0.2);
		const frameMesh = new THREE.Mesh(frameGeometry, this.materials.steelStructure);
		frameMesh.castShadow = true;
		frameMesh.receiveShadow = true;
		layerGroup.add(frameMesh);
		
		// 催化剂块阵列
		for (let ix = 0; ix < blocksX; ix++) {
			for (let iy = 0; iy < blocksY; iy++) {
				const blockW = (w - gap * (blocksX - 1)) / blocksX;
				const blockH = (h - gap * (blocksY - 1)) / blocksY;
				const x = -w / 2 + blockW / 2 + ix * (blockW + gap);
				const z = -h / 2 + blockH / 2 + iy * (blockH + gap);
				
				const catalystBlock = new THREE.Group();
				catalystBlock.position.set(x, 0, z);
				
				// 催化剂本体（蜂窝状结构）
				const blockMesh = new THREE.Mesh(
					new THREE.BoxGeometry(blockW, length * 0.9, blockH),
					this.materials.catalyst
				);
				blockMesh.castShadow = true;
				blockMesh.receiveShadow = true;
				catalystBlock.add(blockMesh);
				
				// 蜂窝孔道（简化表示）
				for (let hx = 0; hx < 3; hx++) {
					for (let hz = 0; hz < 3; hz++) {
						const holeX = -blockW/3 + (hx * blockW/3);
						const holeZ = -blockH/3 + (hz * blockH/3);
						const hole = new THREE.Mesh(
							new THREE.CylinderGeometry(0.02, 0.02, length * 0.95, 6),
							new THREE.MeshStandardMaterial({ 
								color: 0x2C3E50, 
								metalness: 0.1, 
								roughness: 0.9 
							})
						);
						hole.position.set(holeX, 0, holeZ);
						hole.rotation.z = Math.PI / 2;
						catalystBlock.add(hole);
					}
				}
				
				// 边框线
				const edges = new THREE.LineSegments(
					new THREE.EdgesGeometry(new THREE.BoxGeometry(blockW, length * 0.9, blockH)),
					this.materials.edge
				);
				catalystBlock.add(edges);
				
				layerGroup.add(catalystBlock);
			}
		}
		
		return layerGroup;
	}
	
	/**
	 * 创建进出口风道系统
	 */
	_createDuctwork() {
		const { L, W, H, inletSize, outletSize } = this.config;
		const ductGroup = new THREE.Group();
		ductGroup.name = 'Ductwork';
		
		// 进口风道
		const inletDuct = this._createDuct({
			size: inletSize,
			length: 3.0,
			position: { x: -L/2 - 1.5, y: 0, z: 0 },
			type: 'inlet'
		});
		ductGroup.add(inletDuct);
		
		// 出口风道
		const outletDuct = this._createDuct({
			size: outletSize,
			length: 3.0,
			position: { x: L/2 + 1.5, y: 0, z: 0 },
			type: 'outlet'
		});
		ductGroup.add(outletDuct);
		
		this.group.add(ductGroup);
	}
	
	/**
	 * 创建单个风道
	 */
	_createDuct({ size, length, position, type }) {
		const [width, height] = size;
		const ductGroup = new THREE.Group();
		ductGroup.name = `${type}Duct`;
		ductGroup.position.set(position.x, position.y, position.z);
		
		// 主风道
		const ductGeometry = new THREE.BoxGeometry(length, height, width);
		const ductMesh = new THREE.Mesh(ductGeometry, this.materials.piping);
		ductMesh.castShadow = true;
		ductMesh.receiveShadow = true;
		ductGroup.add(ductMesh);
		
		// 风道边线
		const ductEdges = new THREE.LineSegments(
			new THREE.EdgesGeometry(ductGeometry),
			this.materials.edge
		);
		ductGroup.add(ductEdges);
		
		// 法兰连接
		const flangeGeometry = new THREE.BoxGeometry(0.2, height + 0.4, width + 0.4);
		const flangeMesh = new THREE.Mesh(flangeGeometry, this.materials.steelStructure);
		flangeMesh.position.x = type === 'inlet' ? length/2 : -length/2;
		flangeMesh.castShadow = true;
		flangeMesh.receiveShadow = true;
		ductGroup.add(flangeMesh);
		
		return ductGroup;
	}
	
	/**
	 * 创建平台系统
	 */
	_createPlatformSystem() {
		if (!this.config.showPlatforms) return;
		
		const { L, W, H } = this.config;
		const platformGroup = new THREE.Group();
		platformGroup.name = 'PlatformSystem';
		
		// 主检修平台（顶部）
		const mainPlatform = this._createPlatform({
			width: L + 2,
			depth: W + 2,
			height: 0.1,
			position: { x: 0, y: H/2 + 1.5, z: 0 }
		});
		platformGroup.add(mainPlatform);
		
		// 侧面检修平台
		const sidePlatform = this._createPlatform({
			width: 2,
			depth: W + 1,
			height: 0.1,
			position: { x: L/2 + 1, y: H/4, z: 0 }
		});
		platformGroup.add(sidePlatform);
		
		// 楼梯
		const stairs = this._createStairs({
			width: 1.2,
			height: H/2 + 1.5,
			position: { x: L/2 + 2, y: 0, z: W/2 + 1 }
		});
		platformGroup.add(stairs);
		
		this.group.add(platformGroup);
	}
	
	/**
	 * 创建单个平台
	 */
	_createPlatform({ width, depth, height, position }) {
		const platformGroup = new THREE.Group();
		platformGroup.position.set(position.x, position.y, position.z);
		
		// 平台板
		const platformGeometry = new THREE.BoxGeometry(width, height, depth);
		const platformMesh = new THREE.Mesh(platformGeometry, this.materials.platform);
		platformMesh.castShadow = true;
		platformMesh.receiveShadow = true;
		platformGroup.add(platformMesh);
		
		// 护栏
		const railHeight = 1.1;
		const railPositions = [
			{ x: width/2, z: 0, rotation: 0 },
			{ x: -width/2, z: 0, rotation: 0 },
			{ x: 0, z: depth/2, rotation: Math.PI/2 },
			{ x: 0, z: -depth/2, rotation: Math.PI/2 }
		];
		
		railPositions.forEach(pos => {
			const rail = this._createRailing({
				length: pos.rotation === 0 ? depth : width,
				height: railHeight
			});
			rail.position.set(pos.x, height/2 + railHeight/2, pos.z);
			rail.rotation.y = pos.rotation;
			platformGroup.add(rail);
		});
		
		return platformGroup;
	}
	
	/**
	 * 创建护栏
	 */
	_createRailing({ length, height }) {
		const railGroup = new THREE.Group();
		
		// 顶部横杆
		const topRail = new THREE.Mesh(
			new THREE.CylinderGeometry(0.025, 0.025, length, 8),
			this.materials.steelStructure
		);
		topRail.rotation.z = Math.PI / 2;
		topRail.position.y = height * 0.8;
		railGroup.add(topRail);
		
		// 中部横杆
		const midRail = new THREE.Mesh(
			new THREE.CylinderGeometry(0.02, 0.02, length, 8),
			this.materials.steelStructure
		);
		midRail.rotation.z = Math.PI / 2;
		midRail.position.y = height * 0.4;
		railGroup.add(midRail);
		
		// 立柱
		const postCount = Math.floor(length / 1.5) + 1;
		for (let i = 0; i < postCount; i++) {
			const post = new THREE.Mesh(
				new THREE.CylinderGeometry(0.03, 0.03, height, 8),
				this.materials.steelStructure
			);
			post.position.x = -length/2 + (i * length / (postCount - 1));
			post.position.y = height/2;
			railGroup.add(post);
		}
		
		return railGroup;
	}
	
	/**
	 * 创建楼梯
	 */
	_createStairs({ width, height, position }) {
		const stairGroup = new THREE.Group();
		stairGroup.position.set(position.x, position.y, position.z);
		
		const stepCount = Math.floor(height / 0.2);
		const stepDepth = 0.3;
		const stepHeight = height / stepCount;
		
		for (let i = 0; i < stepCount; i++) {
			const step = new THREE.Mesh(
				new THREE.BoxGeometry(width, 0.05, stepDepth),
				this.materials.platform
			);
			step.position.y = i * stepHeight + stepHeight/2;
			step.position.x = -i * stepDepth/2;
			step.castShadow = true;
			step.receiveShadow = true;
			stairGroup.add(step);
		}
		
		// 楼梯扶手
		const handrail = this._createRailing({ length: Math.sqrt(height*height + (stepCount*stepDepth/2)*(stepCount*stepDepth/2)), height: 1.0 });
		handrail.rotation.z = -Math.atan2(height, stepCount*stepDepth/2);
		handrail.position.set(-stepCount*stepDepth/4, height/2, width/2);
		stairGroup.add(handrail);
		
		return stairGroup;
	}
	
	/**
	 * 创建管道系统
	 */
	_createPipingSystem() {
		if (!this.config.showPiping) return;
		
		const { L, W, H } = this.config;
		const pipingGroup = new THREE.Group();
		pipingGroup.name = 'PipingSystem';
		
		// 氨水供应管道
		const ammoniaSupplyPipe = this._createPipe({
			diameter: 0.15,
			length: L + 4,
			position: { x: 0, y: H/2 + 2, z: -W/2 - 1 },
			rotation: { x: 0, y: 0, z: Math.PI/2 },
			color: 0x4A90E2
		});
		pipingGroup.add(ammoniaSupplyPipe);
		
		// 压缩空气管道
		const airPipe = this._createPipe({
			diameter: 0.1,
			length: L + 2,
			position: { x: 0, y: H/2 + 1.8, z: -W/2 - 0.8 },
			rotation: { x: 0, y: 0, z: Math.PI/2 },
			color: 0x50C878
		});
		pipingGroup.add(airPipe);
		
		// 排污管道
		const drainPipe = this._createPipe({
			diameter: 0.08,
			length: W,
			position: { x: -L/2 - 0.5, y: -H/2 - 0.5, z: 0 },
			rotation: { x: 0, y: 0, z: 0 },
			color: 0x8B4513
		});
		pipingGroup.add(drainPipe);
		
		// 管道支架
		const pipeSupports = this._createPipeSupports({
			pipePositions: [
				{ x: 0, y: H/2 + 2, z: -W/2 - 1 },
				{ x: 0, y: H/2 + 1.8, z: -W/2 - 0.8 }
			],
			supportHeight: 0.5
		});
		pipingGroup.add(pipeSupports);
		
		this.group.add(pipingGroup);
	}
	
	/**
	 * 创建单根管道
	 */
	_createPipe({ diameter, length, position, rotation, color }) {
		const pipeGroup = new THREE.Group();
		pipeGroup.position.set(position.x, position.y, position.z);
		pipeGroup.rotation.set(rotation.x, rotation.y, rotation.z);
		
		// 主管道
		const pipeGeometry = new THREE.CylinderGeometry(diameter/2, diameter/2, length, 16);
		const pipeMaterial = new THREE.MeshStandardMaterial({
			color: color,
			metalness: 0.8,
			roughness: 0.2
		});
		const pipeMesh = new THREE.Mesh(pipeGeometry, pipeMaterial);
		pipeMesh.castShadow = true;
		pipeMesh.receiveShadow = true;
		pipeGroup.add(pipeMesh);
		
		// 法兰连接
		const flangePositions = [-length/2, length/2];
		flangePositions.forEach(pos => {
			const flange = new THREE.Mesh(
				new THREE.CylinderGeometry(diameter * 0.8, diameter * 0.8, 0.05, 16),
				this.materials.steelStructure
			);
			flange.position.y = pos;
			flange.castShadow = true;
			pipeGroup.add(flange);
		});
		
		return pipeGroup;
	}
	
	/**
	 * 创建管道支架
	 */
	_createPipeSupports({ pipePositions, supportHeight }) {
		const supportGroup = new THREE.Group();
		
		pipePositions.forEach((pos, index) => {
			const supportCount = 3;
			for (let i = 0; i < supportCount; i++) {
				const support = new THREE.Mesh(
					new THREE.CylinderGeometry(0.02, 0.02, supportHeight, 8),
					this.materials.steelStructure
				);
				support.position.set(
					pos.x - 2 + i * 2,
					pos.y - supportHeight/2,
					pos.z
				);
				support.castShadow = true;
				supportGroup.add(support);
			}
		});
		
		return supportGroup;
	}
	
	/**
	 * 创建仪表系统
	 */
	_createInstrumentationSystem() {
		if (!this.config.showInstrumentation) return;
		
		const { L, W, H } = this.config;
		const instrumentGroup = new THREE.Group();
		instrumentGroup.name = 'InstrumentationSystem';
		
		// 温度测点
		const tempProbes = [
			{ x: -L/2 + 1, y: 0, z: W/2 - 1, type: 'temperature' },
			{ x: L/2 - 1, y: 0, z: W/2 - 1, type: 'temperature' },
			{ x: 0, y: H/4, z: W/2, type: 'temperature' }
		];
		
		tempProbes.forEach(probe => {
			const tempProbe = this._createInstrument({
				type: probe.type,
				position: probe,
				size: 0.1
			});
			instrumentGroup.add(tempProbe);
		});
		
		// 压力测点
		const pressureProbes = [
			{ x: -L/2, y: 0, z: 0, type: 'pressure' },
			{ x: L/2, y: 0, z: 0, type: 'pressure' }
		];
		
		pressureProbes.forEach(probe => {
			const pressureProbe = this._createInstrument({
				type: probe.type,
				position: probe,
				size: 0.08
			});
			instrumentGroup.add(pressureProbe);
		});
		
		// 控制柜
		const controlCabinet = this._createControlCabinet({
			position: { x: L/2 + 3, y: -H/2 + 1, z: -W/2 - 2 },
			size: { w: 0.8, h: 2, d: 0.6 }
		});
		instrumentGroup.add(controlCabinet);
		
		this.group.add(instrumentGroup);
	}
	
	/**
	 * 创建单个仪表
	 */
	_createInstrument({ type, position, size }) {
		const instrumentGroup = new THREE.Group();
		instrumentGroup.position.set(position.x, position.y, position.z);
		
		// 仪表本体
		const instrumentGeometry = new THREE.CylinderGeometry(size, size, size * 2, 12);
		const instrumentMesh = new THREE.Mesh(instrumentGeometry, this.materials.instrument);
		instrumentMesh.castShadow = true;
		instrumentMesh.receiveShadow = true;
		instrumentGroup.add(instrumentMesh);
		
		// 连接管
		const connectionPipe = new THREE.Mesh(
			new THREE.CylinderGeometry(0.01, 0.01, 0.3, 8),
			this.materials.piping
		);
		connectionPipe.position.y = size;
		connectionPipe.rotation.x = Math.PI / 2;
		instrumentGroup.add(connectionPipe);
		
		// 标识牌
		const labelGeometry = new THREE.PlaneGeometry(0.15, 0.05);
		const labelMaterial = new THREE.MeshStandardMaterial({
			color: 0xFFFFFF,
			side: THREE.DoubleSide
		});
		const label = new THREE.Mesh(labelGeometry, labelMaterial);
		label.position.set(0, -size * 1.5, 0);
		label.rotation.x = -Math.PI / 2;
		instrumentGroup.add(label);
		
		return instrumentGroup;
	}
	
	/**
	 * 创建控制柜
	 */
	_createControlCabinet({ position, size }) {
		const cabinetGroup = new THREE.Group();
		cabinetGroup.position.set(position.x, position.y, position.z);
		
		// 柜体
		const cabinetGeometry = new THREE.BoxGeometry(size.w, size.h, size.d);
		const cabinetMesh = new THREE.Mesh(cabinetGeometry, this.materials.instrument);
		cabinetMesh.castShadow = true;
		cabinetMesh.receiveShadow = true;
		cabinetGroup.add(cabinetMesh);
		
		// 门
		const doorGeometry = new THREE.BoxGeometry(size.w * 0.9, size.h * 0.9, 0.02);
		const doorMesh = new THREE.Mesh(doorGeometry, this.materials.accessDoor);
		doorMesh.position.z = size.d/2 + 0.01;
		cabinetGroup.add(doorMesh);
		
		// 指示灯
		const indicators = [
			{ x: -size.w/4, y: size.h/3, color: 0x00FF00 },
			{ x: 0, y: size.h/3, color: 0xFFFF00 },
			{ x: size.w/4, y: size.h/3, color: 0xFF0000 }
		];
		
		indicators.forEach(ind => {
			const indicator = new THREE.Mesh(
				new THREE.CylinderGeometry(0.02, 0.02, 0.01, 8),
				new THREE.MeshStandardMaterial({ 
					color: ind.color, 
					emissive: ind.color, 
					emissiveIntensity: 0.3 
				})
			);
			indicator.position.set(ind.x, ind.y, size.d/2 + 0.02);
			indicator.rotation.x = Math.PI / 2;
			cabinetGroup.add(indicator);
		});
		
		return cabinetGroup;
	}
	
	/**
	 * 创建检修门和探测孔
	 */
	_createAccessAndProbes() {
		const { L, W, H } = this.config;
		const accessGroup = new THREE.Group();
		accessGroup.name = 'AccessAndProbes';
		
		// 侧面检修门
		for (let side of [-1, 1]) {
			const accessDoor = this._createAccessDoor({
				width: 1.0,
				height: 1.5,
				position: { x: 0, y: -H/4, z: side * (W/2 + 0.05) },
				rotation: { x: 0, y: side > 0 ? Math.PI : 0, z: 0 }
			});
			accessGroup.add(accessDoor);
		}
		
		// 顶部检修门
		const topAccessDoor = this._createAccessDoor({
			width: 1.2,
			height: 1.2,
			position: { x: 0, y: H/2 + 0.05, z: 0 },
			rotation: { x: Math.PI/2, y: 0, z: 0 }
		});
		accessGroup.add(topAccessDoor);
		
		// 温度探测孔
		const tempProbePositions = [
			{ x: -L/3, y: H/4, z: W/2 + 0.1 },
			{ x: 0, y: H/4, z: W/2 + 0.1 },
			{ x: L/3, y: H/4, z: W/2 + 0.1 },
			{ x: -L/3, y: -H/4, z: W/2 + 0.1 },
			{ x: L/3, y: -H/4, z: W/2 + 0.1 }
		];
		
		tempProbePositions.forEach(pos => {
			const probe = this._createProbePort({
				type: 'temperature',
				position: pos,
				diameter: 0.08
			});
			accessGroup.add(probe);
		});
		
		// 取样孔
		const samplingPorts = [
			{ x: -L/4, y: 0, z: -W/2 - 0.1 },
			{ x: L/4, y: 0, z: -W/2 - 0.1 }
		];
		
		samplingPorts.forEach(pos => {
			const samplingPort = this._createProbePort({
				type: 'sampling',
				position: pos,
				diameter: 0.06
			});
			accessGroup.add(samplingPort);
		});
		
		this.group.add(accessGroup);
	}
	
	/**
	 * 创建检修门
	 */
	_createAccessDoor({ width, height, position, rotation }) {
		const doorGroup = new THREE.Group();
		doorGroup.position.set(position.x, position.y, position.z);
		doorGroup.rotation.set(rotation.x, rotation.y, rotation.z);
		
		// 门框
		const frameThickness = 0.05;
		const frameGeometry = new THREE.BoxGeometry(width + frameThickness*2, height + frameThickness*2, frameThickness);
		const frameMesh = new THREE.Mesh(frameGeometry, this.materials.steelStructure);
		frameMesh.castShadow = true;
		frameMesh.receiveShadow = true;
		doorGroup.add(frameMesh);
		
		// 门板
		const doorGeometry = new THREE.BoxGeometry(width, height, 0.02);
		const doorMesh = new THREE.Mesh(doorGeometry, this.materials.accessDoor);
		doorMesh.position.z = frameThickness/2 + 0.01;
		doorMesh.castShadow = true;
		doorMesh.receiveShadow = true;
		doorGroup.add(doorMesh);
		
		// 门把手
		const handleGeometry = new THREE.CylinderGeometry(0.02, 0.02, 0.15, 8);
		const handleMesh = new THREE.Mesh(handleGeometry, this.materials.steelStructure);
		handleMesh.position.set(width/3, 0, frameThickness/2 + 0.03);
		handleMesh.rotation.z = Math.PI/2;
		handleMesh.castShadow = true;
		doorGroup.add(handleMesh);
		
		// 铰链
		for (let i = 0; i < 3; i++) {
			const hinge = new THREE.Mesh(
				new THREE.BoxGeometry(0.08, 0.15, 0.03),
				this.materials.steelStructure
			);
			hinge.position.set(-width/2 - 0.02, -height/3 + i * height/3, frameThickness/2);
			hinge.castShadow = true;
			doorGroup.add(hinge);
		}
		
		return doorGroup;
	}
	
	/**
	 * 创建探测孔
	 */
	_createProbePort({ type, position, diameter }) {
		const portGroup = new THREE.Group();
		portGroup.position.set(position.x, position.y, position.z);
		
		// 法兰座
		const flangeGeometry = new THREE.CylinderGeometry(diameter * 1.5, diameter * 1.5, 0.08, 16);
		const flangeMesh = new THREE.Mesh(flangeGeometry, this.materials.steelStructure);
		flangeMesh.rotation.x = Math.PI / 2;
		flangeMesh.castShadow = true;
		flangeMesh.receiveShadow = true;
		portGroup.add(flangeMesh);
		
		// 探测管
		const probeGeometry = new THREE.CylinderGeometry(diameter/2, diameter/2, 0.3, 12);
		const probeColor = type === 'temperature' ? 0xEF4444 : type === 'sampling' ? 0x3B82F6 : 0x10B981;
		const probeMaterial = new THREE.MeshStandardMaterial({
			color: probeColor,
			metalness: 0.7,
			roughness: 0.3
		});
		const probeMesh = new THREE.Mesh(probeGeometry, probeMaterial);
		probeMesh.position.z = 0.15;
		probeMesh.rotation.x = Math.PI / 2;
		probeMesh.castShadow = true;
		probeMesh.receiveShadow = true;
		portGroup.add(probeMesh);
		
		// 连接头
		const connectorGeometry = new THREE.CylinderGeometry(diameter * 0.8, diameter * 0.8, 0.05, 12);
		const connectorMesh = new THREE.Mesh(connectorGeometry, this.materials.steelStructure);
		connectorMesh.position.z = 0.3;
		connectorMesh.rotation.x = Math.PI / 2;
		connectorMesh.castShadow = true;
		portGroup.add(connectorMesh);
		
		// 标识牌
		const labelGeometry = new THREE.PlaneGeometry(0.2, 0.08);
		const labelMaterial = new THREE.MeshStandardMaterial({
			color: 0xFFFFFF,
			side: THREE.DoubleSide
		});
		const label = new THREE.Mesh(labelGeometry, labelMaterial);
		label.position.set(0, -diameter * 2, 0.35);
		label.rotation.x = Math.PI / 2;
		portGroup.add(label);
		
		return portGroup;
	}



	_applyTransform() {
		const { position, rotation, scale, H, sizeMultiplier } = this.config;
		// 原型以中心为原点：图标化模式使用计算高度，否则用 H
		const totalH = this._iconicTotalHeight || H;
		this.group.position.set(position.x, position.y + totalH / 2, position.z);
		this.group.rotation.set(rotation.x, rotation.y, rotation.z);
		// three.js 缩放保持 1.0；如需额外缩放，可叠加 scale，但"整体扩大"走 sizeMultiplier
		this.group.scale.setScalar(scale);
		this.group.userData = { type: 'scrReactor', name: this.name, clickable: false, sizeMultiplier };
	}
}

if (typeof module !== 'undefined' && module.exports) {
	module.exports = SCRReactor;
} else if (typeof window !== 'undefined') {
	window.SCRReactor = SCRReactor;
}


