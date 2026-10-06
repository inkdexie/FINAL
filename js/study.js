let rooms = [];
const state = { floor: '全部', open: '全部', type: '全部' };

const setStatus = (text, type) => {
  $('#status').text(text).attr('class', 'alert alert-' + type);
};

const render = () => {
  const list = $('#room-list').empty();
  const shown = rooms.filter(room => {
    const floorOk = state.floor === '全部' || room.floor === state.floor;
    const openOk = state.open === '全部'
      || (state.open === 'open' && room.open)
      || (state.open === 'closed' && !room.open);
    const typeOk = state.type === '全部' || room.type === state.type;
    return floorOk && openOk && typeOk;
  });

  if (shown.length === 0) {
    list.append('<li class="list-group-item text-muted">没有符合条件的自习室</li>');
    return;
  }

  shown.forEach(room => {
    const rate = room.open ? Math.round(room.used / room.seats * 100) : 0;
    const free = room.open ? room.seats - room.used : 0;
    const li = $('<li class="list-group-item room-item d-flex justify-content-between align-items-center"></li>');
    const info = $('<span></span>');
    info.append('<strong>' + room.name + '</strong>');
    info.append('<span class="text-muted small ms-2">' + room.floor + ' · ' + room.type + '</span>');
    const right = $('<span class="d-flex align-items-center"></span>');
    right.append('<span class="badge me-3 ' + (room.open ? 'text-bg-success' : 'text-bg-secondary') + '">' + (room.open ? '开放中' : '已关闭') + '</span>');
    right.append('<span class="text-muted small me-3">座位 ' + room.used + '/' + room.seats + '（空 ' + free + '）</span>');
    right.append('<div class="seat-bar"><span style="width:' + rate + '%"></span></div>');
    li.append(info).append(right);
    list.append(li);
  });
};

const markActive = (boxId, attr, value) => {
  $('#' + boxId + ' button').each(function () {
    const active = $(this).data(attr) === value;
    $(this).toggleClass('btn-primary', active).toggleClass('btn-outline-primary', !active);
  });
};

const loadData = async () => {
  setStatus('加载中...', 'warning');
  try {
    const response = await fetch('data/rooms.json?t=' + Date.now());
    if (!response.ok) {
      throw new Error('HTTP ' + response.status);
    }
    const data = await response.json();
    if (!Array.isArray(data.rooms)) {
      setStatus('数据格式错误：rooms 字段不是数组', 'danger');
      return;
    }
    if (data.rooms.length === 0) {
      setStatus('暂无数据', 'warning');
      return;
    }
    rooms = data.rooms;
    $('#filter-panel').removeClass('d-none');
    $('#status').addClass('d-none');
    render();
  } catch (error) {
    const msg = error instanceof SyntaxError ? '数据格式错误：JSON 无法解析' : error.message;
    setStatus('加载失败：' + msg, 'danger');
  }
};

$(function () {
  $('#floor-filters').on('click', 'button', function () {
    state.floor = $(this).data('floor');
    markActive('floor-filters', 'floor', state.floor);
    render();
  });

  $('#open-filters').on('click', 'button', function () {
    state.open = $(this).data('open');
    markActive('open-filters', 'open', state.open);
    render();
  });

  $('#type-filter').on('change', function () {
    state.type = $(this).val();
    render();
  });

  loadData();
});
