import {
  Component,
  ElementRef,
  afterNextRender,
  viewChild,
  OnDestroy,
} from '@angular/core';
import * as echarts from 'echarts';

@Component({
  selector: 'app-chart-demo',
  imports: [],
  template: `    <div class="min-h-screen p-8 bg-[var(--surface-grouped)] text-[var(--text-primary)]">
      <header class="mb-10 max-w-7xl mx-auto">
        <h1 class="text-4xl font-semibold tracking-tight">Analytics</h1>
        <p class="text-[var(--text-secondary)] text-lg mt-2">Modern Apple Design Style Charts - 26 Visualizations</p>
      </header>

      <div class="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
        <!-- Revenue Overview Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Revenue Overview</h2>
            <span class="badge">Monthly</span>
          </div>
          <div #lineChart class="w-full h-[300px]"></div>
        </div>

        <!-- Device Breakdown Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Device Breakdown</h2>
            <span class="badge">Live</span>
          </div>
          <div #doughnutChart class="w-full h-[300px]"></div>
        </div>

        <!-- Weekly Engagement Card -->
        <div class="chart-card md:col-span-2">
          <div class="card-header">
            <h2 class="text-xl font-medium">Weekly Engagement</h2>
            <span class="badge">Active</span>
          </div>
          <div #barChart class="w-full h-[350px]"></div>
        </div>

        <!-- Skill Analysis Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Skill Analysis</h2>
            <span class="badge">Stats</span>
          </div>
          <div #radarChart class="w-full h-[300px]"></div>
        </div>

        <!-- System Load Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">System Load</h2>
            <span class="badge">Live</span>
          </div>
          <div #gaugeChart class="w-full h-[300px]"></div>
        </div>

        <!-- Market Share Card -->
        <div class="chart-card md:col-span-2">
          <div class="card-header">
            <h2 class="text-xl font-medium">Market Share</h2>
            <span class="badge">Trends</span>
          </div>
          <div #stackedAreaChart class="w-full h-[350px]"></div>
        </div>

        <!-- Price Changes Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Price Changes</h2>
            <span class="badge">History</span>
          </div>
          <div #stepLineChart class="w-full h-[300px]"></div>
        </div>

        <!-- Quarterly Sales Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Quarterly Sales</h2>
            <span class="badge">Q1-Q4</span>
          </div>
          <div #stackedBarChart class="w-full h-[300px]"></div>
        </div>

        <!-- Profit Flow Card -->
        <div class="chart-card md:col-span-2">
          <div class="card-header">
            <h2 class="text-xl font-medium">Profit Flow</h2>
            <span class="badge">Financial</span>
          </div>
          <div #waterfallChart class="w-full h-[350px]"></div>
        </div>

        <!-- Height vs Weight Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Height vs Weight</h2>
            <span class="badge">Stats</span>
          </div>
          <div #scatterChart class="w-full h-[300px]"></div>
        </div>

        <!-- Life Expectancy Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Life Expectancy</h2>
            <span class="badge">Global</span>
          </div>
          <div #bubbleChart class="w-full h-[300px]"></div>
        </div>

        <!-- Nightingale Rose Card -->
        <div class="chart-card md:col-span-2">
          <div class="card-header">
            <h2 class="text-xl font-medium">Nightingale Rose</h2>
            <span class="badge">Classic</span>
          </div>
          <div #roseChart class="w-full h-[350px]"></div>
        </div>

        <!-- Sales Funnel Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Sales Funnel</h2>
            <span class="badge">Conversion</span>
          </div>
          <div #funnelChart class="w-full h-[300px]"></div>
        </div>

        <!-- Stock Data Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Stock Data</h2>
            <span class="badge">Trading</span>
          </div>
          <div #candlestickChart class="w-full h-[300px]"></div>
        </div>

        <!-- Salary Distribution Card -->
        <div class="chart-card md:col-span-2">
          <div class="card-header">
            <h2 class="text-xl font-medium">Salary Distribution</h2>
            <span class="badge">HR</span>
          </div>
          <div #boxplotChart class="w-full h-[350px]"></div>
        </div>

        <!-- Activity Matrix Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Activity Matrix</h2>
            <span class="badge">Weekly</span>
          </div>
          <div #heatmapChart class="w-full h-[300px]"></div>
        </div>

        <!-- Contributions Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Contributions</h2>
            <span class="badge">GitHub</span>
          </div>
          <div #calendarChart class="w-full h-[300px]"></div>
        </div>

        <!-- Theme River Card -->
        <div class="chart-card md:col-span-2">
          <div class="card-header">
            <h2 class="text-xl font-medium">Theme River</h2>
            <span class="badge">Fluid</span>
          </div>
          <div #themeRiverChart class="w-full h-[350px]"></div>
        </div>

        <!-- File System Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">File System</h2>
            <span class="badge">Hierarchy</span>
          </div>
          <div #sunburstChart class="w-full h-[300px]"></div>
        </div>

        <!-- Disk Usage Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Disk Usage</h2>
            <span class="badge">Storage</span>
          </div>
          <div #treemapChart class="w-full h-[300px]"></div>
        </div>

        <!-- Network Card -->
        <div class="chart-card md:col-span-2">
          <div class="card-header">
            <h2 class="text-xl font-medium">Network</h2>
            <span class="badge">Nodes</span>
          </div>
          <div #graphChart class="w-full h-[350px]"></div>
        </div>

        <!-- Energy Flow Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Energy Flow</h2>
            <span class="badge">Distribution</span>
          </div>
          <div #sankeyChart class="w-full h-[300px]"></div>
        </div>

        <!-- Car Specs Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Car Specs</h2>
            <span class="badge">Multi-dim</span>
          </div>
          <div #parallelChart class="w-full h-[300px]"></div>
        </div>

        <!-- Vehicle Sales Card -->
        <div class="chart-card md:col-span-2">
          <div class="card-header">
            <h2 class="text-xl font-medium">Vehicle Sales</h2>
            <span class="badge">Icons</span>
          </div>
          <div #pictorialChart class="w-full h-[350px]"></div>
        </div>

        <!-- Polar Bar Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Polar Bar</h2>
            <span class="badge">Circular</span>
          </div>
          <div #polarBarChart class="w-full h-[300px]"></div>
        </div>

        <!-- Temp vs Precipitation Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Temp vs Precipitation</h2>
            <span class="badge">Weather</span>
          </div>
          <div #multiAxisChart class="w-full h-[300px]"></div>
        </div>

        <!-- Organization Card -->
        <div class="chart-card md:col-span-2">
          <div class="card-header">
            <h2 class="text-xl font-medium">Organization</h2>
            <span class="badge">Hierarchy</span>
          </div>
          <div #treeChart class="w-full h-[350px]"></div>
        </div>

        <!-- Active Nodes Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Active Nodes</h2>
            <span class="badge">Live</span>
          </div>
          <div #effectScatterChart class="w-full h-[300px]"></div>
        </div>

        <!-- Data Routes Card -->
        <div class="chart-card">
          <div class="card-header">
            <h2 class="text-xl font-medium">Data Routes</h2>
            <span class="badge">Flow</span>
          </div>
          <div #linesChart class="w-full h-[300px]"></div>
        </div>

        <!-- Custom Render Card -->
        <div class="chart-card md:col-span-2">
          <div class="card-header">
            <h2 class="text-xl font-medium">Custom Render</h2>
            <span class="badge">Special</span>
          </div>
          <div #customChart class="w-full h-[350px]"></div>
        </div>

      </div>
    </div>`,
  styles: [
    `
      .chart-card {
        background: var(--surface-primary);
        border-radius: var(--radius-2xl);
        padding: var(--spacing-6);
        box-shadow: var(--shadow-sm);
        border: 1px solid var(--border-default);
        transition: transform var(--duration-normal) var(--ease-spring),
                    box-shadow var(--duration-normal) var(--ease-spring);
      }
      .chart-card:hover {
        transform: translateY(-2px);
        box-shadow: var(--shadow-md);
      }
      .card-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: var(--spacing-4);
      }
      .badge {
        background: var(--fill-secondary);
        color: var(--text-secondary);
        padding: 4px 10px;
        border-radius: var(--radius-full);
        font-size: var(--text-xs);
        font-weight: 500;
        text-transform: uppercase;
        letter-spacing: 0.05em;
      }
    `
  ]
})
export class ChartDemoComponent implements OnDestroy {
  lineChartRef = viewChild<ElementRef<HTMLElement>>('lineChart');
  doughnutChartRef = viewChild<ElementRef<HTMLElement>>('doughnutChart');
  barChartRef = viewChild<ElementRef<HTMLElement>>('barChart');
  radarChartRef = viewChild<ElementRef<HTMLElement>>('radarChart');
  gaugeChartRef = viewChild<ElementRef<HTMLElement>>('gaugeChart');
  stackedAreaChartRef = viewChild<ElementRef<HTMLElement>>('stackedAreaChart');
  stepLineChartRef = viewChild<ElementRef<HTMLElement>>('stepLineChart');
  stackedBarChartRef = viewChild<ElementRef<HTMLElement>>('stackedBarChart');
  waterfallChartRef = viewChild<ElementRef<HTMLElement>>('waterfallChart');
  scatterChartRef = viewChild<ElementRef<HTMLElement>>('scatterChart');
  bubbleChartRef = viewChild<ElementRef<HTMLElement>>('bubbleChart');
  roseChartRef = viewChild<ElementRef<HTMLElement>>('roseChart');
  funnelChartRef = viewChild<ElementRef<HTMLElement>>('funnelChart');
  candlestickChartRef = viewChild<ElementRef<HTMLElement>>('candlestickChart');
  boxplotChartRef = viewChild<ElementRef<HTMLElement>>('boxplotChart');
  heatmapChartRef = viewChild<ElementRef<HTMLElement>>('heatmapChart');
  calendarChartRef = viewChild<ElementRef<HTMLElement>>('calendarChart');
  themeRiverChartRef = viewChild<ElementRef<HTMLElement>>('themeRiverChart');
  sunburstChartRef = viewChild<ElementRef<HTMLElement>>('sunburstChart');
  treemapChartRef = viewChild<ElementRef<HTMLElement>>('treemapChart');
  graphChartRef = viewChild<ElementRef<HTMLElement>>('graphChart');
  sankeyChartRef = viewChild<ElementRef<HTMLElement>>('sankeyChart');
  parallelChartRef = viewChild<ElementRef<HTMLElement>>('parallelChart');
  pictorialChartRef = viewChild<ElementRef<HTMLElement>>('pictorialChart');
  polarBarChartRef = viewChild<ElementRef<HTMLElement>>('polarBarChart');
  multiAxisChartRef = viewChild<ElementRef<HTMLElement>>('multiAxisChart');
  treeChartRef = viewChild<ElementRef<HTMLElement>>('treeChart');
  effectScatterChartRef = viewChild<ElementRef<HTMLElement>>('effectScatterChart');
  linesChartRef = viewChild<ElementRef<HTMLElement>>('linesChart');
  customChartRef = viewChild<ElementRef<HTMLElement>>('customChart');


