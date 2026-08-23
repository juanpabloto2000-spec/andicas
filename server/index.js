import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import wompiRoutes from './routes/wompiRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middlewares
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key'],
}));

app.use(express.json());

// Logging Middleware
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString('es-CO')}] ${req.method} ${req.url}`);
  next();
});

// Rutas API
app.use('/api/wompi', wompiRoutes);
app.use('/api/bookings', bookingRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.status(200).json({
    status: 'online',
    service: 'Andicas Bioparque Reservation & Wompi Payment Engine',
    timestamp: new Date().toISOString(),
  });
});

// Start Server
app.listen(PORT, () => {
  console.log('======================================================================');
  console.log(`🚀 [Backend Andicas] Servidor de Reservas y Wompi corriendo en puerto ${PORT}`);
  console.log(`🌐 Endpoint Health: http://localhost:${PORT}/api/health`);
  console.log('======================================================================');
});
