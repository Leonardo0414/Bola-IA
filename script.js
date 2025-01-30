// Síntese de voz
const speakMessage = (message) => {
  const speech = new SpeechSynthesisUtterance(message);
  speech.lang = "pt-BR";
  speech.pitch = 0.8; // Tom mais grave
  speech.rate = 0.9; // Velocidade mais lenta
  speechSynthesis.speak(speech);
};

// Configuração Three.js
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
document.getElementById("quantum-container").appendChild(renderer.domElement);

// Criação do holograma
const geometry = new THREE.IcosahedronGeometry(2, 15);
const material = new THREE.MeshPhongMaterial({
  color: 0x00f3ff,
  emissive: 0x0066ff,
  wireframe: true,
});
const hologram = new THREE.Mesh(geometry, material);
scene.add(hologram);

// Adicionar luz
const light = new THREE.PointLight(0xffffff, 1, 100);
light.position.set(10, 10, 10);
scene.add(light);

camera.position.z = 5;

// Sistema de Áudio Atmosférico Melhorado
class AtmosphericSound {
  constructor() {
    this.audioContext = new (window.AudioContext ||
      window.webkitAudioContext)();
    this.masterGain = this.audioContext.createGain();

    // Adiciona reverb para criar ambiente espacial
    this.convolver = this.audioContext.createConvolver();
    this.createReverb();

    // Volume inicial mais alto para ser claramente audível
    this.masterGain.gain.value = 0.5;
    this.masterGain.connect(this.audioContext.destination);

    // Arrays para controle de som
    this.oscillators = [];
    this.gains = [];
    this.lfoGains = []; // Para modulação
  }

  async createReverb() {
    // Reverb mais longo para som mais espacial
    const reverbTime = 5; // Aumentado para mais atmosfera
    const sampleRate = this.audioContext.sampleRate;
    const length = sampleRate * reverbTime;
    const impulse = this.audioContext.createBuffer(2, length, sampleRate);

    for (let channel = 0; channel < 2; channel++) {
      const impulseData = impulse.getChannelData(channel);
      for (let i = 0; i < length; i++) {
        // Decay exponencial mais suave
        impulseData[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, 4);
      }
    }

    this.convolver.buffer = impulse;
    this.convolver.connect(this.masterGain);
  }

  start() {
    // Arrays de frequências para diferentes camadas sonoras
    const oceanFrequencies = [
      // Ondas do mar (sons mais intensos)
      25.0, // Subgrave para ondas grandes
      30.87, // Ondas quebrando
      35.0, // Movimento da água
      40.0, // Espuma
      45.0, // Respingo
    ];

    const atmosphereFrequencies = [
      // Sons atmosféricos (mais etéreos)
      55.0, // Base atmosférica
      65.41, // Vento cósmico
      73.42, // Ressonância espacial
      82.41, // Harmônico celeste
      87.31, // Pulso estelar
    ];

    // Criação dos sons oceânicos (mais fortes inicialmente)
    oceanFrequencies.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();

      // Configura oscilador com forma de onda complexa
      osc.type = index % 2 === 0 ? "sine" : "triangle";
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

      // LFO mais intenso para simular ondas
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(
        0.2 + index * 0.1,
        this.audioContext.currentTime
      );
      lfoGain.gain.setValueAtTime(0.3, this.audioContext.currentTime);

      // Volume inicial mais alto para sons oceânicos
      gain.gain.setValueAtTime(0.15, this.audioContext.currentTime);

      // Conexões
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(gain);
      gain.connect(this.convolver);

      osc.start();
      lfo.start();

      this.oscillators.push(osc);
      this.gains.push(gain);
      this.lfoGains.push(lfoGain);
    });

    // Criação dos sons atmosféricos (começam mais suaves)
    atmosphereFrequencies.forEach((freq, index) => {
      const osc = this.audioContext.createOscillator();
      const gain = this.audioContext.createGain();
      const lfo = this.audioContext.createOscillator();
      const lfoGain = this.audioContext.createGain();

      // Sons mais suaves para atmosfera
      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);

      // LFO mais lento para movimento atmosférico
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(
        0.05 + index * 0.03,
        this.audioContext.currentTime
      );
      lfoGain.gain.setValueAtTime(0.1, this.audioContext.currentTime);

      // Volume inicial baixo para sons atmosféricos
      gain.gain.setValueAtTime(0.05, this.audioContext.currentTime);

      // Conexões
      lfo.connect(lfoGain);
      lfoGain.connect(gain.gain);
      osc.connect(gain);
      gain.connect(this.convolver);

      osc.start();
      lfo.start();

      this.oscillators.push(osc);
      this.gains.push(gain);
      this.lfoGains.push(lfoGain);
    });
  }

  updateFrequency(velocidade) {
    const baseMultiplier = velocidade;
    const numOceanSounds = 5; // Número de sons oceânicos

    this.oscillators.forEach((osc, index) => {
      // Diferentes comportamentos para sons oceânicos e atmosféricos
      if (index < numOceanSounds) {
        // Sons oceânicos: diminuem com a velocidade
        const newFreq = (25.0 + index * 5) * baseMultiplier;
        const newVolume = Math.max(0.02, 0.15 / baseMultiplier);

        osc.frequency.exponentialRampToValueAtTime(
          Math.min(newFreq, 150),
          this.audioContext.currentTime + 0.5
        );

        this.gains[index].gain.exponentialRampToValueAtTime(
          newVolume,
          this.audioContext.currentTime + 0.5
        );
      } else {
        // Sons atmosféricos: aumentam com a velocidade
        const atmosphereIndex = index - numOceanSounds;
        const newFreq = (55.0 + atmosphereIndex * 10) * baseMultiplier;
        const newVolume = Math.min(0.2, 0.05 * baseMultiplier);

        osc.frequency.exponentialRampToValueAtTime(
          Math.min(newFreq, 300),
          this.audioContext.currentTime + 0.5
        );

        this.gains[index].gain.exponentialRampToValueAtTime(
          newVolume,
          this.audioContext.currentTime + 0.5
        );
      }
    });
  }

  stop() {
    // Fade out mais suave
    this.gains.forEach((gain) => {
      gain.gain.exponentialRampToValueAtTime(
        0.001,
        this.audioContext.currentTime + 1.0
      );
    });

    setTimeout(() => {
      this.oscillators.forEach((osc) => {
        osc.stop();
        osc.disconnect();
      });
      this.gains.forEach((gain) => gain.disconnect());
      this.lfoGains.forEach((gain) => gain.disconnect());
      this.oscillators = [];
      this.gains = [];
      this.lfoGains = [];
    }, 1000);
  }
}

