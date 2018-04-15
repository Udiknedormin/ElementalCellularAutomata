const cellsNum = 90
const sectionName = (nam) => "rule" + nam[0].toUpperCase() + nam.substr(1)

let running = false  // bool flag
let run              // timer
let rule = new Rules(22)  // default rule


/////////////////
///   TAPES   ///
/////////////////

const simHistory = []
const simDrawers = []
const chart = new HammingChart(document.getElementById("HammingChart"))


// Toggle representation buttons between enabled and disabled.
const toggleDisabled = (repr) => {
  const sec = sectionName(repr)
  if(repr == "numeric") {
    document.getElementById(sec).disabled ^= 1
  }
  else {
    const rules = Array.from(document.getElementById(sec)
                                     .getElementsByTagName("label"))
    rules.forEach(rule => rule.classList.toggle("disabled"))
  }
}

// Toggle running status and rules' buttons' availability.
const toggleRunning = () => {
  running ^= 1
  Rules.Reprs.forEach(toggleDisabled)
}

// Draw both drawers and chart.
const drawAll = () => {
  simDrawers.forEach(x => x.draw())
  chart.draw()
}

// Step all tapes and draw changes.
const stepAll = () => {
  simHistory.forEach(x => x.next())
  drawAll()
}

// Play simulation.
const startSimulation = () => {
  if(!running) {
    toggleRunning()
    run = setInterval(stepAll, 200)
  }
}

// Pause all processes.
const pauseSimulation = () => {
  if(running) {
    toggleRunning()
    clearInterval(run)
  }
}

// Single step of cellular automata.
const stepSimulation = () => {
  pauseSimulation()
  stepAll()
}

// Start simulation again. Randomize tape, disturb it etc.
const resetSimulation = () => {
  const tape1 = AutomatonState.random(rule, cellsNum)
  const tapes1 = [tape1]
  
  const tape2 = tape1.disturbed()
  const tapes2 = [tape2]
  
  const tapes3 = [new TapeDiff(tape1, tape2)]
  const tapes = [tapes1, tapes2, tapes3]

  const sims = Array.from(document.getElementById("sims")
                                  .getElementsByTagName("canvas"))

  simHistory.length = 0
  simDrawers.length = 0
  upto(3).forEach(i => {
    simHistory.push(new TapeHistory(tapes[i]))
    simDrawers.push(new TapeHistoryDrawer(sims[i], simHistory[i]))
  })

  chart.history = simHistory[2]
  chart.init()
  drawAll()
}



/////////////////
///   TAPES   ///
/////////////////

// Set check button.
const setChecked = (elem, value) => {
  elem.checked = value
  elem.parentElement.classList.remove("active")
  if(value) {
    elem.parentElement.classList.add("active")
  }
}

// Update a single representation.
const updateFor = (repr) => {
  const sec = sectionName(repr)
  if(repr == "numeric") {
    document.getElementById(sec).value = rule[repr]
  }
  else {
    const lhs = document.getElementById(sec).getElementsByTagName("input")
    const rhs = rule[repr]
    upto(lhs.length).forEach(i =>
      setChecked(lhs[i], rhs[i])
    )
  }
}

// Update all rules.
const updateForAll = () => {
  Rules.Reprs.forEach(updateFor)
  resetSimulation()
}

// Update rules from input element and representation name.
const ruleFrom = (input, repr) => {
  if(repr == "numeric") {
    rule[repr] = input.value
    updateForAll()
  }
  else {
    const check = input.getElementsByTagName("input")[0]
    check.checked ^= 1  // bootstrap takes action after callback
  
    const sec = sectionName(repr)
    const ru = document.getElementById(sec).getElementsByTagName("input")
    rule[repr] = Array.from(ru).map((x) => x.checked)
    updateForAll()
  
    input.classList.toggle("active")  // prevent bootstrap event
  }
}


/////////////////
///   START   ///
/////////////////

updateForAll()
