const express = require('express');
const { Aula, Professor, Disciplina } = require('../db'); // Certifique-se de que os modelos estão importados corretamente
const router = express.Router();

// Rota para listar todas as aulas
router.get('/aulas', async (req, res) => {
    try {
        // Carregar as aulas com seus respectivos professores e disciplinas
        const aulas = await Aula.findAll({
            include: [
                { model: Professor, required: true },  // Incluir o modelo Professor
                { model: Disciplina, required: true }  // Incluir o modelo Disciplina
            ]
        });
        const professores = await Professor.findAll(); // Buscar todos os professores
        const disciplinas = await Disciplina.findAll(); // Buscar todas as disciplinas
        res.render('aula', { aulas, professores, disciplinas }); // Passa as aulas, professores e disciplinas para a view
    } catch (err) {
        console.log("Erro ao obter aulas:", err);
        res.status(500).send('Erro ao carregar aulas');
    }
});

// Rota para criar uma nova aula
router.post('/aulas/criar', async (req, res) => {
    const { titulo, data, professorId, disciplinaId } = req.body; // Acessar os dados do formulário
    try {
        // Criar a nova aula associada ao professor e à disciplina
        await Aula.create({
            titulo,
            data,
            professorId,
            disciplinaId
        });
        res.redirect('/aulas'); // Redireciona para a lista de aulas
    } catch (err) {
        console.log("Erro ao criar aula:", err);
        res.status(500).send('Erro ao criar aula');
    }
});

// Rota para editar uma aula
router.post('/aulas/editar', async (req, res) => {
    const { id, titulo, data, professorId, disciplinaId } = req.body;
    try {
        // Atualiza a aula
        await Aula.update({ titulo, data, professorId, disciplinaId }, { where: { id } });
        res.redirect('/aulas');
    } catch (err) {
        console.log("Erro ao editar aula:", err);
        res.status(500).send('Erro ao editar aula');
    }
});

// Rota para deletar uma aula
router.get('/aulas/deletar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Aula.destroy({ where: { id } });
        res.redirect('/aulas');
    } catch (err) {
        console.log("Erro ao deletar aula:", err);
        res.status(500).send('Erro ao deletar aula');
    }
});

module.exports = router;
