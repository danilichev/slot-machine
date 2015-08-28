var slotMachine = function() {

  var CARD_HEIGHT = 72,
      CARDS_COUNT = 13,
      CARDS_IN_REEL_COUNT = 9,
      VISIBLE_CARDS_COUNT = 3,
      INVISIBLE_CARDS_COUNT = CARDS_IN_REEL_COUNT - VISIBLE_CARDS_COUNT,
      INITIAL_TOP_REEL_POSITION = -INVISIBLE_CARDS_COUNT * CARD_HEIGHT;
      //how much cards a reel shows per second
      DRAW_CARD_PER_SECOND = 20,
      //how much frames draw per second
      DRAW_FRAMES_PER_SECOND = 60,
      //shift a reel per frame in pixels
      SHIFT_REEL_PER_FRAME =
          CARD_HEIGHT * DRAW_CARD_PER_SECOND / DRAW_FRAMES_PER_SECOND,
      //minimum time of rolling reel in milliseconds
      RUNTIME = 3000,
      //delay between stopping reels in milliseconds
      DELAY = 1000;

  var vendorTransformPrefix = function() {
    var tmp = document.createElement('div'),
        arrayOfPrefixes = [
          'msTransform',
          'MozTransform',
          'WebkitTransform',
          'OTransform'],
        i;

    for (i = 0; i < arrayOfPrefixes.length; i++) {
      if (typeof tmp.style[arrayOfPrefixes[i]] != 'undefined')
        return arrayOfPrefixes[i];
      }

    return 'transform';
  }();

  var createCards = function() {
    var cards = [], i;
    for (i = 0; i < CARDS_COUNT; i++) {
      cards[i] = {};
      cards[i].id = '' + i;
    }
    return cards;
  }

  var reel = function(canvasId, cards, runtime) {
    var canvas = document.getElementById(canvasId);

    var getCanvas = function() {
      return canvas;
    }

    var runtime = runtime;

    var getRuntime = function() {
      return runtime;
    }

    //top position of a reel in pixels
    var top = INITIAL_TOP_REEL_POSITION;

    var getTop = function() {
      return top;
    }

    var setTop = function(y) {
      top = y;
    }

    var availableCards = cards,
        cardsKit = [];

    var addRandomCardsToKit = function() {
      var i;
      for (i = 0; i < INVISIBLE_CARDS_COUNT; i++) {
        cardsKit[i] = availableCards[Math.floor(Math.random() * CARDS_COUNT)];
      }
      for (i = INVISIBLE_CARDS_COUNT; i < CARDS_IN_REEL_COUNT; i++) {
        cardsKit[i] = cardsKit[i - INVISIBLE_CARDS_COUNT];
      }
    }

    var getCard = function(id) {
      return cardsKit[id];
    }

    var shift = function() {
      var y = top - INITIAL_TOP_REEL_POSITION;
      canvas.style[vendorTransformPrefix] = 'translate(0,' + y + 'px)';
    }

    var move = function() {
      if (!isActive()) return;

      if (top >= 0) {
        top = INITIAL_TOP_REEL_POSITION;
      } else {
        top += SHIFT_REEL_PER_FRAME;
      }

      shift();
    }

    var activeState = false;

    var isActive = function() {
      return activeState;
    }

    var changeState = function() {
        activeState ? activeState = false : activeState = true;
        checkPosition();
        redraw();
    }

    var checkPosition = function() {
      top = Math.floor(top / CARD_HEIGHT) * CARD_HEIGHT;
      shift();
    }

    var redraw = function() {
      var context = canvas.getContext('2d'),
          card, i;
      for (i = 0; i < CARDS_IN_REEL_COUNT; i++) {
        if (isActive()) {
          card = getCard(i).imgBlur;
        } else {
          card = getCard(i).img;
        }

        context.drawImage(card, 0, i * CARD_HEIGHT);
      }
    }

    addRandomCardsToKit();
    redraw();

    return {
      isActive: isActive,
      getRuntime: getRuntime,
      changeState: changeState,
      move: move
    }
  }

  var preloadImages = function(images, callback) {

    var imagesPath = 'img/cards/',
        blurredImagesPath = 'img/cards/blurred/',
        imagesExtension = '.png';

    var loadedImgsCount = 0;

    var preload = function(asset) {
      asset.img = new Image();
      asset.img.src = imagesPath + asset.id + imagesExtension;
      asset.imgBlur = new Image();
      asset.imgBlur.src = blurredImagesPath + asset.id + imagesExtension;

      asset.img.addEventListener('load', function() {
        check();
      }, false);

      asset.img.addEventListener('error', function(err) {
        check(err, asset.id);
      }, false);
    }

    var check = function(err, id) {
      if (err) {
        alert('Failed to load ' + id);
      }

      loadedImgsCount++;
      if (images.length === loadedImgsCount) {
        callback();
        return;
      }
    }

    images.forEach(function(asset) {
      preload(asset);
    });
  }

  var game = function() {
    var cards = createCards(),
        reels = [],
        reelsCanvasId = [
          'reel_0',
          'reel_1',
          'reel_2',
          'reel_3',
          'reel_4',
        ],
        initialTime,
        timer,
        runtime = RUNTIME * (reelsCanvasId.length - 1);

    var gameLoop = function() {
      setTimeout(function() {
        var currentTime = new Date().getTime();
        timer = currentTime - initialTime;

        if (timer <= runtime) {
          requestAnimationFrame(gameLoop);
          var i;
          for (i = 0; i < reels.length; i++) {
            reelMove(reels[i], timer);
          }
        }
      },
      1000 / DRAW_FRAMES_PER_SECOND);
    }

    var reelMove = function(reel, timer) {
      if (!reel.isActive()) return;
      if (reel.getRuntime() >= timer) {
        reel.move();
      } else {
        reel.changeState();
      }
    }

    var playButton = document.getElementById('play-button');
    playButton.addEventListener('click', function() {
      reels.forEach(function(item) {
        item.changeState();
      });
      initialTime = new Date().getTime();
      gameLoop();
    });

    preloadImages(cards, function() {
      var i;
      for (i = 0; i < reelsCanvasId.length; i++) {
        reels[i] = reel(reelsCanvasId[i], cards, RUNTIME + i * DELAY);
      }
    });
  }

  return {
    init: game
  }
}();
