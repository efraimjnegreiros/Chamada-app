const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const nodemailer = require('nodemailer'); // Importa o Nodemailer
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const PDFDocument = require('pdfkit');
const { Aluno, Professor, Funcionario, Aula, Disciplina, Presenca, Matricula, Evento, Reuniao } = require('./db'); // Ajuste o caminho conforme o local do arquivo

const app = express();

// Configuração do middleware de sessão
app.use(session({
    secret: 'seu-segredo', // Modifique para algo mais seguro em produção
    resave: false,
    saveUninitialized: true,
    cookie: { secure: false } // Defina como true se estiver usando HTTPS
}));

// Inicializando o Passport
app.use(passport.initialize());
app.use(passport.session());

// Configuração do Passport para autenticação local
passport.use(new LocalStrategy(
    async (email, senha, done) => {
        try {
            // Procurar pelo funcionário no banco de dados usando o e-mail
            const funcionario = await Funcionario.findOne({ where: { email } });
            if (!funcionario) {
                return done(null, false, { message: 'Funcionário não encontrado' });
            }

            // Verificar a senha (não use texto simples em produção, use hash de senha)
            if (funcionario.senha !== senha) {
                return done(null, false, { message: 'Senha incorreta' });
            }

            return done(null, funcionario); // Sucesso no login
        } catch (err) {
            return done(err);
        }
    }
));

// Serialização e desserialização de usuário
passport.serializeUser((funcionario, done) => {
    done(null, funcionario.id); // Armazenando o ID do funcionário na sessão
});

passport.deserializeUser(async (id, done) => {
    try {
        const funcionario = await Funcionario.findByPk(id);
        done(null, funcionario); // Retorna o objeto do funcionário
    } catch (err) {
        done(err);
    }
});

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // Usuário autenticado, continua para a próxima função
    } else {
        res.redirect('/login'); // Redireciona para o login se não autenticado
    }
}

// Middleware para garantir que o login não seja acessado se já estiver autenticado
// Middleware para garantir que o login não seja acessado se já estiver autenticado
function alreadyAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return res.redirect('/home'); // Se já estiver autenticado, redireciona para home
    }
    next(); // Se não estiver autenticado, continua para a próxima função (o que seria o login)
}

app.use(bodyParser.urlencoded({ extended: true }));
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Rota para login (GET)
app.get('/login', alreadyAuthenticated, (req, res) => {
    res.render('login'); // Exibe o formulário de login
});

// Rota para processar o login (POST)
app.post('/login', passport.authenticate('local', {
    successRedirect: '/home', // Redireciona para a página inicial após o login bem-sucedido
    failureRedirect: '/login', // Redireciona de volta para o login se a autenticação falhar
    failureFlash: true
}));

// Middleware para verificar se o usuário está autenticado
function isAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        return next(); // Usuário autenticado, continua para a próxima função
    } else {
        res.redirect('/login'); // Redireciona para o login se não autenticado
    }
}

// Rota para logoff
app.get('/logout', (req, res) => {
    req.logout((err) => {
        if (err) {
            return next(err);
        }
        res.redirect('/login'); // Redireciona de volta para o login após o logout
    });
});

