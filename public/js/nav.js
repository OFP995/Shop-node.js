// console.log('nav.js');
// получение списка категорий

document.querySelector('.close-nav').onclick = closeNav;
document.querySelector('.show-nav').onclick = showNav;

function showNav () {
    document.querySelector('.site-nav').style.left = '0';
}
function closeNav () {
    document.querySelector('.site-nav').style.left = '-300px';
}

function getCategoryList() {
    fetch('/get-category-list',// AJAX запрос
        {
            method: 'POST'
        }
    ).then(function(response){  //чтобы не запустилась след ф-я ставим THEN(это промисы promiss). Когда получим ответ, то весь ответ засунем в ответ сервера response
        // console.log(response);    //эта ф-я для понимания процесса, он ничего не делает на сайте
        return response.text();
        }
    ).then(function(body){
        // console.log(body);
        showCategoryList(JSON.parse(body)); // преобразование строки в json
    })

}

function showCategoryList(data) {
    // console.log(data);
    let out = '<ul class="category-list"><li><a href="/">Главная</a></li>';
    for (let i=0; i < data.length; i++) {
        out +=`<li><a href="/cat?id=${data[i]['id']}">${data[i]['category']}</a></li>`;
    }
    out += '</ul>';
    document.querySelector('#category-list').innerHTML = out;
}
getCategoryList();