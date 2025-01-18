const { Sequelize, DataTypes } = require('sequelize');

// Conexão com o banco de dados SQLite
const sequelize = new Sequelize({
    dialect: 'sqlite',
    storage: 'database.sqlite'
});

// Modelo de Aluno
const Aluno = sequelize.define('Aluno', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    senha: { type: DataTypes.STRING, allowNull: false }
});


// Modelo de Professor
const Professor = sequelize.define('Professor', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    senha: { type: DataTypes.STRING, allowNull: false }
});

// Modelo de Disciplina
const Disciplina = sequelize.define('Disciplina', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false }
});

// Modelo de Aula
const Aula = sequelize.define('Aula', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    titulo: { type: DataTypes.STRING, allowNull: false },
    data: { type: DataTypes.DATE, allowNull: false }
});

// Modelo de Presenca
const Presenca = sequelize.define('Presenca', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    presente: { type: DataTypes.BOOLEAN, allowNull: false }
});

// Relacionamento entre Aula, Professor e Disciplina

// Aula pertence a um Professor
Aula.belongsTo(Professor, { foreignKey: 'professorId' });
Professor.hasMany(Aula, { foreignKey: 'professorId' });  // Professor pode ter muitas Aulas

// Aula pertence a uma Disciplina
Aula.belongsTo(Disciplina, { foreignKey: 'disciplinaId' });
Disciplina.hasMany(Aula, { foreignKey: 'disciplinaId' });  // Disciplina pode ter muitas Aulas

// Relacionamento entre Disciplina e Professor
Disciplina.belongsTo(Professor, { foreignKey: 'professorId' });  // Relacionamento entre Professor e Disciplina
Professor.hasMany(Disciplina, { foreignKey: 'professorId' });    // Professor pode ensinar várias Disciplinas

// Relacionamento entre Presenca, Aluno e Aula
Presenca.belongsTo(Aluno, { foreignKey: 'alunoId' });
Aluno.hasMany(Presenca, { foreignKey: 'alunoId' });  // Aluno pode ter várias presenças

Presenca.belongsTo(Aula, { foreignKey: 'aulaId' });
Aula.hasMany(Presenca, { foreignKey: 'aulaId' });  // Aula pode ter várias presenças

// Modelo de Funcionario
const Funcionario = sequelize.define('Funcionario', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    cargo: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    senha: { type: DataTypes.STRING, allowNull: false }
});

// Modelo de Matricula
const Matricula = sequelize.define('Matricula', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true }
});

// Relacionamento entre Matrícula, Aluno e Disciplina
Matricula.belongsTo(Aluno, { foreignKey: 'alunoId' });
Aluno.hasMany(Matricula, { foreignKey: 'alunoId' });

Matricula.belongsTo(Disciplina, { foreignKey: 'disciplinaId' });
Disciplina.hasMany(Matricula, { foreignKey: 'disciplinaId' });

// Modelo de Dúvida
const Duvida = sequelize.define('Duvida', {
    titulo: { type: DataTypes.STRING, allowNull: false },
    conteudo: { type: DataTypes.TEXT, allowNull: false },
    tipoParticipacao: { type: DataTypes.ENUM('Aluno', 'Professor'), allowNull: false },
    resposta: { type: DataTypes.TEXT, allowNull: true },
    dataCriacao: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

// Relacionamentos da Dúvida

Duvida.belongsTo(Aluno, { foreignKey: 'alunoId', allowNull: true });
Aluno.hasMany(Duvida, { foreignKey: 'alunoId' });

Duvida.belongsTo(Professor, { foreignKey: 'professorId', allowNull: true });
Professor.hasMany(Duvida, { foreignKey: 'professorId' });

// Modelo de Pai
const Pai = sequelize.define('Pai', {
    id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    nome: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    senha: { type: DataTypes.STRING, allowNull: false },
    alunoId: { 
        type: DataTypes.INTEGER, 
        allowNull: true, 
        references: { model: 'Alunos', key: 'id' } // Associando Pai ao Aluno
    }
});


// Relacionamento entre Pai e Aluno (Um Pai pode ter vários Alunos)
// Relacionamento entre Pai e Aluno (Agora o Pai tem alunoId)
Pai.belongsTo(Aluno, { foreignKey: 'alunoId' });  // Pai tem um Aluno
Aluno.hasOne(Pai, { foreignKey: 'alunoId' });     // Aluno tem um Pai

// Modelo de Evento
const Evento = sequelize.define('Evento', {
    id: { 
        type: DataTypes.INTEGER, 
        primaryKey: true, 
        autoIncrement: true 
    },
    titulo: { 
        type: DataTypes.STRING, 
        allowNull: false 
    },
    descricao: { 
        type: DataTypes.TEXT, 
        allowNull: false 
    }
});



// Sincronizando o banco de dados e forçando a recriação das tabelas
sequelize.sync({ force: false })  // Use force: true para recriar as tabelas
    .then(() => {
        console.log("Banco de dados sincronizado com sucesso!");
    })
    .catch(err => {
        console.log("Erro ao sincronizar o banco de dados:", err);
    });

// Exportando os modelos
module.exports = { sequelize, Aluno, Professor, Disciplina, Aula, Presenca, Funcionario, Matricula, Duvida, Pai, Evento };
