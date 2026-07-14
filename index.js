require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORTA = process.env.PORT || 3000;

// Ligação ao banco de dados
const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false }
});

app.use(cors());
app.use(express.json());

// Rota de teste
app.get('/', (req, res) => {
  res.send('✅ Servidor FichaCerta funcionando e ligado ao banco!');
});

// Criar tabelas automaticamente
async function criarTabelas() {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS utilizadores (
        id SERIAL PRIMARY KEY,
        nome VARCHAR(100) NOT NULL,
        email VARCHAR(100) UNIQUE NOT NULL,
        senha VARCHAR(255) NOT NULL,
        criado_em TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE IF NOT EXISTS fichas (
        id SERIAL PRIMARY KEY,
        titulo VARCHAR(150) NOT NULL,
        descricao TEXT,
        categoria VARCHAR(50),
        data_criacao TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        utilizador_id INT REFERENCES utilizadores(id) ON DELETE CASCADE
      );
    `);

    console.log('✅ Tabelas prontas no banco!');
  } catch (erro) {
    console.error('❌ Erro nas tabelas:', erro);
  }
}

// Iniciar servidor
app.listen(PORTA, async () => {
  console.log(`🚀 Servidor na porta ${PORTA}`);
  await criarTabelas();
});
