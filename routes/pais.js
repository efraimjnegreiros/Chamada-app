const { Pai, Aluno } = require('../db'); // Importa o modelo Pai e Aluno
const express = require('express');
const router = express.Router();

// Rota para listar todos os pais
router.get('/pais', async (req, res) => {
    try {
        const pais = await Pai.findAll({
            include: Aluno // Inclui os alunos associados aos pais
        });
        const alunos = await Aluno.findAll(); // Busca todos os alunos para uso no formulário
        res.render('pais', { pais, alunos }); // Renderiza a view 'pais', passando pais e alunos
    } catch (err) {
        console.log("Erro ao listar pais:", err);
        res.status(500).send('Erro ao carregar pais');
    }
});

// Rota para mostrar o formulário de criação de novo pai
router.get('/pais/criar', async (req, res) => {
    try {
        const alunos = await Aluno.findAll(); // Busca todos os alunos
        res.render('pais', { alunos }); // Passa os alunos para o formulário de criação
    } catch (err) {
        console.log("Erro ao carregar alunos:", err);
        res.status(500).send('Erro ao carregar alunos');
    }
});

// Rota para criar um novo pai
router.post('/pais/criar', async (req, res) => {
    try {
        const { nome, email, senha, alunoId } = req.body;
        
        // Criação do Pai com alunoId associado
        const pai = await Pai.create({
            nome,
            email,
            senha,
            alunoId: parseInt(alunoId) // Associando o aluno ao pai
        });

        res.redirect('/pais'); // Redirecionar para a lista de pais
    } catch (err) {
        console.error('Erro ao criar o pai:', err);
        res.status(500).send('Erro ao criar o pai');
    }
});



// Rota para mostrar o formulário de edição de um pai (modal)
router.get('/pais/editar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        const pai = await Pai.findByPk(id, { include: Aluno }); // Busca o pai e seu aluno associado
        const alunos = await Aluno.findAll(); // Obtém todos os alunos
        if (pai) {
            // Renderiza a mesma página com os dados do pai para edição
            res.render('pais', { pais: [pai], alunos, editar: true }); // Passa os dados para edição na mesma view
        } else {
            res.status(404).send('Pai não encontrado');
        }
    } catch (err) {
        console.log("Erro ao buscar pai:", err);
        res.status(500).send('Erro ao carregar dados do pai');
    }
});

// Rota para atualizar os dados de um pai
router.post('/pais/editar/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { nome, email, alunoId } = req.body;
        
        // Atualiza o Pai com o alunoId
        await Pai.update(
            { nome, email, alunoId: parseInt(alunoId) }, // Atualiza o nome, email e alunoId
            { where: { id } } // Identifica o Pai a ser atualizado pelo id
        );

        res.redirect('/pais'); // Redirecionar após a atualização
    } catch (err) {
        console.error('Erro ao editar o pai:', err);
        res.status(500).send('Erro ao editar o pai');
    }
});


// Rota para deletar um pai
router.get('/pais/deletar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Pai.destroy({ where: { id } });
        res.redirect('/pais'); // Redireciona após excluir o pai
    } catch (err) {
        console.log("Erro ao deletar pai:", err);
        res.status(500).send('Erro ao deletar pai');
    }
});

module.exports = router;
