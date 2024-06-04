const Sequelize = require('sequelize');

const env = process.env.NODE_ENV || 'development';
const config = require('../config/config')[env];
const db = {};

const sequelize = new Sequelize(config.database, config.username, config.password, config);


async function createTable(tableName){
    const Model = sequelize.define(
        tableName,
        {
            core : {
                type: Sequelize.STRING(20),
                allowNull : false,
            },
            task : {
                type: Sequelize.STRING(20),
                allowNull : false,
            },
            usaged : {
                type:Sequelize.INTEGER.UNSIGNED,
                allowNull:false,
            },
        },
        {
            sequelize,
            timestamps: false,
            underscored: false,
            modelName: 'Profile',
            tableName: tableName,
            paranoid: false,
            charset: 'utf8',
            collate: 'utf8_general_ci',
        }
    );

    await Model.sync();

    return Model;
}

async function dropTable(tableName) {
    try {
        await sequelize.query(`DROP TABLE IF EXISTS \`${tableName}\``);
        console.log(`테이블 '${tableName}'이(가) 삭제되었습니다.`);
    } catch (error) {
      console.error(`테이블 삭제 중 오류가 발생했습니다: ${error}`);
    }
}
  


async function createDynamicTable(profile){
    // console.log(profile);
    const tableName = profile[0][0];
    const DynamicModel = await createTable(tableName);

    let core_row = -1;
    for(let row = 1; row<profile.length; row++){
        if(core_row == -1){
            core_row = row;
            continue;
        }
        if(profile[row].length==1){
            core_row = -1;
            continue;
        }
        for(let column = 1; column < profile[row].length; column++){
            try{
            
            await DynamicModel.create({
                task: profile[core_row][column-1],
                core : profile[row][0],
                usaged : profile[row][column],
            });
            }catch(e){
                console.log(`Error: ${tableName} 파일 데이터 오류 발생`);
            }
        }
    }
}

async function getTableList() {
    const query = 'SHOW TABLES'; // 데이터베이스별로 조회 방식이 다를 수 있으므로 사용하는 데이터베이스에 맞는 쿼리를 사용
  
    // 쿼리 실행
    const [results, metadata] = await sequelize.query(query);
  
    // 테이블 목록 추출
    const tableList = results.map((result) => result.Tables_in_javaweb); // 'database'는 실제 사용하는 데이터베이스 이름으로 변경
  
    return tableList;
}


db.sequelize = sequelize;


module.exports = {db, createDynamicTable, sequelize, getTableList, dropTable};

