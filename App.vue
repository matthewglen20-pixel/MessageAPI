<template>
  <DialogTwo ref="dialog" />
  <v-btn color="primary" variant="tonal" @click="open()">ClICK ME</v-btn>
</template>
<script setup>
import { ref } from "vue";
import DialogTwo from "./components/DialogTwo.vue";

let dialog = ref(null);

function open() {
  dialog.value.open2();
  console.log("button was clicked");
}
</script>
