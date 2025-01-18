const { Presenca, Aluno, Aula, Matricula, Disciplina } = require('../db'); // Certifique-se de que os modelos estão importados corretamente
const express = require('express');
const router = express.Router();

// Rota para listar todas as presenças
router.get('/presencas', async (req, res) => {
    const { disciplinaId } = req.query; // Recebe a disciplinaId da query string
    try {
        const disciplinas = await Disciplina.findAll(); // Carrega todas as disciplinas

        let presencas = [];
        let alunos = [];
        let aulas = [];

        if (disciplinaId) {
            // Se a disciplinaId for fornecida, carrega os dados relacionados àquela disciplina
            aulas = await Aula.findAll({ where: { disciplinaId } }); // Carrega as aulas da disciplina
            alunos = await Aluno.findAll({
                include: {
                    model: Matricula,
                    where: { disciplinaId } // Filtra os alunos pela disciplina
                }
            });
            presencas = await Presenca.findAll({
                include: [
                    { model: Aluno },
                    { model: Aula }
                ],
                where: {
                    '$Aula.disciplinaId$': disciplinaId
                }
            });
        }

        // Renderiza a visão de presenças com as disciplinas, alunos e aulas
        res.render('presenca', { presencas, disciplinas, alunos, aulas, disciplinaId });
    } catch (err) {
        console.log("Erro ao obter presenças:", err);
        res.status(500).send('Erro ao carregar presenças');
    }
});



// Rota para criar uma nova presença
router.post('/presencas/criar', async (req, res) => {
    const { alunoId, aulaId, presente, disciplinaId } = req.body;
    try {
        await Presenca.create({
            alunoId,
            aulaId,
            presente: presente === 'on',
        });
        res.redirect(`/presencas?disciplinaId=${disciplinaId}`);
    } catch (err) {
        console.log("Erro ao criar presença:", err);
        res.status(500).send('Erro ao criar presença');
    }
});


// Rota para editar uma presença
router.post('/presencas/editar', async (req, res) => {
    const { id, alunoId, aulaId, presente } = req.body;
    try {
        await Presenca.update({ alunoId, aulaId, presente: presente === 'on' }, { where: { id } });
        res.redirect('/presencas');
    } catch (err) {
        console.log("Erro ao editar presença:", err);
        res.status(500).send('Erro ao editar presença');
    }
});

// Rota para deletar uma presença
router.get('/presencas/deletar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Presenca.destroy({ where: { id } });
        res.redirect('/presencas');
    } catch (err) {
        console.log("Erro ao deletar presença:", err);
        res.status(500).send('Erro ao deletar presença');
    }
});

module.exports = router;
