const { Reuniao, Pai } = require('../db'); // Importa os modelos Evento e Usuario
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
router.get('/reuniao', async (req, res) => {
    try {
        const reuniao = await Reuniao.findAll();
        console.log(reuniao);  // Verifique o que está sendo retornado
        res.render('reuniao', { reuniao });
    } catch (err) {
        console.log("Erro ao listar eventos:", err);
        res.status(500).send('Erro ao carregar eventos');
    }
});

// Rota para criar um novo evento
router.post('/reuniao/criar', async (req, res) => {
    try {
        const { titulo, pautas,  data, local } = req.body;

        // Criação do Evento
        const novaReuniao = await Reuniao.create({
            titulo,
            pautas,
            data,
            local
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
                subject: `Nova Reunião Agendada`,
                text: `Olá! Uma nova reunião foi agendada: ${titulo}\n\nPautas: ${pautas}\n\nData: ${data}\n\nLocal: ${local}\n\n\nContamos com a sua presença!`
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
        res.redirect('/reuniao');
    } catch (err) {
        console.error('Erro ao criar a reunião:', err);
        res.status(500).send('Erro ao criar a reunião');
    }
});

// Rota para editar um evento
router.post('/reuniao/editar', async (req, res) => {
    try {
        const { id, titulo, pautas, data, local } = req.body;

        // Atualiza o evento com os novos dados
        await Reuniao.update(
            { titulo, pautas, data, local },
            { where: { id } }
        );

        res.redirect('/reuniao');
    } catch (err) {
        console.error('Erro ao editar a reunião:', err);
        res.status(500).send('Erro ao editar a reunião');
    }
});

// Rota para deletar um evento
router.get('/reuniao/deletar/:id', async (req, res) => {
    const { id } = req.params;
    try {
        await Reuniao.destroy({ where: { id } });
        res.redirect('/reuniao');
    } catch (err) {
        console.log("Erro ao deletar reunião:", err);
        res.status(500).send('Erro ao deletar reunião');
    }
});

module.exports = router;
