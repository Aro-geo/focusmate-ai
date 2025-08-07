const beepSound = new AudioContext();

export function playBeep() {
  const oscillator = beepSound.createOscillator();
  const gainNode = beepSound.createGain();
  
  oscillator.connect(gainNode);
  gainNode.connect(beepSound.destination);
  
  gainNode.gain.value = 0.5;
  oscillator.frequency.value = 800;
  oscillator.type = 'sine';
  
  oscillator.start();
  
  setTimeout(() => {
    oscillator.stop();
  }, 500);
}
