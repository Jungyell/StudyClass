const express = require('express');    //서버 구성 편리 모듈
const morgan = require('morgan');     //파일 입출력 도뮬
const path = require('path');    //경로설정 모듈
const nunjucks = require('nunjucks');    //HTML에서 템플릿 문법 사용(FOR문등 사용 가능)

const indexRouter = require('./routes');     //이벤트 감지-콜백 매핑 정보 저장
const profilesRouter = require('./routes/profiles');    //>
const {sequelize} = require('./models');    //?


const app = express();    //서버 초기화
app.set('port', process.env.PORT || 3000);    //포트번호 3000번 설정
app.set('view engine', 'html');    // html 읽기가능 설정

// 넌적스 템플릿 문법 사용 가능하기 위한 조치
nunjucks.configure('views',{
    express: app,    //express랑 넌적스가 함께 동작하게 설정함
    watch: true,    //템플릿 코드 변경시 새로고침해서 변경사항이 반영
});

// 시퀄라이즈 동기화로 작동(이거 작동 되기 전까지는 아무도 못움직임), DB 불러오는 과정 인듯
sequelize.sync({force : false})    //{force : false}: 기존 존재 테이블 삭제후 그 자리를 새 파일이 차지하게 설정
    .then(()=>{
        console.log('데이터베이스 연결 성공');
    })
    .catch((err)=>{
        console.error(err);
    })

//app.use(morgan('dev'));    //개발자용 morgan 모듈 장착(HTTP 활동 로그 남김)
app.use(express.static(path.join(__dirname,'public')));     //정적 파일 전달을 위해 사용(CSS, JS파일 제공하는데 쓰임)
app.use(express.json());    //JSON형식 요청 처리를 express 에서 하기 위해 사용함
app.use(express.urlencoded({extended: false}));    //URL 형식 요청 바디를 사용하기 위해 사용

app.use('/',indexRouter);    //메인페이지 진입시 기본적 라우팅('/' 경로 진입시, indexRouter 실행됨)
app.use('/profiles',profilesRouter);    //'/profiles' 경로 진입시, profilesRouter 실행됨

// 잘못된 URL 진입시 오류메시지 출력하는 부분
app.use((req,res,next)=>{
    const error = new Error(`${req.url}은 잘못된 주소입니다.`);
    error.status = 404;
    next(error);
});

//서버 문제 발생시 500번때 에러 status code 실행
app.use((err,req,res,next)=>{
    res.locals.message = err.message;
    res.status(err.status || 500);
    res.render('error');
});

//3000번 포트를 활용해 서버 가동!
app.listen(app.get('port'), () =>{
    console.log("http://localhost:"+app.get('port')+" server open");
});