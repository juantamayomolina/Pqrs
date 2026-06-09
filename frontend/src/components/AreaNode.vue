<template>
  <div class="node-wrapper">
    <div class="node-content glass-panel" :class="{ 'is-root': !node.areaPadreId }">
      <div class="node-info" @click="toggle" style="cursor: pointer;">
        <span class="toggle-icon" v-if="hasChildren">
          {{ isOpen ? '▼' : '▶' }}
        </span>
        <span class="toggle-icon empty" v-else>•</span>
        
        <div class="node-text">
          <strong class="node-name">{{ node.nombre }}</strong>
          <span class="node-desc" v-if="node.descripcion">{{ node.descripcion }}</span>
        </div>

        <div class="node-stats">
          <span class="badge stat-badge" title="Usuarios">👤 {{ node._count?.usuarios || 0 }}</span>
          <span class="badge stat-badge" title="PQRS Asignadas">📄 {{ node._count?.pqrsAsignadas || 0 }}</span>
        </div>
      </div>

      <div class="node-actions">
        <button class="btn btn-sm action-btn add-btn" @click.stop="$emit('add-child', node)" title="Añadir Sub-área">+ Sub-área</button>
        <button class="btn btn-sm action-btn edit-btn" @click.stop="$emit('edit', node)" title="Editar">✏️</button>
        <button class="btn btn-sm action-btn delete-btn" @click.stop="$emit('delete', node)" title="Eliminar">🗑️</button>
      </div>
    </div>

    <!-- Recursive children rendering -->
    <ul v-show="isOpen" v-if="hasChildren" class="children-list">
      <li v-for="child in node.children" :key="child.id">
        <AreaNode 
          :node="child" 
          :all-areas="allAreas"
          @add-child="$emit('add-child', $event)"
          @edit="$emit('edit', $event)"
          @delete="$emit('delete', $event)"
        />
      </li>
    </ul>
  </div>
</template>

<script setup>
import { ref, computed } from 'vue';

const props = defineProps({
  node: Object,
  allAreas: Array
});

const emit = defineEmits(['add-child', 'edit', 'delete']);

const isOpen = ref(true);

const hasChildren = computed(() => {
  return props.node.children && props.node.children.length > 0;
});

const toggle = () => {
  if (hasChildren.value) {
    isOpen.value = !isOpen.value;
  }
};
</script>

<style scoped>
.node-wrapper {
  margin-bottom: 0.5rem;
}

.node-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.8rem 1rem;
  background: white;
  border-radius: 6px;
  border-left: 4px solid #cbd5e1;
  transition: all 0.2s;
}

.node-content.is-root {
  border-left: 4px solid var(--primary-color);
  background: #f8fafc;
}

.node-content:hover {
  box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);
  transform: translateY(-1px);
}

.node-info {
  display: flex;
  align-items: center;
  flex: 1;
  gap: 1rem;
}

.toggle-icon {
  width: 20px;
  text-align: center;
  color: #64748b;
  font-size: 0.8rem;
  font-weight: bold;
}

.toggle-icon.empty {
  color: #cbd5e1;
}

.node-text {
  display: flex;
  flex-direction: column;
}

.node-name {
  color: #0f172a;
  font-size: 1.05rem;
}

.node-desc {
  font-size: 0.85rem;
  color: #64748b;
  margin-top: 0.2rem;
}

.node-stats {
  display: flex;
  gap: 0.5rem;
  margin-left: 1.5rem;
}

.stat-badge {
  background: #f1f5f9;
  border: 1px solid #e2e8f0;
  color: #475569;
  font-size: 0.75rem;
  padding: 0.1rem 0.4rem;
}

.node-actions {
  display: flex;
  gap: 0.5rem;
  opacity: 0.6;
  transition: opacity 0.2s;
}

.node-content:hover .node-actions {
  opacity: 1;
}

.action-btn {
  padding: 0.3rem 0.6rem;
  font-size: 0.85rem;
}

.add-btn {
  background: #e0f2fe;
  color: #0284c7;
  border: 1px solid #bae6fd;
}

.add-btn:hover {
  background: #bae6fd;
}

.edit-btn {
  background: #fef3c7;
  border: 1px solid #fde68a;
}

.delete-btn {
  background: #fee2e2;
  border: 1px solid #fecaca;
}

.children-list {
  list-style: none;
  padding-left: 2rem;
  margin-top: 0.5rem;
  border-left: 1px dashed #cbd5e1;
  margin-left: 1rem;
}
</style>
