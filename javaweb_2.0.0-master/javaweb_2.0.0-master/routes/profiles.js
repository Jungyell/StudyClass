const express = require('express');    //express 서버 구성 
const router = express.Router();    //라우팅을 위한 객체 생성
const { createDynamicTable, getTableList, sequelize, dropTable } = require('../models/index');//?
const profile_model = require('../models/profile');//?

// 메인 페이지에서, POST(생성)요청시 처리(input 파일 파싱하는 부분)
router.post('/', async (req, res) => {
    const profiles = req.body;    //클라이언트요청문으로 보내는 body정보 가져옴(input 파일 내용 가져오는거, 어느정도 정제된 input 파일, 3차원 배열 형태임)
    let count = 0;
    //console.log(profiles, '프로파일 입니다~~~~~~~~~~');
    try {
        const tableList = await getTableList();    //DB 테이블 불러오기 기능
    
    for (let file_num = 0; file_num < profiles.length; file_num++) {    
        profiles[file_num][0][0] = profiles[file_num][0][0].toLowerCase().slice(0,-4);    //소문자로 core,task명 전부 바꾸고, 파일 확장자 제거
        
        // 이미 존재하는 Table이면 넘기는 처리를 하는 부분
        if (tableList.includes(profiles[file_num][0][0])) {
          console.log("이미 존재하는 파일입니다");
          continue;
        }

        await createDynamicTable(profiles[file_num]);    //동적 테이블을 생성(Core,Task의 갯수에 따라서)
        count++;
    }   
        //count는 몇개의 input 파일을 처리했는지를 의미한다.(input 파일 여러개 처리 가능함)
        if(count===0){
            res.json({ status: 'success', message: `저장 가능한 파일이 존재하지 않습니다.` });
        }else if(count==profiles.length){
            res.json({ status: 'success', message: `${count}개의 프로파일이 정상적으로 저장되었습니다.` });
        }else{
            res.json({ status: 'success', message: `중복된 이름의 파일을 제외한 ${count}개의 프로파일이 저장되었습니다.` });
        }

        
        // 오류 발생시 처리
    } catch (error) {
        console.error('오류가 발생하였습니다:', error);
        res.json({ status: 'error', message: '오류가 발생하였습니다.' });
    }
});

// DB에서 table 목록 전체를 불러오고, Json 문서 형식으로 변환해서 응답하는 부분
router.get('/', async (req,res)=>{
    const tableList = await getTableList();
    res.json(tableList);
});

// 해당 테이블 명을 가진 Table을 호출하는 부분이다.(해당 inputfile을 클릭시, 불러오는 부분)
router.get('/data/:tableName', async (req,res)=>{
    try{
        const {tableName} = req.params;

        const tableList = await getTableList();    //1개의 테이블을 조회
        
        // 해당 table이 db에 존재하지 않으면, 오류 처리
        if(!tableList.includes(tableName)){
            return res.status(404).json({error:'존재하지 않는 파일입니다.'});
        }
        
        // 해당 table 모델을 초기화한다.
        profile_model.initiate(sequelize, tableName);

        // 테이블의 모든 데이터를 가져와서, datas에 저장함
        const datas = await profile_model.findAll();
        
        // task 기준 core처리 현황을 불러옴(
        const tasks = await profile_model.findAll({
            attributes: [sequelize.fn('DISTINCT', sequelize.col('core')), 'core'],
        });

        // core 기준 task처리 현황을 불러옴
        const cores = await profile_model.findAll({
            attributes: [sequelize.fn('DISTINCT', sequelize.col('task')), 'task'],
        });
        
        // json 문서 형태로 응답(모든 데이터, core기준 task데이터, task기준 core데이터)
        res.json({datas: datas, cores : cores, tasks : tasks});
    }catch(error){    // 오류 발생시
        console.error('데이터 조회 오류', error);
    }
});

// 해당 테이블을 삭제하는 기능 
router.delete('/drop/:tableName', async(req,res)=>{
    try{
        const {tableName} = req.params;
        dropTable(tableName);    // 클릭시 테이블 삭제하는 기능
        res.json({state:'success'});
    }catch(error){
        res.json({state:'error'});
    }
});

// CORE 기준으로 TASK그래프 표기시 사용하는 데이터 가공처리(평균, 최소, 최대)실행후 반환
router.get('/coredata/:tableName/:core', async(req,res)=>{

    const { tableName, core } = req.params;    //테이블명, core정보 가져옴

    profile_model.initiate(sequelize, tableName);    //해당 모델 초기화(데이터 담길 빈박스 가져옴)

    const data = await profile_model.findAll({
        attributes: [
          'task',
          [sequelize.fn('max', sequelize.col('usaged')), 'max_usaged'],
          [sequelize.fn('min', sequelize.col('usaged')), 'min_usaged'],
          [sequelize.fn('avg', sequelize.col('usaged')), 'avg_usaged']
        ],
        where: {
          core: core
        },
        group: ['task']
      });

    res.json(data);
});


// TASK 기준으로 CORE그래프 표기시 사용하는 데이터 가공처리(평균, 최소, 최대)실행후 반환
router.get('/taskdata/:tableName/:task', async(req,res)=>{
    const { tableName, task } = req.params;

    profile_model.initiate(sequelize, tableName);


    const data = await profile_model.findAll({
        attributes: [
          'core',
          [sequelize.fn('max', sequelize.col('usaged')), 'max_usaged'],
          [sequelize.fn('min', sequelize.col('usaged')), 'min_usaged'],
          [sequelize.fn('avg', sequelize.col('usaged')), 'avg_usaged']
        ],
        where: {
          task: task,
        },
        group: ['core']
      });

    res.json(data);
});


module.exports = router;    //이벤트 핸들링 처리지침이 담겨있는 router를 배포함