// 1. Importa o Express
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
const bcrypt = require('bcrypt'); // (Ainda importamos, mas não usamos no login)

// 2. Define a Porta (Corrigido para o Render)
const app = express();
// Esta é a linha que obedece ao Render ou usa 3000 localmente
const PORTA = process.env.PORT || 3000;

// 3. CONFIGURAÇÃO DE MIDDLEWARE
app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. CONFIGURAÇÃO DO BANCO DE DADOS
// Esta é a linha que lê a sua "chave secreta" do Render
const url = process.env.DATABASE_URL;
const client = new MongoClient(url);
const dbName = 'siteCasalDB';
let dbClient; // Variável para guardar a conexão

// ===================================================================
// ROTAS DE FILMES E FOTOS (Sem alterações)
// ===================================================================
app.get('/api/filmes', async (req, res) => {
  console.log('Recebido pedido GET para /api/filmes');
  try {
    const db = dbClient.db(dbName);
    const collection = db.collection('filmes');
    const filmes = await collection.find({}).toArray();
    res.json(filmes);
  } catch (err) { res.status(500).send('Erro ao buscar filmes'); } 
});
app.post('/api/filmes', async (req, res) => {
  const novoFilme = req.body;
  if (!novoFilme || !novoFilme.nome) { return res.status(400).send('Dados do filme incompletos.'); }
  try {
    const db = dbClient.db(dbName);
    const collection = db.collection('filmes');
    const result = await collection.insertOne(novoFilme);
    res.status(201).json(result);
  } catch (err) { res.status(500).send('Erro ao salvar o filme'); }
});
app.get('/api/fotos', async (req, res) => {
  console.log('Recebido pedido GET para /api/fotos');
  try {
    const db = dbClient.db(dbName);
    const collection = db.collection('fotos');
    const fotos = await collection.find({}).toArray();
    res.json(fotos);
  } catch (err) { res.status(500).send('Erro ao buscar fotos'); } 
});
app.post('/api/fotos', async (req, res) => {
  const novaFoto = req.body;
  if (!novaFoto || !novaFoto.imagemSrc) { return res.status(400).send('Dados da foto incompletos.'); }
  try {
    const db = dbClient.db(dbName);
    const collection = db.collection('fotos');
    const result = await collection.insertOne(novaFoto);
    res.status(201).json(result);
  } catch (err) { res.status(500).send('Erro ao salvar a foto'); }
});
// ===================================================================

// ===================================================================
// 8. ✨ ROTA DE API PARA LOGIN (SIMPLIFICADA PARA TESTE)
// ===================================================================
app.post('/api/login', async (req, res) => {
    // Apanha apenas o utilizador. Ignoramos a senha.
    const { usuario } = req.body;
    console.log(`(TESTE SEM SENHA) Recebida tentativa de login para: ${usuario}`);

    if (!usuario) {
        return res.status(400).json({ sucesso: false, mensagem: 'Usuário é obrigatório.' });
    }

    try {
        const db = dbClient.db(dbName);
        const collection = db.collection('users');
        
        // 1. Encontra o usuário no banco de dados
        // Esta linha é dinâmica: ela procura o que quer que o utilizador tenha digitado
        const usuarioNoDB = await collection.findOne({ usuario: usuario });

        // 2. ✨ TESTE: Se o usuário foi encontrado, o login funciona!
        // Pulamos a verificação de senha (bcrypt.compare)
        if (usuarioNoDB) {
            console.log('TESTE DE DEBUG: Usuário encontrado! Login sucesso!');
            res.status(200).json({ sucesso: true });
        } else {
            console.log(`TESTE DE DEBUG: Usuário '${usuario}' não encontrado.`);
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

// 10. INICIA O SERVIDOR E CONECTA AO BANCO
// (Esta é a lógica de conexão otimizada)
client.connect()
  .then(() => {
    // Guarda a conexão para ser usada pelas rotas
    dbClient = client;
    // Só inicia o servidor DEPOIS de conectar ao banco
    app.listen(PORTA, () => {
      console.log(`Servidor rodando na porta ${PORTA}`); 
      console.log(`Conectado ao banco de dados: ${dbName}`);
    });
  })
  .catch(err => {
    console.error('Falha ao conectar ao banco de dados!', err);
    process.exit(1);
  });