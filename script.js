
(() => {
  "use strict";

  const STORAGE_KEY = "bebela_natal_last_spin_v2";
  const COOLDOWN_MS = 24 * 60 * 60 * 1000;
  const SPIN_DURATION = 5600;
  const prizes = [
    { title: "Vale-compras de R$ 100,00", message: "Seu vale-compras BEBELA no valor de R$ 100,00 é o presente da vez!" },
    { title: "Comprou, ganhou outro", message: "Você ganhou a oportunidade de levar outro item! Consulte as opções disponíveis na loja." },
    { title: "10% OFF na sua próxima compra", message: "Você ganhou 10% de desconto para usar na sua próxima compra." },
    { title: "Brinco em prata 925", message: "Um lindo brinco em prata 925 é seu presente especial!" }
  ];

  const wheel = document.getElementById("wheel");
  const spinButton = document.getElementById("spinButton");
  const buttonText = document.getElementById("buttonText");
  const hint = document.getElementById("hint");
  const modal = document.getElementById("resultModal");
  const resultPrize = document.getElementById("resultPrize");
  const resultCopy = document.getElementById("resultCopy");
  const closeModal = document.getElementById("closeModal");
  const confirmResult = document.getElementById("confirmResult");
  let spinning = false;
  let currentRotation = 0;
  let activeAnimation = null;
  let previousFocus = null;
  let countdownTimer = null;

  function getSavedSpin() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY) || sessionStorage.getItem(STORAGE_KEY);
      if (!raw) return null;
      const saved = JSON.parse(raw);
      if (!saved || !Number.isFinite(saved.timestamp) ||
          !Number.isInteger(saved.prizeIndex) ||
          saved.prizeIndex < 0 || saved.prizeIndex >= prizes.length) return null;
      return saved;
    } catch (_) {
      return null;
    }
  }

  function saveSpin(timestamp, prizeIndex) {
    const record = JSON.stringify({ timestamp, prizeIndex, prize: prizes[prizeIndex].title });
    try {
      localStorage.setItem(STORAGE_KEY, record);
    } catch (_) {
      try { sessionStorage.setItem(STORAGE_KEY, record); } catch (_) {}
    }
  }

  function remainingMs() {
    const saved = getSavedSpin();
    if (!saved) return 0;
    return Math.max(0, saved.timestamp + COOLDOWN_MS - Date.now());
  }

  function formatRemaining(ms) {
    const totalSeconds = Math.ceil(ms / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;
    return `${String(hours).padStart(2, "0")}h ${String(minutes).padStart(2, "0")}min ${String(seconds).padStart(2, "0")}s`;
  }

  function updateAvailability() {
    if (spinning) return;
    const remaining = remainingMs();
    if (remaining > 0) {
      spinButton.disabled = true;
      buttonText.textContent = "VOCÊ JÁ GIROU!";
      hint.textContent = `Sua próxima chance estará disponível em ${formatRemaining(remaining)}.`;
      spinButton.setAttribute("aria-label", `Roleta bloqueada. Tente novamente em ${formatRemaining(remaining)}.`);
    } else {
      spinButton.disabled = false;
      buttonText.textContent = "GIRAR AGORA";
      hint.textContent = "Um presente especial pode estar esperando por você.";
      spinButton.removeAttribute("aria-label");
    }
  }

  function showResult(index) {
    resultPrize.textContent = prizes[index].title;
    resultCopy.textContent = prizes[index].message;
    modal.hidden = false;
    previousFocus = document.activeElement;
    confirmResult.focus();
  }

  function hideResult() {
    modal.hidden = true;
    if (previousFocus && typeof previousFocus.focus === "function") previousFocus.focus();
  }

  function finishSpin(prizeIndex, finalRotation) {
    if (!spinning) return;
    spinning = false;
    currentRotation = finalRotation;
    wheel.style.transform = `rotate(${finalRotation}deg)`;
    if (activeAnimation) {
      activeAnimation.cancel();
      activeAnimation = null;
    }
    updateAvailability();
    showResult(prizeIndex);
  }

  function spin() {
    if (spinning || remainingMs() > 0) {
      updateAvailability();
      return;
    }

    spinning = true;
    spinButton.disabled = true;
    buttonText.textContent = "BOA SORTE...";
    hint.textContent = "A roleta está girando. Que venha um presente especial!";

    // Sorteio uniforme: cada fatia possui 25% de chance.
    const prizeIndex = Math.floor(Math.random() * prizes.length);

    // As fatias estão centradas em 0°, 90°, 180° e 270°.
    // A seta fica no topo; a rotação posiciona o centro da fatia sorteada nela.
    const targetAngle = (360 - prizeIndex * 90) % 360;
    const normalizedCurrent = ((currentRotation % 360) + 360) % 360;
    const adjustment = (targetAngle - normalizedCurrent + 360) % 360;
    const finalRotation = currentRotation + (360 * 7) + adjustment;

    // O bloqueio é gravado no início do giro para sobreviver a recargas/fechamentos.
    saveSpin(Date.now(), prizeIndex);

    if (typeof wheel.animate === "function") {
      activeAnimation = wheel.animate(
        [
          { transform: `rotate(${currentRotation}deg)` },
          { transform: `rotate(${finalRotation}deg)` }
        ],
        { duration: SPIN_DURATION, easing: "cubic-bezier(.10,.72,.08,1)", fill: "forwards" }
      );
      activeAnimation.onfinish = () => finishSpin(prizeIndex, finalRotation);
    } else {
      wheel.style.transition = `transform ${SPIN_DURATION}ms cubic-bezier(.10,.72,.08,1)`;
      requestAnimationFrame(() => {
        wheel.style.transform = `rotate(${finalRotation}deg)`;
      });
      window.setTimeout(() => finishSpin(prizeIndex, finalRotation), SPIN_DURATION + 120);
    }
  }

  function createSnow() {
    const layer = document.getElementById("snow");
    if (!layer) return;
    const mobile = window.matchMedia("(max-width: 600px)").matches;
    const count = mobile ? 30 : 46;

    for (let i = 0; i < count; i++) {
      const flake = document.createElement("span");
      const twinkle = i % 7 === 0;
      flake.className = twinkle ? "snowflake snowflake--twinkle" : "snowflake";
      const size = i % 4 === 0 ? 23 + Math.random() * 15 : 11 + Math.random() * 13;
      flake.style.left = `${Math.random() * 100}%`;
      flake.style.width = `${size}px`;
      flake.style.setProperty("--duration", `${12 + Math.random() * 18}s`);
      flake.style.setProperty("--delay", `${-Math.random() * 28}s`);
      flake.style.setProperty("--drift", `${-65 + Math.random() * 130}px`);
      flake.style.setProperty("--opacity", `${.42 + Math.random() * .5}`);
      flake.style.setProperty("--spark-delay", `${-Math.random() * 2.8}s`);
      const icon = document.createElement("img");
      icon.src = "assets/floco-ciano.svg";
      icon.alt = "";
      icon.draggable = false;
      flake.appendChild(icon);
      layer.appendChild(flake);
    }

    // Pontinhos de neve bem discretos, para dar profundidade sem poluir o fundo.
    const dots = mobile ? 20 : 32;
    for (let i = 0; i < dots; i++) {
      const dot = document.createElement("span");
      dot.className = "snow-dot";
      dot.setAttribute("aria-hidden", "true");
      dot.style.left = `${Math.random() * 100}%`;
      dot.style.setProperty("--duration", `${9 + Math.random() * 14}s`);
      dot.style.setProperty("--delay", `${-Math.random() * 20}s`);
      dot.style.setProperty("--drift", `${-40 + Math.random() * 80}px`);
      dot.style.setProperty("--dot-size", `${2 + Math.random() * 3}px`);
      layer.appendChild(dot);
    }
  }
  spinButton.addEventListener("click", spin);
  closeModal.addEventListener("click", hideResult);
  confirmResult.addEventListener("click", hideResult);
  modal.addEventListener("click", event => {
    if (event.target === modal) hideResult();
  });
  document.addEventListener("keydown", event => {
    if (event.key === "Escape" && !modal.hidden) hideResult();
  });
  document.addEventListener("visibilitychange", () => {
    if (!document.hidden) updateAvailability();
  });

  createSnow();
  updateAvailability();
  countdownTimer = window.setInterval(updateAvailability, 1000);
})();