  private lineChartInstance: echarts.ECharts | null = null;
  private doughnutChartInstance: echarts.ECharts | null = null;
  private barChartInstance: echarts.ECharts | null = null;
  private radarChartInstance: echarts.ECharts | null = null;
  private gaugeChartInstance: echarts.ECharts | null = null;
  private stackedAreaChartInstance: echarts.ECharts | null = null;
  private stepLineChartInstance: echarts.ECharts | null = null;
  private stackedBarChartInstance: echarts.ECharts | null = null;
  private waterfallChartInstance: echarts.ECharts | null = null;
  private scatterChartInstance: echarts.ECharts | null = null;
  private bubbleChartInstance: echarts.ECharts | null = null;
  private roseChartInstance: echarts.ECharts | null = null;
  private funnelChartInstance: echarts.ECharts | null = null;
  private candlestickChartInstance: echarts.ECharts | null = null;
  private boxplotChartInstance: echarts.ECharts | null = null;
  private heatmapChartInstance: echarts.ECharts | null = null;
  private calendarChartInstance: echarts.ECharts | null = null;
  private themeRiverChartInstance: echarts.ECharts | null = null;
  private sunburstChartInstance: echarts.ECharts | null = null;
  private treemapChartInstance: echarts.ECharts | null = null;
  private graphChartInstance: echarts.ECharts | null = null;
  private sankeyChartInstance: echarts.ECharts | null = null;
  private parallelChartInstance: echarts.ECharts | null = null;
  private pictorialChartInstance: echarts.ECharts | null = null;
  private polarBarChartInstance: echarts.ECharts | null = null;
  private multiAxisChartInstance: echarts.ECharts | null = null;
  private treeChartInstance: echarts.ECharts | null = null;
  private effectScatterChartInstance: echarts.ECharts | null = null;
  private linesChartInstance: echarts.ECharts | null = null;
  private customChartInstance: echarts.ECharts | null = null;


