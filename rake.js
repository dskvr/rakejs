/*
Rake: Rapid Automatic Keyword Extraction

1.) Split sentences
  - remove junk
  - split on most punctuation
  - lower case everything
  - remove blanks
2.) Load stopwords & build regex
  - fox stop word list
3.) Split on stopword regex (phrases)
4.) Calculate word scores
5.) Calculate keyword scores
6.) Return sorted scores (subset)
*/

//global
var keywords,
    stopwords = require("./stopwords.js");

function splitSentences(text){
  var clean = text.replace(/[|&$%^*\(\)-+'"]/g, "");
  var delimiters = /[\.!\?\-,]+/;
  var split = clean.split(delimiters);
  split = split.map(function(s){return s.toLowerCase().trim()})
  return split.filter(function(s){return s != ""})
}

function buildStopwordsRegex(stopwords){
  stopwords = stopwords.filter(function(s){return s.length > 1})
  stopwords.push('a')
  stopwords = stopwords.map(function(s){return '\\b' + s + '\\b'})
  return new RegExp("(?:" + stopwords.join('|') + ")", "g")
}

function generateKeywords(text, stopwords){
  var split = splitSentences(text)
  var regex = buildStopwordsRegex(stopwords)
  var keywords = [];
  for (var i = 0; i < split.length; i++) {
    var temp = split[i].replace(regex, "|");
    var phrases = temp.split("|")
    for (var j = 0; j < phrases.length; j++) {
      candidate = phrases[j].trim();
      if (candidate != "" && candidate.length > 1){
        keywords.push(candidate);
      }
    }
  }
  return keywords
}

function scoreWords(keywords){
  var freqs = {};
  var degrees = {};
  var scores = {}

  for (var i = 0; i < keywords.length; i++) {
    var words = keywords[i].split(' ');
    var keywordLength = words.length;
    var keywordDegree = keywordLength - 1;

    for (var j = 0; j < words.length; j++) {
      freqs[words[j]] = freqs[words[j]] ? freqs[words[j]] + 1 : 1
      degrees[words[j]] = keywordDegree;
    }

  }

  for (var key in freqs) {
    if (freqs.hasOwnProperty(key)) {
      degrees[key] = freqs[key] + degrees[key]
      scores[key] = degrees[key] / (freqs[key] * 1.0)
    }
  }
  return scores
}

function scoreKeywords(keywords, scores){
  var candidates = {};
  for (var i = 0; i < keywords.length; i++) {
    var words = keywords[i].split(' ')
    var score = 0
    for (var j = 0; j < words.length; j++) {
      score += scores[words[j]]
    }
    candidates[keywords[i]] = candidates[keywords[i]]
                            ? candidates[keywords[i]] + 1 : 1
  }
  return candidates
}


function rake(text, stopwords, topWords){
  var keys = generateKeywords(text, stopwords)
  var scores = scoreWords(keys);
  var candidates = scoreKeywords(keys, scores);
  var sortable = [];
  for (word in candidates){
    sortable.push([word, candidates[word]])
  }
  sortable.sort(function(a,b){
    return b[1] - a[1]
  })
  var slice = sortable.slice(0, topWords)
  for (var i = 0; i < slice.length; i++){
      slice[i] = {"word": slice[i][0], "score": slice[i][1]}
  }
  return slice
}

function rakeTime(){
    var text = document.getElementById('text').value;
    var topWords = document.getElementById('top-words').value;
    keywords = rake(text, stopwords, topWords); 
    var viz = document.getElementById('viz')
    viz.innerHTML = '' 
    var visualization = d3plus.viz()
	.container("#viz")
	.data(keywords)
	.type("bubbles")
	.id("word")
	.size("score")
	.color("word")
	.draw()

}

window.onload = function(){
    rakeTime()
};