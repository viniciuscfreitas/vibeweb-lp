// Extreme Seed Script - Grug-approved version
// Grug Rule: "Break big function into small pieces. Easy to debug = good code."

const sqlite3 = require('sqlite3').verbose();
const bcrypt = require('bcrypt');
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.db');

// Configuration
const NUM_USERS = 20;
const TASKS_PER_USER = 500;
const TOTAL_TASKS = NUM_USERS * TASKS_PER_USER;

// Progress update intervals
const PROGRESS_UPDATE_USERS = 5;
const PROGRESS_UPDATE_TASKS = 500;
const BATCH_SIZE = 100;

// Business logic constants
const DEADLINE_UNDEFINED_CHANCE = 0.3;
const HOSTING_LIVE_CHANCE = 0.4;
const HOSTING_PENDING_CHANCE = 0.7;

// Data pools
const FIRST_NAMES = [
  'João', 'Maria', 'Pedro', 'Ana', 'Carlos', 'Mariana', 'Lucas', 'Julia',
  'Rafael', 'Fernanda', 'Gabriel', 'Beatriz', 'Felipe', 'Camila', 'Bruno',
  'Isabella', 'Thiago', 'Larissa', 'Gustavo', 'Amanda', 'Rodrigo', 'Patricia',
  'André', 'Renata', 'Marcos', 'Vanessa', 'Daniel', 'Cristina', 'Ricardo', 'Juliana'
];

const LAST_NAMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Rodrigues', 'Ferreira', 'Alves',
  'Pereira', 'Lima', 'Gomes', 'Costa', 'Ribeiro', 'Martins', 'Carvalho',
  'Almeida', 'Lopes', 'Soares', 'Fernandes', 'Vieira', 'Barbosa', 'Rocha',
  'Dias', 'Monteiro', 'Cardoso', 'Reis', 'Araujo', 'Mendes', 'Nunes', 'Moreira'
];

const CLIENT_NAMES = [
  'Acme Corp', 'Global Industries', 'Local Business', 'Startup Inc', 'Enterprise Ltd',
  'Small Business Co', 'Family Store', 'Online Shop', 'Service Provider', 'Retail Chain',
  'Restaurant Group', 'Hotel Chain', 'Real Estate', 'Healthcare Clinic', 'Education Center',
  'Fitness Studio', 'Beauty Salon', 'Law Firm', 'Accounting Office', 'Construction Co'
];

const PROJECT_TYPES = [
  'Landing Page', 'E-commerce', 'Website Institucional', 'Blog', 'Portfolio',
  'Sistema Web', 'App Mobile', 'Dashboard', 'API', 'Integração'
];

const STACKS = [
  'React + Node', 'Vue + Express', 'Next.js', 'WordPress', 'Shopify',
  'Laravel + Vue', 'Django + React', 'Angular + Node', 'Svelte + Express', 'Nuxt.js'
];

const DOMAINS = [
  'example.com', 'test.com', 'demo.com', 'sample.org', 'mysite.com',
  'business.com', 'company.net', 'website.io', 'app.dev', 'site.com.br'
];

const PAYMENT_STATUSES = ['Pendente', '50% Após Aprovação', 'Pago 100%'];
const HOSTING_OPTIONS = ['nao', 'sim', 'depois'];
const COL_WEIGHTS = [0.3, 0.25, 0.25, 0.2]; // Discovery, Agreement, Build, Live

// Helper functions
function randomItem(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomFloat(min, max) {
  return parseFloat((Math.random() * (max - min) + min).toFixed(2));
}

function randomDate(startDaysAgo = 365, endDaysAhead = 90) {
  const start = new Date();
  start.setDate(start.getDate() - startDaysAgo);
  const end = new Date();
  end.setDate(end.getDate() + endDaysAhead);
  const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime());
  return new Date(randomTime);
}

function formatDate(date) {
  return date.toISOString().slice(0, 19).replace('T', ' ');
}

function getTimestamp(date) {
  return Math.floor(date.getTime() / 1000);
}

function randomColId() {
  const rand = Math.random();
  if (rand < COL_WEIGHTS[0]) return 0;
  if (rand < COL_WEIGHTS[0] + COL_WEIGHTS[1]) return 1;
  if (rand < COL_WEIGHTS[0] + COL_WEIGHTS[1] + COL_WEIGHTS[2]) return 2;
  return 3;
}

