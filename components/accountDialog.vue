<template>
  <v-dialog v-model="dialog" transition="dialog-transition" max-width="400">
    <v-card class="border-light-blue" prepend-icon="mdi-account-circle" title="Account Information">
      <v-card-text>
        <v-list-item class="mb-2">
          <v-list-item-title class="text-h6">
            Welcome, {{ currentUser?.name }}
          </v-list-item-title>
          <v-list-item-subtitle>
            Email: {{ currentUser?.email }}
          </v-list-item-subtitle>
        </v-list-item>
      </v-card-text>

      <v-divider />

      <v-card-actions>
        <v-btn text="Close" @click="close" />
        <v-spacer />
        <v-btn color="red-darken-2" variant="tonal" @click="handleSignOut">
          Sign Out <v-icon end>mdi-logout</v-icon>
        </v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script setup>
import { ref } from "vue";
import { useAuth } from "../composables/useAuth.js";

const dialog = ref(false);

const { currentUser, clearSession, fetchCurrentUser } = useAuth();

function open() {
  dialog.value = true;
}

function close() {
  dialog.value = false;
}

async function handleSignOut() {
  clearSession();

  await fetchCurrentUser();

  close();
}

defineExpose({
  open,
  close,
});
</script>

<style>
@import "./DialogUtils.css";
</style>

