class InFurnaceCalciumInjection {
    constructor(config = {}) {
        this.config = Object.assign({
            name: '炉内喷钙系统',
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            // 仅用于整体缩放（组级别），不改变几何尺寸
            scale: 3.0,
            industrial: true, // 按工业真实外观渲染
            // 参考图比例化尺寸（米）
            topBin: { w: 6, d: 3, h: 2.4, coneH: 1.6 },
            upperSilo: { r: 1.8, h: 2.0, coneH: 1.2 },
            lowerSilo: { r: 1.8, h: 2.0, coneH: 1.2 },
            dropPipe: { dia: 0.6 },
            trough: { w: 8, h: 0.6, d: 1.6 },
        }, config);

        this.group = new THREE.Group();
        this.group.name = this.config.name;
        this.materials = this.#createMaterials();

        this.#build();
        this.#applyTransform();
    }

    getGroup() { return this.group; }

    getModelInfo() {
        return { name: this.config.name, type: 'InFurnaceCalciumInjection', ...this.config };
    }

    /** 组级整体缩放，不改变各零部件几何尺寸 */
    setGlobalScale(multiplier = 1.0) {
        const m = Number(multiplier) > 0 ? Number(multiplier) : 1.0;
        this.group.scale.setScalar(m);
        this.config.scale = m;
        return m;
    }

    getPortWorldPosition(name = 'truckLoad') {
        const local = this.portMap?.[name]?.clone?.();
        if (!local) return null;
        return local.applyMatrix4(this.group.matrixWorld.clone());
    }

