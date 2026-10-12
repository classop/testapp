const express = require('express');
const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

const app = express();
const PORT = process.env.PORT || 3000;   // ← важно для Render
const DB_FILE = path.join(__dirname, 'db.json');

// SHA-256 от пароля "proverkatest"
const ADMIN_PASSWORD_HASH = crypto
  .createHash('sha256')
  .update('proverkatest')
  .digest('hex');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ---------- "База данных" (JSON-файл) ----------
function readDB() {
  if (!fs.existsSync(DB_FILE)) {
    const initial = {
      participants: [],
      attempts: [],
      nextParticipantId: 1,
      nextAttemptId: 1
    };
    fs.writeFileSync(DB_FILE, JSON.stringify(initial, null, 2));
    return initial;
  }
  return JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
}

function writeDB(db) {
  fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

// ---------- Вопросы ----------
const QUESTIONS = [
  { id: 1, text: 'Что является основной целью отладки программного модуля?', options: { A: 'Поиск причины дефекта и её устранение', B: 'Сбор пользовательских требований', C: 'Выпуск новой версии программы', D: 'Обучение пользователей работе с системой' }, correct: 'A' },
  { id: 2, text: 'Для чего предназначена точка останова?', options: { A: 'Для аварийного завершения процесса', B: 'Для приостановки выполнения программы и передачи управления отладчику', C: 'Для автоматической оптимизации кода', D: 'Для шифрования диагностических данных' }, correct: 'B' },
  { id: 3, text: 'Какой тип точки останова срабатывает при изменении значения переменной или области памяти?', options: { A: 'Условная точка останова', B: 'Журнальная точка останова', C: 'Точка останова на данные', D: 'Временная точка останова' }, correct: 'C' },
  { id: 4, text: 'Что означает команда «шаг с заходом» при пошаговой отладке?', options: { A: 'Выполнить текущую строку без входа в вызываемые функции', B: 'Завершить выполнение текущей функции', C: 'Войти внутрь вызываемой функции', D: 'Продолжить выполнение до курсора' }, correct: 'C' },
  { id: 5, text: 'Как называется внешнее наблюдаемое проявление дефекта, например сообщение об ошибке или неверный результат?', options: { A: 'Симптом', B: 'Дефект', C: 'Инвариант', D: 'Оракул' }, correct: 'A' },
  { id: 6, text: 'Какой пример относится к ошибкам времени выполнения?', options: { A: 'Ошибка в техническом задании', B: 'Деление на ноль во время работы программы', C: 'Опечатка в комментарии к коду', D: 'Неверный стиль оформления документации' }, correct: 'B' },
  { id: 7, text: 'Какая причина возникновения дефектов относится к процессным факторам?', options: { A: 'Отсутствие рецензирования кода', B: 'Недостаточная яркость монитора', C: 'Использование мыши', D: 'Наличие резервной копии' }, correct: 'A' },
  { id: 8, text: 'Какой метод обнаружения ошибок выполняется без запуска программы?', options: { A: 'Фаззинг-тестирование', B: 'Динамический анализ', C: 'Статический анализ', D: 'Профилирование производительности' }, correct: 'C' },
  { id: 9, text: 'Какую роль выполняет тестирование во взаимодействии с отладкой?', options: { A: 'Выявляет расхождение и передаёт данные для последующей отладки', B: 'Полностью заменяет отладку', C: 'Устраняет причину дефекта без анализа кода', D: 'Ускоряет компиляцию программы' }, correct: 'A' },
  { id: 10, text: 'Какие диагностические данные наиболее полезно автоматически сохранять при падении автотеста?', options: { A: 'Только имя теста', B: 'Только версию операционной системы', C: 'Только ожидаемый результат', D: 'Журналы, стек вызовов, входные данные и снимки состояния' }, correct: 'D' },
  { id: 11, text: 'Для чего применяется дамп памяти?', options: { A: 'Для анализа состояния процесса после аварийного завершения', B: 'Для запуска модульных тестов', C: 'Для генерации требований', D: 'Для создания спецификации' }, correct: 'A' },
  { id: 12, text: 'Чем статический анализатор отличается от динамического?', options: { A: 'Статический анализатор работает только во время выполнения программы', B: 'Статический анализатор проверяет код без запуска программы', C: 'Статический анализатор заменяет тестирование', D: 'Статический анализатор всегда требует сетевого доступа' }, correct: 'B' },
  { id: 13, text: 'Какое специализированное средство наиболее уместно при подозрении на утечку памяти?', options: { A: 'Сетевой анализатор', B: 'Таблица решений', C: 'Анализатор памяти или снимков кучи', D: 'Интерфейсный макет' }, correct: 'C' },
  { id: 14, text: 'Для чего главным образом применяется профилировщик?', options: { A: 'Для проверки требований заказчика', B: 'Для создания документации', C: 'Для шифрования журналов', D: 'Для поиска узких мест производительности' }, correct: 'D' },
  { id: 15, text: 'Какое средство наиболее полезно при зависании многопоточного программного модуля?', options: { A: 'Фаззинг-генератор', B: 'Дамп потоков', C: 'Анализ классов эквивалентности', D: 'Пользовательская инструкция' }, correct: 'B' },
  { id: 16, text: 'Что позволяет увидеть сетевой анализатор при отладке взаимодействия модулей?', options: { A: 'Фактические запросы и ответы между компонентами', B: 'Только исходный код модуля', C: 'Только требования к интерфейсу', D: 'Только комментарии разработчика' }, correct: 'A' },
  { id: 17, text: 'Что предполагает автономная отладка программного модуля?', options: { A: 'Проверку модуля только в производственной среде', B: 'Проверку модуля без ожидаемых результатов', C: 'Проверку только пользовательского интерфейса', D: 'Изолированную проверку модуля с управляемыми зависимостями' }, correct: 'D' },
  { id: 18, text: 'Что обычно используется вместо реальной базы данных при автономной проверке модуля?', options: { A: 'Пользовательский интерфейс', B: 'Сетевой маршрутизатор', C: 'Заглушка или фиктивный компонент', D: 'Аварийный дамп' }, correct: 'C' },
  { id: 19, text: 'Что прежде всего выявляет комплексное тестирование программного модуля?', options: { A: 'Синтаксические опечатки в коде', B: 'Дефекты взаимодействия модулей и интерфейсов', C: 'Только скорость набора текста пользователем', D: 'Наличие комментариев в коде' }, correct: 'B' },
  { id: 20, text: 'Для чего предназначены отладочные классы?', options: { A: 'Для регистрации диагностических событий и проверки состояния модуля', B: 'Для хранения пользовательских паролей', C: 'Для замены бизнес-требований', D: 'Для создания графического дизайна' }, correct: 'A' },
  { id: 21, text: 'Чем встроенный отладчик обычно отличается от внешнего?', options: { A: 'Он никогда не использует исходный код', B: 'Он применяется только для анализа баз данных', C: 'Он входит в состав среды разработки или исполнения и удобен для локального анализа', D: 'Он не может приостанавливать выполнение программы' }, correct: 'C' },
  { id: 22, text: 'Какие сведения следует включать в диагностическое описание выявленной проблемы?', options: { A: 'Только имя пользователя', B: 'Только номер компьютера', C: 'Только дату установки операционной системы', D: 'Версию модуля, симптом, окружение, наблюдения и установленную причину' }, correct: 'D' },
  { id: 23, text: 'Какова основная цель тестирования программного обеспечения?', options: { A: 'Доказать полное отсутствие дефектов', B: 'Получить информацию о качестве продукта и выявить расхождения', C: 'Заменить разработку программы', D: 'Удалить устаревшую документацию' }, correct: 'B' },
  { id: 24, text: 'Почему при проектировании тестов применяется анализ граничных значений?', options: { A: 'Потому что ошибки часто возникают на границах допустимых диапазонов', B: 'Потому что он заменяет спецификацию', C: 'Потому что он не требует тестовых данных', D: 'Потому что он проверяет только внешний вид интерфейса' }, correct: 'A' },
  { id: 25, text: 'Что такое оракул тестирования?', options: { A: 'Случайный набор входных данных', B: 'Инструмент для компиляции программы', C: 'Источник ожидаемого результата', D: 'Журнал сборки проекта' }, correct: 'C' },
  { id: 26, text: 'Что означает принцип «исчерпывающее тестирование невозможно»?', options: { A: 'Тестирование выполнять не нужно', B: 'Достаточно одного теста для всей системы', C: 'Дефекты не могут существовать', D: 'Необходимо выбирать проверки на основе рисков и приоритетов' }, correct: 'D' },
  { id: 27, text: 'Что такое спецификация программного модуля?', options: { A: 'Исходный код модуля', B: 'Описание ожидаемого поведения, интерфейсов и ограничений модуля', C: 'Журнал ошибок', D: 'Дамп памяти' }, correct: 'B' },
  { id: 28, text: 'Что такое предусловие программного модуля?', options: { A: 'Условие, которое должно быть истинно до вызова модуля', B: 'Состояние после успешного выполнения модуля', C: 'Возвращаемый результат', D: 'Побочный эффект' }, correct: 'A' },
  { id: 29, text: 'Что понимается под несоответствием результата выполнения модуля его спецификации?', options: { A: 'Любой вывод программы в консоль', B: 'Успешное прохождение теста', C: 'Расхождение между фактическим поведением и ожидаемым поведением, определённым спецификацией', D: 'Обновление документации' }, correct: 'C' },
  { id: 30, text: 'С чего следует начинать выявление несоответствия результата выполнения модуля спецификации?', options: { A: 'С удаления программного модуля', B: 'С изменения спецификации без анализа', C: 'С игнорирования окружения', D: 'С определения проверяемого требования и источника ожидаемого результата' }, correct: 'D' }
];

function shuffle(arr) {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// ---------- API ----------
app.post('/api/login', (req, res) => {
  const { fio } = req.body;
  if (!fio || !fio.trim()) return res.status(400).json({ error: 'Укажите ФИО' });
  const db = readDB();
  let participant = db.participants.find(p => p.fio.toLowerCase() === fio.trim().toLowerCase());
  if (!participant) {
    participant = { id: db.nextParticipantId++, fio: fio.trim(), role: 'participant' };
    db.participants.push(participant);
    writeDB(db);
  }
  const completed = db.attempts.find(a => a.participantId === participant.id && a.status === 'completed');
  if (completed) return res.json({ participant, attempt: completed, completed: true });
  let attempt = db.attempts.find(a => a.participantId === participant.id && a.status === 'in_progress');
  if (!attempt) {
    attempt = {
      id: db.nextAttemptId++,
      participantId: participant.id,
      startDate: new Date().toISOString(),
      endDate: null,
      correctCount: 0,
      score: 0,
      percent: 0,
      grade: 0,
      status: 'in_progress',
      answers: {},
      questionOrder: shuffle(QUESTIONS.map(q => q.id))
    };
    db.attempts.push(attempt);
    writeDB(db);
  }
  res.json({ participant, attempt, completed: false });
});

app.get('/api/questions/:attemptId', (req, res) => {
  const attemptId = parseInt(req.params.attemptId);
  const db = readDB();
  const attempt = db.attempts.find(a => a.id === attemptId);
  if (!attempt) return res.status(404).json({ error: 'Попытка не найдена' });
  const order = attempt.questionOrder || QUESTIONS.map(q => q.id);
  const questions = order.map(id => {
    const q = QUESTIONS.find(x => x.id === id);
    return { id: q.id, text: q.text, options: q.options };
  });
  res.json({ questions, answers: attempt.answers || {} });
});

app.post('/api/answer', (req, res) => {
  const { attemptId, questionId, answer } = req.body;
  const db = readDB();
  const attempt = db.attempts.find(a => a.id === attemptId);
  if (!attempt) return res.status(404).json({ error: 'Попытка не найдена' });
  if (attempt.status === 'completed') return res.status(400).json({ error: 'Попытка завершена' });
  attempt.answers[questionId] = answer;
  writeDB(db);
  res.json({ ok: true });
});

app.post('/api/finish', (req, res) => {
  const { attemptId } = req.body;
  const db = readDB();
  const attempt = db.attempts.find(a => a.id === attemptId);
  if (!attempt) return res.status(404).json({ error: 'Попытка не найдена' });
  if (attempt.status === 'completed') return res.status(400).json({ error: 'Попытка уже завершена' });
  let correct = 0;
  const total = QUESTIONS.length;
  for (const q of QUESTIONS) {
    if (attempt.answers[q.id] === q.correct) correct++;
  }
  const percent = Math.round((correct / total) * 100);
  let grade = 2;
  if (correct >= 27) grade = 5;
  else if (correct >= 21) grade = 4;
  else if (correct >= 15) grade = 3;
  attempt.correctCount = correct;
  attempt.score = correct;
  attempt.percent = percent;
  attempt.grade = grade;
  attempt.status = 'completed';
  attempt.endDate = new Date().toISOString();
  writeDB(db);
  const participant = db.participants.find(p => p.id === attempt.participantId);
  res.json({
    fio: participant.fio,
    correct,
    errors: total - correct,
    score: correct,
    total,
    percent,
    grade,
    endDate: attempt.endDate
  });
});

// ---------- Админ ----------
function checkAdmin(req, res, next) {
  const hash = req.headers['x-admin-hash'];
  if (hash !== ADMIN_PASSWORD_HASH) return res.status(401).json({ error: 'Неверный пароль' });
  next();
}

app.post('/api/admin/login', (req, res) => {
  const { password } = req.body;
  const hash = crypto.createHash('sha256').update(password).digest('hex');
  if (hash === ADMIN_PASSWORD_HASH) res.json({ ok: true, hash });
  else res.status(401).json({ error: 'Неверный пароль' });
});

app.get('/api/admin/results', checkAdmin, (req, res) => {
  const db = readDB();
  const results = db.attempts.map(a => {
    const p = db.participants.find(x => x.id === a.participantId) || {};
    return {
      id: a.id,
      participantId: a.participantId,
      fio: p.fio || '—',
      startDate: a.startDate,
      endDate: a.endDate,
      correctCount: a.correctCount,
      score: a.score,
      percent: a.percent,
      grade: a.grade,
      status: a.status === 'completed' ? 'завершено' : 'не завершено',
      answers: a.answers
    };
  });
  res.json(results);
});

app.post('/api/admin/reset', checkAdmin, (req, res) => {
  const { participantId } = req.body;
  const db = readDB();
  db.attempts = db.attempts.filter(a => a.participantId !== participantId);
  writeDB(db);
  res.json({ ok: true });
});

app.post('/api/admin/delete', checkAdmin, (req, res) => {
  const { attemptId } = req.body;
  const db = readDB();
  db.attempts = db.attempts.filter(a => a.id !== attemptId);
  writeDB(db);
  res.json({ ok: true });
});

app.get('/api/admin/export', checkAdmin, (req, res) => {
  const db = readDB();
  const rows = [['ФИО', 'Балл', 'Процент', 'Оценка', 'Дата завершения', 'Статус']];
  db.attempts.forEach(a => {
    const p = db.participants.find(x => x.id === a.participantId) || {};
    rows.push([
      p.fio || '',
      a.score,
      a.percent,
      a.grade,
      a.endDate ? new Date(a.endDate).toLocaleString('ru-RU') : '',
      a.status === 'completed' ? 'завершено' : 'не завершено'
    ]);
  });
  const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(';')).join('\n');
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', 'attachment; filename="results.csv"');
  res.send('\uFEFF' + csv);
});

// ---------- Запуск ----------
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Сервер запущен на порту ${PORT}`);
});