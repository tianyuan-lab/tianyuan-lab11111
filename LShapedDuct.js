/**
 * L形风管连接类
 * 用于电袋除尘器到引风机的L形连接：先垂直向下，再水平向前
 */
class LShapedDuct {
    constructor(params = {}) {
        const defaults = {
            name: 'L形连接风管',
            // 起点：电袋除尘器前端中部
            startPoint: { x: 0, y: 15, z: 0 },
            // 终点：引风机入口
            endPoint: { x: 10, y: 2, z: 10 },
            // 垂直段长度（向下延伸多少）
            verticalLength: 8,
            // 管道尺寸
            rectWidth: 3.6,    // 矩形段宽度
            rectHeight: 2.4,   // 矩形段高度
            pipeRadius: 1.3,   // 圆形段半径（匹配引风机入口）
            // 材质参数
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        };
        
        this.config = Object.assign({}, defaults, params);
        this.group = new THREE.Group();
        this.group.name = this.config.name;
        this.group.position.set(this.config.position.x, this.config.position.y, this.config.position.z);
        this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);

        this.materials = this.#createMaterials();
        this.#build();
    }

    getGroup() { return this.group; }

    // 将L形管道定位到指定的起点和终点
    alignTo(filterCenter, fanInletCenter) {
        // 计算L形路径的关键点
        const startPoint = filterCenter.clone();
        const endPoint = fanInletCenter.clone();
        
        // 垂直段终点：从起点垂直向下
        const verticalEndPoint = new THREE.Vector3(
            startPoint.x,
            startPoint.y - this.config.verticalLength,
            startPoint.z
        );
        
        // 水平段：从垂直段终点到引风机入口
        // 更新配置中的关键点
        this.config.startPoint = startPoint;
        this.config.verticalEndPoint = verticalEndPoint;
        this.config.endPoint = endPoint;
        
        // 重新构建管道
        this.group.clear();
        this.#build();
        
        console.log('L形管道已重新定位:', {
            起点: startPoint,
            垂直段终点: verticalEndPoint,
            最终点: endPoint
        });
    }

    #createMaterials() {
        return {
            ductMetal: new THREE.MeshStandardMaterial({ 
                color: 0xD7DBDE, 
                roughness: 0.7, 
                metalness: 0.25 
            }),
            seam: new THREE.MeshStandardMaterial({ 
                color: 0xC6CCD0, 
                roughness: 0.65, 
                metalness: 0.25 
            }),
            flange: new THREE.MeshStandardMaterial({ 
                color: 0xA3A7AA, 
                roughness: 0.5, 
                metalness: 0.8 
            }),
            support: new THREE.MeshStandardMaterial({ 
                color: 0x606060, 
                roughness: 0.6, 
                metalness: 0.7 
            })
        };
    }

    #build() {
        const { startPoint, verticalEndPoint, endPoint, rectWidth: RW, rectHeight: RH, pipeRadius } = this.config;
        
        // 如果还没有计算关键点，使用默认配置
        const start = startPoint || this.config.startPoint;
        const vertEnd = verticalEndPoint || new THREE.Vector3(start.x, start.y - this.config.verticalLength, start.z);
        const end = endPoint || this.config.endPoint;

        const ductSystem = new THREE.Group();
        ductSystem.name = 'LShapedDuctSystem';

        // 1) 垂直段 - 矩形风管（从电袋除尘器向下延伸）
        this.#createVerticalSection(ductSystem, start, vertEnd, RW, RH);

        // 2) L形弯头 - 矩形到圆形过渡
        this.#createElbowSection(ductSystem, vertEnd, RW, RH, pipeRadius);

        // 3) 水平段 - 圆形风管（连接到引风机）
        this.#createHorizontalSection(ductSystem, vertEnd, end, pipeRadius);

        // 4) 支撑结构
        this.#createSupports(ductSystem, start, vertEnd, end);

        this.group.add(ductSystem);
    }

    // 创建垂直段（矩形风管）
    #createVerticalSection(parent, startPoint, endPoint, width, height) {
        const verticalGroup = new THREE.Group();
        verticalGroup.name = 'verticalSection';

        const length = Math.abs(endPoint.y - startPoint.y);
        
        // 主体管道
        const ductBody = new THREE.Mesh(
            new THREE.BoxGeometry(width, length, height), 
            this.materials.ductMetal
        );
        ductBody.position.set(
            startPoint.x,
            startPoint.y - length / 2,
            startPoint.z
        );
        ductBody.castShadow = true;
        verticalGroup.add(ductBody);

        // 竖向加强筋
        const ribCount = Math.max(6, Math.floor(length / 1.5));
        for (let i = 1; i < ribCount; i++) {
            const y = startPoint.y - (i / ribCount) * length;
            const rib = new THREE.Mesh(
                new THREE.BoxGeometry(width * 1.02, 0.08, height * 1.02),
                this.materials.seam
            );
            rib.position.set(startPoint.x, y, startPoint.z);
            verticalGroup.add(rib);
        }

        // 顶部连接法兰（连接电袋除尘器）
        const topFlange = new THREE.Mesh(
            new THREE.BoxGeometry(width + 0.2, 0.1, height + 0.2),
            this.materials.flange
        );
        topFlange.position.set(startPoint.x, startPoint.y + 0.05, startPoint.z);
        verticalGroup.add(topFlange);

        parent.add(verticalGroup);
    }

    // 创建L形弯头（矩形到圆形过渡）
    #createElbowSection(parent, cornerPoint, rectWidth, rectHeight, pipeRadius) {
        const elbowGroup = new THREE.Group();
        elbowGroup.name = 'elbowSection';

        // 弯头半径
        const elbowRadius = Math.max(rectWidth, rectHeight) * 0.8;
        
        // 创建90度弯头 - 使用多段圆环拟合
        const segments = 12;
        for (let i = 0; i < segments; i++) {
            const angle1 = (i / segments) * Math.PI / 2;
            const angle2 = ((i + 1) / segments) * Math.PI / 2;
            
            // 计算当前段的位置和大小
            const factor1 = i / segments;
            const factor2 = (i + 1) / segments;
            
            // 从矩形渐变到圆形
            const w1 = THREE.MathUtils.lerp(rectWidth, pipeRadius * 2, factor1);
            const h1 = THREE.MathUtils.lerp(rectHeight, pipeRadius * 2, factor1);
            const w2 = THREE.MathUtils.lerp(rectWidth, pipeRadius * 2, factor2);
            const h2 = THREE.MathUtils.lerp(rectHeight, pipeRadius * 2, factor2);
            
            const r1 = (w1 + h1) / 4;
            const r2 = (w2 + h2) / 4;
            
            // 计算段的中心位置
            const centerX = cornerPoint.x + elbowRadius * Math.sin(angle1 + (angle2 - angle1) / 2);
            const centerY = cornerPoint.y - elbowRadius * (1 - Math.cos(angle1 + (angle2 - angle1) / 2));
            const centerZ = cornerPoint.z;
            
            const segLength = elbowRadius * (angle2 - angle1);
            const segment = new THREE.Mesh(
                new THREE.CylinderGeometry(r1, r2, segLength, 20),
                this.materials.ductMetal
            );
            
            segment.position.set(centerX, centerY, centerZ);
            segment.rotation.z = -(angle1 + angle2) / 2;
            segment.castShadow = true;
            elbowGroup.add(segment);
        }

        parent.add(elbowGroup);
    }

    // 创建水平段（圆形风管）
    #createHorizontalSection(parent, startPoint, endPoint, radius) {
        const horizontalGroup = new THREE.Group();
        horizontalGroup.name = 'horizontalSection';

        // 计算水平距离
        const distance = Math.sqrt(
            Math.pow(endPoint.x - startPoint.x, 2) + 
            Math.pow(endPoint.z - startPoint.z, 2)
        );

        // 主管道
        const pipe = new THREE.Mesh(
            new THREE.CylinderGeometry(radius, radius, distance, 24),
            this.materials.ductMetal
        );
        
        // 定位和旋转管道
        pipe.position.set(
            (startPoint.x + endPoint.x) / 2,
            endPoint.y,
            (startPoint.z + endPoint.z) / 2
        );
        
        // 计算旋转角度
        const direction = new THREE.Vector3(
            endPoint.x - startPoint.x, 
            0, 
            endPoint.z - startPoint.z
        ).normalize();
        pipe.lookAt(
            pipe.position.x + direction.x,
            pipe.position.y,
            pipe.position.z + direction.z
        );
        pipe.rotateX(Math.PI / 2);
        pipe.castShadow = true;
        horizontalGroup.add(pipe);

        // 环形加强筋
        const ringCount = Math.max(3, Math.floor(distance / 2));
        for (let i = 1; i < ringCount; i++) {
            const factor = i / ringCount;
            const ringPos = new THREE.Vector3().lerpVectors(
                new THREE.Vector3(startPoint.x, endPoint.y, startPoint.z),
                endPoint,
                factor
            );
            
            const ring = new THREE.Mesh(
                new THREE.TorusGeometry(radius + 0.05, 0.03, 8, 24),
                this.materials.seam
            );
            ring.position.copy(ringPos);
            ring.lookAt(
                ringPos.x + direction.x,
                ringPos.y,
                ringPos.z + direction.z
            );
            ring.rotateX(Math.PI / 2);
            horizontalGroup.add(ring);
        }

        // 终端法兰（连接引风机）
        const endFlange = new THREE.Mesh(
            new THREE.CylinderGeometry(radius + 0.1, radius + 0.1, 0.08, 32),
            this.materials.flange
        );
        endFlange.position.copy(endPoint);
        endFlange.lookAt(
            endPoint.x + direction.x,
            endPoint.y,
            endPoint.z + direction.z
        );
        endFlange.rotateX(Math.PI / 2);
        horizontalGroup.add(endFlange);

        parent.add(horizontalGroup);
    }

    // 创建支撑结构
    #createSupports(parent, startPoint, cornerPoint, endPoint) {
        const supportGroup = new THREE.Group();
        supportGroup.name = 'supports';

        // 垂直段支撑
        const verticalSupports = 3;
        for (let i = 1; i <= verticalSupports; i++) {
            const supportY = startPoint.y - (i / (verticalSupports + 1)) * (startPoint.y - cornerPoint.y);
            this.#createSupport(supportGroup, startPoint.x, supportY, startPoint.z);
        }

        // 水平段支撑
        const horizontalSupports = 2;
        for (let i = 1; i <= horizontalSupports; i++) {
            const factor = i / (horizontalSupports + 1);
            const supportPos = new THREE.Vector3().lerpVectors(
                new THREE.Vector3(cornerPoint.x, endPoint.y, cornerPoint.z),
                endPoint,
                factor
            );
            this.#createSupport(supportGroup, supportPos.x, supportPos.y, supportPos.z);
        }

        parent.add(supportGroup);
    }

    // 创建单个支撑
    #createSupport(parent, x, y, z) {
        // 支撑托架
        const bracket = new THREE.Mesh(
            new THREE.BoxGeometry(0.8, 0.15, 0.4),
            this.materials.support
        );
        bracket.position.set(x, y - 0.6, z);
        bracket.castShadow = true;
        parent.add(bracket);

        // 支撑柱（如果不在地面附近）
        if (y > 1.5) {
            const postHeight = y - 0.6;
            const post = new THREE.Mesh(
                new THREE.CylinderGeometry(0.08, 0.08, postHeight, 12),
                this.materials.support
            );
            post.position.set(x, postHeight / 2, z);
            post.castShadow = true;
            parent.add(post);

            // 支撑底座
            const base = new THREE.Mesh(
                new THREE.CylinderGeometry(0.2, 0.2, 0.1, 8),
                this.materials.support
            );
            base.position.set(x, 0.05, z);
            base.castShadow = true;
            parent.add(base);
        }
    }
}

if (typeof window !== 'undefined') {
    window.LShapedDuct = LShapedDuct;
}