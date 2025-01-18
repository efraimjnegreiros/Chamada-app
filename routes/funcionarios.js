const { Funcionario } = require('../db');  // Certifique-se de que o caminho está correto
const express = require('express');
const router = express.Router();

// Rota para listar todos os funcionários
router.get('/funcionarios', async (req, res) => {
    try {
        const funcionarios = await Funcionario.findAll();  // Garantir que o modelo Funcionario está correto
        res.render('funcionarios', { funcionarios });
    } catch (err) {
        console.log("Erro ao obter funcionários:", err);
        res.status(500).send('Erro ao carregar funcionários');
    }
});

// Rota para criar um novo funcionário
router.post('/funcionarios/criar', async (req, res) => {
    const { nome, cargo, email, senha } = req.body;
    try {
        const funcionario = await Funcionario.create({ nome, cargo, email, senha });
        res.redirect('/funcionarios');
    } catch (err) {
        console.log("Erro ao criar funcionário:", err);
        res.status(500).send('Erro ao criar funcionário');
    }
});

// Rota para editar um funcionário
router.post('/funcionarios/editar', async (req, res) => {
    const { id, nome, cargo, email, senha } = req.body;
    try {
        await Funcionario.update({ nome, cargo, email, senha }, { where: { id } });
        res.redirect('/funcionarios');
    } catch (err) {
        console.log("Erro ao editar funcionário:", err);
        res.status(500).send('Erro ao editar funcionário');
    }
});

// Rota para deletar um funcionário
router.get('/funcionarios/deletar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Funcionario.destroy({ where: { id } });
        res.redirect('/funcionarios');
    } catch (err) {
        console.log("Erro ao deletar funcionário:", err);
        res.status(500).send('Erro ao deletar funcionário');
    }
});

module.exports = router;
