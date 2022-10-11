let express = require('express');
let app = express();  // новый экземпляр express
let cookieParser = require('cookie-parser');
let admin = require('./admin'); //экспоррт ф-и из файла
// pug для работы с HTML страницами, которая может выводить сложные блоки данных

app.use(express.static('public'));  // параметры для статики на сервере (папка где храниться статика(js,css,html))

// задаем шаблонизатор
app.set('view engine', 'pug');

// подключаем MYSQL модуль
let mysql = require('mysql');    // 1. подкл SQL

app.use(express.json()); // модуль для извлечения содержимого POST запроса
app.use(express.urlencoded()); // модуль чтобы получать чистые данные из POST
app.use(cookieParser()); // модуль чтобы подкл к cookie

const nodemailer = require('nodemailer');

let con = mysql.createConnection({ //переменная для работы с БД (2. настроили SQL)
    host: 'localhost',
    user: 'root',
    password: 'setfogQ123',
    database: 'market'
});

process.env["NODE_TLS_REJECT_UNAUTHORIZES"] = 0; // отключение локальной проверки авторизации при подкл SQL

app.listen(3000, function () {
    console.log('start server 3000');
});

app.use(function (req, res, next) {  // Функция промежуточной обработки.Имеющая доступ к объекту запроса (req), объекту ответа (res)и к следующей функции промежуточной обработки в цикле “запрос-ответ”  
    if (req.originalUrl == '/admin' || req.originalUrl == '/admin-order' ) { // если адрес совпадает то ф-я admin
        admin(req,res,con, next); 
    }
    else {
        next(); // что делает эта ф-я?
    }
  });



app.get('/', function (req, res) {
    let cat = new Promise(function(resolve,reject){
        con.query(  // 1 запрос. что будет выводиться на гл странице
            "select id,name, cost, image, category from (select id,name,cost,image,category, if(if(@curr_category != category, @curr_category := category, '') != '', @k := 0, @k := @k + 1) as ind   from goods, ( select @curr_category := '' ) v ) goods where ind < 3", // <3 -количество выбираемых товаров на гл странице
            function(error, result, fields) {
                if (error) return reject("error");
                resolve(result);
            }
        );
    })

    let catDescription = new Promise(function(resolve,reject){
        con.query(  // 1 запрос. что будет выводиться на гл странице
            "SELECT * FROM category", // выбрать всё из категории
            function(error, result, fields) {
                if (error) return reject("error");
                resolve(result);
            }
        );
    });
    Promise.all([cat,catDescription]).then (function(value){ //ждем пока все promise выполеяться, после чего выполнит ф-ю
        console.log(value[1]);
        res.render('index',{ // имя pug файла который будет рендериться, параметры в виде массива на данный файл
            goods: JSON.parse(JSON.stringify(value[0])),
            cat: JSON.parse(JSON.stringify(value[1])),
        });  
    }); 
});

app.get('/cat', function (req, res) {
    console.log(req.query.id);
    let catId = req.query.id;
    // res.render('cat', {});
     
    let cat = new Promise(function (resolve, reject) {   // интеграция ф-и в Promise
        con.query(
            'SELECT * FROM category WHERE id=' + catId,
            function (error, result) {
                if (error) reject("error");
                resolve(result); // если все хорошо то выполнить ф-ю resolve с нужным результатом
            });
    });

    let goods = new Promise(function (resolve, reject) {   // интеграция ф-и в Promise
        con.query(
            'SELECT * FROM goods WHERE category=' + catId,
            function (error, result) {
                if (error) reject(error);
                resolve(result); // если все хорошо то выполнить ф-ю resolve с нужным результатом
            });
    });

    //надо дождаться выполнение всех указанных Promise
    Promise.all ([cat,goods]).then(function(value){
        console.log(value[1]); // value[0] будет разрешать вывод 1го Promise - cat и там 1й товар
        res.render('cat', {
            cat: JSON.parse(JSON.stringify(value[0])),  //данные отдаются в render. описание категории полностью
            goods: JSON.parse(JSON.stringify(value[1])) //чтобы преобразовать это в обычный массив и работать с ним
        });
    })  

});

