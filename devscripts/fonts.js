HTomb = (function(HTomb) {
  "use strict";
  var Constants = HTomb.Constants;

  var font = "Verdana, Trebuchet MS, Helvetica, Arial, sans-serif";
  var size = 18;
  var FONTFAMILY = Constants.FONTFAMILY = font;
  var FONTSIZE = Constants.FONTSIZE = size;
  var CHARHEIGHT = Constants.CHARHEIGHT = size;
  var CHARWIDTH = Constants.CHARWIDTH = size;
  var XSKEW = Constants.XSKEW = 10;
  var YSKEW = Constants.YSKEW = 10;

  // Dimensions of the display panels
  var GAMEW = 500;
  var GAMEH = 500;
  var SCREENW = Constants.SCREENW = Math.floor(GAMEW/CHARWIDTH);
  var SCREENH = Constants.SCREENH = Math.floor(GAMEH/CHARHEIGHT);
  console.log("Playing area will be " + SCREENW + "x" + SCREENH + ".");

  font = "Lucida Console, Monaco, Courier New, Courier, monospace";
  size = 15;
  var TEXTFONT = Constants.TEXTFONT = font;
  var TEXTSIZE = Constants.TEXTSIZE = size;
  var TEXTWIDTH = Constants.TEXTWIDTH = 10;
  var TEXTSPACING = Constants.TEXTSPACING = 1;

  var TOTALH = Constants.TOTALH = GAMEH+8*TEXTSIZE;
  var TOTALW = Constants.TOTALW = 900;
  var MENUW = Constants.MENUW = Math.floor((TOTALW-GAMEW)/TEXTWIDTH);
  var MENUH = Constants.MENUH = parseInt(TOTALH/TEXTSIZE);
  var STATUSH = Constants.STATUSH = 2;
  var SCROLLH = Constants.SCROLLH = 6;
  var SCROLLW = Constants.SCROLLW = GAMEW/TEXTWIDTH;
  return HTomb;
})(HTomb);
