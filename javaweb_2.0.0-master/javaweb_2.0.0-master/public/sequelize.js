let fileName="";
let selete="";

const profileList = document.querySelectorAll('#profile_list tr td:first-child');
profileList.forEach((el) => {
    el.addEventListener('click', function () {
        fileName = el.textContent;
        profileList.forEach((otherEl) => {
            otherEl.style.setProperty("background-color", "white");
        });
        this.style.setProperty("background-color", "#888888");
        select = undefined;
        if (chart) {
            chart.destroy();
        }
        getdata();
    });
});

document.getElementById('profile_form').addEventListener('submit', async (e) => {
    e.preventDefault();
  
    const files = document.querySelector('#input_profile').files;
    let profiles = [];
    let is_error = false;
    if(!files){
        return alert('파일을 등록하세요');
    }
    const filePromises = Array.from(files).map((file) => {
        if (file.name.split(".").pop().toLowerCase() === 'txt') {
            return new Promise((resolve, reject) => {
                readTextFile(file, (data) => {
                    profiles.push(data);
                    resolve();
                });
            });
        } else {
            alert(".txt파일만 입력해주세요");
            is_error = true;
        }
    });

    await Promise.all(filePromises);

    if(!is_error){
        const response = await fetch('/profiles',{
            method: 'POST',
            headers: {
                'Content-Type' : 'application/json'
            },
            body: JSON.stringify(profiles)
        });

        if (response.ok) {
            response.json().then(data => {
                getList();
                alert(data.message);
            });
        } else {
            console.error('파일 전송 중 오류가 발생하였습니다.');
        }
    }
});

async function getList(){
    const res = await axios.get('profiles');
    const profiles = res.data;
    
    const tbody = document.querySelector('#profile_list tbody');
    tbody.innerHTML = '';
    profiles.map(function(profile){
        const row = document.createElement('tr');
        const td = document.createElement('td');
        td.textContent = profile;
        td.className= 'text-center fw-semibold';
        td.addEventListener('click',function(){
            fileName = profile;
            const profileList = document.querySelectorAll('#profile_list tr td:first-child');
            profileList.forEach((otherEl) => {
                otherEl.style.setProperty("background-color", "white");
            });
            this.style.setProperty("background-color", "#888888");
            if (chart) {
                chart.destroy();
            }
            getdata();
        });
        if(profile==fileName) td.style.setProperty("background-color", "#888888");
        row.appendChild(td);
        const td2 = document.createElement('td');
        const btndrop = document.createElement('button');
        btndrop.textContent="삭제";
        btndrop.className="btn btn-danger";
        btndrop.addEventListener('click',function(){ deleteTable(`${profile}`); });
        td2.appendChild(btndrop);
        row.appendChild(td2);
        
        tbody.appendChild(row);
    });
}

async function deleteTable(name){
    await axios.delete(`profiles/drop/${name}`);
    if(fileName==name && chart) {
        chart.destroy();
        const task_div = document.querySelector('#core');
        task_div.innerHTML="";
        const core_div = document.querySelector('#task');
        core_div.innerHTML = '';
        fileName = "";
    };
    setTimeout(getList,50);
}

async function getdata(){

    const res = await axios.get(`profiles/data/${fileName}`);
    const cores = res.data.cores;
    const tasks = res.data.tasks;

    const task_div = document.querySelector('#core');
    task_div.innerHTML = 'select core : ';
    tasks.map(function(task){
        let button = document.createElement('button');
        button.className = 'btn btn-info me-2';
        button.textContent = task.core;
        button.addEventListener('click', function(){
            updateChart('task', task.core);
            const coreDiv = document.getElementById('core');
            const coreBtns = coreDiv.getElementsByClassName('btn');
            for (let i = 0; i < coreBtns.length; i++) {
                coreBtns[i].className = "btn btn-info me-2";
            }
            const taskDiv = document.getElementById('task');
            const taskBtns = taskDiv.getElementsByClassName('btn');
            for (let i = 0; i < taskBtns.length; i++) {
                taskBtns[i].className = "btn btn-success me-2";
            }
            this.className = "btn btn-secondary me-2";
        });
        task_div.appendChild(button);
    });

    const core_div = document.querySelector('#task');
    core_div.innerHTML = 'select task : ';
    cores.map(function(core){
        let button = document.createElement('button');
        button.className = 'btn btn-success me-2';
        button.textContent = core.task;
        button.addEventListener('click', function(){
            updateChart('core', core.task);
            const coreDiv = document.getElementById('core');
            const coreBtns = coreDiv.getElementsByClassName('btn');
            for (let i = 0; i < coreBtns.length; i++) {
                coreBtns[i].className = "btn btn-info me-2";
            }
            const taskDiv = document.getElementById('task');
            const taskBtns = taskDiv.getElementsByClassName('btn');
            for (let i = 0; i < taskBtns.length; i++) {
                taskBtns[i].className = "btn btn-success me-2";
            }
            this.className = "btn btn-secondary me-2";
        });
        core_div.appendChild(button);
    });
    
}

