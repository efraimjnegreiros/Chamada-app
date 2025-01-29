const { sequelize, Aluno, Disciplina, Matricula } = require('../db'); // Importa sequelize e os modelos necessários
const express = require('express');
const router = express.Router();

// Rota para listar todas as matrículas
router.get('/matriculas', async (req, res) => {
    try {
        // Buscar as matrículas e incluir os dados de Aluno e Disciplina
        const matriculas = await Matricula.findAll({
            include: [
                { model: Aluno, attributes: ['nome'] }, // Nome do aluno
                { model: Disciplina, attributes: ['nome'] } // Nome da disciplina
            ]
        });

        // Carregar todos os alunos e disciplinas
        const alunos = await Aluno.findAll();
        const disciplinas = await Disciplina.findAll();

        // Renderizar a página passando os dados
        res.render('matricula', { matriculas, alunos, disciplinas });
    } catch (err) {
        console.log("Erro ao obter matrículas:", err);
        res.status(500).send('Erro ao carregar matrículas');
    }
});


// Rota para criar uma nova matrícula
router.post('/matriculas/criar', async (req, res) => {
    const { alunoId, disciplinaId } = req.body;
    try {
        // Criando a matrícula
        await Matricula.create({ alunoId, disciplinaId });
        res.redirect('/matriculas');
    } catch (err) {
        console.log("Erro ao criar matrícula:", err);
        res.status(500).send('Erro ao criar matrícula');
    }
});

// Rota para deletar uma matrícula
router.get('/matriculas/deletar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        // Deletando a matrícula
        await Matricula.destroy({ where: { id } });
        res.redirect('/matriculas');
    } catch (err) {
        console.log("Erro ao deletar matrícula:", err);
        res.status(500).send('Erro ao deletar matrícula');
    }
});

module.exports = router;
