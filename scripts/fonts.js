HTomb = (function(HTomb) {
  "use strict";
  var Constants = HTomb.Constants;

  //Ideally I think I want Lucida Console for the text and Verdana for the play area
  //var useFont = "Lucida Console";

  function fontFallback(fontArr) {
    if (fontArr.length===0) {
      fontArr.push(["Courier New",15]);
    }
    var font = fontArr[0][0];
    var size = fontArr[0][1];
    var spacing = font[0][2] || 1;
    var testContext = document.createElement("canvas").getContext('2d');
    var testText = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    testContext.font = "72px monospace";
    testContext.font = size + "px " + font;
    var baselineSize = testContext.measureText(testText).width;
    testContext.font = "72px '" + fontArr[0][0] + "', monospace";
    var newSize = testContext.measureText(testText).width;
    testContext.font = size + "px '" + font + "', monospace";
    var measuredWidth = 1+Math.floor(testContext.measureText(testText).width/testText.length);
    var measuredFonts = ["Lucida Console","Courier New"];
    var width = (measuredFonts.indexOf(font)===-1) ? size : measuredWidth;
    var xskew = (measuredFonts.indexOf(font)===-1) ? +9 : +3;
    if (newSize!==baselineSize) {
      console.log("Using " + font+".");
      return {font: font, size: size, width: width, xskew: xskew, yskew: +7, spacing: spacing};
    }
    else {
      console.log("Font " + font + " is not available.");
      fontArr.shift();
      return fontFallback(fontArr,size);
    }
  }
  var font = fontFallback([["Verdana",18]]);
  var FONTFAMILY = Constants.FONTFAMILY = font.font;
  var FONTSIZE = Constants.FONTSIZE = font.size;
  var CHARHEIGHT = Constants.CHARHEIGHT = font.size;
  var CHARWIDTH = Constants.CHARWIDTH = font.width;
  var XSKEW = Constants.XSKEW = font.xskew;
  var YSKEW = Constants.YSKEW = font.yskew;

  // Dimensions of the display panels
  var GAMEW = 500;
  var GAMEH = 500;
  var SCREENW = Constants.SCREENW = Math.floor(GAMEW/CHARWIDTH);
  var SCREENH = Constants.SCREENH = Math.floor(GAMEH/CHARHEIGHT);
  console.log("Playing area will be " + SCREENW + "x" + SCREENH + ".");

  //font = fontFallback([["Caudex",15,0.9],["Lucida Console",15]]);
  font = fontFallback([["Lucida Console",15]]);
  var TEXTFONT = Constants.TEXTFONT = font.font;
  var TEXTSIZE = Constants.TEXTSIZE = font.size;
  var TEXTWIDTH = Constants.TEXTWIDTH = font.width;
  var TEXTSPACING = Constants.TEXTSPACING = font.spacing;

  var TOTALH = GAMEH+8*TEXTSIZE;
  var TOTALW = 900;
  var MENUW = Constants.MENUW = Math.floor((TOTALW-GAMEW)/TEXTWIDTH);
  var MENUH = Constants.MENUH = TOTALH/TEXTSIZE;
  var STATUSH = Constants.STATUSH = 2;
  var SCROLLH = Constants.SCROLLH = 6;
  var SCROLLW = Constants.SCROLLW = GAMEW/TEXTWIDTH;
  return HTomb;
})(HTomb);
