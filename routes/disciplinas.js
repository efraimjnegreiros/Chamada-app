const express = require('express');
const { Disciplina, Professor } = require('../db'); // Certifique-se de que os modelos estão importados corretamente
const router = express.Router();

// Rota para listar todas as disciplinas
// Rota para listar todas as disciplinas
router.get('/disciplinas', async (req, res) => {
    try {
        // Carregar as disciplinas e seus professores
        const disciplinas = await Disciplina.findAll({
            include: {
                model: Professor,  // Incluir o modelo Professor
                required: false  // Garantir que mesmo que não tenha professor, a disciplina ainda seja carregada
            }
        });
        const professores = await Professor.findAll(); // Buscar todos os professores
        res.render('disciplina', { disciplinas, professores }); // Passa as disciplinas e professores para a view
    } catch (err) {
        console.log("Erro ao obter disciplinas:", err);
        res.status(500).send('Erro ao carregar disciplinas');
    }
});


// Rota para criar uma nova disciplina
router.post('/disciplinas/criar', async (req, res) => {
    const { nome, professorId } = req.body; // Acessar os dados do formulário
    try {
        // Criar a nova disciplina associada ao professor
        await Disciplina.create({
            nome,
            professorId: professorId || null  // Se professorId não for fornecido, será null
        });
        res.redirect('/disciplinas'); // Redireciona para a lista de disciplinas
    } catch (err) {
        console.log("Erro ao criar disciplina:", err);
        res.status(500).send('Erro ao criar disciplina');
    }
});

// Rota para editar uma disciplina
router.post('/disciplinas/editar', async (req, res) => {
    const { id, nome, professorId } = req.body;
    try {
        // Atualiza a disciplina
        await Disciplina.update({ nome, professorId }, { where: { id } });
        res.redirect('/disciplinas');
    } catch (err) {
        console.log("Erro ao editar disciplina:", err);
        res.status(500).send('Erro ao editar disciplina');
    }
});

// Rota para deletar uma disciplina
router.get('/disciplinas/deletar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Disciplina.destroy({ where: { id } });
        res.redirect('/disciplinas');
    } catch (err) {
        console.log("Erro ao deletar disciplina:", err);
        res.status(500).send('Erro ao deletar disciplina');
    }
});

module.exports = router;
