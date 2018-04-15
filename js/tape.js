// Ruleset for one elemental cellular automata.
class Rules {
  // Either from array of ints/bools or a scalar number.
  constructor(rules) {
    if(rules instanceof Array) {
      assert(rules.length == 8)
      this.rules = rules
    }
    else {
      assert(0 <= rules  &&  rules <= 255)
      this.rules = Array(8)
      this.numeric = rules
    }
  }

  // Apply a rule given surroudings (i.e. the cell and its neighbours).
  apply(le, ce, ri) {
    if (ce === undefined && ri === undefined) {  // array-form
      [le, ce, ri] = le
    }
    const num = 4*le + 2*ce + ri
    return this.rules[7-num]
  }

  // Private method.
  // Find rule's index given its "name".
  _find_code_idx(num) {
    return Rules.Lookup.findIndex(x => x == num)
  }

  // Get specified code.
  get_code(num) {
    const idx = this._find_code_idx(num)
    return this.rules[idx]
  }

  // Get all specified codes.
  get_codes(nums) {
    return nums.map(x => this.get_code(x))
  }

  // Common values of all specified codes
  // (or undefined if they don't share value).
  all_codes(nums) {
    const codes = this.get_codes(nums)
    const all_same = codes.every(x => x == codes[0])
    return all_same ? codes[0] : undefined
  }

  // Sets specified code.
  set_code(num, val) {
    const idx = this._find_code_idx(num)
    this.rules[idx] = val
  }

  // Sets all specified codes to the same value.
  set_codes(nums, val) {
    nums.forEach(x => this.set_code(x, val))
  }

  // Returns numeric value of the rule.
  get numeric() {
    return this.rules.reduce((a,b,i,arr) => 2*a + b)
  }

  // Changes the rule according to a numeric value.
  set numeric(num) {
    const val = parseInt(num)
    upto(8).forEach(i =>
      this.rules[7-i] = (val >> i) & 1
    )
  }

  // Full ruleset (as an array value).
  get full() {
    return this.rules
  }

  // Sets full ruleset (to an array value).
  set full(arr) {
    this.rules = arr
  }

  // Legal ruleset (as an array value).
  get legal() {
    const r111 = this.all_codes(["111"])
    const r101 = this.all_codes(["101"])
    const r011 = this.all_codes(["011", "110"])
    const r010 = this.all_codes(["010"])
    const r001 = this.all_codes(["001", "100"])
    return [r111, r101, r011, r010, r001]
  }

  // Set legal ruleset (to an array value).
  set legal(arr) {
    const [r111, r101, r011, r010, r001] = arr
    this.set_codes(["111"],        r111)
    this.set_codes(["011", "110"], r011)
    this.set_codes(["101"],        r101)
    this.set_codes(["001", "100"], r001)
    this.set_codes(["010"],        r010)
    this.set_codes(["000"],           0)
  }

  // Voting ruleset (as an array value).
  get voting() {
    const r111 = this.all_codes(["111"])
    const r101 = this.all_codes(["101", "110", "011"])
    const r010 = this.all_codes(["010", "100", "001"])
    const r000 = this.all_codes(["000"])
    return [r111, r101, r010, r000]
  }

  // Set legal ruleset (to an array value).
  set voting(arr) {
    const [r111, r101, r010, r000] = arr
    this.set_codes(["111"],               r111)
    this.set_codes(["101", "110", "011"], r101)
    this.set_codes(["010", "100", "001"], r010)
    this.set_codes(["000"],               r000)
  }
}

Rules.add_fields({
  Lookup: immut(["111","110","101","100","011","010","001","000"]),
  Reprs:  immut(["numeric", "full", "legal", "voting"])
})



const random_arr = (len) =>  {
  const arr = Array(len)
  upto(len).forEach(i =>
    arr[i] = (Math.random() > 0.5)
  )
  return arr
}
const arr_or_random = (content) => {
  if (content instanceof Array) {
    return content.slice()
  }
  else if (content !== undefined) {
    return random_arr(content)
  }
}

