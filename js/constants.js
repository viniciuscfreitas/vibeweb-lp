// Constants - Business Rules
const SEARCH_DEBOUNCE_MS = 200;
const DISCOVERY_COLUMN_ID = 0;
const URGENT_DEADLINES = ['48h', '24h', 'Hoje'];
const STORAGE_KEY = 'vibeTasks_Vanilla';

// Financial Constants
const HOSTING_PRICE_EUR = 29;
const TARGET_MRR_10K = 10000;
const TARGET_MRR_20K = 20000;
const DEFAULT_AVERAGE_TICKET = 1500;
const DEFAULT_CAC = 40;
const MOCK_BASE_REVENUE = 2000;

// Time Constants (milliseconds)
const MS_PER_SECOND = 1000;
const MS_PER_MINUTE = 60 * MS_PER_SECOND;
const MS_PER_HOUR = 60 * MS_PER_MINUTE;
const MS_PER_DAY = 24 * MS_PER_HOUR;
const URGENT_HOURS_48 = 48;
const URGENT_HOURS_48_MS = URGENT_HOURS_48 * MS_PER_HOUR;
const HOURS_24_MS = 24 * MS_PER_HOUR;

// Payment Status Constants
const PAYMENT_STATUS_PENDING = 'Pendente';
const PAYMENT_STATUS_PARTIAL = '50% Após Aprovação';
const PAYMENT_STATUS_PAID = 'Pago 100%';

// Hosting Status Constants
const HOSTING_NO = 'nao';
const HOSTING_YES = 'sim';
const HOSTING_LATER = 'depois';

// UI Constants
const CHART_TOTAL_HEIGHT = 200;
const CHART_SPACE_FOR_LABELS = 40;
const CHART_MINIMUM_BAR_HEIGHT = 8;
const PIE_CHART_SIZE = 200;
const PIE_CHART_RADIUS = 70;

// Deadline Constants
const DEADLINE_UNDEFINED = 'A Definir';
const DEADLINE_OVERDUE = 'Vencido';

// Storage Keys
const THEME_STORAGE_KEY = 'vibeTasks_theme';

const COLUMNS = [
  { id: 0, name: 'Descoberta' },
  { id: 1, name: 'Acordo' },
  { id: 2, name: 'Construir e Entregar' },
  { id: 3, name: 'Suporte / Live' }
];
