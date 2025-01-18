const express = require('express');
const { Duvida, Aluno, Professor } = require('../db'); // Certifique-se de que os modelos estão importados corretamente
const router = express.Router();

// Rota para exibir todas as dúvidas
router.get('/forum-duvidas', async (req, res) => {
    try {
        // Verifique se Duvida foi corretamente importado
        const duvidas = await Duvida.findAll({
            include: [
                { model: Aluno, attributes: ['nome'] },
                { model: Professor, attributes: ['nome'] }
            ],
            order: [['dataCriacao', 'DESC']] // Ordena pelas mais recentes
        });

        // Verifique se há dúvidas para passar à view
        res.render('forum-duvidas', { duvidas });

    } catch (err) {
        console.log("Erro ao carregar o fórum de dúvidas:", err);
        res.status(500).send('Erro ao carregar o fórum de dúvidas');
    }
});

// Rota para exibir o formulário para criar uma nova dúvida
// Rota para exibir o formulário para criar uma nova dúvida
router.get('/forum-duvidas/novo', async (req, res) => {
    try {
        // Buscar alunos e professores no banco de dados
        const alunos = await Aluno.findAll();
        const professores = await Professor.findAll();
        
        // Passar os alunos e professores para o template
        res.render('nova-duvida', { alunos, professores });
    } catch (err) {
        console.log("Erro ao carregar o formulário de nova dúvida:", err);
        res.status(500).send('Erro ao carregar o formulário de nova dúvida');
    }
});


// Rota para criar uma nova dúvida
router.post('/forum-duvidas/criar', async (req, res) => {
    const { titulo, conteudo, tipoParticipacao, alunoId, professorId } = req.body;

    try {
        await Duvida.create({
            titulo,
            conteudo,
            tipoParticipacao,
            alunoId: tipoParticipacao === 'Aluno' ? alunoId : null,
            professorId: tipoParticipacao === 'Professor' ? professorId : null
        });

        res.redirect('/forum-duvidas');
    } catch (err) {
        console.log("Erro ao criar a dúvida:", err);
        res.status(500).send('Erro ao criar a dúvida');
    }
});

// Rota para exibir a página de uma dúvida específica
router.get('/forum-duvidas/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const duvida = await Duvida.findByPk(id, {
            include: [
                { model: Aluno, attributes: ['nome'] },
                { model: Professor, attributes: ['nome'] }
            ]
        });

        if (!duvida) {
            return res.status(404).send('Dúvida não encontrada');
        }

        res.render('ver-duvida', { duvida });
    } catch (err) {
        console.log("Erro ao carregar a dúvida:", err);
        res.status(500).send('Erro ao carregar a dúvida');
    }
});

// Rota para responder uma dúvida
router.post('/forum-duvidas/:id/responder', async (req, res) => {
    const { id } = req.params;
    const { resposta } = req.body;

    try {
        const duvida = await Duvida.findByPk(id);

        if (!duvida) {
            return res.status(404).send('Dúvida não encontrada');
        }

        duvida.resposta = resposta;
        await duvida.save();

        res.redirect(`/forum-duvidas/${id}`);
    } catch (err) {
        console.log("Erro ao responder a dúvida:", err);
        res.status(500).send('Erro ao responder a dúvida');
    }
});

// Rota para exibir o formulário para editar uma dúvida
router.get('/forum-duvidas/:id/editar', async (req, res) => {
    const { id } = req.params;

    try {
        const duvida = await Duvida.findByPk(id);
        
        if (!duvida) {
            return res.status(404).send('Dúvida não encontrada');
        }

        res.render('editar-duvida', { duvida });
    } catch (err) {
        console.log("Erro ao carregar a página de edição:", err);
        res.status(500).send('Erro ao carregar a página de edição');
    }
});

// Rota para editar uma dúvida
router.post('/forum-duvidas/:id/editar', async (req, res) => {
    const { id } = req.params;
    const { titulo, conteudo } = req.body;

    try {
        const duvida = await Duvida.findByPk(id);

        if (!duvida) {
            return res.status(404).send('Dúvida não encontrada');
        }

        duvida.titulo = titulo;
        duvida.conteudo = conteudo;
        await duvida.save();

        res.redirect(`/forum-duvidas/${id}`);
    } catch (err) {
        console.log("Erro ao editar a dúvida:", err);
        res.status(500).send('Erro ao editar a dúvida');
    }
});

module.exports = router;
