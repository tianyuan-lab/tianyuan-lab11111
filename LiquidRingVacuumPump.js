/**
 * 液环真空泵（简化工业外观）
 */
class LiquidRingVacuumPump {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.config = {
            name: config.name || '液环真空泵',
            position: config.position || { x: 0, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            bodyColor: 0x1D4ED8,
            ...config
        };
        this.ports = {};
        this.initialize();
    }

    initialize() {
        const mat = new THREE.MeshStandardMaterial({ color: this.config.bodyColor, metalness: 0.7, roughness: 0.35 });
        // 泵体
        const casing = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 2.0, 24), mat);
        casing.rotation.z = Math.PI / 2; casing.castShadow = true;
        this.group.add(casing);
        // 端盖/轴承座
        const end1 = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.6, 0.4, 20), mat);
        end1.rotation.z = Math.PI / 2; end1.position.x = -1.2; this.group.add(end1);
        const end2 = end1.clone(); end2.position.x = 1.2; this.group.add(end2);

        // 电机与底座
        const motor = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.8, 0.8), new THREE.MeshStandardMaterial({ color: 0x2F80ED, metalness: 0.6, roughness: 0.5 }));
        motor.position.set(-2.2, 0.4, 0); this.group.add(motor);
        const base = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.2, 1.6), new THREE.MeshStandardMaterial({ color: 0x4A5568, metalness: 0.7, roughness: 0.45 }));
        base.position.y = 0; base.position.x = 0; base.position.z = 0; this.group.add(base);

        // 进出口短管
        const nozzleMat = new THREE.MeshStandardMaterial({ color: 0x9AA5B1, metalness: 0.85, roughness: 0.3 });
        const inlet = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16), nozzleMat);
        inlet.position.set(0.6, 0.5, -0.8); inlet.rotation.x = Math.PI / 2; this.group.add(inlet);
        const outlet = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.2, 0.8, 16), nozzleMat);
        outlet.position.set(0.6, 0.5, 0.8); outlet.rotation.x = Math.PI / 2; this.group.add(outlet);

        // 端口记录（局部坐标）
        this.ports.inlet = { x: inlet.position.x, y: inlet.position.y + 0.4, z: inlet.position.z };
        this.ports.outlet = { x: outlet.position.x, y: outlet.position.y + 0.4, z: outlet.position.z };

        // 摆放
        this.group.position.set(this.config.position.x, this.config.position.y + 0.2, this.config.position.z);
        this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);

        // 标签
        this.createLabels();
    }

    getPortWorldPosition(name) {
        if (!this.ports[name]) return null;
        const v = new THREE.Vector3(this.ports[name].x, this.ports[name].y, this.ports[name].z);
        return this.group.localToWorld(v.clone());
    }

    createLabels() {
        const labelGroup = new THREE.Group();
        
        // 参考真空皮带机的标签实现
        const label = this.createSpriteLabel(this.config.name, '#FFD54F');
        label.position.set(0, 6, 1.5);
        // 与真空皮带机标签一致风格
        label.scale.set(3.98, 1.2, 1);
        label.material.opacity = 0.98;
        label.name = `label_${this.config.name}`;
        labelGroup.add(label);

        labelGroup.name = 'LRVP_Labels';
        this.group.add(labelGroup);
    }

    createSpriteLabel(text, color = '#00BCD4') {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = 256; canvas.height = 64;
        ctx.fillStyle = 'rgba(0,0,0,0.75)';
        this.#roundRect(ctx, 6, 6, 244, 52, 8); ctx.fill();
        ctx.strokeStyle = color; ctx.lineWidth = 2; this.#roundRect(ctx, 6, 6, 244, 52, 8); ctx.stroke();
        ctx.fillStyle = color; ctx.font = 'bold 22px Microsoft YaHei, Arial'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(text, 128, 32);
        const tex = new THREE.CanvasTexture(canvas); tex.needsUpdate = true;
        const mat = new THREE.SpriteMaterial({ map: tex, transparent: true, opacity: 0.95 });
        const spr = new THREE.Sprite(mat); spr.scale.set(4, 1.1, 1);
        spr.name = `label_${text}`;
        return spr;
    }

    #roundRect(ctx, x, y, w, h, r) {
        const rr = Math.min(r, w / 2, h / 2);
        ctx.beginPath();
        ctx.moveTo(x + rr, y);
        ctx.arcTo(x + w, y, x + w, y + h, rr);
        ctx.arcTo(x + w, y + h, x, y + h, rr);
        ctx.arcTo(x, y + h, x, y, rr);
        ctx.arcTo(x, y, x + w, y, rr);
        ctx.closePath();
    }
}