function generateEmail(firstName, lastName, index) {
  const domains = ['gmail.com', 'outlook.com', 'yahoo.com', 'hotmail.com', 'company.com'];
  return `${firstName.toLowerCase()}.${lastName.toLowerCase()}${index}@${randomItem(domains)}`;
}

function generateTask(userId, taskIndex, colId) {
  const client = `${randomItem(CLIENT_NAMES)} ${randomInt(1, 999)}`;
  const contact = `${randomItem(FIRST_NAMES)} ${randomItem(LAST_NAMES)} - ${randomInt(100000000, 999999999)}`;
  const type = randomItem(PROJECT_TYPES);
  const stack = randomItem(STACKS);
  const domain = `${client.toLowerCase().replace(/\s+/g, '')}${randomInt(1, 99)}.${randomItem(DOMAINS)}`;

  const descriptions = [
    `Desenvolvimento de ${type.toLowerCase()} para ${client}`,
    `Projeto completo de ${type.toLowerCase()} com ${stack}`,
    `Criação de ${type.toLowerCase()} personalizado`,
    `Sistema ${type.toLowerCase()} com integrações avançadas`,
    `Plataforma ${type.toLowerCase()} com dashboard administrativo`
  ];

  const price = randomFloat(500, 10000);
  const paymentStatus = randomItem(PAYMENT_STATUSES);

  let deadline = 'A Definir';
  let deadlineTimestamp = null;
  if (Math.random() > DEADLINE_UNDEFINED_CHANCE) {
    const deadlineDate = randomDate(-30, 180);
    deadline = formatDate(deadlineDate);
    deadlineTimestamp = getTimestamp(deadlineDate);
  }

  let hosting = randomItem(HOSTING_OPTIONS);
  if (colId === 3 && Math.random() > HOSTING_LIVE_CHANCE) {
    hosting = 'sim';
  } else if (colId < 3) {
    hosting = Math.random() > HOSTING_PENDING_CHANCE ? 'depois' : 'nao';
  }

  return {
    user_id: userId,
    client,
    contact,
    type,
    stack,
    domain,
    description: randomItem(descriptions),
    price,
    payment_status: paymentStatus,
    deadline,
    deadline_timestamp: deadlineTimestamp,
    hosting,
    col_id: colId,
    order_position: taskIndex
  };
}

// Database helpers - unified query function
function query(db, sql, params = [], method = 'run') {
  return new Promise((resolve, reject) => {
    const callback = (err, result) => {
      if (err) reject(err);
      else resolve(result);
    };

    if (method === 'get') {
      db.get(sql, params, callback);
    } else if (method === 'all') {
      db.all(sql, params, callback);
    } else {
      db.run(sql, params, function (err) {
        if (err) reject(err);
        else resolve({ lastID: this.lastID, changes: this.changes });
      });
    }
  });
}

// Main functions - broken down for clarity
async function clearDatabase(db) {
  console.log('🗑️  Clearing existing data...');
  await query(db, 'DELETE FROM tasks');
  await query(db, 'DELETE FROM users WHERE email != ?', ['vinicius@example.com']);
}

async function createUsers(db) {
  console.log('👥 Creating users...');
  const passwordHash = await bcrypt.hash('password123', 10);

  for (let i = 0; i < NUM_USERS; i++) {
    const firstName = randomItem(FIRST_NAMES);
    const lastName = randomItem(LAST_NAMES);
    const name = `${firstName} ${lastName}`;
    const email = generateEmail(firstName, lastName, i);

    await query(
      db,
      'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)',
      [email, name, passwordHash]
    );

    if ((i + 1) % PROGRESS_UPDATE_USERS === 0) {
      process.stdout.write(`   Created ${i + 1}/${NUM_USERS} users\r`);
    }
  }
  console.log(`\n✅ Created ${NUM_USERS} users`);
}