  private resizeListener = () => {
    this.lineChartInstance?.resize();
    this.doughnutChartInstance?.resize();
    this.barChartInstance?.resize();
    this.radarChartInstance?.resize();
    this.gaugeChartInstance?.resize();
    this.stackedAreaChartInstance?.resize();
    this.stepLineChartInstance?.resize();
    this.stackedBarChartInstance?.resize();
    this.waterfallChartInstance?.resize();
    this.scatterChartInstance?.resize();
    this.bubbleChartInstance?.resize();
    this.roseChartInstance?.resize();
    this.funnelChartInstance?.resize();
    this.candlestickChartInstance?.resize();
    this.boxplotChartInstance?.resize();
    this.heatmapChartInstance?.resize();
    this.calendarChartInstance?.resize();
    this.themeRiverChartInstance?.resize();
    this.sunburstChartInstance?.resize();
    this.treemapChartInstance?.resize();
    this.graphChartInstance?.resize();
    this.sankeyChartInstance?.resize();
    this.parallelChartInstance?.resize();
    this.pictorialChartInstance?.resize();
    this.polarBarChartInstance?.resize();
    this.multiAxisChartInstance?.resize();
    this.treeChartInstance?.resize();
    this.effectScatterChartInstance?.resize();
    this.linesChartInstance?.resize();
    this.customChartInstance?.resize();
  };

  constructor() {
    afterNextRender(() => {
      this.initLineChart();
      this.initDoughnutChart();
      this.initBarChart();
      this.initRadarChart();
      this.initGaugeChart();
      this.initStackedAreaChart();
      this.initStepLineChart();
      this.initStackedBarChart();
      this.initWaterfallChart();
      this.initScatterChart();
      this.initBubbleChart();
      this.initRoseChart();
      this.initFunnelChart();
      this.initCandlestickChart();
      this.initBoxplotChart();
      this.initHeatmapChart();
      this.initCalendarChart();
      this.initThemeRiverChart();
      this.initSunburstChart();
      this.initTreemapChart();
      this.initGraphChart();
      this.initSankeyChart();
      this.initParallelChart();
      this.initPictorialChart();
      this.initPolarBarChart();
      this.initMultiAxisChart();
      this.initTreeChart();
      this.initEffectScatterChart();
      this.initLinesChart();
      this.initCustomChart();
      window.addEventListener('resize', this.resizeListener);
    });
  }

  ngOnDestroy(): void {
    window.removeEventListener('resize', this.resizeListener);
    this.lineChartInstance?.dispose();
    this.doughnutChartInstance?.dispose();
    this.barChartInstance?.dispose();
    this.radarChartInstance?.dispose();
    this.gaugeChartInstance?.dispose();
    this.stackedAreaChartInstance?.dispose();
    this.stepLineChartInstance?.dispose();
    this.stackedBarChartInstance?.dispose();
    this.waterfallChartInstance?.dispose();
    this.scatterChartInstance?.dispose();
    this.bubbleChartInstance?.dispose();
    this.roseChartInstance?.dispose();
    this.funnelChartInstance?.dispose();
    this.candlestickChartInstance?.dispose();
    this.boxplotChartInstance?.dispose();
    this.heatmapChartInstance?.dispose();
    this.calendarChartInstance?.dispose();
    this.themeRiverChartInstance?.dispose();
    this.sunburstChartInstance?.dispose();
    this.treemapChartInstance?.dispose();
    this.graphChartInstance?.dispose();
    this.sankeyChartInstance?.dispose();
    this.parallelChartInstance?.dispose();
    this.pictorialChartInstance?.dispose();
    this.polarBarChartInstance?.dispose();
    this.multiAxisChartInstance?.dispose();
    this.treeChartInstance?.dispose();
    this.effectScatterChartInstance?.dispose();
    this.linesChartInstance?.dispose();
    this.customChartInstance?.dispose();
  }


