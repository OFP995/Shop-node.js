module.exports = function (req, res, con, next) { // доступ к ф-и из вне
    if (req.cookies.hash == undefined || req.cookies.id == undefined) { // если cookie нет то перенаправление
        res.redirect('/login');
        return false;
    }
    con.query(  // проверка cookie  из БД
        'SELECT * FROM user WHERE id="' + req.cookies.id+'"and hash="'+ req.cookies.hash+'"',
        function (error, result) {
            if (error) reject(error);
            // console.log(result);
            if (result.length == 0) {
                console.log('User not found');
                res.redirect('/login'); // перенаправление на стр login
            }
            else {
               next();  //выполняется ф-я на app.js
            }
        });

    
};