let atmosphericSound = null;
let somAtivo = false;

// Variáveis de controle
let velocidadeRotacao = 0.01;
let velocidadeBase = 0.01;
const cores = [
  0x00f3ff, 0xff00ff, 0x00ff00, 0xff0000, 0xffff00, 0x00ffff, 0xff00aa,
  0x00aaff, 0xaaff00, 0xff0066,
];
let corAtual = 0;

function toggleSom() {
  const somButton = document.getElementById("somButton");
  if (!somAtivo) {
    // Mensagem de boas-vindas atualizada
    speakMessage(
      "Olá, mundo! Criado por Leonardo com IA, este modelo revela os filhos das galáxias. Aumente a velocidade e embarque nessa"
    );

    // Aguarda a mensagem terminar antes de iniciar os sons
    setTimeout(() => {
      atmosphericSound = new AtmosphericSound();
      atmosphericSound.start();
      // Inicia com velocidade 1x para garantir que o som seja audível
      velocidadeRotacao = velocidadeBase;
      atualizarVelocidadeUI();
      atmosphericSound.updateFrequency(1.0);
    }, 4000); // Aguarda 4 segundos para a mensagem terminar

    somAtivo = true;
    somButton.textContent = "Desligar Som";
    somButton.classList.add("active");
  } else {
    atmosphericSound.stop();
    somAtivo = false;
    somButton.textContent = "Ligar Som";
    somButton.classList.remove("active");
  }
}

function mudarCor() {
  corAtual = (corAtual + 1) % cores.length;
  material.color.setHex(cores[corAtual]);
  material.emissive.setHex(cores[corAtual]);
}

function aumentarVelocidade() {
  velocidadeRotacao += velocidadeBase;
  atualizarVelocidadeUI();
  if (somAtivo) {
    atmosphericSound.updateFrequency(velocidadeRotacao / velocidadeBase);
  }
}

function diminuirVelocidade() {
  velocidadeRotacao = Math.max(
    velocidadeBase,
    velocidadeRotacao - velocidadeBase
  );
  atualizarVelocidadeUI();
  if (somAtivo) {
    atmosphericSound.updateFrequency(velocidadeRotacao / velocidadeBase);
  }
}

function atualizarVelocidadeUI() {
  const velocidadeValue = document.getElementById("velocidadeValue");
  velocidadeValue.textContent = (velocidadeRotacao / velocidadeBase).toFixed(1);
}

function animate() {
  requestAnimationFrame(animate);
  hologram.rotation.x += velocidadeRotacao;
  hologram.rotation.y += velocidadeRotacao;
  renderer.render(scene, camera);
}
animate();

window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / (window.innerHeight * 0.8);
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight * 0.8);
});
