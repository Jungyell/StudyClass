const express = require('express');
const bodyParser = require('body-parser');
const pdf = require('html-pdf');
const path = require('path');
const fs = require('fs');
const nunjucks = require('nunjucks');
const { sequelize } = require('./models');
const indexRouter = require('./routes');
const profilesRouter = require('./routes/profiles');

const app = express();

const PORT = process.env.PORT || 3000;
app.set('port', PORT);
app.set('view engine', 'html');

app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json({ limit: '50mb' }));

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
    const { title, content, chartType, chartImage } = req.body;

    const htmlTemplate = `
        <html>
        <head>
            <title>${title}</title>
            <style>
                body { font-family: Arial, sans-serif; padding: 20px; }
                h1 { color: #333; }
                p { color: #666; }
                img { max-width: 100%; height: auto; }
                .content { margin-bottom: 20px; }
            </style>
        </head>
        <body>
            <div class="content">
                <h1>${title}</h1>
                <p>${content}</p>
            </div>
            <div class="content">
                <img src="${chartImage}" alt="Chart Image">
            </div>
        </body>
        </html>
    `;

    const options = { format: 'A4' };

    pdf.create(htmlTemplate, options).toFile('./report.pdf', (err, result) => {
        if (err) {
            console.error('PDF 생성에 실패했습니다.', err);
            return res.status(500).send('PDF 생성에 실패했습니다.');
        } else {
            res.download(result.filename, 'report.pdf', (err) => {
                if (err) {
                    console.error('파일 다운로드에 실패했습니다.', err);
                    res.status(500).send('파일 다운로드에 실패했습니다.');
                } else {
                    // 파일 다운로드 후 서버에서 삭제
                    fs.unlink(result.filename, (err) => {
                        if (err) {
                            console.error('파일 삭제에 실패했습니다.', err);
                        }
                    });
                }
            });
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

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