// Circular tape state.
class TapeState {
  // Fill cells.
  constructor(content) {
    this.cells = arr_or_random(content)
  }

  // Explicit from-content constructor.
  static from(content) {
    assert(content instanceof Array)
    return new TapeState(content.slice())
  }

  // Explicit random-from-length constructor.
  static random(length) {
    assert(!(length instanceof Array))
    return new TapeState(length)
  }

  // Number of cells in tape.
  get width() {
    return this.cells.length
  }

  // Normalized index in circular tape.
  idx(i) {
    return mod(i, this.width)
  }

  // Circular cell access.
  cell(i) {
    const idx = this.idx(i)
    return this.cells[idx]
  }

  // Circular surroundings access.
  surroundings(i) {
    const idx1 = this.idx(i-1)
    const idx2 = this.idx(i)
    const idx3 = this.idx(i+1)
    return [this.cells[idx1], this.cells[idx2], this.cells[idx3]]
  }

  // Iterator through cells.
  forEach() {
    return this.cells.forEach.apply(this.cells, arguments)
  }

  // Deep copy.
  clone() {
    return new TapeState(this.cells.slice())
  }
}



// Automaton circular state.
class AutomatonState extends TapeState {
  // From its cellular automata's rules and either
  // length of the tape (random content) or its content.
  constructor(rules, content) {
    super(content)
    this.rules = rules
  }

  // Explicit from-content constructor.
  static from(rules, content) {
    assert(content instanceof Array)
    return new AutomatonState(rules, content.slice())
  }

  // Explicit random-from-length constructor.
  static random(rules, length) {
    assert(!(length instanceof Array))
    return new AutomatonState(rules, length)
  }

  // Deep copy.
  clone() {
    return new AutomatonState(this.rules, this.cells.slice())
  }

  // Reset to random state.
  reset() {
    upto(this.width).forEach(i =>
      this.cells[i] = (Math.random() > 0.5)
    )
  }

  // Flip single bit.
  flip(idx) {
    this.cells[idx] ^= 1
  }

  // Add a single disturbance at a random point.
  disturb() {
    const idx = Math.floor(Math.random() * this.width)
    this.flip(idx)
  }

  // New distrubed state.
  disturbed() {
    const di = this.clone()
    di.disturb()
    return di
  }

  // Next state according to the rules.
  next() {
    // optimization: use modulo only for the first and last cell
    const nc = upto(this.width).map(i =>
      this.rules.apply(this.surroundings(i))
    )
    return AutomatonState.from(this.rules, nc)
  }
}


const arr_diff = (a, b) => upto(a.length).map(i => a[i] ^ b[i])

// Tape state difference.
class TapeDiff extends TapeState {
  // From two tapes.
  constructor(tape1, tape2) {
    super(arr_diff(tape1.cells, tape2.cells))

    this.tape1 = tape1
    this.tape2 = tape2
  }

  // Update in-place.
  update() {
    this.cells = arr_diff(tape1.cells, tape2.cells)
  }

  // Deep copy.
  clone() {
    return new TapeDiff(this.tape1, this.tape2)
  }

  // Tapes' successors' difference.
  next() {
    return new TapeDiff(this.tape1.next(), this.tape2.next())
  }

  // Hamming's distance.
  distance() {
    return this.cells.reduce((a,b) => a+b)
  }
}


// History for a Tape or TapeDiff. Consists of immutable states.
// It has fixed maximal capacity.
class TapeHistory {
  static get DefaultCapacity() {
    return 100
  }

  constructor(tape, capacity) {
    if (tape instanceof Array) {  // history-based
      this.states = tape
    }
    else {  // single-based
      this.states = [tape]
    }

    // default capacity: 1000
    if (capacity === undefined) {
      capacity = TapeHistory.DefaultCapacity
    }
    this.capacity = capacity

    // First state index.
    this.firstIdx = 0

    // Historical vales are immutable.
    upto(this.length).forEach(i =>
      this.states[i] = immut(this.states[i])
    )
  }

  // Number of historical states.
  get length() {
    return this.states.length
  }

