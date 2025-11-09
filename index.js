// 1. Importa o Express
const express = require('express');
const cors = require('cors');
const { MongoClient } = require('mongodb');
// NÃO PRECISAMOS DE BCRYPT
// const bcrypt = require('bcrypt');

// 2. Define a Porta (Corrigido para o Render)
const app = express();
const PORTA = process.env.PORT || 3000;

// 3. CONFIGURAÇÃO DE MIDDLEWARE
app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. CONFIGURAÇÃO DO BANCO DE DADOS
// A "CHAVE SECRETA" (lida do Render)
const url = process.env.DATABASE_URL;
// O NOME DO NOSSO BANCO
const dbName = 'siteCasalDB';
// O CLIENTE (que vamos usar em cada rota)
const client = new MongoClient(url);

// ===================================================================
// ROTAS DE FILMES E FOTOS (Com a conexão fiável)
// ===================================================================
app.get('/api/filmes', async (req, res) => {
  console.log('Recebido pedido GET para /api/filmes');
  try {
    await client.connect(); // Conecta
    const db = client.db(dbName);
    const collection = db.collection('filmes');
    const filmes = await collection.find({}).toArray();
    res.json(filmes);
  } catch (err) { res.status(500).send('Erro ao buscar filmes'); } 
  // Nota: Não fechamos a conexão para manter simples
});
app.post('/api/filmes', async (req, res) => {
  const novoFilme = req.body;
  if (!novoFilme || !novoFilme.nome) { return res.status(400).send('Dados do filme incompletos.'); }
  try {
    await client.connect(); // Conecta
    const db = client.db(dbName);
    const collection = db.collection('filmes');
    const result = await collection.insertOne(novoFilme);
    res.status(201).json(result);
  } catch (err) { res.status(500).send('Erro ao salvar o filme'); }
});
app.get('/api/fotos', async (req, res) => {
  console.log('Recebido pedido GET para /api/fotos');
  try {
    await client.connect(); // Conecta
    const db = client.db(dbName);
    const collection = db.collection('fotos');
    const fotos = await collection.find({}).toArray();
    res.json(fotos);
  } catch (err) { res.status(500).send('Erro ao buscar fotos'); } 
});
app.post('/api/fotos', async (req, res) => {
  const novaFoto = req.body;
  if (!novaFoto || !novaFoto.imagemSrc) { return res.status(400).send('Dados da foto incompletos.'); }
  try {
    await client.connect(); // Conecta
    const db = client.db(dbName);
    const collection = db.collection('fotos');
    const result = await collection.insertOne(novaFoto);
    res.status(201).json(result);
  } catch (err) { res.status(500).send('Erro ao salvar a foto'); }
});
// ===================================================================

// ===================================================================
// 8. ✨ ROTA DE API PARA LOGIN (SEM HASH - TEXTO PURO)
//    (Verificando o utilizador 'TiagoLeticya' com Y)
// ===================================================================
app.post('/api/login', async (req, res) => {
    const { usuario, senha } = req.body;
    console.log(`(Login em Texto Puro) Recebida tentativa de login para: ${usuario}`);
    if (!usuario || !senha) {
        return res.status(400).json({ sucesso: false, mensagem: 'Usuário e senha são obrigatórios.' });
    }
    try {
        await client.connect(); // Conecta
        const db = client.db(dbName);
        const collection = db.collection('users');
        
        // 1. Encontra o usuário no banco de dados (procura pelo que o utilizador digitou)
        const usuarioNoDB = await collection.findOne({ usuario: usuario });

        if (!usuarioNoDB) {
            console.log(`Login falhou: Usuário '${usuario}' não encontrado.`);
            return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas' });
        }

        // 2. ✨ VERIFICAÇÃO SIMPLES (TEXTO PURO)
        // Compara a senha digitada com a senha salva no banco
        // E o utilizador digitado com o utilizador no banco (para ser exato)
        if (senha === usuarioNoDB.senha && usuario === usuarioNoDB.usuario) {
            console.log('Login sucesso! (Texto Puro)');
            res.status(200).json({ sucesso: true });
        } else {
            console.log(`Login falhou: Senha ou usuário incorretos (Texto Puro).`);
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

// 10. APENAS INICIA O SERVIDOR
// (Removemos a lógica de conexão "inteligente" daqui)
app.listen(PORTA, () => {
    console.log(`Servidor rodando na porta ${PORTA}`); 
});