async function insertTaskBatch(db, batch) {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(`
      INSERT INTO tasks (
        user_id, client, contact, type, stack, domain, description,
        price, payment_status, deadline, deadline_timestamp,
        hosting, col_id, order_position
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let completed = 0;
    let hasError = false;

    batch.forEach((task) => {
      stmt.run(
        [
          task.user_id, task.client, task.contact, task.type, task.stack,
          task.domain, task.description, task.price, task.payment_status,
          task.deadline, task.deadline_timestamp, task.hosting,
          task.col_id, task.order_position
        ],
        (err) => {
          if (err && !hasError) {
            hasError = true;
            stmt.finalize();
            reject(err);
            return;
          }

          completed++;
          if (completed === batch.length && !hasError) {
            stmt.finalize();
            resolve();
          }
        }
      );
    });
  });
}

async function createTasks(db, userIds) {
  console.log('\n📝 Creating tasks...');
  let totalCreated = 0;

  for (const userId of userIds) {
    const tasksForUser = Math.min(TASKS_PER_USER, TOTAL_TASKS - totalCreated);
    if (tasksForUser <= 0) break;

    for (let batchStart = 0; batchStart < tasksForUser; batchStart += BATCH_SIZE) {
      const batchEnd = Math.min(batchStart + BATCH_SIZE, tasksForUser);
      const batch = [];

      for (let taskIndex = batchStart; taskIndex < batchEnd; taskIndex++) {
        const colId = randomColId();
        batch.push(generateTask(userId, taskIndex, colId));
      }

      await insertTaskBatch(db, batch);
      totalCreated += batch.length;

      if (totalCreated % PROGRESS_UPDATE_TASKS === 0) {
        process.stdout.write(`   Created ${totalCreated}/${TOTAL_TASKS} tasks\r`);
      }
    }
  }

  console.log(`\n✅ Created ${totalCreated} tasks`);
}

async function showStatistics(db) {
  console.log('\n📈 Database Statistics:');

  const stats = [
    { label: 'Users', sql: 'SELECT COUNT(*) as count FROM users' },
    { label: 'Tasks', sql: 'SELECT COUNT(*) as count FROM tasks' },
    { label: 'Tasks in Discovery', sql: 'SELECT COUNT(*) as count FROM tasks WHERE col_id = 0' },
    { label: 'Tasks in Agreement', sql: 'SELECT COUNT(*) as count FROM tasks WHERE col_id = 1' },
    { label: 'Tasks in Build', sql: 'SELECT COUNT(*) as count FROM tasks WHERE col_id = 2' },
    { label: 'Tasks in Live', sql: 'SELECT COUNT(*) as count FROM tasks WHERE col_id = 3' },
    { label: 'Tasks with hosting', sql: "SELECT COUNT(*) as count FROM tasks WHERE hosting = 'sim'" }
  ];

  for (const stat of stats) {
    const result = await query(db, stat.sql, [], 'get');
    console.log(`   ${stat.label}: ${result.count}`);
  }

  const revenueResult = await query(
    db,
    'SELECT SUM(price) as total FROM tasks WHERE payment_status = ? OR payment_status = ?',
    ['Pago 100%', '50% Após Aprovação'],
    'get'
  );
  const totalRevenue = revenueResult.total || 0;
  console.log(`   Total Revenue: €${totalRevenue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`);
}

// Main function - now much simpler
async function seedExtreme() {
  const db = new sqlite3.Database(DB_PATH, (err) => {
    if (err) {
      console.error('Error opening database:', err);
      process.exit(1);
    }
    console.log('✅ Connected to database');
  });

  try {
    console.log(`\n🚀 Starting extreme seed generation...`);
    console.log(`   Users: ${NUM_USERS}`);
    console.log(`   Tasks per user: ${TASKS_PER_USER}`);
    console.log(`   Total tasks: ${TOTAL_TASKS}\n`);

    await clearDatabase(db);
    await createUsers(db);

    const allUsers = await query(db, 'SELECT id FROM users', [], 'all');
    const userIds = allUsers.map(u => u.id);
    console.log(`📊 Total users in database: ${userIds.length}`);

    await createTasks(db, userIds);
    await showStatistics(db);

    console.log('\n🎉 Extreme seed completed successfully!');
    console.log('   All users have password: password123');
    console.log('   Database is ready for extreme testing.\n');

    db.close();
  } catch (error) {
    console.error('Error during seed:', error);
    db.close();
    throw error;
  }
}

// Run seed
seedExtreme()
  .then(() => {
    process.exit(0);
  })
  .catch((err) => {
    console.error('Seed failed:', err);
    process.exit(1);
  });

