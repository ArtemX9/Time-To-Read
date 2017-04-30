'use strict';

var visible = document.visibilityState === 'visible';

function minutesToHrs(minutes) {
  var roundedMinutes = Math.round(minutes);

  if (roundedMinutes <= 1) {
    return 'About a minute.';
  }

  if (roundedMinutes >= 60) {
    var hours = Math.trunc(roundedMinutes / 60);
    var mins  = roundedMinutes % 60;

    if (mins.toString().length === 1) { // if there is only 1 digit, for e.g. 6 should be 06 minutes and 1:06 instead of 1:6
      mins = 0 + mins.toString();
    }
    var timeText = hours === 1 ? ' hour' : ' hours';
    return mins !== 0 ? hours + ':' + mins + timeText : hours + timeText;
  }
  return roundedMinutes + ' mins.';
}

function createReadingTimeElement(timeToRead) {
  var p = document.createElement('reading-time');
  p.className = 'Reading-elapsed-time';
  p.innerText = timeToRead;

  p.onmouseover = function () {
    this.textContent = 'Close';
  };

  p.onmouseout = function () {
    this.textContent = timeToRead;
  };

  p.onclick = function () {
    document.body.removeChild(p);
  };

  return p;
}

function getWordsInArticle(articleContent) {
  var splittedIntoWords = articleContent.split(' ');

  return splittedIntoWords.filter(function(word) {
    if (word !== ('' || '\n' || '\r' || '\t')) {
      return word;
    }
  });
}

function getArticle() {
  var loc = document.location;
  var uri = {
    spec : loc.href,
    host : loc.host,
    prePath : loc.protocol + '//' + loc.host,
    scheme : loc.protocol.substr(0, loc.protocol.indexOf(':')),
    pathBase : loc.protocol + '//' + loc.host + loc.pathname.substr(0, loc.pathname.lastIndexOf('/') + 1)
  };

  return new Readability(uri, document.cloneNode(true)).parse();
}

function timeToRead(articleContent, wpm) {
  var wordsArray = getWordsInArticle(articleContent);
  var numberOfWords = wordsArray.length;
  var minutesToRead = numberOfWords / wpm;
  return minutesToHrs(minutesToRead);
}

function render() {
  var wpm = 60;
  var insideIFrame = (window.self !== window.top) || window.frameElement !== null;

  if (!insideIFrame) {
    safari.self.tab.dispatchMessage('getWMP');

    var article = getArticle();

    var onWpmValueReceived = function onWpmValueReceived (msgEvent) {
      switch (msgEvent.name) {
        case 'wmpValue':
          wpm = msgEvent.message;
          document.body.appendChild(createReadingTimeElement(timeToRead(article.textContent, wpm)));
          break;
        case 'wmpUpdated':
          wpm = msgEvent.message;
          var p = document.getElementsByTagName('reading-time')[0];
          p.innerText = timeToRead(article.textContent, wpm);
          break;
        default:
          break;
      }
    };

    if (article) {
      safari.self.addEventListener('message', onWpmValueReceived, false);
    }
  }
}

if (visible) {
  render();
}

function onVisibilityChange() {
  if (document.visibilityState === 'visible' && visible === false) { // we need check for visibile, so we don't rerender page on each opening event
    visible = true;
    render();
  }
}

document.addEventListener('visibilitychange', onVisibilityChange, false);
