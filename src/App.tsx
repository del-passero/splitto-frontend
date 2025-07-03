<button
  onClick={() => {
    console.log("tg = ", tg);
    if (tg) {
      tg.showAlert("Это Telegram WebApp!");
    } else {
      alert("Вы не в Telegram WebApp!!!");
    }
  }}
>
  Проверить ли Telegram API
</button>
