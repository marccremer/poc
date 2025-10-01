<template>
    <v-container>
        <v-row>
            <v-col>
                <h1>Web Worker Example</h1>
                <p>Input {{ values }}</p>
                <p>server{{ values }}</p>
                <p>Mean: {{ mean }}</p>
            </v-col>
        </v-row>
    </v-container>
</template>

<script setup lang="ts">
const values = reactive([1, 2, 3, 4, 5])
const mean = ref<number | null>(null)


</script>
