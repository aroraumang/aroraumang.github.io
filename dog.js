// Sets the home page dog's mood from the visitor's own clock: asleep at
// night, playful the rest of the day. Nothing is sent anywhere.
// Add ?dog=sleepy or ?dog=playful to the URL to see a mood on demand.
(function () {
  var dog = document.querySelector(".dog");
  if (!dog) return;

  var forced = new URLSearchParams(location.search).get("dog");

  function update() {
    if (forced === "sleepy" || forced === "playful") {
      dog.dataset.mood = forced;
      return;
    }
    var hour = new Date().getHours();
    dog.dataset.mood = hour >= 22 || hour < 7 ? "sleepy" : "playful";
  }

  update();
  // A page left open overnight should notice bedtime.
  setInterval(update, 60 * 1000);
})();
