const { Professor, Disciplina } = require('../db'); // Certifique-se de que os modelos estão importados corretamente
const express = require('express');
const router = express.Router();

// Rota para listar todos os professores
router.get('/professores', async (req, res) => {
    try {
        const professores = await Professor.findAll({ include: Disciplina }); // Carrega os professores e suas disciplinas
        const disciplinas = await Disciplina.findAll(); // Carrega todas as disciplinas
        res.render('professor', { professores, disciplinas });
    } catch (err) {
        console.log("Erro ao obter professores:", err);
        res.status(500).send('Erro ao carregar professores');
    }
});

// Rota para criar um novo professor
router.post('/professores/criar', async (req, res) => {
    const { nome, email, senha, disciplinaId } = req.body;
    try {
        // Se o campo disciplinaId estiver vazio, define como null
        const professor = await Professor.create({
            nome,
            email,
            senha,
            disciplinaId: disciplinaId || null  // A disciplina pode ser null se não for escolhida
        });
        res.redirect('/professores');
    } catch (err) {
        console.log("Erro ao criar professor:", err);
        res.status(500).send('Erro ao criar professor');
    }
});

// Rota para editar um professor
router.post('/professores/editar', async (req, res) => {
    const { id, nome, email, senha, disciplinaId } = req.body;
    try {
        await Professor.update({ nome, email, senha, disciplinaId }, { where: { id } });
        res.redirect('/professores');
    } catch (err) {
        console.log("Erro ao editar professor:", err);
        res.status(500).send('Erro ao editar professor');
    }
});

// Rota para deletar um professor
router.get('/professores/deletar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Professor.destroy({ where: { id } });
        res.redirect('/professores');
    } catch (err) {
        console.log("Erro ao deletar professor:", err);
        res.status(500).send('Erro ao deletar professor');
    }
});

module.exports = router;
