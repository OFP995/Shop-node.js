let cart = {};
document.querySelectorAll('.add-to-cart').forEach(function(element) {
    element.onclick = addToСart;
});

if (localStorage.getItem('cart')){  // если существут эта строка
    cart = JSON.parse(localStorage.getItem('cart')); // обновить и-ю о корзине
    ajaxGetGoodsInfo(); // отрисовать корзину
  }
  
function addToСart() {
    let goodsId= this.dataset.goods_id; // будет брать id элемента. dataset - обращение ко всем атрибутам data
    if (cart[goodsId]) {
        cart[goodsId]++;
    }
    else {
        cart[goodsId] = 1;
    }
    console.log(cart);
    ajaxGetGoodsInfo();
}

function ajaxGetGoodsInfo() { // запрос на сервер и получить id товара который лежит в корзине
    updateLocalStorageCart();
    fetch('/get-goods-info',{
        method: 'POST',
        body: JSON.stringify({key: Object.keys(cart)}), // вытащить ключи из массива, решается Object.keys(cart), это посылается через строку JSON 
        headers: { //чтобы правильно послать на сервер строку  JSON
            'Accept': 'application/json',
            'Content-Type': 'application/json'
        }
    })
    .then(function(response) {
        return response.text(); // чтобы после получения положительного ответа был возвращен body, иначе body внизу не будет получен
    })
    .then(function(body) {
        // console.log(body);
        showCart(JSON.parse(body));
    })
}

function showCart(data) {  //data - всё описание которое влетает
    let out = '<table class="table table-striped table-cart"><tbody>';
    let total = 0; // количество товаров в корзине
    for (let key in cart) {
        out +=`<tr><td colspan="4"><a href="/goods?id=${key}">${data[key]['name']}</a></tr>`; //colspan="4" Устанавливает число ячеек, которые должны быть объединены по горизонтали.
        out +=`<tr><td><i class="far fa-minus-square cart-minus" data-goods_id="${key}"></i></td>`; // знак минуса 
        out +=`<td>${cart[key]}</td>`; // количество товара в корзине
        out +=`<td><i class="far fa-plus-square cart-plus" data-goods_id="${key}"></i></td>`; // знак плюс 
        out += `<td>${data[key]['cost']*cart[key]} руб </td>`
        out +=`</tr>`; // всё в одну строку
        total += cart[key]*data[key]['cost'];
    }
    out += `<tr><td colspan="3">ВСЕГО:</td><td>${formatPrice(total)} руб</td></tr>` // обернули total в ф-ю округления числа
    out += '</tbody></table>';
    document.querySelector('#cart-nav').innerHTML = out; 
    document.querySelectorAll('.cart-minus').forEach(function(element){
        element.onclick = cartMinus;
    }); 
    document.querySelectorAll('.cart-plus').forEach(function(element){
        element.onclick = cartPlus;
    }); 
}
function cartPlus() {  // при нажатии на + получаем id нажатого элемента
    let goodsId = this.dataset.goods_id;
    cart[goodsId]++;
    ajaxGetGoodsInfo(); // обновление корзины
}

  

function cartMinus() {
    let goodsId = this.dataset.goods_id;
    if (cart[goodsId] -1 > 0) {
        cart[goodsId]--;
    }
    else {
        delete(cart[goodsId]);// удаление товара если его 0 в корзине при нажатии на минус
    }
    ajaxGetGoodsInfo();
}

function updateLocalStorageCart() {  // ф-я сохраняет состояние корзины в localStorage
    localStorage.setItem('cart',JSON.stringify(cart));
}

function formatPrice(price) {
    return price.toFixed(0).replace(/\d(?=(\d{3})+\.)/g, '$& '); //округление общей цены товара в корзине
}