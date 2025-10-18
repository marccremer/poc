<template>
  <v-layout class="rounded rounded-md border">
    <v-app-bar title="Web Worker via RPC"></v-app-bar>

    <v-navigation-drawer>
      <v-list nav>
        <v-list-item v-for="link in linkks" :title="link.title" link :href="link.href"></v-list-item>
      </v-list>
    </v-navigation-drawer>

    <v-main class="d-flex align-center justify-center">
      <v-container>
        <h1>Beispiel mit nur Hauptthread</h1>
        <v-sheet>

          <MandelCanvas></MandelCanvas>
        </v-sheet>
      </v-container>
    </v-main>
  </v-layout>
</template>
<script setup lang="ts">
const linkks = [
  { title: 'Worker Beispiel', href: 'http://localhost:3000/' },
  { title: 'Ohne Worker', href: 'http://localhost:3000/single' },
]
</script>
