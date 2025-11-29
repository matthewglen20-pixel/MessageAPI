<template>
  <v-dialog v-model="isOpen" max-width="400">
    <v-card class="border-light-blue">
      <v-card-text class="text-h5 text-center justify-center pa-8">
        Please login or create an account to access messages!
      </v-card-text>
      <v-card-actions class="d-flex justify-space-between">
        <v-btn
          class="mx=1"
          title="openCreateAccount"
          color="primary"
          variant="tonal"
          @click="openSignup"
        >
          Create AN Account
        </v-btn>

        <v-btn
          class="mx=1"
          title="openLogIn"
          color="primary"
          variant="tonal"
          @click="openLogin"
        >
          Log Into Account
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
  <DialogOne ref="dialogOneRef" />
  <DialogTwo ref="dialogTwoRef" />
</template>

<script setup>
import { ref } from "vue";
import DialogOne from "./DialogOne.vue";
import DialogTwo from "./DialogTwo.vue";

const isOpen = ref(false);
const dialogOneRef = ref(null);
const dialogTwoRef = ref(null);

const emit = defineEmits(["login", "signup"]);

function open() {
  isOpen.value = true;
}

function close() {
  isOpen.value = false;
}

function openLogin() {
  close();
  dialogOneRef.value?.open();
}

function openSignup() {
  close();
  dialogTwoRef.value?.open();
}

defineExpose({
  open,
  close,
});
</script>

<style scoped>
@import "./DialogUtils.css";
</style>
