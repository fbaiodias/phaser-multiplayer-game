/* ************************************************
** GAME PLAYER CLASS
************************************************ */
var Player = function (startX, startY, team) {
  var x = startX;
  var y = startY;
  var id;
  var t = team;

  // Getters and setters
  var getX = function () {
    return x;
  };

  var getY = function () {
    return y;
  };

  var setX = function (newX) {
    x = newX;
  };

  var setY = function (newY) {
    y = newY;
  };

  var setTeam = function(team) {
    t = team;
  };

  var getTeam = function() {
    return t;
  }

  // Define which variables and methods can be accessed
  return {
    getX: getX,
    getY: getY,
    setX: setX,
    setY: setY,
    getTeam: getTeam,
    setTeam: setTeam,
    id: id
  };
}

// Export the Player class so you can use it in
// other files by using require("Player")
module.exports = Player
