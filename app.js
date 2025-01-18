const express = require('express');
const bodyParser = require('body-parser');
const path = require('path');
const session = require('express-session');
const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;
const PDFDocument = require('pdfkit');
const { Aluno, Professor, Funcionario, Aula, Disciplina, Presenca, Matricula, Evento } = require('./db'); // Ajuste o caminho conforme o local do arquivo

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

            const alunosPresentes = aula.Presencas.filter(p => p.presente).map(p => p.Aluno.nome);
            const alunosAusentes = aula.Presencas.filter(p => !p.presente).map(p => p.Aluno.nome);

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
        const disciplina = await Disciplina.findByPk(disciplinaId, {
            include: [
                {
                    model: Matricula,
                    include: [{ model: Aluno, attributes: ['nome'] }]
                }
            ]
        });

        if (!disciplina) {
            return res.status(404).send('Disciplina não encontrada');
        }

        const doc = new PDFDocument();
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `inline; filename="relatorio_alunos_${disciplina.nome}.pdf"`);

        doc.pipe(res);
        doc.fontSize(18).text(`Relatório de Alunos Matriculados - Disciplina: ${disciplina.nome}`, { align: 'center' });
        doc.moveDown(2);

        const alunos = disciplina.Matriculas.map(matricula => matricula.Aluno.nome);
        doc.fontSize(12).text('Alunos Matriculados:', { underline: true });
        doc.fontSize(12).text(alunos.join(', ') || 'Nenhum aluno matriculado');

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

// Iniciando o servidor
app.listen(3000, () => {
    console.log("Servidor rodando na porta 3000...");
});
