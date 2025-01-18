// routes/alunos.js
const express = require('express');
const { Aluno } = require('../db');
const router = express.Router();

// Rota para listar todos os alunos
router.get('/alunos', async (req, res) => {
    try {
        const alunos = await Aluno.findAll();
        res.render('aluno', { usuarios: alunos });
    } catch (err) {
        console.log("Erro ao obter alunos:", err);
        res.status(500).send('Erro ao carregar alunos');
    }
});

// Rota para criar um novo aluno
router.post('/criar-usuario', async (req, res) => {
    const { nome, email, senha } = req.body;
    try {
        await Aluno.create({ nome, email, senha });
        res.redirect('/alunos');
    } catch (err) {
        console.log("Erro ao criar aluno:", err);
        res.status(500).send('Erro ao criar aluno');
    }
});

// Rota para editar um aluno
router.post('/editar-usuario', async (req, res) => {
    const { id, nome, email, senha } = req.body;
    try {
        await Aluno.update({ nome, email, senha }, { where: { id } });
        res.redirect('/alunos');
    } catch (err) {
        console.log("Erro ao editar aluno:", err);
        res.status(500).send('Erro ao editar aluno');
    }
});

// Rota para deletar um aluno
router.get('/deletar-usuario/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Aluno.destroy({ where: { id } });
        res.redirect('/alunos');
    } catch (err) {
        console.log("Erro ao deletar aluno:", err);
        res.status(500).send('Erro ao deletar aluno');
    }
});

module.exports = router;
