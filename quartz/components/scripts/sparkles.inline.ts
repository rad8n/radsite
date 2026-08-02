document.addEventListener("nav", () => {
  // Cleans up any duplicate listeners during page reloads
  window.removeEventListener("mousemove", spawnSparkle)
  window.addEventListener("mousemove", spawnSparkle)
})

function spawnSparkle(e: MouseEvent) {
  // Throttles the spawn rate slightly so your screen doesn't lag
  if (Math.random() > 0.15) return 

  const sparkle = document.createElement("div")
  sparkle.className = "cursor_sparkle"
  
  // Set positioning based on mouse event viewport coordinates
  sparkle.style.left = `${e.clientX}px`
  sparkle.style.top = `${e.clientY}px`

  // Add micro-variations to sizes for a organic sparkle effect
  const size = Math.random() * 6 + 2
  sparkle.style.width = `${size}px`
  sparkle.style.height = `${size}px`

  document.body.appendChild(sparkle)

  // Clear elements out of the DOM tree after the fade animation finishes
  setTimeout(() => {
    sparkle.remove()
  }, 800)
}
