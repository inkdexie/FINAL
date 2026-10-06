let rooms = [];
const STORAGE_KEY = 'campus_rooms';
const state = { floor: '全部', open: '全部', type: '全部', keyword: '' };

const setStatus = (text, type) => {
  $('#status').text(text).attr('class', 'alert alert-' + type);
};

const save = () => {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(rooms));
};

const render = () => {
  const list = $('#room-list').empty();
  const shown = rooms.filter(room => {
    const floorOk = state.floor === '全部' || room.floor === state.floor;
    const openOk = state.open === '全部'
      || (state.open === 'open' && room.open)
      || (state.open === 'closed' && !room.open);
    const typeOk = state.type === '全部' || room.type === state.type;
    const kwOk = !state.keyword || room.name.toLowerCase().indexOf(state.keyword.toLowerCase()) !== -1;
    return floorOk && openOk && typeOk && kwOk;
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
    const right = $('<span class="d-flex align-items-center gap-3"></span>');
    right.append('<span class="badge ' + (room.open ? 'text-bg-success' : 'text-bg-secondary') + '">' + (room.open ? '开放中' : '已关闭') + '</span>');
    right.append('<span class="text-muted small">座位 ' + room.used + '/' + room.seats + '（空 ' + free + '）</span>');
    right.append('<div class="seat-bar"><span style="width:' + rate + '%"></span></div>');
    right.append('<button class="btn btn-sm btn-outline-danger del-btn" data-id="' + room.id + '">删除</button>');
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

const showFormMsg = (text) => {
  $('#form-msg').text(text);
};

const addRoom = () => {
  const name = $('#new-name').val().trim();
  const floor = $('#new-floor').val();
  const type = $('#new-type').val();
  const seats = parseInt($('#new-seats').val(), 10);
  const used = parseInt($('#new-used').val(), 10);
  const open = $('#new-open').is(':checked');

  if (!name) {
    showFormMsg('请输入自习室名称');
    return;
  }
  if (!Number.isInteger(seats) || seats < 1) {
    showFormMsg('总座位数必须是大于 0 的整数');
    return;
  }
  if (!Number.isInteger(used) || used < 0 || used > seats) {
    showFormMsg('已用座位数必须是 0 到 ' + seats + ' 之间的整数');
    return;
  }

  const newRoom = {
    id: Date.now(),
    name: name,
    floor: floor,
    type: type,
    seats: seats,
    used: open ? used : 0,
    open: open
  };
  rooms.push(newRoom);
  save();
  render();

  $('#new-name').val('');
  $('#new-seats').val('');
  $('#new-used').val('');
  showFormMsg('');
};

const loadData = async () => {
  setStatus('加载中...', 'warning');
  try {
    const cached = localStorage.getItem(STORAGE_KEY);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed)) {
        rooms = parsed;
        if (rooms.length === 0) {
          setStatus('暂无数据，请添加自习室', 'warning');
          $('#filter-panel').removeClass('d-none');
          return;
        }
        $('#filter-panel').removeClass('d-none');
        $('#status').addClass('d-none');
        render();
        return;
      }
    }

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
      setStatus('暂无数据，请添加自习室', 'warning');
      $('#filter-panel').removeClass('d-none');
      return;
    }
    rooms = data.rooms;
    save();
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

  $('#search-input').on('input', function () {
    state.keyword = $(this).val();
    render();
  });

  $('#add-btn').on('click', addRoom);

  $('#room-list').on('click', '.del-btn', function (e) {
    e.stopPropagation();
    const id = parseInt($(this).data('id'), 10);
    rooms = rooms.filter(r => r.id !== id);
    save();
    if (rooms.length === 0) {
      $('#room-list').empty().append('<li class="list-group-item text-muted">暂无数据，请添加自习室</li>');
      return;
    }
    render();
  });

  loadData();
});
