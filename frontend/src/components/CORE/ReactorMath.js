// Gera partículas do anel externo 3D usando distribuição de Fibonacci para uniformidade total
export const generateParticles3D = (count) => {
  const arr = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;
  
  for (let i = 0; i < count; i++) {
    // Ângulos de Fibonacci para distribuição uniforme na esfera
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = 2 * Math.PI * i / goldenRatio;
    
    const baseRadius = 60 + Math.random() * 65; 
    
    const x3d = baseRadius * Math.sin(phi) * Math.cos(theta);
    const y3d = baseRadius * Math.sin(phi) * Math.sin(theta);
    const z3d = baseRadius * Math.cos(phi);
    
    // Randomizamos o ângulo inicial para evitar que a estrutura de Fibonacci seja óbvia
    const currentAngle = Math.random() * Math.PI * 2;
    const orbitSpeed = (0.01 + Math.random() * 0.02) * (Math.random() > 0.5 ? 1 : -1);
    const size = 0.8 + Math.random() * 1.6;
    const phase = Math.random() * Math.PI * 2;
    const reactiveFactor = 0.5 + Math.random() * 0.8;
    
    arr.push({ x3d, y3d, z3d, baseRadius, orbitSpeed, size, phase, reactiveFactor, currentAngle, isCore: false });
  }
  return arr;
};

// Gera partículas para a esfera do núcleo central 3D usando Fibonacci
export const generateCoreParticles3D = (count, radius) => {
  const arr = [];
  const goldenRatio = (1 + Math.sqrt(5)) / 2;

  for (let i = 0; i < count; i++) {
    const phi = Math.acos(1 - 2 * (i + 0.5) / count);
    const theta = 2 * Math.PI * i / goldenRatio;
    
    const x3d = radius * Math.sin(phi) * Math.cos(theta);
    const y3d = radius * Math.sin(phi) * Math.sin(theta);
    const z3d = radius * Math.cos(phi);
    
    const currentAngle = Math.random() * Math.PI * 2;
    const orbitSpeed = 0.015; // Velocidade fixa para o núcleo girar em uníssono
    const size = 1.0 + Math.random() * 0.6;
    const phase = Math.random() * Math.PI * 2;
    
    arr.push({ x3d, y3d, z3d, orbitSpeed, size, phase, reactiveFactor: 0.1, currentAngle, isCore: true });
  }
  return arr;
};
