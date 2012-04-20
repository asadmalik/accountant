/**
===== Accountant =====



*/
var fs = require('fs')
  , colors = require('colors')
  , _ = require('underscore')

var reports = []



exports.registerReport = function(report){
  reports.push(report)
  return exports
}  


var transaction = function(t, banks, stocks){
    banks[t.src] = banks[t.src] || {balance:0}
    banks[t.dest] = banks[t.dest] || {balance:0}
  
    banks[t.src].balance -= t.amount
    banks[t.dest].balance += t.amount
  
    banks[t.src].currency = t.currency
    banks[t.dest].currency = t.currency
    
    _.each(reports, function(r){
      if (r.onTransaction) 
        r.onTransaction(t, banks, stocks);
    })
}  

var equityBuy = function(buy, stocks, banks){
    var s = stocks[buy.symbol] || {}
      , cb = ((buy.quantity * buy.cost) + buy.commission)
    
    s.quantity = s.quantity || 0
    s.dividend = s.dividend || 0
    s.cost_basis =  s.cost_basis || 0
 
    s.cost_basis += cb
    s.quantity += buy.quantity

	  s.industry = s.industry || buy.industry

  	s.chunks = s.chunks || []
  	s.chunks.push({date: buy.date, quantity: buy.quantity})
  	
    stocks[buy.symbol] = s

    banks[buy.account] = banks[buy.account] || {balance:0}
    banks[buy.account].balance -= cb
  
    banks[buy.account].trading = true
	  stocks[buy.symbol].etf = (buy.typ =='etf-buy')
	  stocks[buy.symbol].brokerage = buy.account // TODO!!! ASSUMES NO DUPE OF STOCK BETWEEN ACCTS 

    buy.cb = cb
    
    _.each(reports, function(r){
      if (r.onEquityBuy) 
        r.onEquityBuy(buy);
    })
}

var dividend = function(div, stocks, banks){
   var s = stocks[div.symbol]
      , net = s.quantity * div.amount
  
    s.dividend += net
  
    banks[div.account] = banks[div.account] || {}
    banks[div.account].balance += net
  
    banks[div.account].trading = true
  
    _.each(reports, function(r){
      if (r.onDividend) 
        r.onDividend(div, stocks);
    })
}  

var statement = function(statement, banks){  
  _.each(reports, function(r){
    if (r.onPreStatement) 
      r.onPreStatement(statement, banks);
  })


  banks[statement.acct] = banks[statement.acct] || {}

  banks[statement.acct].currency = statement.currency
  banks[statement.acct].balance = statement.balance
  banks[statement.acct].last_statement = statement.date
  
  _.each(reports, function(r){
    if (r.onStatement) 
      r.onStatement(statement, banks);
  })
  
}  



exports.run = function(file){
  file = file || './accounts.json'

  var accts = JSON.parse(fs.readFileSync(file, 'utf8').replace(/\/\/.*\n/g, '')) //strip comments
    , stocks = {}
    , banks = {}

  for (var i=0; i<accts.length; i++){
    var acct = accts[i];
    if (acct.typ== 'stock-buy' || acct.typ == 'etf-buy'){
      equityBuy(acct, stocks, banks);
    }
  
    if (acct.typ == 'dividend'){
       dividend(acct, stocks, banks)
    }
  
    if (acct.typ == 'statement'){
      statement(acct, banks)
    }
  
    if (acct.typ == 'transaction'){
      transaction(acct, banks, stocks)
    }  
  
  }

  _.each(reports, function(r){
    if (r.onComplete) 
      r.onComplete(banks, stocks);
  })

}





exports.c = function(v, pre, post){
  var val = '' + parseInt(v*100)/100
    , str = (pre || '') + val + (post || '')
  
  str = (val>=0) ? str.green : str.red  
  
  return str
}  



exports.pad = function(v, len, ch){
  var val = v + ''
  
  while(val.length < len){
    val += (ch || ' ')
  }	  
  return val	  
}	
