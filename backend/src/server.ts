import express from 'express';
import cors from 'cors';
import './db';
import { listContractors, listTimesheets, getTimesheet, createTimesheet, submitTimesheet, updateTimesheet } from './services/timesheets';
import { timesheetSchema, checkDates } from './validation';

const app = express();
app.set('etag', false);

app.use(cors({ origin: 'http://localhost:4200' }));
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ ok: true });
});

app.get('/api/contractors', (req, res) => {
  res.json(listContractors());
});

app.get('/api/timesheets', (req, res) => {
  const contractorId = Number(req.header('X-Contractor-Id') ?? 1);
  res.json(listTimesheets(contractorId));
});



app.get('/api/timesheets/:id', (req, res) => {
  const contractorId = Number(req.header('X-Contractor-Id') ?? 1);
  const sheet = getTimesheet(contractorId, Number(req.params.id));
  if (!sheet) return res.status(404).json({ message: 'Timesheet not found.' });
  res.json(sheet);
});


app.post('/api/timesheets', (req, res) => {
  const contractorId = Number(req.header('X-Contractor-Id') ?? 1);

  const parsed = timesheetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Please fix the highlighted fields.',
      errors: parsed.error.issues.map(i => i.message),
    });
  }

  const dateError = checkDates(parsed.data.weekEndingDate, parsed.data.entries);
  if (dateError) return res.status(400).json({ message: dateError });

  try {
    const id = createTimesheet(contractorId, parsed.data);
    return res.status(201).json(getTimesheet(contractorId, id));
    } catch (err: any) {
    
    const text = `${err?.code ?? ''} ${err?.message ?? ''}`;
    if (text.includes('UNIQUE constraint failed')) {
      return res.status(409).json({ message: 'A timesheet already exists for this week.' });
    }
    throw err;
  }
});


app.put('/api/timesheets/:id', (req, res) => {
  const contractorId = Number(req.header('X-Contractor-Id') ?? 1);
  const id = Number(req.params.id);

  const parsed = timesheetSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({
      message: 'Please fix the highlighted fields.',
      errors: parsed.error.issues.map(i => i.message),
    });
  }
  const dateError = checkDates(parsed.data.weekEndingDate, parsed.data.entries);
  if (dateError) return res.status(400).json({ message: dateError });

  const result = updateTimesheet(contractorId, id, parsed.data);
  if (result.error === 'notfound') return res.status(404).json({ message: 'Timesheet not found.' });
  if (result.error === 'locked') return res.status(409).json({ message: 'Submitted timesheets cannot be edited.' });

  res.json(getTimesheet(contractorId, id));
});

app.post('/api/timesheets/:id/submit', (req, res) => {
  const contractorId = Number(req.header('X-Contractor-Id') ?? 1);
  const id = Number(req.params.id);

  const result = submitTimesheet(contractorId, id);
  if (result.error === 'notfound') return res.status(404).json({ message: 'Timesheet not found.' });
  if (result.error === 'locked') return res.status(409).json({ message: 'This timesheet cannot be submitted.' });

  res.json(getTimesheet(contractorId, id));
});

app.listen(3000, () => console.log('API running on http://localhost:3000'));