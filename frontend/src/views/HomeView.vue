<template>
  <div class="home-view">
    <div class="glass-panel text-center animate-fade-in" style="max-width: 800px; margin: 0 auto; margin-top: 2rem;">
      <h1 class="title">Plataforma Inteligente de PQRS</h1>
      <p class="subtitle text-muted">Alineado a la Ley 1755 de 2015 del Territorio Colombiano</p>
      
      <div class="hero-content mt-4 mb-4">
        <p>Radique sus Peticiones, Quejas, Reclamos o Sugerencias ante cualquier entidad u organismo de manera rápida y transparente. Obtenga un radicado oficial con asignación de tiempos legales automatizada.</p>
      </div>

      <div class="actions flex justify-center gap-4 mt-4">
        <router-link to="/radicar" class="btn btn-primary" style="font-size: 1.1rem; padding: 1.1rem 2.2rem;">
          <span style="margin-right: 0.5rem">✍️</span> Radicar Nueva PQRS
        </router-link>
        <router-link to="/consultar" class="btn btn-outline" style="font-size: 1.1rem; padding: 1.1rem 2.2rem;">
          <span style="margin-right: 0.5rem">🔍</span> Consultar Estado
        </router-link>
      </div>
    </div>
  </div>
</template>

<style scoped>
.subtitle {
  font-size: 1.25rem;
  font-weight: 500;
}
.hero-content {
  font-size: 1.1rem;
  line-height: 1.8;
}
</style>
