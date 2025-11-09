const express = require('express');
    const cors = require('cors');
    const { MongoClient } = require('mongodb');
    const bcrypt = require('bcrypt');
    
    const app = express();
    
    // ===================================================================
    // 1. CONFIGURAÇÃO DE MIDDLEWARE
    // ===================================================================
    app.use(cors()); 
    app.use(express.json({ limit: '50mb' }));
    app.use(express.urlencoded({ limit: '50mb', extended: true }));
    
    // ===================================================================
    // 2. CONFIGURAÇÃO DO BANCO DE DADOS
    // ===================================================================
    
    // ✨ MUDANÇA IMPORTANTE:
    // O servidor vai procurar uma "Variável de Ambiente" chamada DATABASE_URL.
    // Se não achar (quando rodamos no PC), ele usa a string do localhost.
    // É ASSIM que o Render vai nos dar a "chave" secreta.
    const url = process.env.DATABASE_URL || 'mongodb://localhost:27017';
    const client = new MongoClient(url);
    const dbName = 'siteCasalDB';
    
    // Variável para guardar a conexão com o banco (vamos reutilizá-la)
    let db;
    
    // ===================================================================
    // 3. FUNÇÃO PARA CONECTAR AO BANCO E INICIAR O SERVIDOR
    // ===================================================================
    async function startServer() {
      try {
        // Conecta ao MongoDB UMA SÓ VEZ
        await client.connect();
        db = client.db(dbName); // Armazena a conexão na variável global 'db'
        console.log(`Conectado ao banco de dados: ${dbName}`);
    
        // SÓ DEPOIS de conectar ao banco, o servidor começa a "ouvir"
        const PORTA = process.env.PORT || 3000;
        app.listen(PORTA, () => {
          console.log(`Servidor rodando na porta ${PORTA}`);
        });
    
      } catch (err) {
        console.error("Falha ao conectar ao banco de dados!", err);
        process.exit(1); // Encerra o app se não conseguir conectar
      }
    }
    
    // ===================================================================
    // 4. ROTAS DE API (Agora usam a variável 'db' em vez de conectar)
    // ===================================================================
    
    // Rota "Olá, Mundo"
    app.get('/', (req, res) => {
      res.send('O servidor back-end está no ar!');
    });
    
    // --- LOGIN ---
    app.post('/api/login', async (req, res) => {
      const { usuario, senha } = req.body;
      console.log(`Recebida tentativa de login para: ${usuario}`);
      try {
        const collection = db.collection('users');
        const usuarioNoDB = await collection.findOne({ usuario: usuario });
    
        if (!usuarioNoDB) {
          return res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas' });
        }
    
        const senhaCorreta = await bcrypt.compare(senha, usuarioNoDB.senhaHash);
        if (senhaCorreta) {
          res.status(200).json({ sucesso: true });
        } else {
          res.status(401).json({ sucesso: false, mensagem: 'Credenciais inválidas' });
        }
      } catch (err) {
        res.status(500).send('Erro no servidor durante o login');
      }
    });
    
    // --- FILMES ---
    app.get('/api/filmes', async (req, res) => {
      try {
        const collection = db.collection('filmes');
        const filmes = await collection.find({}).toArray();
        res.json(filmes);
      } catch (err) {
        res.status(500).send('Erro ao buscar filmes');
      } 
    });
    
    app.post('/api/filmes', async (req, res) => {
      const novoFilme = req.body;
      try {
        const collection = db.collection('filmes');
        const result = await collection.insertOne(novoFilme);
        res.status(201).json(result);
      } catch (err) {
        res.status(500).send('Erro ao salvar o filme');
      }
    });
    
    // --- FOTOS ---
    app.get('/api/fotos', async (req, res) => {
      try {
        const collection = db.collection('fotos');
        const fotos = await collection.find({}).toArray();
        res.json(fotos);
      } catch (err) {
        res.status(500).send('Erro ao buscar fotos');
      } 
    });
    
    app.post('/api/fotos', async (req, res) => {
      const novaFoto = req.body;
      try {
        const collection = db.collection('fotos');
        const result = await collection.insertOne(novaFoto);
        res.status(201).json(result);
      } catch (err) {
        res.status(500).send('Erro ao salvar a foto');
      }
    });
    
    // ===================================================================
    // 5. INICIA O SERVIDOR
    // ===================================================================
    startServer();