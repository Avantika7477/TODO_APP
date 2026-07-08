const input = document.querySelector(".input-area input[type='text']");
const timeInput = document.getElementById("time-hlder");
const dateInput = document.getElementById("date-hlder");
const priorityInput = document.getElementById("priority-hlder");
const button = document.getElementById('btn');
const taskList = document.getElementById("task-list");
const Greeting = document.getElementById("greeting");
const tracker = document.getElementById('tracker');
const clearHistoryBtn = document.getElementById('clear-history');
const heatmapDiv = document.getElementById('progress-heatmap');

let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');
let history = JSON.parse(localStorage.getItem('history') || '{}');

function buildHistory(){
  history = tasks.reduce((acc, task) => {
    const day = task.date;
    if(!acc[day]) acc[day] = { total: 0, completed: 0 };
    acc[day].total += 1;
    if(task.done) acc[day].completed += 1;
    return acc;
  }, {});
  localStorage.setItem('history', JSON.stringify(history));
}

function saveTasks(){
  localStorage.setItem('tasks', JSON.stringify(tasks));
  buildHistory();
  updateTracker();
}

function updateTracker(){
  const today = new Date().toISOString().slice(0,10);
  const todays = tasks.filter(t=>t.date===today);
  const completed = todays.filter(t=>t.done).length;
  tracker.textContent = `Today: ${completed}/${todays.length} completed`;
}

function getSortKey(task){
  const today = new Date().toISOString().slice(0,10);
  const isToday = task.date === today ? 0 : 1;
  const dateKey = task.date;
  const timeKey = task.time || '23:59';
  return { isToday, dateKey, timeKey };
}

function compareTasks(a, b){
  const keyA = getSortKey(a);
  const keyB = getSortKey(b);
  if(keyA.isToday !== keyB.isToday) return keyA.isToday - keyB.isToday;
  if(keyA.dateKey !== keyB.dateKey) return keyA.dateKey.localeCompare(keyB.dateKey);
  return keyA.timeKey.localeCompare(keyB.timeKey);
}

function renderTasks(){
  taskList.innerHTML = '';
  const sortedTasks = [...tasks].sort(compareTasks);
  sortedTasks.forEach((t, idx)=>{
    const li = document.createElement('li');
    li.className = 'task-item';

    const left = document.createElement('div');
    left.className = 'task-left';

    const chk = document.createElement('input');
    chk.type = 'checkbox';
    chk.checked = !!t.done;
    chk.addEventListener('change', ()=>{
      t.done = chk.checked;
      saveTasks();
      renderTasks();
    });

    const span = document.createElement('span');
    span.textContent = t.text;
    if(t.done) span.style.textDecoration = 'line-through';

    const priority = document.createElement('span');
    priority.className = `priority-label priority-${t.priority}`;
    priority.textContent = t.priority;

    left.appendChild(chk);
    left.appendChild(span);
    left.appendChild(priority);

    const time = document.createElement('div');
    time.className = 'task-time';
    time.textContent = t.time || '';

    const dateLabel = document.createElement('div');
    dateLabel.className = 'task-date';
    dateLabel.textContent = t.date === new Date().toISOString().slice(0,10) ? '' : t.date;

    const del = document.createElement('button');
    del.textContent = 'Delete';
    del.addEventListener('click', ()=>{
      tasks.splice(idx,1);
      saveTasks();
      renderTasks();
    });

    li.appendChild(left);
    li.appendChild(time);
    li.appendChild(dateLabel);
    li.appendChild(del);
    taskList.appendChild(li);
  })
}

button.addEventListener("click", () => {
  const task = input.value.trim();
  const time = timeInput.value;
  const priority = priorityInput.value || 'Medium';
  const date = dateInput.value || new Date().toISOString().slice(0,10);
  if (task) {
    const obj = {
      text: task,
      time: time,
      priority: priority,
      done: false,
      date: date
    };
    tasks.push(obj);
    saveTasks();
    renderTasks();
    input.value = "";
    dateInput.value = new Date().toISOString().slice(0,10);
    timeInput.value = "";
    priorityInput.value = 'Medium';
  }
});

// initialize date field and history
const todayValue = new Date().toISOString().slice(0,10);
dateInput.value = todayValue;
buildHistory();
renderTasks();
updateTracker();

// history UI
const viewHistoryBtn = document.getElementById('view-history');
const exportCsvBtn = document.getElementById('export-csv');
const historyPanel = document.getElementById('history-panel');
const historyList = document.getElementById('history-list');
const chartDiv = document.getElementById('progress-chart');

function groupTasksByDate() {
  return tasks.reduce((group, task) => {
    if (!group[task.date]) group[task.date] = [];
    group[task.date].push(task);
    return group;
  }, {});
}

