import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rotas from './routes';

const app = express();
const PORTA = process.env.PORT || 3001;

app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:5173' }));
app.use((req, res, next) => {
  if (req.originalUrl === '/api/stripe/webhook') {
    next();
  } else {
    express.json({ limit: '10mb' })(req, res, next);
  }
});

app.use('/api', rotas);

app.listen(PORTA, () => {
  console.log(`Servidor rodando na porta ${PORTA} | JOOBLE_KEY=${process.env.JOOBLE_API_KEY?.slice(0, 8)}…`);
});
