// 1. Importa o Express
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt');

// ===================================================================
// ✨ MUDANÇA IMPORTANTE (A CORREÇÃO)
// ===================================================================
// Diz ao servidor para usar a porta que o Render (process.env.PORT) 
// lhe der, OU usar a 3000 se estiver a rodar no seu PC (localhost).
const app = express();
const PORTA = process.env.PORT || 3000; // <--- ESTA É A CORREÇÃO

// 4. CONFIGURAÇÃO DE MIDDLEWARE
app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ===================================================================
// 5. CONFIGURAÇÃO DO BANCO DE DADOS
// ===================================================================
// Vamos ler a "Chave Secreta" que está no Render
const url = process.env.DATABASE_URL;
const client = new MongoClient(url);
const dbName = 'siteCasalDB';

let dbClient; // Variável para guardar a conexão

// ===================================================================
// 6. ROTAS DE API PARA FILMES
// ===================================================================
app.get('/api/filmes', async (req, res) => {
  console.log('Recebido pedido GET para /api/filmes');
  try {
    const db = dbClient.db(dbName);
    const collection = db.collection('filmes');
    const filmes = await collection.find({}).toArray();
    res.json(filmes);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao buscar filmes');
  } 
});

app.post('/api/filmes', async (req, res) => {
  const novoFilme = req.body;
  console.log('Recebido pedido POST para /api/filmes');
  if (!novoFilme || !novoFilme.nome) {
    return res.status(400).send('Dados do filme incompletos.');
  }
  try {
    const db = dbClient.db(dbName);
    const collection = db.collection('filmes');
    const result = await collection.insertOne(novoFilme);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao salvar o filme');
  }
});

// ===================================================================
// 7. ROTAS DE API PARA FOTOS
// ===================================================================
app.get('/api/fotos', async (req, res) => {
  console.log('Recebido pedido GET para /api/fotos');
  try {
    const db = dbClient.db(dbName);
    const collection = db.collection('fotos');
    const fotos = await collection.find({}).toArray();
    res.json(fotos);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao buscar fotos');
  } 
});

app.post('/api/fotos', async (req, res) => {
  const novaFoto = req.body;
  console.log('Recebido pedido POST para /api/fotos');
  if (!novaFoto || !novaFoto.imagemSrc) {
    return res.status(400).send('Dados da foto incompletos.');
  }
  try {
    const db = dbClient.db(dbName);
    const collection = db.collection('fotos');
    const result = await collection.insertOne(novaFoto);
    res.status(201).json(result);
  } catch (err) {
    console.error(err);
    res.status(500).send('Erro ao salvar a foto');
  }
});

// ===================================================================
// 8. ROTA DE API PARA LOGIN
// ===================================================================
app.post('/api/login', async (req, res) => {
    const { usuario, senha } = req.body;
    console.log(`Recebida tentativa de login para: ${usuario}`);

    if (!usuario || !senha) {
        return res.status(400).json({ sucesso: false, mensagem: 'Usuário e senha são obrigatórios.' });
    }

    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('users');
        const usuarioNoDB = await collection.findOne({ usuario: usuario });

        if (!usuarioNoDB) {
            console.log('Login falhou: Usuário não encontrado');
            return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas' });
        }

        const senhaCorreta = await bcrypt.compare(senha, usuarioNoDB.senhaHash);

        if (senhaCorreta) {
            console.log('Login sucesso!');
            res.status(200).json({ sucesso: true });
        } else {
            console.log('Login falhou: Senha incorreta');
            res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas' });
        }

    } catch (err) {
        console.error(err);
        res.status(500).send('Erro no servidor durante o login');
    }
});

// 9. Rota "Olá, Mundo"
app.get('/', (req, res) => {
  res.send('O servidor back-end está no ar!');
});

// ===================================================================
// 10. INICIA O SERVIDOR E CONECTA AO BANCO
// ===================================================================
// Tenta conectar ao banco de dados PRIMEIRO
client.connect()
  .then(() => {
    // Se conectar, armazena a conexão
    dbClient = client;
    
    // SÓ ENTÃO liga o servidor
    app.listen(PORTA, () => {
      // Agora o log vai mostrar a porta 10000 no Render!
      console.log(`Servidor rodando na porta ${PORTA}`); 
      console.log(`Conectado ao banco de dados: ${dbName}`);
    });
  })
  .catch(err => {
    // Se a conexão com o banco falhar, o servidor nem liga
    console.error('Falha ao conectar ao banco de dados!', err);
    process.exit(1);
  });