app.get('/goods', function (req, res) {
    // console.log(req.query.id);
    con.query('SELECT * FROM goods WHERE id='+req.query.id, function(error,result,fields) { //выбрать всё в таблице goods где id= введеному, если условие выполниться то анонимная ф-я
        if (error) throw error; // если ошибка то бросить err, если нет то рендер
        res.render('goods',{goods:JSON.parse(JSON.stringify(result))}); // двойное преобразование чтобы работать с выборкой как с массивом. рендерим стр. Принимает 1м имя файла в папке goods,2м переменные которые передать(массив)
     });
});    

app.get('/order', function (req, res) {
    res.render('order'); //
}); 

app.post('/get-category-list',function(req,res) { //в POST все параметры передаются внутри тела запроса
    // console.log(req.body);
    con.query('SELECT id, category FROM category', function(error,result,fields) { 
        if (error) throw error; 
        // console.log(result)
        res.json(result);  //метод преобразует наш ответ в json строку
     });
});

app.post('/get-goods-info',function(req,res) { //в POST все параметры передаются внутри тела запроса
    console.log(req.body.key); // для получения данных из post запроса писали в 13 строке - app.use(express.json());
    if (req.body.key.length !=0) {  // если в корзине есть хотя бы 1 товар
    con.query('SELECT id,name,cost FROM goods WHERE id IN ('+req.body.key.join(',')+')', function(error,result,fields) { //.join -ф-я которая позволяет слепить массив в строку
        if (error) throw error; 
        console.log(result);

        let goods = {};
        for (let i=0; i < result.length; i++) {
            goods[result[i]['id']] = result[i] // массив чтобы в консоле выводилось не 0,1,2.. по порядку, а номер товара по id
        }
        res.json(goods);  //метод преобразует наш ответ в json строку
     });
    }
    else { // если нет товаров в корзине, то послать 0
        res.send('0');
    }
});

app.post('/finish-order',function(req,res) {
    // console.log(req.body);
    if (req.body.key.length !=0) { //проверяем пустая ли корзина
        let key = Object.keys(req.body.key)  // получаем id товаров из БД
        con.query( 
            'SELECT id,name,cost FROM goods WHERE id IN ('+key.join(',')+')', function(error,result,fields) {
            if (error) throw error; 
            // console.log(result);
            sendMail(req.body, result).catch(console.error);  // отправка данных на почту.catch перехватчик событий
            saveOrder(req.body, result);
            res.send('1');    
        });    
    }
    else {  // если корзина пуста то ответ "0"
        res.send('0');
    }
}); 

app.get('/admin', function (req, res) {
    res.render('admin', {});// передача параметров в admin.js 
    }); 
        

app.get('/admin-order', function (req, res) {
    con.query(`SELECT 
    shop_order.id as id,
    shop_order.user_id as user_id,
    shop_order.goods_id as goods_id,
    shop_order.goods_cost as goods_cost,
    shop_order.goods_amount as goods_amount,
    shop_order.total as total,
    from_unixtime(date,"%Y-%m-%d %h:%m") as human_date,
    user_info.user_name as user,
    user_info.user_phone as phone,
    user_info.address as address
    FROM 
    shop_order
    LEFT JOIN
    user_info
    ON shop_order.user_id = user_info.id ORDER BY date DESC`, function(error,result,fields) { // запрос, выборка по дате в обратном порядке
    if (error) throw error; // если ошибка то бросить err, если нет то рендер
    // console.log(result);
    res.render('admin-order',{order:JSON.parse(JSON.stringify(result))}); // рендерим стр. Принимает 1м имя файла в папке goods,2м переменные которые передать(массив)
    });
}); // передача параметров в admin.js 
        
   
// Login form

app.get('/login', function (req, res) {
    res.render('login', {});
});

