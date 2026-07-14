require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');

const app = express();
const PORTA = process.env.PORT || 3000;

// Ligação ao banco
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

// Criação automática das tabelas
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

// 🚀 ROTA: Cadastrar utilizador
app.post('/cadastrar', async (req, res) => {
  try {
    const { nome, email, senha } = req.body;
    if (!nome || !email || !senha) {
      return res.status(400).json({ erro: 'Preenche nome, e-mail e senha!' });
    }
    const resultado = await pool.query(
      'INSERT INTO utilizadores (nome, email, senha) VALUES ($1, $2, $3) RETURNING id, nome, email, criado_em',
      [nome, email, senha]
    );
    res.status(201).json({ mensagem: '✅ Cadastro feito!', utilizador: resultado.rows[0] });
  } catch (erro) {
    if (erro.code === '23505') return res.status(409).json({ erro: '⚠️ E-mail já cadastrado!' });
    res.status(500).json({ erro: 'Erro: ' + erro.message });
  }
});

// 🚀 ROTA: Fazer login
app.post('/login', async (req, res) => {
  try {
    const { email, senha } = req.body;
    if (!email || !senha) return res.status(400).json({ erro: 'Preenche e-mail e senha!' });
    const resultado = await pool.query(
      'SELECT * FROM utilizadores WHERE email = $1 AND senha = $2',
      [email, senha]
    );
    if (resultado.rows.length === 0) return res.status(401).json({ erro: '❌ E-mail ou senha errados!' });
    res.json({ mensagem: '✅ Login feito!', utilizador: resultado.rows[0] });
  } catch (erro) {
    res.status(500).json({ erro: 'Erro: ' + erro.message });
  }
});

// Iniciar servidor
app.listen(PORTA, async () => {
  console.log(`🚀 Servidor rodando na porta ${PORTA}`);
  await criarTabelas();
});
