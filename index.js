// 1. Importa o Express
const express = require('express');
const cors = require('cors');
// ✨ MUDANÇA: Precisamos do ObjectId para apagar por ID
const { MongoClient, ObjectId } = require('mongodb'); 

// 2. Define a Porta
const app = express();
const PORTA = process.env.PORT || 3000;

// 3. CONFIGURAÇÃO DE MIDDLEWARE
app.use(cors()); 
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// 4. CONFIGURAÇÃO DO BANCO DE DADOS
const url = process.env.DATABASE_URL;
const dbName = 'siteCasalDB';
const client = new MongoClient(url);

// ===================================================================
// ROTAS DE FILMES (COM DELETE)
// ===================================================================
app.get('/api/filmes', async (req, res) => {
  console.log('Recebido pedido GET para /api/filmes');
  try {
    await client.connect(); 
    const db = client.db(dbName);
    const collection = db.collection('filmes');
    const filmes = await collection.find({}).toArray();
    res.json(filmes);
  } catch (err) { res.status(500).send('Erro ao buscar filmes'); } 
});
app.post('/api/filmes', async (req, res) => {
  const novoFilme = req.body;
  if (!novoFilme || !novoFilme.nome) { return res.status(400).send('Dados do filme incompletos.'); }
  try {
    await client.connect(); 
    const db = client.db(dbName);
    const collection = db.collection('filmes');
    const result = await collection.insertOne(novoFilme);
    res.status(201).json(result);
  } catch (err) { res.status(500).send('Erro ao salvar o filme'); }
});

// ===================================================================
// ✨ NOVA ROTA: DELETE /api/filmes/:id
// ===================================================================
app.delete('/api/filmes/:id', async (req, res) => {
    const idParaApagar = req.params.id; // Apanha o ID do link (ex: /api/filmes/12345)
    console.log(`Recebido pedido DELETE para filme: ${idParaApagar}`);
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('filmes');
        
        // Apaga o documento que tem este _id
        // (Usamos 'new ObjectId(id)' para converter o texto do ID para o formato do Mongo)
        const result = await collection.deleteOne({ _id: new ObjectId(idParaApagar) });

        if (result.deletedCount === 1) {
            res.status(200).json({ sucesso: true, mensagem: "Filme apagado" });
        } else {
            res.status(404).json({ sucesso: false, mensagem: "Filme não encontrado" });
        }
    } catch (err) {
        console.error("Erro ao apagar filme:", err);
        res.status(500).send('Erro ao apagar o filme');
    }
});
// ===================================================================

// ===================================================================
// ROTAS DE FOTOS (COM DELETE)
// ===================================================================
app.get('/api/fotos', async (req, res) => {
  console.log('Recebido pedido GET para /api/fotos');
  try {
    await client.connect();
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
    await client.connect();
    const db = client.db(dbName);
    const collection = db.collection('fotos');
    const result = await collection.insertOne(novaFoto);
    res.status(201).json(result);
  } catch (err) { res.status(500).send('Erro ao salvar a foto'); }
});

// ===================================================================
// ✨ NOVA ROTA: DELETE /api/fotos/:id
// ===================================================================
app.delete('/api/fotos/:id', async (req, res) => {
    const idParaApagar = req.params.id; // Apanha o ID do link
    console.log(`Recebido pedido DELETE para foto: ${idParaApagar}`);
    try {
        await client.connect();
        const db = client.db(dbName);
        const collection = db.collection('fotos');
        
        const result = await collection.deleteOne({ _id: new ObjectId(idParaApagar) });

        if (result.deletedCount === 1) {
            res.status(200).json({ sucesso: true, mensagem: "Foto apagada" });
        } else {
            res.status(404).json({ sucesso: false, mensagem: "Foto não encontrada" });
        }
    } catch (err) {
        console.error("Erro ao apagar foto:", err);
        res.status(500).send('Erro ao apagar a foto');
    }
});
// ===================================================================


// ===================================================================
// ROTA DE LOGIN (Sem Hash - Texto Puro)
// ===================================================================
app.post('/api/login', async (req, res) => {
    const { usuario, senha } = req.body;
    console.log(`(Login em Texto Puro) Recebida tentativa de login para: ${usuario}`);
    if (!usuario || !senha) {
        return res.status(400).json({ sucesso: false, mensagem: 'Usuário e senha são obrigatórios.' });
    }
    try {
        await client.connect(); 
        const db = client.db(dbName);
        const collection = db.collection('users');
        const usuarioNoDB = await collection.findOne({ usuario: usuario });

        if (!usuarioNoDB) {
            console.log(`Login falhou: Usuário '${usuario}' não encontrado.`);
            return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas' });
        }

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


// Rota "Olá, Mundo"
app.get('/', (req, res) => {
  res.send('O servidor back-end está no ar!');
});

// INICIA O SERVIDOR
app.listen(PORTA, () => {
    console.log(`Servidor rodando na porta ${PORTA}`); 
});