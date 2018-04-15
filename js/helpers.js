const assert = console.assert
const upto  = n => Array.from({length: n}, (_, i) => i)
const range = (a,b) => Array.from({length: (b-a+1)}, (_, i) => a+i)
const mod   = (m,n) => ((m % n) + n) % n
const immut = Object.freeze

Function.prototype.add_fields = function(fi) {
  Object.keys(fi).forEach(name => this[name] = fi[name])
}
