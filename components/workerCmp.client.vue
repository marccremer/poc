<template>
    <v-container>
        <v-row>
            <v-col>
                <h1>Web Worker Example</h1>
                <p>Input {{ values }}</p>
                <p>client</p>
                <p>Mean: {{ mean }}</p>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
import { createDispatcher } from '~/shared/package'
import MyWorker from '../shared/worker?worker&inline'
import type { WorkerEventMap } from '../shared/worker'
const values = reactive([1, 2, 3, 4, 5])
const mean = ref<number | null>(null)
const baseWorker = new MyWorker()
const worker = createDispatcher<WorkerEventMap>(baseWorker)
mean.value = await worker.add(2, 10)
</script>