// Rota para gerar o PDF com as aulas e os professores das aulas
app.get('/gerar-pdf-aulas-professores', isAuthenticated, async (req, res) => {
    try {
        const aulas = await Aula.findAll({
            include: [
                { model: Disciplina, attributes: ['nome'] },
                { model: Professor, attributes: ['nome'] }
            ]
        });

        if (!aulas || aulas.length === 0) {
            return res.status(404).send('Nenhuma aula encontrada.');
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="relatorio_aulas_professores.pdf"');

        doc.pipe(res);
        doc.fontSize(18).text('Relatório de Aulas e Professores', { align: 'center' });
        doc.moveDown(2);

        for (const aula of aulas) {
            doc.fontSize(14).text(`Aula: ${aula.titulo} - Disciplina: ${aula.Disciplina.nome}`, { underline: true });
            doc.moveDown(1);
            doc.fontSize(12).text(`Professor: ${aula.Professor.nome}`);
            doc.moveDown(2);
        }

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao gerar o PDF');
    }
});

// Rota para gerar o PDF de todas as aulas com os alunos presentes e ausentes
app.get('/gerar-pdf-todas-aulas', isAuthenticated, async (req, res) => {
    try {
        const aulas = await Aula.findAll({
            include: [
                { model: Disciplina, attributes: ['nome'] },
                { model: Presenca, include: [{ model: Aluno, attributes: ['nome'] }] }
            ]
        });

        if (!aulas || aulas.length === 0) {
            return res.status(404).send('Nenhuma aula encontrada.');
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="relatorio_aulas_presencas.pdf"');

        doc.pipe(res);
        doc.fontSize(18).text('Relatório de Presenças e Ausências - Todas as Aulas', { align: 'center' });
        doc.moveDown(2);

        for (const aula of aulas) {
            doc.fontSize(14).text(`Aula: ${aula.titulo} - Disciplina: ${aula.Disciplina.nome}`, { underline: true });
            doc.moveDown(1);

            // Verificar se a Presenca tem Aluno antes de acessar
            const alunosPresentes = aula.Presencas.filter(p => p.presente && p.Aluno).map(p => p.Aluno ? p.Aluno.nome : 'Aluno não encontrado');
            const alunosAusentes = aula.Presencas.filter(p => !p.presente && p.Aluno).map(p => p.Aluno ? p.Aluno.nome : 'Aluno não encontrado');

            doc.fontSize(12).text('Alunos Presentes:', { underline: true });
            doc.fontSize(12).text(alunosPresentes.join(', ') || 'Nenhum aluno presente');
            doc.moveDown(1);

            doc.fontSize(12).text('Alunos Ausentes:', { underline: true });
            doc.fontSize(12).text(alunosAusentes.join(', ') || 'Nenhum aluno ausente');
            doc.moveDown(2);
        }

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao gerar o PDF');
    }
});


// Rota para gerar o PDF com os alunos matriculados em uma disciplina
app.get('/gerar-pdf-alunos-disciplinas/:disciplinaId', isAuthenticated, async (req, res) => {
    const { disciplinaId } = req.params;
    try {
        // Procurando pela disciplina com o ID fornecido
        const disciplina = await Disciplina.findByPk(disciplinaId, {
            include: [
                {
                    model: Matricula, // Incluindo as matrículas associadas
                    include: [{ model: Aluno, attributes: ['nome'] }] // Incluindo o nome dos alunos
                }
            ]
        });

        // Verificando se a disciplina foi encontrada
        if (!disciplina) {
            return res.status(404).send('Disciplina não encontrada');
        }

        // Criando o documento PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="relatorio_alunos_${disciplina.nome}.pdf"`);

        doc.pipe(res);
        doc.fontSize(18).text(`Relatório de Alunos Matriculados - Disciplina: ${disciplina.nome}`, { align: 'center' });
        doc.moveDown(2);

        // Verificando se há matrículas associadas e mapeando os alunos
        if (disciplina.Matriculas && disciplina.Matriculas.length > 0) {
            const alunos = disciplina.Matriculas
                .filter(matricula => matricula.Aluno && matricula.Aluno.nome) // Filtrando matrículas com alunos válidos
                .map(matricula => matricula.Aluno.nome); // Acessando o nome do aluno

            // Caso existam alunos, exibe o nome de cada um no PDF
            doc.fontSize(12).text('Alunos Matriculados:', { underline: true });
            doc.fontSize(12).text(alunos.join(', ') || 'Nenhum aluno matriculado');
        } else {
            doc.fontSize(12).text('Nenhum aluno matriculado');
        }

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao gerar o PDF');
    }
});

// Rota para gerar o PDF com os eventos
app.get('/gerar-pdf-eventos', isAuthenticated, async (req, res) => {
    try {
        // Obtém todos os eventos do banco de dados
        const eventos = await Evento.findAll(); // Ajuste conforme a sua modelagem de banco de dados

        if (!eventos || eventos.length === 0) {
            return res.status(404).send('Nenhum evento encontrado.');
        }

        // Cria um novo documento PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="relatorio_eventos.pdf"');

        doc.pipe(res);
        doc.fontSize(18).text('Relatório de Eventos', { align: 'center' });
        doc.moveDown(2);

        // Loop através dos eventos e adicione-os ao PDF
        eventos.forEach(evento => {
            doc.fontSize(14).text(`Evento: ${evento.titulo}`, { underline: true });
            doc.moveDown(1);
            doc.fontSize(12).text(`Descrição: ${evento.descricao}`);
            doc.moveDown(2);
        });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao gerar o PDF');
    }
});

// Rota para gerar o PDF com as Reuniões
app.get('/gerar-pdf-reunioes', isAuthenticated, async (req, res) => {
    try {
        // Obtém todos os eventos do banco de dados
        const reunioes = await Reuniao.findAll(); // Ajuste conforme a sua modelagem de banco de dados

        if (!reunioes || reunioes.length === 0) {
            return res.status(404).send('Nenhum evento encontrado.');
        }

        // Cria um novo documento PDF
        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'inline; filename="relatorio_eventos.pdf"');

        doc.pipe(res);
        doc.fontSize(18).text('Relatório das Reuniões', { align: 'center' });
        doc.moveDown(2);

        // Loop através dos eventos e adicione-os ao PDF
        reunioes.forEach(reuniao => {
            doc.fontSize(14).text(`Evento: ${reuniao.titulo}`, { underline: true });
            doc.moveDown(1);
            doc.fontSize(12).text(`Pautas: ${reuniao.pautas}`);
            doc.moveDown(1);
            const data1 = new Date(reuniao.data);
            const dataFormatada = data1.toLocaleDateString('pt-BR'); // Formato 'dd/mm/aaaa'
            doc.fontSize(12).text(`Data: ${dataFormatada}`);
            doc.moveDown(1);
            doc.fontSize(12).text(`Local: ${reuniao.local}`);
            doc.moveDown(2);
        });

        doc.end();
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao gerar o PDF');
    }
});

// Página principal após o login
app.get('/home', isAuthenticated, async (req, res) => {
    try {
        const disciplinas = await Disciplina.findAll(); 
        res.render('home', { disciplinas });
    } catch (err) {
        console.error(err);
        res.status(500).send('Erro ao carregar a página inicial');
    }
});

const transporter = nodemailer.createTransport({
    service: 'gmail', // Usando o Gmail, você pode mudar se necessário
    auth: {
        user: 'efraimnegreiros2@gmail.com', // E-mail que vai enviar os alertas
        pass: 'xnnxjrddbijnrmwu'
        }
});

app.post('/recuperarSenha', async (req, res) => {  // Corrigido 'asyn' para 'async'
    const { email } = req.body;

    try {
        // Buscar o funcionário pelo e-mail
        const funcionario = await Funcionario.findOne({ where: { email } });
        if (!funcionario) {
            return res.status(404).json({ mensagem: 'Usuário não encontrado' });
        }

        // Gerar uma senha temporária ou lógica para alterar a senha
        // Por exemplo, concatenar id e e-mail não é uma boa prática, mas aqui vai o exemplo básico
        const novaSenha = `${funcionario.id}${funcionario.email}`;

        // Criptografando a nova senha
        // const senhaCriptografada = await bcrypt.hash(novaSenha, 10);

        // Atualizar a senha no banco
        funcionario.senha = novaSenha;
        await funcionario.save();  // Salvar a alteração no banco de dados
        const email1 = email; // Obtemos os e-mails dos pais
        if (email1.length > 0) {
            // Definir o conteúdo do e-mail
            const mailOptions = {
                from: 'efraimnegreiros2@gmail.com', // Endereço de envio
                to: email1, // E-mails dos pais
                subject: `Senha Alterada com Sucesso!`,
                text: `Sua nova senha, ${funcionario.nome}, é ${funcionario.senha}`
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
        // Retornar sucesso
        res.status(200).json({ mensagem: 'Senha alterada com sucesso' });
        
    } catch (error) {
        console.error(error);
        res.status(500).json({ mensagem: 'Erro ao processar a solicitação' });
    }
});


// Outras rotas do sistema
const alunosRoutes = require('./routes/alunos');
const professores = require('./routes/professores');
const presencas = require("./routes/presencas");
const disciplinas = require("./routes/disciplinas");
const aulas = require("./routes/aulas");
const funcionarios = require("./routes/funcionarios");
const matriculas = require("./routes/matriculas");
const duvidas = require("./routes/duvidas");
const pais = require("./routes/pais");
const eventos = require("./routes/eventos");
const reuniao = require("./routes/reuniao");


app.use('/', alunosRoutes, isAuthenticated);
app.use('/', professores, isAuthenticated);
app.use('/', presencas, isAuthenticated);
app.use('/', disciplinas, isAuthenticated);
app.use('/', aulas, isAuthenticated);
app.use('/', funcionarios, isAuthenticated);
app.use('/', matriculas, isAuthenticated);
app.use('/', duvidas, isAuthenticated);
app.use('/', pais, isAuthenticated);
app.use('/', eventos, isAuthenticated);
app.use('/', reuniao, isAuthenticated);

// Iniciando o servidor
app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000...");
});