  // Number of cells in a single state.
  get width() {
    return this.first.width
  }

  // Oldest available state.
  get first() {
    return this.states[0]
  }

  // Newest state.
  get last() {
    return this.states[this.length-1]
  }

  // Last state index.
  get lastIdx() {
    return this.firstIdx + this.length - 1
  }

  // State of a given index. May be invalid due capacity.
  state(idx) {
    return this.states[idx - this.firstIdx]
  }

  // Append next state and return it.
  next() {
    if (this.length == this.capacity) {
      this.states.shift()
    }
    return this.states.push(this.last.next())
  }

  // Iterator through states.
  forEach() {
    return this.states.forEach.apply(this.states, arguments)
  }
}


// Drawer for tape state history.
class TapeHistoryDrawer {
  // From canvas and history.
  constructor(canvas, history) {
    this.canvas  = canvas
    this.ctx     = canvas.getContext("2d")
    this.history = history

    // Width of a single cell in pixels.
    this.cellWidth = this.canvas.width / this.width
  }

  // Single tape width in cells.
  get width() {
    return this.history.width
  }

  // Number of historical states.
  get length() {
    return this.history.length
  }

  // Private method. Draw single cell.
  _drawCell(i,j, value) {
    const lilen = this.length-1
    const width = this.cellWidth
    const x = i*width
    const y = (lilen-j)*width
    if(value) {
      this.ctx.fillRect(x, y, width, width)
    }
    else if (width > 8) {
      this.ctx.rect(x, y, width, width)
    }
  }

  // Draw history.
  draw() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.history.forEach((tape,j) =>
      tape.forEach((cell,i) =>
        this._drawCell(i,j, cell)
      )
    )
    this.ctx.stroke()
  }
}


// Private class. Value calculator for drawing .
class DrawValueCalc {
  // From drawing bounds and values to draw.
  constructor(bounds, values) {
    this.bounds = bounds
    this.values = values

    const [xl,yl,xh,yh] = this.bounds
    this.xl = xl
    this.yl = yl
    this.xh = xh
    this.yh = yh
  }

  // Scale value so that it fits in maxval.
  // Return alongside multiplicity.
  static _with_mul(val, maxval) {
    if (val < maxval) {
      return [val, 1]
    }
    else {
      const mul = Math.ceil(val / maxval)
      const newval = val / mul
      return [newval, mul]
    }
  }

  // Calibrate in X axis.
  calibrateX(val, maxval) {
    [this.numX, this.mulX] = DrawValueCalc._with_mul(val, maxval)
    this.scaleX = (this.xh - this.xl) / (this.numX+1)
  }

  // Calibrate in Y axis.
  calibrateY(val, maxval) {
    [this.numY, this.mulY] = DrawValueCalc._with_mul(val, maxval)
    this.scaleY = (this.yh - this.yl) / (this.numY+1)
  }

  // i-th X label position.
  labelPosX(i) {
    return [this.xl + i * this.scaleX, this.yl]
  }

  // i-th Y label position.
  labelPosY(i) {
    return [this.xl, this.yl + i * this.scaleY]
  }

  // i-th X label text.
  labelX(i) {
    return i * this.mulX
  }

  // i-th Y label text.
  labelY(i) {
    return i * this.mulY
  }

  // i-th scaled X value to draw
  x(i) {
    return this.xl + i * this.scaleX / this.mulX
  }

  // i-th scaled Y value to draw
  y(i) {
    return this.yl + this.scaleY / this.mulY * this.values[i]
  }
}

// Hamming distance chart for tape difference history.
class HammingChart {
  // From cavas and tape difference history
  constructor(canvas, history) {
    this.canvas   = canvas
    this.history  = history
    this.values   = []
    this.init()
  }

