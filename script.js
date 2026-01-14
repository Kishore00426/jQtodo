$(document).ready(function () {
  const modal = new bootstrap.Modal($('#taskModal'));
  const viewModal = new bootstrap.Modal($('#viewModal'));
  let tasks = JSON.parse(localStorage.getItem('tasks') || '[]');

  let table = $('#todoTable').DataTable({
    data: tasks,
    columns: [
      {
        data: null,
        render: () => `<input type="checkbox" class="task-checkbox" />`,
        orderable: false
      },
      {
        data: 'task',
        render: (data, type, row) =>
          `<span class="truncate ${row.status === 'completed' ? 'completed' : ''}">${data}</span>`
      },
      {
        data: 'desc',
        render: (data) => `<span class="truncate">${data || ''}</span>`
      },
      {
        data: 'status',
        render: (data) => {
          const statusClass = data === 'completed' ? 'bg-success' : 'bg-warning';
          // Using Bootstrap's badge classes for ease, or custom ones
          return `<span class="badge ${statusClass} rounded-pill text-capitalize">${data}</span>`;
        }
      },
      {
        data: null,
        render: () => `
          <i data-index="' + index + '" class="fas fa-eye action-btn viewBtn" title="View Task"></i>
          <i data-index="' + index + '" class="fas fa-edit action-btn editBtn" title="Edit Task"></i>
          <i data-index="' + index + '" class="fas fa-trash action-btn deleteBtn" title="Delete Task"></i>
        `,
        orderable: false
      }
    ]
  });

  // Save to LocalStorage
  function saveTasks() {
    localStorage.setItem('tasks', JSON.stringify(tasks));
  }

  // Reload Table
  function reloadTable() {
    const filter = $('#filterStatus').val();
    const filtered = filter === 'all' ? tasks : tasks.filter(t => t.status === filter);
    table.clear().rows.add(filtered).draw();
  }

  // Add Task
  $('#addTaskBtn').on('click', () => {
    $('#editIndex').val(-1);
    $('#taskInput').val('');
    $('#descInput').val('');
    $('#statusInput').val('pending');
    modal.show();
  });

  $('#saveTaskBtn').on('click', () => {
    const task = $('#taskInput').val().trim();
    const desc = $('#descInput').val().trim();
    const status = $('#statusInput').val();
    const index = parseInt($('#editIndex').val());

    if (!task) return alert('Please enter a task.');

    const newTask = { task, desc, status };
    if (index === -1) tasks.push(newTask);
    else tasks[index] = newTask;

    saveTasks();
    reloadTable();
    modal.hide();
  });

  // Edit Task
  $('#todoTable').on('click', '.editBtn', function () {
    const data = table.row($(this).parents('tr')).data();
    const index = tasks.findIndex(t => t.task === data.task && t.desc === data.desc && t.status === data.status);
    $('#editIndex').val(index);
    $('#taskInput').val(data.task);
    $('#descInput').val(data.desc);
    $('#statusInput').val(data.status);
    modal.show();
  });

  // View Task
  $('#todoTable').on('click', '.viewBtn', function () {
    const data = table.row($(this).parents('tr')).data();
    $('#viewTask').text(data.task);
    $('#viewDesc').text(data.desc || 'No description');
    $('#viewStatus').text(data.status);
    viewModal.show();
  });

  // Delete Task
  $('#todoTable').on('click', '.deleteBtn', function () {
    const data = table.row($(this).parents('tr')).data();
    tasks = tasks.filter(t => !(t.task === data.task && t.desc === data.desc && t.status === data.status));
    saveTasks();
    reloadTable();
  });

  // Filter
  $('#filterStatus').on('change', reloadTable);

  // Print
  $('#printBtn').on('click', () => window.print());

  // Bulk Actions
  $('#selectAllBtn').on('click', () => $('.task-checkbox').prop('checked', true));

  $('#deleteSelectedBtn').on('click', () => {
    const selected = [];
    $('#todoTable tbody tr').each(function () {
      if ($(this).find('.task-checkbox').is(':checked')) {
        selected.push(table.row(this).data());
      }
    });
    tasks = tasks.filter(t => !selected.some(s => s.task === t.task && s.desc === t.desc));
    saveTasks();
    reloadTable();
  });

  $('#markCompletedBtn').on('click', () => {
    $('#todoTable tbody tr').each(function () {
      if ($(this).find('.task-checkbox').is(':checked')) {
        const data = table.row(this).data();
        const task = tasks.find(t => t.task === data.task && t.desc === data.desc);
        if (task) task.status = 'completed';
      }
    });
    saveTasks();
    reloadTable();
  });

  $('#markPendingBtn').on('click', () => {
    $('#todoTable tbody tr').each(function () {
      if ($(this).find('.task-checkbox').is(':checked')) {
        const data = table.row(this).data();
        const task = tasks.find(t => t.task === data.task && t.desc === data.desc);
        if (task) task.status = 'pending';
      }
    });
    saveTasks();
    reloadTable();
  });

  $('#selectAll').on('change', function () {
    $('.task-checkbox').prop('checked', $(this).is(':checked'));
  });

  // Download as PDF
  $('#downloadPDF').on('click', () => {
    const doc = new jspdf.jsPDF();
    doc.text('To-Do List', 14, 15);
    const data = tasks.map(t => [t.task, t.desc, t.status]);
    doc.autoTable({ head: [['Task', 'Description', 'Status']], body: data });
    doc.save('tasks.pdf');
  });

  // Download as Excel
  $('#downloadExcel').on('click', () => {
    const worksheet = XLSX.utils.json_to_sheet(tasks);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Tasks");
    XLSX.writeFile(workbook, "tasks.xlsx");
  });

  // Initial Load
  reloadTable();
});
