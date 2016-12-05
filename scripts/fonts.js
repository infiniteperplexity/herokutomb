HTomb = (function(HTomb) {
  "use strict";
  var Constants = HTomb.Constants;

  //Ideally I think I want Lucida Console for the text and Verdana for the play area
  //var useFont = "Lucida Console";

  function fontFallback(fontArr) {
    var font = fontArr[0][0];
    var size = fontArr[0][1];
    var spacing = font[0][2] || 1;
    var testContext = document.createElement("canvas").getContext('2d');
    var testText = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    testContext.font = "72px monospace";
    //testContext.font = size + "px " + font;
    var baselineSize = testContext.measureText(testText).width;
    if (font!=="72px monospace") {
      testContext.font = "72px '" + fontArr[0][0] + "', monospace";
    }
    var newSize = testContext.measureText(testText).width;
    testContext.font = size + "px '" + font + "', monospace";
    var measuredWidth = 1+Math.floor(testContext.measureText(testText).width/testText.length);
    var measuredFonts = ["Lucida Console","Courier New"];
    var width = (measuredFonts.indexOf(font)===-1) ? size : measuredWidth;
    var xskew = (measuredFonts.indexOf(font)===-1) ? +9 : +3;
    //return {font: font, size: size, width: width, xskew: xskew, yskew: +7, spacing: spacing};
    if (newSize!==baselineSize || font==="Lucida Console") {
    //if (newSize!==baselineSize || font==="72px monospace") {
      console.log("Using " + font+".");
      return {font: font, size: size, width: width, xskew: xskew, yskew: +7, spacing: spacing};
    }
    else {
      console.log("Font " + font + " is not available.");
      fontArr.shift();
      if (fontArr.length===0) {
        fontArr.push(["72px monospace",size]);
      }
      return fontFallback(fontArr,size);
    }
  }
  //var font = fontFallback([["Verdana",18],["Geneva",18],["sans-serif",18]]);
  //var font = "Verdana, Geneva, sans-serif";
  var font = "Verdana, Trebuchet MS, Helvetica, Arial, sans-serif";
  var size = 18;
  var FONTFAMILY = Constants.FONTFAMILY = font;
  var FONTSIZE = Constants.FONTSIZE = size;
  var CHARHEIGHT = Constants.CHARHEIGHT = size;
  var CHARWIDTH = Constants.CHARWIDTH = size;
  var XSKEW = Constants.XSKEW = 3;
  var YSKEW = Constants.YSKEW = 9;

  // Dimensions of the display panels
  var GAMEW = 500;
  var GAMEH = 500;
  var SCREENW = Constants.SCREENW = Math.floor(GAMEW/CHARWIDTH);
  var SCREENH = Constants.SCREENH = Math.floor(GAMEH/CHARHEIGHT);
  console.log("Playing area will be " + SCREENW + "x" + SCREENH + ".");

  //font = fontFallback([["Caudex",15,0.9],["Lucida Console",15]]);
  //font = fontFallback([["Lucida Console",15],["Monaco",15],["monaco",15],["monospace",15]]);
  //font = "Lucida Console, Monaco, monospace, sans-serif";
  font = "Lucida Console, Monaco, Courier New, Courier, monospace";
  size = 15;
  var TEXTFONT = Constants.TEXTFONT = font;
  var TEXTSIZE = Constants.TEXTSIZE = size;
  var TEXTWIDTH = Constants.TEXTWIDTH = 10;
  var TEXTSPACING = Constants.TEXTSPACING = 1;

  var TOTALH = Constants.TOTALH = GAMEH+8*TEXTSIZE;
  var TOTALW = Constants.TOTALW = 900;
  var MENUW = Constants.MENUW = Math.floor((TOTALW-GAMEW)/TEXTWIDTH);
  var MENUH = Constants.MENUH = TOTALH/TEXTSIZE;
  var STATUSH = Constants.STATUSH = 2;
  var SCROLLH = Constants.SCROLLH = 6;
  var SCROLLW = Constants.SCROLLW = GAMEW/TEXTWIDTH;
  return HTomb;
})(HTomb);
