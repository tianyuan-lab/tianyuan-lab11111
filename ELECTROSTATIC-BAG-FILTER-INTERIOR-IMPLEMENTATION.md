# 电袋除尘器内部视角实现总结

## 功能概述

成功为电袋除尘器（ElectrostaticBagFilter）实现了内部视角功能，参考空压机房（AirCompressorRoom）的实现逻辑。用户可以通过鼠标点击电袋除尘器进入内部视角，查看内部的ESP（电除尘）区域和袋式除尘区域。

## 实现的功能

### 1. 视角状态管理
- **外部视角（默认）**: 显示完整的电袋除尘器外壳和所有外部结构
- **内部视角**: 隐藏外壳，显示内部的ESP极板和滤袋阵列

### 2. 鼠标点击进入逻辑
- 在 `js/main.js` 的 `onMouseClick` 函数中添加了电袋除尘器的点击检测
- 当检测到点击电袋除尘器且当前为外部视角时，自动进入内部视角
- 当已经在内部视角时，点击会被识别为设备交互（预留扩展空间）

### 3. 相机动画切换
- **进入内部视角**: 相机平滑移动到电袋除尘器内部最佳观察位置
  - 目标位置: `(x, y+15, z)`
  - 相机位置: `(x+30, y+20, z+25)`
- **退出内部视角**: 相机返回到外部总览位置
  - 目标位置: `(0, 15, 0)`
  - 相机位置: `(50, 30, 50)`

### 4. 键盘快捷键支持
- **ESC键**: 从任何内部视角（包括电袋除尘器）快速退出到外部视角
- 与其他设备的内部视角形成统一的交互体验

## 代码修改详情

### ElectrostaticBagFilter.js
1. **构造函数增强**
   ```javascript
   // 初始化视角状态
   this.isInteriorView = false;
   ```

2. **showInterior() 方法**
   - 隐藏主体外壳（BoxGeometry组件）
   - 保持ESP区域（espZone）和袋区（bagZone）可见
   - 隐藏顶部走台、屋面结构等外部组件
   - 设置内部视角标志为true

3. **showExterior() 方法**
   - 重新显示所有外壳和外部结构组件
   - 恢复完整的外观
   - 设置内部视角标志为false

### main.js
1. **点击检测逻辑**
   ```javascript
   // 检查是否点击了电袋除尘器
   if (window.electrostaticBagFilter) {
       const filterIntersects = raycaster.intersectObjects(window.electrostaticBagFilter.getGroup().children, true);
       if (filterIntersects.length > 0) {
           if (!window.electrostaticBagFilter.isInteriorView) {
               enterElectrostaticBagFilterInteriorView();
           }
       }
   }
   ```

2. **视角切换函数**
   - `enterElectrostaticBagFilterInteriorView()`: 进入内部视角
   - `exitElectrostaticBagFilterInteriorView()`: 退出内部视角

3. **键盘事件处理**
   - 在ESC键处理中添加电袋除尘器内部视角的退出逻辑

## 内部视角显示内容

### ESP区域（电除尘区）
- 显示6块竖直的ESP极板
- 极板材质为蓝灰色金属
- 位于每个除尘室的前半部分

### 袋区（袋式除尘区）
- 显示3×4阵列的滤袋（圆柱形）
- 滤袋材质为白色无纺布
- 位于每个除尘室的后半部分

### 隐藏的外部结构
- 主体箱体外壳
- 顶部走台和栏杆
- 人字顶罩屋结构
- 圆锥进气口
- 楼梯塔

## 用户交互说明

### 进入内部视角
1. **鼠标点击**: 点击电袋除尘器的任何可见部分
2. **自动相机移动**: 相机平滑移动到内部观察位置
3. **视觉反馈**: 外壳隐藏，内部结构清晰可见

### 退出内部视角
1. **键盘快捷键**: 按ESC键
2. **程序调用**: 调用 `exitElectrostaticBagFilterInteriorView()` 函数
3. **自动恢复**: 相机返回外部总览，外壳重新显示

### 视角状态
- 通过 `window.electrostaticBagFilter.isInteriorView` 属性检查当前视角状态
- `true`: 内部视角
- `false`: 外部视角

## 测试验证

创建了专门的测试页面 `test-electrostatic-bag-filter-interior.html`，包含：
- 独立的电袋除尘器模型显示
- 视角状态实时显示
- 手动控制按钮
- 操作说明界面

## 技术特点

1. **一致性**: 与空压机房、泵房等其他设备的内部视角实现保持一致
2. **平滑性**: 使用相机动画确保视角切换的平滑体验
3. **完整性**: 支持鼠标点击和键盘快捷键两种交互方式
4. **扩展性**: 预留了内部设备点击交互的扩展空间
5. **兼容性**: 与现有的双塔系统和其他设备视角管理完全兼容

## 后续扩展建议

1. **设备详情**: 在内部视角中点击ESP极板或滤袋时显示设备参数
2. **运行状态**: 添加运行状态指示器（如电压、压差等）
3. **维护模式**: 支持维护模式，显示检修通道和设备拆装状态
4. **实时数据**: 集成实时监控数据显示
5. **操作界面**: 添加虚拟操作面板，支持设备启停控制

通过这次实现，电袋除尘器现在具备了完整的内部视角功能，为用户提供了直观的设备内部结构展示和交互体验。
