// Quick script to add tasks to default user
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, '..', 'database.db');

// Reuse data pools from seed-extreme
const CLIENT_NAMES = [
  'Acme Corp', 'Global Industries', 'Local Business', 'Startup Inc', 'Enterprise Ltd',
  'Small Business Co', 'Family Store', 'Online Shop', 'Service Provider', 'Retail Chain'
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
  'example.com', 'test.com', 'demo.com', 'sample.org', 'mysite.com'
];

const PAYMENT_STATUSES = ['Pendente', '50% Após Aprovação', 'Pago 100%'];
const HOSTING_OPTIONS = ['nao', 'sim', 'depois'];
const COL_WEIGHTS = [0.3, 0.25, 0.25, 0.2];

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

function generateTask(userId, taskIndex, colId) {
  const client = `${randomItem(CLIENT_NAMES)} ${randomInt(1, 999)}`;
  const contact = `Contact ${randomInt(100000000, 999999999)}`;
  const type = randomItem(PROJECT_TYPES);
  const stack = randomItem(STACKS);
  const domain = `${client.toLowerCase().replace(/\s+/g, '')}${randomInt(1, 99)}.${randomItem(DOMAINS)}`;

  const descriptions = [
    `Desenvolvimento de ${type.toLowerCase()} para ${client}`,
    `Projeto completo de ${type.toLowerCase()} com ${stack}`,
    `Criação de ${type.toLowerCase()} personalizado`
  ];

  const price = randomFloat(500, 10000);
  const paymentStatus = randomItem(PAYMENT_STATUSES);

  let deadline = 'A Definir';
  let deadlineTimestamp = null;
  if (Math.random() > 0.3) {
    const deadlineDate = randomDate(-30, 180);
    deadline = formatDate(deadlineDate);
    deadlineTimestamp = getTimestamp(deadlineDate);
  }

  let hosting = randomItem(HOSTING_OPTIONS);
  if (colId === 3 && Math.random() > 0.4) {
    hosting = 'sim';
  } else if (colId < 3) {
    hosting = Math.random() > 0.7 ? 'depois' : 'nao';
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

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) {
    console.error('Error opening database:', err);
    process.exit(1);
  }
  console.log('✅ Connected to database');
});

db.get("SELECT id FROM users WHERE email = 'vinicius@example.com'", [], async (err, user) => {
  if (err) {
    console.error('Error:', err);
    db.close();
    process.exit(1);
  }

  if (!user) {
    console.error('User vinicius@example.com not found!');
    db.close();
    process.exit(1);
  }

  const userId = user.id;
  const NUM_TASKS = 500;
  const BATCH_SIZE = 100;

  console.log(`\n📝 Creating ${NUM_TASKS} tasks for user ID ${userId}...`);

  let totalCreated = 0;

  for (let batchStart = 0; batchStart < NUM_TASKS; batchStart += BATCH_SIZE) {
    const batchEnd = Math.min(batchStart + BATCH_SIZE, NUM_TASKS);
    const batch = [];

    for (let taskIndex = batchStart; taskIndex < batchEnd; taskIndex++) {
      const colId = randomColId();
      batch.push(generateTask(userId, taskIndex, colId));
    }

    await new Promise((resolveBatch) => {
      db.serialize(() => {
        db.run('BEGIN TRANSACTION');

        const stmt = db.prepare(`
          INSERT INTO tasks (
            user_id, client, contact, type, stack, domain, description,
            price, payment_status, deadline, deadline_timestamp,
            hosting, col_id, order_position
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        let completed = 0;
        batch.forEach((task) => {
          stmt.run(
            [
              task.user_id, task.client, task.contact, task.type, task.stack,
              task.domain, task.description, task.price, task.payment_status,
              task.deadline, task.deadline_timestamp, task.hosting,
              task.col_id, task.order_position
            ],
            (err) => {
              if (err) {
                console.error('Error inserting task:', err);
              } else {
                totalCreated++;
                if (totalCreated % 100 === 0) {
                  process.stdout.write(`   Created ${totalCreated}/${NUM_TASKS} tasks\r`);
                }
              }

              completed++;
              if (completed === batch.length) {
                stmt.finalize();
                db.run('COMMIT', (err) => {
                  if (err) console.error('Error committing batch:', err);
                  resolveBatch();
                });
              }
            }
          );
        });
      });
    });
  }

  console.log(`\n✅ Created ${totalCreated} tasks for vinicius@example.com`);
  db.close();
  process.exit(0);
});

