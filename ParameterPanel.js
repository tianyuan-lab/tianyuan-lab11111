// 工艺参数显示面板
class ProcessParameterPanel {
    constructor(tower) {
        this.tower = tower;
        this.panel = null;
        this.isVisible = false;
        this.currentComponent = null;
        this.createPanel();
    }

    createPanel() {
        this.panel = document.createElement('div');
        this.panel.className = 'parameter-panel';
        this.panel.innerHTML = `
            <div class="panel-header">
                <h3>工艺参数</h3>
                <button class="close-btn" id="panel-close-btn">×</button>
            </div>
            <div class="panel-content">
                <div class="component-info">
                    <h4 id="component-name">选择组件查看参数</h4>
                    <div id="component-details"></div>
                </div>
                <div class="process-flow">
                    <h4>工艺流程</h4>
                    <div id="flow-steps"></div>
                </div>
                <div class="real-time-data">
                    <h4>实时数据</h4>
                    <div id="real-time-values"></div>
                </div>
            </div>
        `;
        
        // 添加样式
        const style = document.createElement('style');
        style.textContent = `
            .parameter-panel {
                position: fixed;
                top: 20px;
                right: 20px;
                width: 400px;
                max-height: 85vh;
                background: rgba(255, 255, 255, 0.95);
                border-radius: 10px;
                box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                z-index: 1000;
                display: none;
                overflow: hidden;
                font-family: 'Microsoft YaHei', Arial, sans-serif;
            }
            
            .panel-header {
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                color: white;
                padding: 15px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }
            
            .panel-header h3 {
                margin: 0;
                font-size: 16px;
            }
            
            .close-btn {
                background: none;
                border: none;
                color: white;
                font-size: 20px;
                cursor: pointer;
                padding: 0;
                width: 25px;
                height: 25px;
                border-radius: 50%;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            
            .close-btn:hover {
                background: rgba(255, 255, 255, 0.2);
            }
            
            .panel-content {
                padding: 15px;
                max-height: calc(80vh - 60px);
                overflow-y: auto;
            }
            
            .component-info, .process-flow, .real-time-data {
                margin-bottom: 20px;
                padding: 10px;
                background: rgba(240, 240, 240, 0.5);
                border-radius: 5px;
            }
            
            .component-info h4, .process-flow h4, .real-time-data h4 {
                margin: 0 0 10px 0;
                color: #333;
                font-size: 14px;
                border-bottom: 1px solid #ddd;
                padding-bottom: 5px;
            }
            
            .parameter-item {
                display: flex;
                justify-content: space-between;
                align-items: flex-start;
                margin: 8px 0;
                font-size: 13px;
                line-height: 1.4;
                word-wrap: break-word;
            }
            
            .parameter-label {
                font-weight: bold;
                color: #555;
                min-width: 120px;
                margin-right: 10px;
                flex-shrink: 0;
            }
            
            .parameter-value {
                color: #007bff;
                flex: 1;
                text-align: right;
                word-break: break-all;
            }
            
            .flow-step {
                margin: 10px 0;
                padding: 10px;
                background: white;
                border-radius: 5px;
                border-left: 3px solid #007bff;
                font-size: 13px;
                line-height: 1.4;
            }
            
            .flow-step-title {
                font-weight: bold;
                color: #333;
                margin-bottom: 5px;
            }
            
            .flow-step-desc {
                color: #666;
                margin-top: 5px;
                line-height: 1.5;
            }
            
            .real-time-value {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin: 8px 0;
                font-size: 13px;
                padding: 5px 0;
                border-bottom: 1px solid #eee;
            }
            
            .value-indicator {
                width: 10px;
                height: 10px;
                border-radius: 50%;
                margin-left: 5px;
            }
            
            .value-normal { background: #28a745; }
            .value-warning { background: #ffc107; }
            .value-danger { background: #dc3545; }
        `;
        
        document.head.appendChild(style);
        document.body.appendChild(this.panel);
        
        // 添加关闭按钮事件监听器
        const closeBtn = document.getElementById('panel-close-btn');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                this.hide();
            });
        }
        
        // 启动实时数据更新
        this.startRealTimeUpdate();
    }

    show(componentName = null) {
        this.panel.style.display = 'block';
        this.isVisible = true;
        
        if (componentName) {
            this.showComponentInfo(componentName);
        }
        
        this.updateProcessFlow();
        this.updateRealTimeData();
    }

    hide() {
        this.panel.style.display = 'none';
        this.isVisible = false;
    }

    toggle() {
        if (this.isVisible) {
            this.hide();
        } else {
            this.show();
        }
    }

    showComponentInfo(componentName) {
        this.currentComponent = componentName;
        const nameElement = document.getElementById('component-name');
        const detailsElement = document.getElementById('component-details');
        
        nameElement.textContent = this.getComponentDisplayName(componentName);
        
        const config = this.tower.config?.towerConfig?.components;
        const componentConfig = this.getComponentConfig(componentName, config);
        
        if (componentConfig) {
            detailsElement.innerHTML = this.formatComponentDetails(componentConfig);
        } else {
            detailsElement.innerHTML = '<p>暂无详细参数</p>';
        }
    }

    getComponentDisplayName(componentName) {
        const displayNames = {
            'sprayLayers': '喷淋层系统',
            'demisters': '除雾器',
            'internalSupports': '内部支撑',
            'liquidCollection': '液体收集系统',
            'processPipes': '工艺管道'
        };
        return displayNames[componentName] || componentName;
    }

    getComponentConfig(componentName, config) {
        if (!config) return null;
        
        switch (componentName) {
            case 'sprayLayers':
                return config.sprayLayers;
            case 'demisters':
                return config.demisters;
            case 'internalSupports':
                return config.internalSupports;
            case 'liquidCollection':
                return config.liquidCollection;
            default:
                return null;
        }
    }

    formatComponentDetails(config) {
        let html = '';
        
        for (const [key, value] of Object.entries(config)) {
            if (typeof value === 'object' && !Array.isArray(value) && value !== null) {
                // 处理嵌套对象
                html += `<div class="parameter-item">
                    <span class="parameter-label">${this.formatLabel(key)}:</span>
                    <span class="parameter-value">详见下方</span>
                </div>`;
                
                // 递归显示嵌套对象的内容
                for (const [subKey, subValue] of Object.entries(value)) {
                    html += `<div class="parameter-item" style="margin-left: 15px;">
                        <span class="parameter-label">${this.formatLabel(subKey)}:</span>
                        <span class="parameter-value">${Array.isArray(subValue) ? subValue.join(', ') : subValue}</span>
                    </div>`;
                }
            } else if (Array.isArray(value)) {
                html += `<div class="parameter-item">
                    <span class="parameter-label">${this.formatLabel(key)}:</span>
                    <span class="parameter-value">${value.join(', ')}</span>
                </div>`;
            } else {
                html += `<div class="parameter-item">
                    <span class="parameter-label">${this.formatLabel(key)}:</span>
                    <span class="parameter-value">${value}</span>
                </div>`;
            }
        }
        
        return html;
    }

    formatLabel(key) {
        const labelMap = {
            'count': '数量',
            'nozzleCount': '喷嘴数量',
            'nozzleType': '喷嘴类型',
            'flowRate': '流量',
            'pressure': '压力',
            'material': '材质',
            'positions': '位置',
            'type': '类型',
            'efficiency': '效率',
            'thickness': '厚度',
            'height': '高度',
            'specificSurfaceArea': '比表面积',
            'voidFraction': '空隙率',
            'position': '位置',
            'holeCount': '孔数',
            'holeSize': '孔径',
            'openingRatio': '开孔率',
            'pressureDrop': '压降',
            'columnCount': '柱数',
            'columnDiameter': '柱径',
            'loadCapacity': '承载能力',
            'tankVolume': '容积',
            'drainPipes': '排液管数'
        };
        return labelMap[key] || key;
    }

    updateProcessFlow() {
        const flowElement = document.getElementById('flow-steps');
        const processFlow = this.tower.processFlow?.processFlow;
        
        if (!processFlow || !processFlow.steps) {
            flowElement.innerHTML = '<p>暂无工艺流程数据</p>';
            return;
        }
        
        let html = '';
        const relevantSteps = processFlow.steps.slice(0, 5); // 显示前5个步骤
        
        relevantSteps.forEach(step => {
            html += `
                <div class="flow-step">
                    <div class="flow-step-title">${step.id}. ${step.name}</div>
                    <div class="flow-step-desc">${step.description}</div>
                </div>
            `;
        });
        
        flowElement.innerHTML = html;
    }

    updateRealTimeData() {
        const realTimeElement = document.getElementById('real-time-values');
        
        // 模拟实时数据
        const realTimeData = [
            { label: '进气温度', value: '62°C', status: 'normal' },
            { label: '出气温度', value: '55°C', status: 'normal' },
            { label: 'SO₂浓度', value: '28 mg/Nm³', status: 'normal' },
            { label: '液气比', value: '15.2 L/m³', status: 'normal' },
            { label: '塔压降', value: '1.2 kPa', status: 'warning' },
            { label: '脱硫效率', value: '96.2%', status: 'normal' }
        ];
        
        let html = '';
        realTimeData.forEach(data => {
            html += `
                <div class="real-time-value">
                    <span>${data.label}</span>
                    <span>
                        ${data.value}
                        <span class="value-indicator value-${data.status}"></span>
                    </span>
                </div>
            `;
        });
        
        realTimeElement.innerHTML = html;
    }

    startRealTimeUpdate() {
        setInterval(() => {
            if (this.isVisible) {
                this.updateRealTimeData();
            }
        }, 2000); // 每2秒更新一次
    }
}

// 初始化参数面板
function initParameterPanel(tower) {
    if (typeof window !== 'undefined') {
        window.parameterPanel = new ProcessParameterPanel(tower);
        return window.parameterPanel;
    }
    return null;
}

// 显示组件信息
function showComponentInfo(componentName) {
    if (window.parameterPanel) {
        window.parameterPanel.show(componentName);
    }
}

// 切换参数面板
function toggleParameterPanel() {
    if (window.parameterPanel) {
        window.parameterPanel.toggle();
    }
}