function readTextFile(file, save) {
    const reader = new FileReader();
  
    reader.onload = async function(event) {
        const contents = event.target.result;
        let line_parse = contents.split("\n");
        const parse = [[file.name]];
        for(let i=0; i<line_parse.length; i++){
            parse.push(line_parse[i].trim().split(/\t| |,|\//));
        }
        save(parse);
    };

    reader.onerror = function(event){
        console.error("잘못된 파일");
    }

    reader.readAsText(file, 'UTF-8');

}

let chart;
let chart_type = 'line';
let labels = [];
let minData = [];
let maxData = [];
let avgData = [];

const btnline = document.getElementById('line');
const btnbar = document.getElementById('bar');
const btnpolarArea = document.getElementById('polarArea');

btnline.addEventListener('click', function () { 
    chart_type = 'line';
    btnline.className="btn btn-secondary"; btnbar.className="btn btn-primary"; btnpolarArea.className="btn btn-primary";
    if(fileName.length!=0) updateChart(null,null);
})
btnbar.addEventListener('click', function () {
    chart_type = 'bar';
    btnline.className="btn btn-primary"; btnbar.className="btn btn-secondary"; btnpolarArea.className="btn btn-primary";
    if(fileName.length!=0) updateChart(null,null);
});
btnpolarArea.addEventListener('click', function () {
    chart_type = 'polarArea';
    btnline.className="btn btn-primary"; btnbar.className="btn btn-primary"; btnpolarArea.className="btn btn-secondary";
    if(fileName.length!=0) updateChart(null,null);
 });

async function updateChart(type, choose_name){

    const profiler = document.getElementById('profiler').getContext('2d');
    if (chart) {
        chart.destroy();
    }

    if(type == 'core'){
        select = choose_name;
        const res = await axios.get(`profiles/taskdata/${fileName}/${select}`);
        const datas = res.data;

        labels = [];
        minData = [];
        maxData = [];
        avgData = [];
        datas.forEach((data) => {
            labels.push(data.core);
            minData.push(data.min_usaged);
            maxData.push(data.max_usaged);
            avgData.push(data.avg_usaged);
        });

    }else if(type == 'task'){
        select = choose_name;
        const res = await axios.get(`profiles/coredata/${fileName}/${select}`);
        const datas = res.data;

        labels = [];
        minData = [];
        maxData = [];
        avgData = [];
        datas.forEach((data) => {
            labels.push(data.task);
            minData.push(data.min_usaged);
            maxData.push(data.max_usaged);
            avgData.push(data.avg_usaged);
        });

    }
    if(fileName==undefined || select==undefined) return;

    chart = new Chart(profiler, {
        type: `${chart_type}`,
        data: {
          labels: labels,
          datasets: [{
            label: 'Min',
            data: minData,
            borderColor: 'rgba(0, 0, 255, 0.5)',
            backgroundColor: 'rgba(0, 0, 255, 0.5)',
          }, {
            label: 'Max',
            data: maxData,
            borderColor: 'rgba(255, 0, 0, 1)',
            backgroundColor: 'rgba(255, 0, 0, 0.5)',
          }, {
            label: 'Avg',
            data: avgData,
            borderColor: 'rgba(100, 255, 30, 1)',
            backgroundColor: 'rgba(100, 255, 30, 0.5)',
          }]
        },
        options: {
          maintainAspectRatio: false,
          scales: {
            y: {
              beginAtZero: true
            }
          },
          plugins: {
            title: {
              display: true,
              text: `${fileName}의 ${select} 정보`,
              font: {
                size: 30
              }
            }
          }
        },
    });
    
}

