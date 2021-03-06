var ac = require('../accountant')  

var currmonth = null;
var currmonthData = {}


var onMonth = function(m){
  console.log(m, ": ",  ac.$(currmonthData.income), ",", ac.$(-1 * currmonthData.outgoing))
}

var checkMonth = function(mon){
  if (mon == currmonth){
  } else {
    if (currmonth) onMonth(currmonth);

    currmonth = mon;
    currmonthData.income = 0
    currmonthData.outgoing = 0

  }
}

module.exports = function(opts){
  return {
    onComplete: function(banks, stocks){
      checkMonth("-");
    }
    , onTransaction: function(t, banks, stocks){
      checkMonth(t.date.slice(0, 7));

      if (banks[t.src].last_statement){
        if (!banks[t.dest].last_statement){
          currmonthData.outgoing += t.amount
        }
      } else {
        currmonthData.income += t.amount
      }

    }
  , onEquityBuy: function(buy){
    checkMonth(buy.date.slice(0, 7));
    currmonthData.outgoing -= buy.cb;
    if (currmonthData.outgoing < 0) currmonthData.outgoing = 0
    // Hacky - basically don't include stock purchases as 'outgoing' transactions
    // by reversing the amount
  }
  , onDividend: function(d){
      checkMonth(d.date.slice(0,7));
      currmonthData.income += d.net;
    }
  }
}
