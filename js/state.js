// State Management
const AppState = {
  tasks: [],
  draggedTaskId: null,
  currentTaskId: null,
  searchTimeout: null,
  filterByColumnId: null,
  filterByCustomType: null,

  setTasks(newTasks) {
    this.tasks = newTasks;
    this.log('State updated', { taskCount: newTasks.length });
  },

  getTasks() {
    return this.tasks;
  },

  log(message, data = {}) {
    const hostname = window.location.hostname;
    const isLocalhost = hostname === 'localhost';
    const isLocalIP = hostname === '127.0.0.1';
    const isDev = isLocalhost || isLocalIP;

    if (isDev) {
      console.log(`[AppState] ${message}`, data);
    }
  }
};