function renderHistory(){
  historyList.innerHTML = '';
  const tasksByDate = groupTasksByDate();
  const days = Object.keys(history).sort((a,b)=>b.localeCompare(a)).slice(0,14);

  days.forEach(d=>{
    const it = history[d] || { total: 0, completed: 0 };
    const li = document.createElement('li');
    li.className = 'history-date';
    const header = document.createElement('div');
    header.innerHTML = `<strong>${d}</strong>: ${it.completed}/${it.total} completed`;
    li.appendChild(header);

    const tasksForDate = tasksByDate[d] || [];
    if(tasksForDate.length){
      const subList = document.createElement('ul');
      subList.className = 'history-tasks';
      tasksForDate.forEach(task => {
        const taskItem = document.createElement('li');
        taskItem.className = 'history-task';
        taskItem.textContent = `${task.time || 'No time'} — ${task.text} ${task.done ? '(done)' : '(pending)'}`;
        subList.appendChild(taskItem);
      });
      li.appendChild(subList);
    }
    historyList.appendChild(li);
  });
}

function renderChart(){
  chartDiv.innerHTML = '';
  const days = Object.keys(history).sort((a,b)=>b.localeCompare(a)).slice(0,7).reverse();
  if(!days.length){
    chartDiv.textContent = 'No progress history yet.';
    return;
  }

  days.forEach(d=>{
    const it = history[d] || { total: 0, completed: 0 };
    const percent = it.total ? Math.round((it.completed / it.total) * 100) : 0;
    const row = document.createElement('div');
    row.className = 'chart-row';
    row.innerHTML = `
      <div class="chart-label">${d}</div>
      <div class="chart-bar-wrap">
        <div class="chart-bar" style="width: ${percent}%">${percent}%</div>
      </div>
    `;
    chartDiv.appendChild(row);
  });
}

function renderHeatmap(){
  heatmapDiv.innerHTML = '<strong>Weekly completion heatmap</strong>';
  const container = document.createElement('div');
  container.className = 'heatmap-grid';

  const days = Object.keys(history).sort((a,b)=>b.localeCompare(a)).slice(0,7).reverse();
  if(!days.length){
    heatmapDiv.innerHTML = '<strong>Weekly completion heatmap</strong><p>No history data yet.</p>';
    return;
  }

  days.forEach(d=>{
    const it = history[d] || { total: 0, completed: 0 };
    const percent = it.total ? Math.round((it.completed / it.total) * 100) : 0;
    let level = 0;
    if(percent >= 80) level = 4;
    else if(percent >= 60) level = 3;
    else if(percent >= 30) level = 2;
    else if(percent > 0) level = 1;

    const cell = document.createElement('div');
    cell.className = `heatmap-cell level-${level}`;
    const label = document.createElement('span');
    label.textContent = `${d.slice(5)} ${percent}%`;
    cell.appendChild(label);
    container.appendChild(cell);
  });

  heatmapDiv.appendChild(container);
}

function downloadCSV(filename, csvContent) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.display = 'none';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function csvSafe(value){
  const text = String(value || '');
  return `"${text.replace(/"/g,'""')}"`;
}

function exportCSV(){
  const rows = [ ['Date','Task','Time','Priority','Done'] ];
  tasks.forEach(task => {
    rows.push([task.date, task.text, task.time || '', task.priority || 'Medium', task.done ? 'yes' : 'no']);
  });
  const csvContent = rows.map(r => r.map(csvSafe).join(',')).join('\n');
  downloadCSV('todo-history.csv', csvContent);
}

function clearHistory(){
  if(!confirm('Clear progress history and heatmap data? This will not delete tasks.')) return;
  history = {};
  localStorage.setItem('history', JSON.stringify(history));
  renderHistory();
  renderChart();
  renderHeatmap();
}

viewHistoryBtn.addEventListener('click', ()=>{
  if(historyPanel.style.display==='none'){
    renderHistory();
    renderChart();
    renderHeatmap();
    historyPanel.style.display='block';
    chartDiv.style.display='block';
    heatmapDiv.style.display='block';
    viewHistoryBtn.textContent = 'Hide History';
  } else {
    historyPanel.style.display='none';
    chartDiv.style.display='none';
    heatmapDiv.style.display='none';
    viewHistoryBtn.textContent = 'View History';
  }
});

exportCsvBtn.addEventListener('click', exportCSV);
clearHistoryBtn.addEventListener('click', clearHistory);

const text="Hey.., What are your plans for today.. ?";
let index =0;
function typeText(){
  if(index<text.length){
    Greeting.textContent+=text.charAt(index)
    index++;
    setTimeout(typeText,100);
  }
}
typeText();