    #createMaterials() {
        return {
            bin: new THREE.MeshStandardMaterial({ color: 0xC9CDD3, metalness: 0.5, roughness: 0.5 }),
            cone: new THREE.MeshStandardMaterial({ color: 0xBFC3C9, metalness: 0.55, roughness: 0.45 }),
            pipe: new THREE.MeshStandardMaterial({ color: 0x7F8C8D, metalness: 0.7, roughness: 0.3 }),
            valve: new THREE.MeshStandardMaterial({ color: 0x3B82F6, metalness: 0.8, roughness: 0.25 }),
            trough: new THREE.MeshStandardMaterial({ color: 0x2E86DE, metalness: 0.6, roughness: 0.35 }),
            flange: new THREE.MeshStandardMaterial({ color: 0x9AA5B1, metalness: 0.9, roughness: 0.25 })
        };
    }

    #build() {
        const g = new THREE.Group();
        g.name = 'InFurnaceCalcium';

        // Top rect bin + cone（粉仓，带加强筋/除尘器）
        const tb = this.config.topBin;
        const topBody = new THREE.Mesh(new THREE.BoxGeometry(tb.w, tb.h, tb.d), this.materials.bin);
        topBody.position.y = tb.h / 2;
        topBody.name = 'TopPowderBin';
        g.add(topBody);

        // 侧向加强筋
        if (this.config.industrial) {
            const ribGeom = new THREE.BoxGeometry(0.06, tb.h * 0.9, 0.12);
            for (let i = -2; i <= 2; i++) {
                const rib = new THREE.Mesh(ribGeom, this.materials.flange);
                rib.position.set((tb.w / 2 - 0.1) * Math.sign(i) * 0 + i * (tb.w / 5), tb.h / 2, tb.d / 2 + 0.01);
                rib.rotation.y = 0;
                g.add(rib);
                const rib2 = rib.clone();
                rib2.position.z = -tb.d / 2 - 0.01;
                g.add(rib2);
            }
        }

        const topCone = new THREE.Mesh(new THREE.ConeGeometry(tb.d * 0.45, tb.coneH, 36), this.materials.cone);
        topCone.rotation.x = Math.PI;
        // 使矩形粉仓与下方锥体严丝合缝：锥体基座贴合仓体底面
        topCone.position.set(0, -tb.coneH / 2, 0);
        g.add(topCone);

        // 顶部小型仓顶除尘器（简化袋滤/风机）
        if (this.config.industrial) {
            const bag = new THREE.Mesh(new THREE.CylinderGeometry(0.7, 0.7, 0.8, 24), this.materials.bin);
            bag.position.set(-tb.w / 3, tb.h + tb.coneH + 0.8, 0);
            g.add(bag);
            const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.35, 0.5, 20), this.materials.pipe);
            fan.position.set(-tb.w / 3, tb.h + tb.coneH + 1.35, 0);
            g.add(fan);
        }

        // Down pipe with valves to Upper silo
        const dp = this.config.dropPipe;
        const pipe1 = new THREE.Mesh(new THREE.CylinderGeometry(dp.dia / 2, dp.dia / 2, 2.2, 20), this.materials.pipe);
        pipe1.position.set(0, tb.h + tb.coneH + 1.1, 0);
        g.add(pipe1);

        // Rotary Valve 1（星型给料阀）
        const v1 = this.#createRotaryValve(dp.dia * 0.75, 0.45);
        v1.position.set(0, tb.h + tb.coneH + 0.4, 0);
        g.add(v1);

        // Upper silo (cyl + cone)
        const us = this.config.upperSilo;
        const upperCyl = new THREE.Mesh(new THREE.CylinderGeometry(us.r, us.r, us.h, 48), this.materials.bin);
        upperCyl.position.set(0, tb.h + tb.coneH + 2.2 + us.h / 2, 0);
        g.add(upperCyl);

        // 立壁加强圈
        if (this.config.industrial) {
            const hoop = new THREE.TorusGeometry(us.r + 0.02, 0.03, 8, 48);
            const ring1 = new THREE.Mesh(hoop, this.materials.flange);
            ring1.rotation.x = Math.PI / 2;
            ring1.position.y = upperCyl.position.y + us.h / 2 - 0.3;
            g.add(ring1);
            const ring2 = ring1.clone();
            ring2.position.y = upperCyl.position.y - us.h / 2 + 0.3;
            g.add(ring2);
        }

        const upperCone = new THREE.Mesh(new THREE.ConeGeometry(us.r * 0.95, us.coneH, 36), this.materials.cone);
        upperCone.rotation.x = Math.PI;
        // 使上仓灰与下方锥体贴合：锥体基座与圆柱仓底面对齐
        upperCone.position.set(0, upperCyl.position.y - us.h / 2 - us.coneH / 2, 0);
        g.add(upperCone);

        // Down pipe 2 with valve to Lower silo
        const pipe2 = new THREE.Mesh(new THREE.CylinderGeometry(dp.dia / 2, dp.dia / 2, 1.6, 20), this.materials.pipe);
        pipe2.position.set(0, upperCone.position.y + us.coneH / 2 + 0.8, 0);
        g.add(pipe2);

        const v2 = this.#createRotaryValve(dp.dia * 0.75, 0.45);
        v2.position.set(0, pipe2.position.y - 0.4, 0);
        g.add(v2);

        // Lower silo (cyl + cone)
        const ls = this.config.lowerSilo;
        const lowerCyl = new THREE.Mesh(new THREE.CylinderGeometry(ls.r, ls.r, ls.h, 48), this.materials.bin);
        lowerCyl.position.set(0, pipe2.position.y + 0.8 + ls.h / 2, 0);
        g.add(lowerCyl);

        // 加强圈
        if (this.config.industrial) {
            const hoop2 = new THREE.TorusGeometry(ls.r + 0.02, 0.03, 8, 48);
            const r3 = new THREE.Mesh(hoop2, this.materials.flange);
            r3.rotation.x = Math.PI / 2;
            r3.position.y = lowerCyl.position.y + ls.h / 2 - 0.3;
            g.add(r3);
            const r4 = r3.clone();
            r4.position.y = lowerCyl.position.y - ls.h / 2 + 0.3;
            g.add(r4);
        }

        const lowerCone = new THREE.Mesh(new THREE.ConeGeometry(ls.r * 0.95, ls.coneH, 36), this.materials.cone);
        lowerCone.rotation.x = Math.PI;
        // 使下仓灰与锥体贴合
        lowerCone.position.set(0, lowerCyl.position.y - ls.h / 2 - ls.coneH / 2, 0);
        g.add(lowerCone);

        // Blue trough at bottom（含皮带/螺旋表示）
        const tr = this.config.trough;
        const trough = new THREE.Mesh(new THREE.BoxGeometry(tr.w, tr.h, tr.d), this.materials.trough);
        trough.position.set(0, lowerCone.position.y + ls.coneH / 2 + tr.h / 2 + 0.2, 0);
        trough.name = 'blueTrough';
        g.add(trough);

        if (this.config.industrial) {
            // 简化螺旋输送器
            const screw = new THREE.Mesh(new THREE.CylinderGeometry(tr.h * 0.25, tr.h * 0.25, tr.w * 0.9, 16), this.materials.pipe);
            screw.rotation.z = Math.PI / 2;
            screw.position.set(0, trough.position.y + 0.02, 0);
            g.add(screw);
            // 电机
            const motor = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.4, 0.4), this.materials.pipe);
            motor.position.set(tr.w / 2 - 0.6, trough.position.y + 0.35, 0);
            g.add(motor);
        }

        // Truck loading short pipe on right side from lower silo
        const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.45, 1.4, 24), this.materials.pipe);
        outlet.rotation.z = Math.PI / 2;
        outlet.position.set(ls.r + 0.7, lowerCyl.position.y, tr.d / 2 + 0.2);
        g.add(outlet);

        const flange = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.12, 24), this.materials.flange);
        flange.rotation.z = Math.PI / 2;
        flange.position.copy(outlet.position).x += 0.8;
        g.add(flange);

        // 端口集合
        this.portMap = {
            truckLoad: new THREE.Vector3(flange.position.x, flange.position.y, flange.position.z),
            topFeed: new THREE.Vector3(0, tb.h + 0.2, -tb.d / 2)
        };

        this.group.add(g);
        
    }

    #createRotaryValve(bodyDia = 0.6, height = 0.45) {
        const grp = new THREE.Group();
        const body = new THREE.Mesh(new THREE.CylinderGeometry(bodyDia / 2, bodyDia / 2, height, 20), this.materials.valve);
        grp.add(body);
        const box = new THREE.Mesh(new THREE.BoxGeometry(bodyDia * 0.9, height * 0.5, bodyDia * 0.6), this.materials.flange);
        box.position.y = height * 0.1;
        grp.add(box);
        const motor = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.15, 0.4, 16), this.materials.pipe);
        motor.rotation.z = Math.PI / 2;
        motor.position.set(bodyDia * 0.65, 0, 0);
        grp.add(motor);
        return grp;
    }

    #applyTransform() {
        const { position, rotation, scale } = this.config;
        this.group.position.set(position.x, position.y, position.z);
        this.group.rotation.set(rotation.x, rotation.y, rotation.z);
        this.group.scale.setScalar(scale);
    }
}

if (typeof window !== 'undefined') {
    window.InFurnaceCalciumInjection = InFurnaceCalciumInjection;
}


