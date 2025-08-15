/**
 * NaN值验证和修复工具
 * 用于检测和修复Three.js几何体中的NaN值问题
 */
class NaNValidator {
    constructor() {
        this.errorCount = 0;
        this.fixCount = 0;
        this.logEnabled = true;
    }

    /**
     * 验证数值是否有效
     */
    isValidNumber(value) {
        return typeof value === 'number' && !isNaN(value) && isFinite(value);
    }

    /**
     * 验证向量是否有效
     */
    isValidVector3(vector) {
        return vector && 
               this.isValidNumber(vector.x) && 
               this.isValidNumber(vector.y) && 
               this.isValidNumber(vector.z);
    }

    /**
     * 修复无效的数值
     */
    fixNumber(value, defaultValue = 0) {
        if (this.isValidNumber(value)) {
            return value;
        }
        
        this.errorCount++;
        if (this.logEnabled) {
            console.warn('NaNValidator: 修复无效数值', { 
                original: value, 
                fixed: defaultValue,
                stack: new Error().stack.split('\n')[2]
            });
        }
        
        this.fixCount++;
        return defaultValue;
    }

    /**
     * 修复向量
     */
    fixVector3(vector, defaultVector = { x: 0, y: 0, z: 0 }) {
        if (!vector) {
            this.errorCount++;
            return { ...defaultVector };
        }

        const fixed = {
            x: this.fixNumber(vector.x, defaultVector.x),
            y: this.fixNumber(vector.y, defaultVector.y),
            z: this.fixNumber(vector.z, defaultVector.z)
        };

        return fixed;
    }

    /**
     * 验证几何体的位置属性
     */
    validateGeometry(geometry, name = 'unknown') {
        if (!geometry || !geometry.attributes || !geometry.attributes.position) {
            return false;
        }

        const positions = geometry.attributes.position.array;
        let hasNaN = false;
        let nanCount = 0;

        for (let i = 0; i < positions.length; i++) {
            if (!this.isValidNumber(positions[i])) {
                hasNaN = true;
                nanCount++;
                // 修复NaN值
                positions[i] = 0;
                this.fixCount++;
            }
        }

        if (hasNaN) {
            this.errorCount++;
            if (this.logEnabled) {
                console.warn(`NaNValidator: 几何体 "${name}" 包含 ${nanCount} 个NaN值，已修复`, {
                    geometry: name,
                    nanCount: nanCount,
                    totalVertices: positions.length / 3
                });
            }
            
            // 标记需要更新
            geometry.attributes.position.needsUpdate = true;
            geometry.computeBoundingSphere();
        }

        return !hasNaN;
    }

    /**
     * 验证网格对象
     */
    validateMesh(mesh, name = 'unknown') {
        if (!mesh) return false;

        let isValid = true;

        // 检查位置
        if (!this.isValidVector3(mesh.position)) {
            const fixed = this.fixVector3(mesh.position);
            mesh.position.set(fixed.x, fixed.y, fixed.z);
            isValid = false;
        }

        // 检查旋转
        if (!this.isValidVector3(mesh.rotation)) {
            const fixed = this.fixVector3(mesh.rotation);
            mesh.rotation.set(fixed.x, fixed.y, fixed.z);
            isValid = false;
        }

        // 检查缩放
        if (!this.isValidVector3(mesh.scale)) {
            const fixed = this.fixVector3(mesh.scale, { x: 1, y: 1, z: 1 });
            mesh.scale.set(fixed.x, fixed.y, fixed.z);
            isValid = false;
        }

        // 检查几何体
        if (mesh.geometry) {
            const geometryValid = this.validateGeometry(mesh.geometry, name);
            isValid = isValid && geometryValid;
        }

        return isValid;
    }

