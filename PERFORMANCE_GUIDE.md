# 3D脱硫塔工艺流程图 - 性能优化指南

## 目录

- [概述](#概述)
- [模型优化](#模型优化)
- [渲染优化](#渲染优化)
- [资源加载优化](#资源加载优化)
- [内存管理](#内存管理)
- [移动端优化](#移动端优化)
- [监控与分析](#监控与分析)
- [常见问题排查](#常见问题排查)

## 概述

本指南提供了一系列优化策略，帮助提升3D脱硫塔工艺流程图的渲染性能和用户体验。优化目标包括：

- **提高帧率**：保持稳定60+ FPS（PC）或30+ FPS（移动端）
- **减少加载时间**：优化资源加载流程
- **降低内存占用**：防止内存泄漏和过度使用
- **提升交互响应**：确保操作流畅无延迟

## 模型优化

### 几何体优化

| 优化项 | 推荐值 | 实现方法 |
|-------|-------|--------|
| 多边形预算 | 整个场景 < 100万面 | 使用LOD (Level of Detail)技术 |
| 单个模型面数 | 复杂设备 < 20,000面<br>简单设备 < 5,000面 | 使用Blender的Decimate修改器 |
| 实例化 | 相同组件使用实例化 | 使用`THREE.InstancedMesh` |

```javascript
// 实例化示例 - 对于重复的阀门/管道组件
const instanceCount = 50;  // 实例数量
const geometry = new THREE.CylinderGeometry(0.5, 0.5, 2, 16);
const material = new THREE.MeshStandardMaterial({ color: 0x999999 });
const instancedMesh = new THREE.InstancedMesh(geometry, material, instanceCount);

// 设置每个实例的矩阵
const matrix = new THREE.Matrix4();
for (let i = 0; i < instanceCount; i++) {
  matrix.setPosition(positions[i].x, positions[i].y, positions[i].z);
  instancedMesh.setMatrixAt(i, matrix);
}
scene.add(instancedMesh);
```

### 几何体压缩

使用Draco压缩或meshoptimizer优化glTF模型：

```bash
# 使用gltf-transform进行Draco压缩
npm install -g @gltf-transform/cli
gltf-transform draco input.glb output.glb --level 7

# 使用meshoptimizer优化
gltf-transform meshopt input.glb output.glb --ratio 0.01
```

## 渲染优化

### 材质合并

| 优化项 | 推荐值 | 说明 |
|-------|-------|-----|
| 材质数量 | < 20个 | 合并相似材质，减少Draw Calls |
| 贴图集 | 使用2K-4K贴图集 | 将多个小贴图合并为贴图集 |

```javascript
// 材质合并示例
function mergeSimilarMaterials(model) {
  const materialMap = new Map();
  
  model.traverse(obj => {
    if (obj.isMesh && obj.material) {
      // 基于材质属性创建唯一键
      const key = getMaterialKey(obj.material);
      
      if (!materialMap.has(key)) {
        materialMap.set(key, obj.material);
      } else {
        // 复用已有材质
        obj.material = materialMap.get(key);
      }
    }
  });
}
```

### 渲染技术

| 技术 | 适用场景 | 实现方法 |
|-----|---------|--------|
| 视锥体剔除 | 大型场景 | 启用`THREE.FrustumCulling` |
| 遮挡剔除 | 复杂工业设备 | 使用`THREE.WebGLRenderer.renderLists` |
| 合批渲染 | 静态场景 | 使用`THREE.BufferGeometryUtils.mergeBufferGeometries` |

```javascript
// 合批渲染示例 - 合并静态几何体
const geometries = [];
staticObjects.forEach(obj => {
  if (obj.isMesh) {
    // 应用对象的世界矩阵到几何体
    const geometry = obj.geometry.clone();
    geometry.applyMatrix4(obj.matrixWorld);
    geometries.push(geometry);
  }
});

// 合并几何体
const mergedGeometry = THREE.BufferGeometryUtils.mergeBufferGeometries(geometries);
const mergedMesh = new THREE.Mesh(mergedGeometry, material);
scene.add(mergedMesh);

// 移除原始对象
staticObjects.forEach(obj => scene.remove(obj));
```

### 着色器优化

- 使用简化的自定义着色器替代复杂PBR材质
- 对非关键设备使用简化材质

```javascript
// 简化着色器示例 - 用于远处的非关键设备
const simpleShaderMaterial = new THREE.ShaderMaterial({
  uniforms: {
    color: { value: new THREE.Color(0x999999) },
    opacity: { value: 1.0 }
  },
  vertexShader: `
    void main() {
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform vec3 color;
    uniform float opacity;
    
    void main() {
      gl_FragColor = vec4(color, opacity);
    }
  `,
  transparent: true
});
```

## 资源加载优化

### 资源压缩

| 资源类型 | 推荐格式 | 压缩率 |
|---------|---------|-------|
| 3D模型 | glTF/GLB + Draco | 原始大小的20-30% |
| 纹理 | KTX2/Basis | 原始大小的25% |
| 环境贴图 | RGBM编码 | 原始HDR的30% |

### 资源加载策略

```javascript
// 分级加载示例
const manager = new THREE.LoadingManager();
manager.onProgress = (url, loaded, total) => {
  const progress = (loaded / total * 100).toFixed(2);
  updateProgressBar(progress);
};

// 优先加载核心组件
const coreLoader = new THREE.GLTFLoader(manager);
const secondaryLoader = new THREE.GLTFLoader(manager);

// 1. 先加载核心设备（脱硫塔、循环泵等）
Promise.all(coreComponents.map(component => 
  loadModel(coreLoader, component.url)
)).then(() => {
  // 2. 显示场景并允许交互
  scene.visible = true;
  controls.enabled = true;
  
  // 3. 后台加载次要组件（管道、阀门等）
  secondaryComponents.forEach(component => {
    loadModel(secondaryLoader, component.url).then(model => {
      scene.add(model);
    });
  });
});
```

## 内存管理

### 资源释放

```javascript
// 正确释放Three.js资源
function disposeObject(obj) {
  if (obj.geometry) {
    obj.geometry.dispose();
  }
  
  if (obj.material) {
    if (Array.isArray(obj.material)) {
      obj.material.forEach(material => disposeMaterial(material));
    } else {
      disposeMaterial(obj.material);
    }
  }
  
  // 递归处理子对象
  if (obj.children && obj.children.length > 0) {
    for (let i = obj.children.length - 1; i >= 0; i--) {
      disposeObject(obj.children[i]);
      obj.remove(obj.children[i]);
    }
  }
}

function disposeMaterial(material) {
  // 释放材质中的纹理
  for (const key in material) {
    if (material[key] && material[key].isTexture) {
      material[key].dispose();
    }
  }
  material.dispose();
}
```

### 对象池

对于频繁创建和销毁的对象（如粒子效果），使用对象池：

```javascript
class ParticlePool {
  constructor(size) {
    this.pool = [];
    this.active = [];
    
    // 预创建粒子
    const geometry = new THREE.SphereGeometry(0.1, 8, 8);
    const material = new THREE.MeshBasicMaterial({ color: 0xffffff });
    
    for (let i = 0; i < size; i++) {
      const particle = new THREE.Mesh(geometry, material.clone());
      particle.visible = false;
      this.pool.push(particle);
      scene.add(particle);
    }
  }
  
  get() {
    if (this.pool.length === 0) return null;
    
    const particle = this.pool.pop();
    this.active.push(particle);
    particle.visible = true;
    return particle;
  }
  
  release(particle) {
    const index = this.active.indexOf(particle);
    if (index !== -1) {
      this.active.splice(index, 1);
      particle.visible = false;
      this.pool.push(particle);
    }
  }
}
```

## 移动端优化

### 移动端特定优化

| 优化项 | 推荐值 | 实现方法 |
|-------|-------|--------|
| 渲染分辨率 | 设备像素比 * 0.7 | 使用`renderer.setPixelRatio()` |
| 简化几何体 | 降低50%面数 | 使用LOD或单独的移动端模型 |
| 后处理效果 | 最小化或禁用 | 条件性启用后处理 |

```javascript
// 移动端检测与优化
function optimizeForMobile() {
  const isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  
  if (isMobile) {
    // 降低渲染分辨率
    const pixelRatio = Math.min(window.devicePixelRatio, 2) * 0.7;
    renderer.setPixelRatio(pixelRatio);
    
    // 降低阴影质量
    renderer.shadowMap.type = THREE.BasicShadowMap;
    
    // 加载简化模型
    modelLoader.setPath('./models/mobile/');
    
    // 禁用或简化后处理
    composer.removePass(bloomPass);
    ssaoPass.output = THREE.SSAOPass.OUTPUT.Default;
  }
}
```

## 监控与分析

### 性能监控

```javascript
// 添加性能监控
import Stats from 'three/examples/jsm/libs/stats.module.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

// 在动画循环中更新
function animate() {
  requestAnimationFrame(animate);
  stats.begin();
  
  // 渲染代码
  renderer.render(scene, camera);
  
  stats.end();
}
```

### 性能分析

```javascript
// 添加性能分析点
function measurePerformance() {
  // 测量模型加载时间
  console.time('Model Loading');
  loader.load('model.glb', (gltf) => {
    console.timeEnd('Model Loading');
    scene.add(gltf.scene);
    
    // 测量首帧渲染时间
    console.time('First Render');
    renderer.render(scene, camera);
    console.timeEnd('First Render');
  });
  
  // 测量特定操作性能
  function measureOperation(name, operation) {
    console.time(name);
    operation();
    console.timeEnd(name);
  }
  
  // 使用示例
  measureOperation('Scene Traversal', () => {
    scene.traverse(obj => {
      // 复杂操作
    });
  });
}
```

## 常见问题排查

### 帧率下降排查

1. **检查Draw Calls**：使用Three.js Inspector或浏览器性能工具
2. **检查内存泄漏**：观察内存使用曲线是否持续上升
3. **检查复杂计算**：将复杂计算移至Web Worker

```javascript
// 使用Web Worker进行复杂计算
const worker = new Worker('pathfinding-worker.js');

// 主线程发送数据
worker.postMessage({
  navMesh: navMeshData,
  startPoint: [x1, y1, z1],
  endPoint: [x2, y2, z2]
});

// 接收结果
worker.onmessage = function(e) {
  const path = e.data.path;
  visualizePath(path);
};
```

### 常见性能问题与解决方案

| 问题 | 可能原因 | 解决方案 |
|-----|---------|--------|
| 加载缓慢 | 模型过大 | 使用Draco压缩、分级加载 |
| 交互卡顿 | Draw Calls过多 | 合并材质、使用实例化 |
| 内存泄漏 | 未正确释放资源 | 使用disposeObject函数清理 |
| 移动端过热 | 渲染负载过高 | 降低分辨率、简化几何体 |

---

## 优化检查清单

- [ ] 模型面数控制在预算范围内
- [ ] 使用LOD技术处理复杂模型
- [ ] 合并相似材质减少Draw Calls
- [ ] 实例化重复组件
- [ ] 使用Draco/meshoptimizer压缩模型
- [ ] 使用KTX2/Basis压缩纹理
- [ ] 实现分级加载策略
- [ ] 正确释放不再使用的资源
- [ ] 为移动端提供特定优化
- [ ] 添加性能监控工具

---

> **注意**：本优化指南中的建议应根据项目具体情况选择性应用。优化是一个平衡过程，需要在视觉质量和性能之间找到适合目标平台的平衡点。