  // Initialize after changing canvas or history.
  init() {
    this.ctx = this.canvas.getContext("2d")
    // enable construction with no history before drawing starts
    if (this.history !== undefined) {
      this.maxval = this.history.width
    }

    this.min_width  = 10
    this.max_width  = 20
    this.min_height =  5
    this.max_height = 10

    this.xl = this.canvas.width  * 0.00 + 20
    this.yl = this.canvas.height * 1.00 - 20
    this.xh = this.canvas.width  * 1.00 - 20
    this.yh = this.canvas.height * 0.00 + 20
    this.bounds = [this.xl, this.yl, this.xh, this.yh]
    this.valcal = new DrawValueCalc(this.bounds, this.values)

    this.ctx.strokeStyle = "gray"
    this.ctx.fillStyle = "gray";
    this.ctx.font = "gray 10px Arial";

    this.reset()
  }

  // Reset values.
  reset() {
    this.values.length = 0
    this.clear()
  }

  // Number of values to draw.
  get length() {
    return this.values.length
  }

  // Update step.
  _next() {
    const last = this.history.state(this.length)
    const distance = last.distance()
    this.values.push(distance)
  }

  // Update according to history.
  update() {
    range(this.length, this.history.lastIdx).forEach(_ => {
      this._next()
    })
  }

  // Clear canvas.
  clear() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height)
    this.ctx.beginPath()
  }

  // Private method. Move current point.
  _move(x,y) {
    this.ctx.moveTo(x,y)
  }

  // Private method. Draw line from current point.
  _lineTo(x,y) {
    this.ctx.lineTo(x,y)
  }

  // Private method. Draw line.
  _line(x1,y1, x2,y2) {
    this._move(x1,y1)
    this._lineTo(x2,y2)
  }

  // Private method. Draw arrow. Dir can be N, E, S, W.
  _arrow(x,y, dir) {
    const a = 8
    const b = 4
    const dirs =
      {'N': [-b, +a, +b, +a],
       'E': [-a, +b, -a, -b],
       'S': [-b, -a, +b, -a],
       'W': [+a, +b, +a, -b]}

    const [x1,y1,x2,y2] = dirs[dir]
    this._move(x, y)
    this._lineTo(x + x1, y + y1)
    this._lineTo(x + x2, y + y2)
  }

  // Private method. Draw dot.
  _dot(x,y) {
    this._move(x, y)
    this.ctx.fillRect(x-1, y-1, 3, 3)
  }

  // Private method. Draw text. Dir can be N, E, S, W.
  _label(x,y, dir, text) {
    const a = 5
    const b = 2
    const dirs =
      {'N': [ 0, -b,   -b,   -a],
       'E': [+b,  0,   +a,   -b],
       'S': [ 0, +b,   -b, +3*a],
       'W': [-b,  0, -2*a,   -b]}

    const [x1,y1,x2,y2] = dirs[dir]
    this._line(x,y, x+x1, y+y1)
    this.ctx.fillText(text, x+x2, y+y2, a)
  }

  // Draw chart.
  draw() {
    this.update()
    this.clear()

    const ctx = this.ctx
    const [xl, yl, xh, yh] = this.bounds
    const valcal = this.valcal
    const length = this.values.length
    
    // axes and arrows:
    this._line(xl,yl, xh,yl)
    this._line(xl,yl, xl,yh)
    this._arrow(xh,yl, 'E')
    this._arrow(xl,yh, 'N')
    ctx.fill()

    // scale chart values:
    valcal.calibrateX(Math.max(length, this.min_width), this.max_width)
    valcal.calibrateY(this.maxval, this.max_height)

    // labels:
    range(1, valcal.numX).forEach(i => {
      const [x,y] = valcal.labelPosX(i)
      this._label(x,y, 'N', valcal.labelX(i))
    })
    range(1, valcal.numY).forEach(i => {
      const [x,y] = valcal.labelPosY(i)
      this._label(x,y, 'W', valcal.labelY(i))
    })

    // chart data:
    if (length > 0) {
      this._dot(valcal.x(0), valcal.y(0))
      range(1, length).forEach(i => {
        const [x,y] = [valcal.x(i), valcal.y(i)]
        this._lineTo(x,y)
        this._dot(x,y)
      })
    }

    ctx.stroke()
  }
}
