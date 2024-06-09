const express = require('express');
const bodyParser = require('body-parser');
const pdf = require('html-pdf');
const path = require('path');
const nunjucks = require('nunjucks');
const { sequelize } = require('./models');
const indexRouter = require('./routes');
const profilesRouter = require('./routes/profiles');

const app = express();

app.set('port', process.env.PORT || 3000);
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(express.static(path.join(__dirname, 'public')));

nunjucks.configure('views', {
    express: app,
    watch: true,
});

sequelize.sync({ force: false })
    .then(() => {
        console.log('데이터베이스 연결 성공');
    })
    .catch((err) => {
        console.error(err);
    });

app.use('/', indexRouter);
app.use('/profiles', profilesRouter);

app.post('/export', (req, res) => {
    const { title, content } = req.body;

    const htmlTemplate = `
        <html>
        <head>
            <title>${title}</title>
            <link rel="stylesheet" type="text/css" href="styles.css">
        </head>
        <body>
            <h1>${title}</h1>
            <p>${content}</p>
        </body>
        </html>
    `;

    pdf.create(htmlTemplate).toBuffer((err, buffer) => {
        if (err) {
            console.error('PDF 생성에 실패했습니다.', err);
            res.status(500).send('PDF 생성에 실패했습니다.');
        } else {
            res.status(200).json({ fileUrl: 'data:application/pdf;base64,' + buffer.toString('base64') });
        }
    });
});

app.use((req, res, next) => {
    const error = new Error(`${req.url}은 잘못된 주소입니다.`);
    error.status = 404;
    next(error);
});

app.use((err, req, res, next) => {
    res.locals.message = err.message;
    res.status(err.status || 500);
    res.render('error');
});

app.listen(app.get('port'), () => {
    console.log("http://localhost:" + app.get('port') + " server open");
});