app.post('/login', function (req, res) {
    // console.log('========');
    // console.log(req.body);
    // console.log(req.body.login);
    // console.log(req.body.password);
    con.query(  // проверка логина пароля из БД
        'SELECT * FROM user WHERE login="' + req.body.login+'"and password="'+ req.body.password+'"',
        function (error, result) {
            if (error) reject(error);
            console.log(result);
            if (result.length == 0) {
                console.log('User not found');
                res.redirect('/login'); // перенаправление на стр login
            }
            else {
                result = JSON.parse(JSON.stringify(result)); // двойное преобразование чтобы работать с выборкой как с массивом
                // проверяем COOKIE чтобы понять залогинился ли пользователь
                let hash = makeHash(32); // ф-я для генератра длины cookie
                res.cookie('hash',hash);  // устанавливаем cookie
                res.cookie('id',result[0]['id']);  // в качестве cookie устанавливаем id пользователя их БД
                sql = "UPDATE user  SET hash='"+ hash +"' WHERE id="+result[0]['id']; // проверка данных в SQL и установка hash cookie в БД
                con.query(sql, function(error,resultQuery) { //выпоняем запрос
                    if (error) throw error; // если ошибка бросить исключение
                    res.redirect('/admin'); // перенаправление на стр админа
                });
            };
        });
});

function saveOrder(data,result) { //  data - и-я о пользователе,  result - ключи и кол-во заказов ((сведения о товаре))
    let sql = "INSERT INTO user_info (user_name, user_phone, user_email, address) VALUES ('"+data.username+"','"+data.phone+"','"+data.email+"','"+data.address+"')";
    con.query(sql, function(error,resultQuery) { //выпоняем запрос
        if (error) throw error; // если ошибка бросить исключение
        console.log('1 user info save'); // если норм то вывод и-и
        console.log(resultQuery); 
        let userId = resultQuery.insertId;  // получение id зарегистрированого User
        date = new Date()/1000; // время 
        for (let i=0; i < result.length; i++) {
            sql = "INSERT INTO shop_order (date, user_id, goods_id, goods_cost, goods_amount, total) VALUES ("+date+","+userId+","+result[i]['id']+","+result[i]['cost']+","+data.key[result[i]['id']]+","+data.key[result[i]['id']]*result[i]['cost']+")";
            con.query(sql,function(error,resultQuery){
                if (error) throw error;
                console.log("1 goods saved");
            })
        }
    });
}

async function sendMail(data,result) {
    let res = '<h2> Order in lite shop </h2>';
    let total = 0;
    for (let i=0; i < result.length; i++) {
        res += `<p>${result[i]['name']} - ${data.key[result[i]['id']]} - ${result[i]['cost']*data.key[result[i]['id']]} rub </p>`; // товар - количество товара - стоимость товара
        total += result[i]['cost']*data.key[result[i]['id']];
    }
    console.log(res);
    res += '<hr>';
    res += `Total ${total} rub`;
    res += `<hr> Phone: ${data.phone}`;
    res += `<hr> Username: ${data.username}`;
    res += `<hr> Adress: ${data.adress}`;
    res += `<hr> Email: ${data.email}`;

    // сервер отправки письма
    let testAccount = await nodemailer.createTestAccount();

    let transporter = nodemailer.createTransport({
        host: "smtp.ethereal.email",
        port: 587,
        secure: false, // true for 465, false for other ports
        auth: {
        user: testAccount.user, // generated ethereal user
        pass: testAccount.pass, // generated ethereal password
        },
    });
    let mailOption = {
        from : '<ofp995@mail.ru>',
        to : "<ofp995@mail.ru>," + data.mail,
        subject: "Lite shop order",
        text : 'Hello world',
        html : res
    };
    let info = await transporter.sendMail(mailOption); // отправка сообщения
    console.log("MessageSent: %s", info.messageId);
    console.log("PreviewSent: %s", nodemailer.getTestMessageUrl(info));
    return true;
}

function makeHash(length) {  // генератор cookie Hash
    var result           = '';
    var characters       = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    var charactersLength = characters.length;
    for ( var i = 0; i < length; i++ ) {
      result += characters.charAt(Math.floor(Math.random() * 
 charactersLength));
   }
   return result;
}

app.get('*', function (req, res){  // срабатывает при любом введеном адресе
    res.send('<h1 align="center"><font size="16">ОШИБКА<p></p>Страницы не существует</h1>', 404);
});