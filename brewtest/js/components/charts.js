/* Chart.js wrappers with BrewTest styling. Chart.js is loaded as a global from assets/vendor. */
import { state } from '../state.js';

const registry = new Set();

const css = (name) => getComputedStyle(document.documentElement).getPropertyValue(name).trim();

export function chartTheme() {
  const dark = document.documentElement.dataset.theme === 'dark';
  return {
    dark,
    text: css('--text-muted') || '#9A887B',
    textStrong: css('--text-primary') || '#35251F',
    grid: dark ? 'rgba(255,252,247,0.07)' : 'rgba(53,37,31,0.07)',
    surface: css('--bg-surface') || '#FFFCF7',
    success: '#54846B', error: '#B85C50', warning: '#C4934F',
    brand: dark ? ['#B98556', '#D8BFA6', '#9B6E52', '#7C5B49'] : ['#B98556', '#765443', '#D8BFA6', '#4B342A'],
  };
}

const reducedMotion = () => state.settings.appearance.reducedMotion || window.matchMedia('(prefers-reduced-motion: reduce)').matches;

function baseOptions(t, extra = {}) {
  return {
    responsive: true,
    maintainAspectRatio: false,
    animation: reducedMotion() ? false : { duration: 700, easing: 'easeOutQuart' },
    interaction: { mode: 'index', intersect: false },
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: '#35251F', titleColor: '#FFFCF7', bodyColor: '#E9DED1', padding: 12, cornerRadius: 10, boxPadding: 5,
        titleFont: { family: 'Inter', weight: '600' }, bodyFont: { family: 'Inter' },
      },
    },
    ...extra,
  };
}

function axes(t, { yMax, yPercent = false, stacked = false } = {}) {
  return {
    x: { stacked, grid: { display: false }, border: { display: false }, ticks: { color: t.text, font: { family: 'Inter', size: 12 } } },
    y: {
      stacked, beginAtZero: true, max: yMax, grid: { color: t.grid }, border: { display: false },
      ticks: { color: t.text, font: { family: 'JetBrains Mono', size: 11 }, padding: 8, callback: (v) => (yPercent ? `${v}%` : v) },
    },
  };
}

export function createChart(canvasId, build) {
  const canvas = typeof canvasId === 'string' ? document.getElementById(canvasId) : canvasId;
  if (!canvas || !window.Chart) return null;
  const t = chartTheme();
  const chart = new window.Chart(canvas, build(t, { baseOptions: (x) => baseOptions(t, x), axes: (x) => axes(t, x) }));
  registry.add(chart);
  return chart;
}

export function lineChart(canvasId, { labels, datasets }) {
  return createChart(canvasId, (t, h) => ({
    type: 'line',
    data: {
      labels,
      datasets: datasets.map((d) => ({
        label: d.label, data: d.data, borderColor: t[d.color], backgroundColor: `${t[d.color]}22`, borderWidth: 2.25,
        tension: 0.35, pointRadius: 3, pointHoverRadius: 6, pointBackgroundColor: t.surface, pointBorderColor: t[d.color], pointBorderWidth: 2,
        fill: d.fill ?? false,
      })),
    },
    options: h.baseOptions({ scales: h.axes({}) }),
  }));
}

export function barChart(canvasId, { labels, datasets, horizontal = false, stacked = false, yPercent = false, yMax }) {
  return createChart(canvasId, (t, h) => {
    const scales = h.axes({ stacked, yPercent, yMax });
    return {
      type: 'bar',
      data: {
        labels,
        datasets: datasets.map((d) => ({
          label: d.label, data: d.data, backgroundColor: d.color ? (t[d.color] ?? d.color) : t.brand[0],
          borderRadius: 6, borderSkipped: false, maxBarThickness: 34,
        })),
      },
      options: h.baseOptions({
        indexAxis: horizontal ? 'y' : 'x',
        scales: horizontal ? { x: { ...scales.y }, y: { ...scales.x, ticks: { ...scales.x.ticks, autoSkip: false } } } : scales,
      }),
    };
  });
}

export function doughnutChart(canvasId, { labels, data, colors }) {
  return createChart(canvasId, (t, h) => ({
    type: 'doughnut',
    data: { labels, datasets: [{ data, backgroundColor: colors ?? t.brand, borderColor: t.surface, borderWidth: 3, hoverOffset: 6 }] },
    options: h.baseOptions({ cutout: '68%', interaction: { mode: 'nearest', intersect: true } }),
  }));
}

export function destroyAllCharts() {
  registry.forEach((c) => { try { c.destroy(); } catch { /* already gone */ } });
  registry.clear();
}