  private initLineChart() {
    const el = this.lineChartRef()?.nativeElement; if (!el) return;
    this.lineChartInstance = echarts.init(el);
    this.lineChartInstance.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12, borderRadius: 12 },
      grid: { left: '0', right: '0', bottom: '0', top: '10px', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b', margin: 16 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#d2d2d7', type: 'dashed' } }, axisLabel: { color: '#86868b' } },
      series: [{ name: 'Revenue', type: 'line', smooth: 0.4, showSymbol: false, lineStyle: { width: 4, color: '#007AFF' }, areaStyle: { color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#007AFF' }, { offset: 1, color: 'rgba(0, 122, 255, 0)' }]), opacity: 0.2 }, data: [120, 132, 101, 134, 90, 230, 210] }]
    });
  }

  private initDoughnutChart() {
    const el = this.doughnutChartRef()?.nativeElement; if (!el) return;
    this.doughnutChartInstance = echarts.init(el);
    this.doughnutChartInstance.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      legend: { bottom: '0', icon: 'circle', itemWidth: 10, itemHeight: 10, textStyle: { color: '#86868b' } },
      series: [{
        name: 'Access From', type: 'pie', radius: ['55%', '80%'], center: ['50%', '45%'], avoidLabelOverlap: false,
        itemStyle: { borderRadius: 10, borderColor: '#ffffff', borderWidth: 3 },
        label: { show: false, position: 'center' }, emphasis: { label: { show: true, fontSize: '24', fontWeight: 'bold', color: '#1d1d1f' } }, labelLine: { show: false },
        data: [{ value: 1048, name: 'iPhone', itemStyle: { color: '#007AFF' } }, { value: 735, name: 'Mac', itemStyle: { color: '#AF52DE' } }, { value: 580, name: 'iPad', itemStyle: { color: '#5AC8FA' } }, { value: 484, name: 'Other', itemStyle: { color: '#9CA3AF' } }]
      }]
    });
  }

  private initBarChart() {
    const el = this.barChartRef()?.nativeElement; if (!el) return;
    this.barChartInstance = echarts.init(el);
    this.barChartInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { left: '0', right: '0', bottom: '0', top: '10px', containLabel: true },
      xAxis: { type: 'category', data: ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b', margin: 16 } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#d2d2d7', type: 'dashed' } }, axisLabel: { color: '#86868b' } },
      series: [{ name: 'Active Users', type: 'bar', barWidth: '40%', itemStyle: { borderRadius: [6, 6, 6, 6], color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [{ offset: 0, color: '#007AFF' }, { offset: 1, color: '#AF52DE' }]) }, data: [320, 332, 301, 334, 390] }]
    });
  }

  private initRadarChart() {
    const el = this.radarChartRef()?.nativeElement; if (!el) return;
    this.radarChartInstance = echarts.init(el);
    this.radarChartInstance.setOption({
      tooltip: { backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      radar: { indicator: [{ name: 'Design', max: 100 }, { name: 'Dev', max: 100 }, { name: 'Marketing', max: 100 }, { name: 'Sales', max: 100 }, { name: 'Support', max: 100 }, { name: 'Admin', max: 100 }], axisName: { color: '#86868b' }, splitArea: { areaStyle: { color: ['rgba(0,0,0,0.02)', 'rgba(0,0,0,0.05)'] } }, axisLine: { lineStyle: { color: '#d2d2d7' } }, splitLine: { lineStyle: { color: '#d2d2d7' } } },
      series: [{ name: 'Skill Analysis', type: 'radar', data: [{ value: [85, 90, 75, 60, 80, 70], name: 'Team A', itemStyle: { color: '#007AFF' }, areaStyle: { color: '#007AFF', opacity: 0.3 } }, { value: [65, 70, 85, 90, 75, 60], name: 'Team B', itemStyle: { color: '#AF52DE' }, areaStyle: { color: '#AF52DE', opacity: 0.3 } }] }]
    });
  }

  private initGaugeChart() {
    const el = this.gaugeChartRef()?.nativeElement; if (!el) return;
    this.gaugeChartInstance = echarts.init(el);
    this.gaugeChartInstance.setOption({
      tooltip: { formatter: '{a} <br/>{b} : {c}%', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)' },
      series: [{
        name: 'System Load', type: 'gauge', progress: { show: true, width: 12, itemStyle: { color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#5AC8FA' }, { offset: 1, color: '#007AFF' }]) } },
        axisLine: { lineStyle: { width: 12, color: [[1, '#e5e5ea']] } }, axisTick: { show: false }, splitLine: { length: 12, lineStyle: { width: 2, color: '#d2d2d7' } }, axisLabel: { distance: 25, color: '#86868b', fontSize: 10 },
        pointer: { itemStyle: { color: '#007AFF' } }, detail: { valueAnimation: true, formatter: '{value}%', color: '#1d1d1f', fontSize: 24, fontWeight: 'bold', offsetCenter: [0, '70%'] }, data: [{ value: 78, name: 'CPU' }]
      }]
    });
  }

  private initStackedAreaChart() {
    const el = this.stackedAreaChartRef()?.nativeElement; if (!el) return;
    this.stackedAreaChartInstance = echarts.init(el);
    this.stackedAreaChartInstance.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', boundaryGap: false, data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#d2d2d7', type: 'dashed' } }, axisLabel: { color: '#86868b' } },
      series: [
        { name: 'Email', type: 'line', stack: 'Total', areaStyle: { opacity: 0.3 }, smooth: true, showSymbol: false, itemStyle: { color: '#007AFF' }, data: [120, 132, 101, 134, 90, 230, 210] },
        { name: 'Ads', type: 'line', stack: 'Total', areaStyle: { opacity: 0.3 }, smooth: true, showSymbol: false, itemStyle: { color: '#AF52DE' }, data: [220, 182, 191, 234, 290, 330, 310] },
        { name: 'Video', type: 'line', stack: 'Total', areaStyle: { opacity: 0.3 }, smooth: true, showSymbol: false, itemStyle: { color: '#5AC8FA' }, data: [150, 232, 201, 154, 190, 330, 410] }
      ]
    });
  }

  private initStepLineChart() {
    const el = this.stepLineChartRef()?.nativeElement; if (!el) return;
    this.stepLineChartInstance = echarts.init(el);
    this.stepLineChartInstance.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#d2d2d7', type: 'dashed' } }, axisLabel: { color: '#86868b' } },
      series: [{ name: 'Step', type: 'line', step: 'middle', itemStyle: { color: '#FF9500' }, lineStyle: { width: 3 }, data: [120, 132, 101, 134, 90, 230, 210] }]
    });
  }

  private initStackedBarChart() {
    const el = this.stackedBarChartRef()?.nativeElement; if (!el) return;
    this.stackedBarChartInstance = echarts.init(el);
    this.stackedBarChartInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', data: ['Q1', 'Q2', 'Q3', 'Q4'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#d2d2d7', type: 'dashed' } }, axisLabel: { color: '#86868b' } },
      series: [
        { name: 'Product A', type: 'bar', stack: 'total', itemStyle: { color: '#007AFF', borderRadius: [0, 0, 4, 4] }, data: [320, 302, 301, 334] },
        { name: 'Product B', type: 'bar', stack: 'total', itemStyle: { color: '#5AC8FA' }, data: [120, 132, 101, 134] },
        { name: 'Product C', type: 'bar', stack: 'total', itemStyle: { color: '#AF52DE', borderRadius: [4, 4, 0, 0] }, data: [220, 182, 191, 234] }
      ]
    });
  }

  private initWaterfallChart() {
    const el = this.waterfallChartRef()?.nativeElement; if (!el) return;
    this.waterfallChartInstance = echarts.init(el);
    this.waterfallChartInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12, formatter: (params: any) => params[1].name + '<br/>' + params[1].seriesName + ' : ' + params[1].value },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { type: 'category', splitLine: { show: false }, data: ['Total', 'Rent', 'Utilities', 'Payroll', 'Marketing', 'Profit'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#d2d2d7', type: 'dashed' } }, axisLabel: { color: '#86868b' } },
      series: [
        { name: 'Placeholder', type: 'bar', stack: 'Total', itemStyle: { borderColor: 'transparent', color: 'transparent' }, emphasis: { itemStyle: { borderColor: 'transparent', color: 'transparent' } }, data: [0, 1700, 1400, 1200, 300, 0] },
        { name: 'Life Cost', type: 'bar', stack: 'Total', label: { show: true, position: 'inside' }, itemStyle: { color: '#FF3B30', borderRadius: 4 }, data: [2900, 1200, 300, 200, 900, 300] }
      ]
    });
    this.waterfallChartInstance.setOption({ series: [{ data: [0, 1700, 1400, 1200, 300, 0] }, { itemStyle: { color: (params: any) => params.dataIndex === 0 || params.dataIndex === 5 ? '#34C759' : '#FF3B30' } }] });
  }

  private initScatterChart() {
    const el = this.scatterChartRef()?.nativeElement; if (!el) return;
    this.scatterChartInstance = echarts.init(el);
    this.scatterChartInstance.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { splitLine: { lineStyle: { type: 'dashed', color: '#d2d2d7' } }, axisLabel: { color: '#86868b' } },
      yAxis: { splitLine: { lineStyle: { type: 'dashed', color: '#d2d2d7' } }, axisLabel: { color: '#86868b' } },
      series: [{ symbolSize: 12, data: [[10.0, 8.04], [8.0, 6.95], [13.0, 7.58], [9.0, 8.81], [11.0, 8.33], [14.0, 9.96], [6.0, 7.24], [4.0, 4.26], [12.0, 10.84], [7.0, 4.82], [5.0, 5.68]], type: 'scatter', itemStyle: { color: '#AF52DE' } }]
    });
  }

  private initBubbleChart() {
    const el = this.bubbleChartRef()?.nativeElement; if (!el) return;
    this.bubbleChartInstance = echarts.init(el);
    const data = [[[28604, 77, 17096869, 'Australia', 1990], [31163, 77.4, 27662440, 'Canada', 1990], [1516, 68, 1154605773, 'China', 1990]]];
    this.bubbleChartInstance.setOption({
      tooltip: { backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { splitLine: { lineStyle: { type: 'dashed', color: '#d2d2d7' } }, axisLabel: { color: '#86868b' } },
      yAxis: { splitLine: { lineStyle: { type: 'dashed', color: '#d2d2d7' } }, axisLabel: { color: '#86868b' } },
      series: [{ type: 'scatter', itemStyle: { color: 'rgba(90, 200, 250, 0.5)', borderColor: '#5AC8FA', borderWidth: 1 }, symbolSize: (data: any) => Math.sqrt(data[2]) / 200, data: data[0] }]
    });
  }

  private initRoseChart() {
    const el = this.roseChartRef()?.nativeElement; if (!el) return;
    this.roseChartInstance = echarts.init(el);
    this.roseChartInstance.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      series: [{
        name: 'Nightingale Chart', type: 'pie', radius: [20, 100], center: ['50%', '50%'], roseType: 'area', itemStyle: { borderRadius: 8 },
        data: [
          { value: 40, name: 'rose 1', itemStyle: { color: '#FF2D55' } },
          { value: 38, name: 'rose 2', itemStyle: { color: '#FF9500' } },
          { value: 32, name: 'rose 3', itemStyle: { color: '#FFCC00' } },
          { value: 30, name: 'rose 4', itemStyle: { color: '#34C759' } },
          { value: 28, name: 'rose 5', itemStyle: { color: '#5AC8FA' } },
          { value: 26, name: 'rose 6', itemStyle: { color: '#007AFF' } },
          { value: 22, name: 'rose 7', itemStyle: { color: '#5856D6' } },
          { value: 18, name: 'rose 8', itemStyle: { color: '#AF52DE' } }
        ]
      }]
    });
  }

  private initFunnelChart() {
    const el = this.funnelChartRef()?.nativeElement; if (!el) return;
    this.funnelChartInstance = echarts.init(el);
    this.funnelChartInstance.setOption({
      tooltip: { trigger: 'item', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12, formatter: '{a} <br/>{b} : {c}%' },
      series: [{
        name: 'Funnel', type: 'funnel', left: '10%', top: 30, bottom: 30, width: '80%', sort: 'descending', gap: 2, itemStyle: { borderColor: '#fff', borderWidth: 1 },
        label: { show: true, position: 'inside' },
        data: [
          { value: 60, name: 'Visit', itemStyle: { color: '#5AC8FA' } },
          { value: 40, name: 'Inquiry', itemStyle: { color: '#007AFF' } },
          { value: 20, name: 'Order', itemStyle: { color: '#AF52DE' } },
          { value: 80, name: 'Click', itemStyle: { color: '#34C759' } },
          { value: 100, name: 'Show', itemStyle: { color: '#FF9500' } }
        ]
      }]
    });
  }

  private initCandlestickChart() {
    const el = this.candlestickChartRef()?.nativeElement; if (!el) return;
    this.candlestickChartInstance = echarts.init(el);
    this.candlestickChartInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'cross' }, backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { left: '10%', right: '10%', bottom: '15%' },
      xAxis: { type: 'category', data: ['2017-10-24', '2017-10-25', '2017-10-26', '2017-10-27'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b' } },
      yAxis: { scale: true, splitLine: { lineStyle: { color: '#d2d2d7', type: 'dashed' } }, axisLabel: { color: '#86868b' } },
      series: [{
        type: 'candlestick',
        itemStyle: { color: '#FF3B30', color0: '#34C759', borderColor: '#FF3B30', borderColor0: '#34C759' },
        data: [
          [20, 34, 10, 38],
          [40, 35, 30, 50],
          [31, 38, 33, 44],
          [38, 15, 5, 42]
        ]
      }]
    });
  }

  private initBoxplotChart() {
    const el = this.boxplotChartRef()?.nativeElement; if (!el) return;
    this.boxplotChartInstance = echarts.init(el);
    this.boxplotChartInstance.setOption({
      tooltip: { trigger: 'item', axisPointer: { type: 'shadow' }, backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { left: '10%', right: '10%', bottom: '15%' },
      xAxis: { type: 'category', data: ['expr1', 'expr2'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b' } },
      yAxis: { type: 'value', splitLine: { lineStyle: { color: '#d2d2d7', type: 'dashed' } }, axisLabel: { color: '#86868b' } },
      series: [{
        name: 'boxplot', type: 'boxplot', itemStyle: { color: '#007AFF', borderColor: '#007AFF', borderWidth: 2 },
        data: [
          [850, 740, 900, 1070, 930, 850, 950, 980, 980, 880, 1000, 980, 930, 650, 760, 810, 1000, 1000, 960, 960],
          [960, 940, 960, 940, 880, 800, 850, 880, 900, 840, 830, 790, 810, 880, 880, 830, 800, 790, 760, 800]
        ]
      }]
    });
  }

  private initHeatmapChart() {
    const el = this.heatmapChartRef()?.nativeElement; if (!el) return;
    this.heatmapChartInstance = echarts.init(el);
    const data = [[0,0,5],[0,1,1],[0,2,0],[1,0,3],[1,1,2],[1,2,6]];
    this.heatmapChartInstance.setOption({
      tooltip: { position: 'top', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { height: '50%', top: '10%' },
      xAxis: { type: 'category', data: ['12a', '1a'], splitArea: { show: true, areaStyle: { color: 'transparent' } }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b' } },
      yAxis: { type: 'category', data: ['Sat', 'Sun', 'Mon'], splitArea: { show: true, areaStyle: { color: 'transparent' } }, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b' } },
      visualMap: { min: 0, max: 10, calculable: true, orient: 'horizontal', left: 'center', bottom: '15%', textStyle: { color: '#86868b' }, inRange: { color: ['#f5f5f7', '#007AFF'] } },
      series: [{ name: 'Punch Card', type: 'heatmap', data: data, label: { show: true }, emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' } }, itemStyle: { borderColor: '#ffffff', borderWidth: 2, borderRadius: 4 } }]
    });
  }

  private initCalendarChart() {
    const el = this.calendarChartRef()?.nativeElement; if (!el) return;
    this.calendarChartInstance = echarts.init(el);
    this.calendarChartInstance.setOption({
      tooltip: { backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      visualMap: { show: false, min: 0, max: 1000, inRange: { color: ['#f5f5f7', '#34C759'] } },
      calendar: { top: 40, left: 30, right: 30, cellSize: ['auto', 16], range: '2023', itemStyle: { borderWidth: 2, borderColor: '#ffffff', color: '#f5f5f7', borderRadius: 2 }, splitLine: { show: false }, dayLabel: { color: '#86868b' }, monthLabel: { color: '#86868b' }, yearLabel: { show: false } },
      series: { type: 'heatmap', coordinateSystem: 'calendar', data: [['2023-01-02', 200], ['2023-02-04', 500], ['2023-05-12', 800]] }
    });
  }

  private initThemeRiverChart() {
    const el = this.themeRiverChartRef()?.nativeElement; if (!el) return;
    this.themeRiverChartInstance = echarts.init(el);
    this.themeRiverChartInstance.setOption({
      tooltip: { trigger: 'axis', axisPointer: { type: 'line', lineStyle: { color: 'rgba(0,0,0,0.2)', width: 1, type: 'solid' } }, backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      singleAxis: { top: 50, bottom: 50, axisTick: { show: false }, axisLabel: { color: '#86868b' }, type: 'time', axisPointer: { animation: true, label: { show: true } }, splitLine: { show: true, lineStyle: { type: 'dashed', opacity: 0.2 } } },
      series: [
        { type: 'themeRiver', emphasis: { itemStyle: { shadowBlur: 20, shadowColor: 'rgba(0, 0, 0, 0.8)' } }, color: ['#007AFF', '#5AC8FA', '#AF52DE'], data: [['2015/11/08', 10, 'DQ'], ['2015/11/09', 15, 'DQ'], ['2015/11/08', 20, 'TY'], ['2015/11/09', 25, 'TY']] }
      ]
    });
  }

  private initSunburstChart() {
    const el = this.sunburstChartRef()?.nativeElement; if (!el) return;
    this.sunburstChartInstance = echarts.init(el);
    const data = [{ name: 'Grandpa', children: [{ name: 'Uncle Leo', value: 15 }, { name: 'Aunt Jane', value: 20 }] }, { name: 'Grandma', children: [{ name: 'Uncle Jack', value: 10 }, { name: 'Aunt Alice', value: 12 }] }];
    this.sunburstChartInstance.setOption({
      tooltip: { backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      series: { type: 'sunburst', data: data, radius: [0, '90%'], itemStyle: { borderRadius: 4, borderColor: '#ffffff', borderWidth: 2 }, label: { rotate: 'radial', color: '#fff' }, color: ['#007AFF', '#5AC8FA', '#AF52DE', '#FF2D55'] }
    });
  }

  private initTreemapChart() {
    const el = this.treemapChartRef()?.nativeElement; if (!el) return;
    this.treemapChartInstance = echarts.init(el);
    this.treemapChartInstance.setOption({
      tooltip: { backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      series: [{ type: 'treemap', data: [{ name: 'nodeA', value: 10 }, { name: 'nodeB', value: 20 }], itemStyle: { borderColor: '#ffffff', borderWidth: 2, borderRadius: 6 }, color: ['#007AFF', '#AF52DE'] }]
    });
  }

  private initGraphChart() {
    const el = this.graphChartRef()?.nativeElement; if (!el) return;
    this.graphChartInstance = echarts.init(el);
    this.graphChartInstance.setOption({
      tooltip: { backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      series: [{ 
        type: 'graph', 
        layout: 'force', 
        force: { repulsion: 400, edgeLength: 80 }, 
        roam: true,
        symbolSize: 20,
        label: { show: true, position: 'right', color: '#1d1d1f' }, 
        data: [
          { name: 'Node 1', itemStyle: { color: '#007AFF', borderColor: '#5AC8FA', borderWidth: 2 } }, 
          { name: 'Node 2', itemStyle: { color: '#AF52DE', borderColor: '#E5C8FA', borderWidth: 2 } },
          { name: 'Node 3', itemStyle: { color: '#34C759', borderColor: '#A5E8A9', borderWidth: 2 } },
          { name: 'Node 4', itemStyle: { color: '#FF9500', borderColor: '#FFD599', borderWidth: 2 } },
        ], 
        links: [
          { source: 'Node 1', target: 'Node 2' },
          { source: 'Node 1', target: 'Node 3' },
          { source: 'Node 2', target: 'Node 4' },
          { source: 'Node 3', target: 'Node 4' }
        ], 
        lineStyle: { color: '#d2d2d7', width: 2, curveness: 0.1 } 
      }]
    });
  }

  private initSankeyChart() {
    const el = this.sankeyChartRef()?.nativeElement; if (!el) return;
    this.sankeyChartInstance = echarts.init(el);
    this.sankeyChartInstance.setOption({
      tooltip: { trigger: 'item', triggerOn: 'mousemove', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      series: { type: 'sankey', layout: 'none', emphasis: { focus: 'adjacency' }, data: [{ name: 'a' }, { name: 'b' }, { name: 'c' }], links: [{ source: 'a', target: 'b', value: 5 }, { source: 'b', target: 'c', value: 3 }], itemStyle: { color: '#007AFF', borderRadius: 4 }, lineStyle: { color: 'source', opacity: 0.2 } }
    });
  }

  private initParallelChart() {
    const el = this.parallelChartRef()?.nativeElement; if (!el) return;
    this.parallelChartInstance = echarts.init(el);
    this.parallelChartInstance.setOption({
      parallelAxis: [{ dim: 0, name: 'Price' }, { dim: 1, name: 'Net Weight' }, { dim: 2, name: 'Amount' }],
      parallel: { left: '5%', right: '13%', bottom: '10%', top: '20%', parallelAxisDefault: { axisLine: { lineStyle: { color: '#d2d2d7' } }, axisLabel: { color: '#86868b' }, nameTextStyle: { color: '#1d1d1f' } } },
      series: { type: 'parallel', lineStyle: { width: 2, color: '#007AFF' }, data: [[12.99, 100, 82], [9.99, 80, 77]] }
    });
  }

  private initPictorialChart() {
    const el = this.pictorialChartRef()?.nativeElement; if (!el) return;
    this.pictorialChartInstance = echarts.init(el);
    this.pictorialChartInstance.setOption({
      tooltip: { backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { data: ['a', 'b', 'c'], axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b' } },
      yAxis: { splitLine: { lineStyle: { type: 'dashed', color: '#d2d2d7' } }, axisLabel: { color: '#86868b' } },
      series: [{ name: 'paper', type: 'pictorialBar', symbolClip: true, symbolBoundingData: 100, itemStyle: { color: '#34C759' }, data: [10, 50, 80] }]
    });
  }

  private initPolarBarChart() {
    const el = this.polarBarChartRef()?.nativeElement; if (!el) return;
    this.polarBarChartInstance = echarts.init(el);
    this.polarBarChartInstance.setOption({
      tooltip: { backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      angleAxis: { type: 'category', data: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'], axisLabel: { color: '#86868b' }, axisLine: { lineStyle: { color: '#d2d2d7' } } },
      radiusAxis: { axisLabel: { color: '#86868b' }, axisLine: { show: false }, splitLine: { lineStyle: { color: '#d2d2d7' } } },
      polar: {},
      series: [{ type: 'bar', data: [1, 2, 3, 4, 3], coordinateSystem: 'polar', name: 'A', stack: 'a', itemStyle: { color: '#007AFF' } }, { type: 'bar', data: [2, 4, 6, 1, 3], coordinateSystem: 'polar', name: 'B', stack: 'a', itemStyle: { color: '#5AC8FA' } }]
    });
  }

  private initMultiAxisChart() {
    const el = this.multiAxisChartRef()?.nativeElement; if (!el) return;
    this.multiAxisChartInstance = echarts.init(el);
    this.multiAxisChartInstance.setOption({
      tooltip: { trigger: 'axis', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { left: '10%', right: '10%', bottom: '10%' },
      xAxis: [{ type: 'category', data: ['Jan', 'Feb', 'Mar'], axisLabel: { color: '#86868b' }, axisLine: { show: false }, axisTick: { show: false } }],
      yAxis: [{ type: 'value', name: 'Evaporation', axisLine: { lineStyle: { color: '#007AFF' } }, axisLabel: { color: '#86868b' }, splitLine: { show: false } }, { type: 'value', name: 'Temperature', axisLine: { lineStyle: { color: '#AF52DE' } }, axisLabel: { color: '#86868b' }, splitLine: { lineStyle: { type: 'dashed', color: '#d2d2d7' } } }],
      series: [{ name: 'Evaporation', type: 'bar', itemStyle: { color: '#007AFF', borderRadius: 4 }, data: [2.0, 4.9, 7.0] }, { name: 'Temperature', type: 'line', yAxisIndex: 1, itemStyle: { color: '#AF52DE' }, data: [2.0, 2.2, 3.3] }]
    });
  }

  private initTreeChart() {
    const el = this.treeChartRef()?.nativeElement; if (!el) return;
    this.treeChartInstance = echarts.init(el);
    const data = { name: 'CEO', children: [ { name: 'Tech', children: [{ name: 'Frontend' }, { name: 'Backend' }] }, { name: 'Sales', children: [{ name: 'US' }, { name: 'EU' }] } ] };
    this.treeChartInstance.setOption({
      tooltip: { trigger: 'item', triggerOn: 'mousemove', backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      series: [{ type: 'tree', data: [data], top: '10%', left: '10%', bottom: '10%', right: '20%', symbolSize: 14, itemStyle: { color: '#007AFF', borderColor: '#5AC8FA', borderWidth: 2 }, label: { position: 'left', verticalAlign: 'middle', align: 'right', fontSize: 14, color: '#1d1d1f' }, leaves: { label: { position: 'right', verticalAlign: 'middle', align: 'left' } }, expandAndCollapse: true, animationDuration: 550, animationDurationUpdate: 750, lineStyle: { color: '#d2d2d7', width: 2 } }]
    });
  }

  private initEffectScatterChart() {
    const el = this.effectScatterChartRef()?.nativeElement; if (!el) return;
    this.effectScatterChartInstance = echarts.init(el);
    this.effectScatterChartInstance.setOption({
      tooltip: { backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      xAxis: { splitLine: { lineStyle: { type: 'dashed', color: '#d2d2d7' } }, axisLabel: { color: '#86868b' } },
      yAxis: { splitLine: { lineStyle: { type: 'dashed', color: '#d2d2d7' } }, axisLabel: { color: '#86868b' } },
      series: [{ type: 'effectScatter', symbolSize: 20, data: [[10.0, 8.04], [8.0, 6.95], [13.0, 7.58], [9.0, 8.81]], itemStyle: { color: '#FF2D55' }, rippleEffect: { brushType: 'stroke', scale: 3 } }]
    });
  }

  private initLinesChart() {
    const el = this.linesChartRef()?.nativeElement; if (!el) return;
    this.linesChartInstance = echarts.init(el);
    this.linesChartInstance.setOption({
      tooltip: { backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      xAxis: { show: false, min: 0, max: 100 },
      yAxis: { show: false, min: 0, max: 100 },
      series: [{ type: 'lines', coordinateSystem: 'cartesian2d', effect: { show: true, period: 4, trailLength: 0.1, symbol: 'arrow', symbolSize: 8 }, lineStyle: { color: '#34C759', width: 2, opacity: 0.4, curveness: 0.2 }, data: [{ coords: [[10, 10], [90, 90]] }, { coords: [[10, 90], [90, 10]] }, { coords: [[10, 50], [90, 50]] }] }]
    });
  }

  private initCustomChart() {
    const el = this.customChartRef()?.nativeElement; if (!el) return;
    this.customChartInstance = echarts.init(el);
    const data = [[10, 16, 3], [16, 18, 15], [18, 26, 12], [26, 32, 22], [32, 56, 7], [56, 62, 17]];
    const colorList = ['#007AFF', '#5AC8FA', '#AF52DE', '#FF2D55', '#FF9500', '#34C759'];
    this.customChartInstance.setOption({
      tooltip: { backgroundColor: '#ffffff', textStyle: { color: '#1d1d1f' }, borderWidth: 0, borderRadius: 12, shadowBlur: 20, shadowColor: 'rgba(0,0,0,0.1)', padding: 12 },
      grid: { left: '3%', right: '4%', bottom: '3%', containLabel: true },
      xAxis: { scale: true, axisLine: { show: false }, axisTick: { show: false }, axisLabel: { color: '#86868b' } },
      yAxis: { splitLine: { lineStyle: { type: 'dashed', color: '#d2d2d7' } }, axisLabel: { color: '#86868b' } },
      series: [{
        type: 'custom',
        renderItem: function (params: any, api: any) {
          var yValue = api.value(2);
          var start = api.coord([api.value(0), yValue]);
          var size = api.size([api.value(1) - api.value(0), yValue]);
          return { 
            type: 'rect', 
            shape: { x: start[0], y: start[1], width: size[0], height: size[1] }, 
            style: { fill: colorList[params.dataIndex % colorList.length] } 
          };
        },
        data: data
      }]
    });
  }

}
