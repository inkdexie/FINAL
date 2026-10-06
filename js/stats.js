let barChart = null;
let lineChart = null;

const setStatus = (text, type) => {
  $('#status').text(text).attr('class', 'alert alert-' + type);
};

const renderBar = (bar) => {
  if (barChart !== null) {
    barChart.destroy();
  }
  $('#bar-title').text(bar.title + '（单位：' + bar.unit + '）');
  $('#bar-source').text('数据来源：' + bar.source + ' · 单位：' + bar.unit);
  barChart = new Chart(document.querySelector('#bar-chart'), {
    type: 'bar',
    data: {
      labels: bar.rooms.map(r => r.name),
      datasets: [{
        label: '使用量（' + bar.unit + '）',
        data: bar.rooms.map(r => r.visits),
        backgroundColor: 'rgba(47, 107, 143, .7)',
        borderColor: 'rgba(31, 58, 95, 1)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      maintainAspectRatio: false,
      plugins: {
        title: { display: true, text: bar.title },
        legend: { display: false }
      },
      scales: {
        y: { beginAtZero: true, title: { display: true, text: '使用量（' + bar.unit + '）' } }
      }
    }
  });
};

const renderLine = (line) => {
  $('#line-title').text(line.title + '（单位：' + line.unit + '）');
  $('#line-source').text('数据来源：' + line.source + ' · 单位：' + line.unit);
  if (lineChart === null) {
    lineChart = echarts.init(document.querySelector('#line-chart'));
  }
  lineChart.setOption({
    title: { text: line.title, left: 'center' },
    tooltip: { trigger: 'axis' },
    grid: { left: '8%', right: '5%', bottom: '12%', top: '18%' },
    xAxis: {
      type: 'category',
      data: line.days,
      name: '星期'
    },
    yAxis: {
      type: 'value',
      name: '人次',
      minInterval: 1
    },
    series: [{
      name: '入馆人次',
      type: 'line',
      data: line.visits,
      smooth: true,
      symbol: 'circle',
      symbolSize: 8,
      lineStyle: { width: 3, color: '#2f6b8f' },
      itemStyle: { color: '#1f3a5f' },
      areaStyle: { color: 'rgba(47, 107, 143, .2)' }
    }]
  });
};

const applyData = (data) => {
  if (!data || !data.bar || !data.line) {
    setStatus('数据格式错误：缺少 bar 或 line 字段', 'danger');
    return;
  }
  if (!Array.isArray(data.bar.rooms) || data.bar.rooms.length === 0) {
    setStatus('暂无数据', 'warning');
    return;
  }
  $('#charts').removeClass('d-none');
  $('#status').addClass('d-none');
  renderBar(data.bar);
  renderLine(data.line);
  setTimeout(() => { if (lineChart) lineChart.resize(); }, 50);
};

const loadScriptFallback = () => {
  if (window.__STATS_DATA__) {
    applyData(window.__STATS_DATA__);
    return;
  }
  const script = document.createElement('script');
  script.src = 'data/stats-data.js';
  script.onload = () => {
    if (window.__STATS_DATA__) {
      applyData(window.__STATS_DATA__);
    } else {
      setStatus('加载失败：回退数据未找到', 'danger');
    }
  };
  script.onerror = () => setStatus('加载失败：无法获取数据文件', 'danger');
  document.head.appendChild(script);
};

const loadData = async () => {
  setStatus('加载中...', 'warning');
  try {
    const response = await fetch('data/stats.json?t=' + Date.now());
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    const data = await response.json();
    applyData(data);
  } catch (error) {
    if (error instanceof SyntaxError) {
      setStatus('数据格式错误：JSON 无法解析', 'danger');
      return;
    }
    loadScriptFallback();
  }
};

window.addEventListener('resize', () => {
  if (lineChart) lineChart.resize();
});

$(function () {
  loadData();
});
