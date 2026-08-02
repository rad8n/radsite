// Listen for Quartz's native page transition event
document.addEventListener("nav", () => {
  window.removeEventListener("mousemove", spawnSparkle);
  window.addEventListener("mousemove", spawnSparkle);
});

function spawnSparkle(e) {
  // Throttles the spawn rate slightly so it doesn't cause screen lag
  if (Math.random() > 0.15) return;

  const sparkle = document.createElement("div");
  sparkle.className = "quartz-sparkle";
  
  // Set positioning based on mouse cursor coordinates
  sparkle.style.left = e.clientX + "px";
  sparkle.style.top = e.clientY + "px";

  // Add micro-variations to sizes for an organic sparkle effect
  const size = Math.random() * 6 + 2;
  sparkle.style.width = size + "px";
  sparkle.style.height = size + "px";

  document.body.appendChild(sparkle);

  // Clear elements out of the page after the fade animation finishes
  setTimeout(() => {
    sparkle.remove();
  }, 800);
}
