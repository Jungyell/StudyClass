const express = require('express');    
const router = express.Router();

const { getTableList } = require('../models/index');    //db, createDynamicTable, sequelize, getTableList, dropTable 가져옴
//이중에서 DB 불러오기 기능만 사용

//이벤트 핸들러(테이블을 가져온다, 오류 발생시 에러 메시지 출력)
router.get('/', async (req,res)=>{
    //DB 불러오기 실행
    getTableList()
        //정상적 수행
        .then((tableList) => {
            //console.log('테이블 리스트:', tableList);
            res.render('index', {tableList});
        })

        //오류메시지
        .catch((error) => {
        console.error('테이블 리스트 조회 중 오류가 발생하였습니다:', error);
        });
});

module.exports = router;    //router(DB불러오기)기능 배포