var request = require('request')
  , _ = require('underscore')
  , Table = require('cli-table')
  , ac = require('../accountant') 
  , vals = []
  , c = ac.c
  
var EXCHANGE_RATES = {
      USD : 1 // To USD
    , GBP : 1.5723 
}

module.exports = function(opts){
  return {
    
  onComplete: function(banks, stocks){
    var t = new Table({
        head : ["Account", "Value ($)", "Liquid ($)", "% Net"]
      , style : {compact: true, 'padding-left':1, head: ['cyan']}
    })
    
    _.each(banks, function(v, k){
      if (!v.balance || !v.last_statement)
        return;

      var dollar_balance = v.balance
        , liquid = v.balance

      var s = _.filter(stocks, function(x){return x.brokerage == k});
      if (s){
        _.each(s, function(v, k){
    	  dollar_balance += v.cost_basis	
    	})
      }

      dollar_balance = dollar_balance * EXCHANGE_RATES[v.currency]
      liquid = liquid * EXCHANGE_RATES[v.currency]

      vals.push([k, dollar_balance, liquid])
    })


    var tot_val = _.reduce(_.pluck(vals, 1), function(x, y){return x+y}, 0)
      , tot_liq= _.reduce(_.pluck(vals, 2), function(x, y){return x+y}, 0);

    _.each(vals, function(v){
      t.push([v[0], c(v[1]), c(v[2]), c(v[1]/tot_val * 100)])
    })
    t.push([]);
    t.push(['Total', c(tot_val), c(tot_liq), '']);
    
    console.log(t.toString())


    
  }
}
}





 

