const { Evento, Pai } = require('../db'); // Importa os modelos Evento e Usuario
const express = require('express');
const nodemailer = require('nodemailer'); // Importa o Nodemailer
const router = express.Router();

// Configuração do transporte para enviar o e-mail
const transporter = nodemailer.createTransport({
    service: 'gmail', // Usando o Gmail, você pode mudar se necessário
    auth: {
        user: 'efraimnegreiros2@gmail.com', // E-mail que vai enviar os alertas
        pass: 'xnnxjrddbijnrmwu'
        }
});

// Rota para listar os eventos
router.get('/eventos', async (req, res) => {
    try {
        const eventos = await Evento.findAll();
        console.log(eventos);  // Verifique o que está sendo retornado
        res.render('eventos', { eventos });
    } catch (err) {
        console.log("Erro ao listar eventos:", err);
        res.status(500).send('Erro ao carregar eventos');
    }
});

// Rota para criar um novo evento
router.post('/eventos/criar', async (req, res) => {
    try {
        const { titulo, descricao } = req.body;

        // Criação do Evento
        const novoEvento = await Evento.create({
            titulo,
            descricao
        });

        // Obter todos os pais (considerando que você tem um campo 'tipo' no banco)
        const pais = await Pai.findAll();

        // Preparar o e-mail para enviar
        const emailList = pais.map(pai => pai.email); // Obtemos os e-mails dos pais

        if (emailList.length > 0) {
            // Definir o conteúdo do e-mail
            const mailOptions = {
                from: 'efraimnegreiros2@gmail.com', // Endereço de envio
                to: emailList, // E-mails dos pais
                subject: 'Novo Evento Criado',
                text: `Olá! Um novo evento foi criado: ${titulo}\n\nDescrição: ${descricao}`
            };

            // Enviar o e-mail
            transporter.sendMail(mailOptions, (error, info) => {
                if (error) {
                    console.log('Erro ao enviar o e-mail:', error);
                } else {
                    console.log('E-mail enviado: ' + info.response);
                }
            });
        }

        // Redireciona para a página de eventos
        res.redirect('/eventos');
    } catch (err) {
        console.error('Erro ao criar o evento:', err);
        res.status(500).send('Erro ao criar o evento');
    }
});

// Rota para editar um evento
router.post('/eventos/editar', async (req, res) => {
    try {
        const { id, titulo, descricao } = req.body;

        // Atualiza o evento com os novos dados
        await Evento.update(
            { titulo, descricao },
            { where: { id } }
        );

        res.redirect('/eventos');
    } catch (err) {
        console.error('Erro ao editar o evento:', err);
        res.status(500).send('Erro ao editar o evento');
    }
});

// Rota para deletar um evento
router.get('/eventos/deletar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Evento.destroy({ where: { id } });
        res.redirect('/eventos');
    } catch (err) {
        console.log("Erro ao deletar evento:", err);
        res.status(500).send('Erro ao deletar evento');
    }
});

module.exports = router;