    /**
     * 递归验证组对象
     */
    validateGroup(group, name = 'unknown') {
        if (!group) return false;

        let isValid = true;

        // 验证组本身
        if (!this.validateMesh(group, name)) {
            isValid = false;
        }

        // 递归验证子对象
        if (group.children) {
            group.children.forEach((child, index) => {
                const childName = child.name || `${name}_child_${index}`;
                
                if (child.type === 'Group') {
                    if (!this.validateGroup(child, childName)) {
                        isValid = false;
                    }
                } else if (child.type === 'Mesh') {
                    if (!this.validateMesh(child, childName)) {
                        isValid = false;
                    }
                }
            });
        }

        return isValid;
    }

    /**
     * 验证场景中的所有对象
     */
    validateScene(scene) {
        if (!scene) return false;

        let isValid = true;
        const startTime = performance.now();

        scene.traverse((object) => {
            if (object.type === 'Mesh') {
                if (!this.validateMesh(object, object.name || 'unnamed_mesh')) {
                    isValid = false;
                }
            }
        });

        const endTime = performance.now();
        
        if (this.logEnabled) {
            console.log('NaNValidator: 场景验证完成', {
                isValid: isValid,
                errorCount: this.errorCount,
                fixCount: this.fixCount,
                duration: `${(endTime - startTime).toFixed(2)}ms`
            });
        }

        return isValid;
    }

    /**
     * 创建安全的几何体
     */
    createSafeGeometry(geometryFactory, geometryName = 'unknown') {
        try {
            let geometry;
            
            // 如果传入的是函数，直接调用
            if (typeof geometryFactory === 'function') {
                geometry = geometryFactory();
            } else {
                // 向后兼容：如果传入的是字符串类型
                const geometryType = geometryFactory;
                const args = Array.prototype.slice.call(arguments, 2);
                
                switch (geometryType) {
                    case 'PlaneGeometry':
                        geometry = new THREE.PlaneGeometry(...args);
                        break;
                    case 'CylinderGeometry':
                        geometry = new THREE.CylinderGeometry(...args);
                        break;
                    case 'TorusGeometry':
                        geometry = new THREE.TorusGeometry(...args);
                        break;
                    case 'BoxGeometry':
                        geometry = new THREE.BoxGeometry(...args);
                        break;
                    case 'ConeGeometry':
                        geometry = new THREE.ConeGeometry(...args);
                        break;
                    default:
                        throw new Error(`不支持的几何体类型: ${geometryType}`);
                }
            }

            // 验证创建的几何体
            this.validateGeometry(geometry, geometryName);
            
            return geometry;
        } catch (error) {
            console.error('NaNValidator: 创建几何体失败', { geometryName, error });
            this.errorCount++;
            this.fixCount++;
            
            // 返回一个安全的默认几何体
            const fallbackGeometry = new THREE.BoxGeometry(1, 1, 1);
            this.validateGeometry(fallbackGeometry, 'fallback_geometry');
            return fallbackGeometry;
        }
    }

    /**
     * 获取统计信息
     */
    getStatistics() {
        return {
            totalValidations: this.errorCount + this.fixCount,
            nanDetections: this.errorCount,
            geometryFixes: this.fixCount,
            meshValidations: this.errorCount,
            groupValidations: this.errorCount,
            errorCount: this.errorCount,
            fixCount: this.fixCount,
            ratio: this.errorCount > 0 ? (this.fixCount / this.errorCount * 100).toFixed(2) + '%' : '0%'
        };
    }

    /**
     * 获取简化统计信息（保持向后兼容）
     */
    getStats() {
        return {
            errorCount: this.errorCount,
            fixCount: this.fixCount,
            ratio: this.errorCount > 0 ? (this.fixCount / this.errorCount * 100).toFixed(2) + '%' : '0%'
        };
    }

    /**
     * 重置统计
     */
    reset() {
        this.errorCount = 0;
        this.fixCount = 0;
    }

    /**
     * 启用/禁用日志
     */
    setLogging(enabled) {
        this.logEnabled = enabled;
    }
}

// 创建全局实例
window.nanValidator = new NaNValidator();

// 导出类
if (typeof module !== 'undefined' && module.exports) {
    module.exports = NaNValidator;
}