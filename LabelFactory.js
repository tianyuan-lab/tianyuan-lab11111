/**
 * 统一的标签工厂：创建清晰、简洁的三维精灵标签
 * - 高分辨率画布（2048x512）+ 大字号（128px）
 * - 线性采样、关闭mipmap，避免缩放模糊
 * - 关闭深度测试/写入，前置渲染，避免被遮挡
 */
(function (global) {
  const registry = [];

  function createStandardLabel(text, color = '#FFD54F', scale = { x: 3.98, y: 1.2 }) {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    canvas.width = 2048;
    canvas.height = 512;

    // 背景与描边
    ctx.fillStyle = 'rgba(0,0,0,0.85)';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = color;
    ctx.lineWidth = 6;
    ctx.strokeRect(12, 12, canvas.width - 24, canvas.height - 24);

    // 文本
    ctx.fillStyle = color;
    ctx.font = 'bold 128px Microsoft YaHei, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(String(text ?? ''), canvas.width / 2, canvas.height / 2);

    // 贴图
    const tex = new THREE.CanvasTexture(canvas);
    tex.needsUpdate = true;
    tex.minFilter = THREE.LinearFilter;
    tex.magFilter = THREE.LinearFilter;
    tex.generateMipmaps = false;

    const mat = new THREE.SpriteMaterial({
      map: tex,
      transparent: true,
      opacity: 0.98,
      depthTest: false,
      depthWrite: false
    });

    const spr = new THREE.Sprite(mat);
    spr.scale.set(scale?.x ?? 3.98, scale?.y ?? 1.2, 1);
    spr.name = `label_${text}`;
    spr.renderOrder = 10000;
    // 记录基础缩放，用于自动缩放保持清晰
    spr.userData.baseScale = { x: scale?.x ?? 3.98, y: scale?.y ?? 1.2 };
    registry.push(spr);
    return spr;
  }

  // 暴露到全局
  global.createStandardLabel = createStandardLabel;

  // 根据相机距离自动缩放（近小远大），改善远视模糊
  global.updateAllLabels = function updateAllLabels(camera) {
    if (!camera) return;
    const camPos = camera.position;
    const fovFactor = Math.tan((camera.fov * Math.PI) / 360); // 与FOV相关，越大缩放越多
    for (const spr of registry) {
      if (!spr || !spr.parent) continue;
      const worldPos = new THREE.Vector3();
      spr.getWorldPosition(worldPos);
      const dist = camPos.distanceTo(worldPos);
      // 动态缩放：与距离、FOV成正比，保证屏幕像素高度基本稳定
      const k = Math.max(0.035, 0.06 * fovFactor); // 调参系数
      const scaleX = spr.userData.baseScale.x * dist * k;
      const scaleY = spr.userData.baseScale.y * dist * k;
      spr.scale.set(scaleX, scaleY, 1);
    }
  };
})(typeof window !== 'undefined' ? window : this);


