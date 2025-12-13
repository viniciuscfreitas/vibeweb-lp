// Utility Functions

function parseDeadlineHours(deadlineStr) {
  const match = deadlineStr.match(/(\d+)h/i);
  return match ? parseInt(match[1]) : null;
}

function calculateTimeRemaining(deadline, deadlineTimestamp) {
  if (!deadline || !deadlineTimestamp) return null;

  const hours = parseDeadlineHours(deadline);
  if (!hours) return deadline;

  const now = Date.now();
  const deadlineTime = deadlineTimestamp + (hours * MS_PER_HOUR);
  const remaining = deadlineTime - now;

  if (remaining <= 0) return DEADLINE_OVERDUE;

  const remainingHours = Math.floor(remaining / MS_PER_HOUR);
  const remainingMinutes = Math.floor((remaining % MS_PER_HOUR) / MS_PER_MINUTE);

  if (remainingHours >= 24) {
    const days = Math.floor(remainingHours / 24);
    const hoursLeft = remainingHours % 24;
    return `${days}d ${hoursLeft}h`;
  }

  if (remainingHours > 0) {
    return `${remainingHours}h ${remainingMinutes}m`;
  }

  return `${remainingMinutes}m`;
}

function formatDeadlineDisplay(deadline, deadlineTimestamp) {
  if (!deadline || deadline === DEADLINE_UNDEFINED) return null;

  const hours = parseDeadlineHours(deadline);
  if (hours && deadlineTimestamp) {
    return calculateTimeRemaining(deadline, deadlineTimestamp);
  }

  return deadline;
}

function formatCurrency(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 0
  }).format(value);
}

function formatPrice(value) {
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'EUR'
  }).format(value);
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}


function getLastMonthInfo(currentMonth, currentYear) {
  if (currentMonth === 0) {
    return { month: 11, year: currentYear - 1 };
  }
  return { month: currentMonth - 1, year: currentYear };
}

function calculateRevenueChange(currentRevenue, lastRevenue) {
  if (lastRevenue > 0) {
    return ((currentRevenue - lastRevenue) / lastRevenue * 100).toFixed(1);
  }
  return 0;
}

function getTimeAgo(date) {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / MS_PER_MINUTE);
  const hours = Math.floor(diff / MS_PER_HOUR);
  const days = Math.floor(diff / MS_PER_DAY);

  if (minutes < 60) return `${minutes}m atrás`;
  if (hours < 24) return `${hours}h atrás`;
  if (days < 7) return `${days}d atrás`;
  return date.toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' });
}

function migrateTasksData(tasks) {
  if (!Array.isArray(tasks) || tasks.length === 0) {
    return tasks || [];
  }

  try {
    return tasks.map(task => {
      if (!task || typeof task !== 'object') {
        return task;
      }

      const migrated = { ...task };

      if (migrated.hosting === undefined || migrated.hosting === null) {
        migrated.hosting = HOSTING_NO;
      }

      if (migrated.deadline && !migrated.deadlineTimestamp) {
        const deadlineHours = parseDeadlineHours(migrated.deadline);
        if (deadlineHours && migrated.id) {
          migrated.deadlineTimestamp = migrated.id;
        }
      }

      return migrated;
    });
  } catch (error) {
    console.error('[Migrate] Erro ao migrar dados:', error);
    return tasks;
  }
}
