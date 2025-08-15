/**
 * 真空缓冲罐（立式压力容器）
 */
class VacuumReceiverTank {
    constructor(config = {}) {
        this.group = new THREE.Group();
        this.config = {
            name: config.name || '真空缓冲罐',
            height: config.height || 5,
            radius: config.radius || 1.2,
            position: config.position || { x: 2, y: 0, z: 0 },
            rotation: config.rotation || { x: 0, y: 0, z: 0 },
            color: 0x1D4ED8,
            ...config
        };
        this.ports = {};
        this.initialize();
    }

    get groupPosition() { return this.group.position; }
    getGroup() { return this.group; }

    initialize() {
        const { height, radius } = this.config;
        const bodyGeom = new THREE.CylinderGeometry(radius, radius, height, 24);
        const capGeom = new THREE.SphereGeometry(radius, 24, 16);
        const mat = new THREE.MeshStandardMaterial({ color: this.config.color, metalness: 0.65, roughness: 0.35 });
        const body = new THREE.Mesh(bodyGeom, mat); body.castShadow = true; body.receiveShadow = true;
        const top = new THREE.Mesh(capGeom, mat); top.position.y = height / 2; top.castShadow = true;
        const bottom = new THREE.Mesh(capGeom, mat); bottom.position.y = -height / 2; bottom.rotation.x = Math.PI; bottom.castShadow = true;
        this.group.add(body, top, bottom);

        // 进出口法兰
        const flangeMat = new THREE.MeshStandardMaterial({ color: 0x9AA5B1, metalness: 0.85, roughness: 0.3 });
        const nozzle = (r = 0.18, len = 0.6) => new THREE.Mesh(new THREE.CylinderGeometry(r, r, len, 16), flangeMat);
        const inlet = nozzle(); inlet.rotation.z = Math.PI / 2; inlet.position.set(radius + 0.3, height / 2 - 0.4, 0);
        const outlet = nozzle(); outlet.rotation.z = Math.PI / 2; outlet.position.set(radius + 0.3, -0.8, 0);
        this.group.add(inlet, outlet);

        this.ports.inlet = { x: inlet.position.x + 0.3, y: inlet.position.y, z: inlet.position.z };
        this.ports.outlet = { x: outlet.position.x + 0.3, y: outlet.position.y, z: outlet.position.z };

        // 摆放
        this.group.position.set(this.config.position.x, this.config.position.y + height / 2, this.config.position.z);
        this.group.rotation.set(this.config.rotation.x, this.config.rotation.y, this.config.rotation.z);

        // 标签
        this.createLabels();
    }

    getPortWorldPosition(name) {
        if (!this.ports[name]) return null;
        const local = new THREE.Vector3(this.ports[name].x, this.ports[name].y, this.ports[name].z);
        return this.group.localToWorld(local.clone());
    }

    createLabels() {
        const labelGroup = new THREE.Group();
        
        // 参考真空皮带机的标签实现
        const label = this.createSpriteLabel(this.config.name, '#FFD54F');
        label.position.set(0, this.config.height / 2 + 1.0, this.config.radius + 0.5);
        // 与真空皮带机标签一致风格
        label.scale.set(3.98, 1.2, 1);
        label.material.opacity = 0.98;
        label.name = `label_${this.config.name}`;
        labelGroup.add(label);

        labelGroup.name = 'VRT_Labels';
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


